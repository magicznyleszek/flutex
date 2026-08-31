import { useCallback, useEffect, useRef, useState } from 'react'

import type { SongNote } from '../data/songUtils'
import { noteToFreq } from '../lib/music'

/**
 * One beat is a quarter note everywhere in the song library, so 60 bpm puts a quarter note
 * on the second. Deliberately slow: this is meant to be followed on the instrument, and the
 * gap between two notes is where you find the next fingering.
 */
const DEMO_BPM = 60

/** Fraction of each note left silent at its end, so the same note twice is heard as two. */
const GAP_RATIO = 0.18

/** Seconds. Enough that a note does not click on, little enough not to smear its pitch. */
const ATTACK_S = 0.015
const RELEASE_S = 0.05

/** Peak gain of one note. Notes never overlap, so this is the whole output level. */
const NOTE_GAIN = 0.18

/** Seconds of silence before the first note, so it is not clipped by its own scheduling. */
const LEAD_IN_S = 0.12

/** Seconds to fade the master gain on stop, rather than cutting a running oscillator. */
const FADE_OUT_S = 0.03

/** Enough for the fade above to have been heard before the context goes away. */
const CLOSE_DELAY_MS = 80

interface DemoSession {
  context: AudioContext
  master: GainNode
  /** Seconds from the first note at which each note begins. */
  starts: readonly number[]
  /** Seconds the song takes, its silent tail included. */
  duration: number
  /** The `currentTime` the first note was scheduled for. */
  origin: number
  frame: number
}

export interface SongDemo {
  playing: boolean
  /** The note sounding now, back to 0 once playback stops. */
  index: number
  start: () => void
  stop: () => void
}

/**
 * Plays the song through the speakers and reports which note is sounding, so the fingering charts
 * can follow along. It demonstrates the tune rather than accompanying you: the rhythm is only ever
 * as good as the `beats` in the song data.
 *
 * Every note is scheduled into the AudioContext in one go and the on-screen position read back off
 * `currentTime` — separate timers for sound and charts would drift apart within a few bars.
 */
export function useSongDemo(notes: readonly SongNote[]): SongDemo {
  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)

  const sessionRef = useRef<DemoSession | null>(null)
  // The frame loop reads the position it last published; state would be a render behind.
  const indexRef = useRef(0)

  const stop = useCallback(() => {
    const session = sessionRef.current
    sessionRef.current = null

    indexRef.current = 0
    setIndex(0)
    setPlaying(false)

    if (session === null) return

    cancelAnimationFrame(session.frame)

    // Silencing a running oscillator is a click, so the master gain goes down first and the
    // context is closed once that fade has been heard.
    const { context, master } = session
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + FADE_OUT_S)
    setTimeout(() => void context.close().catch(() => undefined), CLOSE_DELAY_MS)
  }, [])

  const start = useCallback(() => {
    if (sessionRef.current !== null || notes.length === 0) return

    const context = new AudioContext()
    // A context built inside a tap usually starts running on its own; iOS is the one that
    // hands back a suspended one, where `currentTime` never moves and nothing sounds.
    void context.resume().catch(() => undefined)

    const master = context.createGain()
    master.connect(context.destination)

    const beatSeconds = 60 / DEMO_BPM
    const origin = context.currentTime + LEAD_IN_S
    const starts: number[] = []
    let cursor = 0

    for (const entry of notes) {
      // A song with a bad `beats` would otherwise schedule a note of length NaN and take
      // every note after it along with it.
      const beats = Number.isFinite(entry.beats) && entry.beats > 0 ? entry.beats : 1
      const span = beats * beatSeconds
      const offset = cursor

      starts.push(offset)
      cursor += span

      // A name that will not parse still takes up its beats, so the charts stay in step.
      const hz = noteToFreq(entry.note)
      if (hz === null) continue

      const from = origin + offset
      const until = from + Math.max(ATTACK_S + RELEASE_S, span * (1 - GAP_RATIO))

      const envelope = context.createGain()
      envelope.gain.setValueAtTime(0, from)
      envelope.gain.linearRampToValueAtTime(NOTE_GAIN, from + ATTACK_S)
      envelope.gain.setValueAtTime(NOTE_GAIN, until - RELEASE_S)
      envelope.gain.linearRampToValueAtTime(0, until)
      envelope.connect(master)

      const oscillator = context.createOscillator()
      // Triangle, not sine: its harmonics fall away as 1/n², which is not far off a whistle,
      // and it still carries through a phone speaker where a sine goes thin.
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(hz, from)
      oscillator.connect(envelope)
      oscillator.start(from)
      oscillator.stop(until)
    }

    const session: DemoSession = {
      context,
      master,
      starts,
      duration: cursor,
      origin,
      frame: 0,
    }

    indexRef.current = 0
    setIndex(0)
    setPlaying(true)

    const tick = (): void => {
      const active = sessionRef.current
      if (active === null) return

      const elapsed = active.context.currentTime - active.origin
      if (elapsed >= active.duration) {
        stop()
        return
      }

      // Walks forward from where it was rather than searching the whole song, which also
      // means a stalled tab catches up in one frame instead of skipping notes.
      let position = indexRef.current
      while (
        position + 1 < active.starts.length
        && (active.starts[position + 1] ?? Infinity) <= elapsed
      ) {
        position += 1
      }

      if (position !== indexRef.current) {
        indexRef.current = position
        setIndex(position)
      }

      active.frame = requestAnimationFrame(tick)
    }

    sessionRef.current = session
    session.frame = requestAnimationFrame(tick)
  }, [notes, stop])

  // Also covers a song change mid-playback, which would otherwise leave the old tune
  // sounding with nothing on screen following it.
  useEffect(() => stop, [notes, stop])

  return { playing, index, start, stop }
}
