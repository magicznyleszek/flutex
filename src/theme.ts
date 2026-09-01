import {
  createTheme,
  defaultVariantColorsResolver,
  type MantineColorsTuple,
} from '@mantine/core'

/** Ten lightness values in percent, one per tuple index. */
type Ladder = readonly [
  number, number, number, number, number,
  number, number, number, number, number,
]

/**
 * The median lightness of Mantine's twelve chromatic tuples, so shades land where its components
 * expect them — bar the tail, which is darker. Shade 9 is the text on a light `variant="light"`
 * surface, where green and yellow reach only 3.3:1 at Mantine's 39%; at 29% they read 5.6 and 5.5.
 */
const CHROMATIC: Ladder = [95, 91, 83, 73, 64, 58, 53, 47, 38, 29]

/**
 * Mantine's `dark` tuple, which runs the other way round: 0 is text, 9 is the page. The bottom two
 * are stretched past its 12% and 8%, which leave a card and its page 1.11:1 apart; these read 1.27.
 */
const NEUTRAL: Ladder = [86, 75, 64, 54, 39, 31, 25, 20, 16, 8]

/**
 * The light scheme's neutral, so 0 is lightest. Mantine reads fixed meanings off these indices: 0
 * hover surfaces, 1 light tints, 2 disabled fills and the page, 3 Paper and Divider borders, 4 input
 * borders, 5 placeholder, 6 dimmed text, 7-9 dark text and fills. The 72 → 44 jump is the seam
 * between surfaces and type, which nothing reads a gradient across.
 */
const GRAY: Ladder = [98, 96, 92, 80, 72, 44, 37, 27, 21, 13]

/**
 * One hue and one saturation for the whole tuple, with lightness doing the work.
 *
 * The commas are not a style choice: Mantine's `toRgba` matches only the legacy `hsl(h, s%, l%)`
 * form, answers black for the space-separated one, and derives every `-light`, `-outline` and hover
 * variable from these strings. Modern syntax turns all of those black without warning.
 */
function ramp(hue: number, saturation: number, ladder: Ladder): MantineColorsTuple {
  const at = (lightness: number): string => `hsl(${hue}, ${saturation}%, ${lightness}%)`

  return [
    at(ladder[0]), at(ladder[1]), at(ladder[2]), at(ladder[3]), at(ladder[4]),
    at(ladder[5]), at(ladder[6]), at(ladder[7]), at(ladder[8]), at(ladder[9]),
  ]
}

/** Green for progress bars, action buttons and a correct note. */
const accent = ramp(140, 60, CHROMATIC)

/** Pale olive-yellow for the target note and the tuner needle. */
const signal = ramp(60, 45, CHROMATIC)

/** Mistakes and penalties. A warm red at hue 8, close enough to the browns to belong with them. */
const alarm = ramp(8, 65, CHROMATIC)

/**
 * Warm near-neutral in place of Mantine's cool greys, for the dark scheme. Fixed index meanings
 * again: 0 body text, 2 dimmed text, 3 placeholder, 4 every border and divider, 6 input backgrounds,
 * 7-9 successive surface layers. Saturation stops at 16% so slot 4 does not tint every border
 * orange. On a card, body text is 10.55:1, dimmed text 5.91:1, a border 2.54:1.
 */
const dark = ramp(20, 16, NEUTRAL)

/**
 * The same warm family as `dark`, for the light scheme. Overriding Mantine's `gray` is what keeps
 * light mode warm: it reads dimmed text, placeholders and every border off gray-3 to gray-6, so a
 * cool ramp there would outline the whole interface in blue.
 */
const gray = ramp(20, 16, GRAY)

export const theme = createTheme({
  colors: { accent, signal, alarm, dark, gray },

  /** `--mantine-color-text` in the light scheme, and Tooltip's text in the dark one. */
  black: 'hsl(20, 16%, 8%)',
  /** Cards and inputs in the light scheme. Warm enough to sit on the gray-2 page. */
  white: 'hsl(20, 16%, 99%)',

  primaryColor: 'accent',

  /**
   * Puts the ink on a filled button under the scheme's control. Mantine hardcodes
   * `--mantine-color-white`, which on the dark scheme's shade-4 fill left the Start button at
   * 1.71:1. `--flutex-filled-ink` flips per scheme: 10.37:1 dark, 5.57:1 light.
   *
   * `autoContrast: true` is the documented cure and does not work — Mantine reads `parsed.isLight`
   * off the theme once rather than per scheme, so both schemes get what the light one deserves.
   */
  variantColorResolver: (input) => {
    const resolved = defaultVariantColorsResolver(input)

    return input.variant === 'filled'
      ? { ...resolved, color: 'var(--flutex-filled-ink)' }
      : resolved
  },
  /**
   * Shade 8 in light rather than the usual 6: this is what every ramp fills and outlines from, and
   * green at 6 reads 2.4:1 on a white card where a focus ring wants 3:1. Shade 8 is 3.5:1.
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
