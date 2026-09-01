import { MantineProvider } from '@mantine/core'
import type { JSX, ReactNode } from 'react'

import { colorSchemeManager } from './colorScheme'
import { cssVariablesResolver, theme } from './theme'

/**
 * Mantine configured once, for `index.tsx` and for the SSR smoke test both. Four props that have to
 * agree, and a test is only worth its keep if it renders what ships.
 *
 * `auto` follows the device, which is where every visit starts: the manager only remembers an override
 * for the session, and `useColorSchemeOverride` drops one the device has since disagreed with.
 * color-scheme-boot.ts resolves the same thing before paint.
 */
export function Provider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
    >
      {children}
    </MantineProvider>
  )
}
