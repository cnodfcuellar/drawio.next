import { writable, derived } from 'svelte/store'

/** IDs de las celdas actualmente seleccionadas */
export const selectedIds = writable<Set<string>>(new Set())

/** Número de celdas seleccionadas */
export const selectionCount = derived(selectedIds, $ids => $ids.size)

/** ¿Hay algo seleccionado? */
export const hasSelection = derived(selectedIds, $ids => $ids.size > 0)

export function selectCell(id: string, multi = false) {
  selectedIds.update(ids => {
    if (multi) {
      const next = new Set(ids)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    }
    return new Set([id])
  })
}

export function clearSelection() {
  selectedIds.set(new Set())
}

export function selectMany(ids: string[]) {
  selectedIds.set(new Set(ids))
}
