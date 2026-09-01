/** The seasonal ones — the one section gathered by when you would play it, not by difficulty. */
import { defineSong, type Song } from '../songUtils'

export const CAROLS: readonly Song[] = [
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
]
