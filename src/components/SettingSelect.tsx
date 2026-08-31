import { Select } from '@mantine/core'
import type { JSX, ReactNode } from 'react'

export interface SettingOption<T extends string> {
  value: T
  label: string
}

export interface SettingSelectProps<T extends string> {
  label: string
  value: T
  options: readonly SettingOption<T>[]
  onChange: (value: T) => void
  /** Select hands back `string | null`, so without this guard the narrowing is a cast. */
  isValid: (value: string) => value is T
  icon?: ReactNode
  description?: string
  /** Worth it once a list is too long to scan, which of these lists is only the song one. */
  searchable?: boolean
}

export function SettingSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  isValid,
  icon,
  description,
  searchable = false,
}: SettingSelectProps<T>): JSX.Element {
  return (
    <Select
      label={label}
      description={description}
      leftSection={icon}
      data={options}
      value={value}
      searchable={searchable}
      nothingFoundMessage={searchable ? 'Nothing by that name' : undefined}
      // A searchable Select opens with the current label sitting in the box as the search term,
      // so typing would append to it and match nothing. Selecting it means the first keystroke
      // replaces it, and the label is still readable for anyone who opened the list to browse.
      onFocus={searchable ? (event) => event.currentTarget.select() : undefined}
      allowDeselect={false}
      checkIconPosition="right"
      comboboxProps={{ withinPortal: true }}
      onChange={(next) => {
        if (next !== null && isValid(next)) onChange(next)
      }}
    />
  )
}
