import { createTheme, type MantineColorsTuple } from '@mantine/core'

/** Ten lightness values in percent, one per tuple index. */
type Ladder = readonly [
  number, number, number, number, number,
  number, number, number, number, number,
]

/**
 * Median lightness of the twelve chromatic tuples in Mantine's `DEFAULT_THEME`, so shades
 * land where its own components expect them.
 */
const CHROMATIC: Ladder = [95, 90, 83, 73, 64, 58, 53, 49, 46, 39]

/**
 * Mantine's `dark` tuple, which runs the other way round: 0 is text and 9 is the page.
 * The bottom two are stretched past its 12% and 8%, which leave a card and the page it
 * sits on 1.11:1 apart. At 16% and 8% they read 1.27:1.
 */
const NEUTRAL: Ladder = [86, 75, 64, 54, 39, 31, 25, 20, 16, 8]

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
 * Warm near-neutral in place of Mantine's cool greys. The indices carry fixed meanings:
 * 0 body text, 2 dimmed text, 3 placeholder, 4 every border and divider, 6 input
 * backgrounds, 7-9 successive surface layers.
 *
 * Saturation stops at 16% so slot 4 does not tint every border orange, which still leaves
 * the midtones reading brown. Body text measures 13.35:1 on the page and dimmed text
 * 5.91:1 on a card, where a border is 2.54:1.
 */
const dark = ramp(32, 16, NEUTRAL)

export const theme = createTheme({
  colors: { accent, signal, alarm, dark },
  primaryColor: 'accent',
  primaryShade: { light: 6, dark: 4 },

  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',

  headings: {
    fontWeight: '700',
  },

  defaultRadius: 'lg',
  cursorType: 'pointer',
})
