import { useMantineColorScheme } from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { useEffect, useRef } from 'react'

export interface ColorSchemeOverride {
  /** What is on screen: the device's scheme, or the override if there is one. Never `auto`. */
  scheme: 'light' | 'dark'
  /** Flips to the other scheme, or gives the device its say back if that is what the other one is. */
  toggle: () => void
}

/**
 * The device decides, with the toggle as an override that does not outlive its reason. Two things end
 * it: the session, since `colorSchemeManager` keeps it in `sessionStorage`; and the device changing
 * its own mind, so a phone that goes light at sunrise takes the app with it rather than holding on to
 * what was picked the evening before.
 *
 * Mantine follows the device by itself while its scheme is `auto`, so all of this is a matter of
 * getting back to `auto` — `clearColorScheme` is what does that.
 */
export function useColorSchemeOverride(): ColorSchemeOverride {
  const { colorScheme, setColorScheme, clearColorScheme } = useMantineColorScheme()
  // Read during the first render, not in an effect, or the icon draws once and then swaps.
  const device = useColorScheme('dark', { getInitialValueInEffect: false })
  const scheme = colorScheme === 'auto' ? device : colorScheme

  // What the device said when the override was made, so that only a *change* to it retires the
  // override. The effect runs on the toggle itself too, and there the two still agree.
  const deviceAtOverride = useRef(device)

  useEffect(() => {
    if (colorScheme === 'auto') {
      deviceAtOverride.current = device
      return
    }
    if (deviceAtOverride.current !== device) clearColorScheme()
  }, [device, colorScheme, clearColorScheme])

  const toggle = (): void => {
    const next = scheme === 'dark' ? 'light' : 'dark'
    // Asking for what the device already says is not an override. Pinning it would stop the app
    // following the device for the rest of the session, which is not what the tap meant.
    if (next === device) clearColorScheme()
    else setColorScheme(next)
  }

  return { scheme, toggle }
}
