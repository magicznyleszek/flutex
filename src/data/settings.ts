import type { PenaltyMode } from '../lib/trainer'

export type DifficultyId = 'loose' | 'normal' | 'strict'

export interface DifficultyLevel {
  id: DifficultyId
  label: string
  description: string
  /** Allowed deviation from the target note in cents (100 cents = a semitone). */
  toleranceCents: number
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyLevel> = {
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

/** Order in the picker: from the most forgiving to the strictest. */
export const DIFFICULTY_LIST: readonly DifficultyLevel[] = [
  DIFFICULTIES.loose,
  DIFFICULTIES.normal,
  DIFFICULTIES.strict,
]

export const DEFAULT_DIFFICULTY_ID: DifficultyId = 'normal'

export function isDifficultyId(value: string): value is DifficultyId {
  return Object.hasOwn(DIFFICULTIES, value)
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

export function isPenaltyMode(value: string): value is PenaltyMode {
  return Object.hasOwn(PENALTIES, value)
}
