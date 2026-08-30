import { Box, type MantineBreakpoint } from '@mantine/core'
import type { JSX } from 'react'

import { cx } from '../lib/css'
import * as classes from './Logo.module.css'

export interface LogoProps {
  /** `logotype` is the full wordmark, `icon` the standalone glyph. */
  variant?: 'logotype' | 'icon'
  /** Width in pixels; the height follows from the artwork's aspect ratio. */
  width?: number
  hiddenFrom?: MantineBreakpoint
  visibleFrom?: MantineBreakpoint
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
      className={cx(classes.mark, variant === 'icon' ? classes.icon : classes.logotype)}
      w={width}
      role="img"
      aria-label="Flutex"
      hiddenFrom={hiddenFrom}
      visibleFrom={visibleFrom}
    />
  )
}
