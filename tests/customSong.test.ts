import { CUSTOM_SONG_TITLE, EMPTY_CUSTOM_SONG, parseCustomSong } from '../src/data/customSong'
import { INSTRUMENTS } from '../src/data/instruments'
import { isSongId } from '../src/data/songs'
import { CUSTOM_SONG_ID, songForInstrument } from '../src/data/songUtils'
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
    // A whistle tune written `D...d` sounds an octave below the whistle; lifting it is the transposer's job.
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
    // Chord symbols, decorations, grace notes, slurs, ties and tuplets.
    expect(tune(`${HEADER}|"Am"!trill!{g}(3C-C.D|`)).toEqual(['C4', 'C4', 'D4'])
    // A length written after the bracket stretches the whole chord.
    expect(beats(`${HEADER}[CE]2`)).toEqual([2])
  })

  // The trainer walks a melody end to end with nowhere to put a jump, so a repeat becomes the notes it stands
  // for. Getting it wrong is quiet: a two-part reel still plays, just half of it.
  describe('repeats', () => {
    it('plays a repeated section twice', () => {
      expect(tune(`${HEADER}|:C D|E F:|`)).toEqual(['C4', 'D4', 'E4', 'F4', 'C4', 'D4', 'E4', 'F4'])
    })

    it('repeats each section of an AABB tune in turn', () => {
      // Both spellings of the middle: two sections back to back, and the `::` that writes it as one.
      const aabb = ['C4', 'C4', 'D4', 'D4']
      expect(tune(`${HEADER}|:C:|:D:|`)).toEqual(aabb)
      expect(tune(`${HEADER}|:C::D:|`)).toEqual(aabb)
    })

    it('takes the tune from the top when nothing says where to repeat from', () => {
      expect(tune(`${HEADER}C D:|`)).toEqual(['C4', 'D4', 'C4', 'D4'])
    })

    it('plays a first ending once and a second in its place on the way back', () => {
      // `|: A |1 B :|2 C |` is A B A C: the jump back skips the ending just played. Both the `|1` shorthand
      // and the `[1` the standard prefers.
      const variant = ['C4', 'D4', 'E4', 'C4', 'D4', 'F4']
      expect(tune(`${HEADER}|:C D|1 E:|2 F|`)).toEqual(variant)
      expect(tune(`${HEADER}|:C D|[1 E:|[2 F|`)).toEqual(variant)
      expect(tune(`${HEADER}|:C D|1 E:||2 F|`)).toEqual(variant)
    })

    it('goes round once more for a third ending', () => {
      expect(tune(`${HEADER}|:C|1 D:|2 E:|3 F|`))
        .toEqual(['C4', 'D4', 'C4', 'E4', 'C4', 'F4'])
    })

    it('leaves what is outside the repeat alone', () => {
      expect(tune(`${HEADER}A|:C:|E`)).toEqual(['A4', 'C4', 'C4', 'E4'])
    })

    it('re-applies an accidental to the repeat, bar by bar', () => {
      // The copy is of notes already read, not of the text, so `^F` cannot leak past its bar line.
      expect(tune(`${HEADER}|:^F F|F:|`)).toEqual(['F#4', 'F#4', 'F4', 'F#4', 'F#4', 'F4'])
    })

    it('counts the bars it played out', () => {
      const result = parseAbc(`${HEADER}|:C D|E:|F G|`)
      expect(result.ok ? result.tune.bars : null).toEqual([2, 1, 2, 1, 2])
      // The invariant every consumer leans on: the bars account for all the notes.
      expect(result.ok ? result.tune.bars.reduce((sum, count) => sum + count, 0) : -1)
        .toBe(result.ok ? result.tune.notes.length : -2)
    })
  })

  it('keeps a mid-tune key change', () => {
    expect(tune(`${HEADER}F [K:D] F`)).toEqual(['F4', 'F#4'])
  })

  it('ignores comments and lyric lines', () => {
    expect(tune(`${HEADER}C D % and the rest\nw: la la\nE`)).toEqual(['C4', 'D4', 'E4'])
  })

  it('ignores a header wrapped onto a bare line of its own', () => {
    // Straight out of an O'Neill's transcription: a `Z:` field continued on the next line rather than
    // with `+:`, which used to be read as melody and die on the first letter that is not a note.
    const wrapped = 'X:1\nZ:FROM O\'NEILL\'S TO ABC BY VINCE\nBRENNAN July 2003 (HTTP://SOSYOURMOM.COM)'
    expect(tune(`${wrapped}\nL:1/4\nK:C\nC D`)).toEqual(['C4', 'D4'])

    // And what it must not swallow: a melody line with no bar line, and a mistyped note.
    expect(tune(`${HEADER}cdedcAGA`)).toEqual(['C5', 'D5', 'E5', 'D5', 'C5', 'A4', 'G4', 'A4'])
    expect(tune(`${HEADER}C D H`)).toContain('"H"')
  })

  it('reports the title and the key it read', () => {
    const titled = parseAbc('X:1\nT:The Butterfly\nK:Edor\nE')
    expect(titled.ok ? titled.tune : null).toMatchObject({ title: 'The Butterfly', key: 'E' })

    const bare = parseAbc('K:C\nC')
    expect(bare.ok ? bare.tune.title : 'missing').toBeNull()
  })

  it('says what it choked on instead of playing half a tune', () => {
    // A tune that silently drops what it cannot read is harder to fix than one naming the character.
    expect(tune(`${HEADER}C D H`)).toContain('"H"')
    expect(tune(`${HEADER}C ^^`)).toContain('followed by a note letter')
    expect(tune('X:1\nT:Nothing\nK:C')).toContain('No notes')
  })

  // Numbered in the text as pasted, blank lines and headers included, since that is what you scroll to —
  // while the offsets it counts from are into the joined body lines.
  it('names the line it choked on', () => {
    const error = tune('X:1\nL:1/4\nK:C\nC D E\nF G H\n')
    expect(error).toContain('Line 5')
    expect(error).toContain('F G H')

    // A long line is quoted round the spot rather than whole.
    const long = tune(`X:1\nL:1/8\nK:C\n${'CDEF GABc '.repeat(9)}H`)
    expect(long).toContain('Line 4')
    expect(long).toContain('…')
    expect(long).toContain('H')
  })
})

describe('custom songs', () => {
  it('is selectable even though it is not in the library', () => {
    expect(isSongId(CUSTOM_SONG_ID)).toBe(true)
    expect(EMPTY_CUSTOM_SONG.notes).toEqual([])
  })

  // Told apart by an ABC information field at the start of a line, which a note list can never have: its
  // lengths are written `D5:2`, so the colon never lands second.
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
    // A guess, and only a hint for transposing: a melody that already fits is left where it is.
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

    // `Number('x')` is NaN rather than a throw, so a bad length is caught by hand.
    const length = parseCustomSong('D5:x')
    expect(length.ok ? '' : length.error).toContain('how long')
  })

  it('lands a pasted tune inside the range of the instrument', () => {
    // A whistle tune as written everywhere — `D` to `d` — sounds an octave below the whistle.
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
