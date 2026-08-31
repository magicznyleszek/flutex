import type { Instrument, InstrumentId } from './instruments'
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
   * The key the melody below is written in, as a pitch-class name.
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
   * from the keys and the range. The escape hatch: nothing in the library needs it today, and
   * it is here so that a song whose automatic arrangement lands badly can be pinned by hand
   * without teaching `bestShift` a special case.
   */
  overrides?: Readonly<Partial<Record<InstrumentId, number>>>
}

/**
 * `D5 A5:2 | F#5:0.5` — space-separated note names, `|` bar lines dropped, and an
 * optional `:beats` suffix that defaults to one beat.
 *
 * Nothing is validated here, because the songs below are written by hand and a typo in one
 * fails the test suite. Text a user pasted goes through `parseCustomSong`, which checks it.
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

interface SongInput {
  id: string
  title: string
  subtitle?: string
  tags?: readonly string[]
  key: string
  spec: string
  overrides?: Readonly<Partial<Record<InstrumentId, number>>>
}

const defineSong = ({ id, title, subtitle, tags = [], key, spec, overrides }: SongInput): Song => ({
  id,
  title,
  ...(subtitle === undefined ? {} : { subtitle }),
  tags,
  key,
  notes: parseNotes(spec),
  ...(overrides === undefined ? {} : { overrides }),
})

// Every song stays inside D5-D6 and skips C5 and F5, so it plays on both the tin
// whistle in D and the soprano recorder. That is why none of them needs transposing today —
// `songForInstrument` leaves a melody alone when the instrument can already play it, and these
// were all written to fit. It matters for the ocarinas and for a pasted custom song, which can
// arrive in any key.
export const SONGS: readonly Song[] = [
  defineSong({
    id: 'd-major-scale',
    title: 'D major scale',
    subtitle: 'Exercise — up and down',
    tags: ['exercise', 'easy'],
    key: 'D',
    spec: 'D5 E5 F#5 G5 A5 B5 C#6 D6 | C#6 B5 A5 G5 F#5 E5 D5:2',
  }),

  defineSong({
    id: 'd-major-arpeggio',
    title: 'D major arpeggio',
    subtitle: 'Exercise — interval leaps',
    tags: ['exercise', 'easy'],
    key: 'D',
    spec: 'D5 F#5 A5 D6 | A5 F#5 D5:2 | D5 A5 F#5 D6 | A5 F#5 D5:2',
  }),

  defineSong({
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    subtitle: 'Traditional, D major',
    tags: ['folk', 'easy'],
    key: 'D',
    spec: `
      D5 D5 A5 A5 B5 B5 A5:2 | G5 G5 F#5 F#5 E5 E5 D5:2
      A5 A5 G5 G5 F#5 F#5 E5:2 | A5 A5 G5 G5 F#5 F#5 E5:2
      D5 D5 A5 A5 B5 B5 A5:2 | G5 G5 F#5 F#5 E5 E5 D5:2
    `,
  }),

  defineSong({
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    subtitle: 'Ludwig van Beethoven, D major',
    tags: ['classical', 'easy'],
    key: 'D',
    spec: `
      F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5 D5 E5 F#5 | F#5:1.5 E5:0.5 E5:2
      F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5 D5 E5 F#5 | E5:1.5 D5:0.5 D5:2
    `,
  }),

  defineSong({
    id: 'jingle-bells',
    title: 'Jingle Bells',
    subtitle: 'Chorus, D major',
    tags: ['seasonal', 'easy'],
    key: 'D',
    spec: `
      F#5 F#5 F#5:2 | F#5 F#5 F#5:2 | F#5 A5 D5 E5 F#5:4
      G5 G5 G5 G5:2 | G5 F#5 F#5 F#5:2 | F#5 E5 E5 F#5 E5:2 A5:2
    `,
  }),

  defineSong({
    id: 'concerning-hobbits',
    title: 'Concerning Hobbits',
    subtitle: 'The Shire theme, Howard Shore',
    tags: ['film', 'medium'],
    key: 'D',
    spec: `
      D5 E5:0.5 F#5:0.5 A5 G5 F#5 D5
      E5 F#5:0.5 G5:0.5 F#5 E5 D5 D5
      A5 B5 A5:2
    `,
  }),

  defineSong({
    id: 'happy-birthday',
    title: 'Happy Birthday',
    subtitle: 'G major',
    tags: ['occasion', 'medium'],
    key: 'G',
    spec: `
      D5:0.5 D5:0.5 E5 D5 G5 F#5:2
      D5:0.5 D5:0.5 E5 D5 A5 G5:2
      D5:0.5 D5:0.5 D6 B5 G5 A5 G5:2
      C6:0.5 C6:0.5 B5 G5 A5 G5:2
    `,
  }),

  defineSong({
    id: 'amazing-grace',
    title: 'Amazing Grace',
    subtitle: 'Traditional, G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | G5:2 E5 | D5:3
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | B5:3
      D6 | B5:2 D6:0.5 B5:0.5 | G5:2 E5 | D5:3
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | G5:3
    `,
  }),
]

export const DEFAULT_SONG_ID = 'd-major-scale'

/**
 * The song a user types in themselves, which is not in `SONGS` — it is parsed out of saved text
 * on every load, and there is only ever one of it. Everything that keys off a song id treats
 * this as just another id, `isSongId` included, so the picker can select it.
 */
export const CUSTOM_SONG_ID = 'custom'

export function findSong(id: string | null | undefined): Song | null {
  return SONGS.find((entry) => entry.id === id) ?? null
}

const FIRST_SONG = SONGS[0]
if (FIRST_SONG === undefined) throw new Error('The song library is empty')

export const DEFAULT_SONG: Song = findSong(DEFAULT_SONG_ID) ?? FIRST_SONG

/**
 * Falls back to the default song so the UI always has something to render. `CUSTOM_SONG_ID` is
 * not in the library and falls back with everything else, so a caller that offers the custom
 * song has to reach for `parseCustomSong` before asking here.
 */
export function getSong(id: string | null | undefined): Song {
  return findSong(id) ?? DEFAULT_SONG
}

/**
 * The `value is string` narrowing does nothing at the type level. The guard exists to fit
 * the `isValid` callbacks, which reject an id that is no longer in the library.
 */
export function isSongId(value: string): value is string {
  return value === CUSTOM_SONG_ID || findSong(value) !== null
}

/** Takes an `Arrangement` as happily as a `Song`, since the notes are all it reads. */
export function songNoteNames(song: Pick<Song, 'notes'>): readonly string[] {
  return song.notes.map((entry) => entry.note)
}

/** A song as one instrument will actually play it. */
export interface Arrangement {
  notes: readonly SongNote[]
  /** Semitones the melody was moved by. Zero means it is played exactly as written. */
  semitones: number
  /** The key it sounds in after the move. */
  key: string
}

/**
 * Fits a song to an instrument, moving it in semitones only if that lets the instrument play
 * more of the notes. A song already inside the range comes back untouched, which is every song
 * in the library on a whistle or recorder — the point of this is a pasted melody, which arrives
 * in whatever key and octave its author wrote it in.
 *
 * An `overrides` entry short-circuits the search, including an explicit `0` meaning "leave it
 * alone even though something could be gained" — hence `??` rather than a truthiness check.
 */
export function songForInstrument(song: Song, instrument: Instrument): Arrangement {
  const override = song.overrides?.[instrument.id]
  const semitones = override ?? bestShift(
    songNoteNames(song),
    keyShift(song.key, instrument.key),
    (note) => note in instrument.fingering,
  ).semitones

  if (semitones === 0) return { notes: song.notes, semitones, key: song.key }

  return {
    notes: song.notes.map((entry) => ({ ...entry, note: transposeNote(entry.note, semitones) })),
    semitones,
    key: transposeKey(song.key, semitones),
  }
}
