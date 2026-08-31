import { CUSTOM_SONG_TITLE, EMPTY_CUSTOM_SONG, parseCustomSong } from '../src/data/customSong'
import { INSTRUMENTS } from '../src/data/instruments'
import { CUSTOM_SONG_ID, isSongId, songForInstrument } from '../src/data/songs'
import { parseAbc } from '../src/lib/abc'

/** The notes of a tune, or the error, so a failed parse shows the message in the diff. */
const tune = (abc: string): readonly string[] | string => {
  const result = parseAbc(abc)
  return result.ok ? result.tune.notes.map((entry) => entry.note) : result.error
}

const beats = (abc: string): readonly number[] | string => {
  const result = parseAbc(abc)
  return result.ok ? result.tune.notes.map((entry) => entry.beats) : result.error
}

/** A header with the quarter note as the unit, so one written note is one beat. */
const HEADER = 'X:1\nL:1/4\nK:C\n'

describe('ABC notation', () => {
  it('reads pitches from the octave that starts at middle C', () => {
    // The convention that matters most in practice: a whistle tune written `D...d` sounds an
    // octave below the whistle, and it is the transposer's job to lift it, not the parser's.
    expect(tune(`${HEADER}C D E c d C, c'`)).toEqual(['C4', 'D4', 'E4', 'C5', 'D5', 'C3', 'C6'])
  })

  it('applies the key signature to every note it covers', () => {
    expect(tune('X:1\nL:1/4\nK:D\nD E F G A B c d')).toEqual(
      ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
    )
    // A mode is not the major of the same letter: E dorian has the two sharps of D major.
    expect(tune('X:1\nL:1/4\nK:Edor\nE F G A B c')).toEqual(['E4', 'F#4', 'G4', 'A4', 'B4', 'C#5'])
    expect(tune('X:1\nL:1/4\nK:Bb\nB c d e')).toEqual(['A#4', 'C5', 'D5', 'D#5'])
  })

  it('holds an accidental to the end of its bar and no further', () => {
    // The rule a chart cannot show: `^F` sharpens the F after it too, and the bar line ends it.
    expect(tune(`${HEADER}^F F | F`)).toEqual(['F#4', 'F#4', 'F4'])
    // Same octave only, and `=` puts a note back where the key signature had moved it.
    expect(tune('X:1\nL:1/4\nK:D\n^^F =F F,')).toEqual(['G4', 'F4', 'F#3'])
  })

  it('reads note lengths against the unit the header sets', () => {
    expect(beats(`${HEADER}C C2 C/2 C/ C3/2 C//`)).toEqual([1, 2, 0.5, 0.5, 1.5, 0.25])
    // No `L:` field, so the meter decides: anything under 3/4 counts in sixteenths.
    expect(beats('X:1\nM:6/8\nK:C\nC')).toEqual([0.5])
    expect(beats('X:1\nM:2/4\nK:C\nC')).toEqual([0.25])
  })

  it('splits a broken rhythm between the two notes it joins', () => {
    expect(beats(`${HEADER}C>D`)).toEqual([1.5, 0.5])
    expect(beats(`${HEADER}C<D`)).toEqual([0.5, 1.5])
    expect(beats(`${HEADER}C>>D`)).toEqual([1.75, 0.25])
  })

  it('drops everything that is not a note to play', () => {
    // Rests leave no fingering behind, and a chord collapses to its top note — the melody.
    expect(tune(`${HEADER}C z2 [CEG] D`)).toEqual(['C4', 'G4', 'D4'])
    // Chord symbols, decorations, grace notes, slurs, ties, tuplets and repeat bars.
    expect(tune(`${HEADER}|:"Am"!trill!{g}(3C-C.D:|`)).toEqual(['C4', 'C4', 'D4'])
    // A length written after the bracket stretches the whole chord.
    expect(beats(`${HEADER}[CE]2`)).toEqual([2])
  })

  it('keeps a mid-tune key change', () => {
    expect(tune(`${HEADER}F [K:D] F`)).toEqual(['F4', 'F#4'])
  })

  it('ignores comments and lyric lines', () => {
    expect(tune(`${HEADER}C D % and the rest\nw: la la\nE`)).toEqual(['C4', 'D4', 'E4'])
  })

  it('reports the title and the key it read', () => {
    const titled = parseAbc('X:1\nT:The Butterfly\nK:Edor\nE')
    expect(titled.ok ? titled.tune : null).toMatchObject({ title: 'The Butterfly', key: 'E' })

    const bare = parseAbc('K:C\nC')
    expect(bare.ok ? bare.tune.title : 'missing').toBeNull()
  })

  it('says what it choked on instead of playing half a tune', () => {
    // The whole point of the error: a tune that silently drops what it cannot read is harder to
    // fix than one that names the character.
    expect(tune(`${HEADER}C D H`)).toContain('"H"')
    expect(tune(`${HEADER}C ^^`)).toContain('followed by a note letter')
    expect(tune('X:1\nT:Nothing\nK:C')).toContain('No notes')
  })
})

describe('custom songs', () => {
  it('is selectable even though it is not in the library', () => {
    expect(isSongId(CUSTOM_SONG_ID)).toBe(true)
    expect(EMPTY_CUSTOM_SONG.notes).toEqual([])
  })

  // The two formats are told apart by an ABC information field at the start of a line, which our
  // own note list can never have: its lengths are written `D5:2`, so the colon never lands
  // second. Nothing else about the text has to be right for the guess to work.
  it('tells a note list from an ABC tune', () => {
    const list = parseCustomSong('D5 E5 F#5:2')
    expect(list.ok ? list.song.notes : null).toEqual([
      { note: 'D5', beats: 1 },
      { note: 'E5', beats: 1 },
      { note: 'F#5', beats: 2 },
    ])

    const abc = parseCustomSong('X:1\nL:1/4\nK:D\nd e')
    expect(abc.ok ? abc.song.notes : null).toEqual([
      { note: 'D5', beats: 1 },
      { note: 'E5', beats: 1 },
    ])
  })

  it('reads the key of a note list off its first note', () => {
    // A guess, and only ever a hint for transposing: a melody the instrument can already play is
    // left where it is whatever the key says.
    const result = parseCustomSong('G5 A5 B5')
    expect(result.ok ? result.song.key : null).toBe('G')
  })

  it('takes the tune title when there is one', () => {
    const named = parseCustomSong('X:1\nT:Cooley\nK:Edor\nE')
    expect(named.ok ? named.song.title : null).toBe('Cooley')

    const unnamed = parseCustomSong('D5 E5')
    expect(unnamed.ok ? unnamed.song.title : null).toBe(CUSTOM_SONG_TITLE)
  })

  it('explains an empty or misspelled melody', () => {
    const empty = parseCustomSong('   \n  ')
    expect(empty.ok ? '' : empty.error).toContain('Nothing to play')

    const typo = parseCustomSong('D5 H5 E5')
    expect(typo.ok ? '' : typo.error).toContain('"H5"')

    // `Number('x')` is NaN rather than a throw, so a bad length has to be caught by hand.
    const length = parseCustomSong('D5:x')
    expect(length.ok ? '' : length.error).toContain('how long')
  })

  it('lands a pasted tune inside the range of the instrument', () => {
    // A tin whistle tune as it is written everywhere — from `D` to `d` — sounds an octave below
    // the whistle itself, so this is the case the transposer exists for.
    const result = parseCustomSong('X:1\nL:1/4\nK:D\nD E F G A B c d')
    const arrangement = result.ok
      ? songForInstrument(result.song, INSTRUMENTS.whistle_d)
      : null

    expect(arrangement?.semitones).toBe(12)
    expect(arrangement?.notes.map((entry) => entry.note)).toEqual(
      ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6'],
    )
  })
})
