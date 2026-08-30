/**
 * Parcel exposes CSS module classes as named exports. A namespace import
 * (`import * as classes`) lets it tree shake unused classes — a default import
 * blocks that, and the build warns about it.
 */
declare module '*.module.css' {
  const classes: { readonly [name: string]: string }
  export = classes
}

declare module '*.css'
