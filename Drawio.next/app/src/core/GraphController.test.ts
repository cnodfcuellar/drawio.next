import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GraphController } from './GraphController'
import type { mxCell } from './types/mxgraph'

// Configurar mock de mxGraph para tests unitarios en Node
function createMockMxGraph() {
  const cellsMap: { [id: string]: any } = {}
  let currentSelection: any[] = []
  const selectionListeners: Array<() => void> = []
  const modelListeners: { [evt: string]: Array<(sender: any, evt: any) => void> } = {}

  let cellCounter = 1
  let currentScale = 1.0

  class MockCell {
    id: string
    value: any
    vertex: boolean
    edge: boolean
    geometry: any
    style: string
    constructor(id: string, value: any, isVertex: boolean, isEdge: boolean) {
      this.id = id
      this.value = value
      this.vertex = isVertex
      this.edge = isEdge
      this.style = ''
    }
  }

  const model = {
    beginUpdate: vi.fn(),
    endUpdate: vi.fn(),
    getCell: (id: string) => cellsMap[id] ?? null,
    addListener: (name: string, fn: any) => {
      if (!modelListeners[name]) modelListeners[name] = []
      modelListeners[name].push(fn)
    }
  }

  const view = {
    scale: 1.0,
    getScale: () => currentScale,
    setScale: (s: number) => { currentScale = s }
  }

  const selectionModel = {
    addListener: (evt: string, fn: any) => {
      selectionListeners.push(fn)
    }
  }

  class MockGraph {
    container: HTMLElement
    model = model
    view = view
    selectionModel = selectionModel

    constructor(container: HTMLElement) {
      this.container = container
    }

    getDefaultParent() {
      return { id: 'layer-0' }
    }

    insertVertex(
      _parent: any,
      id: string | null,
      value: any,
      x: number,
      y: number,
      width: number,
      height: number,
      style?: string
    ) {
      const cellId = id ?? `cell-${cellCounter++}`
      const cell = new MockCell(cellId, value, true, false)
      cell.geometry = { x, y, width, height }
      if (style) cell.style = style
      cellsMap[cellId] = cell
      return cell
    }

    insertEdge(
      _parent: any,
      id: string | null,
      value: any,
      source: any,
      target: any,
      style?: string
    ) {
      const edgeId = id ?? `edge-${cellCounter++}`
      const cell = new MockCell(edgeId, value, false, true)
      cell.geometry = { source, target }
      if (style) cell.style = style
      cellsMap[edgeId] = cell
      return cell
    }

    getSelectionCells() {
      return currentSelection
    }

    setSelectionCell(cell: any) {
      currentSelection = [cell]
      selectionListeners.forEach(fn => fn())
    }

    clearSelection() {
      currentSelection = []
      selectionListeners.forEach(fn => fn())
    }

    getSelectionModel() {
      return selectionModel
    }

    removeCells(cells: any[]) {
      cells.forEach(c => delete cellsMap[c.id])
      currentSelection = []
      selectionListeners.forEach(fn => fn())
      return cells
    }

    zoomIn() { currentScale *= 1.2 }
    zoomOut() { currentScale /= 1.2 }
    zoomActual() { currentScale = 1.0 }
    fit() { currentScale = 0.8 }

    setConnectable = vi.fn()
    setCellsMovable = vi.fn()
    setCellsResizable = vi.fn()
    setCellsEditable = vi.fn()
    setDropEnabled = vi.fn()
    setPanning = vi.fn()
    setTooltips = vi.fn()
    setEnabled = vi.fn()
    getModel() { return model }
    getView() { return view }
    destroy = vi.fn()
  }

  class MockUndoManager {
    history: any[] = []
    undoIndex = 0
    canUndo() { return this.history.length > 0 }
    canRedo() { return false }
    undo = vi.fn()
    redo = vi.fn()
    clear = vi.fn()
    undoableEditHappened(edit: any) { this.history.push(edit) }
  }

  class MockRubberband {
    destroy = vi.fn()
  }

  return {
    MockGraph,
    MockUndoManager,
    MockRubberband
  }
}

describe('GraphController', () => {
  let container: HTMLElement
  let controller: GraphController

  beforeEach(() => {
    const mocks = createMockMxGraph()
    // Configurar globales de window
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).window.mxGraph = mocks.MockGraph
    ;(globalThis as any).window.mxUndoManager = mocks.MockUndoManager
    ;(globalThis as any).window.mxRubberband = mocks.MockRubberband

    container = { id: 'test-container' } as unknown as HTMLElement
    controller = new GraphController(container)
  })

  it('inicializa mxGraph con las opciones por defecto', () => {
    expect(controller.getRawGraph()).toBeDefined()
    expect(controller.getZoom()).toBe(100)
  })

  it('addVertex crea un vértice en el grafo', () => {
    const node = controller.addVertex({
      label: 'Nodo Prueba',
      x: 100,
      y: 150,
      width: 140,
      height: 70
    })

    expect(node).toBeDefined()
    expect(node.value).toBe('Nodo Prueba')
    expect(node.vertex).toBe(true)
    expect(node.geometry?.x).toBe(100)
    expect(node.geometry?.y).toBe(150)
  })

  it('addEdge conecta dos vértices existentes', () => {
    const v1 = controller.addVertex({ label: 'Origen', x: 50, y: 50 })
    const v2 = controller.addVertex({ label: 'Destino', x: 250, y: 50 })

    const edge = controller.addEdge(v1.id, v2.id, 'Conexión')

    expect(edge).not.toBeNull()
    expect(edge?.edge).toBe(true)
    expect(edge?.value).toBe('Conexión')
  })

  it('addEdge retorna null si algún nodo no existe', () => {
    const edge = controller.addEdge('inexistente-1', 'inexistente-2')
    expect(edge).toBeNull()
  })

  it('removeSelected elimina las celdas seleccionadas', () => {
    const v1 = controller.addVertex({ label: 'Eliminar', x: 0, y: 0 })
    controller.selectCell(v1.id)

    expect(controller.getSelectedCellIds()).toContain(v1.id)

    const removed = controller.removeSelected()
    expect(removed.length).toBe(1)
    expect(controller.getSelectedCellIds().length).toBe(0)
  })

  it('controla el zoom adecuadamente (zoomIn, zoomOut, resetZoom, fit)', () => {
    expect(controller.getZoom()).toBe(100)

    controller.zoomIn()
    expect(controller.getZoom()).toBe(120)

    controller.zoomOut()
    expect(controller.getZoom()).toBe(100)

    controller.fit()
    expect(controller.getZoom()).toBe(80)

    controller.resetZoom()
    expect(controller.getZoom()).toBe(100)
  })

  it('notifica cambios de selección con onSelectionChange', () => {
    const callback = vi.fn()
    const unsubscribe = controller.onSelectionChange(callback)

    const v1 = controller.addVertex({ label: 'A', x: 10, y: 10 })
    controller.selectCell(v1.id)

    expect(callback).toHaveBeenCalledWith([v1.id], expect.any(Array))

    controller.clearSelection()
    expect(callback).toHaveBeenCalledWith([], [])

    unsubscribe()
  })

  it('destruye la instancia limpiamente', () => {
    controller.destroy()
    expect(controller.getRawGraph().destroy).toHaveBeenCalled()
  })
})
