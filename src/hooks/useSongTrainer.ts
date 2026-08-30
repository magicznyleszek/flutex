import { useCallback, useEffect, useRef, useState } from 'react'

import { centsFromNote, freqToNearestNote } from '../lib/music'
import type { PitchReading } from '../lib/pitch'
import {
  createTrainerEngine,
  type PenaltyMode,
  type TrainerEngine,
  type TrainerSnapshot,
} from '../lib/trainer'

export interface TrainerView extends TrainerSnapshot {
  /** The note recognised from the microphone, right or wrong. */
  detectedNote: string | null
  /** Deviation from the target note in cents. */
  cents: number
  /** Confidence in the reading, 0-1. */
  clarity: number
}

export interface UseSongTrainerOptions {
  notes: readonly string[]
  toleranceCents: number
  penaltyMode: PenaltyMode
}

export interface SongTrainer {
  view: TrainerView
  handleFrame: (reading: PitchReading) => void
  reset: () => void
}

/** Detection runs at 60 fps. Bar and tuner movement is capped to ~30. */
const UI_INTERVAL_MS = 33

const asView = (snapshot: TrainerSnapshot): TrainerView => ({
  ...snapshot,
  detectedNote: null,
  cents: 0,
  clarity: 0,
})

/**
 * One microphone reading per frame in, a throttled view out. `notes` is compared by
 * identity, so a caller that rebuilds the array every render restarts the song.
 */
export function useSongTrainer({
  notes,
  toleranceCents,
  penaltyMode,
}: UseSongTrainerOptions): SongTrainer {
  // Held in state rather than a ref because the initial view below reads it during
  // render.
  const [engine] = useState<TrainerEngine>(() =>
    createTrainerEngine(notes, { toleranceCents, penaltyMode }),
  )

  const [view, setView] = useState<TrainerView>(() => asView(engine.snapshot()))
  const viewRef = useRef(view)
  const lastPushRef = useRef(0)
  const loadedNotesRef = useRef(notes)

  const publish = useCallback((next: TrainerView) => {
    const previous = viewRef.current

    // These are what the player reacts to, so they skip the throttle below.
    const structural
      = next.status !== previous.status
      || next.index !== previous.index
      || next.finished !== previous.finished
      || next.detectedNote !== previous.detectedNote
      || next.hits !== previous.hits
      || next.mistakes !== previous.mistakes

    if (!structural) {
      const idle
        = Math.abs(next.cents - previous.cents) < 0.5
        && Math.abs(next.holdProgress - previous.holdProgress) < 0.004
        && Math.abs(next.mistakeProgress - previous.mistakeProgress) < 0.004
        && Math.abs(next.clarity - previous.clarity) < 0.05

      // Nothing moves during silence, so there is nothing to render.
      if (idle) return

      const now = performance.now()
      if (now - lastPushRef.current < UI_INTERVAL_MS) return
      lastPushRef.current = now
    }

    viewRef.current = next
    setView(next)
  }, [])

  const handleFrame = useCallback(
    (reading: PitchReading) => {
      const { target } = engine.snapshot()
      const detected = reading.hz > 0 ? freqToNearestNote(reading.hz) : null
      const cents
        = detected !== null && target !== null ? centsFromNote(reading.hz, target) : 0

      const snapshot = engine.step({ note: detected?.note ?? null, cents })

      publish({
        ...snapshot,
        detectedNote: detected?.note ?? null,
        cents,
        clarity: reading.clarity,
      })
    },
    [engine, publish],
  )

  const reset = useCallback(() => {
    const next = asView(engine.reset())
    viewRef.current = next
    lastPushRef.current = 0
    setView(next)
  }, [engine])

  // Pushed into the engine instead of captured by the frame loop, so difficulty and
  // penalty changes take effect mid-song.
  useEffect(() => {
    engine.configure({ toleranceCents, penaltyMode })
  }, [engine, toleranceCents, penaltyMode])

  useEffect(() => {
    if (loadedNotesRef.current === notes) return
    loadedNotesRef.current = notes

    const next = asView(engine.loadSong(notes))
    viewRef.current = next
    lastPushRef.current = 0
    setView(next)
  }, [engine, notes])

  return { view, handleFrame, reset }
}
