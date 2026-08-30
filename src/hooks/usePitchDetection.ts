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

export function usePitchDetection({
  minFreq,
  maxFreq,
  onFrame,
}: UsePitchDetectionOptions): PitchDetectionControls {
  const [status, setStatus] = useState<MicStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const sessionRef = useRef<AudioSession | null>(null)

  // The requestAnimationFrame loop reschedules itself, so it would close over
  // the callback from the first render for the whole listening session. The ref
  // is refreshed after every render, so each frame always sees the current game
  // configuration. This was the cause of the "changing difficulty does nothing"
  // bug.
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  const closeSession = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null

    cancelAnimationFrame(session.frame)
    // Closing the AudioContext alone does not turn off the browser's mic
    // indicator — the stream tracks have to be stopped by hand.
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
      // Speech processing is turned off: noise suppression and automatic gain
      // control mangle long, steady tones and ruin detection.
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

  // Switching instruments changes the frequency range being searched. The
  // detector is rebuilt in place so listening is never interrupted.
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
