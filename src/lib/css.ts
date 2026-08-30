/**
 * Class name composition.
 *
 * CSS modules are typed by index signature, so with `noUncheckedIndexedAccess`
 * `classes.foo` has the type `string | undefined`. Rather than scattering
 * `?? ''` across the components, classes are joined here — the function skips
 * missing and falsy values.
 */
export function cx(...names: (string | false | null | undefined)[]): string {
  let result = ''

  for (const name of names) {
    if (typeof name !== 'string' || name === '') continue
    result = result === '' ? name : `${result} ${name}`
  }

  return result
}
