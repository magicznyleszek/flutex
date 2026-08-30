import { Group, Stack, Text } from '@mantine/core'
import type { JSX } from 'react'

import { cx } from '../lib/css'
import * as classes from './Tuner.module.css'

export interface TunerProps {
  /** Deviation from the target note in cents. */
  cents: number
  /** Width of the green zone, in cents per side. */
  toleranceCents: number
  /** Whether we are hearing anything at all this frame. */
  active: boolean
}

/**
 * The whole scale spans ±DISPLAY_RANGE cents, i.e. half a semitone each way.
 * There is nothing to show beyond that — it is a different note by then.
 */
const DISPLAY_RANGE = 50

const clamp = (value: number, limit: number): number =>
  Math.max(-limit, Math.min(limit, value))

export function Tuner({ cents, toleranceCents, active }: TunerProps): JSX.Element {
  // The tolerance is one-sided, so the zone is 2x the tolerance wide.
  // The scale maps DISPLAY_RANGE cents onto 50% of the track width.
  const halfWidth = Math.min(50, (toleranceCents / DISPLAY_RANGE) * 50)
  const needleLeft = 50 + (clamp(cents, DISPLAY_RANGE) / DISPLAY_RANGE) * 50
  const inTune = active && Math.abs(cents) <= toleranceCents

  return (
    <Stack gap={4}>
      <div className={classes.track}>
        <div
          className={classes.zone}
          style={{ left: `${50 - halfWidth}%`, width: `${halfWidth * 2}%` }}
        />
        <div className={classes.center} />
        {active && (
          <div
            className={cx(classes.needle, inTune && classes.needleInTune)}
            style={{ left: `${needleLeft}%` }}
          />
        )}
      </div>

      <Group justify="space-between" className={classes.scale}>
        <Text size="xs" c="dimmed">flat</Text>
        <Text size="xs" c={inTune ? 'accent.4' : 'dimmed'} ff="monospace">
          {active ? `${cents > 0 ? '+' : ''}${Math.round(cents)}¢` : '—'}
        </Text>
        <Text size="xs" c="dimmed">sharp</Text>
      </Group>
    </Stack>
  )
}
