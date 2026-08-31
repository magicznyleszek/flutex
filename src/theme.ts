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
 * Starts from the median lightness of the twelve chromatic tuples in Mantine's
 * `DEFAULT_THEME`, so shades land where its own components expect them. The tail is
 * darker than Mantine's: in the light scheme shade 9 is the text on a `variant="light"`
 * surface, and green and yellow at Mantine's 39% only reach 3.3:1 on a white card. At 29%
 * they read 5.6:1 and 5.5:1, and shade 9 lands on the designer's forestgreen.
 */
const CHROMATIC: Ladder = [95, 91, 83, 73, 64, 58, 53, 47, 38, 29]

/**
 * Mantine's `dark` tuple, which runs the other way round: 0 is text and 9 is the page.
 * The bottom two are stretched past its 12% and 8%, which leave a card and the page it
 * sits on 1.11:1 apart. At 16% and 8% they read 1.27:1.
 */
const NEUTRAL: Ladder = [86, 75, 64, 54, 39, 31, 25, 20, 16, 8]

/**
 * The light scheme's neutral, so 0 is the lightest. Mantine reads fixed meanings off
 * these indices too: 0 hover surfaces, 1 light tints, 2 disabled fills and the page,
 * 3 Paper and Divider borders, 4 input borders, 5 placeholder, 6 dimmed text, 7-9 dark
 * text and fills. The 72 → 44 step is the seam between the surfaces and the type;
 * nothing reads a gradient across it.
 */
const GRAY: Ladder = [98, 96, 92, 80, 72, 44, 37, 27, 21, 13]

/**
 * One hue and one saturation for the whole tuple, with lightness doing the work.
 *
 * The commas are not a style choice. Mantine's `toRgba` matches only the legacy
 * `hsl(h, s%, l%)` form and answers black for the space-separated one, and it is what
 * derives every `-light`, `-outline` and hover variable from these strings. A tuple in
 * modern syntax turns all of those black without warning.
 */
function ramp(hue: number, saturation: number, ladder: Ladder): MantineColorsTuple {
  const at = (lightness: number): string => `hsl(${hue}, ${saturation}%, ${lightness}%)`

  return [
    at(ladder[0]), at(ladder[1]), at(ladder[2]), at(ladder[3]), at(ladder[4]),
    at(ladder[5]), at(ladder[6]), at(ladder[7]), at(ladder[8]), at(ladder[9]),
  ]
}

/** Green for progress bars, action buttons and a correct note. */
const accent = ramp(130, 60, CHROMATIC)

/** Pale olive-yellow for the target note and the tuner needle. */
const signal = ramp(60, 45, CHROMATIC)

/**
 * Mistakes and penalties. The palette ships no error colour, so this warm red sits at hue
 * 8, close enough to the browns to belong with them.
 */
const alarm = ramp(8, 65, CHROMATIC)

/**
 * Warm near-neutral in place of Mantine's cool greys, for the dark scheme. The indices
 * carry fixed meanings: 0 body text, 2 dimmed text, 3 placeholder, 4 every border and
 * divider, 6 input backgrounds, 7-9 successive surface layers.
 *
 * Saturation stops at 16% so slot 4 does not tint every border orange, which still leaves
 * the midtones reading brown. Body text measures 10.55:1 on a card and dimmed text
 * 5.91:1, where a border is 2.54:1.
 */
const dark = ramp(32, 16, NEUTRAL)

/**
 * The same warm family as `dark`, laid out for the light scheme. Overriding Mantine's
 * `gray` is what keeps light mode warm: its light-scheme variables read dimmed text off
 * gray-6, placeholders off gray-5 and every border off gray-3 and gray-4, so a cool grey
 * ramp there would outline the whole interface in blue.
 */
const gray = ramp(32, 16, GRAY)

export const theme = createTheme({
  colors: { accent, signal, alarm, dark, gray },

  /** `--mantine-color-text` in the light scheme, and Tooltip's text in the dark one. */
  black: 'hsl(32, 16%, 8%)',
  /** Cards and inputs in the light scheme. Warm enough to sit on the gray-2 page. */
  white: 'hsl(32, 16%, 99%)',

  primaryColor: 'accent',

  /**
   * Puts the ink on a filled button under the colour scheme's control. Mantine writes
   * `--mantine-color-white` there, and the fill is `primaryShade` — shade 8 in the light
   * scheme but shade 4 in the dark one, a light green that left the Start button's white
   * label at 1.71:1. `--flutex-filled-ink` is dark in the dark scheme and white in the light
   * one, which measures 10.37:1 and 5.57:1 on that button — the light figure only because
   * `global.css` also drops the accent's fill to shade 9, white ink on shade 8 being 3.51:1.
   *
   * `autoContrast: true` is the documented cure and does not work here: Mantine reads
   * `parsed.isLight` off the theme once, not per scheme, so both schemes get whatever the
   * light one deserves. Everything but the fill colour still comes from Mantine's resolver.
   */
  variantColorResolver: (input) => {
    const resolved = defaultVariantColorsResolver(input)

    return input.variant === 'filled'
      ? { ...resolved, color: 'var(--flutex-filled-ink)' }
      : resolved
  },
  /**
   * Shade 8 in light rather than the usual 6, because this is the shade every ramp fills and
   * outlines from, and green at shade 6 reads 2.4:1 on a white card where even a focus ring
   * wants 3:1. Shade 8 is 3.5:1, and the accent goes one further to shade 9 in `global.css`,
   * which is what the focus ring follows. Shade 4 does the whole job in the dark scheme at
   * 8.2:1.
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
