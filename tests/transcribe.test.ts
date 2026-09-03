import { parseCustomSong } from '../src/data/customSong'
import { songDefinition } from '../src/data/songDefinition'
import { noteToFreq } from '../src/lib/music'
import { suggestRange, transcribe, type Transcription } from '../src/lib/transcribe'

const SAMPLE_RATE = 44100

/**
 * A note with two harmonics on it. A bare sine would pass more easily, but everything this gets pointed at
 * has overtones, and they are what autocorrelation locks onto.
 */
function tone(note: string, seconds: number): Float32Array {
  const hz = noteToFreq(note) ?? 440
  const samples = new Float32Array(Math.round(seconds * SAMPLE_RATE))

  for (let at = 0; at < samples.length; at += 1) {
    const phase = (2 * Math.PI * hz * at) / SAMPLE_RATE
    samples[at] = 0.5 * Math.sin(phase) + 0.25 * Math.sin(2 * phase) + 0.12 * Math.sin(3 * phase)
  }

  return samples
}

const silence = (seconds: number): Float32Array =>
  new Float32Array(Math.round(seconds * SAMPLE_RATE))

function join(...parts: readonly Float32Array[]): Float32Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const all = new Float32Array(total)

  let at = 0
  for (const part of parts) {
    all.set(part, at)
    at += part.length
  }

  return all
}

/**
 * Every recording ends with a moment of nothing, and `prune` drops it. Without one the last note loses the
 * window's worth of samples with no room to be analysed, and reads short.
 */
const TAIL = 0.3

function read(samples: Float32Array, bpm?: number): Transcription {
  const result = transcribe(samples, {
    sampleRate: SAMPLE_RATE,
    ...(bpm === undefined ? {} : { bpm }),
  })
  if (!result.ok) throw new Error(`expected a melody, got: ${result.error}`)

  return result.transcription
}

describe('transcribe', () => {
  it('reads a scale of even notes as itself', () => {
    const notes = ['D5', 'E5', 'F#5', 'G5', 'A5']
    const audio = join(...notes.map((note) => tone(note, 0.5)), silence(TAIL))

    const melody = read(audio)

    expect(melody.notes.map((entry) => entry.note)).toEqual(notes)
    expect(melody.notes.map((entry) => entry.beats)).toEqual([1, 1, 1, 1, 1])
  })

  /*
   * Half and double the beat fit exactly as well, so the claim is that the search picks the one calling the
   * commonest note a quarter — 120 rather than 60 or 240. Close to, not equal: the clarity dip between notes
   * leaves unpitched frames for pruning to hand to a neighbour, so every note reads a percent or two long.
   * The stretch is uniform, so the lengths stay exact, which is the half that matters.
   */
  it('fits the beat the melody was played at', () => {
    const audio = join(
      ...['D5', 'E5', 'F#5', 'G5'].map((note) => tone(note, 0.5)),
      silence(TAIL),
    )

    const melody = read(audio)

    expect(Math.abs(melody.bpm - 120)).toBeLessThanOrEqual(4)
    expect(melody.notes.map((entry) => entry.beats)).toEqual([1, 1, 1, 1])
  })

  it('tells long notes from short ones', () => {
    const audio = join(
      tone('D5', 0.5),
      tone('E5', 1),
      tone('F#5', 0.25),
      tone('G5', 0.25),
      tone('A5', 0.5),
      silence(TAIL),
    )

    const melody = read(audio)

    expect(melody.notes.map((entry) => entry.note)).toEqual(['D5', 'E5', 'F#5', 'G5', 'A5'])
    expect(melody.notes.map((entry) => entry.beats)).toEqual([1, 2, 0.5, 0.5, 1])
  })

  // The format has no rest, so a gap survives only as the bar line it pushed along: two notes written but
  // four beats of music, which is why `renderSpec` counts rests it does not write.
  it('drops rests but keeps the time they took', () => {
    const audio = join(
      tone('D5', 0.5), silence(0.5),
      tone('E5', 0.5), silence(0.5),
      tone('F#5', 0.5), silence(TAIL),
    )

    const melody = read(audio)

    expect(melody.notes.map((entry) => entry.note)).toEqual(['D5', 'E5', 'F#5'])
    expect(melody.rests).toBe(2)
    expect(melody.spec).toBe('D5 E5 | F#5')
  })

  /*
   * Nothing listens for an attack, so the gap is the only thing telling "played twice" from "held" — hence
   * its own threshold. What it must not become is a rest: the silence came off the end of the first note to
   * tongue the second, so the pair is still two whole beats.
   */
  it('tells a note played twice from the same note held', () => {
    const twice = read(join(tone('D5', 0.5), silence(0.08), tone('D5', 0.5), silence(TAIL)), 120)

    expect(twice.notes).toEqual([{ note: 'D5', beats: 1 }, { note: 'D5', beats: 1 }])
    expect(twice.rests).toBe(0)

    const held = read(join(tone('D5', 1), silence(TAIL)), 120)
    expect(held.notes).toEqual([{ note: 'D5', beats: 2 }])
  })

  // The floor is the window, not any threshold: no window sits inside a 20 ms gap, so no frame comes back
  // empty and there is nothing to separate the two. A slur reads as one note, and has to.
  it('reads a repeat too closely joined to hear as one long note', () => {
    const melody = read(join(tone('D5', 0.5), silence(0.02), tone('D5', 0.5), silence(TAIL)), 120)

    expect(melody.notes).toEqual([{ note: 'D5', beats: 2 }])
  })

  it('bars a run of quarters four to the bar', () => {
    const notes = ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6']
    const audio = join(...notes.map((note) => tone(note, 0.5)), silence(TAIL))

    expect(read(audio).spec).toBe('D5 E5 F#5 G5 | A5 B5 C#6 D6')
  })

  // Vibrato and a window straddling two notes both read as a wrong pitch for a frame or two, and pruning them
  // is what stops a melody sprouting notes. Written as the shape a real wobble has: a semitone, briefly.
  it('ignores a flicker too short to be a note', () => {
    const audio = join(
      tone('D5', 0.25), tone('D#5', 0.03), tone('D5', 0.25),
      tone('G5', 0.5),
      silence(TAIL),
    )

    expect(read(audio).notes.map((entry) => entry.note)).toEqual(['D5', 'G5'])
  })

  it('takes a tempo instead of guessing one', () => {
    const audio = join(...['D5', 'E5', 'F#5', 'G5'].map((note) => tone(note, 0.5)), silence(TAIL))

    const melody = read(audio, 60)

    expect(melody.bpm).toBe(60)
    // A beat is now twice as long, so the same playing is half-notes' worth of it.
    expect(melody.notes.map((entry) => entry.beats)).toEqual([0.5, 0.5, 0.5, 0.5])
  })

  it('reports how much of the recording held a pitch', () => {
    const played = read(join(...['D5', 'E5'].map((note) => tone(note, 0.5)), silence(TAIL)))
    expect(played.voiced).toBeGreaterThan(0.7)

    const sparse = read(join(
      tone('D5', 0.5), silence(1.5), tone('E5', 0.5), silence(TAIL),
    ))
    expect(sparse.voiced).toBeLessThan(0.5)
  })

  it('says so rather than throwing when there is nothing to read', () => {
    expect(transcribe(silence(1), { sampleRate: SAMPLE_RATE })).toEqual({
      ok: false,
      error: expect.stringContaining('No pitch'),
    })

    expect(transcribe(silence(0.01), { sampleRate: SAMPLE_RATE })).toEqual({
      ok: false,
      error: expect.stringContaining('Nothing to read'),
    })
  })

  /*
   * `spec` is not a private format: it is what the app's paste box takes, so a transcription travels the same
   * road a typed melody does — `parseCustomSong`, then `songDefinition`. A note name the reader will not
   * accept is a bug no test of the transcriber alone would see.
   */
  it('produces a spec the app can read back as a song', () => {
    const notes = ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6']
    const melody = read(join(...notes.map((note) => tone(note, 0.5)), silence(TAIL)))

    const parsed = parseCustomSong(melody.spec)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.song.notes.map((entry) => entry.note)).toEqual(notes)

    const definition = songDefinition(melody.spec, parsed.song)
    // A D major scale is inside the shared notes, so it needs no moving and strands nothing — the two things
    // that decide whether a tune can be a library entry at all.
    expect(definition.semitones).toBe(0)
    expect(definition.strays).toEqual([])
    expect(definition.block).toContain("spec: 'D5 E5 F#5 G5 | A5 B5 C#6 D6'")
  })
})

/*
 * Tested closely because the range changes the answer more than any other setting, and three rules for
 * choosing it all looked reasonable while getting it wrong. Two claims: on one line it finds that line, and
 * on more than one it says so in `share` rather than quietly picking. The second is load-bearing — a
 * histogram cannot tell which voice is the tune, so what it owes the caller is the admission.
 */
describe('suggestRange', () => {
  const scan = (samples: Float32Array): ReturnType<typeof suggestRange> =>
    suggestRange(samples, { sampleRate: SAMPLE_RATE })

  it('finds the octave a melody was played in', () => {
    const notes = ['D5', 'A5', 'F#5', 'D6', 'B5', 'G5']
    const found = scan(join(...notes.map((note) => tone(note, 0.4)), silence(TAIL)))

    expect(found.guessed).toBe(false)
    // D5 is 587 and D6 1175, and the padding is a couple of semitones either side of each.
    expect(found.minHz).toBeGreaterThan(450)
    expect(found.minHz).toBeLessThan(590)
    expect(found.maxHz).toBeGreaterThan(1170)
    expect(found.maxHz).toBeLessThan(1500)
    // One voice and nothing else, so effectively every reading is inside the band.
    expect(found.share).toBeGreaterThan(0.9)
  })

  // The whole reason to measure rather than default: 110-2100 Hz leaves an octave below this tune for the
  // detector to find half-frequency peaks in, where a tight band has nowhere to put them.
  it('gives a tighter band than the defaults it replaces', () => {
    const found = scan(join(...['G5', 'B5', 'D6'].map((note) => tone(note, 0.5)), silence(TAIL)))

    expect(found.minHz).toBeGreaterThan(110)
    expect(found.maxHz).toBeLessThan(2100)
  })

  /*
   * Two voices two octaves apart, which no window of `SCAN_SPAN` holds at once. Which one it picks is
   * arbitrary; the claim is that `share` drops, since that is what `audioToSong` refuses on and a bass line
   * transcribed cleanly is the failure that looks least like one.
   */
  it('reports a low share when more than one voice is sounding', () => {
    const low = ['D3', 'A3', 'D3', 'G3']
    const high = ['D6', 'F#6', 'A6', 'D6']
    const both = join(
      ...low.map((note, at) => {
        const under = tone(note, 0.5)
        const over = tone(high[at] ?? 'D6', 0.5)
        const mixed = new Float32Array(under.length)
        for (let sample = 0; sample < mixed.length; sample += 1) {
          mixed[sample] = 0.5 * ((under[sample] ?? 0) + (over[sample] ?? 0))
        }
        return mixed
      }),
      silence(TAIL),
    )

    const found = scan(both)

    expect(found.guessed).toBe(false)
    expect(found.share).toBeLessThan(0.9)
  })

  it('falls back to the defaults, and says so, when there is nothing to measure', () => {
    const found = scan(silence(2))

    expect(found).toEqual({
      minHz: 110,
      maxHz: 2100,
      readings: expect.any(Number),
      share: 0,
      guessed: true,
    })
  })
})
