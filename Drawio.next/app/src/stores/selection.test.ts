import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import {
  selectedIds,
  selectionCount,
  hasSelection,
  selectCell,
  clearSelection,
  selectMany
} from './selection'

describe('Selection Store', () => {
  beforeEach(() => {
    clearSelection()
  })

  it('inicia vacio', () => {
    expect(get(selectedIds).size).toBe(0)
    expect(get(selectionCount)).toBe(0)
    expect(get(hasSelection)).toBe(false)
  })

  it('selecciona una celda en modo simple', () => {
    selectCell('cell-1')
    expect(get(selectedIds).has('cell-1')).toBe(true)
    expect(get(selectionCount)).toBe(1)
    expect(get(hasSelection)).toBe(true)

    // Al seleccionar otra sin multi=true, reemplaza la seleccion
    selectCell('cell-2')
    expect(get(selectedIds).has('cell-1')).toBe(false)
    expect(get(selectedIds).has('cell-2')).toBe(true)
    expect(get(selectionCount)).toBe(1)
  })

  it('soporta multi-seleccion', () => {
    selectCell('cell-1', true)
    selectCell('cell-2', true)
    expect(get(selectionCount)).toBe(2)
    expect(get(selectedIds).has('cell-1')).toBe(true)
    expect(get(selectedIds).has('cell-2')).toBe(true)

    // Toggle off si ya esta seleccionada
    selectCell('cell-1', true)
    expect(get(selectionCount)).toBe(1)
    expect(get(selectedIds).has('cell-1')).toBe(false)
  })

  it('limpia la seleccion con clearSelection()', () => {
    selectMany(['a', 'b', 'c'])
    expect(get(selectionCount)).toBe(3)

    clearSelection()
    expect(get(selectionCount)).toBe(0)
    expect(get(hasSelection)).toBe(false)
  })
})
