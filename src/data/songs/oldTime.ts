/** The fiddle tunes: American old-time, two strains apiece. */
import { defineSong, type Song } from '../songUtils'

export const OLD_TIME: readonly Song[] = [
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

  defineSong({
    id: 'liza-jane',
    title: 'Liza Jane',
    subtitle: 'Traditional old-time reel — D major',
    tags: ['dance', 'medium'],
    key: 'D',
    spec: `
      D5:0.5 E5:0.5 | F#5 F#5 E5 D5 | F#5 A5 A5:1.5 A5:0.5 | B5 A5 A5 F#5 | A5:2 A5:2
      F#5 F#5 E5 D5 | F#5 A5 A5:1.5 A5:0.5 | F#5 F#5 F#5 E5 | D5:3 | D5:0.5 E5:0.5 | F#5 F#5 E5 D5
      F#5 A5 A5:1.5 A5:0.5 | B5 A5 A5 F#5 | A5:2 A5:2 | F#5 F#5 E5 D5 | F#5 A5 A5:1.5 A5:0.5
      F#5 F#5 F#5 E5 | D5:3 | A5 | D6 D6:2 A5 | B5:2 A5:2 | B5 A5 A5 F#5 | A5:2 A5:2 | D6 D6:2 A5
      B5:2 A5:2 | F#5 F#5 F#5 E5 | D5:3 | A5 | D6 D6:2 A5 | B5:2 A5:2 | B5 A5 A5 F#5 | A5:2 A5:2
      D6 D6:2 A5 | B5:2 A5:2 | F#5 F#5 F#5 E5 | D5:3
    `,
  }),

  defineSong({
    id: 'goodbye-girls-i-m-going-to-boston',
    title: "Goodbye Girls, I'm Going to Boston",
    subtitle: 'Traditional old-time reel — D major',
    tags: ['dance', 'hard'],
    key: 'D',
    spec: `
      A5:0.5 | D5:0.5 F#5:0.5 A5:0.75 A5:0.25 | B5:0.5 B5:0.5 G5:0.5 E5:0.5
      E5:0.5 F#5:0.5 G5:0.5 F#5:0.25 G5:0.25 | A5:0.5 A5:0.5 F#5:0.5 D5:0.5
      D5:0.5 F#5:0.5 A5:0.75 A5:0.25 | B5:0.5 B5:0.5 G5:0.5 E5:0.5
      A5:0.5 A5:0.5 G5:0.25 F#5:0.25 E5:0.5 | D5 D5:0.5 | A5:0.5 | D5:0.5 F#5:0.5 A5:0.75 A5:0.25
      B5:0.5 B5:0.5 G5:0.5 E5:0.5 | E5:0.5 F#5:0.5 G5:0.5 F#5:0.25 G5:0.25
      A5:0.5 A5:0.5 F#5:0.5 D5:0.5 | D5:0.5 F#5:0.5 A5:0.75 A5:0.25 | B5:0.5 B5:0.5 G5:0.5 E5:0.5
      A5:0.5 A5:0.5 G5:0.25 F#5:0.25 E5:0.5 | D5 D5:0.5 | A5:0.5
      D6:0.5 D6:0.25 D6:0.25 D6:0.5 E6:0.5 | D6 A5:0.5 B5:0.5
      C6:0.5 C6:0.25 C6:0.25 C6:0.5 D6:0.5 | C6 A5 | D6:0.5 D6:0.25 D6:0.25 D6:0.5 E6:0.5
      D6 A5:0.5 B5:0.5 | C6:0.5 A5:0.5 G5:0.5 E5:0.5 | D5:1.5 | A5:0.5
      D6:0.5 D6:0.25 D6:0.25 D6:0.5 E6:0.5 | D6 A5:0.5 B5:0.5
      C6:0.5 C6:0.25 C6:0.25 C6:0.5 D6:0.5 | C6 A5 | D6:0.5 D6:0.25 D6:0.25 D6:0.5 E6:0.5
      D6 A5:0.5 B5:0.5 | C6:0.5 A5:0.5 G5:0.5 E5:0.5 | D5:1.5
    `,
  }),

  // The one library tune in C. Written low in D, under the whistle, and the plain octave up would
  // need an F#6 nothing here has — ten semitones is the move that lands every note on the chart.
  defineSong({
    id: 'boil-em-cabbage-down',
    title: "Boil 'Em Cabbage Down",
    subtitle: 'Traditional old-time breakdown — C major',
    tags: ['dance', 'hard'],
    key: 'C',
    spec: `
      G5:0.5 G5:0.25 G5:0.25 G5:0.5 G5:0.5 | A5:0.5 A5:0.25 A5:0.25 A5:0.5 A5:0.5
      G5:0.5 G5:0.25 G5:0.25 G5:0.5 E5:0.5 | D5:2 | G5:0.5 G5:0.25 G5:0.25 G5:0.5 G5:0.5
      A5:0.5 A5:0.25 A5:0.25 A5:0.5 A5:0.5 | G5:0.5 B5:0.25 B5:0.25 D6:0.5 B5:0.5 | C6:2
      G5:0.5 G5:0.25 G5:0.25 G5:0.5 G5:0.5 | A5:0.5 A5:0.25 A5:0.25 A5:0.5 A5:0.5
      G5:0.5 G5:0.25 G5:0.25 G5:0.5 E5:0.5 | D5:2 | G5:0.5 G5:0.25 G5:0.25 G5:0.5 G5:0.5
      A5:0.5 A5:0.25 A5:0.25 A5:0.5 A5:0.5 | G5:0.5 B5:0.25 B5:0.25 D6:0.5 B5:0.5 | C6:1.5
      G5:0.5 | C6:0.5 C6:0.25 C6:0.25 E6:0.5 G5:0.5 | C6:1.5 G5:0.5
      C6:0.5 C6:0.25 C6:0.25 B5:0.5 A5:0.5 | G5:1.5 G5:0.5 | C6:0.5 C6:0.25 C6:0.25 C6:0.5 C6:0.5
      A5:0.5 A5:0.25 A5:0.25 A5:0.5 A5:0.5 | G5:0.5 B5:0.25 B5:0.25 D6:0.5 B5:0.5 | C6:1.5
      G5:0.5 | C6:0.5 C6:0.25 C6:0.25 E6:0.5 G5:0.5 | C6:1.5 G5:0.5
      C6:0.5 C6:0.25 C6:0.25 B5:0.5 A5:0.5 | G5:1.5 G5:0.5 | C6:0.5 C6:0.25 C6:0.25 C6:0.5 C6:0.5
      A5:0.5 A5:0.25 A5:0.25 A5:0.5 A5:0.5 | G5:0.5 B5:0.25 B5:0.25 D6:0.5 B5:0.5 | C6:1.5
    `,
  }),
]
