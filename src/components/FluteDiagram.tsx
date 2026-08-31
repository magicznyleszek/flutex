import { Alert, Stack, Text } from '@mantine/core'
import { WarningIcon } from '@phosphor-icons/react'
import type { CSSProperties, JSX } from 'react'

import {
  getFingering,
  type HolePlacement,
  type HoleState,
  type Instrument,
  type Layout,
  type OcarinaLayout,
  type TubeLayout,
} from '../data/instruments'
import { cx } from '../lib/css'
import * as classes from './FluteDiagram.module.css'

export interface FluteDiagramProps {
  instrument: Instrument
  note: string | null
  /**
   * Drops everything around the chart — legend digits, fingering hint, missing-note prose — at the
   * same size. The neighbours in the note row are dimmed rather than shrunk, so this chrome is what
   * marks out the note you are being asked to play.
   */
  bare?: boolean
}

/**
 * The bits of geometry CSS cannot work out for itself. Both kinds of chart feed
 * `--diagram-height`, which the placeholder states reuse so the card does not jump when a note has
 * no fingering or the song ends.
 *
 * `--side-slot` is the width of the two columns flanking a tube, equal so the tube ends up centred:
 * a thumb hole's width on a recorder, otherwise one legend digit, which keeps a whistle chart
 * narrow enough for four of them on a phone.
 */
function geometry(layout: Layout, holeCount: number): CSSProperties {
  if (layout.kind === 'ocarina') {
    return { '--ocarina-aspect': layout.height / 100 } as CSSProperties
  }

  return {
    '--hole-count': layout.hasThumb ? holeCount - 1 : holeCount,
    '--side-slot': layout.hasThumb ? 'var(--hole-size)' : '1ch',
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

interface TubeBodyProps {
  layout: TubeLayout
  holes: readonly HoleState[]
  /** The whole chart's accessible name, since the holes inside it are decoration. */
  label: string
  bare: boolean
}

/** A whistle or recorder: one column of holes down the tube, numbered beside it. */
function TubeBody({ layout, holes, label, bare }: TubeBodyProps): JSX.Element {
  const thumbState = layout.hasThumb ? holes[0] ?? 0 : null
  const frontHoles = layout.hasThumb ? holes.slice(1) : holes

  return (
    <div
      className={classes.wrapper}
      style={geometry(layout, holes.length)}
      role="img"
      aria-label={label}
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

      {/* Rendered even when empty: it claims the grid slot on the far side of the tube, without
          which the dimmed neighbours would come out narrower than the note being played. */}
      <div className={classes.legend}>
        {!bare && frontHoles.map((_, position) => (
          <div key={position} className={classes.legendRow}>
            <Text size="xs" c="dimmed" ff="monospace">{position + 1}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The filled half of a half-covered hole, as the top half of a disc. `sweep-flag` 1 with `y`
 * growing downwards sweeps over the top, and SVG has no gradient fill without an id, so the
 * covered half is its own shape rather than the gradient the tube chart uses.
 */
function halfDisc({ x, y, r }: HolePlacement): string {
  return `M ${x - r},${y} A ${r},${r} 0 0 1 ${x + r},${y} Z`
}

interface OcarinaBodyProps {
  layout: OcarinaLayout
  holes: readonly HoleState[]
  label: string
}

/**
 * How far a back hole's patch of body sticks out past the hole, in viewBox units. Thumb holes are
 * drawn clear of the front view, so without this scrap of instrument under them they would float on
 * the card.
 */
const BACK_PAD = 2.5

/**
 * A vessel flute, drawn from the layout's own coordinates. Unlike a tube there is no order to walk
 * — which hole a finger covers is the whole information — so the chart is the instrument's shape
 * with the holes in their places on it.
 */
function OcarinaBody({ layout, holes, label }: OcarinaBodyProps): JSX.Element {
  const { body } = layout

  return (
    <svg
      className={cx(classes.ocarina, classes.ocarinaChart)}
      style={geometry(layout, holes.length)}
      viewBox={`0 0 100 ${layout.height}`}
      role="img"
      aria-label={label}
    >
      <ellipse
        className={classes.ocarinaShell}
        cx={body.cx}
        cy={body.cy}
        rx={body.rx}
        ry={body.ry}
        // About its own centre, so `cx`/`cy` still mean what they say.
        transform={body.rotate === undefined
          ? undefined
          : `rotate(${body.rotate} ${body.cx} ${body.cy})`}
      />

      {layout.holes.map((placement, position) => {
        const state = holes[position] ?? 0

        return (
          <g key={placement.label} aria-label={`${placement.label}: ${describe(state)}`}>
            {placement.back === true && (
              <circle
                className={classes.ocarinaBackPad}
                cx={placement.x}
                cy={placement.y}
                r={placement.r + BACK_PAD}
              />
            )}
            <circle
              className={cx(
                classes.ocarinaHole,
                state !== 0 && classes.ocarinaHoleActive,
                state === 1 && classes.ocarinaHoleCovered,
              )}
              cx={placement.x}
              cy={placement.y}
              r={placement.r}
            />
            {state === 0.5 && (
              <path className={classes.ocarinaHoleHalf} d={halfDisc(placement)} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function FluteDiagram({
  instrument,
  note,
  bare = false,
}: FluteDiagramProps): JSX.Element {
  const { layout } = instrument
  const fingering = note === null ? null : getFingering(instrument, note)

  // The placeholders below need a size before there is a fingering to draw, so it comes from the
  // instrument. An ocarina sizes off the drawing rather than a column of holes, so it needs a class
  // of its own.
  const style = geometry(layout, instrument.holeCount)
  const sizing = layout.kind === 'ocarina' ? classes.ocarina : undefined

  // A dimmed neighbour with nothing to show leaves an empty slot: either message below would be
  // wider than the whole note row.
  if (bare && (note === null || fingering === null)) {
    return (
      <div
        className={cx(classes.placeholder, classes.barePlaceholder, sizing)}
        style={style}
      />
    )
  }

  if (note === null) {
    return (
      <div className={cx(classes.placeholder, sizing)} style={style}>
        <Text c="dimmed" size="sm">Song finished</Text>
      </div>
    )
  }

  if (fingering === null) {
    return (
      <div className={cx(classes.placeholder, sizing)} style={style}>
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

  const label = `Fingering for ${note} on the ${instrument.shortName}`

  return (
    <Stack align="center" gap="sm">
      {layout.kind === 'ocarina'
        ? <OcarinaBody layout={layout} holes={fingering.holes} label={label} />
        : <TubeBody layout={layout} holes={fingering.holes} label={label} bare={bare} />}

      {!bare && fingering.hint !== undefined && (
        <Text size="xs" c="dimmed" ta="center" maw={260}>
          {fingering.hint}
        </Text>
      )}
    </Stack>
  )
}
