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
  // Side by side the gauges cost 33px of a phone rather than 65, and a labelled bar is still legible
  // at half of 358px. `wait` mode keeps one column: its second gauge is hidden below `sm`, and a
  // two-column grid with one in-flow child would strand the hold bar at half width.
  const cols = { base: penaltyMode === 'wait' ? 1 : 2, sm: 1 }

  return (
    <SimpleGrid cols={cols} spacing="sm">
      <Stack gap={4}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Note hold</Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(holdProgress)}%</Text>
        </Group>
        {/* Mantine's stock track reads lighter than the card, so an empty bar looks filled. This
            shade matches the tuner track and keeps the fill at 10.37:1 dark, 4.80:1 light. */}
        <Progress
          value={percent(holdProgress)}
          color="var(--flutex-accent-ink)"
          bg="var(--flutex-sunken)"
          size="lg"
          radius="sm"
          transitionDuration={80}
          aria-label="Note hold progress"
        />
      </Stack>

      {/* In `wait` mode nothing counts down: the bar just tracks whether the note is wrong, which
          the status label already says, so a phone drops its 32px. In `back` and `restart` it gauges
          how close the next mistake is to sending you backwards, so it stays at every width. */}
      <Stack gap={4} visibleFrom={penaltyMode === 'wait' ? 'sm' : undefined}>
        <Group justify="space-between">
          {/* "Off target", not "Wrong notes": a plural reads as the tally the mistakes badge keeps. */}
          <Text size="xs" c="dimmed">
            {penaltyMode === 'wait' ? 'Off target' : PENALTIES[penaltyMode].label}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(mistakeProgress)}%</Text>
        </Group>
        <Progress
          value={percent(mistakeProgress)}
          color="var(--flutex-alarm-ink)"
          bg="var(--flutex-sunken)"
          size="xs"
          radius="sm"
          transitionDuration={80}
          aria-label="Wrong note allowance used"
        />
      </Stack>
    </SimpleGrid>
  )
}
