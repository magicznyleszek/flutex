import type { TrainerStatus } from '../lib/trainer'

export interface StatusMeta {
  /**
   * A CSS colour, not a Mantine palette key. The status shows up as text on a card and as
   * a ring around the target note, and the shade that carries either one differs between
   * the colour schemes — so these point at variables `global.css` resolves per scheme.
   */
  color: string
  label: string
  hint: string
}

/** Single source for status wording and colour. */
export const STATUS_META: Record<TrainerStatus, StatusMeta> = {
  waiting: {
    // NoteSequence renders this as 14px semibold, which WCAG does not count as large, and
    // the neutral one step brighter only reaches 4.36:1 on a card. `dimmed` is 5.91:1 in
    // the dark scheme and 6.03:1 in the light one.
    color: 'var(--mantine-color-dimmed)',
    label: 'Waiting',
    hint: 'Play the note shown above.',
  },
  holding: {
    color: 'var(--flutex-accent-ink)',
    label: 'Hold it',
    hint: 'Good — keep the note going a moment longer.',
  },
  cooldown: {
    color: 'var(--flutex-signal-ink)',
    label: 'Ease off',
    hint: 'Break the sound before the next note.',
  },
  release: {
    color: 'var(--flutex-signal-ink)',
    label: 'Release',
    hint: 'The same note twice — it has to be articulated again.',
  },
  wrong: {
    color: 'var(--flutex-alarm-ink)',
    label: 'Wrong note',
    hint: 'Check the fingering and your breath.',
  },
  finished: {
    color: 'var(--flutex-accent-ink)',
    label: 'Done',
    hint: 'The song was played all the way through.',
  },
}
