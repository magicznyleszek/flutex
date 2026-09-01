import { ActionIcon, Tooltip } from '@mantine/core'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import { useColorSchemeOverride } from '../hooks/useColorSchemeOverride'

/** Flips between the two schemes. What is remembered, and for how long, is the hook's business. */
export function ColorSchemeToggle(): JSX.Element {
  const { scheme, toggle } = useColorSchemeOverride()
  const next = scheme === 'dark' ? 'light' : 'dark'

  return (
    <Tooltip label={next === 'dark' ? 'Dark theme' : 'Light theme'}>
      <ActionIcon
        variant="default"
        size={42}
        onClick={toggle}
        aria-label={`Switch to the ${next} theme`}
      >
        {scheme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </ActionIcon>
    </Tooltip>
  )
}
