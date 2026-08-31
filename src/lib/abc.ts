import { midiToNote, noteToMidi } from './music'

/**
 * A note read out of an ABC tune. Structurally a `SongNote`, written out here so that `lib`
 * does not have to import from `data`.
 */
export interface AbcNote {
  note: string
  /** Length in beats, where a beat is a quarter note — the same unit the song library uses. */
  beats: number
}

export interface AbcTune {
  /** From `T:`, or null when the tune has no title field. */
  title: string | null
  /** The tonic of `K:` as a pitch-class name. C when there is no readable key field. */
  key: string
  notes: readonly AbcNote[]
}

export type AbcResult =
  | { ok: true, tune: AbcTune }
  | { ok: false, error: string }

const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Sharps are added to a key signature in this order, flats in the other. */
const SHARP_ORDER = 'FCGDAEB'
const FLAT_ORDER = 'BEADGCF'

/** Where each tonic sits on the circle of fifths, which is its major key's sharp count. */
const FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
}

/** How far each mode sits from the major of the same tonic, counted in fifths. */
const MODES: Record<string, number> = {
  maj: 0, ion: 0, lyd: 1, mix: -1, dor: -2, min: -3, aeo: -3, phr: -4, loc: -5,
}

/** A whole tune is one melody line here, so a paste of a whole book is a mistake worth naming. */
const MAX_NOTES = 2000

const FIELD_LINE = /^([A-Za-z]):(.*)$/
const KEY_FIELD = /^([A-Ga-g])([#b]?)\s*([A-Za-z]*)/
const FRACTION = /^(\d+)(?:\/(\d+))?$/

interface AbcKey {
  tonic: string
  /** Positive for sharps, negative for flats. */
  sharps: number
}

/**
 * Reads a `K:` value — `D`, `Bb`, `Am`, `Ador`, `Emin` — into its tonic and its sharp count.
 * `K:none`, `K:HP` and anything else unreadable come back as C major, which is ABC's own
 * meaning for a missing key signature.
 */
function readKey(value: string): AbcKey {
  const match = KEY_FIELD.exec(value.trim())
  if (match === null) return { tonic: 'C', sharps: 0 }

  const [, letter = '', accidental = '', rest = ''] = match
  const tonic = letter.toUpperCase() + accidental
  const fifths = FIFTHS[tonic]
  if (fifths === undefined) return { tonic: 'C', sharps: 0 }

  // A mode is named by its first three letters, and a lone `m` means minor. Anything else —
  // `K:D exp`, a stray comment — is read as major, which is what a bare `K:D` means anyway.
  const mode = rest.slice(0, 3).toLowerCase()
  const offset = mode === 'm' ? -3 : (MODES[mode] ?? 0)

  return { tonic, sharps: fifths + offset }
}

/** Which letters the key signature alters, and by how much. */
function keySignature(sharps: number): Record<string, number> {
  const signature: Record<string, number> = {}
  // Seven of either is the whole alphabet; a mode offset can push the count past that.
  const letters = sharps > 0
    ? SHARP_ORDER.slice(0, Math.min(7, sharps))
    : FLAT_ORDER.slice(0, Math.min(7, -sharps))

  for (const letter of letters) signature[letter] = sharps > 0 ? 1 : -1

  return signature
}

/** `3/4` -> 0.75, `C` and `C|` -> 1. Null when the value is not a fraction at all. */
function readFraction(value: string): number | null {
  const text = value.trim()
  if (text === 'C' || text === 'C|') return 1

  const match = FRACTION.exec(text)
  if (match === null) return null

  const denominator = match[2] === undefined ? 1 : Number(match[2])
  if (denominator === 0) return null

  return Number(match[1]) / denominator
}

/**
 * How long a bare note letter lasts, as a fraction of a whole note. `L:` states it; otherwise
 * ABC derives it from the meter, where anything shorter than 3/4 is counted in sixteenths.
 */
function unitLength(fields: Map<string, string>): number {
  const explicit = readFraction(fields.get('L') ?? '')
  if (explicit !== null && explicit > 0) return explicit

  const meter = readFraction(fields.get('M') ?? '')
  if (meter !== null && meter < 0.75) return 1 / 16

  return 1 / 8
}

/** An ABC comment runs from an unquoted `%` to the end of the line, `%%directives` included. */
function stripComment(line: string): string {
  const at = line.indexOf('%')
  return at === -1 ? line : line.slice(0, at)
}

/**
 * Reads the melody out of an ABC tune.
 *
 * This is the subset a melody trainer can use, not a full implementation of the standard. It
 * keeps pitches, lengths, key signatures, accidentals and broken rhythm, and throws away
 * everything that is about printing or accompaniment: rests are dropped, chords collapse to
 * their top note, ties become two notes, and decorations, lyrics and repeat marks are skipped.
 * Multiple voices are read as one line, so a piano arrangement comes out interleaved.
 *
 * Anything it cannot place is an error naming the character, because a pasted tune that half
 * works is harder to fix than one that says what is wrong.
 */
export function parseAbc(text: string): AbcResult {
  const fields = new Map<string, string>()
  const bodyLines: string[] = []

  for (const raw of text.split('\n')) {
    const line = stripComment(raw).trim()
    if (line === '') continue

    const field = FIELD_LINE.exec(line)
    if (field !== null) {
      const [, name = '', value = ''] = field
      // First one wins: a repeated `T:` is a subtitle, and this is also what keeps `w:` lyric
      // lines out of the body.
      if (!fields.has(name)) fields.set(name, value.trim())
      continue
    }

    bodyLines.push(line)
  }

  const unit = unitLength(fields)
  const tuneKey = readKey(fields.get('K') ?? '')
  let signature = keySignature(tuneKey.sharps)

  // Joined with a space so that a note at the end of one line and one at the start of the next
  // cannot be read as a single token.
  const body = bodyLines.join(' ')
  const notes: AbcNote[] = []
  /** Accidentals written on a note, held per letter and octave until the next bar line. */
  const accidentals = new Map<string, number>()
  /** A broken rhythm sign waits here for the note it stretches or shortens. */
  let carried = 1
  /** Where the current chord's notes start in `notes`, or -1 when not inside one. */
  let chordAt = -1
  let at = 0

  const fail = (message: string): AbcResult => ({ ok: false, error: message })

  const readDigits = (): number | null => {
    const start = at
    while (/[0-9]/.test(body[at] ?? '')) at += 1

    return at === start ? null : Number(body.slice(start, at))
  }

  /** `2`, `/`, `//`, `/3`, `3/2` — a multiplier on the unit length, defaulting to 1. */
  const readLength = (): number => {
    const numerator = readDigits() ?? 1
    let denominator = 1
    // A bare `/` halves, and each extra one halves again.
    while (body[at] === '/') {
      at += 1
      denominator *= readDigits() ?? 2
    }

    return numerator / denominator
  }

  /** Jumps past a paired delimiter, or to the end if the pair was never closed. */
  const skipPast = (end: string): void => {
    const found = body.indexOf(end, at + 1)
    at = found === -1 ? body.length : found + 1
  }

  while (at < body.length) {
    const ch = body[at] ?? ''

    if (ch === ' ') {
      at += 1
      continue
    }

    // `]` closes a chord. A length written after it applies to the whole chord.
    if (ch === ']' && chordAt !== -1) {
      at += 1
      const chord = notes.splice(chordAt)
      const length = readLength()
      chordAt = -1

      // The melody in a transcription is nearly always the top voice, and the trainer can only
      // ask for one note at a time.
      const top = chord.reduce<AbcNote | null>(
        (best, entry) =>
          best === null || (noteToMidi(entry.note) ?? 0) > (noteToMidi(best.note) ?? 0)
            ? entry
            : best,
        null,
      )
      if (top !== null) notes.push({ ...top, beats: top.beats * length })
      continue
    }

    // Bar lines in all their forms — `|`, `||`, `|]`, `[|`, `:|`, `|:`, `::` — and the one
    // thing they do here: an accidental only holds until the next one.
    if (ch === '|' || ch === ':' || (ch === '[' && body[at + 1] === '|')) {
      at += 1
      // The bounds check is not decoration: `includes('')` is true, so without it a tune ending
      // in a bar line runs off the end of the string and never comes back.
      while (at < body.length && '|:]'.includes(body[at] ?? '')) at += 1
      accidentals.clear()
      continue
    }

    if (ch === '[') {
      const name = body[at + 1] ?? ''
      // An inline field, `[K:D]` or `[V:2]`. Only a key change means anything to us.
      if (/[A-Za-z]/.test(name) && body[at + 2] === ':') {
        const close = body.indexOf(']', at)
        const end = close === -1 ? body.length : close
        if (name === 'K') signature = keySignature(readKey(body.slice(at + 3, end)).sharps)
        at = end + 1
        continue
      }

      chordAt = notes.length
      at += 1
      continue
    }

    // Guitar chord names and annotations, `!trill!` style decorations, grace notes: text about
    // the music rather than notes to play.
    if (ch === '"') {
      skipPast('"')
      continue
    }
    if (ch === '!' || ch === '+') {
      skipPast(ch)
      continue
    }
    if (ch === '{') {
      skipPast('}')
      continue
    }

    // A tuplet marker such as `(3` respells the printed rhythm of the notes after it. We keep
    // the notes and let their written lengths stand, so the digits go with the bracket.
    if (ch === '(') {
      at += 1
      while (/[0-9:]/.test(body[at] ?? '')) at += 1
      continue
    }

    // Slur ends, ties, staccato dots, rolls, bowings, overlays, line continuations. A tie
    // becomes two notes of the written length, which is a rhythm the trainer never enforces
    // anyway.
    if (')-.~uv\\&$]'.includes(ch)) {
      at += 1
      continue
    }

    // Rests. There is no fingering for silence, so they leave no note behind — only the
    // broken-rhythm sign they might have been carrying is cleared.
    if (ch === 'z' || ch === 'x') {
      at += 1
      readLength()
      carried = 1
      continue
    }
    if (ch === 'Z') {
      at += 1
      readDigits()
      carried = 1
      continue
    }

    // Broken rhythm: `a>b` dots the first note and halves the second, `a<b` the other way
    // round, and a repeated sign splits them further.
    if (ch === '>' || ch === '<') {
      let count = 0
      while (body[at] === ch) {
        count += 1
        at += 1
      }

      const shorter = 2 ** -count
      const longer = 2 - shorter
      const previous = notes[notes.length - 1]
      if (previous !== undefined) previous.beats *= ch === '>' ? longer : shorter
      carried = ch === '>' ? shorter : longer
      continue
    }

    // What is left has to be a note: accidentals, then a letter, then octave marks, then a
    // length. `=` is a natural, so it cancels the key signature rather than adding to it.
    let alter: number | null = null
    for (;;) {
      const mark = body[at] ?? ''
      if (mark === '^') alter = (alter ?? 0) + 1
      else if (mark === '_') alter = (alter ?? 0) - 1
      else if (mark === '=') alter = 0
      else break
      at += 1
    }

    const letter = body[at] ?? ''
    if (!/[A-Ga-g]/.test(letter)) {
      if (alter !== null) {
        return fail(`In the melody, "${ch}" has to be followed by a note letter A-G.`)
      }

      return fail(
        `I cannot read "${ch}" in the melody. Notes, rests, bar lines, ties and the usual `
        + 'decorations are understood — anything else is probably not ABC.',
      )
    }
    at += 1

    // A capital is the octave from middle C up, lower case the one above it, and `'` and `,`
    // move further in either direction.
    let octave = letter === letter.toUpperCase() ? 4 : 5
    while (body[at] === "'" || body[at] === ',') {
      octave += body[at] === "'" ? 1 : -1
      at += 1
    }

    const upper = letter.toUpperCase()
    const memory = `${upper}${octave}`
    if (alter !== null) accidentals.set(memory, alter)
    // The order is the rule: an accidental written earlier in the bar beats the key signature,
    // and one written on this note beats both.
    const alteration = alter ?? accidentals.get(memory) ?? signature[upper] ?? 0
    const midi = (octave + 1) * 12 + (LETTER_SEMITONES[upper] ?? 0) + alteration
    const length = readLength()

    notes.push({ note: midiToNote(midi), beats: unit * length * 4 * carried })
    carried = 1

    if (notes.length > MAX_NOTES) {
      return fail(`That is over ${MAX_NOTES} notes. One tune at a time.`)
    }
  }

  if (notes.length === 0) {
    return fail('No notes in there. An ABC tune plays what is written below its `K:` line.')
  }

  const title = fields.get('T') ?? ''

  return {
    ok: true,
    tune: { title: title === '' ? null : title, key: tuneKey.tonic, notes },
  }
}
