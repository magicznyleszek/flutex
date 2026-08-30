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

/**
 * Detection runs 60 times a second, but the eye does not need 60 renders.
 * Game-state changes are published immediately; bar and tuner movement is
 * throttled to ~30 fps.
 */
const UI_INTERVAL_MS = 33

const asView = (snapshot: TrainerSnapshot): TrainerView => ({
  ...snapshot,
  detectedNote: null,
  cents: 0,
  clarity: 0,
})

export function useSongTrainer({
  notes,
  toleranceCents,
  penaltyMode,
}: UseSongTrainerOptions): SongTrainer {
  // The engine is created once and lives for as long as the component is
  // mounted. useState with a lazy initialiser rather than a ref: reading a ref
  // during render is a trap (and react-hooks rightly flags it), and the
  // engine's identity never changes anyway.
  const [engine] = useState<TrainerEngine>(() =>
    createTrainerEngine(notes, { toleranceCents, penaltyMode }),
  )

  const [view, setView] = useState<TrainerView>(() => asView(engine.snapshot()))
  const viewRef = useRef(view)
  const lastPushRef = useRef(0)
  const loadedNotesRef = useRef(notes)

  const publish = useCallback((next: TrainerView) => {
    const previous = viewRef.current

    // A change of note, status or counter has to be visible at once — that is
    // what the player reacts to.
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

  // The configuration is injected into the engine rather than captured by the
  // frame loop, so changing difficulty or penalty mode works mid-song.
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
