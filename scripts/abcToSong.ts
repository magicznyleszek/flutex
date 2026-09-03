/**
 * Prints the `defineSong` block for an ABC tune, the same one the app's **Copy song definition** button gives
 * you. Here for tunes that live in a file rather than a paste:
 *
 *   npm run song -- tune.abc
 *   pbpaste | npm run song
 *
 * The block comes from `songDefinition` and the report around it from `songReport`. What this adds is the one
 * thing only an ABC source has: repeat marks, which are played out rather than kept.
 *
 * For a recording instead of a tune in notation, see `audioToSong.ts`.
 */
import { readFileSync } from 'node:fs'

import { count, printBlock, reportArrangement, reportLibrary, say } from './songReport'
import { parseCustomSong } from '../src/data/customSong'
import { songDefinition } from '../src/data/songDefinition'

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

  console.log(`\n${definition.title} — ${count(song.notes.length, 'note')}, `
    + `written in ${song.key}\n`)

  reportArrangement(song, definition)

  // Repeats are played out rather than marked, so the spec is longer than its source — and the note count is
  // the first thing you would check against it.
  const repeats = text.match(/\|:|:\||::/g) ?? []
  if (repeats.length > 0) {
    say('Repeats', `${count(repeats.length, 'repeat mark')}, played out — the `
      + `${count(song.notes.length, 'note')} below are the tune end to end, not its sections once `
      + 'each.')
  }

  reportLibrary(definition)
  printBlock(definition)
}

main()
