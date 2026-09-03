import {
  BASE_INSTRUMENTS,
  INSTRUMENT_LIST,
  INSTRUMENTS,
  instrumentFreqRange,
  nearestFingered,
  unplayableNotes,
  type HoleState,
} from '../src/data/instruments'
import { DEFAULT_SONG_ID, SONGS, findSong } from '../src/data/songs'
import { SONG_CATEGORIES, songForInstrument, songNoteNames } from '../src/data/songUtils'
import { midiToNote, noteToMidi } from '../src/lib/music'

const VALID_HOLE_STATES: readonly HoleState[] = [0, 0.5, 1]

/**
 * The two songs that do not fit every chart — one too high for the ocarinas, one too wide for anything.
 * Each has its own test below. Named rather than detected, so a song that drifts out of range fails.
 */
const WIDE_RANGE: ReadonlySet<string> = new Set(['concerning-hobbits', 'a-blast-of-wind'])
const SHARED_RANGE = SONGS.filter((song) => !WIDE_RANGE.has(song.id))

/**
 * Playable everywhere but not as written: these sit above the shared window on purpose and the ocarinas
 * take them down an octave. By category, since that file is meant to be added to.
 */
const AS_WRITTEN = SHARED_RANGE.filter((song) => song.category !== 'second-octave')

describe('instruments', () => {
  it.each(INSTRUMENT_LIST)('$id has a consistent fingering chart', (instrument) => {
    const entries = Object.entries(instrument.fingering)
    expect(entries.length).toBeGreaterThan(0)

    for (const [note, fingering] of entries) {
      expect(noteToMidi(note)).not.toBeNull()
      // One hole count per instrument, or the diagram changes shape from note to note.
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

  // Chart and drawing are separate lists, and a hole added to one and not the other draws a fingering
  // with a hole missing rather than throwing.
  it('draws every hole an ocarina fingers', () => {
    for (const instrument of INSTRUMENT_LIST) {
      const { layout } = instrument
      if (layout.kind !== 'ocarina') continue

      expect(layout.holes).toHaveLength(instrument.holeCount)

      // The labels are the circles' React keys and what a screen reader says: no sharing.
      const labels = new Set(layout.holes.map((hole) => hole.label))
      expect(labels.size).toBe(layout.holes.length)

      // The viewBox is 100 units wide and `height` tall; outside it is a hole clipped off.
      for (const hole of layout.holes) {
        expect(hole.r).toBeGreaterThan(0)
        expect(hole.x - hole.r).toBeGreaterThanOrEqual(0)
        expect(hole.x + hole.r).toBeLessThanOrEqual(100)
        expect(hole.y - hole.r).toBeGreaterThanOrEqual(0)
        expect(hole.y + hole.r).toBeLessThanOrEqual(layout.height)
      }

      // The mouthpiece hangs below the body, so it is the part most easily pushed off the bottom edge —
      // where it reads as a chart that got cut off.
      const { neck } = layout
      if (neck === undefined) continue

      expect(neck.bottom).toBeGreaterThan(neck.top)
      expect(neck.bottom).toBeLessThanOrEqual(layout.height)
      expect(neck.cx - (neck.width / 2)).toBeGreaterThanOrEqual(0)
      expect(neck.cx + (neck.width / 2)).toBeLessThanOrEqual(100)
    }
  })

  /*
   * The bug this exists for: radii copied off the printed chart's schematic put the two big holes at the
   * bottom when on the instrument they are the two on the left. It looked right and played wrong.
   *
   * Pitch rises with total open area, so the chart itself says what the sizes are — walk its notes
   * lowest first and the drawn area has to go up every time. Whole covers only: a half cover is set by
   * ear and leaves rather less than half, so at face value D#5 comes out level with E5.
   */
  it('draws the 6-hole pendant at sizes that order its own chart', () => {
    const ocarina = INSTRUMENTS.ocarina_6
    const { layout } = ocarina
    if (layout.kind !== 'ocarina') throw new Error('the 6-hole pendant needs an ocarina layout')

    const openArea = (note: string): number => layout.holes.reduce((total, hole, position) => {
      const state = ocarina.fingering[note]?.holes[position] ?? 0
      return state === 0 ? total + (hole.r * hole.r) : total
    }, 0)

    const whole = ocarina.notes.filter(
      (note) => !(ocarina.fingering[note]?.holes ?? []).includes(0.5),
    )
    // Fifteen of the seventeen, so the two half-hole notes are the only ones sitting this out.
    expect(whole).toHaveLength(15)

    const areas = whole.map(openArea)
    for (let index = 1; index < areas.length; index += 1) {
      expect(areas[index] ?? 0).toBeGreaterThan(areas[index - 1] ?? 0)
    }
  })

  // Derived rather than typed out, so what needs checking is that the octave is the only difference:
  // every grip in the same place, nothing lost or gained.
  it('gives the soprano pendant the alto\'s grips an octave up', () => {
    const alto = INSTRUMENTS.ocarina_6
    const soprano = INSTRUMENTS.ocarina_6_soprano

    expect(soprano.variantOf).toBe('ocarina_6')
    expect(soprano.layout).toBe(alto.layout)
    expect(soprano.notes).toHaveLength(alto.notes.length)
    expect(soprano.notes[0]).toBe('C6')
    expect(soprano.notes[soprano.notes.length - 1]).toBe('E7')

    for (const note of alto.notes) {
      const up = midiToNote((noteToMidi(note) ?? 0) + 12)
      expect(soprano.fingering[up]).toEqual(alto.fingering[note])
    }
  })

  // Why it is a separate instrument and not the alto transposed on paper: the tuner has to search where
  // it sounds. E7 is 2637 Hz, past the alto's 1568 Hz ceiling, so its top read as subharmonics before.
  it('searches for the soprano pendant where it sounds', () => {
    const alto = instrumentFreqRange(INSTRUMENTS.ocarina_6)
    const soprano = instrumentFreqRange(INSTRUMENTS.ocarina_6_soprano)

    expect(alto.maxFreq).toBeLessThan(2637)
    expect(soprano.maxFreq).toBeGreaterThan(2637)
    // What the recorded one sounds with every hole covered, so it has to be inside the band.
    expect(soprano.minFreq).toBeLessThan(1040)
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

  // Everything above the highest grip collapses onto it, so the two notes the ocarinas are short of both
  // come back as the top note rather than an octave drop.
  it('reaches down to the nearest note it does have', () => {
    expect(nearestFingered(INSTRUMENTS.ocarina_6, 'F#6')).toBe('E6')
    expect(nearestFingered(INSTRUMENTS.ocarina_6, 'A6')).toBe('E6')
    expect(nearestFingered(INSTRUMENTS.ocarina_12, 'F#6')).toBe('F6')
    expect(nearestFingered(INSTRUMENTS.ocarina_12, 'A6')).toBe('F6')
    // And below a chart just as much as above it: a whistle starts at D5.
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'C5')).toBe('D5')
  })

  // F5 is one semitone from two notes the whistle has, so the answer falls out of the order `notes` is
  // in — a change to how that list is built would flip it silently.
  it('breaks a tie towards the lower note', () => {
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'F5')).toBe('E5')
  })

  // Past a tritone nothing is worth offering, which keeps the blank slot for what really is out.
  it('refuses to stand in for a note nothing is near', () => {
    expect(nearestFingered(INSTRUMENTS.whistle_d, 'C4')).toBeNull()
    expect(nearestFingered(INSTRUMENTS.ocarina_6, 'C7')).toBeNull()
  })

  // Literal arrays, not a relationship between the two: a relationship is what went wrong before, when
  // F5 was written the German way and "F# is F with the last finger lifted" held for that mistake but not
  // for baroque. Per Mollenhauer, Moeck, Yamaha, the ARS and Dolmetsch, in [thumb, 1, 2, 3, 4, 5, 6, 7].
  it('keeps the recorder on baroque fingering for F and F#', () => {
    expect(INSTRUMENTS.recorder.fingering.F5?.holes).toEqual([1, 1, 1, 1, 1, 0, 1, 1])
    expect(INSTRUMENTS.recorder.fingering['F#5']?.holes).toEqual([1, 1, 1, 1, 0, 1, 1, 0])
  })

  // German mirrors baroque here: its F5 runs straight down the scale and its F#5 is the forked one.
  // Either array on the baroque chart means the systems got mixed — a note that will not sound.
  it('does not use German fingerings for F or F#', () => {
    expect(INSTRUMENTS.recorder.fingering.F5?.holes).not.toEqual([1, 1, 1, 1, 1, 0, 0, 0])
    expect(INSTRUMENTS.recorder.fingering['F#5']?.holes).not.toEqual([1, 1, 1, 1, 0, 1, 1, 1])
  })

  it('gives the German recorder its own F and F#', () => {
    expect(INSTRUMENTS.recorder_german.fingering.F5?.holes).toEqual([1, 1, 1, 1, 1, 0, 0, 0])
    expect(INSTRUMENTS.recorder_german.fingering['F#5']?.holes).toEqual([1, 1, 1, 1, 0, 1, 1, 1])
  })

  // The charts are written out separately so each reads against its own source; this is what stops them
  // drifting. Iterating the German notes also catches a note added to one chart and not the other.
  it('differs from baroque only where German fingering really does', () => {
    // G#5 is the only one of the six not about F: German closes hole 6, baroque half-covers it.
    const divergent = ['F5', 'F#5', 'G#5', 'F6', 'F#6', 'G#6']

    for (const note of INSTRUMENTS.recorder_german.notes) {
      const german = INSTRUMENTS.recorder_german.fingering[note]?.holes
      const baroque = INSTRUMENTS.recorder.fingering[note]?.holes
      expect(baroque).toBeDefined()

      if (divergent.includes(note)) expect(german).not.toEqual(baroque)
      else expect(german).toEqual(baroque)
    }
  })

  // Which hole is halved is the whole content of these fingerings — C#5 halves 7, D#5 and baroque G#5
  // halve 6. A half in the wrong slot draws a diagram that looks right and sounds a semitone off.
  it.each(['recorder', 'recorder_german'] as const)('%s plays the first octave chromatically', (id) => {
    const { fingering } = INSTRUMENTS[id]

    for (const note of ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6']) {
      expect(fingering[note]).toBeDefined()
    }

    expect(fingering['C#5']?.holes).toEqual([1, 1, 1, 1, 1, 1, 1, 0.5])
    expect(fingering['D#5']?.holes).toEqual([1, 1, 1, 1, 1, 1, 0.5, 0])
    // The fork: hole 2 open with 3 and 4 still down. Spelled out because it reads as a typo.
    expect(fingering['A#5']?.holes).toEqual([1, 1, 0, 1, 1, 0, 0, 0])
  })

  // The thumb switches register in two steps and the boundary fails silently: a half-covered thumb at D6
  // or an open one at E6 both draw a plausible diagram for a note that will not sound.
  it.each(['recorder', 'recorder_german'] as const)('%s opens the thumb before it pinches it', (id) => {
    const { fingering } = INSTRUMENTS[id]

    for (const note of ['C#6', 'D6', 'D#6']) {
      expect(fingering[note]?.holes[0]).toBe(0)
    }
    for (const note of ['E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'B6']) {
      expect(fingering[note]?.holes[0]).toBe(0.5)
    }
  })

  // A#6 has four competing grips across the charts consulted, so it is absent rather than forgotten.
  // Same for German C7, which no German chart consulted prints.
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

  // Order and grouping follow from `SONG_CATEGORIES` and need no test. What that list cannot know is
  // whether a file has anything in it.
  it.each(SONG_CATEGORIES)('$label has songs in it', (category) => {
    expect(SONGS.some((song) => song.category === category.slug)).toBe(true)
  })

  it.each(SONGS)('$title has valid notes and durations', (song) => {
    expect(song.notes.length).toBeGreaterThan(0)

    for (const { note, beats } of song.notes) {
      expect(noteToMidi(note)).not.toBeNull()
      expect(Number.isFinite(beats)).toBe(true)
      expect(beats).toBeGreaterThan(0)
    }
  })

  // Through `songForInstrument`, the arrangement being what a player is shown. `approximations` is the
  // half with teeth: it swaps a near note in, so `unplayableNotes` alone comes back empty.
  it.each(SHARED_RANGE)('$title is playable on every instrument', (song) => {
    for (const instrument of INSTRUMENT_LIST) {
      const arrangement = songForInstrument(song, instrument)
      expect(unplayableNotes(instrument, songNoteNames(arrangement))).toEqual([])
      expect(arrangement.approximations).toEqual([])
    }
  })

  // The stronger claim, which catches a song drifting out of the shared range: these fit every chart as
  // they stand, so the transposer should find nothing to do. A failure is a song to fix, not a bug in the
  // shift search — the test above would still pass. Base instruments only; a variant is one of these in
  // another size and cannot play the written octave, which is the test below.
  it.each(AS_WRITTEN)('$title plays as written on every instrument', (song) => {
    for (const instrument of BASE_INSTRUMENTS) {
      expect(songForInstrument(song, instrument).semitones).toBe(0)
    }
  })

  // A variant should cost a whole octave and nothing else. The failure guarded against is `bestShift`
  // preferring a smaller move that fits most of a tune and approximates the rest — which would still
  // leave every note fingered, so the two tests above would pass.
  it.each(AS_WRITTEN)('$title moves by the octave the soprano pendant is up', (song) => {
    const arrangement = songForInstrument(song, INSTRUMENTS.ocarina_6_soprano)

    expect(arrangement.semitones).toBe(12)
    expect(arrangement.key).toBe(song.key)
    expect(arrangement.approximations).toEqual([])
  })

  // The register is the point of this section, so the charts that have it must keep it and the rest must
  // get a plain octave rather than an odd shift into a new key. Written inside D6-A6 for that reason:
  // anything wider and `bestShift` starts preferring smaller moves that leave a note or two behind.
  it.each(SONGS.filter((song) => song.category === 'second-octave'))(
    '$title stays up an octave where it can and drops a whole one where it cannot',
    (song) => {
      // The soprano pendant groups with these, not the ocarinas: D6-A6 is the middle of its range.
      for (const id of ['whistle_d', 'recorder', 'recorder_german', 'ocarina_6_soprano'] as const) {
        expect(songForInstrument(song, INSTRUMENTS[id]).semitones).toBe(0)
      }

      for (const id of ['ocarina_6', 'ocarina_12'] as const) {
        const arrangement = songForInstrument(song, INSTRUMENTS[id])

        expect(arrangement.semitones).toBe(-12)
        expect(arrangement.key).toBe('D')
        expect(arrangement.approximations).toEqual([])
        expect(unplayableNotes(INSTRUMENTS[id], songNoteNames(arrangement))).toEqual([])
      }
    },
  )

  // The exceptions, pinned note for note: a chart gaining the notes it lacks, or an override stopping
  // holding, is worth being told about.
  it('keeps the one transcribed song in its own key everywhere', () => {
    const song = findSong('concerning-hobbits')
    expect(song).not.toBeNull()
    if (song === null) return

    for (const id of ['whistle_d', 'recorder', 'recorder_german'] as const) {
      const arrangement = songForInstrument(song, INSTRUMENTS[id])

      expect(arrangement.semitones).toBe(0)
      expect(unplayableNotes(INSTRUMENTS[id], songNoteNames(arrangement))).toEqual([])
      expect(arrangement.approximations).toEqual([])
    }

    // The ocarinas keep it in D through `overrides`, standing in for the two notes they lack rather than
    // moving into C to recover one — the trade the search would otherwise take.
    expect(songForInstrument(song, INSTRUMENTS.ocarina_6).approximations).toEqual([
      { written: 'F#6', played: 'E6' },
      { written: 'A6', played: 'E6' },
    ])
    // The 12-hole reaches F6, so it stands in a note higher and the two do not collapse into one.
    expect(songForInstrument(song, INSTRUMENTS.ocarina_12).approximations).toEqual([
      { written: 'F#6', played: 'F6' },
      { written: 'A6', played: 'F6' },
    ])

    for (const id of ['ocarina_6', 'ocarina_12'] as const) {
      const arrangement = songForInstrument(song, INSTRUMENTS[id])

      expect(arrangement.semitones).toBe(0)
      expect(arrangement.key).toBe('D')
      expect(unplayableNotes(INSTRUMENTS[id], songNoteNames(arrangement))).toEqual([])
    }
  })

  // The other exception, and a different problem: too wide rather than too high. A4 to E6 is nineteen
  // semitones against a window of fourteen, in A, whose G# only the whistle lacks. No one key holds it
  // everywhere, so each chart takes its own shift.
  it('lets every instrument take its own shift for the widest song', () => {
    const song = findSong('a-blast-of-wind')
    expect(song).not.toBeNull()
    if (song === null) return

    // Four play it complete in different keys. The 12-hole keeps A as printed, being the only chart that
    // reaches the A4 the first bar ends on.
    const fits = [
      ['whistle_d', 5, 'D'],
      ['recorder', 3, 'C'],
      ['recorder_german', 3, 'C'],
      ['ocarina_12', 0, 'A'],
    ] as const

    for (const [id, semitones, key] of fits) {
      const arrangement = songForInstrument(song, INSTRUMENTS[id])

      expect(arrangement.semitones).toBe(semitones)
      expect(arrangement.key).toBe(key)
      expect(arrangement.approximations).toEqual([])
    }

    // The 6-hole is the one that gives something up, and takes the recorders' shift to give up as little
    // as possible: nine notes of a hundred and twenty in C, against fourteen if it stayed in A.
    const ocarina = songForInstrument(song, INSTRUMENTS.ocarina_6)
    expect(ocarina.semitones).toBe(3)
    expect(ocarina.key).toBe('C')
    expect(ocarina.approximations).toEqual([
      { written: 'F6', played: 'E6' },
      { written: 'G6', played: 'E6' },
    ])

    // Whichever shift each one took, nothing is left without a fingering to show for it.
    for (const instrument of INSTRUMENT_LIST) {
      const arrangement = songForInstrument(song, instrument)
      expect(unplayableNotes(instrument, songNoteNames(arrangement))).toEqual([])
    }
  })

  it('keeps bar lines out of the note list', () => {
    for (const song of SONGS) {
      expect(songNoteNames(song)).not.toContain('|')
    }
  })
})
