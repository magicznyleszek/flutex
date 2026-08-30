import { Alert, Center, Stack, Text } from '@mantine/core'
import { WarningIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import { getFingering, type HoleState, type Instrument } from '../data/instruments'
import { cx } from '../lib/css'
import * as classes from './FluteDiagram.module.css'

export interface FluteDiagramProps {
  instrument: Instrument
  note: string | null
}

const STATE_LABELS: Record<string, string> = {
  '0': 'open',
  '0.5': 'half covered',
  '1': 'covered',
}

function holeClass(state: HoleState): string {
  return cx(
    classes.hole,
    state === 1 && classes.holeCovered,
    state === 0.5 && classes.holeHalf,
  )
}

function describe(state: HoleState): string {
  return STATE_LABELS[String(state)] ?? 'open'
}

function Hole({ state, label }: { state: HoleState, label: string }): JSX.Element {
  return <div className={holeClass(state)} aria-label={`${label}: ${describe(state)}`} />
}

export function FluteDiagram({ instrument, note }: FluteDiagramProps): JSX.Element {
  const fingering = note === null ? null : getFingering(instrument, note)

  if (note === null) {
    return (
      <Center h={280}>
        <Text c="dimmed" size="sm">Song finished</Text>
      </Center>
    )
  }

  if (fingering === null) {
    return (
      <Center h={280} px="md">
        <Alert
          color="alarm"
          variant="light"
          icon={<WarningIcon size={20} />}
          title={`No fingering for ${note}`}
        >
          This note is outside the range of the {instrument.shortName}. Pick another
          instrument or another song.
        </Alert>
      </Center>
    )
  }

  const thumbState = instrument.hasThumb ? fingering.holes[0] ?? 0 : null
  const frontHoles = instrument.hasThumb ? fingering.holes.slice(1) : fingering.holes

  return (
    <Stack align="center" gap="sm">
      <div
        className={classes.wrapper}
        role="img"
        aria-label={`Fingering for ${note} on the ${instrument.shortName}`}
      >
        {thumbState !== null && (
          <div className={classes.thumb}>
            <Hole state={thumbState} label="Thumb" />
            <Text size="xs" c="dimmed">thumb</Text>
          </div>
        )}

        <div className={classes.body}>
          <div className={classes.mouthpiece} />
          {frontHoles.map((state, position) => (
            <Hole
              // The holes never reorder, so the index is a stable key here.
              key={position}
              state={state}
              label={`Hole ${position + 1}`}
            />
          ))}
        </div>

        <div className={classes.legend}>
          {frontHoles.map((_, position) => (
            <div key={position} className={classes.legendRow}>
              <Text size="xs" c="dimmed" ff="monospace">{position + 1}</Text>
            </div>
          ))}
        </div>
      </div>

      {fingering.hint !== undefined && (
        <Text size="xs" c="dimmed" ta="center" maw={260}>
          {fingering.hint}
        </Text>
      )}
    </Stack>
  )
}
