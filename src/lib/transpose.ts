import { midiToNote, NOTE_NAMES, noteToMidi } from './music'

/** Octaves searched either side of a candidate shift. Headroom for a tune pasted far from home. */
const OCTAVE_SEARCH = 3

/** `D` or `Bb` to 0-11, or null if it will not parse. Any octave will do; only the class is used. */
export function pitchClass(key: string): number | null {
  const midi = noteToMidi(`${key.trim()}4`)
  return midi === null ? null : ((midi % 12) + 12) % 12
}

/**
 * Semitones from one key to another, normalised into ±6 so it is the shorter way round: G to C is +5, not -7.
 * Same key either way, but the smaller number stays nearer the written register.
 */
export function keyShift(from: string, to: string): number {
  const start = pitchClass(from)
  const end = pitchClass(to)
  if (start === null || end === null) return 0

  const raw = (((end - start) % 12) + 12) % 12
  return raw > 6 ? raw - 12 : raw
}

/** Always spelled with sharps, the same as everything else that names a pitch here. */
export function transposeNote(note: string, semitones: number): string {
  const midi = noteToMidi(note)
  return midi === null ? note : midiToNote(midi + semitones)
}

/** `G` moved by -5 is `D`. */
export function transposeKey(key: string, semitones: number): string {
  const start = pitchClass(key)
  if (start === null) return key
  return NOTE_NAMES[(((start + semitones) % 12) + 12) % 12] ?? key
}

export interface ShiftChoice {
  semitones: number
  /** How many of the notes the instrument can finger once moved by that much. */
  playable: number
}

/**
 * How far to move a melody so an instrument can actually play it. `preferred` is the shift into the
 * instrument's own key, usually diatonic and so easiest to finger — but only a preference, a whistle in D
 * playing in G all day. That and no shift are tried at every octave, and note count decides. A melody that
 * already fits is left exactly as written.
 */
export function bestShift(
  notes: readonly string[],
  preferred: number,
  canPlay: (note: string) => boolean,
): ShiftChoice {
  const candidates = new Set<number>()
  for (let octave = -OCTAVE_SEARCH; octave <= OCTAVE_SEARCH; octave++) {
    candidates.add(octave * 12)
    candidates.add(preferred + octave * 12)
  }

  // The sort is the tie-break, so the loop below needs no second comparison. Whole octaves first, being the
  // one move that keeps the written key — an E dorian tune stays in E dorian rather than being pulled into
  // the whistle's D. Then the smallest move, and on a tie the downward one.
  const ordered = [...candidates].sort(
    (left, right) =>
      Number(left % 12 !== 0) - Number(right % 12 !== 0)
      || Math.abs(left) - Math.abs(right)
      || left - right,
  )

  let best: ShiftChoice = { semitones: 0, playable: -1 }
  for (const semitones of ordered) {
    const playable = notes.filter((note) => canPlay(transposeNote(note, semitones))).length
    if (playable > best.playable) best = { semitones, playable }
    // Nothing later can beat every note playable, and the order makes this the smallest such shift.
    if (best.playable === notes.length) break
  }

  return best
}
