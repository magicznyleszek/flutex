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
  /** The recognised note, or null on silence. */
  note: string | null
  /** Deviation from the target note in cents. */
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

export interface TrainerSnapshot {
  index: number
  target: string | null
  previous: string | null
  next: string | null
  /** 0-1, fill level of the hold bar. */
  holdProgress: number
  /** 0-1, fill level of the mistake bar. */
  mistakeProgress: number
  status: TrainerStatus
  finished: boolean
  /** Penalties triggered in this run, not wrong frames. */
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
  let finished = false
  let mistakes = 0
  let hits = 0
  let status: TrainerStatus = 'waiting'

  const noteAt = (position: number): string | null => song[position] ?? null

  const snapshot = (): TrainerSnapshot => ({
    index,
    target: finished ? null : noteAt(index),
    previous: noteAt(index - 1),
    next: noteAt(index + 1),
    holdProgress: clamp01(holdFrames / config.holdFrames),
    mistakeProgress: clamp01(mistakeFrames / config.mistakeLimitFrames),
    status,
    finished,
    mistakes,
    hits,
    total: song.length,
  })

  const clearCounters = (): void => {
    holdFrames = 0
    mistakeFrames = 0
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
    mistakes += 1

    if (config.penaltyMode === 'wait') {
      // The index does not move. The bar is pinned full as a "wrong note" signal and
      // decays only once the wrong note stops.
      mistakeFrames = config.mistakeLimitFrames
      holdFrames = 0
      status = 'wrong'
      return
    }

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
      // The frame that breaks the sound is not discarded, it still counts below.
      const target = noteAt(index)
      if (frame.note === null || frame.note !== target) {
        awaitingRelease = false
      } else {
        status = 'release'
        return snapshot()
      }
    }

    const target = noteAt(index)
    const onTarget
      = target !== null
      && frame.note === target
      && Math.abs(frame.cents) <= config.toleranceCents

    if (onTarget) {
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
