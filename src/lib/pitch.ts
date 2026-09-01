// Pitch detection with the McLeod Pitch Method (normalised square difference). Only the lags inside
// the instrument's range are computed, about a tenth of the 1024 possible, and prefix sums keep
// normalisation O(1) per lag. The NSDF lands in <-1, 1>, so peak height doubles as a clarity score.

export interface PitchReading {
  /** Frequency in Hz, or -1 when no tone was detected. */
  hz: number
  /** Tone clarity, 0-1. A sine reads ~1, noise close to 0. */
  clarity: number
  /** Signal loudness (RMS), for the input-level meter. */
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

  // One lag of margin each side: a peak sitting exactly on minFreq or maxFreq would have no
  // neighbour to compare against, get skipped, and read as its subharmonic.
  const searchMin = Math.max(2, minLag - 1)
  const searchMax = Math.min(bufferSize >> 1, maxLag + 1)
  const lagCount = Math.max(0, searchMax - searchMin + 1)

  // Index range the peak search is allowed to touch (== minFreq..maxFreq).
  const firstPeakIndex = Math.max(1, minLag - searchMin)
  const lastPeakIndex = Math.min(lagCount - 2, maxLag - searchMin)

  // Allocated once. Detection runs 60x/s and must not create garbage.
  const nsdf = new Float32Array(lagCount)
  const prefixSquares = new Float64Array(bufferSize + 1)

  const noPitch = (rms: number): PitchReading => ({ hz: -1, clarity: 0, rms })

  return function detect(buffer: Float32Array): PitchReading {
    let sumSquares = 0
    for (let i = 0; i < bufferSize; i++) {
      // `as number` here and below: the loop bounds keep the index in range, which
      // noUncheckedIndexedAccess cannot see.
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

      // Energy of both compared windows, from prefix sums instead of a second loop.
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

    // First peak within `peakRatio` of the tallest: the tallest often lands on a multiple of the
    // period, which reads an octave too low.
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

    // Parabolic interpolation: whole-sample resolution jumps a dozen cents or more around 600 Hz.
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
    // 10% margin, since minLag and maxLag are rounded to whole samples.
    if (hz < minFreq * 0.9 || hz > maxFreq * 1.1) return noPitch(rms)

    return { hz, clarity, rms }
  }
}

export type MedianFilter = (value: number) => number

/**
 * Median of the last N readings: kills single-frame octave jumps without a moving average's lag.
 * Silence clears the history, so releasing a note registers right away.
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
