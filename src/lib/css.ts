/**
 * CSS module lookups are typed `string | undefined` under `noUncheckedIndexedAccess`,
 * so callers pass them straight in and skip `?? ''` at every call site.
 */
export function cx(...names: (string | false | null | undefined)[]): string {
  let result = ''

  for (const name of names) {
    if (typeof name !== 'string' || name === '') continue
    result = result === '' ? name : `${result} ${name}`
  }

  return result
}
