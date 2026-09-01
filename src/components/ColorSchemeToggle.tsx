import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

/**
 * Flips between the two schemes; Mantine stores the choice. The *computed* scheme, so it is still
 * `light` or `dark` when the setting is `auto`, read on the first render so the icon does not swap.
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
