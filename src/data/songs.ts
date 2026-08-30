export interface SongNote {
  note: string
  /** Length in beats. A UI hint only — rhythm is never enforced. */
  beats: number
}

export interface Song {
  /** Saved progress is keyed by these ids, so renaming one resets that song's history. */
  id: string
  title: string
  subtitle?: string
  tags: readonly string[]
  notes: readonly SongNote[]
}

/**
 * `D5 A5:2 | F#5:0.5` — space-separated note names, `|` bar lines dropped, and an
 * optional `:beats` suffix that defaults to one beat.
 */
function parseNotes(spec: string): readonly SongNote[] {
  return spec
    .trim()
    .split(/\s+/)
    .filter((token) => token !== '|' && token.length > 0)
    .map((token) => {
      const [note = '', beats] = token.split(':')
      return { note, beats: beats === undefined ? 1 : Number(beats) }
    })
}

interface SongInput {
  id: string
  title: string
  subtitle?: string
  tags?: readonly string[]
  spec: string
}

const defineSong = ({ id, title, subtitle, tags = [], spec }: SongInput): Song => ({
  id,
  title,
  ...(subtitle === undefined ? {} : { subtitle }),
  tags,
  notes: parseNotes(spec),
})

// Every song stays inside D5-D6 and skips C5 and F5, so it plays on both the tin
// whistle in D and the soprano recorder.
export const SONGS: readonly Song[] = [
  defineSong({
    id: 'd-major-scale',
    title: 'D major scale',
    subtitle: 'Exercise — up and down',
    tags: ['exercise', 'easy'],
    spec: 'D5 E5 F#5 G5 A5 B5 C#6 D6 | C#6 B5 A5 G5 F#5 E5 D5:2',
  }),

  defineSong({
    id: 'd-major-arpeggio',
    title: 'D major arpeggio',
    subtitle: 'Exercise — interval leaps',
    tags: ['exercise', 'easy'],
    spec: 'D5 F#5 A5 D6 | A5 F#5 D5:2 | D5 A5 F#5 D6 | A5 F#5 D5:2',
  }),

  defineSong({
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    subtitle: 'Traditional, D major',
    tags: ['folk', 'easy'],
    spec: `
      D5 D5 A5 A5 B5 B5 A5:2 | G5 G5 F#5 F#5 E5 E5 D5:2
      A5 A5 G5 G5 F#5 F#5 E5:2 | A5 A5 G5 G5 F#5 F#5 E5:2
      D5 D5 A5 A5 B5 B5 A5:2 | G5 G5 F#5 F#5 E5 E5 D5:2
    `,
  }),

  defineSong({
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    subtitle: 'Ludwig van Beethoven, D major',
    tags: ['classical', 'easy'],
    spec: `
      F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5 D5 E5 F#5 | F#5:1.5 E5:0.5 E5:2
      F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5 D5 E5 F#5 | E5:1.5 D5:0.5 D5:2
    `,
  }),

  defineSong({
    id: 'jingle-bells',
    title: 'Jingle Bells',
    subtitle: 'Chorus, D major',
    tags: ['seasonal', 'easy'],
    spec: `
      F#5 F#5 F#5:2 | F#5 F#5 F#5:2 | F#5 A5 D5 E5 F#5:4
      G5 G5 G5 G5:2 | G5 F#5 F#5 F#5:2 | F#5 E5 E5 F#5 E5:2 A5:2
    `,
  }),

  defineSong({
    id: 'concerning-hobbits',
    title: 'Concerning Hobbits',
    subtitle: 'The Shire theme, Howard Shore',
    tags: ['film', 'medium'],
    spec: `
      D5 E5:0.5 F#5:0.5 A5 G5 F#5 D5
      E5 F#5:0.5 G5:0.5 F#5 E5 D5 D5
      A5 B5 A5:2
    `,
  }),

  defineSong({
    id: 'happy-birthday',
    title: 'Happy Birthday',
    subtitle: 'G major',
    tags: ['occasion', 'medium'],
    spec: `
      D5:0.5 D5:0.5 E5 D5 G5 F#5:2
      D5:0.5 D5:0.5 E5 D5 A5 G5:2
      D5:0.5 D5:0.5 D6 B5 G5 A5 G5:2
      C6:0.5 C6:0.5 B5 G5 A5 G5:2
    `,
  }),

  defineSong({
    id: 'amazing-grace',
    title: 'Amazing Grace',
    subtitle: 'Traditional, G major',
    tags: ['folk', 'medium'],
    spec: `
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | G5:2 E5 | D5:3
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | B5:3
      D6 | B5:2 D6:0.5 B5:0.5 | G5:2 E5 | D5:3
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | G5:3
    `,
  }),
]

export const DEFAULT_SONG_ID = 'd-major-scale'

export function findSong(id: string | null | undefined): Song | null {
  return SONGS.find((entry) => entry.id === id) ?? null
}

const FIRST_SONG = SONGS[0]
if (FIRST_SONG === undefined) throw new Error('The song library is empty')

export const DEFAULT_SONG: Song = findSong(DEFAULT_SONG_ID) ?? FIRST_SONG

/** Falls back to the default song so the UI always has something to render. */
export function getSong(id: string | null | undefined): Song {
  return findSong(id) ?? DEFAULT_SONG
}

/**
 * The `value is string` narrowing does nothing at the type level. The guard exists to fit
 * the `isValid` callbacks, which reject an id that is no longer in the library.
 */
export function isSongId(value: string): value is string {
  return findSong(value) !== null
}

export function songNoteNames(song: Song): readonly string[] {
  return song.notes.map((entry) => entry.note)
}
