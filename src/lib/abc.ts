import { midiToNote, noteToMidi } from './music'

/** Same shape as a `SongNote`, redeclared so `lib` does not import from `data`. */
export interface AbcNote {
  note: string
  /** Length in beats, a beat being a quarter note — the song library's unit. */
  beats: number
}

export interface AbcTune {
  /** From `T:`, or null when the tune has none. */
  title: string | null
  /** The tonic of `K:` as a pitch-class name. C when the key field is missing or unreadable. */
  key: string
  /** The melody with its repeats played out, in the order you play it. */
  notes: readonly AbcNote[]
  /**
   * Notes per bar, summing to `notes.length`. The trainer ignores bars; `songDefinition` writes them
   * back out so a generated spec reads like its source.
   */
  bars: readonly number[]
}

export type AbcResult =
  | { ok: true, tune: AbcTune }
  | { ok: false, error: string }

const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Sharps are added to a key signature in this order, flats in the other. */
const SHARP_ORDER = 'FCGDAEB'
const FLAT_ORDER = 'BEADGCF'

/** Each tonic's place on the circle of fifths, which is its major key's sharp count. */
const FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
}

/** How far each mode sits from the major of the same tonic, in fifths. */
const MODES: Record<string, number> = {
  maj: 0, ion: 0, lyd: 1, mix: -1, dor: -2, min: -3, aeo: -3, phr: -4, loc: -5,
}

/** A whole tune is one melody here, so a paste of an entire book is worth naming as a mistake. */
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
 * Reads a `K:` value — `D`, `Bb`, `Am`, `Ador`, `Emin` — into its tonic and sharp count. `K:none`,
 * `K:HP` and anything unreadable come back as C major, which is ABC's meaning for no key signature.
 */
function readKey(value: string): AbcKey {
  const match = KEY_FIELD.exec(value.trim())
  if (match === null) return { tonic: 'C', sharps: 0 }

  const [, letter = '', accidental = '', rest = ''] = match
  const tonic = letter.toUpperCase() + accidental
  const fifths = FIFTHS[tonic]
  if (fifths === undefined) return { tonic: 'C', sharps: 0 }

  // A mode is named by its first three letters and a lone `m` means minor. Anything else — `K:D exp`,
  // a stray word — is read as major, which is what a bare `K:D` means anyway.
  const mode = rest.slice(0, 3).toLowerCase()
  const offset = mode === 'm' ? -3 : (MODES[mode] ?? 0)

  return { tonic, sharps: fifths + offset }
}

/** Which letters the key signature alters, and by how much. */
function keySignature(sharps: number): Record<string, number> {
  const signature: Record<string, number> = {}
  // Seven of either is the whole alphabet, and a mode offset can push the count past that.
  const letters = sharps > 0
    ? SHARP_ORDER.slice(0, Math.min(7, sharps))
    : FLAT_ORDER.slice(0, Math.min(7, -sharps))

  for (const letter of letters) signature[letter] = sharps > 0 ? 1 : -1

  return signature
}

/** `3/4` -> 0.75, `C` and `C|` -> 1, null when the value is not a fraction at all. */
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
 * How long a bare note letter lasts, as a fraction of a whole note. `L:` states it outright;
 * otherwise ABC derives it from the meter, counting anything shorter than 3/4 in sixteenths.
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
 * Whether a line is prose rather than music. Old collections wrap a long `Z:` or `N:` field onto a
 * bare second line instead of continuing it with `+:`, leaving a sentence where melody should be.
 *
 * Three letters together that are not all note names cannot be music, and prose carries no bar line.
 * A single stray letter is left alone, so a mistyped note is still reported rather than dropped.
 */
function isProse(line: string): boolean {
  if (line.includes('|')) return false

  const words = line.match(/[A-Za-z]{3,}/g) ?? []
  return words.some((word) => /[^A-Ga-gxzZ]/.test(word))
}

/**
 * Reads the melody out of an ABC tune — the subset a melody trainer can use. Pitches, lengths, key
 * signatures, accidentals and broken rhythm are kept; anything about printing or accompaniment is
 * dropped, so rests vanish, chords collapse to their top note and several voices interleave into one
 * line. Repeats are played out, since the trainer walks a melody end to end with nowhere to jump.
 *
 * Anything it cannot place is an error naming the character: a tune that half works is harder to fix
 * than one that says what is wrong.
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
      // First one wins: a repeated `T:` is a subtitle, and this also keeps `w:` lyrics out of the body.
      if (!fields.has(name)) fields.set(name, value.trim())
      continue
    }

    // Only before the melody starts, which is what makes it safe: a line dropped here is still inside
    // the header block, so no music can go missing behind it.
    if (bodyLines.length === 0 && isProse(line)) continue

    bodyLines.push(line)
  }

  const unit = unitLength(fields)
  const tuneKey = readKey(fields.get('K') ?? '')
  let signature = keySignature(tuneKey.sharps)

  // Joined with a space so a note ending one line and one starting the next cannot read as one token.
  const body = bodyLines.join(' ')
  const notes: AbcNote[] = []
  /** Accidentals written on a note, held per letter and octave until the next bar line. */
  const accidentals = new Map<string, number>()
  /** A broken rhythm sign waits here for the note it stretches or shortens. */
  let carried = 1
  /** Where the current chord's notes start in `notes`, or -1 when not inside one. */
  let chordAt = -1
  /** Where the section a `:|` sends you back to begins. The tune itself, until a `|:` says otherwise. */
  let sectionAt = 0
  /** Where the first variant ending of the current section begins, or -1 when it has none. */
  let endingAt = -1
  /** Where each bar begins, the first at nothing, so the last entry is the bar being filled. */
  const barsAt: number[] = [0]
  let at = 0

  const fail = (message: string): AbcResult => ({ ok: false, error: message })

  /** Ends the bar being filled, if it holds anything. Two bar lines in a row make one bar, not two. */
  const closeBar = (): void => {
    if (notes.length > (barsAt[barsAt.length - 1] ?? 0)) barsAt.push(notes.length)
  }

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

    // `]` closes a chord, and a length written after it applies to the whole chord.
    if (ch === ']' && chordAt !== -1) {
      at += 1
      const chord = notes.splice(chordAt)
      const length = readLength()
      chordAt = -1

      // The melody is nearly always the top voice, and the trainer asks for one note at a time.
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

    // Bar lines in all their forms — `|`, `||`, `|]`, `[|`, `:|`, `|:`, `::` — and the variant endings
    // that hang off them, `|1` and `[2`. Three things happen here: an accidental stops holding, a bar
    // ends, and a repeat is played out into the notes it stands for.
    if (
      ch === '|'
      || ch === ':'
      || (ch === '[' && (body[at + 1] === '|' || /[0-9]/.test(body[at + 1] ?? '')))
    ) {
      // `[|` is a bar line of its own; in `[1` the bracket belongs to the number after it.
      if (ch === '[' && body[at + 1] === '|') at += 1

      const glyph = /^[:|\]]*/.exec(body.slice(at))?.[0] ?? ''
      at += glyph.length

      // Which ending this is does not matter, only where the endings start — that being the point a
      // repeat sends you back from. So `[1,3` and `[2` are read the same way.
      const ending = /^\s*\[?\s*[0-9][0-9,-]*/.exec(body.slice(at))?.[0] ?? null
      if (ending !== null) at += ending.length

      // Colons before the pipes close a repeat, colons after it open one. `::` does both and has no
      // pipes for them to sit either side of.
      const pipes = /[|\]]/.test(glyph)
      const closes = pipes ? glyph.startsWith(':') : glyph.length > 1
      const opens = pipes ? glyph.endsWith(':') : glyph.length > 1

      closeBar()
      accidentals.clear()

      if (closes) {
        // The section again, up to its first variant ending — with no endings that is all of it, and
        // with them ending 1 is exactly what the jump back skips over.
        const upTo = endingAt === -1 ? notes.length : endingAt
        const offset = notes.length - sectionAt

        // Fresh objects, since broken rhythm stretches the note before it in place.
        for (let index = sectionAt; index < upTo; index += 1) {
          const note = notes[index]
          if (note !== undefined) notes.push({ ...note })
        }
        // The bar lines inside the section come with it. Its own start needs no copy: `closeBar` above
        // already opened a bar where the copy lands.
        for (const start of [...barsAt]) {
          if (start > sectionAt && start < upTo) barsAt.push(start + offset)
        }
        closeBar()

        if (notes.length > MAX_NOTES) {
          return fail(`That comes to over ${MAX_NOTES} notes with the repeats played out.`)
        }

        // A section with no variant endings is finished here. One with them is not: the next ending
        // repeats the same section again, so both marks stay where they are.
        if (endingAt === -1) sectionAt = notes.length
      }

      if (opens) {
        sectionAt = notes.length
        endingAt = -1
      }

      // Only a mark that is not itself closing a repeat can open an ending group. `:|2` after a `|1`
      // is the second ending of a group already open, and after nothing at all it is a repeat count we
      // do not read — taking it for an ending would leave the group open over the section after it,
      // whose own `:|` would then repeat nothing.
      if (ending !== null && endingAt === -1 && !closes) endingAt = notes.length

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

    // Chord names and annotations, `!trill!` decorations, grace notes: text about the music.
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

    // A tuplet marker such as `(3` respells the printed rhythm of the notes after it. We keep the
    // notes and let their written lengths stand, so the digits go with the bracket.
    if (ch === '(') {
      at += 1
      while (/[0-9:]/.test(body[at] ?? '')) at += 1
      continue
    }

    // Slur ends, ties, staccato dots, rolls, bowings, overlays, line continuations. A tie becomes two
    // notes of the written length, which is a rhythm the trainer never enforces anyway.
    if (')-.~uv\\&$]'.includes(ch)) {
      at += 1
      continue
    }

    // Rests leave no note behind — there is no fingering for silence — only a cleared rhythm sign.
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

    // Broken rhythm: `a>b` dots the first note and halves the second, `a<b` the other way round, and
    // a repeated sign splits them further.
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

    // What is left has to be a note: accidentals, letter, octave marks, length. `=` is a natural, so
    // it cancels the key signature rather than adding to it.
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

    // A capital is the octave from middle C up, lower case the one above it, and `'` and `,` move
    // further in either direction.
    let octave = letter === letter.toUpperCase() ? 4 : 5
    while (body[at] === "'" || body[at] === ',') {
      octave += body[at] === "'" ? 1 : -1
      at += 1
    }

    const upper = letter.toUpperCase()
    const memory = `${upper}${octave}`
    if (alter !== null) accidentals.set(memory, alter)
    // The order is the rule: an accidental earlier in the bar beats the key signature, and one written
    // on this note beats both.
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
  const bars = barsAt
    .map((start, index) => (barsAt[index + 1] ?? notes.length) - start)
    .filter((count) => count > 0)

  return {
    ok: true,
    tune: { title: title === '' ? null : title, key: tuneKey.tonic, notes, bars },
  }
}
