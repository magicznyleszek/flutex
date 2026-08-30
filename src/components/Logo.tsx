import { Box, type MantineBreakpoint } from '@mantine/core'
import type { JSX } from 'react'

// `bundle-text:` hands back the built file as a string instead of emitting it as
// a separate asset, so the artwork ends up in the document rather than behind a
// URL. That is what makes the fill reachable from CSS — see Logo.module.css.
import iconMarkup from 'bundle-text:../flutex-icon.svg'
import logotypeMarkup from 'bundle-text:../flutex-logotype.svg'

import { cx } from '../lib/css'
import * as classes from './Logo.module.css'

export interface LogoProps {
  /** `logotype` is the full wordmark, `icon` the standalone glyph. */
  variant?: 'logotype' | 'icon'
  /** Width in pixels; the height follows from the artwork's own viewBox. */
  width?: number
  hiddenFrom?: MantineBreakpoint
  visibleFrom?: MantineBreakpoint
}

const MARKUP: Record<NonNullable<LogoProps['variant']>, string> = {
  icon: iconMarkup,
  logotype: logotypeMarkup,
}

export function Logo({
  variant = 'logotype',
  width = 132,
  hiddenFrom,
  visibleFrom,
}: LogoProps): JSX.Element {
  return (
    <Box
      component="span"
      className={cx(classes.mark)}
      w={width}
      // The span carries the accessible name, which makes its subtree
      // presentational — so the inlined `<svg>` needs no title of its own.
      role="img"
      aria-label="Flutex"
      hiddenFrom={hiddenFrom}
      visibleFrom={visibleFrom}
      // The string is a build-time constant from a file in this repository;
      // nothing here is derived from input. React has no other way to mount
      // foreign markup, and re-declaring the paths as JSX would fork the
      // artwork away from the file the favicon still points at.
      dangerouslySetInnerHTML={{ __html: MARKUP[variant] }}
    />
  )
}
