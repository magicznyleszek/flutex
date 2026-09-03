/**
 * A Standard MIDI File to a melody, in the note list `parseCustomSong` reads.
 *
 * Preferred over `transcribe` wherever a file exists, everything hard about a recording being already solved
 * here: notes, lengths, tempo and metre are integers, so nothing is detected and nothing is approximate. The
 * one question a file does not answer is which of these notes is the tune — see `chooseMelody`, and the
 * `part` and `buried` fields for what it will not pretend to know.
 *
 * Formats 0 and 1, running status, and any meta or sysex event skipped by length. SMPTE timing is refused: it
 * is a film timecode convention with no beat to write lengths against.
 *
 * No Node and no DOM, so the browser can read an ArrayBuffer off a file input and call this unchanged.
 */
import { midiToNote } from './music'
import { nearestValue, renderSpec, type SpecNote, type SpecRun } from './spec'

export interface MidiNote {
  midi: number
  /** Onset and length in beats, a beat being a quarter note. Exact — MIDI counts ticks. */
  startBeats: number
  beats: number
  track: number
  channel: number
  velocity: number
}

/** One voice: a track and a channel. Most files put the melody in a part of its own. */
export interface MidiPart {
  track: number
  channel: number
  /** The track's name from the file, or `''` — a hint for a human, never used to choose. */
  name: string
  notes: number
  lowMidi: number
  highMidi: number
  meanMidi: number
  /** Share of its notes that start while another of its own is still sounding, 0-1. */
  overlap: number
  /**
   * Share of the file's *pitched* notes in this part. Drums are out of the total, so a drum part's own share
   * can read above 1 — nothing ever chooses one. See `describeParts`.
   */
  share: number
}

export interface MidiMelody {
  notes: readonly SpecNote[]
  /** The note list with its bar lines: what `parseCustomSong` takes, and the app's own paste box. */
  spec: string
  /** The file's opening tempo, or 120 where it does not say. Lengths do not depend on it. */
  bpm: number
  beatsPerBar: number
  /** Silences long enough to survive as rests, then dropped: this format has no rest. */
  rests: number
  /** The part the melody was taken from, or null when it was skylined across all of them. */
  part: MidiPart | null
  /** Every part found, busiest first — what `--part` can be pointed at. */
  parts: readonly MidiPart[]
  /** Notes thrown away because something higher was sounding at the same time. */
  buried: number
  /** Share of notes whose length had to be rounded to something writable, 0-1. */
  bent: number
  /** Tempo changes after the first. Lengths are in beats, so this only affects how it will sound. */
  tempoChanges: number
  /** Time signature changes after the first. Bar lines here are at one width throughout. */
  barChanges: number
  format: number
  ticksPerQuarter: number
}

export interface MidiOptions {
  /** Take this part rather than choosing one, as `parts` numbers them. */
  part?: { track: number, channel: number }
  /** Ignore parts and take the highest note sounding at every moment across the whole file. */
  skyline?: boolean
  /** Overrides the file's own time signature. */
  beatsPerBar?: number
  /**
   * Below this, a gap is how the note was released rather than a rest, and it goes back to the note before.
   * Sequenced melodies are full of them — staccato entry, or keys lifted a moment early.
   */
  minRestBeats?: number
  /** What onsets and lengths snap to, in beats. A sixteenth by default, the shortest a spec writes. */
  grid?: number
}

export type MidiResult = { ok: true, melody: MidiMelody } | { ok: false, error: string }

/** GM keeps percussion on channel 10, counted from one. Never a melody, always plenty of notes. */
const DRUM_CHANNEL = 9

const DEFAULT_BPM = 120
const DEFAULT_GRID = 0.25
const DEFAULT_MIN_REST = 0.25

/**
 * What a part must look like to be taken for the tune. These reject the two things that outrank a melody on
 * pitch alone: a hi-hat on a pitched channel fails `share`, chords fail `overlap`.
 */
const MELODY_MIN_SHARE = 0.08
const MELODY_MAX_OVERLAP = 0.35
const MELODY_MIN_NOTES = 8

/** Rounding slack before a length counts as bent, as a share of the length. */
const BENT_AT = 0.05

const text = (bytes: Uint8Array, at: number, length: number): string => {
  let out = ''
  for (let step = 0; step < length; step += 1) out += String.fromCharCode(bytes[at + step] ?? 0)
  return out
}

const uint16 = (bytes: Uint8Array, at: number): number =>
  ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0)

const uint32 = (bytes: Uint8Array, at: number): number =>
  ((bytes[at] ?? 0) * 0x1000000) + (((bytes[at + 1] ?? 0) << 16)
    | ((bytes[at + 2] ?? 0) << 8) | (bytes[at + 3] ?? 0))

/**
 * MIDI's variable-length quantity: seven bits per byte, high bit meaning "another follows". Every delta time
 * and meta length is one, so a mistake here desynchronises the whole track.
 */
function variable(bytes: Uint8Array, at: number): { value: number, next: number } {
  let value = 0
  let step = at

  // Four bytes is the format's own limit, and also what keeps a corrupt file from spinning here.
  for (let read = 0; read < 4; read += 1) {
    const byte = bytes[step] ?? 0
    step += 1
    value = (value << 7) | (byte & 0x7f)
    if ((byte & 0x80) === 0) break
  }

  return { value, next: step }
}

/**
 * Tempo and metre marks with the tick each falls on, gathered rather than folded down while reading. Each
 * track's clock restarts, so the one read last is not the one latest in the music — and a file opening at 120
 * BPM has to stay distinguishable from one that never said.
 */
interface Marks {
  tempos: { ticks: number, bpm: number }[]
  signatures: { ticks: number, beatsPerBar: number }[]
}

interface Timing {
  bpm: number
  beatsPerBar: number
  /** Marks after the opening one that say something different from the mark before them. */
  tempoChanges: number
  barChanges: number
}

/**
 * One track's note-on/note-off pairs, plus whatever it said about tempo and metre.
 *
 * The two details that are the whole difficulty of reading MIDI: an event may omit its status byte and mean
 * "same as last time", hence `status` held across the loop; and a note-on at velocity zero is a note-off, in
 * fact the commoner spelling of one.
 */
function readTrack(
  bytes: Uint8Array,
  start: number,
  end: number,
  track: number,
  ticksPerQuarter: number,
  marks: Marks,
): { notes: MidiNote[], name: string } {
  const notes: MidiNote[] = []
  const sounding = new Map<number, { startTicks: number, velocity: number }[]>()
  let name = ''
  let ticks = 0
  let status = 0
  let at = start

  const beats = (value: number): number => value / ticksPerQuarter

  const open = (channel: number, midi: number, velocity: number): void => {
    const key = channel * 128 + midi
    const stack = sounding.get(key) ?? []
    stack.push({ startTicks: ticks, velocity })
    sounding.set(key, stack)
  }

  const close = (channel: number, midi: number, endTicks: number): void => {
    const key = channel * 128 + midi
    const stack = sounding.get(key)
    const started = stack?.shift()
    if (started === undefined) return

    notes.push({
      midi,
      startBeats: beats(started.startTicks),
      beats: beats(endTicks - started.startTicks),
      track,
      channel,
      velocity: started.velocity,
    })
  }

  while (at < end) {
    const delta = variable(bytes, at)
    ticks += delta.value
    at = delta.next

    const byte = bytes[at] ?? 0
    if (byte >= 0x80) {
      status = byte
      at += 1
    } else if (status === 0) {
      // A data byte with no status ever set: nothing can be made of the rest of this track.
      break
    }

    const kind = status & 0xf0
    const channel = status & 0x0f

    if (status === 0xff) {
      const type = bytes[at] ?? 0
      const length = variable(bytes, at + 1)
      const data = length.next

      if (type === 0x03 && name === '') name = text(bytes, data, length.value).trim()
      if (type === 0x51) {
        const perQuarter = ((bytes[data] ?? 0) << 16) | ((bytes[data + 1] ?? 0) << 8)
          | (bytes[data + 2] ?? 0)
        if (perQuarter > 0) marks.tempos.push({ ticks, bpm: Math.round(60000000 / perQuarter) })
      }
      if (type === 0x58) {
        const numerator = bytes[data] ?? 4
        const power = bytes[data + 1] ?? 2
        // The denominator is a power of two, and a beat here is always a quarter: 6/8 is three to the bar.
        if (numerator > 0) {
          marks.signatures.push({ ticks, beatsPerBar: (numerator * 4) / Math.pow(2, power) })
        }
      }

      at = data + length.value
      if (type === 0x2f) break
      continue
    }

    if (status === 0xf0 || status === 0xf7) {
      const length = variable(bytes, at)
      at = length.next + length.value
      continue
    }

    if (kind === 0x90) {
      const midi = bytes[at] ?? 0
      const velocity = bytes[at + 1] ?? 0
      at += 2
      if (velocity === 0) close(channel, midi, ticks)
      else open(channel, midi, velocity)
      continue
    }

    if (kind === 0x80) {
      close(channel, bytes[at] ?? 0, ticks)
      at += 2
      continue
    }

    // Everything else is one or two data bytes and nothing to do with pitch.
    at += kind === 0xc0 || kind === 0xd0 ? 1 : 2
  }

  // Files do end a track with notes still held. The last tick seen is the only reading available.
  for (const [key, stack] of sounding) {
    for (let held = stack.length; held > 0; held -= 1) {
      close(Math.floor(key / 128), key % 128, ticks)
    }
  }

  return { notes, name }
}

/**
 * The tempo and metre the tune opens on, and how often it changed after. Earliest tick wins, and restating
 * the value in force is not a change: sequencers restate both marks at every section boundary — one Contra
 * stage file says its metre fifteen times — and that is not a shifting tune.
 */
function settle({ tempos, signatures }: Marks): Timing {
  const changes = <T>(marks: { ticks: number, value: T }[]): { first: T | undefined, count: number } => {
    const order = [...marks].sort((left, right) => left.ticks - right.ticks)
    let count = 0
    for (let at = 1; at < order.length; at += 1) {
      if (order[at]?.value !== order[at - 1]?.value) count += 1
    }
    return { first: order[0]?.value, count }
  }

  const tempo = changes(tempos.map(({ ticks, bpm }) => ({ ticks, value: bpm })))
  const metre = changes(signatures.map(({ ticks, beatsPerBar }) => ({ ticks, value: beatsPerBar })))

  return {
    bpm: tempo.first ?? DEFAULT_BPM,
    beatsPerBar: metre.first ?? 4,
    tempoChanges: tempo.count,
    barChanges: metre.count,
  }
}

interface ParsedMidi {
  format: number
  ticksPerQuarter: number
  notes: readonly MidiNote[]
  names: readonly string[]
  timing: Timing
}

/** The file, read but not yet interpreted: every note in it, on the timeline they share. */
function parseMidi(bytes: Uint8Array): { ok: true, midi: ParsedMidi } | { ok: false, error: string } {
  if (bytes.length < 14 || text(bytes, 0, 4) !== 'MThd') {
    return {
      ok: false,
      error: 'That is not a MIDI file — it does not start with an MThd header. A .mid or .midi file '
        + 'is what this wants; for an mp3 or a wav, use npm run song:audio.',
    }
  }

  const format = uint16(bytes, 8)
  const division = uint16(bytes, 12)

  if ((division & 0x8000) !== 0) {
    return {
      ok: false,
      error: 'This file counts time in SMPTE frames rather than musical ticks, which is a film '
        + 'timecode convention. There is no tempo or beat in it to write note lengths against.',
    }
  }
  if (division === 0) return { ok: false, error: 'The file header says zero ticks to the quarter.' }

  const marks: Marks = { tempos: [], signatures: [] }
  const notes: MidiNote[] = []
  const names: string[] = []

  let at = 8 + uint32(bytes, 4)
  let track = 0

  while (at + 8 <= bytes.length) {
    const chunk = text(bytes, at, 4)
    const length = uint32(bytes, at + 4)
    const body = at + 8
    // Chunks other than MTrk are allowed to exist and are meant to be skipped by their length.
    if (chunk === 'MTrk') {
      const read = readTrack(bytes, body, Math.min(body + length, bytes.length), track, division,
        marks)
      notes.push(...read.notes)
      names.push(read.name)
      track += 1
    }
    at = body + length
  }

  const timing = settle(marks)

  if (notes.length === 0) {
    return { ok: false, error: 'The file parsed, but there is not a single note in it.' }
  }

  return {
    ok: true,
    midi: { format, ticksPerQuarter: division, notes, names, timing },
  }
}

/** Every voice in the file, described well enough to choose between them. Busiest first. */
function describeParts(notes: readonly MidiNote[], names: readonly string[]): MidiPart[] {
  const groups = new Map<string, MidiNote[]>()
  for (const note of notes) {
    const key = `${note.track}:${note.channel}`
    const group = groups.get(key) ?? []
    group.push(note)
    groups.set(key, group)
  }

  // Drums are left out of what `share` is a share *of*: a hi-hat on every sixteenth outnumbers a melody ten
  // to one. Measured against the whole file, an Advance Wars track's three parts named "Melody" all fell
  // under the threshold against 3100 drum hits and the tune lost to a slap bass.
  const pitched = notes.filter((note) => note.channel !== DRUM_CHANNEL).length
  const total = pitched === 0 ? notes.length : pitched

  const parts = [...groups.values()].map((group) => {
    const sorted = [...group].sort((left, right) => left.startBeats - right.startBeats)
    const first = sorted[0] as MidiNote

    let overlaps = 0
    let reach = -Infinity
    for (const note of sorted) {
      if (note.startBeats < reach - 1e-6) overlaps += 1
      reach = Math.max(reach, note.startBeats + note.beats)
    }

    const midis = sorted.map((note) => note.midi)

    return {
      track: first.track,
      channel: first.channel,
      name: names[first.track] ?? '',
      notes: sorted.length,
      lowMidi: Math.min(...midis),
      highMidi: Math.max(...midis),
      meanMidi: midis.reduce((sum, midi) => sum + midi, 0) / midis.length,
      overlap: overlaps / sorted.length,
      share: sorted.length / total,
    }
  })

  return parts.sort((left, right) => right.notes - left.notes)
}

/**
 * Which part is the tune: the highest-pitched one that looks like a single line and carries enough of the
 * file to be one. Null when nothing qualifies, meaning the caller should skyline instead.
 *
 * Highest wins because that is what arranging is. Each filter rejects a real case: a part with almost no
 * notes is a countermelody or an effect, and a part whose notes start under each other is a chord instrument
 * — usually the highest thing in the file and never the melody.
 */
function chooseMelody(parts: readonly MidiPart[]): MidiPart | null {
  const wanted = parts
    .filter((part) => part.channel !== DRUM_CHANNEL)
    .filter((part) => part.notes >= MELODY_MIN_NOTES && part.share >= MELODY_MIN_SHARE)
    .filter((part) => part.overlap <= MELODY_MAX_OVERLAP)

  let best: MidiPart | null = null
  for (const part of wanted) if (best === null || part.meanMidi > best.meanMidi) best = part

  return best
}

interface Segment {
  midi: number
  start: number
  end: number
}

/**
 * The highest note sounding at every moment, as one unbroken line — the usual way of flattening chords into a
 * melody. Evaluated only at onsets and endings, the only boundaries where the answer can change.
 */
function skylineOf(notes: readonly MidiNote[]): { segments: Segment[], buried: number } {
  const bounds = [...new Set(notes.flatMap((note) => [note.startBeats, note.startBeats + note.beats]))]
    .sort((left, right) => left - right)

  const byStart = [...notes].sort((left, right) => left.startBeats - right.startBeats)
  const segments: Segment[] = []
  const heard = new Set<MidiNote>()

  let active: MidiNote[] = []
  let next = 0

  for (let at = 0; at < bounds.length - 1; at += 1) {
    const from = bounds[at] as number
    const to = bounds[at + 1] as number

    while (next < byStart.length && (byStart[next] as MidiNote).startBeats <= from + 1e-9) {
      active.push(byStart[next] as MidiNote)
      next += 1
    }
    active = active.filter((note) => note.startBeats + note.beats > from + 1e-9)
    if (active.length === 0) continue

    let top = active[0] as MidiNote
    for (const note of active) if (note.midi > top.midi) top = note
    heard.add(top)

    const last = segments[segments.length - 1]
    // A held top note is one note however many times something changed underneath it.
    if (last !== undefined && last.midi === top.midi && Math.abs(last.end - from) < 1e-9) {
      last.end = to
    } else {
      segments.push({ midi: top.midi, start: from, end: to })
    }
  }

  return { segments, buried: notes.length - heard.size }
}

/** Rounds to the grid, keeping a nonzero length for anything that sounded at all. */
const snap = (beats: number, grid: number): number => Math.round(beats / grid) * grid

/**
 * The line, as runs a spec can be written from. Onsets and endings snap to the grid first so bar lines cannot
 * drift, and only then is each length rounded to one the format allows. `SpecRun` keeps the two apart, so a
 * note written as a dotted quarter still occupies the time it really took.
 */
function toRuns(
  segments: readonly Segment[],
  { grid, minRestBeats }: { grid: number, minRestBeats: number },
): { runs: SpecRun[], rests: number, bent: number } {
  const runs: SpecRun[] = []
  let rests = 0
  let bent = 0
  let cursor: number | null = null

  for (const segment of segments) {
    const start = snap(segment.start, grid)
    const end = Math.max(start + grid, snap(segment.end, grid))
    const gap = cursor === null ? 0 : start - cursor

    if (gap >= minRestBeats - 1e-9 && gap > 0) {
      runs.push({ note: null, beats: gap })
      rests += 1
    }

    const held = end - start
    const fit = nearestValue(held)
    if (fit.error > BENT_AT) bent += 1

    const previous = runs[runs.length - 1]
    // A gap too short to be a rest belongs to the note it was released from, not to nothing.
    const gained = gap > 0 && gap < minRestBeats - 1e-9 && previous?.note != null ? gap : 0
    if (gained > 0 && previous?.note != null) {
      previous.beats += gained
      previous.note.beats = nearestValue(previous.beats).value
    }

    runs.push({ note: { note: midiToNote(segment.midi), beats: fit.value }, beats: held })
    cursor = end
  }

  return { runs, rests, bent }
}

/**
 * A MIDI file to a melody. `part` and `skyline` overrule the guess about which voice is the tune; the `parts`
 * list in the result is there so a caller can print the alternatives.
 */
export function midiToMelody(bytes: Uint8Array, options: MidiOptions = {}): MidiResult {
  const parsed = parseMidi(bytes)
  if (!parsed.ok) return parsed

  const { format, ticksPerQuarter, notes, names, timing } = parsed.midi
  const {
    grid = DEFAULT_GRID,
    minRestBeats = DEFAULT_MIN_REST,
    beatsPerBar = timing.beatsPerBar,
  } = options

  const parts = describeParts(notes, names)

  const asked = options.part
  const chosen = options.skyline === true
    ? null
    : asked !== undefined
      ? parts.find((part) => part.track === asked.track && part.channel === asked.channel) ?? null
      : chooseMelody(parts)

  if (asked !== undefined && chosen === null && options.skyline !== true) {
    return {
      ok: false,
      error: `There is no part ${asked.track}:${asked.channel} in this file. The parts it has are `
        + `${parts.map((part) => `${part.track}:${part.channel}`).join(', ')}.`,
    }
  }

  // Drums are never the tune and are dense enough to dominate a skyline, so they go before it runs.
  const source = chosen === null
    ? notes.filter((note) => note.channel !== DRUM_CHANNEL)
    : notes.filter((note) => note.track === chosen.track && note.channel === chosen.channel)

  if (source.length === 0) {
    return { ok: false, error: 'Nothing left to read once the drum channel was set aside.' }
  }

  const { segments, buried } = skylineOf(source)
  if (segments.length === 0) {
    return { ok: false, error: 'The notes in that part all have zero length.' }
  }

  const { runs, rests, bent } = toRuns(segments, { grid, minRestBeats })
  const melodyNotes = runs
    .map((run) => run.note)
    .filter((note): note is SpecNote => note !== null)

  return {
    ok: true,
    melody: {
      notes: melodyNotes,
      spec: renderSpec(runs, beatsPerBar),
      bpm: timing.bpm,
      beatsPerBar,
      rests,
      part: chosen,
      parts,
      buried,
      bent: bent / melodyNotes.length,
      tempoChanges: timing.tempoChanges,
      barChanges: timing.barChanges,
      format,
      ticksPerQuarter,
    },
  }
}
