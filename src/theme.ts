import { createTheme, type MantineColorsTuple } from '@mantine/core'

// ─────────────────────────────────────────────────────────────────────────────
// Palette. The designer supplied nine anchors; Mantine wants tuples of ten
// shades ordered from lightest (0) to darkest (9), so every ramp is
// interpolated around the anchor it was given. Anchors are marked below.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The application accent — progress bars, action buttons, a correct note.
 * Built around `forestgreen` hsl(130deg 60% 30%), which lands on shade 7.
 */
const accent: MantineColorsTuple = [
  '#f1f9f2',
  '#dbf0df',
  '#b8e0be',
  '#81cf8e',
  '#4fc463',
  '#32ae47',
  '#259337',
  '#1f7a2e', // forestgreen
  '#186225',
  '#12491c',
]

/**
 * Target note and tuner needle. Built around `tana` hsl(60deg 30% 80%),
 * which lands on shade 2 — the rest of the ramp is the same hue, deepened.
 */
const signal: MantineColorsTuple = [
  '#f4f4eb',
  '#eaead7',
  '#dbdbbd', // tana
  '#d1d194',
  '#c9c95e',
  '#bebe37',
  '#a3a329',
  '#838321',
  '#626218',
  '#494912',
]

/**
 * Mistakes and penalties. The palette has no error colour, so this is derived:
 * a warm red at hue 8deg, close enough to the browns not to look pasted in.
 */
const alarm: MantineColorsTuple = [
  '#faf1ef',
  '#f6deda',
  '#eec1ba',
  '#e4978b',
  '#db6857',
  '#d2432d',
  '#b13825',
  '#8f2d1e',
  '#6d2317',
  '#541b12',
]

/**
 * The built-in `dark` palette is overridden because Mantine ships neutral
 * greys and this design is warm brown. Mantine reads fixed meanings off the
 * indices, which is what fixes each anchor's slot rather than taste:
 * 0 body text, 2 dimmed text, 3 placeholder, 4 every border and divider,
 * 6 input backgrounds, 7-9 successive surface layers.
 *
 * Seven of the nine supplied anchors are warm neutrals or browns, so seven of
 * the ten slots are exact designer values and only 5, 7 and 8 are interpolated.
 *
 * `driftwood` sits above `cement` even though both are hsl lightness 50%: at
 * 45% saturation driftwood measures 5.24:1 against the page where the near-grey
 * cement measures 4.40:1, so it genuinely is the lighter of the two and Mantine
 * expects the ramp to fall monotonically. That ordering also puts the quiet
 * near-neutral on slot 4, which every card border, input outline and divider
 * reads — a tan there would outline the entire interface.
 *
 * Slot 3 is busier than "placeholder" suggests: it also drives the Select
 * chevron and disabled text, and anything the app asks for by name. Contrast
 * for it has to be judged against a card (dark-8), not the page, because that
 * is where the text using it actually sits — see `status.ts`.
 */
const dark: MantineColorsTuple = [
  '#f4f6f4', // saltpan
  '#e7e6e4', // platinum
  '#b6b3af', // tide
  '#b98346', // driftwood
  '#868079', // cement
  '#876845',
  '#7a501f', // chocolate
  '#593a18',
  '#3b2a16',
  '#211a12', // oil
]

export const theme = createTheme({
  colors: { accent, signal, alarm, dark },
  primaryColor: 'accent',
  primaryShade: { light: 6, dark: 4 },

  // Swap in a custom face by adding an @font-face to global.css or a <link>
  // in src/index.html, then naming it here.
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',

  headings: {
    fontWeight: '700',
  },

  defaultRadius: 'lg',
  cursorType: 'pointer',
})
