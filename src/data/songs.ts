/**
 * The songs, plus the lookups that need all of them at once. What a song *is*, and how one is
 * fitted to an instrument, lives in `songUtils.ts`.
 *
 * The tunes are traditional or old enough to be out of copyright, and each subtitle names its
 * source. Most were read off ABC transcriptions in the Nottingham Music Database.
 *
 * These entries are compiled output, not hand-typed: `songDefinition.ts` turns an ABC tune into one,
 * transposition and all. Paste a tune into **My own song** and the app offers you the block.
 */
import { CUSTOM_SONG_ID, defineSong, type Song } from './songUtils'

// Every song but "Concerning Hobbits" is written inside D5-E6 on the ten notes all five charts
// share — the D major scale plus C natural, which is a tin whistle in D intersected with a 6-hole
// ocarina. That is what lets every instrument play the library as written, since
// `songForInstrument` leaves a melody alone when the instrument can already play it: a tune that
// did not fit that set was transposed until it did, or left out.
//
// The exception is a transcription rather than a tune chosen to fit, and its high section reaches
// F#6 and A6, past both ocarinas. The shift search is really there for pasted custom songs, which
// arrive in any key and any octave.
export const SONGS: readonly Song[] = [
  // --- Exercises

  defineSong({
    id: 'd-major-scale',
    title: 'D major scale',
    subtitle: 'Exercise — up and down',
    tags: ['exercise', 'easy'],
    key: 'D',
    spec: 'D5 E5 F#5 G5 A5 B5 C#6 D6 | C#6 B5 A5 G5 F#5 E5 D5:2',
  }),

  defineSong({
    id: 'd-major-arpeggio',
    title: 'D major arpeggio',
    subtitle: 'Exercise — interval leaps',
    tags: ['exercise', 'easy'],
    key: 'D',
    spec: 'D5 F#5 A5 D6 | A5 F#5 D5:2 | D5 A5 F#5 D6 | A5 F#5 D5:2',
  }),

  // --- First tunes: short, near enough stepwise, and probably already in your head

  defineSong({
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    subtitle: 'Traditional, D major',
    tags: ['folk', 'easy'],
    key: 'D',
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
    key: 'D',
    spec: `
      F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5 D5 E5 F#5 | F#5:1.5 E5:0.5 E5:2
      F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5 D5 E5 F#5 | E5:1.5 D5:0.5 D5:2
    `,
  }),

  defineSong({
    id: 'saints',
    title: 'When the Saints Go Marching In',
    subtitle: 'Traditional gospel — D major',
    tags: ['folk', 'easy'],
    key: 'D',
    spec: `
      D5 F#5 G5 A5:4 | A5 D5 F#5 G5 | A5:4 | A5 D5 F#5 G5 | A5:2 F#5:2 | D5:2 F#5:2
      E5:4 | E5:2 F#5 E5 | D5:3 D5 | F#5:2 A5:2 | A5 G5:3 | G5:2 F#5 G5 | A5:2 F#5:2
      D5:2 E5:2 | D5:4 | D5
    `,
  }),

  defineSong({
    id: 'oh-susanna',
    title: 'Oh! Susanna',
    subtitle: 'Stephen Foster, 1848 — D major',
    tags: ['folk', 'easy'],
    key: 'D',
    spec: `
      D5:0.25 E5:0.25 | F#5:0.5 A5:0.5 A5:0.75 B5:0.25 | A5:0.5 F#5:0.5 D5:0.5 E5:0.5
      F#5:0.5 F#5:0.5 E5:0.5 D5:0.5 | E5:1.5 D5:0.25 E5:0.25 | F#5:0.5 A5:0.5 A5:0.75 B5:0.25
      A5:0.5 F#5:0.5 D5:0.5 E5:0.5 | F#5:0.5 F#5:0.5 E5:0.5 E5:0.5 | D5:2 | G5 G5 | B5:0.5 B5:0.5 B5:0.5 B5:0.5
      A5:0.5 A5:0.5 F#5:0.5 D5:0.5 | E5:1.5 D5:0.25 E5:0.25 | F#5:0.5 A5:0.5 A5:0.75 B5:0.25
      A5:0.5 F#5:0.5 D5:0.5 E5:0.5 | F#5:0.5 F#5:0.5 E5:0.5 E5:0.5 | D5:2
    `,
  }),

  defineSong({
    id: 'scots-wha-hae',
    title: 'Scots Wha Hae',
    subtitle: 'Hey Tuttie Tatie, traditional Scots — G major',
    tags: ['folk', 'easy'],
    key: 'G',
    spec: `
      D5 D5:2 | D5 D5:2 | E5 D5:2 | E5 G5:3 | E5:2 E5 | E5:2 D5 | E5:2 F#5 | G5:2 A5
      B5:2 B5 | A5:2 G5 | G5:2 A5 | B5:2 A5 | G5:2 E5 | E5:2 D5 | D5:3 | D5:3 | B5:2 B5
      B5:2 A5 | B5:2 C6 | D6:3 | A5:2 A5 | A5:2 G5 | A5:2 B5 | C6:3 | D6:2 B5 | A5:2 G5
      G5:2 A5 | B5:3 | G5:2 E5 | E5:2 D5 | D5:3 | D5:2
    `,
  }),

  defineSong({
    id: 'jingle-bells',
    title: 'Jingle Bells',
    subtitle: 'Chorus, D major',
    tags: ['seasonal', 'easy'],
    key: 'D',
    spec: `
      F#5 F#5 F#5:2 | F#5 F#5 F#5:2 | F#5 A5 D5 E5 F#5:4
      G5 G5 G5 G5:2 | G5 F#5 F#5 F#5:2 | F#5 E5 E5 F#5 E5:2 A5:2
    `,
  }),

  defineSong({
    id: 'happy-birthday',
    title: 'Happy Birthday',
    subtitle: 'G major',
    tags: ['occasion', 'medium'],
    key: 'G',
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
    key: 'G',
    spec: `
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | G5:2 E5 | D5:3
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | B5:3
      D6 | B5:2 D6:0.5 B5:0.5 | G5:2 E5 | D5:3
      D5 | G5:2 B5:0.5 G5:0.5 | B5:2 A5 | G5:3
    `,
  }),

  // --- Songs and airs: longer melodies, held notes, more of a tune to shape

  defineSong({
    id: 'ye-banks-and-braes',
    title: 'Ye Banks and Braes',
    subtitle: "The Caledonian Hunt's Delight, 1788 — G major",
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      D5 G5:2 | G5 A5:1.5 G5:0.5 | A5 B5 D6 | B5 A5:1.5 G5:0.5 | A5 B5:1.5 A5:0.5 | G5 G5 E5
      D5 D5 E5 | G5 A5:2 | D5 G5:2 | G5 A5:1.5 G5:0.5 | A5 B5 D6 | B5 A5:1.5 G5:0.5
      A5 B5:1.5 A5:0.5 | G5 G5 E5 | D5 D5 E5 | G5 G5:2 | B5 D6:2 | E6 D6 B5 | G5 D6:2
      E6 D6 B5 | G5 D6 B5 | G5 D6 B5 | G5 E6 D6:0.5 C6:0.5 | B5 A5:2 | D5 G5:2 | G5 A5:1.5 G5:0.5
      A5 B5 D6 | B5 A5:1.5 G5:0.5 | A5 B5:1.5 A5:0.5 | G5 G5 E5 | D5 D5 E5 | G5 G5:2
    `,
  }),

  defineSong({
    id: 'endearing-young-charms',
    title: 'Believe Me, If All Those Endearing Young Charms',
    subtitle: 'Thomas Moore, 1808, to an older Irish air — D major',
    tags: ['folk', 'medium'],
    key: 'D',
    spec: `
      F#5:0.5 E5:0.5 D5:1.5 E5:0.5 | D5 D5 F#5 | A5 G5 B5 | D6 D6:2 | C#6:0.5 B5:0.5 A5:1.5 G5:0.5
      F#5 E5 D5 | E5 F#5 A5 | F#5 E5:2 | F#5:0.5 E5:0.5 D5:1.5 E5:0.5 | D5 D5 F#5 | A5 G5 B5
      D6 D6:2 | C#6:0.5 B5:0.5 A5 D6 | F#5 E5:1.5 D5:0.5 | E5 D5:3 | D5 A5 G5 | F#5 A5 D6
      D6:2 A5 | B5 G5 D6 | D6:2 C#6:0.5 B5:0.5 | A5:1.5 G5:0.5 F#5 | E5 D5 E5 | F#5 A5 F#5
      E5:2 F#5:0.5 E5:0.5 | D5:1.5 E5:0.5 D5 | D5 F#5 A5 | G5 B5 D6 | D6:2 C#6:0.5 B5:0.5
      A5 D6 F#5 | E5:1.5 D5:0.5 E5 | D5:3 | D5:2
    `,
  }),

  defineSong({
    id: 'daisy-bell',
    title: 'Daisy Bell',
    subtitle: 'Harry Dacre, 1892 — G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      B5:0.5 C6:0.5 | D6:3 | B5:3 | G5:3 | D5:3 | E5 F#5 G5 | E5:2 G5 | D5:3 | D5 G5 A5:3
      D6:3 | B5:3 | G5:3 | E5 F#5 G5 | A5:2 B5 | A5:3 | A5 A5 B5 | C6 B5 A5 | D6:2 B5
      A5 G5:2 | G5 G5 A5 | B5:2 G5 | E5:2 G5 | E5 D5:2 | D5 F#5 G5:2 | B5 A5:2 | D5 G5:2
      B5 A5 B5 | C6 D6 B5 | G5 A5:2 | B5 G5:3 | G5:2
    `,
  }),

  defineSong({
    id: 'huntsmans-chorus',
    title: "Huntsman's Chorus",
    subtitle: 'Carl Maria von Weber, Der Freischütz, 1821 — G major',
    tags: ['classical', 'medium'],
    key: 'G',
    spec: `
      D5 G5 D5 G5:0.5 A5:0.5 | B5:0.5 C6:0.5 D6:2 B5:2 | A5 D6 A5 D6 | B5:0.5 C6:0.5 B5:0.5 A5:0.5 G5 D5
      G5 D5 G5:0.5 A5:0.5 B5:0.5 C6:0.5 | D6:2 C6:2 | B5:0.5 A5:0.5 G5:0.5 A5:0.5 B5 A5
      G5:3 G5:0.5 A5:0.5 | B5:1.5 B5:0.5 B5 A5 | G5:2 G5:2 | C6:1.5 C6:0.5 C6 B5 | A5 F#5 E5 D5
      B5:1.5 A5:0.5 G5:0.5 A5:0.5 B5:0.5 C6:0.5 | D6:2 C6:2 | B5:0.5 A5:0.5 G5:0.5 A5:0.5 B5 A5
      G5:3
    `,
  }),

  // Transcribed from a recording rather than chosen to fit, so it is the one song that outgrows an
  // instrument: the ocarinas play its F#6 and A6 as the nearest notes they have. No lengths,
  // because the transcription is a list of pitches, and `beats` only feeds the count and playback.
  defineSong({
    id: 'concerning-hobbits',
    title: 'Concerning Hobbits',
    subtitle: 'The Shire theme, Howard Shore',
    tags: ['film', 'medium'],
    key: 'D',
    // Left in D rather than let the search drop it into C: that would buy back the nine F#6s and
    // cost the whole tune its key. The high section flattens onto the top of the chart instead,
    // and the song card names the swaps.
    overrides: { ocarina_6: 0, ocarina_12: 0 },
    spec: `
      D5 E5 F#5 A5 F#5 E5 D5
      F#5 A5 B5 D6 C#6 A5 F#5 E5
      D5 E5 F#5 A5 F#5 E5 D5
      F#5 A5 B5 A5 F#5 E5 D5
      D6 E6 F#6 F#6 F#6 A6 E6 D6 E6
      A5 B5 C#6 C#6 D6 A5 F#5 A5 E5
      D6 E6 F#6 F#6 A6 F#6 E6 E6
      F#6 E6 D6 D6 D6 F#6
      D6 E6 F#6 E6 D6 E6
      D5 E5 F#5
      F#5 B5 C#6 D6 C#6 A5 F#5 E5
      D5 E5 F#5 B5 C#6 D6 C#6 B5 A5 E5 D5
    `,
  }),

  // --- Carols

  defineSong({
    id: 'god-rest-ye-merry-gentlemen',
    title: 'God Rest You Merry, Gentlemen',
    subtitle: 'Traditional English carol — E minor',
    tags: ['seasonal', 'medium'],
    key: 'E',
    spec: `
      E5 | E5 B5 B5 A5 | G5 F#5 E5 D5 | E5 F#5 G5 A5 | B5:3 E5 | E5 B5 B5 A5 | G5 F#5 E5 D5
      E5 F#5 G5 A5 | B5:3 B5 | C6 A5 B5 C6 | D6 E6 B5 A5 | G5 E5 F#5 G5 | A5:2 G5 A5
      B5:2 C6 B5 | B5 A5 G5 F#5 | E5:2 G5 F#5 | E5 A5:2 G5 | A5 B5 C6 D6 | E6 B5 A5 G5
      F#5 E5:4 | E5:3
    `,
  }),

  defineSong({
    id: 'sussex-carol',
    title: 'Sussex Carol',
    subtitle: 'On Christmas Night All Christians Sing — G major',
    tags: ['seasonal', 'medium'],
    key: 'G',
    spec: `
      D6:0.5 D6 | B5:0.5 C6 D6:0.5 B5:0.5 A5:0.5 | G5:0.5 A5 F#5:0.5 G5 | G5:0.5 A5:0.5 B5:0.5 C6:0.5 B5
      A5:0.5 G5 D6:0.5 D6 | B5:0.5 C6 D6:0.5 B5:0.5 A5:0.5 | G5:0.5 A5 F#5:0.5 G5 | G5:0.5 A5:0.5 B5:0.5 C6:0.5 B5
      A5:0.5 G5:1.5 A5:1.5 | A5 G5:0.5 A5:0.5 B5:0.5 C6:0.5 | D6:0.5 C6:0.5 B5:0.5 A5:1.5
      A5:1.5 D6:1.5 | E6:1.5 D6:1.5 | C6 B5:0.5 A5:0.5 G5:0.5 A5:0.5 | G5:1.5 G5
    `,
  }),

  defineSong({
    id: 'ding-dong-merrily-on-high',
    title: 'Ding Dong Merrily on High',
    subtitle: "Branle de l'Official, Thoinot Arbeau, 1589 — G major",
    tags: ['seasonal', 'medium'],
    key: 'G',
    spec: `
      G5 G5 A5:0.5 G5:0.5 F#5:0.5 E5:0.5 | D5:3 D5 | E5 G5 G5 F#5 | G5:2 G5:2 | D6:1.5 C6:0.5 B5:0.5 C6:0.5 D6:0.5 B5:0.5
      C6:1.5 B5:0.5 A5:0.5 B5:0.5 C6:0.5 A5:0.5 | B5:1.5 A5:0.5 G5:0.5 A5:0.5 B5:0.5 G5:0.5
      A5:1.5 G5:0.5 F#5:0.5 G5:0.5 A5:0.5 F#5:0.5 | G5:1.5 F#5:0.5 E5:0.5 F#5:0.5 G5:0.5 E5:0.5
      F#5:1.5 E5:0.5 D5 D5 | E5 G5 G5 F#5 | G5:2 G5:2
    `,
  }),

  // --- English dance tunes

  defineSong({
    id: 'nonesuch',
    title: 'Nonesuch',
    subtitle: 'Playford, The English Dancing Master, 1651 — E minor',
    tags: ['dance', 'easy'],
    key: 'E',
    spec: `
      B5 B5 G5 A5 | B5 G5 F#5:0.5 G5:0.5 E5 | B5 B5 G5 A5 | B5 G5:2 G5 | B5 B5 G5 A5
      B5 G5 F#5:0.5 G5:0.5 E5 | B5 B5 G5 A5 | B5 G5:2 E5 | F#5 F#5 D5 E5 | F#5 G5 F#5:0.5 G5:0.5 E5
      F#5 F#5 D5 E5 | F#5 G5:2 E5 | F#5 F#5 D5 E5 | F#5 G5 F#5:0.5 G5:0.5 E5 | F#5 F#5 D5 E5
      F#5 G5:2 E5
    `,
  }),

  defineSong({
    id: 'queens-jig',
    title: "The Queen's Jig",
    subtitle: 'Playford, The Dancing Master — G major',
    tags: ['dance', 'medium'],
    key: 'G',
    spec: `
      D5:0.5 G5 A5:0.5 B5:0.5 G5:0.5 | B5:0.5 C6:1.5 B5:0.5 C6:0.5 | D6:0.5 B5:0.5 C6:0.5 B5:0.5 A5
      G5:0.5 A5:1.5 D5 | D5:0.5 G5 A5:0.5 B5:0.5 G5:0.5 | B5:0.5 C6:1.5 B5:0.5 C6:0.5
      D6:0.5 B5:0.5 C6:0.5 B5:0.5 A5 | G5:0.5 G5:1.5 G5 | D6:0.5 D6:0.5 E6:0.5 D6:0.5 C6
      B5:0.5 C6:1.5 B5:0.5 C6:0.5 | D6:0.5 B5:0.5 C6:0.5 B5:0.5 A5 | G5:0.5 A5:1.5 D5
      D6:0.5 D6:0.5 E6:0.5 D6:0.5 C6 | B5:0.5 C6:1.5 B5:0.5 C6:0.5 | D6:0.5 B5:0.5 C6:0.5 B5:0.5 A5
      G5:0.5 G5:1.5 G5
    `,
  }),

  defineSong({
    id: 'wakefield-hunt',
    title: 'Wakefield Hunt',
    subtitle: "Thompson's country dances, 1779 — G major",
    tags: ['dance', 'hard'],
    key: 'G',
    spec: `
      B5 C6:0.5 | D6:1.5 B5 C6:0.5 | D6:0.5 B5:0.5 G5:0.5 E5 D5:0.5 | E5:0.5 F#5:0.5 G5:0.5 D5 B5:0.5
      C6 B5:0.5 A5 G5:0.5 | D6:1.5 B5 C6:0.5 | D6:0.5 B5:0.5 G5:0.5 E5 D5:0.5 | E5:0.5 F#5:0.5 G5:0.5 D5 C6:0.5
      B5:0.5 C6:0.5 A5:0.5 G5:1.5 | D6:0.5 B5:0.5 G5:0.5 E6:0.5 C6:0.5 A5:0.5 | D6:0.5 B5:0.5 G5:0.5 E5 D5:0.5
      E5:0.5 F#5:0.5 G5:0.5 D5 B5:0.5 | C6 B5:0.5 A5 G5:0.5 | D6:0.5 B5:0.5 G5:0.5 E6:0.5 C6:0.5 A5:0.5
      D6:0.5 B5:0.5 G5:0.5 E5 D5:0.5 | E5:0.5 F#5:0.5 G5:0.5 D5 C6:0.5 | B5:0.5 C6:0.5 A5:0.5 G5:1.5
      D5 D5:0.5 E5 E5:0.5 | D5 B5:0.5 C6 B5:0.5 | A5:0.5 C6:0.5 E6:0.5 D6:0.5 B5:0.5 G5:0.5
      F#5 G5:0.5 A5:1.5 | D5 D5:0.5 E5 E5:0.5 | D5 B5:0.5 C6 B5:0.5 | A5:0.5 C6:0.5 E6:0.5 D6:0.5 E6:0.5 C6:0.5
      B5:0.5 C6:0.5 A5:0.5 G5:1.5
    `,
  }),

  defineSong({
    id: 'lads-a-bunchum',
    title: 'Lads a Bunchum',
    subtitle: 'Adderbury morris tune — D major',
    tags: ['dance', 'medium'],
    key: 'D',
    spec: `
      D5:0.5 E5:0.5 F#5:1.5 | G5:0.5 F#5:0.5 G5:0.5 A5:0.5 B5:0.5 G5 E5 | E5 F#5:0.5 G5:0.5 A5 A5
      A5:0.5 G5:0.5 F#5:0.5 E5:0.5 D5 D5 | D5:2 D6:0.5 C#6:0.5 B5 | A5 A5 D5:0.5 E5:0.5 F#5
      F#5 F#5 D6:0.5 C#6:0.5 B5 | A5 G5 F#5 E5 | D5 D5 D6:0.5 C#6:0.5 B5 | A5 A5 D5:0.5 E5:0.5 F#5
      F#5 F#5 D6:0.5 C#6:0.5 B5 | A5 F#5 D5 E5 | D5 D5:2
    `,
  }),

  defineSong({
    id: 'winster-galop',
    title: 'Winster Galop',
    subtitle: 'Derbyshire morris tune — D major',
    tags: ['dance', 'easy'],
    key: 'D',
    spec: `
      A5 D5 F#5:0.5 F#5:0.5 D5 | F#5 D5 F#5 A5:2 | E5:1.5 G5:0.5 F#5 E5 | D5 F#5 A5:2
      G5 B5 C#6 B5 | A5 F#5 A5:2 | E5:1.5 G5:0.5 F#5 E5 | D5:2 D5 A5 | D6 C#6 B5 A5
      D6 C#6 B5 A5 | D6 C#6 B5 A5 | G5 F#5 E5:2 | C#6 B5 A5:2 | C#6 B5 A5:2 | A5:2 E5:1.5 G5:0.5
      F#5 D5 D5
    `,
  }),

  // --- Irish and Scottish

  defineSong({
    id: 'egans-polka',
    title: "Egan's Polka",
    subtitle: 'Traditional Irish polka — G major',
    tags: ['dance', 'medium'],
    key: 'G',
    spec: `
      B5:0.5 D5:0.5 E5:0.5 D5:0.5 | B5:0.5 D5:0.5 E5:0.5 D5:0.5 | G5 A5:0.75 B5:0.25
      A5:0.5 G5:0.5 E5:0.5 D5:0.5 | B5:0.5 D5:0.5 E5:0.5 D5:0.5 | B5:0.5 D5:0.5 E5:0.5 D5:0.5
      G5 A5:0.75 B5:0.25 | A5:0.5 G5:0.5 G5 | B5:0.5 D6:0.5 B5:0.5 A5:0.5 | A5:0.5 G5:0.5 E5:0.5 D5:0.5
      G5 A5:0.75 B5:0.25 | A5:0.5 G5:0.5 E5:0.5 D5:0.5 | B5:0.5 D6:0.5 B5:0.5 A5:0.5
      A5:0.5 G5:0.5 E5:0.5 D5:0.5 | G5 A5:0.75 B5:0.25 | A5:0.5 G5:0.5 G5
    `,
  }),

  defineSong({
    id: 'brian-borus-march',
    title: "Brian Boru's March",
    subtitle: 'Traditional Irish march — E minor',
    tags: ['folk', 'medium'],
    key: 'E',
    spec: `
      B5:0.5 G5:0.5 F#5:0.5 E5:0.5 E5:0.5 B5:0.5 | A5:0.5 G5:0.5 F#5:0.5 E5:0.5 E5 | A5:0.5 F#5:0.5 E5:0.5 D5:0.5 D5:0.5 A5:0.5
      G5:0.5 F#5:0.5 E5:0.5 D5:0.5 D5 | B5:0.5 G5:0.5 F#5:0.5 E5:0.5 E5:0.5 B5:0.5 | A5:0.5 G5:0.5 F#5:0.5 E5:0.5 E5
      F#5:0.5 G5:0.5 A5:0.5 B5:0.5 B5 | A5:0.5 G5:0.5 E5:0.5 E5:0.5 E5 | F#5:0.5 G5:0.5 A5:0.5 B5:0.5 B5:0.5 C6:0.5
      B5:0.5 B5:0.5 C6:0.5 B5:0.5 B5:0.5 A5:0.5 | G5:0.5 F#5:0.5 G5:0.5 A5:0.5 A5:0.5 B5:0.5
      A5:0.5 A5:0.5 B5:0.5 A5:0.5 A5:0.5 G5:0.5 | F#5:0.5 G5:0.5 A5:0.5 B5:0.5 B5:0.5 C6:0.5
      B5:0.5 B5:0.5 C6:0.5 B5:0.5 B5:0.5 A5:0.5 | G5:0.5 B5:1.5 B5 | A5:0.5 G5:0.5 E5:0.5 E5:0.5 E5
    `,
  }),

  defineSong({
    id: 'cavan-buck',
    title: 'Cavan Buck',
    subtitle: 'Traditional Irish jig — E dorian',
    tags: ['dance', 'medium'],
    key: 'E',
    spec: `
      G5 E5:0.5 F#5:1.5 | E5 F#5:0.5 G5 A5:0.5 | B5 B5:0.5 A5 G5:0.5 | F#5 D5:0.5 D5:0.5 E5:0.5 F#5:0.5
      G5:0.5 F#5:0.5 E5:0.5 F#5:0.5 E5:0.5 D5:0.5 | E5 F#5:0.5 G5 A5:0.5 | B5:0.5 C#6:0.5 D6:0.5 C#6:0.5 B5:0.5 A5:0.5
      B5 E5:0.5 E5:1.5 | D6 B5:0.5 G5 A5:0.5 | B5 E6:0.5 E6 B5:0.5 | D6 B5:0.5 A5 G5:0.5
      F#5 D5:0.5 D5:0.5 E5:0.5 F#5:0.5 | G5:0.5 F#5:0.5 E5:0.5 F#5:0.5 E5:0.5 D5:0.5
      E5 F#5:0.5 G5 A5:0.5 | B5:0.5 C#6:0.5 D6:0.5 C#6:0.5 B5:0.5 A5:0.5 | B5 E5:0.5 E5:1.5
    `,
  }),

  defineSong({
    id: 'sprig-of-shillelagh',
    title: 'The Sprig of Shillelagh',
    subtitle: 'Traditional Irish jig — G major',
    tags: ['dance', 'hard'],
    key: 'G',
    spec: `
      D5:0.5 D5:0.5 G5:0.5 G5:0.5 G5:0.5 F#5:0.5 | G5:0.5 A5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5
      F#5:0.5 G5:0.5 D6:0.5 D6:0.5 D6:0.5 C6:0.5 | B5:0.5 A5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5
      F#5:0.5 G5:0.5 A5:0.5 B5:0.5 E5:0.5 F#5:0.5 | G5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5
      G5:0.5 B5:0.5 G5:0.5 B5:0.5 D6:0.5 B5:0.5 | D6:0.5 E6:0.5 C6:0.5 E6:0.5 D6 | C6:0.5 B5:0.5 G5:0.5 B5:0.5 D6:0.5 B5:0.5
      D6:0.5 E6:0.5 C6:0.5 E6:0.5 D6 | C6:0.5 B5:0.5 B5:0.5 B5:0.5 B5:0.5 A5:0.5 | G5:0.5 A5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5
      F#5:0.5 G5:0.5 D6:0.5 D6:0.5 D6:0.5 C6:0.5 | B5:0.5 A5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5
      F#5:0.5 G5:0.5 A5:0.5 B5:0.5 E5:0.5 F#5:0.5 | G5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5
    `,
  }),

  defineSong({
    id: 'cock-o-the-north',
    title: "Cock o' the North",
    subtitle: 'Traditional Scots jig — D major',
    tags: ['dance', 'hard'],
    key: 'D',
    spec: `
      A5:0.25 | G5:0.25 F#5:0.5 G5:0.5 F#5:0.5 F#5:0.5 E5:0.5 D5:0.5 | D5:0.5 F#5:0.5 A5:0.5 B5 A5:0.5
      F#5:0.5 G5:0.5 F#5:0.5 F#5:0.5 E5:0.5 D5:0.5 | E5:0.5 F#5:0.5 E5:0.5 E5:0.5 A5:0.5 G5:0.5
      F#5:0.5 G5:0.5 F#5:0.5 F#5:0.5 E5:0.5 D5:0.5 | D5:0.5 F#5:0.5 A5:0.5 B5 A5:0.5
      F#5 F#5:0.5 E5:0.5 F#5:0.5 E5:0.5 | D5:1.5 D5 A5:0.25 B5:0.25 | C#6:0.25 D6 A5:0.5 B5 A5:0.5
      D6 A5:0.5 B5 A5:0.5 | F#5:0.5 G5:0.5 F#5:0.5 F#5:0.5 E5:0.5 D5:0.5 | E5:0.5 F#5:0.5 G5:0.5 A5:0.5 B5:0.5 C#6:0.5
      D6 A5:0.5 B5 A5:0.5 | D6 A5:0.5 B5 A5:0.5 | F#5 F#5:0.5 E5:0.5 F#5:0.5 E5:0.5
      D5:1.5 D5
    `,
  }),

  // A fifth above the printed D, which is the only placement that keeps the tune whole: an octave up
  // pushes its high strain past both ocarinas, and as printed most of it falls under a whistle. The
  // G naturals are the source's own — O'Neill's writes `=c` against a D key signature.
  defineSong({
    id: 'a-blast-of-wind',
    title: 'A Blast Of Wind',
    subtitle: "Irish slip jig, O'Neill's Music of Ireland, 1903 — A major",
    tags: ['dance', 'hard'],
    key: 'A',
    spec: `
      A5:1.5 A5:0.5 E5:0.5 D5:0.5 C#5:0.5 B4:0.5 A4:0.5
      A5 A5:0.5 A5:0.5 E5:0.5 C#5:0.5 D5 B4:0.5
      E5:0.5 F#5:0.5 G#5:0.5 A5:0.5 E5:0.5 D5:0.5 C#5:0.5 D5:0.5 E5:0.5
      G5:0.5 F#5:0.5 G5:0.5 B4 C#5:0.5 D5 B4:0.5
      A5:1.5 A5:0.5 E5:0.5 D5:0.5 C#5:0.5 B4:0.5 A4:0.5
      A5 A5:0.5 A5:0.5 E5:0.5 C#5:0.5 D5 B4:0.5
      E5:0.5 F#5:0.5 G#5:0.5 A5:0.5 E5:0.5 D5:0.5 C#5:0.5 D5:0.5 E5:0.5
      G5:0.5 F#5:0.5 G5:0.5 B4 C#5:0.5 D5 B4:0.5
      A5 D6:0.5 C#6:0.5 A5:0.5 C#6:0.5 B5:0.5 G#5:0.5 B5:0.5
      A5 D6:0.5 C#6:0.5 A5:0.5 C#6:0.5 D6 B5:0.5
      A5 D6:0.5 C#6:0.5 A5:0.5 C#6:0.5 B5:0.5 G#5:0.5 B5:0.5
      G5:0.5 F#5:0.5 G5:0.5 B4 C#5:0.5 D5 B4:0.5
      A5 D6:0.5 C#6:0.5 A5:0.5 C#6:0.5 B5:0.5 G#5:0.5 B5:0.5
      A5 D6:0.5 C#6:0.5 A5:0.5 C#6:0.5 D6 B5:0.5
      E6:0.5 C#6:0.5 A5:0.5 D6:0.5 B5:0.5 G#5:0.5 A5 F#5:0.5
      G5:0.5 F#5:0.5 G5:0.5 B4 C#5:0.5 D5 B4:0.5
    `,
  }),

  // --- American old-time

  defineSong({
    id: 'angeline-the-baker',
    title: 'Angeline the Baker',
    subtitle: "Old-time, after Foster's Angelina Baker, 1850 — G major",
    tags: ['dance', 'medium'],
    key: 'G',
    spec: `
      G5:0.5 E5:0.5 D5 E5 G5:1.5 | D5:0.5 E5 G5:2 G5:0.5 | E5:0.5 D5 E5 G5:0.5 E5:0.5 D5
      E5:3 G5:0.5 E5:0.5 | D5 E5 G5:1.5 A5:0.5 | B5 A5 G5:1.5 A5:0.5 | B5 A5 G5 E5 | D5:1.5 E5:0.5 D5 B5:0.5 C6:0.5
      D6 B5 A5 G5:0.5 A5:0.5 | B5 A5 G5 B5:0.5 C6:0.5 | D6 B5 A5 G5 | E5:1.5 E5:0.5 E5 B5:0.5 C6:0.5
      D6 B5 A5 G5:0.5 A5:0.5 | B5 A5 G5 G5:0.5 A5:0.5 | B5 A5 G5 E5 | D5:1.5 E5:0.5 D5
    `,
  }),

  defineSong({
    id: 'mississippi-sawyer',
    title: 'Mississippi Sawyer',
    subtitle: 'Traditional old-time reel — G major',
    tags: ['dance', 'hard'],
    key: 'G',
    spec: `
      B5:0.5 | C6:0.5 D6 D6:0.5 B5:0.5 D6 D6:0.5 | B5:0.5 D6 D6:0.5 B5:0.5 D6:0.5 E6:0.5 D6:0.5
      B5:0.5 C6 C6:0.5 A5:0.5 C6 C6:0.5 | A5:0.5 C6 C6:0.5 A5:0.5 D6:0.5 C6:0.5 B5:0.5
      A5:0.5 B5 B5:0.5 D6:0.5 B5 B5:0.5 | A5:0.5 G5:0.5 A5:0.5 B5:0.5 C6:0.5 D6 B5:0.5
      C6:0.5 D6 D6:0.5 B5:0.5 A5:0.5 C6:0.5 B5:0.5 | A5:0.5 G5:2 G5 D5:0.5 | E5:0.5 F#5:0.5 G5 B5:0.5 A5:0.5 G5
      B5:0.5 A5:0.5 G5:0.5 A5:0.5 B5:0.5 C6:0.5 D6:2 | D5 F#5:0.5 E5:0.5 D5 F#5:0.5 E5:0.5
      D5:0.5 E5:0.5 F#5:0.5 G5:0.5 A5:0.5 C6:0.5 B5:0.5 A5:0.5 | G5 B5:0.5 A5:0.5 G5 B5:0.5 A5:0.5
      G5:0.5 A5:0.5 B5:0.5 C6:0.5 D6 B5:0.5 C6:0.5 | D6:0.5 E6:0.5 D6:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 B5:0.5
      A5:0.5 G5:0.5 A5:0.5 B5:0.5 G5
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

/**
 * Falls back to the default song so the UI always has something to render. `CUSTOM_SONG_ID` is
 * not in the library and falls back with everything else, so a caller that offers the custom
 * song has to reach for `parseCustomSong` before asking here.
 */
export function getSong(id: string | null | undefined): Song {
  return findSong(id) ?? DEFAULT_SONG
}

/**
 * The `value is string` narrowing does nothing at the type level. The guard exists to fit
 * the `isValid` callbacks, which reject an id that is no longer in the library.
 */
export function isSongId(value: string): value is string {
  return value === CUSTOM_SONG_ID || findSong(value) !== null
}
