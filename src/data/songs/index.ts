/**
 * The song library, assembled from one file per category, plus the lookups that need all of them at once.
 * What a song *is*, and how one is fitted to an instrument, lives in `../songUtils.ts`.
 *
 * The tunes are traditional or out of copyright bar the "Game themes" and "From recordings" sections, which
 * those files account for; each subtitle names its source, mostly ABC transcriptions from the Nottingham
 * Music Database. The entries are compiled output, not hand-typed: paste a tune into **My own song** and
 * `songDefinition.ts` hands you the block, transposition and all, or run `npm run song` / `song:midi` /
 * `song:audio` over a source file.
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
import { FROM_RECORDINGS } from './fromRecordings'
import { GAME_THEMES } from './gameThemes'
import { IRISH_SCOTTISH } from './irishScottish'
import { OLD_TIME } from './oldTime'
import { SECOND_OCTAVE } from './secondOctave'
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
  'game-themes': GAME_THEMES,
  'from-recordings': FROM_RECORDINGS,
  'second-octave': SECOND_OCTAVE,
}

// Every song outside "Second octave" is written inside D5-E6 on the ten notes every chart shares — the D
// major scale plus C natural, a tin whistle in D intersected with a 6-hole ocarina. That is what lets every
// instrument play them as written, `songForInstrument` leaving a melody alone when it can already be played.
// A tune that did not fit was transposed until it did, or left out.
//
// Bar two: "Concerning Hobbits", transcribed from the film rather than chosen to fit, whose high section
// reaches F#6 and A6 past both ocarinas; and "A Blast Of Wind", nineteen semitones wide against a window of
// fourteen, so each instrument takes its own shift.
//
// Walked in `SONG_CATEGORIES` order, so the picker's grouping and ordering both follow from that list, and
// each song's `category` is stamped on here — which leaves the file name as the only place it is written.
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
 * Falls back to the default song so the UI always has something to render. `CUSTOM_SONG_ID` is not in
 * the library and falls back too, so a caller offering the custom song calls `parseCustomSong` first.
 */
export function getSong(id: string | null | undefined): Song {
  return findSong(id) ?? DEFAULT_SONG
}

/**
 * The `value is string` narrowing does nothing at the type level. The guard exists to fit the `isValid`
 * callbacks, which reject an id that is no longer in the library.
 */
export function isSongId(value: string): value is string {
  return value === CUSTOM_SONG_ID || findSong(value) !== null
}
