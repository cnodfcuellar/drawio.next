import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import {
  showHelpModal,
  toggleHelpModal,
  openHelpModal,
  closeHelpModal,
  SHORTCUTS_CATALOG
} from './help'

describe('help store — Catálogo y Modal de Atajos', () => {
  beforeEach(() => {
    closeHelpModal()
  })

  it('inicia con el modal de ayuda cerrado', () => {
    expect(get(showHelpModal)).toBe(false)
  })

  it('toggleHelpModal alterna la visibilidad del modal', () => {
    toggleHelpModal()
    expect(get(showHelpModal)).toBe(true)

    toggleHelpModal()
    expect(get(showHelpModal)).toBe(false)
  })

  it('openHelpModal y closeHelpModal establecen el estado explícito', () => {
    openHelpModal()
    expect(get(showHelpModal)).toBe(true)

    closeHelpModal()
    expect(get(showHelpModal)).toBe(false)
  })

  it('SHORTCUTS_CATALOG contiene atajos esenciales organizados por categoría', () => {
    expect(SHORTCUTS_CATALOG.length).toBeGreaterThan(15)

    const categories = new Set(SHORTCUTS_CATALOG.map(s => s.category))
    expect(categories.has('tools')).toBe(true)
    expect(categories.has('navigation')).toBe(true)
    expect(categories.has('editing')).toBe(true)
    expect(categories.has('arrange')).toBe(true)
    expect(categories.has('layers')).toBe(true)
    expect(categories.has('plugins')).toBe(true)

    // Atajos clave deben estar presentes
    expect(SHORTCUTS_CATALOG.some(s => s.id === 'tool-connect' && s.keys.includes('C'))).toBe(true)
    expect(SHORTCUTS_CATALOG.some(s => s.id === 'nav-zen-mode' && s.keys.includes('F9'))).toBe(true)
    expect(SHORTCUTS_CATALOG.some(s => s.id === 'nav-toggle-layers' && s.keys.includes('F4'))).toBe(true)
    expect(SHORTCUTS_CATALOG.some(s => s.id === 'edit-undo' && s.keys.includes('Z'))).toBe(true)
  })
})
