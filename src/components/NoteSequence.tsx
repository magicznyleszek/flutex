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
 * Bubble diameter in px. The index signature is what makes this assignable to Mantine's
 * `StyleProp`, whose breakpoint object is `Partial<Record<MantineBreakpoint, T>>` with
 * `MantineBreakpoint` ending in `string & {}`. The two named keys stop `base` and `sm`
 * widening to `number | undefined` under `noUncheckedIndexedAccess`.
 */
interface BubbleSize extends Record<string, number> {
  base: number
  sm: number
}

interface BubbleProps {
  note: string | null
  caption: string
  size: BubbleSize
  /** A CSS colour for the ring, as `STATUS_META` supplies it. */
  color: string
  dimmed: boolean
}

/**
 * `w`, `h` and `fz` accept a breakpoint object, `gap` does not. Responsive style props
 * compile to media queries in a generated class, so the inline `style` below outranks
 * them and must not set width, height or font size.
 */
function Bubble({ note, caption, size, color, dimmed }: BubbleProps): JSX.Element {
  // 3.4 keeps the note name at the proportion it was tuned to at 112px.
  const fz = { base: Math.round(size.base / 3.4), sm: Math.round(size.sm / 3.4) }

  return (
    <Stack align="center" gap={6}>
      <Box
        w={size}
        h={size}
        // The neighbours sink below the card and the target rises off it, which
        // `global.css` spells out per colour scheme.
        bg={dimmed ? 'var(--flutex-sunken)' : 'var(--flutex-raised)'}
        style={{
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: dimmed ? 0.55 : 1,
        }}
      >
        <Center h="100%">
          <Text fw={700} fz={fz} c={dimmed ? 'dimmed' : undefined}>
            {note ?? '–'}
          </Text>
        </Center>
      </Box>
      {/* On a phone the left-to-right order, the size and the dimming already say which
          bubble is which, and the row saves 23px. All three hide together or it goes
          lopsided. */}
      <Text size="xs" c="dimmed" visibleFrom="sm">{caption}</Text>
    </Stack>
  )
}

/* The row is as tall as the target bubble, so only the target costs height. 96px still
   carries the note name at 28px, larger than any other type on the screen. */
const TARGET: BubbleSize = { base: 96, sm: 112 }
const NEIGHBOUR: BubbleSize = { base: 56, sm: 64 }

/** Only the target carries a status, so the neighbours take the border shade of a card. */
const QUIET_RING = 'var(--mantine-color-default-border)'

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
        <Bubble note={previous} caption="previous" size={NEIGHBOUR} color={QUIET_RING} dimmed />
        <Bubble note={target} caption="now" size={TARGET} color={meta.color} dimmed={false} />
        <Bubble note={next} caption="next" size={NEIGHBOUR} color={QUIET_RING} dimmed />
      </Group>

      <Text size="sm" c={meta.color} fw={600}>
        {meta.label}
        {targetBeats !== null && ` · ${beatsToGlyph(targetBeats)}`}
      </Text>
      {/* A prose expansion of the status label right above it, so phones drop it. */}
      <Text size="xs" c="dimmed" ta="center" visibleFrom="sm">{meta.hint}</Text>
    </Stack>
  )
}
