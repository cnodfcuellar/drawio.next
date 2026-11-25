/**
 * Store y utilidades de color para Drawio.next
 * Provee la paleta curada de 16 colores oficiales y el historial de recientes persistente.
 */
import { writable } from 'svelte/store'

export interface ColorSwatch {
  hex: string
  name: string
  category: 'neutral' | 'brand' | 'semantic' | 'pastel'
}

/**
 * Paleta oficial de 16 colores (2 filas x 8 columnas)
 */
export const PALETTE_16: ColorSwatch[] = [
  // Fila 1: Estructurales, Neutros y Primarios
  { hex: '#FFFFFF', name: 'Blanco Puro', category: 'neutral' },
  { hex: '#E2E8F0', name: 'Gris Claro', category: 'neutral' },
  { hex: '#64748B', name: 'Gris Pizarra', category: 'neutral' },
  { hex: '#0F172A', name: 'Negro Carbón', category: 'neutral' },
  { hex: '#0284C7', name: 'Azul Drawio.next', category: 'brand' },
  { hex: '#06B6D4', name: 'Azul Cian', category: 'brand' },
  { hex: '#10B981', name: 'Verde Esmeralda', category: 'semantic' },
  { hex: '#F08705', name: 'Naranja draw.io', category: 'brand' },

  // Fila 2: Alertas, Acentos y Pasteles Clásicos
  { hex: '#EF4444', name: 'Rojo Alerta', category: 'semantic' },
  { hex: '#8B5CF6', name: 'Violeta Eléctrico', category: 'semantic' },
  { hex: '#EC4899', name: 'Rosa / Magenta', category: 'semantic' },
  { hex: '#F59E0B', name: 'Ámbar / Nota', category: 'semantic' },
  { hex: '#DAE8FC', name: 'Pastel Azul Clásico', category: 'pastel' },
  { hex: '#D5E8D4', name: 'Pastel Verde Clásico', category: 'pastel' },
  { hex: '#FFF2CC', name: 'Pastel Amarillo Clásico', category: 'pastel' },
  { hex: '#F8CECC', name: 'Pastel Rosa Clásico', category: 'pastel' }
]

const STORAGE_KEY = 'drawio_next_recent_colors'
const MAX_RECENTS = 8

const DEFAULT_RECENTS = [
  '#0284C7',
  '#F08705',
  '#10B981',
  '#8B5CF6',
  '#FFFFFF',
  '#0F172A'
]

function getInitialRecents(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_RECENTS
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_RECENTS
}

export const recentColors = writable<string[]>(getInitialRecents())

/**
 * Agrega un color a la lista de recientes (sin duplicados, máximo 8) y persiste en localStorage
 */
export function addRecentColor(color: string): void {
  if (!color || color === 'none' || color.toLowerCase() === 'transparent') {
    return
  }
  const normalized = normalizeHex(color).toUpperCase()
  if (!isValidHex(normalized)) {
    return
  }

  recentColors.update(list => {
    const filtered = list.filter(c => c.toUpperCase() !== normalized)
    const updated = [normalized, ...filtered].slice(0, MAX_RECENTS)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
    }
    return updated
  })
}

/**
 * Valida si un string es un código hexadecimal válido (#RGB, #RRGGBB o #RRGGBBAA)
 */
export function isValidHex(hex: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex.trim())
}

/**
 * Normaliza un código hex asegurando que tenga el prefijo '#'
 */
export function normalizeHex(hex: string): string {
  const clean = hex.trim()
  if (clean.startsWith('#')) return clean
  return `#${clean}`
}
