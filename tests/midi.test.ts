import { readFileSync } from 'node:fs'
import { join as joinPath } from 'node:path'

import { parseCustomSong } from '../src/data/customSong'
import { midiToMelody } from '../src/lib/midi'

const TPQ = 480
const Q = TPQ
const H = TPQ * 2
const E = TPQ / 2

/** MIDI's variable-length quantity, the encoder to the parser's decoder. */
function vlq(value: number): number[] {
  const out = [value & 0x7f]
  let rest = value >> 7
  while (rest > 0) {
    out.unshift((rest & 0x7f) | 0x80)
    rest = rest >> 7
  }
  return out
}

const bytes = (tag: string): number[] => [...tag].map((letter) => letter.charCodeAt(0))

function chunk(tag: string, body: readonly number[]): number[] {
  const size = body.length
  return [
    ...bytes(tag),
    (size >>> 24) & 0xff, (size >>> 16) & 0xff, (size >>> 8) & 0xff, size & 0xff,
    ...body,
  ]
}

const trackName = (name: string): number[] =>
  [...vlq(0), 0xff, 0x03, ...vlq(name.length), ...bytes(name)]

const END_OF_TRACK = [...vlq(0), 0xff, 0x2f, 0x00]

/** A note as `[midi, startTicks, lengthTicks]`. */
type Note = [number, number, number]

/**
 * One track, written with running status — the status byte dropped whenever it repeats. Real files use it
 * constantly, and a parser that ignores it desynchronises on the first note.
 */
function track(name: string, channel: number, notes: readonly Note[]): number[] {
  const events = notes
    .flatMap(([midi, start, length]): { at: number, data: number[] }[] => [
      { at: start, data: [0x90 | channel, midi, 90] },
      { at: start + length, data: [0x90 | channel, midi, 0] },
    ])
    .sort((left, right) => left.at - right.at)

  const body = [...trackName(name)]
  let clock = 0
  let status = 0

  for (const event of events) {
    body.push(...vlq(event.at - clock))
    clock = event.at
    const [head = 0, ...rest] = event.data
    if (head === status) {
      body.push(...rest)
    } else {
      body.push(head, ...rest)
      status = head
    }
  }

  body.push(...END_OF_TRACK)
  return body
}

interface FileOptions {
  bpm?: number
  /** As written in the file: `[numerator, denominatorPower]`, so `[6, 3]` is 6/8. */
  signature?: [number, number]
  extraSignatures?: [number, [number, number]][]
}

/** A format 1 file: a conductor track carrying tempo and metre, then one track per part. */
function midiFile(
  parts: readonly { name: string, channel: number, notes: readonly Note[] }[],
  { bpm = 120, signature = [4, 2], extraSignatures = [] }: FileOptions = {},
): Uint8Array {
  const perQuarter = Math.round(60000000 / bpm)
  const conductor = [
    ...trackName('Conductor'),
    ...vlq(0), 0xff, 0x51, 0x03,
    (perQuarter >> 16) & 0xff, (perQuarter >> 8) & 0xff, perQuarter & 0xff,
    ...vlq(0), 0xff, 0x58, 0x04, signature[0], signature[1], 0x18, 0x08,
  ]

  let clock = 0
  for (const [at, [numerator, power]] of extraSignatures) {
    conductor.push(...vlq(at - clock), 0xff, 0x58, 0x04, numerator, power, 0x18, 0x08)
    clock = at
  }
  conductor.push(...END_OF_TRACK)

  return new Uint8Array([
    ...chunk('MThd', [0, 1, 0, parts.length + 1, (TPQ >> 8) & 0xff, TPQ & 0xff]),
    ...chunk('MTrk', conductor),
    ...parts.flatMap((part) => chunk('MTrk', track(part.name, part.channel, part.notes))),
  ])
}

/** Notes at one pitch each, laid end to end, as `[midi, lengthTicks]` pairs. */
function line(steps: readonly [number, number][], release = 0): Note[] {
  const notes: Note[] = []
  let at = 0
  for (const [midi, length] of steps) {
    notes.push([midi, at, length - release])
    at += length
  }
  return notes
}

/**
 * Three bars of 4/4 in D. Eight notes because `MELODY_MIN_NOTES` is eight, and a test expecting a part to be
 * chosen has to clear that bar rather than fall through to the skyline.
 */
const SCALE: [number, number][] = [
  [74, Q], [76, Q], [78, Q], [79, Q], [81, H], [83, Q], [81, Q], [79, Q * 4],
]

const SCALE_SPEC = 'D5 E5 F#5 G5 | A5:2 B5 A5 | G5:4'

const read = (bytes: Uint8Array, options?: Parameters<typeof midiToMelody>[1]) => {
  const result = midiToMelody(bytes, options)
  if (!result.ok) throw new Error(`expected a melody, got: ${result.error}`)
  return result.melody
}

describe('midiToMelody', () => {
  it('reads a single-part file as itself', () => {
    const melody = read(midiFile([{ name: 'Tune', channel: 0, notes: line(SCALE) }]))

    expect(melody.spec).toBe(SCALE_SPEC)
    expect(melody.part?.name).toBe('Tune')
    expect(melody.bpm).toBe(120)
    expect(melody.beatsPerBar).toBe(4)
    // Nothing detected and nothing estimated, so nothing should have needed rounding.
    expect(melody.bent).toBe(0)
    expect(melody.buried).toBe(0)
  })

  it('takes the tempo and the bar width from the file', () => {
    const melody = read(midiFile([{ name: 'Tune', channel: 0, notes: line(SCALE) }], {
      bpm: 96,
      signature: [6, 3],
    }))

    expect(melody.bpm).toBe(96)
    // 6/8 is three quarters to the bar, not six eighths: a beat here is always a quarter note.
    expect(melody.beatsPerBar).toBe(3)
  })

  // The case that makes the choice non-trivial: the strings sit *above* the melody, so pitch alone gets it
  // wrong. What disqualifies them is notes starting on top of each other, which a tune never does.
  it('picks the melody over a higher part that plays chords', () => {
    const chords: Note[] = []
    for (let bar = 0; bar < 3; bar += 1) {
      for (const midi of [86, 90, 93]) chords.push([midi, bar * Q * 4, Q * 4])
    }
    const bass = line([[38, H], [45, H], [38, H], [45, H], [38, H], [45, H], [38, H], [45, H]])

    const melody = read(midiFile([
      { name: 'Bass', channel: 1, notes: bass },
      { name: 'Tune', channel: 0, notes: line(SCALE) },
      { name: 'Strings', channel: 2, notes: chords },
    ]))

    // Enough notes and enough of the file to clear both other filters, so overlap is what loses it.
    expect(melody.parts.find((part) => part.name === 'Strings')?.overlap).toBeGreaterThan(0.35)
    expect(melody.part?.name).toBe('Tune')
    expect(melody.spec).toBe(SCALE_SPEC)
  })

  // The bug this caught: a kit plays more notes than everything else together, so measuring each part against
  // the whole file's count put all three of an Advance Wars track's "Melody" parts under the threshold.
  it('does not let a busy drum kit push the melody under the share threshold', () => {
    const kit: Note[] = []
    for (let hit = 0; hit < 200; hit += 1) kit.push([36 + (hit % 3), hit * (E / 2), E / 2])

    const melody = read(midiFile([
      { name: 'Tune', channel: 0, notes: line(SCALE) },
      { name: 'Kit', channel: 9, notes: kit },
    ]))

    expect(melody.part?.name).toBe('Tune')
    // Eight notes against two hundred hits, and still the whole of what is pitched.
    expect(melody.part?.share).toBe(1)
  })

  it('leaves the drum channel out of it', () => {
    const beats: Note[] = []
    for (let beat = 0; beat < 32; beat += 1) beats.push([36 + (beat % 2), beat * E, E])

    const melody = read(midiFile([
      { name: 'Tune', channel: 0, notes: line(SCALE) },
      { name: 'Drums', channel: 9, notes: beats },
    ]))

    expect(melody.part?.name).toBe('Tune')
    expect(melody.notes.every((note) => note.note.endsWith('5'))).toBe(true)
  })

  /*
   * Staccato, which sequenced music is full of: every note released early, whether entered that way or lifted
   * before the beat. Those gaps are how the note ended, not rests anybody wrote, and writing them out would
   * double the melody's length and misplace the bar lines.
   */
  it('gives a gap too short to be a rest back to the note before it', () => {
    const melody = read(midiFile([{ name: 'Tune', channel: 0, notes: line(SCALE, 20) }]))

    expect(melody.spec).toBe(SCALE_SPEC)
    expect(melody.rests).toBe(0)
  })

  it('writes a gap long enough to be a rest as one, and keeps the bar it pushed', () => {
    const melody = read(midiFile([{
      name: 'Tune',
      channel: 0,
      notes: [[74, 0, Q], [76, Q * 2, Q], [78, Q * 4, Q]],
    }]))

    expect(melody.notes.map((note) => note.note)).toEqual(['D5', 'E5', 'F#5'])
    expect(melody.rests).toBe(2)
    // Two beats each with the rest after it, so the third note opens the second bar.
    expect(melody.spec).toBe('D5 E5 | F#5')
  })

  it('flattens a chord to its top note and says how many it dropped', () => {
    const melody = read(midiFile([{
      name: 'Piano',
      channel: 0,
      notes: [[74, 0, Q], [78, 0, Q], [81, 0, Q], [76, Q, Q], [79, Q, Q]],
    }], { signature: [2, 2] }))

    expect(melody.notes.map((note) => note.note)).toEqual(['A5', 'G5'])
    expect(melody.buried).toBe(3)
  })

  it('takes the part it is told to, over the one it would have chosen', () => {
    const file = midiFile([
      { name: 'Tune', channel: 0, notes: line(SCALE) },
      { name: 'Bass', channel: 1, notes: line([[38, H], [45, H], [38, H], [45, H]]) },
    ])

    expect(read(file).part?.name).toBe('Tune')

    // Four notes, under `MELODY_MIN_NOTES`, so this also pins that being asked outranks the filters: the
    // guess needs a part to look like a tune, a person naming one has already decided.
    const bass = read(file, { part: { track: 2, channel: 1 } })
    expect(bass.part?.name).toBe('Bass')
    expect(bass.notes.map((note) => note.note)).toEqual(['D2', 'A2', 'D2', 'A2'])
  })

  it('skylines across every part when asked', () => {
    const melody = read(midiFile([
      { name: 'Tune', channel: 0, notes: line(SCALE) },
      { name: 'Descant', channel: 1, notes: [[93, 0, H]] },
    ]), { skyline: true })

    expect(melody.part).toBeNull()
    // The descant is above the tune for the first half of a bar, so it opens the line.
    expect(melody.notes[0]?.note).toBe('A6')
  })

  /*
   * Restating the metre is not changing it: sequencers write the mark again at every section boundary, the
   * Contra file fifteen times, and counting those would call a steady tune shifting.
   */
  it('opens on the first tempo and metre, counting only real changes', () => {
    const notes = line([...SCALE, ...SCALE])
    const steady = read(midiFile([{ name: 'Tune', channel: 0, notes }], {
      signature: [4, 2],
      extraSignatures: [[Q * 8, [4, 2]], [Q * 12, [4, 2]]],
    }))

    expect(steady.beatsPerBar).toBe(4)
    expect(steady.barChanges).toBe(0)

    const shifting = read(midiFile([{ name: 'Tune', channel: 0, notes }], {
      signature: [4, 2],
      extraSignatures: [[Q * 8, [3, 2]]],
    }))

    expect(shifting.beatsPerBar).toBe(4)
    expect(shifting.barChanges).toBe(1)
  })

  it('explains itself rather than throwing on input it cannot use', () => {
    expect(midiToMelody(new Uint8Array([1, 2, 3]))).toEqual({
      ok: false,
      error: expect.stringContaining('not a MIDI file'),
    })

    // SMPTE division: the high bit set in the header's timing word.
    const smpte = new Uint8Array(midiFile([{ name: 'Tune', channel: 0, notes: line(SCALE) }]))
    smpte[12] = 0xe8
    expect(midiToMelody(smpte)).toEqual({
      ok: false,
      error: expect.stringContaining('SMPTE'),
    })

    expect(midiToMelody(midiFile([]))).toEqual({
      ok: false,
      error: expect.stringContaining('not a single note'),
    })

    const file = midiFile([{ name: 'Tune', channel: 0, notes: line(SCALE) }])
    expect(midiToMelody(file, { part: { track: 9, channel: 9 } })).toEqual({
      ok: false,
      error: expect.stringContaining('no part 9:9'),
    })
  })

  // `spec` is what the app's paste box takes, so a MIDI read travels the same road a typed melody does, with
  // nothing adapting it on the way.
  it('produces a spec the app can read back as a song', () => {
    const melody = read(midiFile([{ name: 'Tune', channel: 0, notes: line(SCALE) }]))

    const parsed = parseCustomSong(melody.spec)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.song.notes).toEqual(melody.notes)
  })
})

/*
 * One real file, because every fixture above was written by the same code that reads it — which proves the
 * two agree, not that either is right. This one came off vgmusic and has what hand-made files have: running
 * status throughout, credits in the track names, fifteen restatements of the metre, and a lead channel that
 * doubles as a bass between phrases.
 */
describe('midiToMelody, on a file it did not write', () => {
  const file = new Uint8Array(readFileSync(joinPath(__dirname, '..', 'samples', 'contra-finalstage.mid')))

  it('reads it into a melody the app can parse', () => {
    const melody = read(file)

    expect(melody.format).toBe(1)
    expect(melody.ticksPerQuarter).toBe(120)
    expect(melody.bpm).toBe(130)
    expect(melody.parts.length).toBe(8)
    expect(melody.notes.length).toBeGreaterThan(50)

    const parsed = parseCustomSong(melody.spec)
    expect(parsed.ok).toBe(true)
  })

  it('counts the metre changes rather than the restatements', () => {
    // Fifteen marks in the file, and they genuinely do move: 6/4, then 5/8, then 6/8.
    const melody = read(file)

    expect(melody.beatsPerBar).toBe(6)
    expect(melody.barChanges).toBeGreaterThan(0)
    expect(melody.barChanges).toBeLessThan(15)
  })

  it('reads every part in it without losing notes to a desynchronised track', () => {
    // A parser that mishandled running status or a meta length comes out with a short or empty part, so what
    // is worth asserting is that all eight carry notes.
    const melody = read(file)

    for (const part of melody.parts) {
      expect(part.notes).toBeGreaterThan(0)
      expect(part.lowMidi).toBeGreaterThan(0)
      expect(part.highMidi).toBeLessThanOrEqual(127)
    }
  })
})
