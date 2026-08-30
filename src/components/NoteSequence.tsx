import { Stack, Text } from '@mantine/core'
import type { JSX } from 'react'

import type { Instrument } from '../data/instruments'
import { cx } from '../lib/css'
import { beatsToGlyph } from '../lib/music'
import type { TrainerStatus } from '../lib/trainer'
import { FluteDiagram } from './FluteDiagram'
import * as classes from './NoteSequence.module.css'
import { STATUS_META } from './status'

export interface NoteSequenceProps {
  /** Needed here rather than passed through, because each column draws its own fingering. */
  instrument: Instrument
  previous: string | null
  target: string | null
  next: string | null
  /** Length of the target note in beats — a rhythmic hint, nothing more. */
  targetBeats: number | null
  status: TrainerStatus
}

interface NoteColumnProps {
  instrument: Instrument
  note: string | null
  caption: string
  /** A neighbour: same-size chart with no chrome, dimmed, and a smaller name. */
  quiet?: boolean
  /** A CSS colour for the name, or undefined to leave it at the card's own text colour. */
  nameColor?: string
}

function NoteColumn({
  instrument,
  note,
  caption,
  quiet = false,
  nameColor,
}: NoteColumnProps): JSX.Element {
  return (
    <div className={cx(classes.column, quiet && classes.quiet)}>
      <div className={classes.chart}>
        <FluteDiagram instrument={instrument} note={note} bare={quiet} />
      </div>

      {/* `lh={1}` because the default line height would add 10px of empty space under the
          middle name and break the row the columns are aligned on. The neighbours stay
          smaller: the charts are all one size now, so the name is what carries the
          hierarchy alongside the dimming. */}
      <Text fw={700} fz={quiet ? { base: 18, sm: 22 } : { base: 26, sm: 32 }} lh={1} c={nameColor}>
        {note ?? '–'}
      </Text>

      {/* On a phone the left-to-right order, the size and the dimming already say which
          column is which, and the row saves 23px. All three hide together or it goes
          lopsided. */}
      <Text size="xs" c="dimmed" visibleFrom="sm">{caption}</Text>
    </div>
  )
}

export function NoteSequence({
  instrument,
  previous,
  target,
  next,
  targetBeats,
  status,
}: NoteSequenceProps): JSX.Element {
  const meta = STATUS_META[status]

  // `waiting` is a deliberately quiet grey, which is the wrong colour for the largest type
  // on the screen — so while waiting the name stays at the card's text colour. Every other
  // status is something that just happened, and colouring the name is the fastest way to
  // catch it without reading the label.
  const nameColor = status === 'waiting' ? undefined : meta.color

  return (
    <Stack align="center" gap="xs">
      <div className={classes.row}>
        <NoteColumn instrument={instrument} note={previous} caption="previous" quiet />
        <NoteColumn
          instrument={instrument}
          note={target}
          caption="now"
          nameColor={nameColor}
        />
        <NoteColumn instrument={instrument} note={next} caption="next" quiet />
      </div>

      <Text size="sm" c={meta.color} fw={600}>
        {meta.label}
        {targetBeats !== null && ` · ${beatsToGlyph(targetBeats)}`}
      </Text>
      {/* A prose expansion of the status label right above it, so phones drop it. */}
      <Text size="xs" c="dimmed" ta="center" visibleFrom="sm">{meta.hint}</Text>
    </Stack>
  )
}
