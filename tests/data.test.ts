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

  it('keeps the recorder on one fingering system for F and F#', () => {
    const f = INSTRUMENTS.recorder.fingering.F5
    const fSharp = INSTRUMENTS.recorder.fingering['F#5']

    expect(f).toBeDefined()
    expect(fSharp).toBeDefined()

    // In baroque fingering F# is F with the last finger lifted. Writing F the German
    // way instead mixes the two systems.
    const differences = (f?.holes ?? []).reduce<number[]>((acc, hole, index) => {
      if (hole !== fSharp?.holes[index]) acc.push(index)
      return acc
    }, [])

    expect(differences).toEqual([7])
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

  it.each(SONGS)('$title is playable on both instruments', (song) => {
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
