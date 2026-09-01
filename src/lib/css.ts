/**
 * CSS module lookups are `string | undefined` under `noUncheckedIndexedAccess`, so callers pass
 * them straight in rather than writing `?? ''` at every call site.
 */
export function cx(...names: (string | false | null | undefined)[]): string {
  let result = ''

  for (const name of names) {
    if (typeof name !== 'string' || name === '') continue
    result = result === '' ? name : `${result} ${name}`
  }

  return result
}
