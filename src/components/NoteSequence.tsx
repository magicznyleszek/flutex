import { Box, Center, Group, Stack, Text } from '@mantine/core'
import type { JSX } from 'react'

import { beatsToGlyph } from '../lib/music'
import type { TrainerStatus } from '../lib/trainer'
import { STATUS_META } from './status'

export interface NoteSequenceProps {
  previous: string | null
  target: string | null
  next: string | null
  /** Length of the target note in beats — a rhythmic hint, nothing more. */
  targetBeats: number | null
  status: TrainerStatus
}

/**
 * Diameter in px, phone first. The bubbles are the tallest thing in the card.
 *
 * The index signature is what makes this assignable to Mantine's `StyleProp`: a
 * breakpoint object there is a `Partial<Record<MantineBreakpoint, …>>` and
 * `MantineBreakpoint` ends in `string & {}`, so a closed two-key interface is not
 * enough. The two named keys keep `size.base` and `size.sm` from widening to
 * `number | undefined` under `noUncheckedIndexedAccess`.
 */
interface BubbleSize extends Record<string, number> {
  base: number
  sm: number
}

interface BubbleProps {
  note: string | null
  caption: string
  size: BubbleSize
  color: string
  dimmed: boolean
}

/**
 * `w`, `h` and `fz` are three of the Box style props that do accept a breakpoint
 * object — unlike `gap`, which is not a style prop at all. They compile to
 * min-width media queries in a generated class rather than staying in the `style`
 * attribute, so anything set inline below would outrank them; the inline styles
 * here deliberately touch nothing that these three set.
 */
function Bubble({ note, caption, size, color, dimmed }: BubbleProps): JSX.Element {
  // 3.4 keeps the note name at the proportion it was tuned to at 112px.
  const fz = { base: Math.round(size.base / 3.4), sm: Math.round(size.sm / 3.4) }

  return (
    <Stack align="center" gap={6}>
      <Box
        w={size}
        h={size}
        // dark-8 is the card colour: the neighbours sink to the page shade and
        // the target rises above it, so the three read as one row of depth.
        bg={dimmed ? 'dark.9' : 'dark.7'}
        style={{
          borderRadius: '50%',
          border: `2px solid var(--mantine-color-${color.replace('.', '-')})`,
          opacity: dimmed ? 0.55 : 1,
        }}
      >
        <Center h="100%">
          <Text fw={700} fz={fz} c={dimmed ? 'dimmed' : undefined}>
            {note ?? '–'}
          </Text>
        </Center>
      </Box>
      {/* The captions are the row's cheapest 23px on a phone: which bubble is
          which is already said three times over by left-to-right order, by size,
          and by the target being the only one that is not dimmed. Only the tallest
          column's caption actually costs height, but hiding one and not the others
          would leave the row lopsided. */}
      <Text size="xs" c="dimmed" visibleFrom="sm">{caption}</Text>
    </Stack>
  )
}

/* The row is exactly as tall as the target bubble, so the neighbours are free
   vertically and only the target buys anything back. 96px still carries the note
   name at 28px, which is larger than any other type on the screen. */
const TARGET: BubbleSize = { base: 96, sm: 112 }
const NEIGHBOUR: BubbleSize = { base: 56, sm: 64 }

export function NoteSequence({
  previous,
  target,
  next,
  targetBeats,
  status,
}: NoteSequenceProps): JSX.Element {
  const meta = STATUS_META[status]

  return (
    <Stack align="center" gap="xs">
      <Group align="flex-start" gap="lg" justify="center">
        <Bubble note={previous} caption="previous" size={NEIGHBOUR} color="dark.5" dimmed />
        <Bubble note={target} caption="now" size={TARGET} color={meta.color} dimmed={false} />
        <Bubble note={next} caption="next" size={NEIGHBOUR} color="dark.5" dimmed />
      </Group>

      <Text size="sm" c={meta.color} fw={600}>
        {meta.label}
        {targetBeats !== null && ` · ${beatsToGlyph(targetBeats)}`}
      </Text>
      {/* The hint is a prose expansion of the status label directly above it, and
          on a phone "the note shown above" is not much of a direction when
          everything is above everything. The label stays, so no state is lost. */}
      <Text size="xs" c="dimmed" ta="center" visibleFrom="sm">{meta.hint}</Text>
    </Stack>
  )
}
