import { Box, type MantineBreakpoint } from '@mantine/core'
import type { JSX } from 'react'

// `bundle-text:` returns the file as a string rather than a separate asset, so the artwork sits in
// the document where CSS can set its fill. Neither file paints itself — see `Logo.module.css`.
import iconMarkup from 'bundle-text:../flutex-icon.svg'
import logotypeMarkup from 'bundle-text:../flutex-logotype.svg'

import { cx } from '../lib/css'
import * as classes from './Logo.module.css'

export interface LogoProps {
  variant?: 'logotype' | 'icon'
  /** Width in px. The height follows from the artwork's own viewBox. */
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
      // Naming the span makes its subtree presentational, so the `<svg>` needs no title.
      role="img"
      aria-label="Flutex"
      hiddenFrom={hiddenFrom}
      visibleFrom={visibleFrom}
      // A build-time constant from this repo, nothing derived from input. Redeclaring the paths as
      // JSX would fork the artwork away from the file the favicon points at.
      dangerouslySetInnerHTML={{ __html: MARKUP[variant] }}
    />
  )
}
