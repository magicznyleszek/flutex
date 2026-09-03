/**
 * What a song *is* — the shape, the spec-string reader, and how a song is fitted to one instrument. The
 * songs themselves live under `songs/`, whose files import `defineSong` from here.
 *
 * Nothing here may reach for `SONGS`: every file under `songs/` calls `defineSong` at its top level, so a
 * cycle would be a crash on load rather than a warning.
 */
import { type Instrument, type InstrumentId, nearestFingered } from './instruments'
import { bestShift, keyShift, transposeKey, transposeNote } from '../lib/transpose'

export interface SongNote {
  note: string
  /** Length in beats. A UI hint only — rhythm is never enforced. */
  beats: number
}

/**
 * The sections the library is written in and the groups the picker draws, in display order, roughly
 * easiest to hardest. One file under `songs/` per entry, walked by `songs/index.ts` to build `SONGS` — so
 * the order lives only here, and a song cannot end up under the wrong heading.
 */
export const SONG_CATEGORIES = [
  { slug: 'exercises', label: 'Exercises' },
  { slug: 'first-tunes', label: 'First tunes' },
  { slug: 'songs-and-airs', label: 'Songs and airs' },
  { slug: 'carols', label: 'Carols' },
  { slug: 'english-dance', label: 'English dance tunes' },
  { slug: 'irish-scottish', label: 'Irish and Scottish' },
  { slug: 'old-time', label: 'American old-time' },
  { slug: 'game-themes', label: 'Game themes' },
  { slug: 'from-recordings', label: 'From recordings' },
  { slug: 'second-octave', label: 'Second octave' },
] as const

export type SongCategory = typeof SONG_CATEGORIES[number]['slug']

export interface Song {
  /** Saved progress is keyed by these ids, so renaming one resets that song's history. */
  id: string
  title: string
  subtitle?: string
  /**
   * Stamped on by `songs/index.ts` from the file the song was written in. Optional because the custom song
   * belongs to no section: it is not in `SONGS` at all.
   */
  category?: SongCategory
  tags: readonly string[]
  /**
   * A pitch-class name; the notes themselves are stored at concert pitch. What the key buys is a direction to
   * transpose in — `keyShift` to the instrument's key usually leaves the melody diatonic, and easy to finger.
   */
  key: string
  notes: readonly SongNote[]
  /**
   * A shift to use on one instrument in place of the searched one, for a song whose automatic arrangement
   * lands badly. A zero instructs as much as any other number — it is how "Concerning Hobbits" stays in D on
   * the ocarinas.
   */
  overrides?: Readonly<Partial<Record<InstrumentId, number>>>
}

/**
 * The song a user types in themselves: parsed out of saved text on every load, never in `SONGS`, and only
 * ever one. Everything keying off a song id treats this as just another id, so the picker can select it.
 */
export const CUSTOM_SONG_ID = 'custom'

/**
 * `D5 A5:2 | F#5:0.5` — space-separated note names, `|` bar lines dropped, an optional `:beats` suffix
 * defaulting to one. Nothing is validated: the library has the test suite, and pasted text goes through
 * `parseCustomSong` instead.
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
 * One library entry, written as a spec string rather than a note array. Optional fields are spread in
 * conditionally, so an entry without a subtitle has no `subtitle` key rather than an undefined one.
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

/** A note the melody asks for that the instrument cannot finger, and the nearest grip put there instead. */
export interface Approximation {
  /** The note as the melody has it, after any transposition. */
  written: string
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
   * Every note swapped for a nearby one for want of a grip, deduplicated, in the order the melody first
   * reaches them. Empty for nearly every song. A note too far out even for that is left as written, and shows
   * up in `unplayableNotes` instead.
   */
  approximations: readonly Approximation[]
}

/**
 * Fits a song to an instrument in two steps: move the whole melody if that lets the instrument play more of
 * it, then swap whatever notes are still out of reach for the nearest ones it can finger.
 *
 * The swap is not cosmetic. `notes` is what the trainer waits for, what the charts draw and what **Hear it**
 * plays, so a note with no grip used to be a wall the song could not be got past; `approximations` is how the
 * UI owns up to it rather than passing it off as the melody.
 *
 * `??`, not a truthiness check: an `overrides` entry of `0` means "leave it alone".
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

  // Per distinct note, not per position: the same note out of range in eight places is one thing to tell the
  // player about, and one lookup rather than eight.
  const swaps = new Map<string, string>()
  for (const { note } of shifted) {
    if (note in instrument.fingering || swaps.has(note)) continue
    const nearest = nearestFingered(instrument, note)
    if (nearest !== null) swaps.set(note, nearest)
  }

  return {
    // A song that needed neither step comes back as the very same array, which keeps the memo downstream from
    // rebuilding the note row and through it restarting the song.
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
