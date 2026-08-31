import type { PenaltyMode } from '../lib/trainer'

/** Persisted in localStorage, so renaming a member drops the saved difficulty. */
export type DifficultyId = 'beginner' | 'forgiving' | 'loose' | 'normal' | 'strict'

export interface DifficultyLevel {
  id: DifficultyId
  label: string
  description: string
  /** Allowed deviation from the target note in cents (100 cents = a semitone). */
  toleranceCents: number
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyLevel> = {
  beginner: {
    id: 'beginner',
    label: 'Beginner (±100 cents)',
    description: 'A whole semitone either way, so a badly tuned instrument still counts.',
    toleranceCents: 100,
  },
  forgiving: {
    id: 'forgiving',
    label: 'Forgiving (±75 cents)',
    description: 'For a whistle or a cheap recorder that plays sharp or flat all over.',
    toleranceCents: 75,
  },
  loose: {
    id: 'loose',
    label: 'Easy (±50 cents)',
    description: 'Only the note matters, not the tuning. Good for a first pass.',
    toleranceCents: 50,
  },
  normal: {
    id: 'normal',
    label: 'Normal (±25 cents)',
    description: 'You have to hit the note and roughly hit the pitch.',
    toleranceCents: 25,
  },
  strict: {
    id: 'strict',
    label: 'Hard (±10 cents)',
    description: 'Demands steady breath — that much is enough to sound out of tune.',
    toleranceCents: 10,
  },
}

/** Widest window first, so the list reads as one ladder from easiest to hardest. */
export const DIFFICULTY_LIST: readonly DifficultyLevel[] = [
  DIFFICULTIES.beginner,
  DIFFICULTIES.forgiving,
  DIFFICULTIES.loose,
  DIFFICULTIES.normal,
  DIFFICULTIES.strict,
]

export const DEFAULT_DIFFICULTY_ID: DifficultyId = 'normal'

/*
 * Not `Object.hasOwn`: it is a 2022 built-in Safari only shipped in 15.4, and Parcel transpiles
 * syntax without polyfilling built-ins, so on an older phone this threw a TypeError the moment the
 * select changed. Plain `in` is no substitute either — it would accept inherited keys like
 * "toString" out of localStorage and hand back a function as a difficulty.
 */
export function isDifficultyId(value: string): value is DifficultyId {
  return Object.prototype.hasOwnProperty.call(DIFFICULTIES, value)
}

export interface PenaltyOption {
  id: PenaltyMode
  label: string
  description: string
}

export const PENALTIES: Record<PenaltyMode, PenaltyOption> = {
  wait: {
    id: 'wait',
    label: 'None — wait it out',
    description: 'A mistake costs nothing. The trainer simply waits for the right note.',
  },
  back: {
    id: 'back',
    label: 'Go back 3 notes',
    description: 'Playing wrong for a while sends you a little way back.',
  },
  restart: {
    id: 'restart',
    label: 'Start over',
    description: 'Playing wrong for a while restarts the song.',
  },
}

export const PENALTY_LIST: readonly PenaltyOption[] = [
  PENALTIES.wait,
  PENALTIES.back,
  PENALTIES.restart,
]

export const DEFAULT_PENALTY_MODE: PenaltyMode = 'wait'

/** Not `Object.hasOwn`, for the Safari reason spelled out above `isDifficultyId`. */
export function isPenaltyMode(value: string): value is PenaltyMode {
  return Object.prototype.hasOwnProperty.call(PENALTIES, value)
}
