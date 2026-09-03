// Wait-and-proceed state machine: hold the right note long enough and it advances. No React and no
// Web Audio in here, so tests can step it frame by frame. The config lives inside the engine, or the
// animation loop would close over a stale tolerance or penalty mode.

/** Where a filled mistake bar sends the player: nowhere, back `backSteps` notes, or to 0. */
export type PenaltyMode = 'wait' | 'back' | 'restart'

export type TrainerStatus =
  | 'waiting'
  | 'holding'
  /** Forced pause after a hit or a penalty. */
  | 'cooldown'
  /** The next note repeats this one, so the sound has to be broken first. */
  | 'release'
  /** Some other note is sounding. Silence counts as `waiting`, not this. */
  | 'wrong'
  | 'finished'

/** One frame of microphone input, already translated into musical terms. */
export interface TrainerFrame {
  /** The recognised note, or null on silence. Only the null-ness matters — see `isOnTarget`. */
  note: string | null
  /** Deviation from the *target* note in cents, however far away that is. */
  cents: number
}

export interface TrainerOptions {
  toleranceCents: number
  penaltyMode: PenaltyMode
  holdFrames: number
  /** Frames of wrong playing that fill the mistake bar. */
  mistakeLimitFrames: number
  /** Forced pause after a hit. */
  cooldownFrames: number
  /** Forced pause after a penalty, longer than after a hit so the player can catch up. */
  penaltyCooldownFrames: number
  /** How many notes the "back" mode rewinds. */
  backSteps: number
  /**
   * Frames of not-wrong playing that end a run of wrong ones. More than one, since the detector drops the odd
   * frame mid-note and a single-frame gap would count one held note twice.
   */
  wrongResetFrames: number
}

/** How far ahead the snapshot reads, so the UI can show what is coming, not just what is next. */
export const LOOKAHEAD = 3

export interface NoteWindow {
  previous: string | null
  target: string | null
  /** The next `LOOKAHEAD` notes, padded with nulls at the end so the slots never shift about. */
  upcoming: readonly (string | null)[]
}

/**
 * The stretch of song the note row draws: one behind, the one to play, and the lookahead. Exported because
 * playback lays out the same row from its own position, and two ideas of "next" would drift.
 */
export function noteWindow(song: readonly string[], index: number): NoteWindow {
  const at = (position: number): string | null => song[position] ?? null

  return {
    previous: at(index - 1),
    target: at(index),
    upcoming: Array.from({ length: LOOKAHEAD }, (_, step) => at(index + step + 1)),
  }
}

export interface TrainerSnapshot extends NoteWindow {
  index: number
  /** 0-1, fill level of the hold bar. */
  holdProgress: number
  /** 0-1, fill level of the mistake bar. */
  mistakeProgress: number
  status: TrainerStatus
  finished: boolean
  /** One per sustained wrong note, not one per wrong frame. */
  mistakes: number
  /** Notes completed in this run. */
  hits: number
  total: number
}

export interface TrainerEngine {
  step(frame: TrainerFrame): TrainerSnapshot
  snapshot(): TrainerSnapshot
  reset(): TrainerSnapshot
  loadSong(notes: readonly string[]): TrainerSnapshot
  configure(options: Partial<TrainerOptions>): void
}

export const DEFAULT_TRAINER_OPTIONS: TrainerOptions = {
  toleranceCents: 25,
  penaltyMode: 'wait',
  holdFrames: 15,
  mistakeLimitFrames: 30,
  cooldownFrames: 20,
  penaltyCooldownFrames: 30,
  backSteps: 3,
  // 50ms at 60fps: long enough to ride out a dropped frame, short enough that a real correction reads as one.
  wrongResetFrames: 3,
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/** Call `step` once per audio frame. Every `*Frames` option is counted in those frames. */
export function createTrainerEngine(
  notes: readonly string[],
  options: Partial<TrainerOptions> = {},
): TrainerEngine {
  let song: readonly string[] = notes
  let config: TrainerOptions = { ...DEFAULT_TRAINER_OPTIONS, ...options }

  let index = 0
  let holdFrames = 0
  let mistakeFrames = 0
  let cooldownLeft = 0
  let awaitingRelease = false
  /** Whether the wrong note now sounding has already been counted. See `registerPenalty`. */
  let wrongCounted = false
  /** Frames since the wrong playing stopped, against `wrongResetFrames`. */
  let recoveredFrames = 0
  let finished = false
  let mistakes = 0
  let hits = 0
  let status: TrainerStatus = 'waiting'

  const noteAt = (position: number): string | null => song[position] ?? null

  /**
   * Scored on cents from the target, not on which semitone the pitch is nearest: a whistle 70 cents sharp is
   * named as the semitone above, and correct fingering should not be called wrong. `note` only says whether
   * anything is sounding — silence arrives as 0 cents and would score as a hit.
   */
  const isOnTarget = (frame: TrainerFrame): boolean =>
    noteAt(index) !== null
    && frame.note !== null
    && Math.abs(frame.cents) <= config.toleranceCents

  const snapshot = (): TrainerSnapshot => {
    const around = noteWindow(song, index)

    return {
      ...around,
      index,
      // Nothing left to play, though the row still shows the note the song ended on.
      target: finished ? null : around.target,
      holdProgress: clamp01(holdFrames / config.holdFrames),
      mistakeProgress: clamp01(mistakeFrames / config.mistakeLimitFrames),
      status,
      finished,
      mistakes,
      hits,
      total: song.length,
    }
  }

  const clearCounters = (): void => {
    holdFrames = 0
    mistakeFrames = 0
    wrongCounted = false
    recoveredFrames = 0
  }

  const reset = (): TrainerSnapshot => {
    index = 0
    cooldownLeft = 0
    awaitingRelease = false
    finished = song.length === 0
    mistakes = 0
    hits = 0
    status = finished ? 'finished' : 'waiting'
    clearCounters()
    return snapshot()
  }

  const goTo = (position: number, cooldown: number): void => {
    const previousNote = noteAt(index)
    index = Math.max(0, Math.min(position, Math.max(0, song.length - 1)))
    cooldownLeft = cooldown
    // Landing back on the same note needs a real re-articulation, not just a wait.
    awaitingRelease = previousNote !== null && noteAt(index) === previousNote
    status = cooldown > 0 ? 'cooldown' : 'waiting'
  }

  const registerHit = (): void => {
    hits += 1
    clearCounters()

    if (index + 1 >= song.length) {
      finished = true
      status = 'finished'
      cooldownLeft = 0
      awaitingRelease = false
      return
    }

    goTo(index + 1, config.cooldownFrames)
  }

  const registerPenalty = (): void => {
    if (config.penaltyMode === 'wait') {
      // The index does not move and the bar stays pinned full until the wrong note stops. Every frame after
      // this one crosses the threshold too, so without the flag one held note would count on each.
      if (!wrongCounted) mistakes += 1
      wrongCounted = true
      mistakeFrames = config.mistakeLimitFrames
      holdFrames = 0
      status = 'wrong'
      return
    }

    mistakes += 1
    clearCounters()
    const destination = config.penaltyMode === 'back' ? index - config.backSteps : 0
    goTo(destination, config.penaltyCooldownFrames)
    // A penalty always demands a release, even when the destination note differs.
    awaitingRelease = true
  }

  const step = (frame: TrainerFrame): TrainerSnapshot => {
    if (finished) {
      status = 'finished'
      return snapshot()
    }

    if (cooldownLeft > 0) {
      cooldownLeft -= 1
      status = 'cooldown'
      return snapshot()
    }

    if (awaitingRelease) {
      // The same test as scoring, or a wide tolerance would call a sustained note released and score it again
      // on the very next frame. The frame that breaks the sound still counts below.
      if (isOnTarget(frame)) {
        status = 'release'
        return snapshot()
      }
      awaitingRelease = false
    }

    if (isOnTarget(frame)) {
      holdFrames += 1
      mistakeFrames = Math.max(0, mistakeFrames - 1)
      status = 'holding'
    } else if (frame.note !== null) {
      // Half a frame lost against a full one gained, so a wobble in intonation does not wipe the hold.
      holdFrames = Math.max(0, holdFrames - 0.5)
      mistakeFrames += 0.5
      status = 'wrong'
    } else {
      holdFrames = Math.max(0, holdFrames - 0.5)
      mistakeFrames = Math.max(0, mistakeFrames - 0.5)
      status = 'waiting'
    }

    // Playing the right note or stopping ends the run, so the next fill is a fresh mistake — but not on the
    // first frame of it. A dropped frame mid-note used to end the run there, and the next frame counted a
    // second mistake for the same held note.
    if (status === 'wrong') {
      recoveredFrames = 0
    } else {
      recoveredFrames += 1
      if (recoveredFrames >= config.wrongResetFrames) wrongCounted = false
    }

    // A finished hold wins when both bars fill on the same frame.
    if (holdFrames >= config.holdFrames) {
      registerHit()
    } else if (mistakeFrames >= config.mistakeLimitFrames) {
      registerPenalty()
    }

    return snapshot()
  }

  const loadSong = (nextNotes: readonly string[]): TrainerSnapshot => {
    song = nextNotes
    return reset()
  }

  const configure = (next: Partial<TrainerOptions>): void => {
    config = { ...config, ...next }
  }

  finished = song.length === 0
  status = finished ? 'finished' : 'waiting'

  return { step, snapshot, reset, loadSong, configure }
}
