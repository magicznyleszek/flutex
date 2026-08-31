/**
 * Printed English dance music — Playford, Thompson — and two morris tunes out of the same tradition.
 *
 * A new entry belongs inside the shared note set `index.ts` describes, and this file's order is the
 * order the song list shows.
 */
import { defineSong, type Song } from '../songUtils'

export const ENGLISH_DANCE: readonly Song[] = [
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
]
