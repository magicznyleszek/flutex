/**
 * The report the song scripts print around a `defineSong` block: how the melody had to be moved to fit the
 * charts, which instrument would struggle, and what is still to be filled in by hand.
 *
 * Whatever is specific to one source — repeat marks in ABC, the detector's confidence in a recording — each
 * script says for itself, in between the calls below.
 */
import { MAX_NOTES } from '../src/data/customSong'
import { BASE_INSTRUMENTS, nearestFingered } from '../src/data/instruments'
import { SHARED_NOTES, type SongDefinition } from '../src/data/songDefinition'
import { SONGS } from '../src/data/songs'
import { SONG_CATEGORIES, songForInstrument, type Song } from '../src/data/songUtils'
import { noteToMidi } from '../src/lib/music'
import { transposeNote } from '../src/lib/transpose'

/** Roughly where the source itself wraps, and so where a terminal reading it should too. */
export const WIDTH = 98
const LABEL = 13

/** `1 note`, `2 notes`. Spell the plural out where a trailing `s` will not do — `stretch`, `silence`. */
export const count = (many: number, noun: string, plural = `${noun}s`): string =>
  `${many} ${many === 1 ? noun : plural}`

/**
 * The sentence for a melody longer than a library entry may be, or null. Worth its own words: otherwise
 * `parseCustomSong` refuses it and the script calls its own output a bug.
 */
export const tooLong = (notes: number): string | null =>
  notes <= MAX_NOTES
    ? null
    : `\n${notes} notes is past the ${MAX_NOTES} a library entry may hold, so there is no block to `
      + 'print. What you have handed over is a whole soundtrack, or one long enough to be; a song in '
      + 'the library is a single tune. Cut the file down to the section you want and run that.\n'

/** Greedy fill on spaces. Tokens are never broken, so a note keeps its `:beats` whole. */
export function wrap(text: string, width: number): readonly string[] {
  const lines: string[] = []
  let current = ''

  for (const word of text.split(' ')) {
    const candidate = current === '' ? word : `${current} ${word}`
    if (current !== '' && candidate.length > width) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current !== '') lines.push(current)

  return lines
}

/**
 * Wraps a note so its continuation lines up under the column the labels set. A label wider than the column
 * keeps its one space and pushes the first line right — instrument names do this.
 */
export function say(label: string, text: string): void {
  wrap(text, WIDTH - LABEL - 2).forEach((line, at) => {
    const column = at === 0 ? `${label} ` : ''
    console.log(`  ${column.padEnd(LABEL)}${line}`)
  })
}

/** What the arrangement search made of the melody, and what each chart would do with the result. */
export function reportArrangement(song: Song, definition: SongDefinition): void {
  const shifted = song.notes.map((note) => ({
    ...note,
    note: transposeNote(note.note, definition.semitones),
  }))
  const midis = shifted.map((note) => noteToMidi(note.note) ?? 0)

  say('Fit', definition.semitones === 0
    ? 'left as written'
    : `moved ${definition.semitones > 0 ? '+' : ''}${count(definition.semitones, 'semitone')}, `
      + `sounds in ${definition.key}`)
  say('Range', `${count(Math.max(...midis) - Math.min(...midis), 'semitone')} across `
    + count(new Set(shifted.map((note) => note.note)).size, 'distinct note'))

  // The check worth having is not "is every note in the shared set" but "does the app arrange it as written",
  // the property `tests/data.test.ts` pins on every song. Base instruments only: a size variant costs an
  // octave by definition, so listing it would flag every candidate.
  const trouble = BASE_INSTRUMENTS
    .map((instrument) => ({
      instrument,
      arrangement: songForInstrument({ ...song, notes: shifted, key: definition.key }, instrument),
    }))
    .filter(({ arrangement }) =>
      arrangement.semitones !== 0 || arrangement.approximations.length > 0)

  if (trouble.length === 0) {
    say('Instruments', `plays as written on all ${BASE_INSTRUMENTS.length}, nothing approximated`)
  } else {
    for (const { instrument, arrangement } of trouble) {
      const swaps = arrangement.approximations.map((swap) => `${swap.written}→${swap.played}`)
      say(instrument.shortName, [
        arrangement.semitones === 0 ? 'as written' : `wants ${arrangement.semitones} semitones`,
        swaps.length === 0 ? 'nothing approximated' : `approximates ${swaps.join(', ')}`,
      ].join(', '))
    }
  }

  if (definition.strays.length > 0) {
    say('Out of range', `${definition.strays.join(' ')} — no shift puts the whole tune on `
      + `${SHARED_NOTES.join(' ')}, the notes every chart shares. This one needs editing, or an `
      + 'overrides entry and an exemption in tests/data.test.ts, or a different tune.')
    for (const note of definition.strays) {
      say(note, BASE_INSTRUMENTS
        .filter((instrument) => !(note in instrument.fingering))
        .map((entry) => `${entry.shortName} plays ${nearestFingered(entry, note) ?? 'nothing'}`)
        .join('; '))
    }
  }
}

/** The bits that are about the library rather than the tune: a clashing id, and what to fill in. */
export function reportLibrary(definition: SongDefinition): void {
  if (SONGS.some((entry) => entry.id === definition.id)) {
    say('Id taken', `"${definition.id}" is already in the library, and saved progress is keyed by `
      + 'id. Pick another one.')
  }

  say('Tags', `in use: ${[...new Set(SONGS.flatMap((entry) => entry.tags))].sort().join(', ')}.`)
  say('Sections', `one file each under src/data/songs/, and the file decides the category: `
    + `${SONG_CATEGORIES.map((category) => category.label).join(', ')}.`)
}

export function printBlock(definition: SongDefinition): void {
  const fill = definition.needsTitle ? 'title, subtitle and tags' : 'subtitle and tags'
  console.log(`\nPaste into the file for its section, then fill in the ${fill}:\n`)
  console.log(definition.block)
  console.log()
}
