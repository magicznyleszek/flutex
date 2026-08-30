/**
 * `bundle-text:` stub for Jest.
 *
 * Only Parcel understands that pipeline, so the tests need something to stand in
 * for the inlined artwork. It is real markup rather than an empty string so the
 * SSR smoke test still sees a well-formed document.
 */
const markup = '<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z"/></svg>'

export default markup
