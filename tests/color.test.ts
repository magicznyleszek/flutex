import { contrastRatio, hsl, lightnessForContrast, type Hsl, type Tint } from '../src/lib/color'

const BLACK: Hsl = { hue: 0, saturation: 0, lightness: 0 }
const WHITE: Hsl = { hue: 0, saturation: 0, lightness: 100 }

/** The dark scheme's card, which is what every tint below is measured against. */
const CARD: Hsl = { hue: 20, saturation: 16, lightness: 16 }

const GREEN: Tint = { hue: 140, saturation: 60 }
const ORANGE: Tint = { hue: 20, saturation: 80 }

describe('hsl', () => {
  // Mantine's `toRgba` reads only this form and answers black for `hsl(20 80% 50%)`, taking every
  // variable it derives from the tuple down with it.
  it('writes the legacy comma form Mantine can parse', () => {
    expect(hsl({ hue: 20, saturation: 80, lightness: 50 })).toBe('hsl(20, 80%, 50%)')
  })
})

describe('contrastRatio', () => {
  it('spans 1 to 21', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 2)
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 2)
    expect(contrastRatio(CARD, CARD)).toBeCloseTo(1, 6)
  })

  // Two independently published figures, which pin the channel weights and the gamma step: without
  // them a plausible-looking conversion still lands a few tenths out, and a few tenths is the whole
  // margin these tints are chosen by.
  it('agrees with the published ratios', () => {
    expect(contrastRatio({ hue: 0, saturation: 100, lightness: 50 }, WHITE)).toBeCloseTo(4, 1)
    expect(contrastRatio({ hue: 0, saturation: 0, lightness: 50 }, WHITE)).toBeCloseTo(3.98, 1)
  })
})

describe('lightnessForContrast', () => {
  it('finds the darkest lightness that clears the ratio', () => {
    const lightness = lightnessForContrast(ORANGE, CARD, 2.2)

    expect(contrastRatio({ ...ORANGE, lightness }, CARD)).toBeGreaterThanOrEqual(2.2)
    expect(contrastRatio({ ...ORANGE, lightness: lightness - 1 }, CARD)).toBeLessThan(2.2)
  })

  // The reason this is computed at all. Both want to sit the same distance off the same card, and the
  // answer differs by nine percent of lightness — so a number tuned for one hue is wrong for the next
  // one, which is how an orange signal ended up invisible in the dark scheme.
  it('answers differently for two hues wanting the same contrast', () => {
    expect(lightnessForContrast(GREEN, CARD, 2.2)).toBe(26)
    expect(lightnessForContrast(ORANGE, CARD, 2.2)).toBe(35)
  })

  // 21:1 is black against white, so nothing reaches 25 against anything.
  it('gives up at white rather than looping', () => {
    expect(lightnessForContrast(ORANGE, CARD, 25)).toBe(100)
  })
})
