import zlib from 'node:zlib'

// Polyfill de compatibilidad Node 22.14 con undici / jsdom (createZstdDecompress)
if (!(zlib as any).createZstdDecompress) {
  ;(zlib as any).createZstdDecompress = () => {}
  if (!(zlib as any).constants) (zlib as any).constants = {}
  ;(zlib as any).constants.ZSTD_d_windowLogMax = 0
}

const { JSDOM } = await import('jsdom')

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  contentType: 'text/html'
})

if (typeof (globalThis as any).DOMParser === 'undefined') {
  ;(globalThis as any).DOMParser = dom.window.DOMParser
}

if (typeof (globalThis as any).XMLSerializer === 'undefined') {
  ;(globalThis as any).XMLSerializer = dom.window.XMLSerializer
}
