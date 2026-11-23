import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import {
  layers,
  activeLayerId,
  showLayersPanel,
  toggleLayersPanel,
  addLayer,
  removeLayer,
  setActiveLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  renameLayer,
  moveSelectionToLayer,
  syncLayersFromGraph
} from './layers'
import { activeGraph } from './graph'

describe('layers store — Gestión de Capas (Layers)', () => {
  let mockGraph: any

  beforeEach(() => {
    let mockLayers = [
      { id: '1', name: 'Capa de fondo', visible: true, locked: false, cellCount: 2 }
    ]
    let activeId = '1'

    mockGraph = {
      getLayers: vi.fn(() => [...mockLayers]),
      getActiveLayerId: vi.fn(() => activeId),
      setActiveLayer: vi.fn((id: string) => {
        activeId = id
        return true
      }),
      addLayer: vi.fn((name?: string) => {
        const newId = `layer-${mockLayers.length + 1}`
        mockLayers.push({
          id: newId,
          name: name || `Capa ${mockLayers.length + 1}`,
          visible: true,
          locked: false,
          cellCount: 0
        })
        activeId = newId
        return newId
      }),
      removeLayer: vi.fn((id: string) => {
        if (mockLayers.length <= 1) return false
        mockLayers = mockLayers.filter(l => l.id !== id)
        if (activeId === id) activeId = mockLayers[0].id
        return true
      }),
      setLayerVisible: vi.fn((id: string, vis: boolean) => {
        const l = mockLayers.find(x => x.id === id)
        if (l) l.visible = vis
        return true
      }),
      setLayerLocked: vi.fn((id: string, lock: boolean) => {
        const l = mockLayers.find(x => x.id === id)
        if (l) l.locked = lock
        return true
      }),
      renameLayer: vi.fn((id: string, name: string) => {
        const l = mockLayers.find(x => x.id === id)
        if (l) l.name = name
        return true
      }),
      moveSelectedToLayer: vi.fn((_id: string) => true)
    }

    activeGraph.set(mockGraph)
    syncLayersFromGraph()
    showLayersPanel.set(false)
  })

  it('inicia con la capa de fondo activa y panel cerrado', () => {
    expect(get(showLayersPanel)).toBe(false)
    const list = get(layers)
    expect(list.length).toBe(1)
    expect(list[0].id).toBe('1')
    expect(list[0].name).toBe('Capa de fondo')
    expect(get(activeLayerId)).toBe('1')
  })

  it('toggleLayersPanel alterna la visibilidad del panel de capas', () => {
    toggleLayersPanel()
    expect(get(showLayersPanel)).toBe(true)

    toggleLayersPanel()
    expect(get(showLayersPanel)).toBe(false)
  })

  it('addLayer crea una nueva capa y la establece como activa', () => {
    const newId = addLayer('Capa Arquitectura')
    expect(mockGraph.addLayer).toHaveBeenCalledWith('Capa Arquitectura')
    expect(newId).toBe('layer-2')

    const list = get(layers)
    expect(list.length).toBe(2)
    expect(list.some(l => l.name === 'Capa Arquitectura')).toBe(true)
    expect(get(activeLayerId)).toBe('layer-2')
  })

  it('setActiveLayer cambia la capa activa de trabajo', () => {
    addLayer('Capa 2')
    setActiveLayer('1')
    expect(mockGraph.setActiveLayer).toHaveBeenCalledWith('1')
    expect(get(activeLayerId)).toBe('1')
  })

  it('toggleLayerVisibility alterna la visibilidad de la capa', () => {
    toggleLayerVisibility('1')
    expect(mockGraph.setLayerVisible).toHaveBeenCalledWith('1', false)
  })

  it('toggleLayerLock alterna el bloqueo de edición de la capa', () => {
    toggleLayerLock('1')
    expect(mockGraph.setLayerLocked).toHaveBeenCalledWith('1', true)
  })

  it('renameLayer renombra una capa existente', () => {
    renameLayer('1', 'Capa Principal')
    expect(mockGraph.renameLayer).toHaveBeenCalledWith('1', 'Capa Principal')
  })

  it('removeLayer elimina una capa y reasigna la capa activa si correspondía', () => {
    addLayer('Capa Temporal')
    expect(get(layers).length).toBe(2)

    const ok = removeLayer('layer-2')
    expect(ok).toBe(true)
    expect(mockGraph.removeLayer).toHaveBeenCalledWith('layer-2')
    expect(get(layers).length).toBe(1)
  })

  it('moveSelectionToLayer delega en el grafo', () => {
    const ok = moveSelectionToLayer('1')
    expect(ok).toBe(true)
    expect(mockGraph.moveSelectedToLayer).toHaveBeenCalledWith('1')
  })
})
