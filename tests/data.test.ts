import {
  INSTRUMENT_LIST,
  INSTRUMENTS,
  instrumentFreqRange,
  nearestFingered,
  unplayableNotes,
  type HoleState,
} from '../src/data/instruments'
import { DEFAULT_SONG_ID, SONGS, findSong } from '../src/data/songs'
import { songForInstrument, songNoteNames } from '../src/data/songUtils'
import { noteToMidi } from '../src/lib/music'

const VALID_HOLE_STATES: readonly HoleState[] = [0, 0.5, 1]

/**
 * The library is written to fit every chart, with one song deliberately outside that: the
 * transcription of "Concerning Hobbits" climbs to A6, which the ocarinas do not have. Named here
 * rather than worked out, so a song that drifts out of the shared range by accident still fails
 * the two tests below instead of quietly joining the exception.
 */
const WIDE_RANGE = 'concerning-hobbits'
const SHARED_RANGE = SONGS.filter((song) => song.id !== WIDE_RANGE)

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

  // An ocarina's chart and its drawing are two separate lists, and nothing else stops a hole
  // being added to one and not the other. That would not throw — it would quietly draw a
  // fingering with a hole missing, which is worse.
  it('draws every hole an ocarina fingers', () => {
    for (const instrument of INSTRUMENT_LIST) {
      const { layout } = instrument
      if (layout.kind !== 'ocarina') continue

      expect(layout.holes).toHaveLength(instrument.holeCount)

      // The labels are the React keys of the drawn circles as well as what a screen reader
      // reads out, so two holes sharing one is a bug either way.
      const labels = new Set(layout.holes.map((hole) => hole.label))
      expect(labels.size).toBe(layout.holes.length)

      // The viewBox is 100 units wide and `height` tall, so anything outside it is a hole
      // clipped off the side of the diagram.
      for (const hole of layout.holes) {
        expect(hole.r).toBeGreaterThan(0)
        expect(hole.x - hole.r).toBeGreaterThanOrEqual(0)
        expect(hole.x + hole.r).toBeLessThanOrEqual(100)
        expect(hole.y - hole.r).toBeGreaterThanOrEqual(0)
        expect(hole.y + hole.r).toBeLessThanOrEqual(layout.height)
      }
    }
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

  it('answers with the note itself when it can play it', () => {
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'D5')).toBe('D5')
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'H5')).toBeNull()
  })

  // The notes past the top of a chart, which is where this is actually used: everything above
  // the highest grip collapses onto it, so the two the ocarinas are short of both come back as
  // the top note rather than as an octave drop.
  it('reaches down to the nearest note it does have', () => {
    expect(nearestFingered(INSTRUMENTS.ocarina_6, 'F#6')).toBe('E6')
    expect(nearestFingered(INSTRUMENTS.ocarina_6, 'A6')).toBe('E6')
    expect(nearestFingered(INSTRUMENTS.ocarina_12, 'F#6')).toBe('F6')
    expect(nearestFingered(INSTRUMENTS.ocarina_12, 'A6')).toBe('F6')
    // And below a chart just as much as above it: a whistle starts at D5.
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'C5')).toBe('D5')
  })

  // F5 sits between two notes the whistle has, one semitone from each. Pinned because the answer
  // comes out of the order `notes` is in rather than from a comparison, so a change to how that
  // list is built would flip it silently.
  it('breaks a tie towards the lower note', () => {
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'F5')).toBe('E5')
  })

  // Past a tritone there is nothing worth offering, and saying so is what keeps the blank slot
  // and its warning for the case that really is out of reach.
  it('refuses to stand in for a note nothing is near', () => {
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'C4')).toBeNull()
    expect(nearestFingered(INSTRUMENTS.ocarina_6, 'C7')).toBeNull()
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
    // G#5 is the one first-octave divergence, and the only one of the six that is not about F:
    // German closes hole 6 where baroque half-covers it.
    const divergent = ['F5', 'F#5', 'G#5', 'F6', 'F#6', 'G#6']

    for (const note of INSTRUMENTS.recorder_german.notes) {
      const german = INSTRUMENTS.recorder_german.fingering[note]?.holes
      const baroque = INSTRUMENTS.recorder.fingering[note]?.holes
      expect(baroque).toBeDefined()

      if (divergent.includes(note)) expect(german).not.toEqual(baroque)
      else expect(german).toEqual(baroque)
    }
  })

  // Both recorders now play the whole first octave chromatically, and three of the four
  // accidentals do it with a half hole. Which hole is halved is the entire content of those
  // fingerings — C#5 halves 7, D#5 and baroque G#5 halve 6 — and a half in the wrong slot draws
  // a diagram that looks right and sounds a semitone off.
  it.each(['recorder', 'recorder_german'] as const)('%s plays the first octave chromatically', (id) => {
    const { fingering } = INSTRUMENTS[id]

    for (const note of ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6']) {
      expect(fingering[note]).toBeDefined()
    }

    expect(fingering['C#5']?.holes).toEqual([1, 1, 1, 1, 1, 1, 1, 0.5])
    expect(fingering['D#5']?.holes).toEqual([1, 1, 1, 1, 1, 1, 0.5, 0])
    // The fork: hole 2 open with 3 and 4 still down. Written out because it reads as a typo.
    expect(fingering['A#5']?.holes).toEqual([1, 1, 0, 1, 1, 0, 0, 0])
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

  // Through `songForInstrument`, because the arrangement is what a player is shown. `approximations`
  // is the half with teeth: the arrangement puts a near note where a missing one was, so
  // `unplayableNotes` alone comes back empty even for a song half stood in for.
  it.each(SHARED_RANGE)('$title is playable on every instrument', (song) => {
    for (const instrument of INSTRUMENT_LIST) {
      const arrangement = songForInstrument(song, instrument)
      expect(unplayableNotes(instrument, songNoteNames(arrangement))).toEqual([])
      expect(arrangement.approximations).toEqual([])
    }
  })

  // The stronger claim, which catches a new song drifting outside the shared range: every song here
  // is written to fit every chart as it stands, so the transposer should find nothing to do. A
  // failure is a song to fix, not a bug in the shift search — the test above would still pass.
  it.each(SHARED_RANGE)('$title plays as written on every instrument', (song) => {
    for (const instrument of INSTRUMENT_LIST) {
      expect(songForInstrument(song, instrument).semitones).toBe(0)
    }
  })

  // And the exception, pinned note for note rather than waved through. If a chart later gains
  // the notes it is missing, or the override stops holding, that is worth being told about.
  it('keeps the one transcribed song in its own key everywhere', () => {
    const song = findSong(WIDE_RANGE)
    expect(song).not.toBeNull()
    if (song === null) return

    for (const id of ['whistle_d', 'recorder', 'recorder_german'] as const) {
      const arrangement = songForInstrument(song, INSTRUMENTS[id])

      expect(arrangement.semitones).toBe(0)
      expect(unplayableNotes(INSTRUMENTS[id], songNoteNames(arrangement))).toEqual([])
      expect(arrangement.approximations).toEqual([])
    }

    // The ocarinas keep it in D through `overrides`, so the two notes they do not have are stood
    // in for rather than the melody moving into C to recover one of them. Without the override
    // the search would take that trade — which is what this pins.
    expect(songForInstrument(song, INSTRUMENTS.ocarina_6).approximations).toEqual([
      { written: 'F#6', played: 'E6' },
      { written: 'A6', played: 'E6' },
    ])
    // The 12-hole reaches F6, so it stands in one note higher and the two do not collapse onto
    // each other the way they do on the 6-hole.
    expect(songForInstrument(song, INSTRUMENTS.ocarina_12).approximations).toEqual([
      { written: 'F#6', played: 'F6' },
      { written: 'A6', played: 'F6' },
    ])

    for (const id of ['ocarina_6', 'ocarina_12'] as const) {
      const arrangement = songForInstrument(song, INSTRUMENTS[id])

      expect(arrangement.semitones).toBe(0)
      expect(arrangement.key).toBe('D')
      // Nothing left without a grip, which is the point of the swap: every note in the
      // arrangement is one the player can be shown and the trainer can hear.
      expect(unplayableNotes(INSTRUMENTS[id], songNoteNames(arrangement))).toEqual([])
    }
  })

  it('keeps bar lines out of the note list', () => {
    for (const song of SONGS) {
      expect(songNoteNames(song)).not.toContain('|')
    }
  })
})
