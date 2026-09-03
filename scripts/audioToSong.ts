/**
 * Prints the `defineSong` block for a *recording*, where `abcToSong` wants the tune already written down:
 *
 *   npm run song:audio -- recording.mp3
 *   npm run song:audio -- humming.m4a --min-hz 150 --max-hz 900 --bpm 96
 *
 * A draft to edit, not an answer. Detection hears one note at a time, so a solo line transcribes and a mix
 * comes out as whatever single period the loudest thing in it had — read **Steadiness** and **Pitch** first.
 *
 * `--min-hz`/`--max-hz` matters most, every spare octave being another place to land an octave out. Measured
 * off the file otherwise, which on a mix means whichever voice autocorrelation found easiest, often its bass.
 * `--bpm` settles the other ambiguity: 60 with quarters and 120 with half notes fit the same playing.
 *
 * A note played twice separates only on an audible gap, so play the tune detached — and raise `--min-note` if
 * that comes out as rests.
 */
import { decodeAudio } from './decodeAudio'
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
import {
  suggestRange,
  transcribe,
  type SuggestedRange,
  type Transcription,
} from '../src/lib/transcribe'

const USAGE = [
  'Usage: npm run song:audio -- recording.mp3 [options]',
  '',
  '  --min-hz N        lowest pitch to look for (default: measured off the file)',
  '  --max-hz N        highest pitch to look for (default: measured off the file)',
  '  --bpm N           the tempo, instead of guessing one',
  '  --beats-per-bar N where the bar lines go (default 4)',
  '  --min-note MS     shortest thing worth writing, note or gap (default 70)',
  '  --clarity 0-1     how tone-like a frame must be to count (default 0.55)',
  '  --title TEXT      the song title, and so its id',
  '  --force           print the block even when the reading is not worth having',
].join('\n')

/** Numeric options, with the sanity range each is worth refusing outside of. */
const LIMITS = {
  'min-hz': { low: 20, high: 8000 },
  'max-hz': { low: 20, high: 8000 },
  'bpm': { low: 20, high: 400 },
  'beats-per-bar': { low: 1, high: 32 },
  'min-note': { low: 5, high: 2000 },
  'clarity': { low: 0, high: 1 },
} as const

type Flag = keyof typeof LIMITS

/**
 * Below this share of frames holding a pitch, nothing was transcribed — a solo recording runs well above
 * half, gaps between phrases included.
 */
const READABLE_VOICED = 0.3

/**
 * Stretches of steady pitch per note kept, above which the melody is an artefact of the pruning. A real line
 * settles at a few per note; tens of them mean the pitch never held still and what survived is whichever
 * fragments happened to be adjacent.
 */
const READABLE_CHURN = 12

/**
 * Share of a first pass's readings that has to fall inside the range measured off it; below this the range is
 * a pick between voices. Only counts when both bounds came from the measurement.
 *
 * Measured: a solo line scores 1.0, a chiptune 0.43 — and what the chiptune's range picked was its bass,
 * clean enough to pass both other checks. It is the failure that looks least like one: coherent, in range,
 * and not the tune.
 */
const READABLE_SHARE = 0.6

interface Options {
  path: string
  title?: string
  force: boolean
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
  let force = false

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
    if (name === 'force') {
      if (inline !== undefined) return { ok: false, error: '--force takes no value.' }
      force = true
      continue
    }

    const value = inline ?? argv[at + 1]
    if (inline === undefined) at += 1

    if (value === undefined || value === '') return { ok: false, error: `--${name} needs a value.` }

    if (name === 'title') {
      title = value
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
    options: { path, force, ...(title === undefined ? {} : { title }), numbers },
  }
}

/** `3:07`, and `0:04` rather than `4s`, so it reads like the player you found the file in. */
function clock(seconds: number): string {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** What the detector was given and what it made of it — the part `abcToSong` has no equivalent of. */
function reportListening(
  audio: { seconds: number, sampleRate: number, channels: number, via: string },
  melody: Transcription,
  asked: {
    minHz: number
    maxHz: number
    beatsPerBar: number
    bpm: number | undefined
    scan: SuggestedRange | null
  },
): void {
  say('Audio', `${clock(audio.seconds)} of ${audio.via}, ${audio.sampleRate} Hz`
    + `${audio.channels > 1 ? '' : ', mono'}`)
  say('Pitch', `looked between ${asked.minHz} and ${asked.maxHz} Hz, and `
    + `${Math.round(melody.voiced * 100)}% of ${count(melody.frames, 'frame')} held a note.`)

  if (asked.scan !== null) {
    say('Range', asked.scan.guessed
      ? `nothing steady enough to measure a range off — only ${count(asked.scan.readings, 'reading')}`
        + ' in a first pass, so those bounds are the defaults. Naming them with --min-hz and'
        + ' --max-hz is the one setting most worth getting right.'
      : `${asked.scan.minHz}-${asked.scan.maxHz} Hz chosen by a first pass over the file, holding `
        + `${Math.round(asked.scan.share * 100)}% of its ${count(asked.scan.readings, 'reading')}`
        + `${asked.scan.share < 0.6 ? ' — the rest were outside it, so more than one thing is '
          + 'sounding and this is a pick between them' : ''}. Override either side with --min-hz or `
        + '--max-hz if you know what made the sound.')
  }
  say('Tempo', asked.bpm === undefined
    ? `fitted at ${melody.bpm} BPM, ${asked.beatsPerBar} to the bar — an estimate, and half or `
      + 'twice it fits the same playing just as well, so pass --bpm if the lengths look doubled.'
    : `${melody.bpm} BPM as asked, ${asked.beatsPerBar} to the bar.`)

  if (melody.rests > 0) {
    say('Rests', `${count(melody.rests, 'silence')} long enough to count as a rest, dropped — a `
      + 'spec has no rest. The time they took still counts towards the bar lines, so those fall '
      + 'where they fell. Shorter gaps went back to the note they were tongued off.')
  }

  say('Steadiness', `${count(melody.rawRuns, 'stretch', 'stretches')} of steady pitch became `
    + `${count(melody.notes.length, 'note')}, ${churnOf(melody).toFixed(1)} to each. Over `
    + `${clock(audio.seconds)} that is ${Math.round(perMinute(melody, audio.seconds))} notes a `
    + 'minute, where a tune anyone plays runs from about sixty up.')
}

const churnOf = (melody: Transcription): number =>
  melody.rawRuns / Math.max(1, melody.notes.length)

const perMinute = (melody: Transcription, seconds: number): number =>
  seconds <= 0 ? 0 : melody.notes.length / (seconds / 60)

/**
 * Why this reading is not worth having, empty for one that is. The first two catch a mix from opposite ends:
 * almost no frame holds a pitch, or the pitch never stays put and the notes are whichever fragments pruning
 * welded together. The third catches the mix that fails neither, the detector having locked onto one voice
 * and that voice not being the melody.
 *
 * `spread` is passed only when the scan chose both bounds — a named bound is the caller steering, and their
 * range is not this measurement's to grade.
 */
function unreadable(melody: Transcription, spread: number | undefined): readonly string[] {
  const reasons: string[] = []

  if (melody.voiced < READABLE_VOICED) {
    reasons.push(`only ${Math.round(melody.voiced * 100)}% of it held a pitch at all`)
  }
  if (churnOf(melody) > READABLE_CHURN) {
    reasons.push(`the pitch never settled, at ${churnOf(melody).toFixed(0)} stretches per note kept`)
  }
  if (spread !== undefined && spread < READABLE_SHARE) {
    reasons.push(`the range I measured holds only ${Math.round(spread * 100)}% of what is sounding, `
      + 'so more than one thing is playing and I picked a voice out of it blind')
  }

  return reasons
}

/**
 * The refusal. A block printed from a reading this bad would paste, parse and play, with nothing about its
 * shape to say the notes were never in the recording — so the numbers get printed and the block does not.
 *
 * `narrow` puts naming the range first, for when that really is the fix: the recording was readable and the
 * only thing missing was which of its voices to read.
 */
function refuse(reasons: readonly string[], narrow: boolean): void {
  // One explanation will not do for both: a reading that never held, against one that held perfectly well
  // onto something nobody was listening to.
  const why = narrow
    ? 'so what came out is a real line, cleanly heard, and most likely the wrong one. '
      + 'Autocorrelation answers with the single period it can find, and on a mix the easiest period '
      + 'to find belongs to the bass — low, slow, steady, and nothing like the tune you can hear.'
    : 'so there is no melody here to paste, only the shape of one. Autocorrelation asks what single '
      + 'period a sound has, and a finished mix has no answer: what came out is whichever fragment of '
      + 'whichever instrument held still longest, stretched to cover the silence around it.'

  say('Stopping', `${reasons.join(', and ')} — ${why}`)

  const first = narrow
    ? 'name the range the tune itself sits in with --min-hz and --max-hz — an octave and a bit '
      + 'around it, which for most melodies means something like 400 to 1400 — since the reading was '
      + 'steady and the only thing missing was which voice to take. Failing that, play, '
    : 'play, '

  say('Instead', `${first}hum or whistle the tune yourself and point this at that — it reads a `
    + 'single line properly. Or find the melody already written down and put the ABC through npm run '
    + 'song. Or split the melody off the mix first with a stem separator and pass the one track.')
  say('Anyway', 'pass --force to print the block regardless.')
  console.log()
}

/** The melody at the pitch it was played, before the arrangement search moves it. */
function printHeard(melody: Transcription): void {
  console.log('\nWhat it heard, at the pitch it was played — the app\'s own paste box takes this:\n')
  for (const line of wrap(melody.spec, WIDTH - 2)) console.log(`  ${line}`)
}

function main(): void {
  const args = readArgs(process.argv.slice(2))
  if (!args.ok) {
    console.log(args.error)
    process.exitCode = 1
    return
  }

  const { path, title, numbers } = args.options
  const { 'beats-per-bar': beatsPerBar = 4, bpm } = numbers

  let audio
  try {
    audio = decodeAudio(path)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }

  // Each side taken separately: naming one bound is usually knowing one thing about the recording, not
  // wanting the other guessed differently.
  const scan = numbers['min-hz'] === undefined || numbers['max-hz'] === undefined
    ? suggestRange(audio.samples, { sampleRate: audio.sampleRate })
    : null
  const minHz = numbers['min-hz'] ?? scan?.minHz ?? 110
  const maxHz = numbers['max-hz'] ?? scan?.maxHz ?? 2100

  if (minHz >= maxHz) {
    console.error(`--min-hz ${minHz} is not below --max-hz ${maxHz}.`)
    process.exitCode = 1
    return
  }

  const result = transcribe(audio.samples, {
    sampleRate: audio.sampleRate,
    minHz,
    maxHz,
    beatsPerBar,
    ...(bpm === undefined ? {} : { bpm }),
    ...(numbers['min-note'] === undefined ? {} : { minNoteMs: numbers['min-note'] }),
    ...(numbers.clarity === undefined ? {} : { clarityThreshold: numbers.clarity }),
  })

  if (!result.ok) {
    console.error(`\nNothing to transcribe. ${result.error}\n`)
    process.exitCode = 1
    return
  }

  const melody = result.transcription
  const parsed = parseCustomSong(melody.spec)
  // Not reachable from a transcription, every note being one `midiToNote` produced. Checked anyway: a script
  // that trusts its own output is how writer and reader drift apart unnoticed.
  if (!parsed.ok) {
    console.error(tooLong(melody.notes.length) ?? `The melody came out unreadable, which is a bug: ${parsed.error}`)
    process.exitCode = 1
    return
  }

  const song = title === undefined ? parsed.song : { ...parsed.song, title }
  const definition = songDefinition(melody.spec, song)

  console.log(`\n${definition.title} — ${count(song.notes.length, 'note')}, `
    + `heard in ${song.key}\n`)

  reportListening({
    seconds: audio.samples.length / audio.sampleRate,
    sampleRate: audio.sampleRate,
    channels: audio.channels,
    via: audio.via,
  }, melody, { minHz, maxHz, beatsPerBar, bpm, scan })

  // Graded only when the scan chose the whole range, since half a scanned range is half the caller's.
  const bothScanned = numbers['min-hz'] === undefined && numbers['max-hz'] === undefined
  const spread = bothScanned && scan !== null && !scan.guessed ? scan.share : undefined

  const reasons = unreadable(melody, spread)
  if (reasons.length > 0 && !args.options.force) {
    // Only when the spread is the sole complaint: alongside a reading that never held a pitch, "one voice,
    // cleanly heard, wrong one" flatters the recording rather than diagnosing it.
    const onlySpread = reasons.length === 1 && spread !== undefined && spread < READABLE_SHARE
    refuse(reasons, onlySpread)
    process.exitCode = 1
    return
  }

  reportArrangement(song, definition)
  reportLibrary(definition)

  printHeard(melody)
  printBlock(definition)
}

main()
