/**
 * Short, near enough stepwise, and probably already in your head — which is what makes a wrong note
 * here obvious without reading anything.
 */
import { defineSong, type Song } from '../songUtils'

export const FIRST_TUNES: readonly Song[] = [
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
]
