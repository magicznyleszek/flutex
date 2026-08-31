import { midiToNote, NOTE_NAMES, noteToMidi } from './music'

/**
 * How many octaves either side of a candidate shift the search looks. Three is already past
 * the range of every chart here — it exists so that a melody written far from where an
 * instrument lives still finds its way in, rather than to be reached.
 */
const OCTAVE_SEARCH = 3

/** `D` or `Bb` to 0-11, or null if it will not parse. Any octave will do; only the class is used. */
export function pitchClass(key: string): number | null {
  const midi = noteToMidi(`${key.trim()}4`)
  return midi === null ? null : ((midi % 12) + 12) % 12
}

/**
 * Semitones from one key to another, normalised into ±6 so the answer is always the shorter way
 * round: G to C comes out as +5 rather than -7. The two are the same key, but the smaller number
 * is the one that leaves a melody near the register it was written in.
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
 * How far to move a melody so that an instrument can actually play it.
 *
 * `preferred` is the shift that puts the melody in the instrument's own key, which is the one
 * most likely to come out diatonic and so the easiest to finger. It is a preference and not an
 * answer, because the key an instrument is built in describes its range rather than the music it
 * is for — a whistle in D plays in G all day. So both that shift and no shift at all are tried,
 * each at every octave, and what decides it is how many notes the instrument can reach.
 *
 * Ties go to an octave first and then to the smallest move, so a melody that already fits is left
 * exactly as it was written and one that has to move keeps its key if it can. That is the common
 * case and deliberately so: transposing a song called "D major scale" into C major would be a
 * worse answer than doing nothing.
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

  // Sorting decides the tie-break, so the loop below needs no second comparison. Whole octaves
  // come first, since an octave is the one move that leaves a melody in the key it was written
  // in — an E dorian whistle tune is played in E dorian, an octave up, not pulled into D because
  // D is the whistle's key. Then the smallest move, and between an equal move up and down the
  // downward one, the lower register being the easier one to blow.
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
    // Nothing later can beat a shift that leaves every note playable, and this one is the
    // smallest such shift because of the order.
    if (best.playable === notes.length) break
  }

  return best
}
