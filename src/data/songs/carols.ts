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

  defineSong({
    id: 'good-king-wenceslas',
    title: 'Good King Wenceslas',
    subtitle: 'Piae Cantiones, 1582, words J. M. Neale, 1853 — G major',
    tags: ['seasonal', 'easy'],
    key: 'G',
    spec: `
      G5 G5 G5 A5 | G5 G5 D5:2 | E5 D5 E5 F#5 | G5:2 G5:2 | G5 G5 G5 A5 | G5 G5 D5:2
      E5 D5 E5 F#5 | G5:2 G5:2 | D6 C6 B5 A5 | B5 A5 G5:2 | E5 D5 E5 F#5 | G5:2 G5:2
      D5 D5 E5 F#5 | G5 G5 A5 A5 | D6 C6 B5 A5 | G5:2 C6:2 | G5:4
    `,
  }),

  defineSong({
    id: 'we-three-kings',
    title: 'We Three Kings',
    subtitle: 'John Henry Hopkins Jr., 1857 — E minor',
    tags: ['seasonal', 'medium'],
    key: 'E',
    spec: `
      B5 A5:0.5 G5 E5:0.5 | F#5:0.5 G5:0.5 F#5:0.5 E5:1.5 | B5 A5:0.5 G5 E5:0.5
      F#5:0.5 G5:0.5 F#5:0.5 E5:1.5 | G5 G5:0.5 A5 A5:0.5 | B5 B5:0.5 D6:0.5 C6:0.5 B5:0.5
      A5:0.5 B5:0.5 A5:0.5 G5 F#5:0.5 | E5:1.5 F#5 A5:0.5 | G5 G5:0.5 G5 D5:0.5 | G5 E5:0.5 G5:1.5
      G5 G5:0.5 G5 D5:0.5 | G5 E5:0.5 G5:1.5 | G5 G5:0.5 A5 B5:0.5 | C6 B5:0.5 A5 B5:0.5
      G5 G5:0.5 G5 D5:0.5 | G5 E5:0.5 G5:1.5
    `,
  }),

  // One pass through: the source repeats the whole carol, which is the cue to sing another verse
  // rather than anything the tune does.
  defineSong({
    id: 'gloucestershire-wassail',
    title: 'Gloucestershire Wassail',
    subtitle: 'Traditional Gloucestershire wassail — E minor',
    tags: ['seasonal', 'hard'],
    key: 'E',
    spec: `
      E5:0.5 | E5 B5:0.5 B5 A5:0.5 | G5 G5:0.5 G5 F#5:0.5 | E5 F#5:0.5 G5 A5:0.5
      B5:1.5 B5 E5:0.5 | E5 B5:0.5 B5 A5:0.5 | G5 G5:0.5 G5 F#5:0.5 | E5 F#5:0.5 G5 A5:0.5
      B5:1.5 | B5:0.5 C6:0.5 D6:0.5 E6:0.5 | D6 B5:0.5 A5:0.5 | G5:0.5 A5:0.5 G5:0.5 E5:0.5
      D5 G5:0.5 A5:0.5 | B5:1.5 C6 D6:0.5 | E5:1.5 G5 G5:0.5 | G5:0.5 B5 A5:0.5 F#5 | E5:1.5 E5
    `,
  }),

  // Verse repeat trimmed, same as the wassail above.
  defineSong({
    id: 'good-christian-men-rejoice',
    title: 'Good Christian Men, Rejoice',
    subtitle: 'In Dulci Jubilo, 14th century German carol — G major',
    tags: ['seasonal', 'medium'],
    key: 'G',
    spec: `
      G5:0.5 | G5 G5:0.5 B5 C6:0.5 | D6 E6:0.5 D6 D6:0.5 | G5 G5:0.5 B5 C6:0.5 | D6 E6:0.5 D6:1.5
      D6 E6:0.5 D6 C6:0.5 | B5 A5:0.5 G5:1.5 | G5:1.5 G5:1.5 | A5 A5:0.5 B5 A5:0.5
      G5 A5:0.5 B5:1.5 | D6 E6:0.5 D6 C6:0.5 | B5 A5:0.5 G5 G5:0.5 | A5 A5:0.5 B5 A5:0.5
      G5 A5:0.5 B5:1.5 | E5 E5:0.5 F#5 F#5:0.5 | G5:1.5 D6:1.5 | B5 B5:0.5 A5 A5:0.5 | G5:1.5 G5
    `,
  }),
]
