// Wait-and-proceed state machine: hold the right note long enough and it advances to the
// next one. Pure logic with no React and no Web Audio, so tests can step it frame by
// frame. The config lives inside the engine because the animation loop would otherwise
// close over a stale tolerance or penalty mode.

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
  /**
   * The recognised note, or null on silence. Only the null-ness decides anything — see
   * `isOnTarget` for why the name itself is not what a note is scored against.
   */
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
}

/** How far ahead the snapshot reads, so the UI can show what is coming, not just what is next. */
export const LOOKAHEAD = 3

export interface NoteWindow {
  previous: string | null
  target: string | null
  /**
   * The next `LOOKAHEAD` notes, oldest first, padded with nulls at the end of the song so
   * the caller can lay out a fixed number of slots without them shifting about.
   */
  upcoming: readonly (string | null)[]
}

/**
 * The stretch of the song the note row draws: one behind, the one to play, and the lookahead.
 * Exported because playback lays out that same row from its own position, and two ideas of
 * what "next" means would drift apart by a note sooner or later.
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
  let finished = false
  let mistakes = 0
  let hits = 0
  let status: TrainerStatus = 'waiting'

  const noteAt = (position: number): string | null => song[position] ?? null

  /**
   * A note counts on cents from the target, not on which semitone the pitch is nearest. Past ±50
   * those two disagree, which is the whole point of the wide tolerances: a whistle playing 70 cents
   * sharp is named as the semitone above, and correct fingering should not be called wrong.
   *
   * `note` is only asked whether anything is sounding — silence arrives as 0 cents and would
   * otherwise score as a perfect hit.
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
      // A finished song has nothing left to play, though the row still shows the note it
      // ended on.
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
      // The index does not move. The bar is pinned full as a "wrong note" signal and decays only
      // once the wrong note stops — which also means every frame after this one crosses the
      // threshold again, so without the flag one held wrong note would count once per frame.
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
      // The frame that breaks the sound is not discarded, it still counts below. The same
      // test as scoring, or a wide tolerance would call a sustained note released and then
      // score it again on the very next frame.
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
      // Half a frame lost against a full frame gained, so a momentary wobble in
      // intonation does not wipe out the hold.
      holdFrames = Math.max(0, holdFrames - 0.5)
      mistakeFrames += 0.5
      status = 'wrong'
    } else {
      holdFrames = Math.max(0, holdFrames - 0.5)
      mistakeFrames = Math.max(0, mistakeFrames - 0.5)
      status = 'waiting'
    }

    // Playing the right note or stopping ends the run of wrong playing, so the next time the bar
    // fills it is a fresh mistake.
    if (status !== 'wrong') wrongCounted = false

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
