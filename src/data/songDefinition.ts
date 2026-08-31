/**
 * Turns a pasted melody back into the source of a library entry: the `defineSong` block that would
 * put it in `songs.ts`.
 *
 * The part worth automating is the arrangement, not the typing. Every library song bar one is
 * written on the ten notes all five charts share, so that `songForInstrument` leaves it exactly as
 * written — see the header of `songs.ts`. Finding the transposition that lands a tune there is a
 * search, and getting it wrong is a test failure rather than something anyone spots by eye.
 */
import { CUSTOM_SONG_TITLE, isAbc } from './customSong'
import { INSTRUMENT_LIST } from './instruments'
import { type Song, type SongNote } from './songUtils'
import { parseAbc } from '../lib/abc'
import { noteToMidi } from '../lib/music'
import { transposeKey, transposeNote } from '../lib/transpose'

/** Three octaves either way, well past any tune a chart could be made to reach. */
const SEARCH = 36

/** Bar lines in every spelling ABC allows, longest first so `|]` is not read as `|` then `]`. */
const BAR_SPLIT = /\|\]|\[\||\|:|:\||::|\|\||\|/

const FIELD_LINE = /^[A-Za-z]:/
const KEY_MODE = /^K:\s*[A-Ga-g][#b]?\s*([A-Za-z]*)/m

const MODE_NAMES: Record<string, string> = {
  m: 'minor', min: 'minor', aeo: 'minor', maj: 'major', ion: 'major',
  dor: 'Dorian', mix: 'Mixolydian', lyd: 'Lydian', phr: 'Phrygian', loc: 'Locrian',
}

/**
 * The notes every chart has a grip for — a tin whistle in D intersected with a 6-hole ocarina, which
 * comes to the D major scale plus C natural. Derived rather than written down so that editing a
 * fingering chart cannot leave this behind.
 */
export const SHARED_NOTES: readonly string[] = (() => {
  const [first, ...rest] = INSTRUMENT_LIST
  if (first === undefined) return []

  return first.notes.filter((note) => rest.every((instrument) => note in instrument.fingering))
})()

const PLAYABLE = new Set(SHARED_NOTES)

export interface SongDefinition {
  /** Slug of the title. Saved progress is keyed by it, so a clash with an existing song matters. */
  id: string
  title: string
  /** The key it sounds in after the move. */
  key: string
  /** Semitones the melody had to move to land on `SHARED_NOTES`. */
  semitones: number
  /**
   * Distinct notes still outside that set after the move, in the order the melody reaches them.
   * Empty for a tune that fits, which is what a library entry has to be.
   */
  strays: readonly string[]
  /**
   * Whether the title is still the placeholder every custom song falls back to. True for a note
   * list, which carries no title, and for an ABC tune with no `T:` field.
   */
  needsTitle: boolean
  /** `defineSong({ ... }),`, indented ready to drop into the `SONGS` array. */
  block: string
}

/**
 * The smallest move that lands every note on a grip all five instruments have. Ties go to the
 * downward shift, the lower register being the easier to blow — the same tie-break `bestShift`
 * makes. When nothing fits, the least-bad shift comes back with its strays named.
 */
function bestFit(notes: readonly SongNote[]): { semitones: number, strays: readonly string[] } {
  const ordered = Array.from({ length: SEARCH * 2 + 1 }, (_, step) => step - SEARCH)
    .sort((left, right) => Math.abs(left) - Math.abs(right) || left - right)

  let best: { semitones: number, strays: readonly string[], count: number } | null = null

  for (const semitones of ordered) {
    const strays: string[] = []
    let count = 0

    for (const { note } of notes) {
      const moved = transposeNote(note, semitones)
      if (PLAYABLE.has(moved)) continue
      count += 1
      if (!strays.includes(moved)) strays.push(moved)
    }

    if (count === 0) return { semitones, strays }
    // Ranked on how many *positions* are stranded rather than how many distinct notes: one stray
    // note in forty places is a worse fit than four in one place each.
    if (best === null || count < best.count) best = { semitones, strays, count }
  }

  return best ?? { semitones: 0, strays: [] }
}

/**
 * How many notes are in each bar of the source. `parseAbc` throws bar lines away — it returns one
 * flat melody, the trainer having no use for bars — so they are counted back here.
 *
 * Each bar is parsed on its own *only to be counted*; the pitches always come from the whole-tune
 * parse the caller already has. So an inline key change or anything else spanning bars cannot be
 * mis-read here. The worst a bad split can do is group notes wrongly, and a count that does not add
 * up to the whole tune is discarded by `groupIntoBars`. Accidentals are safe either way, since ABC
 * clears them at every bar line anyway.
 */
function barCounts(text: string): readonly number[] {
  const header: string[] = []
  const body: string[] = []
  const seen = new Set<string>()

  for (const raw of text.split('\n')) {
    const line = raw.replace(/%.*$/, '').trim()
    if (line === '') continue

    // First one wins, matching the parser: that is what keeps a second `T:` and any `w:` lyric line
    // out of the melody.
    if (FIELD_LINE.test(line)) {
      const name = line.slice(0, 1)
      if (!seen.has(name)) {
        seen.add(name)
        header.push(line)
      }
      continue
    }

    body.push(line)
  }

  const bars = body.join(' ').split(BAR_SPLIT)

  // A note list needs no parser: its tokens are already note names, and `|` is one of them.
  if (!isAbc(text)) {
    return bars.map((bar) => bar.trim().split(/\s+/).filter((token) => token !== '').length)
  }

  return bars.map((bar) => {
    if (bar.trim() === '') return 0
    const result = parseAbc(`${header.join('\n')}\n${bar}`)
    return result.ok ? result.tune.notes.length : 0
  })
}

/** Bars as the source wrote them, or the whole melody in one when the split does not add up. */
function groupIntoBars(
  notes: readonly SongNote[],
  counts: readonly number[],
): readonly (readonly SongNote[])[] {
  if (counts.reduce((sum, count) => sum + count, 0) !== notes.length) return [notes]

  const groups: (readonly SongNote[])[] = []
  let at = 0
  for (const count of counts) {
    if (count === 0) continue
    groups.push(notes.slice(at, at + count))
    at += count
  }

  return groups
}

/** `1` is the default and stays unwritten; anything else gets a `:beats` suffix. */
function renderNote(note: SongNote, semitones: number): string {
  // Four places is past anything a written length produces, and trims the binary dust a chain of
  // halvings leaves behind.
  const beats = Number(note.beats.toFixed(4))
  return `${transposeNote(note.note, semitones)}${beats === 1 ? '' : `:${beats}`}`
}

const INDENT = '      '
/** Roughly where the rest of the source wraps. Nothing enforces it, so it is a target, not a rule. */
const WIDTH = 98

/** Greedy fill on whitespace. Tokens never contain a space, so a note keeps its `:beats`. */
function wrap(text: string, width: number): readonly string[] {
  const lines: string[] = []
  let current = ''

  for (const token of text.split(' ')) {
    const candidate = current === '' ? token : `${current} ${token}`
    if (current !== '' && candidate.length > width) {
      lines.push(current)
      current = token
    } else {
      current = candidate
    }
  }
  if (current !== '') lines.push(current)

  return lines
}

/**
 * A spec string shaped like the library's own: one line while it fits on one, otherwise whole bars
 * packed into the lines of a template literal. The spaces around each `|` are load-bearing —
 * `parseNotes` drops bar lines by token, not by character.
 */
function renderSpec(groups: readonly (readonly SongNote[])[], semitones: number): string {
  const bars = groups.map((group) => group.map((note) => renderNote(note, semitones)).join(' '))

  const oneLine = bars.join(' | ')
  if (`    spec: '',`.length + oneLine.length <= WIDTH) return `'${oneLine}'`

  const lines: string[] = []
  let current = ''
  for (const bar of bars) {
    const candidate = current === '' ? bar : `${current} | ${bar}`
    if (current !== '' && INDENT.length + candidate.length > WIDTH) {
      lines.push(current)
      current = bar
    } else {
      current = candidate
    }
  }
  if (current !== '') lines.push(current)

  // A bar wider than the line survives the packing above, which only ever breaks *between* bars.
  // That is the ordinary case for a source with no bar lines at all: the whole melody is one bar.
  const broken = lines.flatMap((line) => wrap(line, WIDTH - INDENT.length))

  return ['`', ...broken.map((line) => INDENT + line), '    `'].join('\n')
}

/** Single quotes unless the text already has one, which is what `The Queen's Jig` needs. */
const quote = (text: string): string =>
  text.includes("'") ? `"${text.replace(/"/g, '\\"')}"` : `'${text}'`

export const slugify = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** The mode word from a `K:` field, so the subtitle can say "E minor" rather than just "E". */
function readMode(text: string): string {
  const word = (KEY_MODE.exec(text)?.[1] ?? '').toLowerCase()
  return MODE_NAMES[word.slice(0, 3)] ?? MODE_NAMES[word] ?? 'major'
}

/**
 * A starting point for the difficulty tag rather than a verdict. Leaps and short notes are what
 * actually make a tune hard to play on a whistle; the number of notes barely matters.
 */
function difficulty(notes: readonly SongNote[]): string {
  const midis = notes.map((note) => noteToMidi(note.note) ?? 0)

  let leap = 0
  for (let at = 1; at < midis.length; at++) {
    leap = Math.max(leap, Math.abs((midis[at] ?? 0) - (midis[at - 1] ?? 0)))
  }

  const shortest = Math.min(...notes.map((note) => note.beats))
  const span = Math.max(...midis) - Math.min(...midis)

  if (leap >= 9 || shortest < 0.5) return 'hard'
  if (leap >= 7 || shortest < 1 || span > 12) return 'medium'
  return 'easy'
}

/**
 * The library entry a pasted melody would become. `text` is the paste itself, needed for the bar
 * lines and the mode, and `song` is what `parseCustomSong` already made of it.
 *
 * `subtitle` comes out as a placeholder on purpose: every entry in the library names where its tune
 * came from, and that is the one thing here no amount of parsing can work out.
 */
export function songDefinition(text: string, song: Song): SongDefinition {
  const { semitones, strays } = bestFit(song.notes)
  const key = transposeKey(song.key, semitones)
  const shifted = song.notes.map((note) => ({ ...note, note: transposeNote(note.note, semitones) }))
  const spec = renderSpec(groupIntoBars(song.notes, barCounts(text)), semitones)

  const block = [
    '  defineSong({',
    `    id: ${quote(slugify(song.title))},`,
    `    title: ${quote(song.title)},`,
    `    subtitle: ${quote(`SOURCE — ${key} ${readMode(text)}`)},`,
    `    tags: [${quote(difficulty(shifted))}],`,
    `    key: ${quote(key)},`,
    `    spec: ${spec},`,
    '  }),',
  ].join('\n')

  return {
    id: slugify(song.title),
    title: song.title,
    key,
    semitones,
    strays,
    needsTitle: song.title === CUSTOM_SONG_TITLE,
    block,
  }
}
