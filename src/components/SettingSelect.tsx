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
}

export function SettingSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  isValid,
  icon,
  description,
}: SettingSelectProps<T>): JSX.Element {
  return (
    <Select
      label={label}
      description={description}
      leftSection={icon}
      data={options}
      value={value}
      allowDeselect={false}
      checkIconPosition="right"
      comboboxProps={{ withinPortal: true }}
      onChange={(next) => {
        if (next !== null && isValid(next)) onChange(next)
      }}
    />
  )
}
