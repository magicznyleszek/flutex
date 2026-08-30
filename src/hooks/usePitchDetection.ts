import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createMedianFilter,
  createPitchDetector,
  type MedianFilter,
  type PitchDetector,
  type PitchReading,
} from '../lib/pitch'

const FFT_SIZE = 2048

export type MicStatus = 'idle' | 'starting' | 'listening' | 'error'

export interface UsePitchDetectionOptions {
  minFreq: number
  maxFreq: number
  /** Called once per animation frame, including on silence (hz = -1). */
  onFrame: (reading: PitchReading) => void
}

export interface PitchDetectionControls {
  status: MicStatus
  error: string | null
  isListening: boolean
  start: () => Promise<void>
  stop: () => void
}

interface AudioSession {
  stream: MediaStream
  context: AudioContext
  analyser: AnalyserNode
  /** TS 5.7+ parameterises TypedArray by buffer type; AnalyserNode wants ArrayBuffer. */
  buffer: Float32Array<ArrayBuffer>
  detect: PitchDetector
  median: MedianFilter
  frame: number
}

/** Failures land in `status` and `error` instead of rejecting `start`. */
export function usePitchDetection({
  minFreq,
  maxFreq,
  onFrame,
}: UsePitchDetectionOptions): PitchDetectionControls {
  const [status, setStatus] = useState<MicStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const sessionRef = useRef<AudioSession | null>(null)

  // The frame loop reschedules itself, so a captured callback would stay on the
  // first render's game configuration for the whole listening session.
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  const closeSession = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null

    cancelAnimationFrame(session.frame)
    // Closing the AudioContext leaves the browser's mic indicator on. The tracks
    // have to be stopped by hand.
    for (const track of session.stream.getTracks()) track.stop()
    void session.context.close().catch(() => undefined)
  }, [])

  const stop = useCallback(() => {
    closeSession()
    setStatus('idle')
  }, [closeSession])

  const start = useCallback(async () => {
    if (sessionRef.current) return

    setStatus('starting')
    setError(null)

    try {
      // Noise suppression and automatic gain control mangle long, steady tones and
      // ruin detection.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = FFT_SIZE
      context.createMediaStreamSource(stream).connect(analyser)

      const session: AudioSession = {
        stream,
        context,
        analyser,
        buffer: new Float32Array(analyser.fftSize),
        detect: createPitchDetector({
          sampleRate: context.sampleRate,
          bufferSize: analyser.fftSize,
          minFreq,
          maxFreq,
        }),
        median: createMedianFilter(3),
        frame: 0,
      }

      const tick = (): void => {
        const active = sessionRef.current
        if (!active) return

        active.analyser.getFloatTimeDomainData(active.buffer)
        const reading = active.detect(active.buffer)
        onFrameRef.current({ ...reading, hz: active.median(reading.hz) })

        active.frame = requestAnimationFrame(tick)
      }

      sessionRef.current = session
      setStatus('listening')
      session.frame = requestAnimationFrame(tick)
    } catch (cause) {
      closeSession()
      setStatus('error')
      setError(
        cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow it in the site settings.'
          : 'Could not open the microphone. Check whether another app is using it.',
      )
    }
  }, [closeSession, minFreq, maxFreq])

  // Switching instruments changes the search range. Rebuilding the detector in
  // place keeps the running session alive.
  useEffect(() => {
    const session = sessionRef.current
    if (!session) return

    session.detect = createPitchDetector({
      sampleRate: session.context.sampleRate,
      bufferSize: session.analyser.fftSize,
      minFreq,
      maxFreq,
    })
  }, [minFreq, maxFreq])

  useEffect(() => closeSession, [closeSession])

  return {
    status,
    error,
    isListening: status === 'listening',
    start,
    stop,
  }
}
