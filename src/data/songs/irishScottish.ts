/**
 * Polkas, jigs, reels, a march, song airs, two slip jigs and a waltz. "A Blast Of Wind" is the other
 * song the range tests exempt by name, for the reason `index.ts` gives.
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

  defineSong({
    id: 'bonnie-kate',
    title: 'Bonnie Kate',
    subtitle: 'Traditional Scots reel — D major',
    tags: ['dance', 'hard'],
    key: 'D',
    spec: `
      C#6 | D6:1.5 E6:0.5 D6 C#6 | D6 A5:2 B5 | A5 G5 F#5 E5 | F#5 D5:2 E5
      F#5 D5:2 E5:0.5 F#5:0.5 | G5 E5:2 F#5:0.5 G5:0.5 | F#5 A5 G5 F#5 | E5 A5 B5 C#6 | C#6
      D6:1.5 E6:0.5 D6 C#6 | D6 A5:2 B5 | A5 G5 F#5 E5 | F#5 D5:2 E5 | F#5 D5:2 E5:0.5 F#5:0.5
      G5 E5:2 F#5:0.5 G5:0.5 | F#5 A5 G5 F#5 | E5:2 E5:2 | F#5 D5:2 E5:0.5 F#5:0.5 | G5 E5 A5 F#5
      B5 G5:2 A5:0.5 B5:0.5 | C#6 A5 B5:0.5 C#6:0.5 | D6:1.5 E6:0.5 D6 B5 | A5 C#6 D6 F#5
      G5 B5 A5:0.5 B5:0.5 A5:0.5 G5:0.5 | F#5 D5 D5:2 | C#6 | D6:1.5 E6:0.5 D6 C#6 | D6 A5:2 B5
      A5 G5 F#5 E5 | F#5 D5:2 E5 | F#5 D5:2 E5:0.5 F#5:0.5 | G5 E5:2 F#5:0.5 G5:0.5
      F#5 A5 G5 F#5
    `,
  }),

  defineSong({
    id: 'kelvingrove',
    title: 'Kelvingrove',
    subtitle: 'Scots song air — G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      G5:0.5 A5:0.5 | B5:2 D6 | A5:2 B5 | G5:2 F#5 | E5:2 D5 | E5:3 | A5:2 B5 | A5:3 | A5 G5 A5
      B5:2 D6 | A5:2 B5 | G5:2 F#5 | E5:2 D5 | E5:3 | G5:2 A5 | G5:3 | G5 A5 B5 | C6:2 B5
      C6:2 D6 | E6:3 | E6 B5 C6 | D6:2 B5 | A5:2 G5 | A5:3 | A5 G5 A5 | B5:2 D6 | A5:2 B5
      G5:2 F#5 | E5:2 D5 | E5:3 | G5:2 A5 | G5:3 | G5:2
    `,
  }),

  defineSong({
    id: 'ho-ro-my-nut-brown-maiden',
    title: 'Ho Ro My Nut Brown Maiden',
    subtitle: 'Scottish Gaelic song air — G major',
    tags: ['folk', 'hard'],
    key: 'G',
    spec: `
      D5 | G5:1.5 F#5:0.5 E5 D5 | G5:2 D5 D5 | G5:1.5 A5:0.5 C6 B5 | A5:3 C6
      B5:0.5 D6:1.5 B5:0.5 D6:1.5 | D5:2 G5 A5 | B5:1.5 B5:0.5 C6 A5 | G5:3 | D5
      G5:1.5 F#5:0.5 E5 D5 | G5:2 D5 D5 | G5:1.5 A5:0.5 C6 B5 | A5:3 C6
      B5:0.5 D6:1.5 B5:0.5 D6:1.5 | D5:2 G5 A5 | B5:1.5 B5:0.5 C6 A5 | G5:3 | B5:0.5 C6:0.5
      D6 E6 D6 B5 | D6:2 B5 C6 | D6 E6 D6 B5 | A5:2 A5 C6 | B5:0.5 D6:1.5 B5:0.5 D6:1.5
      D5:2 G5 A5 | B5:1.5 B5:0.5 C6 A5 | G5:3 | B5:0.5 C6:0.5 | D6 E6 D6 B5 | D6:2 B5 C6
      D6 E6 D6 B5 | A5:2 A5 C6 | B5:0.5 D6:1.5 B5:0.5 D6:1.5 | D5:2 G5 A5 | B5:1.5 B5:0.5 C6 A5
      G5:3
    `,
  }),

  defineSong({
    id: 'drops-of-brandy',
    title: 'Drops of Brandy',
    subtitle: 'Traditional slip jig — D major',
    tags: ['dance', 'hard'],
    key: 'D',
    spec: `
      F#5:0.25 G5:0.25 | A5 G5:0.5 F#5:0.5 D5:0.5 F#5:0.5 F#5:0.5 D5:0.5 F#5:0.5
      A5 G5:0.5 F#5:0.5 D5:0.5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      A5 G5:0.5 F#5:0.5 D5:0.5 F#5:0.5 F#5:0.5 D5:0.5 F#5:0.5
      G5:0.5 F#5:0.5 G5:0.5 E5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      A5 G5:0.5 F#5:0.5 D5:0.5 F#5:0.5 F#5:0.5 D5:0.5 F#5:0.5
      A5 G5:0.5 F#5:0.5 D5:0.5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      A5 G5:0.5 F#5:0.5 D5:0.5 F#5:0.5 F#5:0.5 D5:0.5 F#5:0.5
      G5:0.5 F#5:0.5 G5:0.5 E5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      D5:0.5 F#5:0.5 A5:0.5 D6:0.5 A5:0.5 F#5:0.5 D6:0.5 A5:0.5 F#5:0.5
      D5:0.5 F#5:0.5 A5:0.5 D6:0.5 A5:0.5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      D5:0.5 F#5:0.5 A5:0.5 D6:0.5 A5:0.5 F#5:0.5 D6:0.5 A5:0.5 F#5:0.5
      G5:0.5 F#5:0.5 G5:0.5 E5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      D5:0.5 F#5:0.5 A5:0.5 D6:0.5 A5:0.5 F#5:0.5 D6:0.5 A5:0.5 F#5:0.5
      D5:0.5 F#5:0.5 A5:0.5 D6:0.5 A5:0.5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
      D5:0.5 F#5:0.5 A5:0.5 D6:0.5 A5:0.5 F#5:0.5 D6:0.5 A5:0.5 F#5:0.5
      G5:0.5 F#5:0.5 G5:0.5 E5 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5
    `,
  }),

  // Long, but every leap is slow and the whole tune is quarters and halves — easier than its length.
  defineSong({
    id: 'roddy-mccawley',
    title: 'Roddy McCawley',
    subtitle: 'Roddy McCorley, Irish ballad — G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      G5 A5 | B5:2 A5 B5 | D5:2 G5 A5 | B5:1.5 C6:0.5 B5 A5 | G5:2 D5:2 | E5:2 G5:2 | G5:2 A5:2
      G5:4 | B5:2 B5 C6 | D6:2 D6:2 | D6:2 B5 D6 | E6:2 E6:2 | D6:2 B5 A5 | G5:2 E5:2 | C6:2 B5:2
      A5:4 | A5:2 B5 C6 | D6:2 D6:2 | D6:2 B5 D6 | E6:2 E6:2 | D6:2 B5 A5 | G5:2 E5:2 | C6:2 B5:2
      A5:4 | A5:2 G5 A5 | B5:2 A5 B5 | D5:2 G5 A5 | B5:1.5 C6:0.5 B5 A5 | G5:2 D5:2 | E5:2 G5:2
      G5:2 A5:2 | G5:4 | G5:4
    `,
  }),

  defineSong({
    id: 'aiken-drum',
    title: 'Aiken Drum',
    subtitle: 'Scots nursery song — G major',
    tags: ['folk', 'hard'],
    key: 'G',
    spec: `
      G5:0.5 A5:0.5 | B5 B5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 | E5:2 G5:1.5 E5:0.5 | D5:1.5 E5:0.5 G5 D5
      B5 A5 A5 G5:0.5 A5:0.5 | B5 B5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 | E5:2 G5:1.5 E5:0.5
      D5 D5 E5 F#5 | G5:3 | G5:0.5 A5:0.5 | B5 B5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 | E5:2 G5:1.5 E5:0.5
      D5:1.5 E5:0.5 G5 D5 | B5 A5 A5 G5:0.5 A5:0.5 | B5 B5 C6:0.5 B5:0.5 A5:0.5 G5:0.5
      E5:2 G5:1.5 E5:0.5 | D5 D5 E5 F#5 | G5:3 | G5:0.5 A5:0.5 | B5 B5 B5 A5:0.5 G5:0.5
      C6 C6 E6:1.5 C6:0.5 | B5 D6 B5 G5 | B5 A5 A5 G5:0.5 A5:0.5
      B5 B5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 | E5:2 G5:1.5 E5:0.5 | D5 D5 E5 F#5 | G5:3 | G5:0.5 A5:0.5
      B5 B5 B5 A5:0.5 G5:0.5 | C6 C6 E6:1.5 C6:0.5 | B5 D6 B5 G5 | B5 A5 A5 G5:0.5 A5:0.5
      B5 B5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 | E5:2 G5:1.5 E5:0.5 | D5 D5 E5 F#5 | G5:3
    `,
  }),

  defineSong({
    id: 'rattling-bog',
    title: 'Rattling Bog',
    subtitle: 'Irish cumulative song — G major',
    tags: ['folk', 'hard'],
    key: 'G',
    spec: `
      G5:0.5 A5:0.5 | B5:2 B5:1.5 A5:0.5 | G5 E5 E5:1.5 E5:0.5
      D5 G5 G5:0.5 F#5:0.5 G5:0.5 A5:0.5 | B5 A5 A5:2 | B5:2 B5:1.5 A5:0.5 | G5 E5 E5:1.5 E5:0.5
      D5 D6 D6 B5 | A5 G5 G5 | G5:0.5 A5:0.5 | B5:2 B5:1.5 A5:0.5 | G5 E5 E5:1.5 E5:0.5
      D5 G5 G5:0.5 F#5:0.5 G5:0.5 A5:0.5 | B5 A5 A5:2 | B5:2 B5:1.5 A5:0.5 | G5 E5 E5:1.5 E5:0.5
      D5 D6 D6 B5 | A5 G5 G5 | G5:0.5 A5:0.5 | B5 G5 A5 G5 | B5 G5 A5 G5:0.5 A5:0.5 | B5 D6 D6 B5
      A5 G5 A5 G5:0.5 A5:0.5 | B5 G5 A5 G5 | B5 G5 A5 G5:0.5 A5:0.5 | B5 D6 D6 B5 | A5 G5 G5
      G5:0.5 A5:0.5 | B5 G5 A5 G5 | B5 G5 A5 G5:0.5 A5:0.5 | B5 D6 D6 B5 | A5 G5 A5 G5:0.5 A5:0.5
      B5 G5 A5 G5 | B5 G5 A5 G5:0.5 A5:0.5 | B5 D6 D6 B5 | A5 G5 G5
    `,
  }),

  // The shortest tune outside the exercises: thirty-one notes, none of them quick.
  defineSong({
    id: 'i-went-to-pick-some-blaeberries',
    title: 'I Went to Pick Some Blaeberries',
    subtitle: 'Traditional waltz — G major',
    tags: ['folk', 'easy'],
    key: 'G',
    spec: `
      D5 | G5:2 G5 | B5:2 B5 | D6:2 D6 | B5:3 | D6:2 D6 | B5:3 | D6:1.5 C6:0.5 B5 | A5:2 D5
      G5:2 G5 | B5:2 B5 | D6:2 D6 | B5:2 D5 | G5:2 G5 | A5:2 B5 | A5:2 A5 | G5:2
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
