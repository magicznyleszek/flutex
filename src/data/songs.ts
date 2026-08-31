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
   * from the keys and the range. The escape hatch, for a song whose automatic arrangement lands
   * badly, so that it can be pinned by hand without teaching `bestShift` a special case.
   * "Concerning Hobbits" uses it to stay in D on the ocarinas, which cannot reach its top notes
   * in any key, so there is nothing to be bought by moving it — a zero here is as much an
   * instruction as any other number.
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

// Every song but "Concerning Hobbits" stays inside D5-D6 and skips C5 and F5, so it plays on the
// tin whistle in D and on both recorders with nothing for the transposer to do —
// `songForInstrument` leaves a melody alone when the instrument can already play it, and these
// were written to fit. That one is a transcription rather than a melody written to order, and its
// high section reaches F#6 and A6: the whistle and the recorders have both, the ocarinas have
// neither, and it stays in D there anyway by way of `overrides` — the high phrases lean on the
// nearest grips the ocarina does have rather than the whole tune changing key. A pasted custom
// song, which can arrive in any key and any octave, is what the shift search is really for.
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

  // The one song here transcribed from a recording rather than written to fit the charts, so it
  // is also the one that outgrows an instrument: the high section reaches F#6 and A6, past both
  // ocarinas, which play the nearest notes they have there. No lengths, because the transcription
  // is a list of pitches — which costs nothing in a trainer that waits for each note and only
  // feeds `beats` to the beat count and playback.
  defineSong({
    id: 'concerning-hobbits',
    title: 'Concerning Hobbits',
    subtitle: 'The Shire theme, Howard Shore',
    tags: ['film', 'medium'],
    key: 'D',
    // Left in D on the ocarinas rather than let the search drop it into C. The shift would buy
    // back the nine F#6s and cost the whole tune its key, which is not a trade to make on an
    // instrument this melody was transcribed on: the low two thirds is what an ocarina can play
    // of it, and it should be there in the key it was learnt in. The high section flattens onto
    // the top of the chart instead, and the song card names the swaps.
    overrides: { ocarina_6: 0, ocarina_12: 0 },
    spec: `
      D5 E5 F#5 A5 F#5 E5 D5
      F#5 A5 B5 D6 C#6 A5 F#5 E5
      D5 E5 F#5 A5 F#5 E5 D5
      F#5 A5 B5 A5 F#5 E5 D5
      D6 E6 F#6 F#6 F#6 A6 E6 D6 E6
      A5 B5 C#6 C#6 D6 A5 F#5 A5 E5
      D6 E6 F#6 F#6 A6 F#6 E6 E6
      F#6 E6 D6 D6 D6 F#6
      D6 E6 F#6 E6 D6 E6
      D5 E5 F#5
      F#5 B5 C#6 D6 C#6 A5 F#5 E5
      D5 E5 F#5 B5 C#6 D6 C#6 B5 A5 E5 D5
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
