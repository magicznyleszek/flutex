import { INSTRUMENTS } from '../src/data/instruments'
import { songForInstrument, type Song } from '../src/data/songUtils'
import { bestShift, keyShift, pitchClass, transposeKey, transposeNote } from '../src/lib/transpose'

/** A one-off song, so these tests do not break every time the library gains an entry. */
const song = (key: string, spec: string, overrides?: Song['overrides']): Song => ({
  id: 'test',
  title: 'Test',
  tags: [],
  key,
  notes: spec.split(' ').map((note) => ({ note, beats: 1 })),
  ...(overrides === undefined ? {} : { overrides }),
})

describe('keys', () => {
  it('reads a key name as a pitch class', () => {
    expect(pitchClass('C')).toBe(0)
    expect(pitchClass('D')).toBe(2)
    expect(pitchClass('F#')).toBe(6)
    // Flats spell the same class as their sharp, and stray whitespace is not a parse failure.
    expect(pitchClass('Bb')).toBe(pitchClass('A#'))
    expect(pitchClass(' G ')).toBe(7)
    expect(pitchClass('H')).toBeNull()
  })

  // The short way round, so a shift never moves a melody an octave when a few semitones would do.
  it('takes the shorter way between two keys', () => {
    expect(keyShift('C', 'D')).toBe(2)
    expect(keyShift('D', 'C')).toBe(-2)
    expect(keyShift('G', 'D')).toBe(-5)
    expect(keyShift('D', 'G')).toBe(5)
    expect(keyShift('C', 'C')).toBe(0)
    expect(Math.abs(keyShift('C', 'F#'))).toBe(6)
  })

  it('leaves a key it cannot read alone', () => {
    expect(keyShift('C', 'nonsense')).toBe(0)
    expect(transposeKey('nonsense', 3)).toBe('nonsense')
    expect(transposeNote('nonsense', 3)).toBe('nonsense')
  })

  it('names the key a melody lands in', () => {
    expect(transposeKey('G', -5)).toBe('D')
    expect(transposeKey('C', 2)).toBe('D')
    // Wraps rather than running off the end of the note names, in both directions.
    expect(transposeKey('A#', 2)).toBe('C')
    expect(transposeKey('C', -1)).toBe('B')
  })

  it('spells transposed notes with sharps', () => {
    expect(transposeNote('C5', 1)).toBe('C#5')
    expect(transposeNote('C5', 12)).toBe('C6')
    expect(transposeNote('C5', -1)).toBe('B4')
  })
})

describe('bestShift', () => {
  const whistle = (note: string): boolean => note in INSTRUMENTS.whistle_d.fingering

  it('leaves a melody that already fits exactly where it is', () => {
    // Both zero and the preferred shift are playable, and the tie goes to the smaller move —
    // otherwise choosing a whistle would rename a song written in D.
    expect(bestShift(['D5', 'A5'], keyShift('D', 'D'), whistle).semitones).toBe(0)
    expect(bestShift(['D5', 'A5'], 5, whistle).semitones).toBe(0)
  })

  it('moves a melody by octaves when it is written out of range', () => {
    // Two octaves below the whistle, so only a shift of +24 reaches it.
    const choice = bestShift(['D3', 'A3', 'B3'], 0, whistle)

    expect(choice.semitones).toBe(24)
    expect(choice.playable).toBe(3)
  })

  it('prefers the instrument key when that is what buys the notes', () => {
    // C major on a whistle in D: C5 and F5 have no grip, and the same tune a tone up is all
    // white notes of D major, which the whistle has.
    const notes = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6']
    const choice = bestShift(notes, keyShift('C', 'D'), whistle)

    expect(choice.semitones).toBe(2)
    expect(choice.playable).toBe(notes.length)
  })

  // The other half: when the instrument key buys nothing, it is not taken. Half the whistle
  // repertoire is in E dorian and needs only the octave, so an octave beats a smaller move into D.
  it('keeps the written key when moving an octave is enough', () => {
    const notes = ['B4', 'E4', 'F#4', 'E4', 'B4', 'D5', 'B4', 'A4']
    const choice = bestShift(notes, keyShift('E', 'D'), whistle)

    expect(choice.semitones).toBe(12)
    expect(choice.playable).toBe(notes.length)
  })

  // No shift makes an A#5 playable on a whistle, so the answer is the best of a bad set rather than
  // an error — the trainer shows the missing grips instead of refusing the song.
  it('returns the closest fit when nothing plays everything', () => {
    const choice = bestShift(['D5', 'A#5'], 0, whistle)

    expect(choice.playable).toBeLessThan(2)
    expect(choice.playable).toBeGreaterThan(0)
  })
})

describe('songForInstrument', () => {
  it('hands back the very same notes when nothing needs moving', () => {
    const written = song('D', 'D5 E5 F#5')
    const arrangement = songForInstrument(written, INSTRUMENTS.whistle_d)

    expect(arrangement.semitones).toBe(0)
    expect(arrangement.key).toBe('D')
    expect(arrangement.approximations).toEqual([])
    // Not a copy: skipping both maps is what keeps the memo downstream from rebuilding the row.
    expect(arrangement.notes).toBe(written.notes)
  })

  it('transposes the notes and reports the key they end up in', () => {
    const arrangement = songForInstrument(song('D', 'D3 A3'), INSTRUMENTS.whistle_d)

    expect(arrangement.semitones).toBe(24)
    expect(arrangement.notes.map((entry) => entry.note)).toEqual(['D5', 'A5'])
    expect(arrangement.key).toBe('D')
  })

  it('keeps the beats a note was written with', () => {
    const written: Song = { ...song('D', 'D3'), notes: [{ note: 'D3', beats: 2.5 }] }
    const arrangement = songForInstrument(written, INSTRUMENTS.whistle_d)

    expect(arrangement.notes[0]).toEqual({ note: 'D5', beats: 2.5 })
  })

  it('obeys a per-instrument override instead of searching', () => {
    const written = song('D', 'D5 A5', { whistle_d: 12 })
    const arrangement = songForInstrument(written, INSTRUMENTS.whistle_d)

    expect(arrangement.semitones).toBe(12)
    expect(arrangement.notes.map((entry) => entry.note)).toEqual(['D6', 'A6'])
    // The override is for one instrument, so every other one still works it out for itself.
    expect(songForInstrument(written, INSTRUMENTS.recorder).semitones).toBe(0)
  })

  // A zero override is a decision — "play it as written even though moving it would help" — and it
  // only survives because the lookup falls through on undefined rather than on falsiness.
  it('treats an override of zero as an instruction', () => {
    const written = song('D', 'D3 A3', { whistle_d: 0 })

    expect(songForInstrument(written, INSTRUMENTS.whistle_d).semitones).toBe(0)
  })

  // A whistle has no A#5, and `bestShift` only tries octaves and the key shift, so no move buys it.
  // What is left is the second step: put the nearest grip there and say what it stands for.
  it('stands a near note in for one with no grip', () => {
    const arrangement = songForInstrument(song('D', 'A#5 D5 A#5'), INSTRUMENTS.whistle_d)

    expect(arrangement.semitones).toBe(0)
    // Every occurrence, not just the first: a half-swapped melody would stall on the second.
    expect(arrangement.notes.map((entry) => entry.note)).toEqual(['A5', 'D5', 'A5'])
    // And once in the report, however many times the melody asks for it.
    expect(arrangement.approximations).toEqual([{ written: 'A#5', played: 'A5' }])
  })

  it('leaves a note nothing is near exactly as written', () => {
    const arrangement = songForInstrument(song('D', 'D5 C3'), INSTRUMENTS.whistle_d)

    expect(arrangement.notes.map((entry) => entry.note)).toEqual(['D5', 'C3'])
    expect(arrangement.approximations).toEqual([])
  })
})
