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

/**
 * Parcel's `bundle-text:` pipeline builds a file as usual and then hands the
 * result back as a string instead of emitting it. The Logo uses it to put the
 * SVG markup in the document, where CSS can reach its fill.
 */
declare module 'bundle-text:*' {
  const content: string
  export default content
}
