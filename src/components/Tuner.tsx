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
 * How far past the green zone each end of the track reaches, in cents. Added, not multiplied: a
 * multiplier would draw the zone the same width at every setting. Adding keeps that width meaningful
 * — a fifth of the track at ±10, two thirds at ±100 — and still leaves the needle somewhere to go.
 */
const RANGE_MARGIN = 50

const clamp = (value: number, limit: number): number =>
  Math.max(-limit, Math.min(limit, value))

export function Tuner({ cents, toleranceCents, active }: TunerProps): JSX.Element {
  const displayRange = toleranceCents + RANGE_MARGIN

  // The tolerance is one-sided, so the green zone is twice the tolerance wide.
  const halfWidth = (toleranceCents / displayRange) * 50
  const needleLeft = 50 + (clamp(cents, displayRange) / displayRange) * 50
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
        {/* Idle, the window you are aiming for; playing, how far off you are. The track has no
            numbers, so this is the only thing naming the tolerance setting. */}
        <Text size="xs" c={inTune ? 'var(--flutex-accent-ink)' : 'dimmed'} ff="monospace">
          {active
            ? `${cents > 0 ? '+' : ''}${Math.round(cents)}¢`
            : `±${toleranceCents}¢`}
        </Text>
        <Text size="xs" c="dimmed">sharp</Text>
      </Group>
    </Stack>
  )
}
