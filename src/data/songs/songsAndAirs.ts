/**
 * Longer melodies, held notes, more of a tune to shape. "Concerning Hobbits" is one of the two songs
 * the range tests exempt by name, for the reason `index.ts` gives.
 */
import { defineSong, type Song } from '../songUtils'

export const SONGS_AND_AIRS: readonly Song[] = [
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

  defineSong({
    id: 'blaenwern',
    title: 'Blaenwern',
    subtitle: 'William Penfro Rowlands, Welsh hymn tune, 1905 — G major',
    tags: ['classical', 'medium'],
    key: 'G',
    spec: `
      D5:2 D5 | E5:2 E5 | D5 G5 B5 | B5:2 A5 | G5:2 F#5 | E5:2 D5 | D5 F#5 E5 | D5:3 | D5:2 D5
      E5:2 E5 | D5 G5 B5 | B5:2 A5 | G5:2 A5 | B5 C6 A5 | G5:2 F#5 | G5:3 | B5:2 B5 | B5 G5 B5
      C6 B5 A5 | B5:2 B5 | D6:2 D6 | D6 B5 D6 | E6 D6 C#6 | D6:3 | E6:2 C6 | D6:2 B5 | D6 C6 B5
      B5:2 A5 | G5:2 A5 | B5 C6 A5 | G5:2 F#5 | G5:3
    `,
  }),

  defineSong({
    id: 'kafoozalum',
    title: 'Kafoozalum',
    subtitle: 'Victorian music-hall song — G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      B5:0.5 C6:0.5 | D6 D6:0.5 C6:0.5 B5:0.5 C6:0.5 D6
      A5:0.5 B5:0.5 C6:0.5 B5:0.5 A5:0.5 B5:0.5 C6 | D6 D6:0.5 C6:0.5 B5:0.5 C6:0.5 D6
      G5:0.5 A5:0.5 B5:0.5 G5:0.5 A5 | B5:0.5 C6:0.5 | D6 D6:0.5 C6:0.5 B5:0.5 C6:0.5 D6
      A5:0.5 B5:0.5 C6:0.5 B5:0.5 A5:0.5 B5:0.5 C6 | D6 D6:0.5 C6:0.5 B5:0.5 C6:0.5 D6
      G5:0.5 A5:0.5 B5:0.5 G5:0.5 A5 | G5:0.5 A5:0.5
      B5:0.5 G5:0.5 D5:0.5 G5:0.5 B5:0.5 G5:0.5 B5 | C6:0.5 A5:0.5 F#5:0.5 A5:0.5 C6:0.5 A5:0.5 C6
      B5:0.5 G5:0.5 D5:0.5 G5:0.5 B5:0.5 G5:0.5 B5 | G5:0.5 A5:0.5 B5:0.5 G5:0.5 A5
      G5:0.5 A5:0.5 | B5:0.5 G5:0.5 D5:0.5 G5:0.5 B5:0.5 G5:0.5 B5
      C6:0.5 A5:0.5 F#5:0.5 A5:0.5 C6:0.5 A5:0.5 C6 | B5:0.5 G5:0.5 D5:0.5 G5:0.5 B5:0.5 G5:0.5 B5
      G5:0.5 A5:0.5 B5:0.5 G5:0.5 A5 G5
    `,
  }),

  defineSong({
    id: 'drunken-sailor',
    title: 'Drunken Sailor',
    subtitle: 'Traditional sea shanty — G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      G5:0.5 E5:0.5 | D5 D5:0.5 E5:0.5 D5 D5:0.5 E5:0.5 | D5 G5 G5 F#5
      E5 E5:0.5 F#5:0.5 E5 E5:0.5 F#5:0.5 | E5 A5 A5:0.5 G5:0.5 F#5:0.5 E5:0.5
      D5 D5:0.5 E5:0.5 D5 D5:0.5 E5:0.5 | D5 G5 G5 F#5 | E5 A5 E5 F#5 | G5:3 | G5:0.5 E5:0.5
      D5 D5:0.5 E5:0.5 D5 D5:0.5 E5:0.5 | D5 G5 G5 F#5 | E5 E5:0.5 F#5:0.5 E5 E5:0.5 F#5:0.5
      E5 A5 A5:0.5 G5:0.5 F#5:0.5 E5:0.5 | D5 D5:0.5 E5:0.5 D5 D5:0.5 E5:0.5 | D5 G5 G5 F#5
      E5 A5 E5 F#5 | G5:3 | G5:0.5 A5:0.5 | B5:2 B5:2 | A5 E5 E5:2
      E5 E5:0.5 F#5:0.5 E5 E5:0.5 F#5:0.5 | G5 D5 D5:2 | B5:2 B5:2 | A5 E5 E5:2 | E5 A5 E5 F#5
      G5:3 | G5:0.5 A5:0.5 | B5:2 B5:2 | A5 E5 E5:2 | E5 E5:0.5 F#5:0.5 E5 E5:0.5 F#5:0.5
      G5 D5 D5:2 | B5:2 B5:2 | A5 E5 E5:2 | E5 A5 E5 F#5 | G5:3
    `,
  }),

  defineSong({
    id: 'blaydon-races',
    title: 'Blaydon Races',
    subtitle: 'George Ridley, Tyneside, 1862 — G major',
    tags: ['folk', 'medium'],
    key: 'G',
    spec: `
      D5:0.5 | G5 G5:0.5 G5 G5:0.5 | G5 G5:0.5 G5 G5:0.5 | A5 A5:0.5 A5 A5:0.5 | B5:1.5 G5:1.5
      C6:0.5 C6:0.5 C6:0.5 C6 C6:0.5 | B5 B5:0.5 B5 B5:0.5 | A5 B5:0.5 A5 G5:0.5 | F#5:1.5 D5:1.5
      G5 G5:0.5 G5 G5:0.5 | G5 G5:0.5 G5 G5:0.5 | A5 A5:0.5 A5 A5:0.5 | B5:1.5 G5:1.5
      C6:0.5 C6:0.5 C6:0.5 C6 C6:0.5 | B5 C6:0.5 D6 D6:0.5 | D6 C6:0.5 B5 A5:0.5
      G5 A5:0.5 B5 C6:0.5 | D6:1.5 D6 B5:0.5 | G5:1.5 G5 G5:0.5 | A5 A5:0.5 A5 A5:0.5
      B5:1.5 G5:1.5 | C6 C6:0.5 C6 C6:0.5 | B5 B5:0.5 B5 B5:0.5 | A5 B5:0.5 A5 G5:0.5
      F#5:1.5 D5:1.5 | G5 G5:0.5 G5 G5:0.5 | G5:1.5 G5 G5:0.5 | A5 A5:0.5 A5 A5:0.5
      B5:1.5 G5:1.5 | C6 C6:0.5 C6 C6:0.5 | B5 C6:0.5 D6 D6:0.5 | D6 C6:0.5 B5 A5:0.5 | G5:1.5 G5
    `,
  }),

  defineSong({
    id: 'my-old-man',
    title: 'My Old Man',
    subtitle: 'Traditional song — D major',
    tags: ['folk', 'medium'],
    key: 'D',
    spec: `
      D5:0.5 E5:0.5 | F#5 F#5 F#5:1.5 F#5:0.5 | F#5 F#5:2 F#5 | F#5 F#5 G5 F#5 | E5:3 E5
      E5 E5 E5:1.5 E5:0.5 | E5 E5:2 E5:0.5 E5:0.5 | A5 G5 F#5 E5 | D5:2 A5:2
      F#5 F#5 F#5:1.5 F#5:0.5 | F#5 F#5:2 F#5:0.5 E5:0.5 | D5 D5 E5 F#5 | G5:3 G5
      A5 A5 A5 A5:0.5 A5:0.5 | A5 A5 A5 A5:0.5 A5:0.5 | A5 G5 F#5 E5 | D5:3
    `,
  }),

  // Transcribed from a recording rather than chosen to fit, so it is the one song that outgrows an
  // instrument: the ocarinas play its F#6 and A6 as the nearest notes they have. The lengths are by
  // ear too, in 4/4 — enough for **Hear it** to lilt rather than plod, and rhythm is never enforced.
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
      D5 E5 F#5:1.5 A5:0.5 | F#5 E5 D5:2
      F#5 A5 B5:1.5 D6:0.5 | C#6 A5 F#5 E5
      D5 E5 F#5:1.5 A5:0.5 | F#5 E5 D5:2
      F#5 A5 B5:1.5 A5:0.5 | F#5 E5 D5:2
      D6:0.5 E6:0.5 F#6 F#6 F#6 | A6:1.5 E6:0.5 D6 E6
      A5 B5:0.5 C#6:0.5 C#6 D6 | A5 F#5 A5 E5
      D6:0.5 E6:0.5 F#6 F#6 A6 | F#6 E6 E6:2
      F#6:1.5 E6:0.5 D6 D6 | D6 F#6:3
      D6 E6 F#6 E6 | D6 E6:3
      D5 E5 F#5:2
      F#5 B5 C#6:1.5 D6:0.5 | C#6 A5 F#5 E5
      D5 E5 F#5:1.5 B5:0.5 | C#6 D6 C#6:0.5 B5:0.5 A5 | E5 D5:3
    `,
  }),
]
