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
]
