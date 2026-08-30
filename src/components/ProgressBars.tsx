import { Group, Progress, Stack, Text } from '@mantine/core'
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
  return (
    <Stack gap="sm">
      <Stack gap={4}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Note hold</Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(holdProgress)}%</Text>
        </Group>
        <Progress
          value={percent(holdProgress)}
          color="accent.4"
          size="lg"
          radius="sm"
          transitionDuration={80}
          aria-label="Note hold progress"
        />
      </Stack>

      <Stack gap={4}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {penaltyMode === 'wait' ? 'Wrong notes' : PENALTIES[penaltyMode].label}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">{percent(mistakeProgress)}%</Text>
        </Group>
        <Progress
          value={percent(mistakeProgress)}
          color="alarm.5"
          size="xs"
          radius="sm"
          transitionDuration={80}
          aria-label="Wrong note level"
        />
      </Stack>
    </Stack>
  )
}
