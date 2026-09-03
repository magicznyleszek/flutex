/**
 * Prints the `defineSong` block for a MIDI file:
 *
 *   npm run song:midi -- tune.mid
 *   npm run song:midi -- soundtrack.mid --part 2:0 --title "Overworld"
 *
 * The best of the three ways into the library, worth trying before `song:audio` when a file exists. Nothing
 * here is detected or estimated: the notes are integers, the lengths exact, the bar lines the file's own.
 *
 * What it cannot tell you is which part is the tune. It guesses the highest part that looks like a single
 * line and prints the rest, so reach for `--part` when the output sounds like an accompaniment — usually a
 * chord pad or countermelody sitting above the melody.
 */
import { readFileSync } from 'node:fs'

import {
  WIDTH,
  count,
  printBlock,
  reportArrangement,
  reportLibrary,
  say,
  tooLong,
  wrap,
} from './songReport'
import { parseCustomSong } from '../src/data/customSong'
import { songDefinition } from '../src/data/songDefinition'
import { midiToMelody, type MidiMelody, type MidiPart } from '../src/lib/midi'
import { midiToNote } from '../src/lib/music'

const USAGE = [
  'Usage: npm run song:midi -- tune.mid [options]',
  '',
  '  --part T:C        take this part instead of the one guessed, as the report numbers them',
  '  --skyline         ignore parts: take the highest note sounding anywhere in the file',
  '  --beats-per-bar N where the bar lines go (default: the file\'s time signature)',
  '  --grid BEATS      what onsets snap to (default 0.25, a sixteenth)',
  '  --min-rest BEATS  under this, a gap is how a note was released (default 0.25)',
  '  --title TEXT      the song title, and so its id',
].join('\n')

/** Numeric options, with the sanity range each is worth refusing outside of. */
const LIMITS = {
  'beats-per-bar': { low: 1, high: 32 },
  'grid': { low: 0.0625, high: 4 },
  'min-rest': { low: 0, high: 8 },
} as const

type Flag = keyof typeof LIMITS

/**
 * Share of a melody's lengths that may be rounded before the file is worth a warning. A sequenced tune
 * rounds almost nothing; a played-in performance rounds much of it, nobody holding exact sixteenths.
 */
const BENT_ENOUGH = 0.25

/**
 * Semitones a chosen part may span before the choice is worth doubting out loud. Two octaves is generous for
 * a tune — the whole song library fits in a tenth — so a part past it is a channel doing two jobs, ordinary
 * in game music: the lead, then an octave and a half down for a bass fill.
 */
const WIDE_PART = 24

interface Options {
  path: string
  title?: string
  skyline: boolean
  part?: { track: number, channel: number }
  numbers: Partial<Record<Flag, number>>
}

const isFlag = (name: string): name is Flag => name in LIMITS

/** `--flag value` and `--flag=value` both. Failure is a sentence, not a throw. */
function readArgs(
  argv: readonly string[],
): { ok: true, options: Options } | { ok: false, error: string } {
  const numbers: Partial<Record<Flag, number>> = {}
  let path: string | undefined
  let title: string | undefined
  let part: { track: number, channel: number } | undefined
  let skyline = false

  for (let at = 0; at < argv.length; at += 1) {
    const arg = argv[at] ?? ''

    if (!arg.startsWith('--')) {
      if (path !== undefined) return { ok: false, error: `One file at a time — got "${arg}" too.` }
      path = arg
      continue
    }

    const split = arg.indexOf('=')
    const name = (split < 0 ? arg.slice(2) : arg.slice(2, split)).toLowerCase()
    const inline = split < 0 ? undefined : arg.slice(split + 1)

    // Ahead of reading a value, or the one flag that takes none would eat the filename.
    if (name === 'skyline') {
      if (inline !== undefined) return { ok: false, error: '--skyline takes no value.' }
      skyline = true
      continue
    }

    const value = inline ?? argv[at + 1]
    if (inline === undefined) at += 1

    if (value === undefined || value === '') return { ok: false, error: `--${name} needs a value.` }

    if (name === 'title') {
      title = value
      continue
    }

    if (name === 'part') {
      const [track, channel] = value.split(':').map(Number)
      if (!Number.isInteger(track) || !Number.isInteger(channel)) {
        return { ok: false, error: `--part wants a track and channel like 2:0, not "${value}".` }
      }
      part = { track: track as number, channel: channel as number }
      continue
    }

    if (!isFlag(name)) return { ok: false, error: `I do not know --${name}.` }

    const { low, high } = LIMITS[name]
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < low || parsed > high) {
      return {
        ok: false,
        error: `--${name} wants a number between ${low} and ${high}, not "${value}".`,
      }
    }
    numbers[name] = parsed
  }

  if (path === undefined) return { ok: false, error: USAGE }

  return {
    ok: true,
    options: {
      path,
      skyline,
      ...(title === undefined ? {} : { title }),
      ...(part === undefined ? {} : { part }),
      numbers,
    },
  }
}

const named = (part: MidiPart): string =>
  `${part.track}:${part.channel}${part.name === '' ? '' : ` "${part.name}"`}`

/** Where the melody came from, and what else was on offer — the part only a MIDI source can report. */
function reportParts(melody: MidiMelody, asked: boolean): void {
  const share = melody.part === null ? 0 : Math.round(melody.part.share * 100)

  say('Melody', melody.part === null
    ? 'no part looked like a single line on its own, so this is the highest note sounding anywhere '
      + 'in the file at each moment, drums aside. Worth trying --part against the list below.'
    : asked
      ? `part ${named(melody.part)} as asked, at ${share}% of the file's notes.`
      : `part ${named(melody.part)} — the highest of the ${count(melody.parts.length, 'part')} that `
        + `looks like one line, at ${share}% of the file's notes. Pass --part if that is the wrong `
        + 'one.')

  for (const part of melody.parts) {
    const role = part.channel === 9 ? 'drums' : `${Math.round(part.overlap * 100)}% overlapping`
    say(named(part), `${count(part.notes, 'note')}, `
      + `${midiToNote(part.lowMidi)}-${midiToNote(part.highMidi)}, ${role}`
      + `${melody.part !== null && part === melody.part ? ' — taken' : ''}`)
  }

  const spread = melody.part === null ? 0 : melody.part.highMidi - melody.part.lowMidi
  if (spread > WIDE_PART) {
    say('Careful', `that part spans ${count(spread, 'semitone')}, which is too wide to be one `
      + 'singable line — most likely the channel plays the lead and doubles as something else '
      + 'between phrases, which is ordinary in game music. The tune is in there, but so is the '
      + 'other job, and the octave leaps below are the seam between them. Another --part, or an '
      + 'edit by hand, is what fixes it.')
  }
}

/** What had to be given up to make one writable line out of the file. */
function reportRounding(melody: MidiMelody): void {
  say('Timing', melody.bent === 0
    ? `every length landed exactly on one the format writes, at ${melody.ticksPerQuarter} ticks to `
      + 'the quarter'
    : `${Math.round(melody.bent * 100)}% of the lengths were rounded to something the format can `
      + `write${melody.bent > BENT_ENOUGH ? ' — high enough to suggest this was played in rather '
        + 'than sequenced, so try --grid 0.125 for finer detail, or --grid 0.5 for a plainer read'
        : ''}.`)

  if (melody.buried > 0) {
    say('Buried', `${count(melody.buried, 'note')} dropped for having something higher sounding at `
      + 'the same time. Chords cannot be written as one line, so the top of each is what survives.')
  }

  if (melody.rests > 0) {
    say('Rests', `${count(melody.rests, 'silence')} long enough to count as a rest, dropped — a spec `
      + 'has no rest. The time they took still counts towards the bar lines, so those fall where '
      + 'they fell. Shorter gaps went back to the note they were released from.')
  }

  if (melody.tempoChanges > 0) {
    say('Tempo', `${count(melody.tempoChanges, 'change')} of tempo after the opening `
      + `${melody.bpm} BPM. Lengths here are in beats, so the notes are unaffected — but the tune `
      + 'will play at one speed where the file changed speed.')
  }

  if (melody.barChanges > 0) {
    say('Metre', `${count(melody.barChanges, 'change')} of time signature after the opening `
      + `${melody.beatsPerBar} beats to the bar, which is the one used throughout here. The notes `
      + 'are right and the bar lines after the first change are not — they are a reading aid in this '
      + 'format, so it is the notes that matter, but do not trust them to mark phrases.')
  }
}

/** The melody at the pitch it was written, before the arrangement search moves it. */
function printHeard(melody: MidiMelody): void {
  console.log('\nWhat it read, at the pitch it was written — the app\'s own paste box takes this:\n')
  for (const line of wrap(melody.spec, WIDTH - 2)) console.log(`  ${line}`)
}

function main(): void {
  const args = readArgs(process.argv.slice(2))
  if (!args.ok) {
    console.log(args.error)
    process.exitCode = 1
    return
  }

  const { path, title, skyline, part, numbers } = args.options

  let bytes
  try {
    bytes = new Uint8Array(readFileSync(path))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }

  const result = midiToMelody(bytes, {
    skyline,
    ...(part === undefined ? {} : { part }),
    ...(numbers['beats-per-bar'] === undefined ? {} : { beatsPerBar: numbers['beats-per-bar'] }),
    ...(numbers.grid === undefined ? {} : { grid: numbers.grid }),
    ...(numbers['min-rest'] === undefined ? {} : { minRestBeats: numbers['min-rest'] }),
  })

  if (!result.ok) {
    console.error(`\nNothing to transcribe. ${result.error}\n`)
    process.exitCode = 1
    return
  }

  const melody = result.melody
  const parsed = parseCustomSong(melody.spec)
  // Not reachable from a MIDI read, every note being one `midiToNote` produced. Checked anyway: a script that
  // trusts its own output is how writer and reader drift apart unnoticed.
  if (!parsed.ok) {
    console.error(tooLong(melody.notes.length) ?? `The melody came out unreadable, which is a bug: ${parsed.error}`)
    process.exitCode = 1
    return
  }

  const song = title === undefined ? parsed.song : { ...parsed.song, title }
  const definition = songDefinition(melody.spec, song)

  console.log(`\n${definition.title} — ${count(song.notes.length, 'note')}, `
    + `written in ${song.key}\n`)

  say('File', `MIDI format ${melody.format}, ${count(melody.parts.length, 'part')}, `
    + `${melody.bpm} BPM, ${melody.beatsPerBar} beats to the bar`)

  reportParts(melody, part !== undefined)
  reportRounding(melody)
  reportArrangement(song, definition)
  reportLibrary(definition)

  printHeard(melody)
  printBlock(definition)
}

main()
