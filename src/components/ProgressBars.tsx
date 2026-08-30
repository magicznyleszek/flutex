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
  // The penalty modes need both gauges on screen, and stacked they cost 65px of a phone
  // against 33 side by side, where a labelled bar is still legible at half of 358px.
  // `wait` mode stays at one column everywhere, because its second gauge is hidden below
  // `sm` and a two-column grid with one in-flow child strands the hold bar at half width.
  const cols = { base: penaltyMode === 'wait' ? 1 : 2, sm: 1 }

  return (
    <SimpleGrid cols={cols} spacing="sm">
      <Stack gap={4}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Note hold</Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(holdProgress)}%</Text>
        </Group>
        {/* Mantine's dark Progress track is dark-4, which reads lighter than the card it
            sits on, so an empty bar looks like a filled one. dark.9 makes it a groove
            instead, matching the tuner track above, and takes the fill from 3.22:1 to
            10.37:1. */}
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

      {/* In `wait` mode nothing counts down. The bar snaps to full while a wrong note
          sounds and decays once it is right, which the status label above already says,
          so on a phone it is 32px of duplicate. In `back` and `restart` it gauges how
          close the next mistake is to sending you backwards, so it stays at every width. */}
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
