import { Group, Progress, SimpleGrid, Stack, Text } from '@mantine/core'
import type { JSX } from 'react'

import { PENALTIES } from '../data/settings'
import type { PenaltyMode } from '../lib/trainer'

export interface ProgressBarsProps {
  /** 0–1: how much of the required hold time is already credited. */
  holdProgress: number
  /** 0–1: how much of the wrong-note allowance has been used up. */
  mistakeProgress: number
  penaltyMode: PenaltyMode
}

const percent = (value: number): number => Math.round(value * 100)

export function ProgressBars({
  holdProgress,
  mistakeProgress,
  penaltyMode,
}: ProgressBarsProps): JSX.Element {
  // In the penalty modes both gauges have to be on screen, and stacked they cost
  // 65px of a phone. Side by side they cost 33 — a labelled bar is legible at half
  // of 358px. SimpleGrid rather than a Flex because `cols` is responsive and CSS
  // grid splits the row evenly without flex-basis games; at `cols: 1` it is exactly
  // the Stack this used to be. `wait` mode stays one column at every width, because
  // there the second gauge is hidden below `sm` and a two-column grid with one
  // in-flow child would leave the note-hold bar stranded at half width.
  const cols = { base: penaltyMode === 'wait' ? 1 : 2, sm: 1 }

  return (
    <SimpleGrid cols={cols} spacing="sm">
      <Stack gap={4}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Note hold</Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(holdProgress)}%</Text>
        </Group>
        {/* Mantine's dark Progress track is dark-4, the border shade — as a
            12px slab that reads lighter than the card it sits on and leaves
            only 1.75:1 against the fill. dark.9 makes it a groove instead,
            matching the tuner track directly above. */}
        <Progress
          value={percent(holdProgress)}
          color="accent.4"
          bg="dark.9"
          size="lg"
          radius="sm"
          transitionDuration={80}
          aria-label="Note hold progress"
        />
      </Stack>

      {/* In `wait` mode nothing is counting down: the bar snaps to full while a wrong
          note sounds and decays once it is right, which is the same thing the status
          label above already says in words and in colour. On a phone that is 32px of
          duplicate, so it goes. In the `back` and `restart` modes it is a real gauge
          of how close the next mistake is to sending you backwards, and it stays at
          every width. */}
      <Stack gap={4} visibleFrom={penaltyMode === 'wait' ? 'sm' : undefined}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {penaltyMode === 'wait' ? 'Wrong notes' : PENALTIES[penaltyMode].label}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(mistakeProgress)}%</Text>
        </Group>
        <Progress
          value={percent(mistakeProgress)}
          color="alarm.5"
          bg="dark.9"
          size="xs"
          radius="sm"
          transitionDuration={80}
          aria-label="Wrong note level"
        />
      </Stack>
    </SimpleGrid>
  )
}
