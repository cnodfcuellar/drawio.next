import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { theme } from './theme'

const mockStorage: Record<string, string> = {}
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) },
  length: 0,
  key: () => null
}

// Asegurar mock en entorno Node
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  })
}

describe('Theme Store', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    theme.setTheme('dark')
  })

  it('inicia en modo dark por defecto', () => {
    expect(get(theme)).toBe('dark')
  })

  it('alterna entre dark y light con toggle()', () => {
    theme.toggle()
    expect(get(theme)).toBe('light')
    expect(globalThis.localStorage.getItem('drawio-theme')).toBe('light')

    theme.toggle()
    expect(get(theme)).toBe('dark')
    expect(globalThis.localStorage.getItem('drawio-theme')).toBe('dark')
  })

  it('permite fijar un tema explícito con setTheme()', () => {
    theme.setTheme('light')
    expect(get(theme)).toBe('light')
    theme.setTheme('dark')
    expect(get(theme)).toBe('dark')
  })
})
