/**
 * The arithmetic behind the palette. `theme.ts` writes each colour down as a hue and a saturation,
 * and this turns one into a CSS string, or works out how light it has to be to stand off what it
 * sits on.
 */

/** A hue in degrees and a saturation in percent, with the lightness left open. */
export interface Tint {
  hue: number
  saturation: number
}

/** A whole colour: lightness in percent, as CSS takes it. */
export interface Hsl extends Tint {
  lightness: number
}

/**
 * The commas are not a style choice. Mantine's `toRgba` matches only the legacy `hsl(h, s%, l%)`
 * form, answers black for the space-separated one, and derives every `-light`, `-outline` and hover
 * variable from these strings. Modern syntax turns all of those black without warning.
 */
export function hsl({ hue, saturation, lightness }: Hsl): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * One channel as a 0-1 fraction, `offset` picking which: 0 red, 8 green, 4 blue. The conversion
 * given in CSS Color 4, which is shorter than the textbook six-way branch and agrees with it.
 */
function channel({ hue, saturation, lightness }: Hsl, offset: number): number {
  const light = lightness / 100
  const reach = (saturation / 100) * Math.min(light, 1 - light)
  const position = (offset + hue / 30) % 12

  return light - reach * Math.max(-1, Math.min(position - 3, 9 - position, 1))
}

/** WCAG relative luminance: gamma-corrected brightness, weighted by what the eye makes of each channel. */
function luminance(colour: Hsl): number {
  const linear = (offset: number): number => {
    const value = channel(colour, offset)
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * linear(0) + 0.7152 * linear(8) + 0.0722 * linear(4)
}

/** WCAG contrast: 1 for a colour against itself, 21 for black against white. */
export function contrastRatio(one: Hsl, other: Hsl): number {
  const first = luminance(one)
  const second = luminance(other)

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

/**
 * The darkest whole-percent lightness at which `tint` reads `ratio` or better against `against`.
 *
 * Which lightness that is depends on the hue: a saturated orange has to go a good deal lighter than a
 * green to stand the same distance off a dark card. That is exactly what goes stale when such a
 * number is written down by hand, so it is worked out instead.
 *
 * Scanning up from black works because contrast against a dark background only rises with lightness.
 * A ratio no lightness reaches comes back as white.
 */
export function lightnessForContrast(tint: Tint, against: Hsl, ratio: number): number {
  for (let lightness = 0; lightness < 100; lightness += 1) {
    if (contrastRatio({ ...tint, lightness }, against) >= ratio) return lightness
  }

  return 100
}
