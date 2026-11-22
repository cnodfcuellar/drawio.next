import { writable } from 'svelte/store'
import type { GraphController } from '../core/GraphController'

export const AUTOSAVE_STORAGE_KEY = 'drawio_next_autosave_diagram'
export const LAST_SAVED_KEY = 'drawio_next_last_saved_time'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

export const saveStatus = writable<SaveStatus>('saved')
export const lastSavedTime = writable<string | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Guarda el estado actual del diagrama en localStorage
 */
export function saveDiagram(controller: GraphController): void {
  try {
    saveStatus.set('saving')
    const xml = controller.exportToXml()
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTOSAVE_STORAGE_KEY, xml)
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      localStorage.setItem(LAST_SAVED_KEY, now)
      lastSavedTime.set(now)
    }
    saveStatus.set('saved')
  } catch (err) {
    console.error('Error al autoguardar el diagrama:', err)
    saveStatus.set('unsaved')
  }
}

/**
 * Dispara el autoguardado con debounce (ej. 400ms tras la última modificación)
 */
export function scheduleAutoSave(controller: GraphController, delayMs = 400): void {
  saveStatus.set('saving')
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    saveDiagram(controller)
    debounceTimer = null
  }, delayMs)
}

/**
 * Carga el diagrama guardado en localStorage, si existe
 */
export function loadSavedDiagram(controller: GraphController): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const savedXml = localStorage.getItem(AUTOSAVE_STORAGE_KEY)
    if (!savedXml || savedXml.trim().length === 0) return false

    const success = controller.importXml(savedXml)
    if (success) {
      const savedTime = localStorage.getItem(LAST_SAVED_KEY)
      if (savedTime) lastSavedTime.set(savedTime)
      saveStatus.set('saved')
      return true
    }
  } catch (err) {
    console.error('Error al restaurar diagrama autoguardado:', err)
  }
  return false
}

/**
 * Borra el autoguardado actual de localStorage
 */
export function clearSavedDiagram(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY)
    localStorage.removeItem(LAST_SAVED_KEY)
    lastSavedTime.set(null)
    saveStatus.set('saved')
  }
}
