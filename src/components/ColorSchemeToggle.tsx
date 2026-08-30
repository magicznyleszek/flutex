import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

/**
 * Flips between the two schemes and stores the choice, which Mantine keeps in
 * localStorage. `useComputedColorScheme` is the resolved value rather than the setting, so
 * it is still `light` or `dark` when the setting is `auto`.
 *
 * `getInitialValueInEffect: false` reads the stored scheme on the first render instead of
 * a frame later, so the icon does not start on the wrong one and swap.
 */
export function ColorSchemeToggle(): JSX.Element {
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('dark', { getInitialValueInEffect: false })
  const next = scheme === 'dark' ? 'light' : 'dark'

  return (
    <Tooltip label={next === 'dark' ? 'Dark theme' : 'Light theme'}>
      <ActionIcon
        variant="default"
        size={42}
        onClick={() => { setColorScheme(next) }}
        aria-label={`Switch to the ${next} theme`}
      >
        {scheme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </ActionIcon>
    </Tooltip>
  )
}
