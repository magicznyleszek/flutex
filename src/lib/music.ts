// Musical conversions: note name <-> MIDI <-> frequency.
// The module is pure (no imports), so it can be tested without a DOM.

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

const A4_HZ = 440
const A4_MIDI = 69

const BASE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const
const ACCIDENTALS = { '': 0, '#': 1, '##': 2, b: -1, bb: -2 } as const

type NoteLetter = keyof typeof BASE_SEMITONES
type Accidental = keyof typeof ACCIDENTALS

const NOTE_PATTERN = /^([A-G])(#{1,2}|b{1,2})?(-?\d+)$/

export interface DetectedNote {
  midi: number
  note: string
  cents: number
}

/** "F#5" -> 78. Returns null for an invalid name. */
export function noteToMidi(noteStr: unknown): number | null {
  const match = NOTE_PATTERN.exec(String(noteStr).trim())
  if (!match) return null

  const letter = match[1] as NoteLetter
  const accidental = (match[2] ?? '') as Accidental
  const octave = Number(match[3])

  return BASE_SEMITONES[letter] + ACCIDENTALS[accidental] + (octave + 1) * 12
}

/** 78 -> "F#5". Always spelled with sharps. */
export function midiToNote(midi: number): string {
  const rounded = Math.round(midi)
  // JS % returns negative results for negative operands, so normalise it.
  const pitchClass = ((rounded % 12) + 12) % 12
  const name = NOTE_NAMES[pitchClass] as (typeof NOTE_NAMES)[number]
  return `${name}${Math.floor(rounded / 12) - 1}`
}

export function midiToFreq(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

export function freqToMidi(hz: number): number {
  return 12 * Math.log2(hz / A4_HZ) + A4_MIDI
}

export function noteToFreq(noteStr: unknown): number | null {
  const midi = noteToMidi(noteStr)
  return midi === null ? null : midiToFreq(midi)
}

/** Deviation in cents between a measured and a reference frequency. */
export function centsBetween(hz: number, referenceHz: number): number {
  return 1200 * Math.log2(hz / referenceHz)
}

/** The nearest equal-tempered note together with the deviation from it. */
export function freqToNearestNote(hz: number): DetectedNote | null {
  if (!(hz > 0)) return null

  const midiFloat = freqToMidi(hz)
  const midi = Math.round(midiFloat)

  return {
    midi,
    note: midiToNote(midi),
    cents: (midiFloat - midi) * 100,
  }
}

/**
 * Deviation from the target note. Measured against the target rather than the
 * nearest note, so playing an octave up reads as +1200c. That is deliberate:
 * the tuner should show the player is far off, not that they nailed a
 * different octave.
 */
export function centsFromNote(hz: number, noteStr: string): number {
  const targetHz = noteToFreq(noteStr)
  if (targetHz === null || !(hz > 0)) return 0
  return centsBetween(hz, targetHz)
}

// Note-duration glyphs. Purely a UI hint — the trainer never enforces rhythm.
const DURATION_GLYPHS: readonly (readonly [number, string])[] = [
  [4, '𝅝'],
  [3, '𝅗𝅥.'],
  [2, '𝅗𝅥'],
  [1.5, '♩.'],
  [1, '♩'],
  [0.75, '♪.'],
  [0.5, '♪'],
  [0.25, '♬'],
]

export function beatsToGlyph(beats: number): string {
  if (!(beats > 0)) return ''
  const match = DURATION_GLYPHS.find(([value]) => beats >= value)
  return match ? match[1] : '♬'
}
