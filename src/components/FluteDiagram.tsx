import { Alert, Stack, Text } from '@mantine/core'
import { WarningIcon } from '@phosphor-icons/react'
import type { CSSProperties, JSX } from 'react'

import { getFingering, type HoleState, type Instrument } from '../data/instruments'
import { cx } from '../lib/css'
import * as classes from './FluteDiagram.module.css'

export interface FluteDiagramProps {
  instrument: Instrument
  note: string | null
  /**
   * Drops everything around the tube: the legend digits, the fingering hint, and the prose
   * that stands in for a missing note. The tube and its holes stay exactly the size they
   * are — the two neighbours in the note row are dimmed rather than shrunk, so this chrome
   * is what marks out the note you are actually being asked to play.
   */
  bare?: boolean
}

/**
 * The two bits of the diagram's geometry CSS cannot work out for itself. Hole count gets
 * multiplied into `--diagram-height`, which the placeholder states reuse so the card does
 * not jump. `--side-slot` is the width of the two columns flanking the tube, which have to
 * match for the tube to end up centred: wide enough for a thumb hole on a recorder, and
 * otherwise only as wide as a legend digit, so a whistle chart stays narrow enough for
 * three of them to fit a phone.
 */
function geometry(frontHoleCount: number, hasThumb: boolean): CSSProperties {
  return {
    '--hole-count': frontHoleCount,
    '--side-slot': hasThumb ? 'var(--hole-size)' : '1ch',
  } as CSSProperties
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

export function FluteDiagram({
  instrument,
  note,
  bare = false,
}: FluteDiagramProps): JSX.Element {
  const fingering = note === null ? null : getFingering(instrument, note)

  // The placeholder states below need a height before there is a fingering to draw, so
  // the count comes from the instrument.
  const frontHoleCount = instrument.hasThumb
    ? instrument.holeCount - 1
    : instrument.holeCount

  // A neighbour with nothing to show says so with an empty slot. Either message below
  // would be wider than the whole three-chart row, and neither is about the note you are
  // being asked to play.
  if (bare && (note === null || fingering === null)) {
    return (
      <div
        className={cx(classes.placeholder, classes.barePlaceholder)}
        style={geometry(frontHoleCount, instrument.hasThumb)}
      />
    )
  }

  if (note === null) {
    return (
      <div className={classes.placeholder} style={geometry(frontHoleCount, instrument.hasThumb)}>
        <Text c="dimmed" size="sm">Song finished</Text>
      </div>
    )
  }

  if (fingering === null) {
    return (
      <div className={classes.placeholder} style={geometry(frontHoleCount, instrument.hasThumb)}>
        {/* Capped, because this sits in a flex row between the two neighbours and an
            unconstrained Alert would stretch it past the card. */}
        <Alert
          color="alarm"
          variant="light"
          maw={300}
          icon={<WarningIcon size={20} />}
          title={`No fingering for ${note}`}
        >
          This note is outside the range of the {instrument.shortName}. Pick another
          instrument or another song.
        </Alert>
      </div>
    )
  }

  const thumbState = instrument.hasThumb ? fingering.holes[0] ?? 0 : null
  const frontHoles = instrument.hasThumb ? fingering.holes.slice(1) : fingering.holes

  return (
    <Stack align="center" gap="sm">
      <div
        className={classes.wrapper}
        style={geometry(frontHoles.length, instrument.hasThumb)}
        role="img"
        aria-label={`Fingering for ${note} on the ${instrument.shortName}`}
      >
        {thumbState !== null && (
          <div className={classes.thumb}>
            <Hole state={thumbState} label="Thumb" />
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

        {/* Rendered even when empty, because it is what claims the grid slot on the far side
            of the tube. Dropping it on the neighbours would leave them a slot narrower than
            the note being played, and the three tubes in the row would no longer be evenly
            spaced. */}
        <div className={classes.legend}>
          {!bare && frontHoles.map((_, position) => (
            <div key={position} className={classes.legendRow}>
              <Text size="xs" c="dimmed" ff="monospace">{position + 1}</Text>
            </div>
          ))}
        </div>
      </div>

      {!bare && fingering.hint !== undefined && (
        <Text size="xs" c="dimmed" ta="center" maw={260}>
          {fingering.hint}
        </Text>
      )}
    </Stack>
  )
}
