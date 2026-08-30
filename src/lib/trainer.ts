// The "wait-and-proceed" trainer state machine: it waits until the player
// holds the right note long enough, then moves on to the next one.
//
// This is deliberately pure logic, with no React and no Web Audio:
//  - it can be tested frame by frame, deterministically,
//  - the configuration lives inside the engine, so the animation loop cannot
//    close over a stale tolerance or penalty mode (that was a real bug).

export type PenaltyMode = 'wait' | 'back' | 'restart'

export type TrainerStatus =
  /** Waiting for a sound. */
  | 'waiting'
  /** The player is holding the right note; the progress bar is filling. */
  | 'holding'
  /** Forced pause after a hit or a penalty. */
  | 'cooldown'
  /** The sound must be broken, because the next note is the same one. */
  | 'release'
  /** The player is playing something else; the mistake bar is filling. */
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
  /** How many frames the note must be held to count. */
  holdFrames: number
  /** How many frames of wrong playing fill the penalty bar. */
  mistakeLimitFrames: number
  /** Forced pause after a hit. */
  cooldownFrames: number
  /** Forced pause after a penalty — longer, so the player can catch up. */
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
  /** Number of penalties triggered in this run. */
  mistakes: number
  /** Number of notes completed in this run. */
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
    // If the jump lands back on the same note, waiting out the frames is not
    // enough — the player has to physically stop and re-articulate.
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
      // No penalty: the bar stays full as a "you are playing the wrong note"
      // signal, but is not cleared — it decays once the player gets it right.
      mistakeFrames = config.mistakeLimitFrames
      holdFrames = 0
      status = 'wrong'
      return
    }

    clearCounters()
    const destination = config.penaltyMode === 'back' ? index - config.backSteps : 0
    goTo(destination, config.penaltyCooldownFrames)
    // After a penalty we always require a release, so the penalty is felt.
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
      // A wrong note costs less than a right one gains, so a momentary wobble
      // in intonation does not wipe out all the progress.
      holdFrames = Math.max(0, holdFrames - 0.5)
      mistakeFrames += 0.5
      status = 'wrong'
    } else {
      holdFrames = Math.max(0, holdFrames - 0.5)
      mistakeFrames = Math.max(0, mistakeFrames - 0.5)
      status = 'waiting'
    }

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
