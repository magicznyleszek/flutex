import {
  centsBetween,
  centsFromNote,
  freqToNearestNote,
  midiToFreq,
  midiToNote,
  noteToFreq,
  noteToMidi,
} from '../src/lib/music'

describe('noteToMidi', () => {
  it('hits the anchors of the MIDI standard', () => {
    expect(noteToMidi('A4')).toBe(69)
    expect(noteToMidi('C4')).toBe(60)
    expect(noteToMidi('C-1')).toBe(0)
    expect(noteToMidi('D5')).toBe(74)
    expect(noteToMidi('F#5')).toBe(78)
  })

  it('understands flats and doubled accidentals', () => {
    expect(noteToMidi('Gb5')).toBe(noteToMidi('F#5'))
    expect(noteToMidi('Bb4')).toBe(70)
    expect(noteToMidi('C##4')).toBe(noteToMidi('D4'))
  })

  it('returns null for malformed names', () => {
    for (const bad of ['', 'H5', 'D', '#5', 'D5x', 'Db#4', null, undefined]) {
      expect(noteToMidi(bad)).toBeNull()
    }
  })
})

describe('midiToNote', () => {
  it('is the inverse of noteToMidi across the whole MIDI range', () => {
    for (let midi = 0; midi <= 127; midi++) {
      expect(noteToMidi(midiToNote(midi))).toBe(midi)
    }
  })
})

describe('frequencies', () => {
  it('midiToFreq matches known values', () => {
    expect(midiToFreq(69)).toBe(440)
    expect(midiToFreq(74)).toBeCloseTo(587.33, 2)
    expect(midiToFreq(60)).toBeCloseTo(261.63, 2)
  })

  it('centsBetween counts a semitone as 100 cents', () => {
    expect(centsBetween(midiToFreq(70), midiToFreq(69))).toBeCloseTo(100, 9)
    expect(centsBetween(midiToFreq(81), midiToFreq(69))).toBeCloseTo(1200, 9)
  })
})

describe('freqToNearestNote', () => {
  it('reports the note and the deviation from it', () => {
    const exact = freqToNearestNote(440)
    expect(exact?.note).toBe('A4')
    expect(exact?.cents).toBeCloseTo(0, 9)

    const target = noteToFreq('D5') as number
    const sharp = freqToNearestNote(target * Math.pow(2, 20 / 1200))
    expect(sharp?.note).toBe('D5')
    expect(sharp?.cents).toBeCloseTo(20, 2)
  })

  it('returns null for an invalid frequency', () => {
    expect(freqToNearestNote(0)).toBeNull()
    expect(freqToNearestNote(-1)).toBeNull()
  })
})

describe('centsFromNote', () => {
  it('measures against the target, not the nearest note', () => {
    // An octave above the target reads +1200c, so the player sees how far off it is.
    const octaveUp = noteToFreq('D6') as number
    expect(centsFromNote(octaveUp, 'D5')).toBeCloseTo(1200, 9)
  })

  it('returns 0 when there is nothing to measure', () => {
    expect(centsFromNote(0, 'D5')).toBe(0)
    expect(centsFromNote(600, 'not-a-note')).toBe(0)
  })
})
