import { writable } from 'svelte/store'

export interface ShortcutItem {
  id: string
  category: 'tools' | 'navigation' | 'editing' | 'arrange' | 'layers' | 'plugins'
  categoryLabel: string
  action: string
  keys: string[]
  description?: string
}

export const SHORTCUTS_CATALOG: ShortcutItem[] = [
  // 🛠️ Herramientas
  { id: 'tool-select', category: 'tools', categoryLabel: 'Herramientas', action: 'Modo Puntero / Selección', keys: ['V'] },
  { id: 'tool-connect', category: 'tools', categoryLabel: 'Herramientas', action: 'Modo Conector (alternar)', keys: ['C'] },
  { id: 'tool-alt-connect', category: 'tools', categoryLabel: 'Herramientas', action: 'Modo Conector temporal', keys: ['Alt (mantener)'] },
  { id: 'tool-quick-connect', category: 'tools', categoryLabel: 'Herramientas', action: 'Enlace rápido entre formas', keys: ['L'] },
  { id: 'tool-new-node', category: 'tools', categoryLabel: 'Herramientas', action: 'Nuevo Bloque / Nodo', keys: ['N'] },

  // 👁️ Navegación y Vistas
  { id: 'nav-pan-space', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Panning / Desplazar lienzo', keys: ['Espacio + Arrastre'] },
  { id: 'nav-pan-right-click', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Panning con ratón', keys: ['Clic Derecho + Arrastre'] },
  { id: 'nav-zoom-wheel', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Zoom suave continuo', keys: ['Ctrl + Rueda'] },
  { id: 'nav-zoom-in', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Acercar Zoom', keys: ['Ctrl', '+'] },
  { id: 'nav-zoom-out', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Alejar Zoom', keys: ['Ctrl', '-'] },
  { id: 'nav-zoom-reset', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Restablecer Zoom (100%)', keys: ['1:1'] },
  { id: 'nav-zen-mode', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Modo Enfoque (Zen)', keys: ['F9', 'Ctrl + \\'] },
  { id: 'nav-toggle-sidebar', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Mostrar/Ocultar Paleta Izquierda', keys: ['F7', 'Ctrl+Shift+L'] },
  { id: 'nav-toggle-inspector', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Mostrar/Ocultar Inspector', keys: ['F8', 'Ctrl+Shift+R'] },
  { id: 'nav-toggle-layers', category: 'navigation', categoryLabel: 'Navegación y Vistas', action: 'Mostrar/Ocultar Panel de Capas', keys: ['F4'] },

  // ✂️ Edición y Portapapeles
  { id: 'edit-undo', category: 'editing', categoryLabel: 'Edición', action: 'Deshacer acción', keys: ['Ctrl', 'Z'] },
  { id: 'edit-redo', category: 'editing', categoryLabel: 'Edición', action: 'Rehacer acción', keys: ['Ctrl', 'Y'] },
  { id: 'edit-cut', category: 'editing', categoryLabel: 'Edición', action: 'Cortar selección', keys: ['Ctrl', 'X'] },
  { id: 'edit-copy', category: 'editing', categoryLabel: 'Edición', action: 'Copiar selección', keys: ['Ctrl', 'C'] },
  { id: 'edit-paste', category: 'editing', categoryLabel: 'Edición', action: 'Pegar', keys: ['Ctrl', 'V'] },
  { id: 'edit-duplicate', category: 'editing', categoryLabel: 'Edición', action: 'Duplicar formas', keys: ['Ctrl', 'D'] },
  { id: 'edit-delete', category: 'editing', categoryLabel: 'Edición', action: 'Eliminar selección', keys: ['Supr', 'Backspace'] },
  { id: 'edit-select-all', category: 'editing', categoryLabel: 'Edición', action: 'Seleccionar todo el lienzo', keys: ['Ctrl', 'A'] },
  { id: 'edit-escape', category: 'editing', categoryLabel: 'Edición', action: 'Cancelar / Limpiar selección', keys: ['Escape'] },

  // 📐 Organización
  { id: 'arr-group', category: 'arrange', categoryLabel: 'Organización', action: 'Agrupar formas', keys: ['Ctrl', 'G'] },
  { id: 'arr-ungroup', category: 'arrange', categoryLabel: 'Organización', action: 'Desagrupar', keys: ['Ctrl', 'Shift', 'U'] },
  { id: 'arr-front', category: 'arrange', categoryLabel: 'Organización', action: 'Traer al frente', keys: ['Menú Arrange'] },
  { id: 'arr-back', category: 'arrange', categoryLabel: 'Organización', action: 'Enviar al fondo', keys: ['Menú Arrange'] },

  // 📑 Páginas y Capas
  { id: 'pg-rename', category: 'layers', categoryLabel: 'Páginas y Capas', action: 'Renombrar página o capa', keys: ['Doble clic'] },
  { id: 'pg-layers-panel', category: 'layers', categoryLabel: 'Páginas y Capas', action: 'Gestor de Capas', keys: ['F4'] },

  // 🧩 Plugins y Ayuda
  { id: 'pl-stats', category: 'plugins', categoryLabel: 'Plugins', action: 'Estadísticas del Diagrama', keys: ['Alt', 'S'] },
  { id: 'pl-help', category: 'plugins', categoryLabel: 'Plugins', action: 'Abrir este mapa de atajos', keys: ['?', 'F1'] }
]

export const showHelpModal = writable<boolean>(false)

export function toggleHelpModal() {
  showHelpModal.update(v => !v)
}

export function openHelpModal() {
  showHelpModal.set(true)
}

export function closeHelpModal() {
  showHelpModal.set(false)
}
