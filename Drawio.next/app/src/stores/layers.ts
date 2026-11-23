import { writable, get } from 'svelte/store'
import type { LayerInfo } from '../core/GraphController'
import { activeGraph } from './graph'

export const layers = writable<LayerInfo[]>([
  { id: '1', name: 'Capa de fondo', visible: true, locked: false, cellCount: 0 }
])

export const activeLayerId = writable<string>('1')

export const showLayersPanel = writable<boolean>(false)

/**
 * Sincroniza el store de capas con el estado real del GraphController activo
 */
export function syncLayersFromGraph() {
  const g = get(activeGraph)
  if (g && typeof g.getLayers === 'function') {
    const currentLayers = g.getLayers()
    layers.set(currentLayers)
    activeLayerId.set(g.getActiveLayerId())
  }
}

/**
 * Abre o cierra el panel flotante de capas
 */
export function toggleLayersPanel() {
  showLayersPanel.update(v => !v)
  syncLayersFromGraph()
}

/**
 * Crea una nueva capa en el grafo
 */
export function addLayer(name?: string): string {
  const g = get(activeGraph)
  if (g && typeof g.addLayer === 'function') {
    const newId = g.addLayer(name)
    syncLayersFromGraph()
    return newId
  }
  return ''
}

/**
 * Elimina una capa existente
 */
export function removeLayer(layerId: string): boolean {
  const g = get(activeGraph)
  if (g && typeof g.removeLayer === 'function') {
    const ok = g.removeLayer(layerId)
    if (ok) syncLayersFromGraph()
    return ok
  }
  return false
}

/**
 * Establece la capa activa de inserción
 */
export function setActiveLayer(layerId: string): boolean {
  const g = get(activeGraph)
  if (g && typeof g.setActiveLayer === 'function') {
    const ok = g.setActiveLayer(layerId)
    if (ok) {
      activeLayerId.set(layerId)
      syncLayersFromGraph()
    }
    return ok
  }
  return false
}

/**
 * Alterna la visibilidad (mostrar/ocultar) de una capa
 */
export function toggleLayerVisibility(layerId: string) {
  const g = get(activeGraph)
  if (g && typeof g.setLayerVisible === 'function') {
    const list = get(layers)
    const target = list.find(l => l.id === layerId)
    if (target) {
      const nextVisible = !target.visible
      g.setLayerVisible(layerId, nextVisible)
      syncLayersFromGraph()
    }
  }
}

/**
 * Alterna el bloqueo (bloqueada/editable) de una capa
 */
export function toggleLayerLock(layerId: string) {
  const g = get(activeGraph)
  if (g && typeof g.setLayerLocked === 'function') {
    const list = get(layers)
    const target = list.find(l => l.id === layerId)
    if (target) {
      const nextLocked = !target.locked
      g.setLayerLocked(layerId, nextLocked)
      syncLayersFromGraph()
    }
  }
}

/**
 * Renombra una capa
 */
export function renameLayer(layerId: string, newName: string): boolean {
  const g = get(activeGraph)
  if (g && typeof g.renameLayer === 'function') {
    const ok = g.renameLayer(layerId, newName)
    if (ok) syncLayersFromGraph()
    return ok
  }
  return false
}

/**
 * Mueve los elementos actualmente seleccionados a la capa especificada
 */
export function moveSelectionToLayer(layerId: string): boolean {
  const g = get(activeGraph)
  if (g && typeof g.moveSelectedToLayer === 'function') {
    const ok = g.moveSelectedToLayer(layerId)
    if (ok) syncLayersFromGraph()
    return ok
  }
  return false
}
