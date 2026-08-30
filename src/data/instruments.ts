import { noteToMidi } from '../lib/music'

/** 0 = open hole, 0.5 = half covered, 1 = covered. */
export type HoleState = 0 | 0.5 | 1

export interface Fingering {
  /** Holes from the mouthpiece down. On the recorder the first slot is the thumb. */
  holes: readonly HoleState[]
  hint?: string
}

/** Persisted in localStorage, so renaming a member drops the saved instrument choice. */
export type InstrumentId = 'whistle_d' | 'recorder' | 'recorder_german'

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

/*
 * The recorder changes register with the thumb rather than with breath alone, and it does it in
 * two steps: C#6, D6 and D#6 want the thumb right off the hole, and from E6 up it goes back on
 * as a narrow slit. Every chart consulted puts the line in the same place, and half-covering
 * down at D6 sends players after a note that will not sound. Both fingering systems below share
 * these two sentences, so they live up here rather than being retyped twenty times.
 */
const THUMB_OFF = 'Second register. The thumb comes right off the hole — from E6 up it is only cracked open.'
const PINCHED = 'Second register. Crack the thumb hole open into a narrow slit, not half uncovered.'

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

  // Baroque (also sold as English) fingering — what nearly every soprano outside the
  // German-speaking countries uses. The tell on the instrument itself is which hole is bored
  // wider: hole 5 here, hole 4 on the German one below.
  recorder: {
    name: 'Soprano recorder (baroque fingering)',
    shortName: 'Baroque recorder',
    hasThumb: true,
    fingering: {
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // Baroque F5 is forked: hole 4 closed, hole 5 open, 6 and 7 closed. That break in the
      // sequence is the whole difference between baroque and German fingering, so getting it
      // backwards silently turns the table into a German one — `[1,1,1,1,0,1,1,1]` is in fact
      // the German F#5. Verified against Mollenhauer, Moeck, Yamaha, the American Recorder
      // Society and Dolmetsch, which agree without dissent.
      F5: { holes: [1, 1, 1, 1, 1, 0, 1, 1] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 0] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      B5: { holes: [1, 1, 0, 0, 0, 0, 0, 0] },
      C6: { holes: [1, 0, 1, 0, 0, 0, 0, 0] },
      'C#6': { holes: [0, 1, 1, 0, 0, 0, 0, 0] },
      D6: { holes: [0, 0, 1, 0, 0, 0, 0, 0], hint: THUMB_OFF },
      // The rest of the second register, as printed by Mollenhauer, Moeck, Prescott and
      // Dolmetsch, which agree on all of these without dissent. A#6 is left out on purpose:
      // those same charts give four different grips for it, so there is nothing to teach.
      // C7 is the last one worth having — C#7 needs the bell closed against your knee.
      'D#6': { holes: [0, 0, 1, 1, 1, 1, 1, 0], hint: THUMB_OFF },
      E6: { holes: [0.5, 1, 1, 1, 1, 1, 0, 0], hint: PINCHED },
      F6: { holes: [0.5, 1, 1, 1, 1, 0, 1, 0], hint: PINCHED },
      'F#6': { holes: [0.5, 1, 1, 1, 0, 1, 0, 0], hint: PINCHED },
      G6: { holes: [0.5, 1, 1, 1, 0, 0, 0, 0], hint: PINCHED },
      'G#6': { holes: [0.5, 1, 1, 0, 1, 0, 0, 0], hint: PINCHED },
      A6: { holes: [0.5, 1, 1, 0, 0, 0, 0, 0], hint: PINCHED },
      B6: { holes: [0.5, 1, 1, 0, 1, 1, 0, 0], hint: PINCHED },
      C7: { holes: [0.5, 1, 0, 0, 1, 1, 0, 0], hint: PINCHED },
    },
  },

  /*
   * German fingering, Peter Harlan's 1920s redesign. Widening hole 4 lets F play straight down
   * the scale with no fork, which is easier for a beginner's first tune and harder for every
   * accidental above it — the fork it saves on F comes back on F#. Worth having because it is
   * still roughly a third of the sopranos sold in Europe, and the two look identical in the
   * hand, so a player following a baroque chart on a German recorder just hears wrong notes.
   *
   * Written out in full rather than spread from the baroque table above. A chart you can read
   * top to bottom against its published source is worth more here than the shorter diff, and
   * `tests/data.test.ts` pins the divergences so the two cannot drift apart quietly.
   */
  recorder_german: {
    name: 'Soprano recorder (German fingering)',
    shortName: 'German recorder',
    hasThumb: true,
    fingering: {
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // The unforked F the whole system is built around, and the F# that pays for it.
      F5: { holes: [1, 1, 1, 1, 1, 0, 0, 0] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 1] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      B5: { holes: [1, 1, 0, 0, 0, 0, 0, 0] },
      C6: { holes: [1, 0, 1, 0, 0, 0, 0, 0] },
      'C#6': { holes: [0, 1, 1, 0, 0, 0, 0, 0] },
      D6: { holes: [0, 0, 1, 0, 0, 0, 0, 0], hint: THUMB_OFF },
      'D#6': { holes: [0, 0, 1, 1, 1, 1, 1, 0], hint: THUMB_OFF },
      E6: { holes: [0.5, 1, 1, 1, 1, 1, 0, 0], hint: PINCHED },
      // Where the wider hole 4 shows up again: F6, F#6 and G#6 are the three second-register
      // notes German plays differently, per Mollenhauer's and Yamaha's German charts.
      F6: { holes: [0.5, 1, 1, 1, 1, 0, 0, 0], hint: PINCHED },
      'F#6': { holes: [0.5, 1, 1, 1, 0, 1, 0, 1], hint: PINCHED },
      G6: { holes: [0.5, 1, 1, 1, 0, 0, 0, 0], hint: PINCHED },
      'G#6': { holes: [0.5, 1, 1, 1, 0, 1, 1, 1], hint: PINCHED },
      A6: { holes: [0.5, 1, 1, 0, 0, 0, 0, 0], hint: PINCHED },
      // Stops a note short of the baroque chart. The German charts consulted end at B6, and a
      // C7 guessed from the baroque grip is exactly the kind of invention this table cannot
      // afford — hole sizes differ, so the same fingers do not give the same pitch.
      B6: { holes: [0.5, 1, 1, 0, 1, 1, 0, 0], hint: PINCHED },
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
  recorder_german: buildInstrument('recorder_german', DEFINITIONS.recorder_german),
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
