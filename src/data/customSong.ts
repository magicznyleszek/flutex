import { parseAbc } from '../lib/abc'
import { NOTE_NAMES, noteToMidi } from '../lib/music'
import { CUSTOM_SONG_ID, parseNotes, type Song } from './songUtils'

export type CustomSongResult =
  | { ok: true, song: Song }
  | { ok: false, error: string }

/** What the picker calls it, and the title a tune without one falls back to. */
export const CUSTOM_SONG_TITLE = 'My own song'

/**
 * Stands in whenever the pasted text does not parse. Everything downstream expects a song at
 * all times, and an empty note list is the honest version of "nothing to play yet" — the
 * trainer shows the error in place of the fingerings instead.
 */
export const EMPTY_CUSTOM_SONG: Song = {
  id: CUSTOM_SONG_ID,
  title: CUSTOM_SONG_TITLE,
  tags: [],
  key: 'C',
  notes: [],
}

/**
 * An ABC information field — `X:`, `T:`, `K:` — at the start of any line. Our own note list
 * cannot look like this: its lengths are written `D5:2`, so the colon never lands second.
 */
const ABC_FIELD = /^[A-Za-z]:/m

/** Which of the two formats a paste is in. Exported so nothing else has to guess the same way. */
export const isAbc = (text: string): boolean => ABC_FIELD.test(text)

/** One melody, not a tune book. Long enough for anything you would sit down and learn. */
const MAX_NOTES = 2000

function fail(error: string): CustomSongResult {
  return { ok: false, error }
}

/**
 * The key a note list is read as, guessed from its first note. Only ever a hint for
 * transposing — a melody that already fits the instrument is left alone whatever this says —
 * and melodies do usually start on a note of their own scale.
 */
function guessKey(note: string): string {
  const midi = noteToMidi(note)
  if (midi === null) return 'C'

  return NOTE_NAMES[((midi % 12) + 12) % 12] ?? 'C'
}

function fromNoteList(text: string): CustomSongResult {
  const notes = parseNotes(text)
  const first = notes[0]
  if (first === undefined) {
    return fail('No notes in there. A melody is a list of note names, like `D5 E5 F#5 G5`.')
  }
  if (notes.length > MAX_NOTES) {
    return fail(`That is over ${MAX_NOTES} notes. One melody at a time.`)
  }

  for (const { note, beats } of notes) {
    if (noteToMidi(note) === null) {
      return fail(
        `"${note}" is not a note name. Write a letter A-G, then # or b if you need one, then `
        + 'the octave number — F#5, Bb4, D5.',
      )
    }
    if (!Number.isFinite(beats) || beats <= 0) {
      return fail(`I cannot read how long "${note}" is. Lengths go after a colon: ${note}:1.5.`)
    }
  }

  const key = guessKey(first.note)

  return {
    ok: true,
    song: {
      id: CUSTOM_SONG_ID,
      title: CUSTOM_SONG_TITLE,
      subtitle: `Yours — ${notes.length} notes, read as ${key}`,
      tags: [],
      key,
      notes,
    },
  }
}

function fromAbc(text: string): CustomSongResult {
  const result = parseAbc(text)
  if (!result.ok) return result

  const { title, key, notes } = result.tune
  if (notes.length > MAX_NOTES) {
    return fail(`That is over ${MAX_NOTES} notes. One tune at a time.`)
  }

  return {
    ok: true,
    song: {
      id: CUSTOM_SONG_ID,
      // A tune's own `T:` is better than "My own song" everywhere the title is shown, including
      // the message you get for playing it all the way through.
      title: title ?? CUSTOM_SONG_TITLE,
      subtitle: `Yours — ABC notation, key of ${key}`,
      tags: [],
      key,
      notes,
    },
  }
}

/**
 * Reads pasted text as a song, in ABC notation or the plain note list the library is written in.
 * Which one is decided by looking for an ABC information field, so a tune copied off the web works
 * unedited and a bare note list needs no header.
 *
 * Failure is a sentence to show the user, never a throw — bad input is the normal case here.
 */
export function parseCustomSong(text: string): CustomSongResult {
  if (text.trim() === '') {
    return fail('Nothing to play yet. Type a melody in the box under the song picker.')
  }

  return isAbc(text) ? fromAbc(text) : fromNoteList(text)
}
