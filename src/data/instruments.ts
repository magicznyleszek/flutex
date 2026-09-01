import { noteToMidi } from '../lib/music'

/** 0 = open hole, 0.5 = half covered, 1 = covered. */
export type HoleState = 0 | 0.5 | 1

export interface Fingering {
  /** Holes from the mouthpiece down. On the recorder the first slot is the thumb. */
  holes: readonly HoleState[]
  hint?: string
}

/** Persisted in localStorage, so renaming a member drops the saved instrument choice. */
export type InstrumentId =
  | 'whistle_d'
  | 'recorder'
  | 'recorder_german'
  | 'ocarina_6'
  | 'ocarina_12'

/**
 * Where a hole sits in the diagram's own coordinates: 100 units wide, `y` growing downwards, as tall
 * as `OcarinaLayout.height`. The radius is per hole because open *area* sets an ocarina's pitch, so
 * printed charts draw the holes at the sizes they really are.
 */
export interface HolePlacement {
  x: number
  y: number
  r: number
  /** Names the hole the way a player would, for the screen-reader label. */
  label: string
  /** Drawn clear of the body, the way printed charts show the holes round the back. */
  back?: boolean
}

/** A vessel flute: no useful one-dimensional hole order, so every hole carries a position. */
export interface OcarinaLayout {
  kind: 'ocarina'
  /** Height of the viewBox; the width is always 100. */
  height: number
  /** The body. `rotate` is degrees clockwise about its own centre. */
  body: { cx: number, cy: number, rx: number, ry: number, rotate?: number }
  /** One entry per slot in `Fingering.holes`, in the same order. */
  holes: readonly HolePlacement[]
}

/** A column of holes down a tube, which is geometry CSS can derive from a count alone. */
export interface TubeLayout {
  kind: 'tube'
  /** Whether the first slot in `holes` is the thumb hole on the back. */
  hasThumb: boolean
}

export type Layout = TubeLayout | OcarinaLayout

interface InstrumentDefinition {
  name: string
  shortName: string
  /**
   * The tonic of the scale the instrument plays without accidentals. A key to transpose *towards*
   * rather than a constraint — a whistle in D plays in G all day — and that is all `bestShift`
   * uses it for.
   */
  key: string
  layout: Layout
  fingering: Readonly<Record<string, Fingering>>
}

export interface Instrument extends InstrumentDefinition {
  id: InstrumentId
  /** Sorted from the lowest pitch up. */
  notes: readonly string[]
  holeCount: number
}

const OVERBLOWN = 'Second register — same fingering, stronger breath.'

// The recorder's second register turns on the thumb in two steps: right off the hole for C#6 to
// D#6, back on as a narrow slit from E6 up. Every chart consulted draws the line in that same
// place, and half-covering down at D6 chases a note that will not sound.
const THUMB_OFF = 'Second register. The thumb comes right off the hole — from E6 up it is only cracked open.'
const PINCHED = 'Second register. Crack the thumb hole open into a narrow slit, not half uncovered.'

// A half hole and a fork both look like mistakes in a diagram, so they say so in words.
const HALF_HOLE = 'Half-hole: leave half of it open. Recorders with a split hole 6 or 7 do it by closing one of the pair.'
const FORKED = 'Forked: hole 2 is open while 3 and 4 stay down. That gap is deliberate.'

// An ocarina is fingered by open area rather than in a run down a tube, so these say which notes
// are the odd ones out — which is what its diagrams cannot show on their own.
const HALF_COVER = 'Slide the finger to leave about half the hole open, rather than lifting it.'
const THUMBS_OFF = 'Top of the range: the front is already open, so the thumb holes go next.'
const SUBHOLES = 'Below the tonic. Only a subhole opens — every finger stays where it was.'
const CROSS_SUBHOLE = 'Cross-fingered: the note above it, with the right subhole put back down.'
const CROSS_RING = 'Cross-fingered: the note above it, with the right ring hole put back down.'

const DEFINITIONS: Record<InstrumentId, InstrumentDefinition> = {
  whistle_d: {
    name: 'Tin whistle (key of D)',
    shortName: 'Tin whistle D',
    key: 'D',
    layout: { kind: 'tube', hasThumb: false },
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
    key: 'C',
    layout: { kind: 'tube', hasThumb: true },
    fingering: {
      // First octave, chromatic, from Dolmetsch's freely copyable "Baroque / English Recorder
      // Fingering Chart" (c) 2001, page one. Lander's Recorder Home Page independently gives the
      // same two awkward ones, G#5 and A#5 — the agreement worth having, since those are the two
      // another chart might plausibly print differently.
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      'C#5': { holes: [1, 1, 1, 1, 1, 1, 1, 0.5], hint: HALF_HOLE },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      'D#5': { holes: [1, 1, 1, 1, 1, 1, 0.5, 0], hint: HALF_HOLE },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // Baroque F5 is forked: hole 5 open with 6 and 7 closed. That break is the whole difference
      // between the two systems, and writing it the other way round would quietly make this a
      // German chart. Checked against Mollenhauer, Moeck, Yamaha, the ARS and Dolmetsch.
      F5: { holes: [1, 1, 1, 1, 1, 0, 1, 1] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 0] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      // German closes hole 6 here rather than half-covering it. Lander warns the note "is often
      // painfully out of tune in ensemble work" either way — the instrument's fault, not the
      // chart's.
      'G#5': { holes: [1, 1, 1, 0, 1, 1, 0.5, 0], hint: HALF_HOLE },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      'A#5': { holes: [1, 1, 0, 1, 1, 0, 0, 0], hint: FORKED },
      B5: { holes: [1, 1, 0, 0, 0, 0, 0, 0] },
      C6: { holes: [1, 0, 1, 0, 0, 0, 0, 0] },
      'C#6': { holes: [0, 1, 1, 0, 0, 0, 0, 0] },
      D6: { holes: [0, 0, 1, 0, 0, 0, 0, 0], hint: THUMB_OFF },
      // The rest of the second register, per Mollenhauer, Moeck, Prescott and Dolmetsch. A#6 is
      // left out because those same charts give four different grips for it, and C7 is the last
      // one worth having — C#7 needs the bell closed against your knee.
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
   * German fingering, Peter Harlan's 1920s redesign: a wider hole 4 lets F play straight down the
   * scale with no fork, and the fork comes back on F#. Still about a third of European sopranos, and
   * the two look identical in the hand, so a baroque chart on a German recorder sounds wrong. Written
   * out in full rather than spread from the table above — a chart you can read against its source
   * beats a shorter diff, and `tests/data.test.ts` pins the divergences.
   */
  recorder_german: {
    name: 'Soprano recorder (German fingering)',
    shortName: 'German recorder',
    key: 'C',
    layout: { kind: 'tube', hasThumb: true },
    fingering: {
      // Accidentals from Dolmetsch's "German Recorder Fingering Chart" (c) 2001, page one. Three
      // of the four match baroque, as expected: the wider hole 4 only bites where a fingering
      // leans on hole 4 or 5.
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      'C#5': { holes: [1, 1, 1, 1, 1, 1, 1, 0.5], hint: HALF_HOLE },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      'D#5': { holes: [1, 1, 1, 1, 1, 1, 0.5, 0], hint: HALF_HOLE },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // The unforked F the whole system is built around, and the F# that pays for it.
      F5: { holes: [1, 1, 1, 1, 1, 0, 0, 0] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 1] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      // The third divergence, and the only one in the first octave that is not about F: hole 6
      // goes right down here where the baroque chart half-covers it.
      'G#5': { holes: [1, 1, 1, 0, 1, 1, 1, 0] },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      'A#5': { holes: [1, 1, 0, 1, 1, 0, 0, 0], hint: FORKED },
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
      // Stops a note short of the baroque chart: the German charts consulted end at B6, and hole
      // sizes differ, so a C7 borrowed from the baroque grip would be a guess, not a fingering.
      B6: { holes: [0.5, 1, 1, 0, 1, 1, 0, 0], hint: PINCHED },
    },
  },

  /*
   * Six-hole pendant on John Taylor's 1964 system: four finger holes in a 2x2, two thumb holes
   * behind. From STL Ocarina's "A Complete Fingering Chart for 6 Hole Ocarina in C Major" (c) 2020.
   *
   * The table checks itself, which is Taylor's trick: sizing the front holes 1, 2, 3, 4 makes every
   * note from D5 to C6 a different total open area, one unit at a time, so a hole transcribed wrong
   * would break the run. The octave is a reading — the chart's staff runs C4 to E5 and only says the
   * real pitch is higher — which makes this the standard soprano-C pendant at C5-E6.
   */
  ocarina_6: {
    name: 'Ocarina, 6-hole pendant (key of C)',
    shortName: '6-hole ocarina',
    key: 'C',
    layout: {
      kind: 'ocarina',
      height: 114,
      // Nudged down off the top edge: at cy 44 the outline sat flush with the viewBox and read
      // as a body cropped by the card rather than a whole instrument.
      body: { cx: 50, cy: 46, rx: 38, ry: 43 },
      holes: [
        { x: 35, y: 25, r: 12, label: 'Front upper left' },
        { x: 66, y: 25, r: 10, label: 'Front upper right' },
        { x: 35, y: 58, r: 15, label: 'Front lower left' },
        { x: 68, y: 58, r: 14, label: 'Front lower right' },
        { x: 20, y: 100, r: 10, label: 'Left thumb, on the back', back: true },
        { x: 80, y: 100, r: 10, label: 'Right thumb, on the back', back: true },
      ],
    },
    fingering: {
      C5: { holes: [1, 1, 1, 1, 1, 1], hint: 'Every hole closed — the lowest note.' },
      'C#5': { holes: [1, 0.5, 1, 1, 1, 1], hint: HALF_COVER },
      D5: { holes: [1, 0, 1, 1, 1, 1] },
      'D#5': { holes: [1, 0, 1, 0.5, 1, 1], hint: HALF_COVER },
      E5: { holes: [1, 1, 1, 0, 1, 1] },
      F5: { holes: [1, 0, 1, 0, 1, 1] },
      'F#5': { holes: [0, 1, 1, 1, 1, 1] },
      G5: { holes: [0, 0, 1, 1, 1, 1] },
      'G#5': { holes: [0, 1, 1, 0, 1, 1] },
      A5: { holes: [0, 0, 1, 0, 1, 1] },
      'A#5': { holes: [0, 0, 0, 1, 1, 1] },
      B5: { holes: [0, 1, 0, 0, 1, 1] },
      C6: { holes: [0, 0, 0, 0, 1, 1], hint: 'Front all open, both thumbs still down.' },
      // The top four notes are what the thumb holes are for: the front runs out of area at
      // C6, so the last major third comes off the back.
      'C#6': { holes: [0, 1, 0, 0, 0, 1], hint: THUMBS_OFF },
      D6: { holes: [0, 0, 0, 0, 0, 1], hint: THUMBS_OFF },
      'D#6': { holes: [0, 1, 0, 0, 0, 0], hint: THUMBS_OFF },
      E6: { holes: [0, 0, 0, 0, 0, 0], hint: 'Everything open — the highest note.' },
    },
  },

  /*
   * Twelve-hole single-chamber transverse, the "sweet potato": eight finger holes, two subholes for
   * the notes under the tonic, two thumb holes behind. From STL Ocarina's "A Complete Fingering
   * Chart for 12 Hole Tenor and Soprano Ocarinas" (c) 2008, which writes A3 to F5 and puts a tenor
   * an octave above written — hence the A4-F6 here.
   *
   * The finger names below are not on the chart: they come from matching the order the diagrams lift
   * holes in against Pure Ocarinas' prose account. A reading rather than a quotation, which is why no
   * hint tells you to move a named finger.
   */
  ocarina_12: {
    name: 'Ocarina, 12-hole transverse (alto C)',
    shortName: '12-hole ocarina',
    key: 'C',
    layout: {
      kind: 'ocarina',
      height: 88,
      // Rotated, because the eight finger holes lie along the body rather than across it. Wide
      // enough that the right pinky hole, which sits nearest the tip, keeps a visible margin of
      // body around it.
      body: { cx: 50, cy: 40, rx: 48, ry: 22, rotate: -28 },
      // Positions are the chart's own, scaled equally in both axes; the radii keep its proportions
      // but are a fifth smaller. STL prints the four holes of a hand almost touching, and at the
      // size these diagrams render, faithful spacing made each hand one green blob.
      holes: [
        { x: 84, y: 18, r: 4.6, label: 'Right pinky' },
        { x: 74, y: 24, r: 4.6, label: 'Right ring' },
        { x: 56, y: 27, r: 2.9, label: 'Right subhole' },
        { x: 40, y: 29, r: 4.6, label: 'Left pinky' },
        { x: 65, y: 33, r: 4.6, label: 'Right middle' },
        { x: 35, y: 40, r: 4.6, label: 'Left ring' },
        { x: 60, y: 46, r: 4.6, label: 'Right index' },
        { x: 27, y: 49, r: 4.6, label: 'Left middle' },
        { x: 16, y: 54, r: 4.6, label: 'Left index' },
        { x: 34, y: 57, r: 2.9, label: 'Left subhole' },
        { x: 72, y: 67, r: 3.7, label: 'Right thumb, on the back', back: true },
        { x: 36, y: 79, r: 3.9, label: 'Left thumb, on the back', back: true },
      ],
    },
    fingering: {
      A4: { holes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], hint: 'Every hole closed — the lowest note.' },
      // The two notes under the tonic, which is what the subholes are there for: no finger
      // leaves its own hole for either of them.
      'A#4': { holes: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], hint: SUBHOLES },
      B4: { holes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], hint: SUBHOLES },
      C5: { holes: [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1], hint: 'The tonic: both subholes open, all ten fingers down.' },
      'C#5': { holes: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], hint: CROSS_SUBHOLE },
      D5: { holes: [0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1] },
      'D#5': { holes: [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], hint: CROSS_SUBHOLE },
      E5: { holes: [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1] },
      F5: { holes: [0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1] },
      'F#5': { holes: [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1], hint: CROSS_RING },
      G5: { holes: [0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1] },
      'G#5': { holes: [0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1], hint: CROSS_RING },
      A5: { holes: [0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1] },
      'A#5': { holes: [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1], hint: CROSS_RING },
      B5: { holes: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1] },
      C6: { holes: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1], hint: 'The whole front open, both thumbs still down.' },
      // The second octave, which the thumbs pay for one at a time. One hole stays covered
      // through all of it: the left pinky is holding the instrument, not stopping a note.
      'C#6': { holes: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0], hint: CROSS_RING },
      D6: { holes: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0], hint: THUMBS_OFF },
      'D#6': { holes: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], hint: CROSS_RING },
      E6: { holes: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], hint: THUMBS_OFF },
      F6: { holes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], hint: 'Everything open, left pinky and all — the highest note.' },
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
  ocarina_6: buildInstrument('ocarina_6', DEFINITIONS.ocarina_6),
  ocarina_12: buildInstrument('ocarina_12', DEFINITIONS.ocarina_12),
}

export const INSTRUMENT_LIST: readonly Instrument[] = Object.values(INSTRUMENTS)

export const DEFAULT_INSTRUMENT_ID: InstrumentId = 'whistle_d'

/** `in` would also answer yes to inherited keys, so a saved "toString" would pass. */
export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === 'string'
    && Object.prototype.hasOwnProperty.call(INSTRUMENTS, value)
}

export function getFingering(instrument: Instrument, note: string): Fingering | null {
  return instrument.fingering[note] ?? null
}

/**
 * The widest stand-in still worth calling close, in semitones. Set by A6 on a 6-hole ocarina, a
 * fourth above the top of its chart: past a tritone the grip is a different tune, so no fingering
 * at all beats a wrong one.
 */
const NEAREST_LIMIT = 6

/**
 * What this instrument puts where `note` should go: `note` itself when it has a grip for it, else the
 * nearest note it does, or null when nothing is within `NEAREST_LIMIT`. Ties go to the lower note,
 * the easier of the two to blow.
 */
export function nearestFingered(instrument: Instrument, note: string): string | null {
  if (note in instrument.fingering) return note

  const midi = noteToMidi(note)
  if (midi === null) return null

  let nearest: string | null = null
  let distance = Number.POSITIVE_INFINITY

  // `notes` runs lowest first, so a strict `<` keeps the lower of two equally distant notes.
  for (const candidate of instrument.notes) {
    const gap = Math.abs((noteToMidi(candidate) ?? 0) - midi)
    if (gap < distance) {
      nearest = candidate
      distance = gap
    }
  }

  return distance <= NEAREST_LIMIT ? nearest : null
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
