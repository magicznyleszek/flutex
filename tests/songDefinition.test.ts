import { parseCustomSong } from '../src/data/customSong'
import { INSTRUMENT_LIST } from '../src/data/instruments'
import { SHARED_NOTES, songDefinition } from '../src/data/songDefinition'
import { SONGS } from '../src/data/songs'
import { defineSong, songForInstrument, type Song } from '../src/data/songUtils'

/** Reads a paste the way the app does, then asks what library entry it would make. */
function define(text: string): ReturnType<typeof songDefinition> {
  const parsed = parseCustomSong(text)
  if (!parsed.ok) throw new Error(parsed.error)

  return songDefinition(text, parsed.song)
}

/** Runs a generated block back through the reader it was written for. */
function reparse(block: string): Song {
  // The block is source text, so the fields come back out with a regex rather than an eval. Only
  // `key` and `spec` decide any notes, and those are what the assertions are about.
  const key = /key: '([^']+)'/.exec(block)?.[1] ?? ''
  const spec = /spec: (?:'([^']*)'|`([\s\S]*?)\n {4}`)/.exec(block)
  return defineSong({ id: 'x', title: 'x', key, spec: spec?.[1] ?? spec?.[2] ?? '' })
}

/** The tune as Playford printed it in 1651: two eight-bar strains, each played twice. */
const NONESUCH = `
X:1
T:Nonesuch
M:4/4
L:1/4
K:Em
|:B B G A|B G F/G/ E|B B G A|1 B G2 G:|2 B G2 E|
|:F F D E|F G F/G/ E|F F D E|F G2 E:|
`

describe('the shared note set', () => {
  // The library is written on these ten and the search aims at them, so a chart edit that changes
  // the set has to be a deliberate one.
  it('is the D major scale plus C natural', () => {
    expect(SHARED_NOTES).toEqual(['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'C#6', 'D6', 'E6'])
  })

  it('is playable on every instrument', () => {
    for (const instrument of INSTRUMENT_LIST) {
      expect(SHARED_NOTES.filter((note) => !(note in instrument.fingering))).toEqual([])
    }
  })
})

describe('reading a tune into a definition', () => {
  /*
   * The tune is in the library already, entered by hand from the same 1651 source. Reproducing it
   * note for note is the strongest check there is that the whole chain agrees — the octave the shift
   * lands on, the key it reports, the repeats it plays out, the two endings it picks between, the
   * bar lines it puts back and the `:beats` it writes out.
   */
  it('reproduces the library entry for a tune already in it', () => {
    const nonesuch = SONGS.find((song) => song.id === 'nonesuch')
    const definition = define(NONESUCH)

    expect(definition.key).toBe('E')
    expect(definition.semitones).toBe(12)
    expect(reparse(definition.block).notes).toEqual(nonesuch?.notes)
  })

  /*
   * A whole octave up would clear the bottom of the range but push the top past both ocarinas, so
   * the answer is a fifth, which also pulls the tune out of G and into the whistle's D. That is the
   * decision worth having a machine make: the smaller move is the one that fits, and it is not the
   * obvious one.
   */
  it('moves a tune written below the instruments by the smallest move that fits', () => {
    const definition = define('X:1\nT:Low\nM:4/4\nL:1/4\nK:G\nG A B c|d e f g|')

    expect(definition.semitones).toBe(7)
    expect(definition.key).toBe('D')
    expect(definition.strays).toEqual([])
  })

  it('leaves a tune that already fits exactly as written', () => {
    const definition = define('D5 E5 F#5 G5 | A5 B5 C#6 D6')

    expect(definition.semitones).toBe(0)
    expect(definition.block).toContain("spec: 'D5 E5 F#5 G5 | A5 B5 C#6 D6'")
  })

  it('names the notes no shift can rescue', () => {
    // Chromatic, so four notes are outside the shared set at every shift.
    const definition = define('X:1\nT:Chromatic\nM:4/4\nL:1/4\nK:C\nC ^C D ^D|E F ^F G|')

    expect(definition.strays.length).toBeGreaterThan(0)
    for (const note of definition.strays) expect(SHARED_NOTES).not.toContain(note)
  })
})

describe('the generated block', () => {
  /*
   * The point of the whole thing: a block that parses back into a song every instrument plays
   * untouched. That is what `tests/data.test.ts` demands of the library, so a definition that
   * failed here would be one that breaks the suite on being pasted.
   */
  it('plays as written on every instrument', () => {
    const song = reparse(define(NONESUCH).block)

    for (const instrument of INSTRUMENT_LIST) {
      const arrangement = songForInstrument(song, instrument)
      expect(arrangement.semitones).toBe(0)
      expect(arrangement.approximations).toEqual([])
    }
  })

  it('keeps the bar lines the source wrote', () => {
    const definition = define('X:1\nT:Bars\nM:2/4\nL:1/4\nK:D\nd e|f g|a b|')

    expect(definition.block).toContain("spec: 'D5 E5 | F#5 G5 | A5 B5'")
  })

  // A note list has no `T:` to take a title from, and a block titled "My own song" pasted into the
  // library would be wrong in a way nothing downstream would catch.
  it('flags a paste that brought no title of its own', () => {
    expect(define('D5 E5 F#5').needsTitle).toBe(true)
    expect(define(NONESUCH).needsTitle).toBe(false)
  })

  it('quotes a title containing an apostrophe', () => {
    expect(define("X:1\nT:The Queen's Jig\nM:4/4\nL:1/4\nK:D\nd e f g|").block)
      .toContain('title: "The Queen\'s Jig"')
  })

  it('wraps a long tune into a template literal instead of one line', () => {
    const long = `X:1\nT:Long\nM:4/4\nL:1/4\nK:D\n${'d e f g|'.repeat(12)}`
    const block = define(long).block

    expect(block).toContain('spec: `')
    // Every line of the spec stays inside the width the rest of the source keeps to.
    for (const line of block.split('\n')) expect(line.length).toBeLessThanOrEqual(98)
  })

  // The packer breaks between bars, so a source with none of them is one bar the width of the whole
  // melody. Wrapping has to fall back to breaking on notes or the spec comes out as one long line.
  it('wraps a long tune that has no bar lines to break on', () => {
    const block = define('D5 E5 F#5 G5 A5 B5 C#6 D6 '.repeat(12)).block

    expect(block).toContain('spec: `')
    for (const line of block.split('\n')) expect(line.length).toBeLessThanOrEqual(98)
  })
})
