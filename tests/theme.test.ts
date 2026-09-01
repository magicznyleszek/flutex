import type { MantineTheme } from '@mantine/core'

import { contrastRatio, type Hsl } from '../src/lib/color'
import { cssVariablesResolver, theme } from '../src/theme'

/** The resolver reads nothing off the theme — the hues it works from are `theme.ts`'s own constants. */
const variables = cssVariablesResolver({} as MantineTheme)

/** `hsl(20, 80%, 35%)` back into numbers. Every colour the theme writes is in that one form. */
function parse(value: string | undefined): Hsl {
  const match = /^hsl\((\d+), (\d+)%, (\d+)%\)$/.exec(value ?? '')
  if (match === null) throw new Error(`Not an hsl() the theme would have written: ${value ?? 'nothing'}`)

  return {
    hue: Number(match[1]),
    saturation: Number(match[2]),
    lightness: Number(match[3]),
  }
}

const TINTED = ['accent', 'signal', 'alarm', 'dark'] as const

/** What a dark-scheme tint sits on. `--mantine-color-body` points at dark-8 there. */
const CARD = parse(theme.colors?.dark?.[8])

describe('cssVariablesResolver', () => {
  // The bug this replaced: these eight values were written out by hand in global.css, and three of the
  // four hues had since moved in theme.ts. A signal changed to orange stayed olive in the dark scheme.
  it.each(TINTED)('draws the %s tint from the same hue as its ramp', (name) => {
    const ramp = parse(theme.colors?.[name]?.[4])
    const tint = parse(variables.dark[`--mantine-color-${name}-light`])
    const hover = parse(variables.dark[`--mantine-color-${name}-light-hover`])

    expect(tint.hue).toBe(ramp.hue)
    expect(tint.saturation).toBe(ramp.saturation)
    expect(hover.hue).toBe(ramp.hue)
    expect(hover.saturation).toBe(ramp.saturation)
  })

  // Mantine's own answer here is `darken(shade 9, 0.5)`, which for these ramps lands between 1.04:1
  // and 1.52:1 — a surface indistinguishable from the card behind it.
  it.each(TINTED)('lifts the %s tint clear of the card, and its hover clear of that', (name) => {
    const tint = parse(variables.dark[`--mantine-color-${name}-light`])
    const hover = parse(variables.dark[`--mantine-color-${name}-light-hover`])

    expect(contrastRatio(tint, CARD)).toBeGreaterThanOrEqual(2.2)
    // Only just, which is the point: a tint any lighter starts competing with the text on it.
    expect(contrastRatio({ ...tint, lightness: tint.lightness - 1 }, CARD)).toBeLessThan(2.2)
    expect(hover.lightness).toBeGreaterThan(tint.lightness)
  })

  it('takes the accent hover past the end of the ramp', () => {
    const accent = parse(theme.colors?.accent?.[9])
    const hover = parse(variables.light['--mantine-color-accent-filled-hover'])

    expect(hover.hue).toBe(accent.hue)
    expect(hover.lightness).toBeLessThan(accent.lightness)
  })
})

describe('theme', () => {
  // `black` and `white` are the light scheme's text and card, and both used to restate the warm hue
  // by hand. Read off the ramps they are meant to match instead.
  it('keeps black and white in the same warm family as the neutrals', () => {
    const warm = parse(theme.colors?.gray?.[4])

    for (const value of [theme.black, theme.white]) {
      const colour = parse(value)
      expect(colour.hue).toBe(warm.hue)
      expect(colour.saturation).toBe(warm.saturation)
    }
  })
})
