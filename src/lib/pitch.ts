// Pitch detection with the McLeod Pitch Method (MPM — normalised square
// difference function). Compared to raw autocorrelation it buys three things:
//
//  1. Only the lags that fall inside the instrument's range are computed
//     instead of all 1024 — roughly a 10x cut in work.
//  2. Window energy comes from prefix sums, so normalisation is O(1) per lag
//     instead of O(n).
//  3. The NSDF is normalised to <-1, 1>, so peak height doubles as a measure
//     of tone clarity and lets us reject noise without guessing thresholds.

export interface PitchReading {
  /** Frequency in Hz, or -1 when no tone was detected. */
  hz: number
  /** Tone clarity, 0-1. A sine reads ~1, noise close to 0. */
  clarity: number
  /** Signal loudness (RMS) — useful for an input-level meter. */
  rms: number
}

export interface PitchDetectorOptions {
  sampleRate: number
  /** Analysis window length; must match the analyser's fftSize. */
  bufferSize?: number
  minFreq?: number
  maxFreq?: number
  /** Below this loudness the input counts as silence. */
  rmsThreshold?: number
  /** Minimum clarity for a reading to be trusted. */
  clarityThreshold?: number
  /** How tall the first peak must be relative to the highest one. */
  peakRatio?: number
}

export type PitchDetector = (buffer: Float32Array) => PitchReading

export function createPitchDetector({
  sampleRate,
  bufferSize = 2048,
  minFreq = 350,
  maxFreq = 2600,
  rmsThreshold = 0.012,
  clarityThreshold = 0.55,
  peakRatio = 0.85,
}: PitchDetectorOptions): PitchDetector {
  const minLag = Math.max(2, Math.floor(sampleRate / maxFreq))
  // Past half the window there are too few overlapping samples left.
  const maxLag = Math.min(bufferSize >> 1, Math.ceil(sampleRate / minFreq))

  // One extra lag is computed on each side of the range we actually search.
  // Without that margin a peak sitting exactly on minFreq or maxFreq has no
  // neighbour to compare against and gets skipped — a tone at the edge of the
  // instrument's range would then fall through to its subharmonic.
  const searchMin = Math.max(2, minLag - 1)
  const searchMax = Math.min(bufferSize >> 1, maxLag + 1)
  const lagCount = Math.max(0, searchMax - searchMin + 1)

  // Index range the peak search is allowed to touch (== minFreq..maxFreq).
  const firstPeakIndex = Math.max(1, minLag - searchMin)
  const lastPeakIndex = Math.min(lagCount - 2, maxLag - searchMin)

  // Buffers are allocated once. The loop runs 60x/s and must not create garbage.
  const nsdf = new Float32Array(lagCount)
  const prefixSquares = new Float64Array(bufferSize + 1)

  const noPitch = (rms: number): PitchReading => ({ hz: -1, clarity: 0, rms })

  return function detect(buffer: Float32Array): PitchReading {
    let sumSquares = 0
    for (let i = 0; i < bufferSize; i++) {
      // Indices are in range by the loop condition, hence the assertions in hot code.
      const sample = buffer[i] as number
      sumSquares += sample * sample
      prefixSquares[i + 1] = sumSquares
    }

    const rms = Math.sqrt(sumSquares / bufferSize)
    if (rms < rmsThreshold || lagCount < 3) return noPitch(rms)

    const totalEnergy = prefixSquares[bufferSize] as number

    for (let lag = searchMin; lag <= searchMax; lag++) {
      const overlap = bufferSize - lag
      let correlation = 0
      for (let j = 0; j < overlap; j++) {
        correlation += (buffer[j] as number) * (buffer[j + lag] as number)
      }

      // Energy of both compared windows, pulled from prefix sums instead of a
      // second loop — this is the trick that brings the cost down.
      const energy
        = (prefixSquares[overlap] as number)
        + (totalEnergy - (prefixSquares[lag] as number))

      nsdf[lag - searchMin] = energy > 0 ? (2 * correlation) / energy : 0
    }

    let highestPeak = -Infinity
    for (let i = 0; i < lagCount; i++) {
      const value = nsdf[i] as number
      if (value > highestPeak) highestPeak = value
    }
    if (highestPeak <= 0) return noPitch(rms)

    // Take the FIRST tall-enough peak, not the highest one. The highest often
    // lands on a multiple of the period, which would read an octave too low.
    const cutoff = highestPeak * peakRatio
    let peakIndex = -1
    for (let i = firstPeakIndex; i <= lastPeakIndex; i++) {
      const value = nsdf[i] as number
      if (value > cutoff && value >= (nsdf[i - 1] as number) && value > (nsdf[i + 1] as number)) {
        peakIndex = i
        break
      }
    }
    if (peakIndex < 0) return noPitch(rms)

    // Parabolic interpolation. Without it the resolution is whole samples,
    // which at 600 Hz means jumps of a dozen-plus cents.
    const y1 = nsdf[peakIndex - 1] as number
    const y2 = nsdf[peakIndex] as number
    const y3 = nsdf[peakIndex + 1] as number
    const a = (y1 + y3 - 2 * y2) / 2
    const b = (y3 - y1) / 2

    let shift = 0
    let clarity = y2
    if (a < 0) {
      shift = Math.max(-1, Math.min(1, -b / (2 * a)))
      clarity = Math.min(1, y2 - (b * b) / (4 * a))
    }

    const hz = sampleRate / (searchMin + peakIndex + shift)
    if (clarity < clarityThreshold) return noPitch(rms)
    // A margin, because minLag and maxLag are rounded to whole samples.
    if (hz < minFreq * 0.9 || hz > maxFreq * 1.1) return noPitch(rms)

    return { hz, clarity, rms }
  }
}

export type MedianFilter = (value: number) => number

/**
 * Median of the last N readings. Kills single-frame octave jumps without the
 * lag a moving average would add. Silence clears the history so releasing a
 * note registers immediately — the trainer depends on that.
 */
export function createMedianFilter(size = 3): MedianFilter {
  const history: number[] = []
  const sorted: number[] = []

  return function push(value: number): number {
    if (!(value > 0)) {
      history.length = 0
      return -1
    }

    history.push(value)
    if (history.length > size) history.shift()
    if (history.length < size) return value

    sorted.length = 0
    for (const item of history) sorted.push(item)
    sorted.sort((x, y) => x - y)

    return sorted[(sorted.length - 1) >> 1] as number
  }
}
