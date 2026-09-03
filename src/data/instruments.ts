import { midiToNote, noteToMidi } from '../lib/music'

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
  | 'ocarina_6_soprano'
  | 'ocarina_12'

/**
 * Where a hole sits in the diagram: 100 units wide, `y` growing down, `OcarinaLayout.height` tall.
 *
 * The radius is per hole because open *area* sets a vessel flute's pitch, so on a pendant size is the
 * only thing telling one hole from another. Derive it from the fingerings — printed charts are
 * schematics, not drawn to scale.
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
  /**
   * The neck the mouthpiece is on, drawn behind the body so the two read as one shape. It gives the
   * drawing a right way up, which on a pendant is the whole fingering: four front holes, four sizes.
   *
   * Both ocarinas point it down, deliberately opposite to the tube charts. An ocarina's finger holes
   * face away from the player — hence the `back` thumbs — so its chart is the view from in front, the
   * way every source drawing has it, including the printed chart that ships with these.
   */
  neck?: { cx: number, width: number, top: number, bottom: number }
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
   * Tonic of the scale it plays without accidentals. A key to transpose *towards* rather than a
   * constraint — a whistle in D plays in G all day — which is all `bestShift` uses it for.
   */
  key: string
  layout: Layout
  fingering: Readonly<Record<string, Fingering>>
  /**
   * The same instrument in another size: same grips and drawing, every note at a fixed offset. Kept
   * out of the set the song library is written for — see `BASE_INSTRUMENTS`.
   */
  variantOf?: InstrumentId
}

export interface Instrument extends InstrumentDefinition {
  id: InstrumentId
  /** Sorted from the lowest pitch up. */
  notes: readonly string[]
  holeCount: number
}

const OVERBLOWN = 'Second register — same fingering, stronger breath.'

// The thumb turns the second register on in two steps: right off the hole for C#6-D#6, back on as a
// slit from E6 up. Every chart consulted draws the line there, and half-covering at D6 gets nothing.
const THUMB_OFF = 'Second register. The thumb comes right off the hole — from E6 up it is only cracked open.'
const PINCHED = 'Second register. Crack the thumb hole open into a narrow slit, not half uncovered.'

// A half hole and a fork both look like mistakes in a diagram, so they say so in words.
const HALF_HOLE = 'Half-hole: leave half of it open. Recorders with a split hole 6 or 7 do it by closing one of the pair.'
const FORKED = 'Forked: hole 2 is open while 3 and 4 stay down. That gap is deliberate.'

// An ocarina is fingered by open area, not a run down a tube, so these name the odd grips out.
const HALF_COVER = 'Slide the finger to leave about half the hole open, rather than lifting it.'

// The only fingering on the chart that opens one hole, and it is the biggest — so it is both the
// easiest to play on the wrong hole and the one that tells a player which hole is which.
const BIGGEST_HOLE = 'One hole only, and it is the biggest on the instrument: the left middle finger, the further of that pair from the mouthpiece.'
const THUMBS_OFF = 'Top of the range: the front is already open, so the thumb holes go next.'
const SUBHOLES = 'Below the tonic. Only a subhole opens — every finger stays where it was.'
const CROSS_SUBHOLE = 'Cross-fingered: the note above it, with the right subhole put back down.'
const CROSS_RING = 'Cross-fingered: the note above it, with the right ring hole put back down.'

/** Every instrument written out by hand. Variants are derived from these below, so they cannot drift. */
const DEFINITIONS: Record<Exclude<InstrumentId, 'ocarina_6_soprano'>, InstrumentDefinition> = {
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
      // Second register. D6 has its own grip; the rest repeat first-register holes with more breath.
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

  // Baroque (also sold as English) fingering, what nearly every soprano outside German-speaking
  // countries uses. The tell in the hand is which hole is bored wider: 5 here, 4 on the German one.
  recorder: {
    name: 'Soprano recorder (baroque fingering)',
    shortName: 'Baroque recorder',
    key: 'C',
    layout: { kind: 'tube', hasThumb: true },
    fingering: {
      // First octave from Dolmetsch's freely copyable "Baroque / English Recorder Fingering Chart"
      // (c) 2001. Lander's Recorder Home Page agrees on G#5 and A#5, the two most likely to differ.
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      'C#5': { holes: [1, 1, 1, 1, 1, 1, 1, 0.5], hint: HALF_HOLE },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      'D#5': { holes: [1, 1, 1, 1, 1, 1, 0.5, 0], hint: HALF_HOLE },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // The fork that is the whole difference between the two systems: hole 5 open, 6 and 7 closed.
      // The other way round makes this a German chart. Checked against five makers' charts.
      F5: { holes: [1, 1, 1, 1, 1, 0, 1, 1] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 0] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      // German closes hole 6 here instead of half-covering. Lander says the note is often out of
      // tune either way, which is the instrument's fault rather than the chart's.
      'G#5': { holes: [1, 1, 1, 0, 1, 1, 0.5, 0], hint: HALF_HOLE },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      'A#5': { holes: [1, 1, 0, 1, 1, 0, 0, 0], hint: FORKED },
      B5: { holes: [1, 1, 0, 0, 0, 0, 0, 0] },
      C6: { holes: [1, 0, 1, 0, 0, 0, 0, 0] },
      'C#6': { holes: [0, 1, 1, 0, 0, 0, 0, 0] },
      D6: { holes: [0, 0, 1, 0, 0, 0, 0, 0], hint: THUMB_OFF },
      // The rest of the second register, per Mollenhauer, Moeck, Prescott and Dolmetsch. A#6 is left
      // out — four charts, four grips — and C7 is the last note that does not need the bell on a knee.
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
   * German fingering, Peter Harlan's 1920s redesign: a wider hole 4 gives an unforked F, and the fork
   * moves to F#. Still about a third of European sopranos, and identical in the hand, so a baroque
   * chart on one sounds wrong. Written out in full rather than spread from the table above, so it can
   * be read against its source; `tests/data.test.ts` pins the divergences.
   */
  recorder_german: {
    name: 'Soprano recorder (German fingering)',
    shortName: 'German recorder',
    key: 'C',
    layout: { kind: 'tube', hasThumb: true },
    fingering: {
      // Accidentals from Dolmetsch's "German Recorder Fingering Chart" (c) 2001. Three of four match
      // baroque: the wider hole 4 only bites where a fingering leans on hole 4 or 5.
      C5: { holes: [1, 1, 1, 1, 1, 1, 1, 1] },
      'C#5': { holes: [1, 1, 1, 1, 1, 1, 1, 0.5], hint: HALF_HOLE },
      D5: { holes: [1, 1, 1, 1, 1, 1, 1, 0] },
      'D#5': { holes: [1, 1, 1, 1, 1, 1, 0.5, 0], hint: HALF_HOLE },
      E5: { holes: [1, 1, 1, 1, 1, 1, 0, 0] },
      // The unforked F the whole system is built around, and the F# that pays for it.
      F5: { holes: [1, 1, 1, 1, 1, 0, 0, 0] },
      'F#5': { holes: [1, 1, 1, 1, 0, 1, 1, 1] },
      G5: { holes: [1, 1, 1, 1, 0, 0, 0, 0] },
      // The only first-octave divergence not about F: hole 6 goes down where baroque half-covers it.
      'G#5': { holes: [1, 1, 1, 0, 1, 1, 1, 0] },
      A5: { holes: [1, 1, 1, 0, 0, 0, 0, 0] },
      'A#5': { holes: [1, 1, 0, 1, 1, 0, 0, 0], hint: FORKED },
      B5: { holes: [1, 1, 0, 0, 0, 0, 0, 0] },
      C6: { holes: [1, 0, 1, 0, 0, 0, 0, 0] },
      'C#6': { holes: [0, 1, 1, 0, 0, 0, 0, 0] },
      D6: { holes: [0, 0, 1, 0, 0, 0, 0, 0], hint: THUMB_OFF },
      'D#6': { holes: [0, 0, 1, 1, 1, 1, 1, 0], hint: THUMB_OFF },
      E6: { holes: [0.5, 1, 1, 1, 1, 1, 0, 0], hint: PINCHED },
      // The wider hole 4 again: F6, F#6 and G#6 are the second-register notes German plays
      // differently, per Mollenhauer's and Yamaha's German charts.
      F6: { holes: [0.5, 1, 1, 1, 1, 0, 0, 0], hint: PINCHED },
      'F#6': { holes: [0.5, 1, 1, 1, 0, 1, 0, 1], hint: PINCHED },
      G6: { holes: [0.5, 1, 1, 1, 0, 0, 0, 0], hint: PINCHED },
      'G#6': { holes: [0.5, 1, 1, 1, 0, 1, 1, 1], hint: PINCHED },
      A6: { holes: [0.5, 1, 1, 0, 0, 0, 0, 0], hint: PINCHED },
      // A note short of the baroque chart: the German charts consulted end here, and hole sizes
      // differ, so a borrowed C7 would be a guess rather than a fingering.
      B6: { holes: [0.5, 1, 1, 0, 1, 1, 0, 0], hint: PINCHED },
    },
  },

  /*
   * Six-hole pendant on John Taylor's 1964 system: four finger holes in a 2x2, two thumb holes behind.
   * Fingerings from STL Ocarina's "A Complete Fingering Chart for 6 Hole Ocarina in C Major" (c) 2020;
   * finger names from the same maker's "How to Hold and Clean the Ocarina", which is the only place
   * saying whose left the chart is drawn from. The player's: index fingers nearest the mouthpiece.
   *
   * Hole sizes are worked out from the fingerings, not copied off the printed diagram. Pitch rises
   * with total open area, so the grips force right middle < right index < left index and left middle >
   * right middle + right index; areas 4, 1, 3, 2 are the smallest whole numbers that fit and leave
   * every note D5-C6 one unit apart, so a hole transcribed wrong breaks the run. Radii are their
   * square roots. Copying the schematic instead is what made this instrument unplayable — it draws
   * the two big holes as the bottom pair when in the hand they are the left pair.
   *
   * C5-E6 is a reading: the chart's staff runs C4-E5 and only says the real pitch is higher. That is
   * the pendant sold as alto C; smaller ones play the same grips higher — see `PENDANT_SOPRANO`.
   */
  ocarina_6: {
    name: 'Ocarina, 6-hole pendant (alto C)',
    shortName: '6-hole ocarina',
    key: 'C',
    layout: {
      kind: 'ocarina',
      height: 114,
      // Nudged down off the top edge: at cy 44 the outline sat flush with the viewBox and read as a
      // body cropped by the card.
      body: { cx: 50, cy: 46, rx: 38, ry: 43 },
      // Starts inside the body so the two merge, narrow enough to pass between the thumb holes.
      neck: { cx: 50, width: 18, top: 80, bottom: 110 },
      // Squeezed left: the left middle hole is four times the area of the right middle one and still
      // has to fit inside the same body.
      holes: [
        { x: 33, y: 28, r: 13, label: 'Left middle' },
        { x: 71, y: 28, r: 6.5, label: 'Right middle' },
        { x: 33, y: 60, r: 11.3, label: 'Left index' },
        { x: 68, y: 60, r: 9.2, label: 'Right index' },
        { x: 20, y: 100, r: 9.2, label: 'Left thumb, on the back', back: true },
        { x: 80, y: 100, r: 9.2, label: 'Right thumb, on the back', back: true },
      ],
    },
    fingering: {
      C5: { holes: [1, 1, 1, 1, 1, 1], hint: 'Every hole closed — the lowest note.' },
      'C#5': { holes: [1, 0.5, 1, 1, 1, 1], hint: HALF_COVER },
      D5: { holes: [1, 0, 1, 1, 1, 1] },
      'D#5': { holes: [1, 0, 1, 0.5, 1, 1], hint: HALF_COVER },
      E5: { holes: [1, 1, 1, 0, 1, 1] },
      F5: { holes: [1, 0, 1, 0, 1, 1] },
      'F#5': { holes: [0, 1, 1, 1, 1, 1], hint: BIGGEST_HOLE },
      G5: { holes: [0, 0, 1, 1, 1, 1] },
      'G#5': { holes: [0, 1, 1, 0, 1, 1] },
      A5: { holes: [0, 0, 1, 0, 1, 1] },
      'A#5': { holes: [0, 0, 0, 1, 1, 1] },
      B5: { holes: [0, 1, 0, 0, 1, 1] },
      C6: { holes: [0, 0, 0, 0, 1, 1], hint: 'Front all open, both thumbs still down.' },
      // What the thumb holes are for: the front runs out of area at C6, so the last major third
      // comes off the back.
      'C#6': { holes: [0, 1, 0, 0, 0, 1], hint: THUMBS_OFF },
      D6: { holes: [0, 0, 0, 0, 0, 1], hint: THUMBS_OFF },
      'D#6': { holes: [0, 1, 0, 0, 0, 0], hint: THUMBS_OFF },
      E6: { holes: [0, 0, 0, 0, 0, 0], hint: 'Everything open — the highest note.' },
    },
  },

  /*
   * Twelve-hole single-chamber transverse, the "sweet potato": eight finger holes, two subholes for the
   * notes under the tonic, two thumb holes behind. From STL Ocarina's "A Complete Fingering Chart for
   * 12 Hole Tenor and Soprano Ocarinas" (c) 2008, which writes A3-F5 for a tenor sounding an octave
   * above — hence A4-F6 here.
   *
   * Finger names come from the booklet that ships with these, which adds what a chart of a transverse
   * cannot show: the left hand approaches from below, the right from above.
   */
  ocarina_12: {
    name: 'Ocarina, 12-hole transverse (alto C)',
    shortName: '12-hole ocarina',
    key: 'C',
    layout: {
      kind: 'ocarina',
      height: 88,
      // Rotated: the eight finger holes lie along the body, not across it. Wide enough to leave a
      // margin of body around the right pinky hole, which sits nearest the tip.
      body: { cx: 50, cy: 40, rx: 48, ry: 22, rotate: -28 },
      // A spout where the chart's own outline dips into one: off the middle of the underside, between
      // the thumb holes. Starts well inside the slanted body, or a corner of it shows through.
      neck: { cx: 56, width: 12, top: 54, bottom: 85 },
      // Positions are the chart's own, scaled evenly; radii keep its proportions but are a fifth
      // smaller. At the size these render, faithful spacing made each hand one green blob.
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
      // What the subholes are for: neither note takes a finger off its own hole.
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
      // The second octave, paid for one thumb at a time. The left pinky stays down throughout — it is
      // holding the instrument, not stopping a note.
      'C#6': { holes: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0], hint: CROSS_RING },
      D6: { holes: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0], hint: THUMBS_OFF },
      'D#6': { holes: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], hint: CROSS_RING },
      E6: { holes: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], hint: THUMBS_OFF },
      F6: { holes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], hint: 'Everything open, left pinky and all — the highest note.' },
    },
  },
}

/** The same chart at another pitch. Grips, hints and drawing are shared; only the note names move. */
function resize(
  definition: InstrumentDefinition,
  variantOf: InstrumentId,
  semitones: number,
  name: string,
  shortName: string,
): InstrumentDefinition {
  return {
    ...definition,
    name,
    shortName,
    variantOf,
    fingering: Object.fromEntries(
      Object.entries(definition.fingering).map(
        ([note, grip]) => [midiToNote((noteToMidi(note) ?? 0) + semitones), grip],
      ),
    ),
  }
}

/*
 * Measured off a recording of one: covered and blown normally it sounds 1040 Hz, eleven cents under
 * C6, which is the alto's grips an octave up. Covered-to-open came out 15.2 semitones against the
 * chart's 16, and overblowing moves it 1.9, so no reading off it is worth more than that.
 *
 * Given its own octave rather than the alto's transposed on paper: E7 (2637 Hz) is above where the
 * alto's detector looks, which is why the top of this one used to read as subharmonics.
 */
const PENDANT_SOPRANO = resize(
  DEFINITIONS.ocarina_6,
  'ocarina_6',
  12,
  'Ocarina, 6-hole pendant (soprano C)',
  '6-hole soprano',
)

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
  ocarina_6_soprano: buildInstrument('ocarina_6_soprano', PENDANT_SOPRANO),
  ocarina_12: buildInstrument('ocarina_12', DEFINITIONS.ocarina_12),
}

export const INSTRUMENT_LIST: readonly Instrument[] = Object.values(INSTRUMENTS)

/**
 * The instruments the song library is written for. A variant barely overlaps its own parent, so
 * counting it towards `SHARED_NOTES` would cut those ten notes to four. Songs still reach a variant —
 * `songForInstrument` moves them by the octave the sizes differ by.
 */
export const BASE_INSTRUMENTS: readonly Instrument[] = INSTRUMENT_LIST.filter(
  (instrument) => instrument.variantOf === undefined,
)

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
 * The widest stand-in still worth calling close, in semitones. Set by A6 on a 6-hole ocarina: past a
 * tritone the grip is a different tune, so no fingering at all beats a wrong one.
 */
const NEAREST_LIMIT = 6

/**
 * `note` itself if the instrument has a grip for it, else the nearest note it does, or null when
 * nothing is within `NEAREST_LIMIT`. Ties go to the lower note, the easier of the two to blow.
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
 * The playable range in hertz, padded so out-of-tune playing still lands inside it. This is the band
 * of lags the detector searches.
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
