import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import {
  layout,
  showSidebar,
  showInspector,
  showToolbar,
  zenMode,
  STORAGE_KEY_LAYOUT
} from './layout'

describe('layout store — paneles plegables y modo enfoque', () => {
  let storageMock: Record<string, string> = {}

  beforeEach(() => {
    storageMock = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storageMock[key]
      }),
      clear: vi.fn(() => {
        storageMock = {}
      })
    })

    layout.resetLayout()
  })

  it('inicia con los paneles activos y sin modo zen', () => {
    const state = get(layout)
    expect(state.showSidebar).toBe(true)
    expect(state.showInspector).toBe(true)
    expect(state.showToolbar).toBe(true)
    expect(state.zenMode).toBe(false)

    expect(get(showSidebar)).toBe(true)
    expect(get(showInspector)).toBe(true)
    expect(get(showToolbar)).toBe(true)
    expect(get(zenMode)).toBe(false)
  })

  it('toggleSidebar alterna la visibilidad de la paleta izquierda', () => {
    layout.toggleSidebar()
    expect(get(showSidebar)).toBe(false)
    expect(get(layout).showSidebar).toBe(false)

    layout.toggleSidebar()
    expect(get(showSidebar)).toBe(true)
    expect(get(layout).showSidebar).toBe(true)
  })

  it('toggleInspector alterna la visibilidad del inspector', () => {
    layout.toggleInspector()
    expect(get(showInspector)).toBe(false)
    expect(get(layout).showInspector).toBe(false)

    layout.toggleInspector()
    expect(get(showInspector)).toBe(true)
    expect(get(layout).showInspector).toBe(true)
  })

  it('toggleZenMode activa modo zen y colapsa ambos paneles laterales', () => {
    layout.toggleZenMode()
    expect(get(zenMode)).toBe(true)
    expect(get(showSidebar)).toBe(false)
    expect(get(showInspector)).toBe(false)

    // Al desactivar modo zen, se restauran los paneles
    layout.toggleZenMode()
    expect(get(zenMode)).toBe(false)
    expect(get(showSidebar)).toBe(true)
    expect(get(showInspector)).toBe(true)
  })

  it('interactuar con sidebar mientras está en zen mode desactiva el modo zen', () => {
    layout.toggleZenMode()
    expect(get(zenMode)).toBe(true)

    layout.toggleSidebar()
    expect(get(zenMode)).toBe(false)
    expect(get(showSidebar)).toBe(true)
  })

  it('persiste cambios en localStorage', () => {
    layout.toggleSidebar()
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY_LAYOUT,
      expect.stringContaining('"showSidebar":false')
    )
  })
})
