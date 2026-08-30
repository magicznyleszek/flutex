import type { TrainerStatus } from '../lib/trainer'

export interface StatusMeta {
  /** A colour name from the Mantine theme. */
  color: string
  label: string
  hint: string
}

/**
 * The single place where an engine status gets a colour and a description.
 * Without it every component would phrase the status its own way, and they
 * would drift apart quickly.
 */
export const STATUS_META: Record<TrainerStatus, StatusMeta> = {
  waiting: {
    // Not dark.3: NoteSequence renders this as 14px semibold body text, which
    // WCAG does not count as large, and dark.3 only reaches 4.19:1 on a card.
    // dark.2 is 6.58:1 there, and reading like the hint text suits the idle state.
    color: 'dark.2',
    label: 'Waiting',
    hint: 'Play the note shown above.',
  },
  holding: {
    color: 'accent.4',
    label: 'Hold it',
    hint: 'Good — keep the note going a moment longer.',
  },
  cooldown: {
    color: 'signal.4',
    label: 'Ease off',
    hint: 'Break the sound before the next note.',
  },
  release: {
    color: 'signal.4',
    label: 'Release',
    hint: 'The same note twice — it has to be articulated again.',
  },
  wrong: {
    color: 'alarm.4',
    label: 'Wrong note',
    hint: 'Check the fingering and your breath.',
  },
  finished: {
    color: 'accent.4',
    label: 'Done',
    hint: 'The song was played all the way through.',
  },
}
