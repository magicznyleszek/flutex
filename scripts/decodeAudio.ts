/**
 * A file on disk to mono samples, for `audioToSong`. The browser gets this free from `decodeAudioData`; Node
 * does not, so WAV is parsed here and everything else handed to ffmpeg — which is what makes MP3, M4A, FLAC
 * and the rest work without a line of format code each, while a plain recording needs nothing installed.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface DecodedAudio {
  /** Mono, channels averaged. */
  samples: Float32Array
  sampleRate: number
  /** Channels in the source, before the downmix — worth reporting, not worth keeping. */
  channels: number
  /** How it was read, for the report: the format, and whether ffmpeg was involved. */
  via: string
}

/** What ffmpeg is asked to produce: the one WAV flavour `decodeWav` is guaranteed to handle. */
const FFMPEG_RATE = 44100

const ascii = (bytes: Buffer, at: number): string => bytes.toString('latin1', at, at + 4)

/** Reads one sample as a number in <-1, 1>, by the format the `fmt ` chunk declared. */
function sampleReader(
  format: number,
  bits: number,
): ((bytes: Buffer, at: number) => number) | null {
  if (format === 3) {
    if (bits === 32) return (bytes, at) => bytes.readFloatLE(at)
    if (bits === 64) return (bytes, at) => bytes.readDoubleLE(at)
    return null
  }

  if (format !== 1) return null

  // 8-bit WAV is the odd one out: unsigned, centred on 128.
  if (bits === 8) return (bytes, at) => ((bytes.readUInt8(at) - 128) / 128)
  if (bits === 16) return (bytes, at) => bytes.readInt16LE(at) / 32768
  if (bits === 24) return (bytes, at) => bytes.readIntLE(at, 3) / 8388608
  if (bits === 32) return (bytes, at) => bytes.readInt32LE(at) / 2147483648

  return null
}

interface WavFormat {
  format: number
  channels: number
  sampleRate: number
  bits: number
}

/**
 * Walks the RIFF chunks for the two that matter. A WAV in the wild carries any number of others — `LIST`,
 * `fact`, a stray `id3 ` — so `fmt ` and `data` are not where a minimal file would put them.
 */
function readChunks(bytes: Buffer): { format: WavFormat | null, data: Buffer | null } {
  let format: WavFormat | null = null
  let data: Buffer | null = null

  let at = 12
  while (at + 8 <= bytes.length) {
    const id = ascii(bytes, at)
    const size = bytes.readUInt32LE(at + 4)
    const body = at + 8
    // A truncated final chunk is common in streamed WAVs: take what is actually there.
    const end = Math.min(body + size, bytes.length)

    if (id === 'fmt ' && size >= 16) {
      format = {
        // 0xFFFE is "extensible", which keeps the real format code in its sub-format GUID.
        format: bytes.readUInt16LE(body) === 0xFFFE && size >= 26
          ? bytes.readUInt16LE(body + 24)
          : bytes.readUInt16LE(body),
        channels: bytes.readUInt16LE(body + 2),
        sampleRate: bytes.readUInt32LE(body + 4),
        bits: bytes.readUInt16LE(body + 14),
      }
    } else if (id === 'data') {
      data = bytes.subarray(body, end)
    }

    at = body + size + (size % 2)
  }

  return { format, data }
}

/**
 * Null for anything this cannot read — another format, or a WAV with a truncated header or MP3 frames in a
 * RIFF wrapper. Never throws: the caller's next move is ffmpeg either way, and it does better on an odd WAV.
 */
function decodeWav(bytes: Buffer): DecodedAudio | null {
  if (bytes.length < 12 || ascii(bytes, 0) !== 'RIFF' || ascii(bytes, 8) !== 'WAVE') return null

  const { format, data } = readChunks(bytes)
  if (format === null || data === null) return null

  const { channels, sampleRate, bits } = format
  const read = sampleReader(format.format, bits)
  if (read === null || channels < 1 || sampleRate < 1) return null

  const bytesPerSample = bits / 8
  const frames = Math.floor(data.length / (bytesPerSample * channels))
  const samples = new Float32Array(frames)

  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0
    for (let channel = 0; channel < channels; channel += 1) {
      sum += read(data, (frame * channels + channel) * bytesPerSample)
    }
    samples[frame] = sum / channels
  }

  return {
    samples,
    sampleRate,
    channels,
    via: `WAV, ${bits}-bit${channels > 1 ? `, ${channels} channels downmixed` : ''}`,
  }
}

/** `code` and `stderr` off a child-process failure, neither of which is on `Error` itself. */
function failure(error: unknown): { code: string, stderr: string } {
  const thrown: Partial<Record<'code' | 'stderr', unknown>> = error ?? {}

  return {
    code: typeof thrown.code === 'string' ? thrown.code : '',
    stderr: thrown.stderr === undefined ? String(error) : String(thrown.stderr).trim(),
  }
}

/**
 * Anything that is not a readable WAV, through ffmpeg and back as one. Via a temp file rather than a pipe: a
 * few minutes of audio is tens of megabytes, and `execFileSync` caps its output.
 */
function decodeViaFfmpeg(path: string): DecodedAudio {
  const scratch = join(tmpdir(), `flutex-${process.pid}-${Date.now()}.wav`)

  try {
    execFileSync('ffmpeg', [
      '-v', 'error',
      '-i', path,
      '-f', 'wav',
      '-acodec', 'pcm_s16le',
      '-ac', '1',
      '-ar', String(FFMPEG_RATE),
      '-y', scratch,
    ], { stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (error) {
    const { code, stderr } = failure(error)
    throw new Error(code === 'ENOENT'
      ? 'ffmpeg is not installed, and this is not a WAV this can read. Install it '
        + '(brew install ffmpeg), or convert the file to 16-bit WAV yourself.'
      : `ffmpeg could not read that file:\n${stderr}`, { cause: error })
  }

  try {
    const decoded = decodeWav(readFileSync(scratch))
    if (decoded === null) throw new Error('ffmpeg produced something that is not a WAV.')

    return { ...decoded, via: `${decoded.via}, converted by ffmpeg` }
  } finally {
    rmSync(scratch, { force: true })
  }
}

/**
 * A path to mono samples. Throws with a sentence worth printing, every failure here being something the
 * caller can act on; `via` says which of the two roads it came down.
 */
export function decodeAudio(path: string): DecodedAudio {
  return decodeWav(readFileSync(path)) ?? decodeViaFfmpeg(path)
}
