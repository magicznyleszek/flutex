import { Stack, Text } from '@mantine/core'
import type { JSX } from 'react'

import { getFingering, type Instrument } from '../data/instruments'
import { cx } from '../lib/css'
import type { TrainerStatus } from '../lib/trainer'
import { FluteDiagram } from './FluteDiagram'
import * as classes from './NoteSequence.module.css'
import { DEMO_META, STATUS_META } from './status'

export interface NoteSequenceProps {
  /** Needed here rather than passed through, because each column draws its own fingering. */
  instrument: Instrument
  previous: string | null
  target: string | null
  /** The notes after the target, oldest first. Only the first three are drawn. */
  upcoming: readonly (string | null)[]
  status: TrainerStatus
  /** Playback is running, so the caption describes that instead of `status`. */
  demo?: boolean
}

interface NoteColumnProps {
  instrument: Instrument
  note: string | null
  caption: string
  /** A neighbour: same-size chart with no chrome, dimmed, and a smaller name. */
  quiet?: boolean
  /** Two or three notes away. Dimmer again, so the row reads as a queue. */
  distant?: boolean
  /** Dropped on a phone, where five charts do not fit. */
  phoneHidden?: boolean
  /** A CSS colour for the name, or undefined to leave it at the card's own text colour. */
  nameColor?: string
}

function NoteColumn({
  instrument,
  note,
  caption,
  quiet = false,
  distant = false,
  phoneHidden = false,
  nameColor,
}: NoteColumnProps): JSX.Element {
  return (
    <div
      className={cx(
        classes.column,
        quiet && classes.quiet,
        distant && classes.distant,
        phoneHidden && classes.phoneHidden,
      )}
    >
      <div className={classes.chart}>
        <FluteDiagram instrument={instrument} note={note} bare={quiet} />
      </div>

      {/* `lh={1}` or the default adds 10px of empty space under the middle name and breaks the row the
          columns align on. Charts are one size, so name size and dimming mark out the note to play. */}
      <Text fw={700} fz={quiet ? { base: 18, sm: 22 } : { base: 26, sm: 32 }} lh={1} c={nameColor}>
        {note ?? '–'}
      </Text>

      {/* On a phone the order, size and dimming already say which column is which, and the row saves 23px.
          All three hide together or it goes lopsided. */}
      <Text size="xs" c="dimmed" visibleFrom="sm">{caption}</Text>
    </div>
  )
}

/**
 * One caption per lookahead column, and the length decides how many get drawn. Keep it at `LOOKAHEAD` in
 * `trainer.ts`: a fourth entry draws an empty chart the engine never fills.
 */
const UPCOMING_CAPTIONS = ['next', '+2', '+3']

export function NoteSequence({
  instrument,
  previous,
  target,
  upcoming,
  status,
  demo = false,
}: NoteSequenceProps): JSX.Element {
  const meta = demo ? DEMO_META : STATUS_META[status]

  // `waiting`'s quiet grey is the wrong colour for the largest type on screen, so the name keeps the card's
  // own. Every other status just happened, and colour reads faster than the label.
  const nameColor = !demo && status === 'waiting' ? undefined : meta.color

  // What the chart cannot draw: the register, or a half-covered hole. Only the played note shows it.
  const hint = target === null ? undefined : getFingering(instrument, target)?.hint

  return (
    <Stack align="center" gap="xs">
      {/* Three notes of lookahead, a fingering you see coming being one you can start moving towards. The
          note just played earns a slot too, and is first to go on a phone. */}
      <div className={classes.row}>
        <NoteColumn
          instrument={instrument}
          note={previous}
          caption="previous"
          quiet
          phoneHidden
        />
        <NoteColumn
          instrument={instrument}
          note={target}
          caption="now"
          nameColor={nameColor}
        />
        {UPCOMING_CAPTIONS.map((caption, step) => (
          <NoteColumn
            key={caption}
            instrument={instrument}
            note={upcoming[step] ?? null}
            caption={caption}
            quiet
            distant={step > 0}
          />
        ))}
      </div>

      {/* Under the whole row, not under the chart it belongs to: inside the column it widened that column,
          and a centred flex row answers by shoving every other chart sideways. The slot keeps its height
          either way, so it fills and empties without moving anything. */}
      <Text size="xs" c="dimmed" ta="center" className={classes.hint}>{hint}</Text>

      <Text size="sm" c={meta.color} fw={600}>{meta.label}</Text>
      {/* A prose expansion of the status label right above it, so phones drop it. */}
      <Text size="xs" c="dimmed" ta="center" visibleFrom="sm">{meta.hint}</Text>
    </Stack>
  )
}
