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

interface BubbleProps {
  note: string | null
  caption: string
  size: number
  color: string
  dimmed: boolean
}

function Bubble({ note, caption, size, color, dimmed }: BubbleProps): JSX.Element {
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
          <Text fw={700} fz={size / 3.4} c={dimmed ? 'dimmed' : undefined}>
            {note ?? '–'}
          </Text>
        </Center>
      </Box>
      <Text size="xs" c="dimmed">{caption}</Text>
    </Stack>
  )
}

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
        <Bubble note={previous} caption="previous" size={64} color="dark.5" dimmed />
        <Bubble note={target} caption="now" size={112} color={meta.color} dimmed={false} />
        <Bubble note={next} caption="next" size={64} color="dark.5" dimmed />
      </Group>

      <Text size="sm" c={meta.color} fw={600}>
        {meta.label}
        {targetBeats !== null && ` · ${beatsToGlyph(targetBeats)}`}
      </Text>
      <Text size="xs" c="dimmed" ta="center">{meta.hint}</Text>
    </Stack>
  )
}
