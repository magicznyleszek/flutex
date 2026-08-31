/**
 * Polkas, jigs, a march and a slip jig. "A Blast Of Wind" is the other song the range tests exempt by
 * name, for the reason `index.ts` gives.
 *
 * A new entry belongs inside the shared note set `index.ts` describes, and this file's order is the
 * order the song list shows.
 */
import { defineSong, type Song } from '../songUtils'

export const IRISH_SCOTTISH: readonly Song[] = [
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
]
