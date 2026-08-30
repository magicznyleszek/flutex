/**
 * Parcel exposes CSS module classes as named exports. Import them as a namespace; a
 * default import blocks tree shaking and the build warns.
 */
declare module '*.module.css' {
  const classes: { readonly [name: string]: string }
  export = classes
}

declare module '*.css'

declare module 'bundle-text:*' {
  const content: string
  export default content
}
