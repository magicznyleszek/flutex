/**
 * The song library, assembled from one file per category, plus the lookups that need all of them at
 * once. What a song *is*, and how one is fitted to an instrument, lives in `../songUtils.ts`.
 *
 * The tunes are traditional or old enough to be out of copyright, and each subtitle names its
 * source. Most were read off ABC transcriptions in the Nottingham Music Database.
 *
 * The entries themselves are compiled output, not hand-typed: `songDefinition.ts` turns an ABC tune
 * into one, transposition and all. Paste a tune into **My own song** and the app offers you the
 * block, then it goes in the file its section is named for.
 */
import {
  CUSTOM_SONG_ID,
  SONG_CATEGORIES,
  type Song,
  type SongCategory,
} from '../songUtils'
import { CAROLS } from './carols'
import { ENGLISH_DANCE } from './englishDance'
import { EXERCISES } from './exercises'
import { FIRST_TUNES } from './firstTunes'
import { IRISH_SCOTTISH } from './irishScottish'
import { OLD_TIME } from './oldTime'
import { SONGS_AND_AIRS } from './songsAndAirs'

/**
 * Which file holds each category. A `Record` keyed by the slug rather than a list of pairs, so a
 * category added to `SONG_CATEGORIES` without a file of its own is a compile error here.
 */
const BY_CATEGORY: Readonly<Record<SongCategory, readonly Song[]>> = {
  exercises: EXERCISES,
  'first-tunes': FIRST_TUNES,
  'songs-and-airs': SONGS_AND_AIRS,
  carols: CAROLS,
  'english-dance': ENGLISH_DANCE,
  'irish-scottish': IRISH_SCOTTISH,
  'old-time': OLD_TIME,
}

// All but two of these are written inside D5-E6 on the ten notes all five charts share — the D major
// scale plus C natural, which is a tin whistle in D intersected with a 6-hole ocarina. That is what
// lets every instrument play the library as written, since `songForInstrument` leaves a melody alone
// when the instrument can already play it: a tune that did not fit that set was transposed until it
// did, or left out.
//
// The two are "Concerning Hobbits", transcribed from the film rather than chosen to fit, whose high
// section reaches F#6 and A6 past both ocarinas; and "A Blast Of Wind", which spans nineteen
// semitones against a window of fourteen, so each instrument takes its own shift. The shift search
// is really there for pasted custom songs, which arrive in any key and any octave.
//
// Walked in `SONG_CATEGORIES` order, which is what makes the picker's grouping and the order songs
// are listed in follow from the category list alone — there is no order here to get wrong. Each
// song's `category` is stamped on here as well, so a file's name is the only place it is written.
export const SONGS: readonly Song[] = SONG_CATEGORIES.flatMap(
  (category) => BY_CATEGORY[category.slug].map((song) => ({ ...song, category: category.slug })),
)

export const DEFAULT_SONG_ID = 'd-major-scale'

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
