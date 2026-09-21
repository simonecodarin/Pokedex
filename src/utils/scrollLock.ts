/**
 * Blocca lo scroll della pagina mentre una scheda o un pannello è aperto,
 * compensando la scrollbar così il layout sotto non "salta".
 */
export function lockScroll(lock: boolean) {
  const body = document.body
  if (!lock) {
    body.style.overflow = ''
    body.style.paddingRight = ''
    return
  }
  const scrollbar = window.innerWidth - document.documentElement.clientWidth
  body.style.overflow = 'hidden'
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
}
