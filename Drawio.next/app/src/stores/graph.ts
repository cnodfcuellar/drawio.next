import { writable } from 'svelte/store'
import type { GraphController } from '../core/GraphController'

/**
 * Store reactivo con la instancia activa del GraphController
 */
export const activeGraph = writable<GraphController | null>(null)

/**
 * Nivel de zoom actual en porcentaje (ej: 100)
 */
export const zoomLevel = writable<number>(100)
