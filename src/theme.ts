import {
  createTheme,
  defaultVariantColorsResolver,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core'

import { hsl, lightnessForContrast, type Hsl, type Tint } from './lib/color'

/** Ten lightness values in percent, one per tuple index. */
type Ladder = readonly [
  number, number, number, number, number,
  number, number, number, number, number,
]

/**
 * The median lightness of Mantine's twelve chromatic tuples, so shades land where its components expect
 * them — bar the tail, which is darker. Shade 9 is the text on a `variant="light"` surface, where green
 * and yellow reach only 3.3:1 at Mantine's 39%; at 29% they read 5.6 and 5.5.
 */
const CHROMATIC: Ladder = [95, 91, 83, 73, 64, 58, 53, 47, 38, 29]

/**
 * Mantine's `dark` tuple, which runs the other way round: 0 is text, 9 the page. The bottom two are
 * stretched past its 12% and 8%, which leave a card and its page 1.11:1 apart; these read 1.27.
 */
const NEUTRAL: Ladder = [86, 75, 64, 54, 39, 31, 25, 20, 16, 8]

/**
 * The light scheme's neutral, 0 lightest. Mantine reads fixed meanings off these indices: 0 hover
 * surfaces, 1 light tints, 2 disabled fills and the page, 3 Paper and Divider borders, 4 input borders,
 * 5 placeholder, 6 dimmed text, 7-9 dark text and fills. The 72 → 44 jump is the seam between surfaces
 * and type, which nothing reads a gradient across.
 */
const GRAY: Ladder = [98, 96, 92, 80, 72, 44, 37, 27, 21, 13]

// Every colour in the app comes from one of these four hues, so changing one changes both schemes.

/** Green for progress bars, action buttons and a correct note. */
const ACCENT: Tint = { hue: 140, saturation: 60 }

/** Orange for the target note and the tuner needle. */
const SIGNAL: Tint = { hue: 20, saturation: 80 }

/** Mistakes and penalties. A warm red, close enough to the browns to belong with them. */
const ALARM: Tint = { hue: 8, saturation: 65 }

/**
 * Warm near-neutral in place of Mantine's cool greys, in both schemes. Mantine reads dimmed text,
 * placeholders and every border off `gray`, so a cool ramp there outlines the whole interface in blue.
 * Saturation stops at 16% to keep the border shades from tinting every edge orange.
 */
const WARM: Tint = { hue: 20, saturation: 16 }

/** One hue and one saturation for the whole tuple, with lightness doing the work. */
function ramp(tint: Tint, ladder: Ladder): MantineColorsTuple {
  const at = (lightness: number): string => hsl({ ...tint, lightness })

  return [
    at(ladder[0]), at(ladder[1]), at(ladder[2]), at(ladder[3]), at(ladder[4]),
    at(ladder[5]), at(ladder[6]), at(ladder[7]), at(ladder[8]), at(ladder[9]),
  ]
}

const accent = ramp(ACCENT, CHROMATIC)
const signal = ramp(SIGNAL, CHROMATIC)
const alarm = ramp(ALARM, CHROMATIC)

/**
 * Fixed index meanings again, dark scheme: 0 body text, 2 dimmed text, 3 placeholder, 4 every border and
 * divider, 6 input backgrounds, 7-9 successive surface layers. On a card, body text reads 10.55:1,
 * dimmed text 5.91:1, a border 2.54:1.
 */
const dark = ramp(WARM, NEUTRAL)

/** The same family for the light scheme, which is what Mantine's `gray` is read for throughout. */
const gray = ramp(WARM, GRAY)

/** What a dark-scheme tint sits on: `--mantine-color-body` is dark-8 there, pointed at in global.css. */
const DARK_CARD: Hsl = { ...WARM, lightness: NEUTRAL[8] }

/** Enough for a tint to read as a surface of its own without crowding the text on it. */
const TINT_CONTRAST = 2.2

/** A tint's hover state, about as far as two neighbouring shades sit apart at that end of a ramp. */
const HOVER_STEP = 7

/** The pair of variables a `variant="light"` surface is painted from, for one hue. */
function darkTint(name: string, tint: Tint): Record<string, string> {
  const lightness = lightnessForContrast(tint, DARK_CARD, TINT_CONTRAST)

  return {
    [`--mantine-color-${name}-light`]: hsl({ ...tint, lightness }),
    [`--mantine-color-${name}-light-hover`]: hsl({ ...tint, lightness: lightness + HOVER_STEP }),
  }
}

/**
 * The handful of variables Mantine derives badly for this palette, rebuilt from the hues above.
 * MantineProvider merges this over its own resolver, so these land in the same injected block and win
 * without a fight. They lived in global.css before, where each colour was restated and went stale.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},

  light: {
    /**
     * A filled accent button is shade 9 (see global.css), and Mantine hovers a shade-9 fill with shade 8 —
     * a green that reads only 3.5:1 under white ink. Hover is a step past the end of the ramp instead, the
     * one lightness here not in a tuple; 23% reads 7.68:1.
     */
    '--mantine-color-accent-filled-hover': hsl({ ...ACCENT, lightness: 23 }),
  },

  /**
   * A dark-scheme `variant="light"` surface is `darken(shade 9, 0.5)`, which for these ramps reads 1.04:1
   * to 1.52:1 against a card — a tint nobody can see. Each is rebuilt at the lightness that reads
   * `TINT_CONTRAST`, keeping its hue and saturation. Solved rather than tabulated because the answer moves
   * with the hue: the olive the signal used to be needed 26%, the orange it is now needs 35%.
   */
  dark: {
    ...darkTint('accent', ACCENT),
    ...darkTint('signal', SIGNAL),
    ...darkTint('alarm', ALARM),
    ...darkTint('dark', WARM),
  },
})

export const theme = createTheme({
  colors: { accent, signal, alarm, dark, gray },

  /** `--mantine-color-text` in the light scheme, and Tooltip's text in the dark one. */
  black: hsl({ ...WARM, lightness: 8 }),
  /** Cards and inputs in the light scheme. Warm enough to sit on the gray-2 page. */
  white: hsl({ ...WARM, lightness: 99 }),

  primaryColor: 'accent',

  /**
   * Puts the ink on a filled button under the scheme's control. Mantine hardcodes `--mantine-color-white`,
   * which on the dark scheme's shade-4 fill left the Start button at 1.71:1; `--flutex-filled-ink` flips
   * per scheme, 10.37:1 dark and 5.57:1 light.
   *
   * `autoContrast: true` is the documented cure and does not work — Mantine reads `parsed.isLight` off the
   * theme once rather than per scheme, so both schemes get what the light one deserves.
   */
  variantColorResolver: (input) => {
    const resolved = defaultVariantColorsResolver(input)

    return input.variant === 'filled'
      ? { ...resolved, color: 'var(--flutex-filled-ink)' }
      : resolved
  },
  /**
   * Shade 8 in light rather than the usual 6, this being what every ramp fills and outlines from: green at
   * 6 reads 2.4:1 on a white card where a focus ring wants 3:1, and shade 8 reads 3.5:1.
   */
  primaryShade: { light: 8, dark: 4 },

  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',

  headings: {
    fontWeight: '700',
  },

  defaultRadius: 'md',
  cursorType: 'pointer',
})
