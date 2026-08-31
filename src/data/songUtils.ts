/**
 * What a song *is* — the shape, the spec-string reader, and how a song is fitted to one
 * instrument. The songs themselves live in `songs.ts`, which imports `defineSong` from here.
 *
 * The split is one-way on purpose. Everything in this file is about a single song and knows
 * nothing about the library, so the library can import it while it is still being built. Put a
 * lookup over `SONGS` in here and the two files would import each other, which for a module whose
 * top level calls `defineSong` means a half-initialised import and a crash on load rather than a
 * warning.
 */
import { type Instrument, type InstrumentId, nearestFingered } from './instruments'
import { bestShift, keyShift, transposeKey, transposeNote } from '../lib/transpose'

export interface SongNote {
  note: string
  /** Length in beats. A UI hint only — rhythm is never enforced. */
  beats: number
}

export interface Song {
  /** Saved progress is keyed by these ids, so renaming one resets that song's history. */
  id: string
  title: string
  subtitle?: string
  tags: readonly string[]
  /**
   * The key the melody is written in, as a pitch-class name.
   *
   * Notes are stored at concert pitch — the pitch a piano would play — rather than as scale
   * degrees, because with the key recorded alongside them the degree is recoverable from the
   * note and nothing is gained by storing it the other way round. What the key buys is knowing
   * which way to transpose: `keyShift` from here to the instrument's key is the move most
   * likely to leave the melody diatonic and so easy to finger.
   */
  key: string
  notes: readonly SongNote[]
  /**
   * A shift in semitones to use on one particular instrument, instead of the one worked out
   * from the keys and the range. The escape hatch, for a song whose automatic arrangement lands
   * badly, so that it can be pinned by hand without teaching `bestShift` a special case.
   * "Concerning Hobbits" uses it to stay in D on the ocarinas, which cannot reach its top notes
   * in any key, so there is nothing to be bought by moving it — a zero here is as much an
   * instruction as any other number.
   */
  overrides?: Readonly<Partial<Record<InstrumentId, number>>>
}

/**
 * The song a user types in themselves, which is not in `SONGS` — it is parsed out of saved text
 * on every load, and there is only ever one of it. Everything that keys off a song id treats
 * this as just another id, `isSongId` included, so the picker can select it.
 */
export const CUSTOM_SONG_ID = 'custom'

/**
 * `D5 A5:2 | F#5:0.5` — space-separated note names, `|` bar lines dropped, and an
 * optional `:beats` suffix that defaults to one beat.
 *
 * Nothing is validated here, because the library is written by hand and a typo in one song fails
 * the test suite. Text a user pasted goes through `parseCustomSong`, which checks it.
 */
export function parseNotes(spec: string): readonly SongNote[] {
  return spec
    .trim()
    .split(/\s+/)
    .filter((token) => token !== '|' && token.length > 0)
    .map((token) => {
      const [note = '', beats] = token.split(':')
      return { note, beats: beats === undefined ? 1 : Number(beats) }
    })
}

export interface SongInput {
  id: string
  title: string
  subtitle?: string
  tags?: readonly string[]
  key: string
  spec: string
  overrides?: Readonly<Partial<Record<InstrumentId, number>>>
}

/**
 * One library entry, written as a spec string rather than a note array. The optional fields are
 * spread in conditionally rather than assigned, so an entry without a subtitle has no `subtitle`
 * key at all instead of one set to `undefined`.
 */
export const defineSong = (
  { id, title, subtitle, tags = [], key, spec, overrides }: SongInput,
): Song => ({
  id,
  title,
  ...(subtitle === undefined ? {} : { subtitle }),
  tags,
  key,
  notes: parseNotes(spec),
  ...(overrides === undefined ? {} : { overrides }),
})

/** Takes an `Arrangement` as happily as a `Song`, since the notes are all it reads. */
export function songNoteNames(song: Pick<Song, 'notes'>): readonly string[] {
  return song.notes.map((entry) => entry.note)
}

/** A note the melody asks for that the instrument cannot finger, and the grip put there instead. */
export interface Approximation {
  /** The note as the melody has it, after any transposition. */
  written: string
  /** The nearest note the instrument does have a grip for. */
  played: string
}

/** A song as one instrument will actually play it. */
export interface Arrangement {
  notes: readonly SongNote[]
  /** Semitones the melody was moved by. Zero means it is played exactly as written. */
  semitones: number
  /** The key it sounds in after the move. */
  key: string
  /**
   * Every note swapped for a nearby one because the instrument has no grip for it,
   * deduplicated, in the order the melody first reaches them. Empty for a song that fits, which
   * is nearly all of them. Notes too far outside the range for even that are left as written and
   * turn up in `unplayableNotes` instead.
   */
  approximations: readonly Approximation[]
}

/**
 * Fits a song to an instrument in two steps: move the whole melody if that lets the instrument
 * play more of it, then swap whatever notes are still out of reach for the nearest ones there
 * are grips for.
 *
 * The swap is not cosmetic. `notes` is what the trainer waits for, what the charts draw and what
 * **Hear it** plays, so a note with no grip used to be a wall — the fingering slot showed a
 * warning, the pitch detector's search band did not even extend to that note, and the song could
 * not be got past. A near note is playable and audibly close, and `approximations` is how the UI
 * says so rather than passing it off as the melody.
 *
 * An `overrides` entry short-circuits the shift search, including an explicit `0` meaning "leave
 * it alone even though something could be gained" — hence `??` rather than a truthiness check.
 */
export function songForInstrument(song: Song, instrument: Instrument): Arrangement {
  const override = song.overrides?.[instrument.id]
  const semitones = override ?? bestShift(
    songNoteNames(song),
    keyShift(song.key, instrument.key),
    (note) => note in instrument.fingering,
  ).semitones

  const shifted = semitones === 0
    ? song.notes
    : song.notes.map((entry) => ({ ...entry, note: transposeNote(entry.note, semitones) }))

  // Collected per distinct note rather than per position: the same note out of range in eight
  // places is one thing to tell the player about, and one lookup rather than eight.
  const swaps = new Map<string, string>()
  for (const { note } of shifted) {
    if (note in instrument.fingering || swaps.has(note)) continue
    const nearest = nearestFingered(instrument, note)
    if (nearest !== null) swaps.set(note, nearest)
  }

  return {
    // The array is only rebuilt when there is something to swap, so a song that needed neither
    // step comes back as the very same notes it was written with — which is what keeps the memo
    // downstream from rebuilding the note row, and through it restarting the song.
    notes: swaps.size === 0
      ? shifted
      : shifted.map((entry) => {
          const swap = swaps.get(entry.note)
          return swap === undefined ? entry : { ...entry, note: swap }
        }),
    semitones,
    key: semitones === 0 ? song.key : transposeKey(song.key, semitones),
    approximations: [...swaps].map(([written, played]) => ({ written, played })),
  }
}
