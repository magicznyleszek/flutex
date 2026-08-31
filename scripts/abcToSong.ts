/**
 * Prints the `defineSong` block for an ABC tune, the same one the **Copy song definition** button in
 * the app gives you. Here for tunes that live in a file rather than a paste:
 *
 *   npm run song -- tune.abc
 *   pbpaste | npm run song
 *
 * The block comes from `songDefinition`; what this adds is the report around it — which instrument
 * would struggle, what each would put in place of a note it cannot finger, and whether the id is
 * already taken.
 */
import { readFileSync } from 'node:fs'

import { parseCustomSong } from '../src/data/customSong'
import { INSTRUMENT_LIST, nearestFingered } from '../src/data/instruments'
import { SHARED_NOTES, songDefinition } from '../src/data/songDefinition'
import { SONGS } from '../src/data/songs'
import { songForInstrument } from '../src/data/songUtils'
import { noteToMidi } from '../src/lib/music'
import { transposeNote } from '../src/lib/transpose'

const WIDTH = 98
const LABEL = 13

/**
 * Wraps a note so its continuation lines up under the column the labels set. A label wider than the
 * column keeps its one space and pushes the first line right — instrument names are longer than
 * anything else that goes here.
 */
function say(label: string, text: string): void {
  const lines: string[] = []
  let current = ''

  for (const word of text.split(' ')) {
    const candidate = current === '' ? word : `${current} ${word}`
    if (current !== '' && candidate.length > WIDTH - LABEL - 2) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current !== '') lines.push(current)

  lines.forEach((line, at) => {
    const column = at === 0 ? `${label} ` : ''
    console.log(`  ${column.padEnd(LABEL)}${line}`)
  })
}

function main(): void {
  const path = process.argv[2]
  if (path === undefined && process.stdin.isTTY === true) {
    console.log('Usage: npm run song -- tune.abc   (or pipe ABC in on stdin)')
    process.exitCode = 1
    return
  }

  const text = readFileSync(path === undefined || path === '-' ? 0 : path, 'utf8')

  const parsed = parseCustomSong(text)
  if (!parsed.ok) {
    console.error(`Cannot read that tune: ${parsed.error}`)
    process.exitCode = 1
    return
  }

  const { song } = parsed
  const definition = songDefinition(text, song)
  const shifted = song.notes.map((note) => ({
    ...note,
    note: transposeNote(note.note, definition.semitones),
  }))
  const midis = shifted.map((note) => noteToMidi(note.note) ?? 0)

  console.log(`\n${definition.title} — ${song.notes.length} notes, written in ${song.key}\n`)

  say('Fit', definition.semitones === 0
    ? 'left as written'
    : `moved ${definition.semitones > 0 ? '+' : ''}${definition.semitones} semitones, `
      + `sounds in ${definition.key}`)
  say('Range', `${Math.max(...midis) - Math.min(...midis)} semitones across `
    + `${new Set(shifted.map((note) => note.note)).size} distinct notes`)

  // The check worth having is not "is every note in the shared set" but "does the app arrange it as
  // written", which is the property `tests/data.test.ts` pins on every song in the library.
  const trouble = INSTRUMENT_LIST
    .map((instrument) => ({
      instrument,
      arrangement: songForInstrument({ ...song, notes: shifted, key: definition.key }, instrument),
    }))
    .filter(({ arrangement }) =>
      arrangement.semitones !== 0 || arrangement.approximations.length > 0)

  if (trouble.length === 0) {
    say('Instruments', 'plays as written on all five, nothing approximated')
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
      say(note, INSTRUMENT_LIST
        .filter((instrument) => !(note in instrument.fingering))
        .map((entry) => `${entry.shortName} plays ${nearestFingered(entry, note) ?? 'nothing'}`)
        .join('; '))
    }
  }

  // `parseAbc` treats every repeat mark as a plain bar line, so a tune with an AABB shape comes out
  // as AB. Worth saying, since the fix is manual and the output looks complete either way.
  const repeats = text.match(/\|:|:\||::|\[[12]/g) ?? []
  if (repeats.length > 0) {
    say('Repeats', `${repeats.length} repeat marks in the source, read as plain bar lines — every `
      + 'section appears once below. Duplicate the bars by hand if you want them played twice.')
  }

  if (SONGS.some((entry) => entry.id === definition.id)) {
    say('Id taken', `"${definition.id}" is already in the library, and saved progress is keyed by `
      + 'id. Pick another one.')
  }

  say('Tags', `in use: ${[...new Set(SONGS.flatMap((entry) => entry.tags))].sort().join(', ')}.`)

  const fill = definition.needsTitle ? 'title, subtitle and tags' : 'subtitle and tags'
  console.log(`\nPaste into src/data/songs.ts, then fill in the ${fill}:\n`)
  console.log(definition.block)
  console.log()
}

main()
