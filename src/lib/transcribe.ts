/**
 * A recording to a melody, in the note list `parseCustomSong` reads. The trainer's own detector walked over a
 * whole file instead of the newest frame, then cut into notes and fitted to a beat.
 *
 * Monophonic only. Autocorrelation asks what period a signal has, and a chord or a finished mix has no single
 * answer, so a record put through here comes back as the bass line if you are lucky — check `voiced` first.
 *
 * A note starts where the pitch changes, nothing here listening for an attack, so a note played twice in a
 * row comes out as one note of twice the length unless an audible gap parted them.
 *
 * No Node and no DOM, so the browser can decode with `decodeAudioData` and call this unchanged.
 */
import { freqToMidi, midiToFreq, midiToNote } from './music'
import { createMedianFilter, createPitchDetector } from './pitch'
import { nearestValue, renderSpec, type SpecNote } from './spec'

export interface TranscribeOptions {
  sampleRate: number
  /**
   * The pitch range to search. Narrow it to whatever made the recording: every spare octave is another chance
   * for the detector to land on a subharmonic and invent a leap nobody played.
   */
  minHz?: number
  maxHz?: number
  /** Window length and how far it steps per frame, in samples. The step sets onset resolution. */
  bufferSize?: number
  hopSize?: number
  /**
   * The shortest thing written, note or silence. Below it a reading is a wobble and a gap is an articulation,
   * so the gap goes back to the note it was tongued off. Raise it if detached playing comes out as notes and
   * rests instead of plain beats.
   */
  minNoteMs?: number
  /**
   * Below this, a silence is the crack between two notes rather than a gap. Much shorter than `minNoteMs`
   * because a rest is the only evidence that a note was played twice rather than held.
   *
   * The real floor is the window, not this: a gap has to outlast `bufferSize` to leave one empty frame, 46 ms
   * at 44.1 kHz. Under that a repeat reads as one long note however low this goes.
   */
  minRestMs?: number
  /** Skip the tempo search and take this instead, for when the search guesses wrong. */
  bpm?: number
  beatsPerBar?: number
  clarityThreshold?: number
}

export interface Transcription {
  notes: readonly SpecNote[]
  /** The note list with its bar lines: what `parseCustomSong` takes, and the app's own paste box. */
  spec: string
  /** The quarter-note tempo the lengths were fitted to, or the one handed in. */
  bpm: number
  /** Silences long enough to survive as rests, then dropped: this format has no rest. */
  rests: number
  /**
   * Stretches of steady pitch before pruning. Against `notes.length` it says whether the input was readable:
   * a melody has roughly as many stretches as notes, so hundreds collapsing into a handful means the output
   * is an artefact of the pruning.
   */
  rawRuns: number
  frames: number
  /** Share of frames that held a pitch, 0-1. High for a solo recording, low for a full mix. */
  voiced: number
}

export type TranscribeResult =
  | { ok: true, transcription: Transcription }
  | { ok: false, error: string }

/** Slowest and fastest quarter-note the tempo search will entertain, in seconds per beat. */
const SLOWEST_BEAT = 1.5
const FASTEST_BEAT = 0.25
const TEMPO_STEPS = 1000

/**
 * Nudge towards a beat that makes the typical note a quarter. Small, being only here to settle ties — and
 * ties are the normal case, half the beat fitting exactly as well as the beat.
 */
const BEAT_UNIT_WEIGHT = 0.02

/** Peak the samples are scaled to before analysis, so one loudness threshold suits every recording. */
const NORMALISE_PEAK = 0.9

interface Run {
  /** Rounded MIDI number, or null for a silence. */
  midi: number | null
  frames: number
}

/**
 * Every frame's pitch as a rounded MIDI number, or null where nothing sounded. The trainer's median filter
 * drops autocorrelation's single-frame octave flips without smearing a real note change.
 */
function framePitches(
  samples: Float32Array,
  { sampleRate, minHz, maxHz, bufferSize, hopSize, clarityThreshold, smoothing = 3 }: {
    sampleRate: number
    minHz: number
    maxHz: number
    bufferSize: number
    hopSize: number
    clarityThreshold: number
    /** Frames the median runs over. 1 turns it off, which is what a histogram wants. */
    smoothing?: number
  },
): readonly (number | null)[] {
  const detect = createPitchDetector({
    sampleRate,
    bufferSize,
    minFreq: minHz,
    maxFreq: maxHz,
    clarityThreshold,
  })
  const smooth = createMedianFilter(smoothing)

  const pitches: (number | null)[] = []
  for (let at = 0; at + bufferSize <= samples.length; at += hopSize) {
    const hz = smooth(detect(samples.subarray(at, at + bufferSize)).hz)
    pitches.push(hz > 0 ? Math.round(freqToMidi(hz)) : null)
  }

  return pitches
}

/** Widest band the scan looks in, before narrowing to whatever it found in there. */
const SCAN_MIN_HZ = 80
const SCAN_MAX_HZ = 3000

/**
 * Width of the window slid across the readings: an octave and a fifth, roomy for one melody and too tight for
 * two voices. A bass under a tune reads as two humps and a window this size has to pick one, where any rule
 * about *covering* the readings would span both and hand the real pass back the spare octave.
 */
const SCAN_SPAN = 19

/** Semitones of room added each side of what was found. */
const SCAN_PADDING = 2

/** Under this many readings there is nothing to narrow towards, and the band would be noise. */
const SCAN_MIN_READINGS = 24

const MIDI_TOP = 127

export interface SuggestedRange {
  minHz: number
  maxHz: number
  /** Readings the choice came from, so a caller can say how firm it is. */
  readings: number
  /**
   * Share of those readings inside the chosen band, 0-1. Low means the sound was spread wider than one band —
   * several voices, or an octave-slipping detector — so the range is a pick, not a description.
   */
  share: number
  /** True when the scan found too little and these are the fallbacks rather than a measurement. */
  guessed: boolean
}

/**
 * Where the sound is, in semitones: the busiest window of `SCAN_SPAN`, tightened onto the readings in it.
 * Busiest rather than anything cleverer, a histogram being unable to tell which voice is the tune — on a
 * chiptune the busiest window is the bass line, and preferring a higher one lands on harmonics.
 */
function densestBand(midis: readonly number[]): { low: number, high: number, inside: number } {
  const counts = new Array<number>(MIDI_TOP + 1).fill(0)
  for (const midi of midis) {
    const at = Math.min(MIDI_TOP, Math.max(0, midi))
    counts[at] = (counts[at] ?? 0) + 1
  }

  let running = 0
  let best = { start: 0, held: -1 }
  for (let at = 0; at <= MIDI_TOP; at += 1) {
    running += counts[at] ?? 0
    if (at > SCAN_SPAN) running -= counts[at - SCAN_SPAN - 1] ?? 0
    if (running > best.held) best = { start: Math.max(0, at - SCAN_SPAN), held: running }
  }

  // The window is a coarse net; the band handed on is the lowest and highest reading caught in it, so a
  // melody covering ten semitones does not get nineteen to wander in.
  const inWindow = midis.filter((midi) => midi >= best.start && midi <= best.start + SCAN_SPAN)

  return {
    low: Math.min(...inWindow),
    high: Math.max(...inWindow),
    inside: inWindow.length,
  }
}

/**
 * A pitch range measured off the recording instead of guessed at: one cheap pass at the widest useful band,
 * then the busiest part of what it found becomes the range for the real pass.
 *
 * Worth the extra pass because the range changes the answer more than any other setting — spare octaves are
 * where autocorrelation finds the subharmonics that turn into leaps nobody played. On a mix this centres on
 * whatever the detector locked onto, which may well be the bass.
 */
export function suggestRange(
  samples: Float32Array,
  { sampleRate, bufferSize = 2048, clarityThreshold = 0.55 }: {
    sampleRate: number
    bufferSize?: number
    clarityThreshold?: number
  },
): SuggestedRange {
  const fallback = { minHz: 110, maxHz: 2100 }

  const pitches = framePitches(normalise(samples), {
    sampleRate,
    minHz: SCAN_MIN_HZ,
    maxHz: SCAN_MAX_HZ,
    bufferSize,
    // No overlap: a histogram needs no onset resolution, which makes this a quarter of the real pass.
    hopSize: bufferSize,
    clarityThreshold,
    smoothing: 1,
  })

  const midis = pitches.filter((midi): midi is number => midi !== null)
  if (midis.length < SCAN_MIN_READINGS) {
    return { ...fallback, readings: midis.length, share: 0, guessed: true }
  }

  const { low, high, inside } = densestBand(midis)

  return {
    minHz: Math.max(SCAN_MIN_HZ, Math.round(midiToFreq(low - SCAN_PADDING))),
    maxHz: Math.min(SCAN_MAX_HZ, Math.round(midiToFreq(high + SCAN_PADDING))),
    readings: midis.length,
    share: inside / midis.length,
    guessed: false,
  }
}

/** Adjacent stretches of one pitch, silence included as a run of its own. */
function toRuns(pitches: readonly (number | null)[]): Run[] {
  const runs: Run[] = []

  for (const midi of pitches) {
    const last = runs[runs.length - 1]
    if (last !== undefined && last.midi === midi) last.frames += 1
    else runs.push({ midi, frames: 1 })
  }

  return runs
}

/** Merges neighbours that ended up with the same pitch, which pruning keeps creating. */
function coalesce(runs: Run[]): void {
  for (let at = runs.length - 1; at > 0; at -= 1) {
    const run = runs[at]
    const before = runs[at - 1]
    if (run === undefined || before === undefined || before.midi !== run.midi) continue

    before.frames += run.frames
    runs.splice(at, 1)
  }
}

/**
 * Throws out everything too short to be a note, shortest first, by giving its frames to the longer neighbour.
 * That both cleans up vibrato — once the blip goes its two sides merge — and hands a window straddling two
 * notes to whichever owns more of it.
 *
 * Silences get their own much lower bar: pruning one between two readings of the same pitch turns a note
 * played twice into a note held twice as long. Leading and trailing silence always goes.
 */
function prune(runs: Run[], minNoteFrames: number, minRestFrames: number): Run[] {
  const kept = [...runs]

  for (;;) {
    while (kept.length > 0 && kept[0]?.midi === null) kept.shift()
    while (kept.length > 0 && kept[kept.length - 1]?.midi === null) kept.pop()

    let worst = -1
    let fewest = Infinity
    for (let at = 0; at < kept.length; at += 1) {
      const run = kept[at]
      if (run === undefined) continue
      const floor = run.midi === null ? minRestFrames : minNoteFrames
      if (run.frames >= floor || run.frames >= fewest) continue
      worst = at
      fewest = run.frames
    }

    // One run left and it is short: a recording of a single brief note, which is still a melody.
    if (worst < 0 || kept.length < 2) return kept

    const before = kept[worst - 1]
    const after = kept[worst + 1]
    const target = before === undefined
      ? after
      : after === undefined ? before : (before.frames >= after.frames ? before : after)

    if (target !== undefined) target.frames += kept[worst]?.frames ?? 0
    kept.splice(worst, 1)
    coalesce(kept)
  }
}

/**
 * Gives the crack between two tongued notes back to the note it came off. The other half of letting `prune`
 * keep short silences: the gap has to survive long enough to separate two readings of one pitch, then not be
 * written, or it rounds up to a whole spec length and walks the bar lines forward.
 *
 * No `coalesce` afterwards — two runs of one pitch left touching is the point, being a repeated note.
 */
function foldShortGaps(runs: readonly Run[], minNoteFrames: number): Run[] {
  const kept: Run[] = []

  for (const run of runs) {
    const previous = kept[kept.length - 1]
    if (run.midi === null && run.frames < minNoteFrames && previous !== undefined) {
      previous.frames += run.frames
    } else {
      kept.push({ ...run })
    }
  }

  return kept
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[(sorted.length - 1) >> 1] ?? 1
}

/**
 * The beat that lands most of these durations on a length a spec can write. Rests are included, or the search
 * could stretch a beat across one unnoticed.
 *
 * Scored on relative error weighted by duration, so a long note fitting badly counts for more and a very fast
 * candidate gets no credit for everything being "near" a multiple of it. Beat, half-beat and double-beat all
 * fit identically, which is what `BEAT_UNIT_WEIGHT` is for.
 */
function fitTempo(durations: readonly number[]): number {
  const total = durations.reduce((sum, duration) => sum + duration, 0)
  if (total <= 0) return 0.5

  let best = { beatSec: 0.5, total: Infinity }

  for (let step = 0; step <= TEMPO_STEPS; step += 1) {
    const beatSec = FASTEST_BEAT + ((SLOWEST_BEAT - FASTEST_BEAT) * step) / TEMPO_STEPS

    let error = 0
    const values: number[] = []
    for (const duration of durations) {
      const fit = nearestValue(duration / beatSec)
      error += fit.error * duration
      values.push(fit.value)
    }

    const score = error / total + BEAT_UNIT_WEIGHT * Math.abs(Math.log2(median(values)))
    if (score < best.total) best = { beatSec, total: score }
  }

  return best.beatSec
}

/** Scales the loudest sample to a known peak, so one silence threshold suits any recording level. */
function normalise(samples: Float32Array): Float32Array {
  let peak = 0
  for (let at = 0; at < samples.length; at += 1) {
    const level = Math.abs(samples[at] as number)
    if (level > peak) peak = level
  }
  if (peak <= 0) return samples

  const gain = NORMALISE_PEAK / peak
  const scaled = new Float32Array(samples.length)
  for (let at = 0; at < samples.length; at += 1) scaled[at] = (samples[at] as number) * gain

  return scaled
}

/**
 * Mono samples to a melody. Failure is a sentence to show whoever handed the file over, never a throw: an
 * unreadable recording is the ordinary case, not a bug.
 */
export function transcribe(samples: Float32Array, options: TranscribeOptions): TranscribeResult {
  const {
    sampleRate,
    minHz = 110,
    maxHz = 2100,
    bufferSize = 2048,
    hopSize = 512,
    minNoteMs = 70,
    minRestMs = 25,
    bpm,
    beatsPerBar = 4,
    clarityThreshold = 0.55,
  } = options

  if (samples.length < bufferSize) {
    return { ok: false, error: `That is under ${bufferSize} samples of audio. Nothing to read.` }
  }

  const pitches = framePitches(normalise(samples), {
    sampleRate, minHz, maxHz, bufferSize, hopSize, clarityThreshold,
  })
  const voicedFrames = pitches.filter((midi) => midi !== null).length

  const secondsPerFrame = hopSize / sampleRate
  const frames = (ms: number): number => Math.max(1, Math.round(ms / 1000 / secondsPerFrame))
  const raw = toRuns(pitches)
  const runs = foldShortGaps(prune(raw, frames(minNoteMs), frames(minRestMs)), frames(minNoteMs))

  if (!runs.some((run) => run.midi !== null)) {
    return {
      ok: false,
      error: 'No pitch anywhere in that. Either it is silent, or nothing in it holds a steady note '
        + `long enough to be one — or it is all outside ${minHz}-${maxHz} Hz.`,
    }
  }

  const durations = runs.map((run) => run.frames * secondsPerFrame)
  const beatSec = bpm !== undefined && bpm > 0 ? 60 / bpm : fitTempo(durations)

  const quantised = runs.map((run, at) => ({
    note: run.midi === null
      ? null
      : { note: midiToNote(run.midi), beats: nearestValue((durations[at] ?? 0) / beatSec).value },
    beats: nearestValue((durations[at] ?? 0) / beatSec).value,
  }))

  return {
    ok: true,
    transcription: {
      notes: quantised.flatMap((run) => run.note === null ? [] : [run.note]),
      spec: renderSpec(quantised, beatsPerBar),
      bpm: Math.round(60 / beatSec),
      rests: quantised.filter((run) => run.note === null).length,
      rawRuns: raw.length,
      frames: pitches.length,
      voiced: pitches.length === 0 ? 0 : voicedFrames / pitches.length,
    },
  }
}
