import { useCallback, useEffect, useRef, useState } from 'react'

import type { SongNote } from '../data/songUtils'
import { noteToFreq } from '../lib/music'

/** A beat is a quarter note throughout the library. Slow on purpose: the gap is where you find the grip. */
const DEMO_BPM = 60

/** Fraction of each note left silent at its end, so the same note twice is heard as two. */
const GAP_RATIO = 0.18

/** Seconds. Enough that a note does not click on, little enough not to smear its pitch. */
const ATTACK_S = 0.015
const RELEASE_S = 0.05

/** Notes never overlap, so one note's peak is the whole output level. */
const NOTE_GAIN = 0.18

/** Seconds of silence before the first note, so it is not clipped by its own scheduling. */
const LEAD_IN_S = 0.12

const FADE_OUT_S = 0.03

/** Enough for the fade above to have been heard before the context goes away. */
const CLOSE_DELAY_MS = 80

interface DemoSession {
  context: AudioContext
  master: GainNode
  /** Seconds from the first note at which each note begins. */
  starts: readonly number[]
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
  /** Back to the first note. Does nothing when nothing is playing. */
  restart: () => void
}

/**
 * Plays the song and reports which note is sounding, so the charts can follow along. It demonstrates the tune
 * rather than accompanying you, and the rhythm is only as good as the `beats` in the data. Every note is
 * scheduled into the AudioContext at once and the on-screen position read off `currentTime`; separate timers
 * would drift apart within a few bars.
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

    // Silencing a running oscillator clicks, so the gain fades first and the context closes after.
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
    // A context built inside a tap usually starts on its own; iOS hands back a suspended one, where nothing
    // sounds and `currentTime` never moves.
    void context.resume().catch(() => undefined)

    const master = context.createGain()
    master.connect(context.destination)

    const beatSeconds = 60 / DEMO_BPM
    const origin = context.currentTime + LEAD_IN_S
    const starts: number[] = []
    let cursor = 0

    for (const entry of notes) {
      // A bad `beats` would schedule a note of length NaN and take every note after it with it.
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
      // Triangle, not sine: harmonics falling away as 1/n² is near enough a whistle, and it carries through a
      // phone speaker where a sine goes thin.
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

      // Forward from where it was rather than a search, so a stalled tab catches up in one frame.
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

  // With every note scheduled up front there is no cursor to move, so the way back to the top is a fresh
  // session. `stop` clears the ref synchronously, which is what lets `start` proceed here.
  const restart = useCallback(() => {
    if (sessionRef.current === null) return

    stop()
    start()
  }, [start, stop])

  // A song change mid-playback would otherwise leave the old tune sounding with nothing following it.
  useEffect(() => stop, [notes, stop])

  return { playing, index, start, stop, restart }
}
