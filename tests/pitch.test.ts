import { createMedianFilter, createPitchDetector } from '../src/lib/pitch'
import { centsBetween, noteToFreq } from '../src/lib/music'

const SAMPLE_RATE = 48000
const BUFFER_SIZE = 2048

interface SynthOptions {
  /** Amplitude of each harmonic, starting with the fundamental. */
  harmonics?: readonly number[]
  amplitude?: number
  phase?: number
  noise?: number
}

/** A test signal: the sum of harmonics at the given amplitudes. */
function synth(hz: number, options: SynthOptions = {}): Float32Array {
  const { harmonics = [1], amplitude = 0.3, phase = 0, noise = 0 } = options
  const buffer = new Float32Array(BUFFER_SIZE)

  for (let i = 0; i < BUFFER_SIZE; i++) {
    let value = 0
    harmonics.forEach((gain, position) => {
      const partial = position + 1
      value += gain * Math.sin(2 * Math.PI * hz * partial * (i / SAMPLE_RATE) + phase)
    })
    if (noise > 0) value += noise * (Math.random() * 2 - 1)
    buffer[i] = amplitude * value
  }

  return buffer
}

const freq = (note: string): number => noteToFreq(note) as number
const detector = () => createPitchDetector({ sampleRate: SAMPLE_RATE, bufferSize: BUFFER_SIZE })

/**
 * Counts typed-array constructions during `run`.
 *
 * Reading `heapUsed` would be simpler but depends on when the GC decides to
 * run — the same code passed on one attempt and failed on the next. A Proxy on
 * the constructor gives a deterministic answer.
 */
function countTypedArrayAllocations(run: () => void): number {
  let count = 0

  const RealFloat32Array = globalThis.Float32Array
  const RealFloat64Array = globalThis.Float64Array

  const counting = <T extends object>(constructor: T): T =>
    new Proxy(constructor, {
      construct(target, args) {
        count += 1
        return Reflect.construct(target as never, args) as object
      },
    })

  globalThis.Float32Array = counting(RealFloat32Array)
  globalThis.Float64Array = counting(RealFloat64Array)

  try {
    run()
  } finally {
    globalThis.Float32Array = RealFloat32Array
    globalThis.Float64Array = RealFloat64Array
  }

  return count
}

describe('createPitchDetector', () => {
  it('reads a pure tone to better than one cent', () => {
    const detect = detector()

    for (const note of ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6', 'A6', 'B6']) {
      const expected = freq(note)
      const { hz, clarity } = detect(synth(expected))

      expect(hz).toBeGreaterThan(0)
      expect(Math.abs(centsBetween(hz, expected))).toBeLessThan(1)
      expect(clarity).toBeGreaterThan(0.9)
    }
  })

  it('avoids octave errors on a harmonically rich tone', () => {
    const detect = detector()
    // A strong second harmonic is the classic trap: naive autocorrelation can
    // land an octave too high or too low here.
    const harmonics = [1, 0.8, 0.5, 0.3, 0.2]

    for (const note of ['D5', 'G5', 'A5', 'D6']) {
      const expected = freq(note)
      const { hz } = detect(synth(expected, { harmonics, amplitude: 0.15 }))

      expect(hz).toBeGreaterThan(0)
      expect(Math.abs(centsBetween(hz, expected))).toBeLessThan(15)
    }
  })

  it('is insensitive to phase offset', () => {
    const detect = detector()
    const expected = freq('F#5')

    for (const phase of [0, 0.7, 1.6, 2.9, 4.2, 5.8]) {
      const { hz } = detect(synth(expected, { phase }))
      expect(Math.abs(centsBetween(hz, expected))).toBeLessThan(2)
    }
  })

  it('reads a noisy tone but reports lower clarity', () => {
    const detect = detector()
    const expected = freq('A5')
    const { hz, clarity } = detect(synth(expected, { noise: 0.25 }))

    expect(hz).toBeGreaterThan(0)
    expect(Math.abs(centsBetween(hz, expected))).toBeLessThan(10)
    expect(clarity).toBeLessThan(1)
  })

  it('gives no reading for silence, a quiet signal or noise', () => {
    const detect = detector()

    expect(detect(new Float32Array(BUFFER_SIZE)).hz).toBe(-1)
    expect(detect(synth(freq('A5'), { amplitude: 0.001 })).hz).toBe(-1)

    const noiseOnly = new Float32Array(BUFFER_SIZE)
    for (let i = 0; i < BUFFER_SIZE; i++) noiseOnly[i] = (Math.random() * 2 - 1) * 0.3
    expect(detect(noiseOnly).hz).toBe(-1)
  })

  it('rejects tones below the range', () => {
    const detect = createPitchDetector({
      sampleRate: SAMPLE_RATE,
      bufferSize: BUFFER_SIZE,
      minFreq: 500,
      maxFreq: 1000,
    })

    expect(detect(synth(700)).hz).toBeGreaterThan(0)
    // The period of 220 Hz is longer than the largest lag searched.
    expect(detect(synth(220)).hz).toBe(-1)
  })

  it('never reports a frequency outside the range', () => {
    const minFreq = 500
    const maxFreq = 1000
    const detect = createPitchDetector({
      sampleRate: SAMPLE_RATE,
      bufferSize: BUFFER_SIZE,
      minFreq,
      maxFreq,
    })

    // A tone above the range cannot be rejected outright: 3000 Hz is also
    // periodic at 1000, 750 and 600 Hz, so any period-based method sees a valid
    // period here. The only guarantee is that the reading stays inside the
    // configured range and never hands the trainer a wild value.
    for (const hz of [3000, 2350, 4400]) {
      const reading = detect(synth(hz))
      if (reading.hz > 0) {
        expect(reading.hz).toBeGreaterThanOrEqual(minFreq * 0.9)
        expect(reading.hz).toBeLessThanOrEqual(maxFreq * 1.1)
      }
    }
  })

  it('recognises a tone sitting exactly on the range boundary', () => {
    const minFreq = 550
    const maxFreq = 1100
    const detect = createPitchDetector({
      sampleRate: SAMPLE_RATE,
      bufferSize: BUFFER_SIZE,
      minFreq,
      maxFreq,
    })

    // A peak at the outermost lag has no neighbour on one side. Without a
    // margin in the NSDF table such a tone fell onto its subharmonic.
    for (const hz of [minFreq, maxFreq]) {
      const reading = detect(synth(hz))
      expect(reading.hz).toBeGreaterThan(0)
      expect(Math.abs(centsBetween(reading.hz, hz))).toBeLessThan(5)
    }
  })

  it('allocates no buffers while analysing a frame', () => {
    const detect = detector()
    const buffer = synth(freq('G5'))

    // 500 calls is roughly 8 seconds of playing at 60 fps. The detector should
    // receive every array up front, not inside the analysis loop.
    const allocations = countTypedArrayAllocations(() => {
      for (let i = 0; i < 500; i++) detect(buffer)
    })

    expect(allocations).toBe(0)
    // Counter self-check: if the Proxy failed to intercept construction, the
    // assertion above would always pass. Creating a detector must allocate.
    expect(countTypedArrayAllocations(() => void detector())).toBeGreaterThan(0)
  })
})

describe('createMedianFilter', () => {
  it('rejects a single outlier', () => {
    const median = createMedianFilter(3)

    expect(median(600)).toBe(600) // buffer not full yet — passed straight through
    expect(median(601)).toBe(601)
    expect(median(602)).toBe(601)
    expect(median(1200)).toBe(602) // an octave jump smoothed away
    expect(median(603)).toBe(603)
  })

  it('reacts to silence immediately', () => {
    const median = createMedianFilter(3)
    median(600)
    median(600)
    median(600)

    expect(median(-1)).toBe(-1)
    // After silence the history is clear, so the next tone passes at once.
    expect(median(800)).toBe(800)
  })
})
