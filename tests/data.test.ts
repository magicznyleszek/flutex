import {
  INSTRUMENT_LIST,
  INSTRUMENTS,
  instrumentFreqRange,
  unplayableNotes,
  type HoleState,
} from '../src/data/instruments'
import { DEFAULT_SONG_ID, SONGS, findSong, songNoteNames } from '../src/data/songs'
import { noteToMidi } from '../src/lib/music'

const VALID_HOLE_STATES: readonly HoleState[] = [0, 0.5, 1]

describe('instruments', () => {
  it.each(INSTRUMENT_LIST)('$id has a consistent fingering chart', (instrument) => {
    const entries = Object.entries(instrument.fingering)
    expect(entries.length).toBeGreaterThan(0)

    for (const [note, fingering] of entries) {
      expect(noteToMidi(note)).not.toBeNull()
      // Every fingering of one instrument must describe the same hole count, or the
      // diagram changes shape from note to note.
      expect(fingering.holes).toHaveLength(instrument.holeCount)
      for (const hole of fingering.holes) {
        expect(VALID_HOLE_STATES).toContain(hole)
      }
    }
  })

  it.each(INSTRUMENT_LIST)('$id lists its notes lowest first', (instrument) => {
    const midis = instrument.notes.map((note) => noteToMidi(note) ?? 0)
    const sorted = [...midis].sort((left, right) => left - right)
    expect(midis).toEqual(sorted)
  })

  it('computes a frequency range with headroom for intonation', () => {
    const { minFreq, maxFreq } = instrumentFreqRange(INSTRUMENTS.whistle_d)

    // The lowest note is D5 (587 Hz), the highest B6 (1976 Hz).
    expect(minFreq).toBeLessThan(587)
    expect(minFreq).toBeGreaterThan(400)
    expect(maxFreq).toBeGreaterThan(1976)
    expect(maxFreq).toBeLessThan(2600)
  })

  it('reports notes the instrument cannot play', () => {
    expect(unplayableNotes(INSTRUMENTS.whistle_d, ['D5', 'C5', 'F5', 'C5'])).toEqual(['C5', 'F5'])
    expect(unplayableNotes(INSTRUMENTS.recorder, ['D5', 'C5', 'F5'])).toEqual([])
  })

  // Pinned as literal arrays rather than as a relationship between the two, because the
  // relationship is what went wrong before: F5 had been written the German way, and "F# is F
  // with the last finger lifted" was true of that mistake while being false of baroque
  // fingering. These two are the fork that separates the systems, so they are worth spelling
  // out — both are as published by Mollenhauer, Moeck, Yamaha, the American Recorder Society
  // and Dolmetsch, in the order [thumb, 1, 2, 3, 4, 5, 6, 7].
  it('keeps the recorder on baroque fingering for F and F#', () => {
    expect(INSTRUMENTS.recorder.fingering.F5?.holes).toEqual([1, 1, 1, 1, 1, 0, 1, 1])
    expect(INSTRUMENTS.recorder.fingering['F#5']?.holes).toEqual([1, 1, 1, 1, 0, 1, 1, 0])
  })

  // The German F5 runs straight down the scale and its F#5 is the forked one — the exact
  // mirror of baroque. Either appearing in the table means the two systems got mixed, which a
  // player following the dots would feel as a note that will not sound.
  it('does not use German fingerings for F or F#', () => {
    expect(INSTRUMENTS.recorder.fingering.F5?.holes).not.toEqual([1, 1, 1, 1, 1, 0, 0, 0])
    expect(INSTRUMENTS.recorder.fingering['F#5']?.holes).not.toEqual([1, 1, 1, 1, 0, 1, 1, 1])
  })

  it('gives the German recorder its own F and F#', () => {
    expect(INSTRUMENTS.recorder_german.fingering.F5?.holes).toEqual([1, 1, 1, 1, 1, 0, 0, 0])
    expect(INSTRUMENTS.recorder_german.fingering['F#5']?.holes).toEqual([1, 1, 1, 1, 0, 1, 1, 1])
  })

  // The two recorder charts are written out separately so each can be read against its own
  // published source, and this is what stops them drifting apart: every German note has to
  // match baroque exactly unless it is one of the five the systems genuinely disagree on.
  // Iterating the German notes also catches a note added to one chart but not the other.
  it('differs from baroque only where German fingering really does', () => {
    const divergent = ['F5', 'F#5', 'F6', 'F#6', 'G#6']

    for (const note of INSTRUMENTS.recorder_german.notes) {
      const german = INSTRUMENTS.recorder_german.fingering[note]?.holes
      const baroque = INSTRUMENTS.recorder.fingering[note]?.holes
      expect(baroque).toBeDefined()

      if (divergent.includes(note)) expect(german).not.toEqual(baroque)
      else expect(german).toEqual(baroque)
    }
  })

  // The thumb is what switches register, and it does it in two steps. Getting the boundary
  // wrong is silent: a half-covered thumb at D6 and a fully open one at E6 both draw a
  // perfectly plausible diagram for a note that will not sound.
  it.each(['recorder', 'recorder_german'] as const)('%s opens the thumb before it pinches it', (id) => {
    const { fingering } = INSTRUMENTS[id]

    for (const note of ['C#6', 'D6', 'D#6']) {
      expect(fingering[note]?.holes[0]).toBe(0)
    }
    for (const note of ['E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'B6']) {
      expect(fingering[note]?.holes[0]).toBe(0.5)
    }
  })

  // A#6 has four competing grips across the charts consulted, so it is deliberately absent
  // rather than merely forgotten. Same for German C7, which no German chart consulted prints.
  it('leaves out the notes the sources disagree on', () => {
    expect(INSTRUMENTS.recorder.fingering['A#6']).toBeUndefined()
    expect(INSTRUMENTS.recorder_german.fingering['A#6']).toBeUndefined()
    expect(INSTRUMENTS.recorder.fingering.C7).toBeDefined()
    expect(INSTRUMENTS.recorder_german.fingering.C7).toBeUndefined()
  })
})

describe('songs', () => {
  it('have unique identifiers', () => {
    const ids = SONGS.map((song) => song.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('include the default song', () => {
    expect(findSong(DEFAULT_SONG_ID)).not.toBeNull()
    expect(findSong('no-such-song')).toBeNull()
    expect(findSong(null)).toBeNull()
  })

  it.each(SONGS)('$title has valid notes and durations', (song) => {
    expect(song.notes.length).toBeGreaterThan(0)

    for (const { note, beats } of song.notes) {
      expect(noteToMidi(note)).not.toBeNull()
      expect(Number.isFinite(beats)).toBe(true)
      expect(beats).toBeGreaterThan(0)
    }
  })

  it.each(SONGS)('$title is playable on every instrument', (song) => {
    const notes = songNoteNames(song)

    for (const instrument of INSTRUMENT_LIST) {
      expect(unplayableNotes(instrument, notes)).toEqual([])
    }
  })

  it('keeps bar lines out of the note list', () => {
    for (const song of SONGS) {
      expect(songNoteNames(song)).not.toContain('|')
    }
  })
})
