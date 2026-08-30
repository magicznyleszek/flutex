import { noteToMidi } from '../lib/music'

/** 0 = open hole, 0.5 = half covered, 1 = covered. */
export type HoleState = 0 | 0.5 | 1

export interface Fingering {
  /** Holes from the mouthpiece down. On the recorder the first slot is the thumb. */
  holes: readonly HoleState[]
  hint?: string
}

/** Persisted in localStorage, so renaming a member drops the saved instrument choice. */
export type InstrumentId = 'whistle_d' | 'recorder'

interface InstrumentDefinition {
  name: string
  shortName: string
  /** Whether the first slot in `holes` is the thumb hole on the back. */
  hasThumb: boolean
  fingering: Readonly<Record<string, Fingering>>
}

export interface Instrument extends InstrumentDefinition {
  id: InstrumentId
  /** Sorted from the lowest pitch up. */
  notes: readonly string[]
  holeCount: number
}

const OVERBLOWN = 'Second register — same fingering, stronger breath.'

const DEFINITIONS: Record<InstrumentId, InstrumentDefinition> = {
  whistle_d: {
    name: 'Tin whistle (key of D)',
    shortName: 'Tin whistle D',
    hasThumb: false,
    fingering: {
      D5: { holes: [1, 1, 1, 1, 1, 1] },
      E5: { holes: [1, 1, 1, 1, 1, 0] },
      'F#5': { holes: [1, 1, 1, 1, 0, 0] },
      G5: { holes: [1, 1, 1, 0, 0, 0] },
      A5: { holes: [1, 1, 0, 0, 0, 0] },
      B5: { holes: [1, 0, 0, 0, 0, 0] },
      C6: { holes: [0, 1, 1, 0, 0, 0] },
      'C#6': { holes: [0, 0, 0, 0, 0, 0] },
      // Second register starts here. D6 has a grip of its own, the rest repeat the
      // first-register holes with more breath.
      D6: {
        holes: [0, 1, 1, 1, 1, 1],
        hint: 'Second register. Some schools play D6 with all holes closed and more breath.',
      },
      E6: { holes: [1, 1, 1, 1, 1, 0], hint: OVERBLOWN },
      'F#6': { holes: [1, 1, 1, 1, 0, 0], hint: OVERBLOWN },
      G6: { holes: [1, 1, 1, 0, 0, 0], hint: OVERBLOWN },
      A6: { holes: [1, 1, 0, 0, 0, 0], hint: OVERBLOWN },
      B6: { holes: [1, 0, 0, 0, 0, 0], hint: OVERBLOWN },
    },
  },

  recorder: {
    name: 'Soprano recorder (baroque fingering)',
    shortName: 'Recorder',
    hasThumb: true,
    fingering: {
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // Baroque F5 is forked: hole 4 open, 5, 6, 7 closed. German recorders finger this
      // note differently, so the whole table stays baroque.
      F5: { holes: [1, 1, 1, 1, 0, 1, 1, 1] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 0] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      B5: { holes: [1, 1, 0, 0, 0, 0, 0, 0] },
      C6: { holes: [1, 0, 1, 0, 0, 0, 0, 0] },
      'C#6': { holes: [0, 1, 1, 0, 0, 0, 0, 0] },
      D6: {
        holes: [0, 0, 1, 0, 0, 0, 0, 0],
        hint: 'Second register. The thumb usually cracks the hole halfway rather than lifting off.',
      },
    },
  },
}

function buildInstrument(id: InstrumentId, definition: InstrumentDefinition): Instrument {
  const notes = Object.keys(definition.fingering).sort(
    (left, right) => (noteToMidi(left) ?? 0) - (noteToMidi(right) ?? 0),
  )

  const firstFingering = definition.fingering[notes[0] ?? '']

  return {
    ...definition,
    id,
    notes,
    holeCount: firstFingering?.holes.length ?? 0,
  }
}

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  whistle_d: buildInstrument('whistle_d', DEFINITIONS.whistle_d),
  recorder: buildInstrument('recorder', DEFINITIONS.recorder),
}

export const INSTRUMENT_LIST: readonly Instrument[] = Object.values(INSTRUMENTS)

export const DEFAULT_INSTRUMENT_ID: InstrumentId = 'whistle_d'

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === 'string' && value in INSTRUMENTS
}

export function getFingering(instrument: Instrument, note: string): Fingering | null {
  return instrument.fingering[note] ?? null
}

/**
 * The playable range in hertz, padded by `marginSemitones` so out-of-tune playing still
 * falls inside it. The detector uses this to search a narrow band of lags.
 */
export function instrumentFreqRange(
  instrument: Instrument,
  marginSemitones = 3,
): { minFreq: number, maxFreq: number } {
  const midis = instrument.notes.map((note) => noteToMidi(note) ?? 0)
  const lowest = Math.min(...midis) - marginSemitones
  const highest = Math.max(...midis) + marginSemitones

  return {
    minFreq: 440 * Math.pow(2, (lowest - 69) / 12),
    maxFreq: 440 * Math.pow(2, (highest - 69) / 12),
  }
}

/** Notes with no fingering on this instrument, deduplicated. */
export function unplayableNotes(
  instrument: Instrument,
  notes: readonly string[],
): readonly string[] {
  const missing = new Set<string>()
  for (const note of notes) {
    if (!(note in instrument.fingering)) missing.add(note)
  }
  return [...missing]
}
