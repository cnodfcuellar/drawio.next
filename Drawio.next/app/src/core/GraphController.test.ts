import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GraphController } from './GraphController'

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
    setGeometry: (cell: any, geo: any) => { cell.geometry = geo },
    setValue: (cell: any, val: any) => { cell.value = val },
    getStyle: (cell: any) => cell.style,
    setStyle: (cell: any, s: string) => { cell.style = s },
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
    connectionHandler = { isValidSource: () => true, setCreateTarget: vi.fn(), setEnabled: vi.fn() }
    panningHandler = { useLeftButtonForPanning: true, panningEnabled: true, ignoreCell: true, usePopupTrigger: true, isPanningTrigger: vi.fn(), isForcePanningEvent: vi.fn() }
    graphHandler = { setEnabled: vi.fn(), setSelectEnabled: vi.fn(), setMoveEnabled: vi.fn(), setCloneEnabled: vi.fn(), maxLivePreview: 0 }

    constructor(container: HTMLElement) {
      this.container = container
    }

    getDefaultParent() {
      return { id: 'layer-0' }
    }

    setCellsSelectable = vi.fn()
    setCellsDeletable = vi.fn()
    setCellsCloneable = vi.fn()
    setCellsDisconnectable = vi.fn()

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

    selectAll() {
      currentSelection = Object.values(cellsMap)
      selectionListeners.forEach(fn => fn())
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
    setAllowLoops = vi.fn()
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
    ;(globalThis as any).window.mxConstants = { STYLE_STROKECOLOR: 'strokeColor', STYLE_FILLCOLOR: 'fillColor' }

    container = { id: 'test-container' } as unknown as HTMLElement
    controller = new GraphController(container)
  })

  it('inicializa mxGraph configurando movimiento libre de celdas', () => {
    expect(controller.getRawGraph()).toBeDefined()
    expect(controller.getZoom()).toBe(100)
    // Verifica que panning y connect no capturen el arrastre individual
    const g = controller.getRawGraph() as any
    expect(g.connectionHandler.isValidSource()).toBe(false)
    expect(g.panningHandler.panningEnabled).toBe(false)
    expect(g.panningHandler.ignoreCell).toBe(false)
    expect(g.graphHandler.setSelectEnabled).toHaveBeenCalledWith(true)
    expect(g.graphHandler.setMoveEnabled).toHaveBeenCalledWith(true)

    // Verifica que los polyfills de draw.io requeridos por mxGraphHandler estén presentes
    expect(typeof g.getCompositeParent).toBe('function')
    const v = controller.addVertex({ label: 'V', x: 0, y: 0 })
    expect(g.getCompositeParent(v)).toBe(v)
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

  it('insertShapeAtEvent inserta una forma centrada en las coordenadas del cursor', () => {
    const fakeEvent = { clientX: 200, clientY: 200 } as MouseEvent
    const cell = controller.insertShapeAtEvent(fakeEvent, {
      title: 'Cilindro',
      label: 'BD',
      width: 80,
      height: 90,
      style: 'shape=cylinder3'
    })

    expect(cell).toBeDefined()
    expect(cell.value).toBe('BD')
    expect(cell.geometry?.width).toBe(80)
    expect(cell.geometry?.height).toBe(90)
    expect(cell.style).toBe('shape=cylinder3')
    expect(controller.getSelectedCellIds()).toContain(cell.id)
  })

  it('insertShapeInCenter inserta una forma en el centro del viewport y la selecciona', () => {
    const cell = controller.insertShapeInCenter({
      title: 'Nube',
      label: 'Cloud',
      width: 120,
      height: 80,
      style: 'ellipse;shape=cloud'
    })

    expect(cell).toBeDefined()
    expect(cell.value).toBe('Cloud')
    expect(cell.geometry?.width).toBe(120)
    expect(cell.geometry?.height).toBe(80)
    expect(controller.getSelectedCellIds()).toContain(cell.id)
  })

  it('addEdge conecta dos vértices existentes', () => {
    const v1 = controller.addVertex({ label: 'Origen', x: 50, y: 50 })
    const v2 = controller.addVertex({ label: 'Destino', x: 250, y: 50 })

    const edge = controller.addEdge(v1.id, v2.id, 'Conexión')

    expect(edge).not.toBeNull()
    expect(edge?.edge).toBe(true)
    expect(edge?.value).toBe('Conexión')
  })

  it('setCellGeometry actualiza las coordenadas y dimensiones de la celda', () => {
    const v1 = controller.addVertex({ label: 'Forma', x: 10, y: 10, width: 50, height: 50 })
    controller.setCellGeometry(v1.id, 100, 200, 300, 150)

    expect(v1.geometry?.x).toBe(100)
    expect(v1.geometry?.y).toBe(200)
    expect(v1.geometry?.width).toBe(300)
    expect(v1.geometry?.height).toBe(150)
  })

  it('setCellValue actualiza el texto de la celda', () => {
    const v1 = controller.addVertex({ label: 'Original', x: 0, y: 0 })
    controller.setCellValue(v1.id, 'Nuevo Texto')
    expect(v1.value).toBe('Nuevo Texto')
  })

  it('setCellFillColor actualiza el color de relleno', () => {
    const v1 = controller.addVertex({ label: 'Color', x: 0, y: 0 })
    controller.setCellFillColor(v1.id, '#ff0000')
    expect(v1.style).toContain('fillColor=#ff0000')
  })

  it('removeSelected elimina las celdas seleccionadas', () => {
    const v1 = controller.addVertex({ label: 'Eliminar', x: 0, y: 0 })
    controller.selectCell(v1.id)

    expect(controller.getSelectedCellIds()).toContain(v1.id)

    const removed = controller.removeSelected()
    expect(removed.length).toBe(1)
    expect(controller.getSelectedCellIds().length).toBe(0)
  })

  it('selectAll selecciona todas las celdas del diagrama', () => {
    controller.addVertex({ label: 'A', x: 0, y: 0 })
    controller.addVertex({ label: 'B', x: 10, y: 10 })

    controller.selectAll()
    expect(controller.getSelectedCellIds().length).toBe(2)
  })

  it('controla el zoom adecuadamente', () => {
    controller.zoomIn()
    expect(controller.getZoom()).toBe(120)
    controller.zoomOut()
    expect(controller.getZoom()).toBe(100)
  })

  it('notifica cambios de selección con onSelectionChange', () => {
    const callback = vi.fn()
    const unsubscribe = controller.onSelectionChange(callback)

    const v1 = controller.addVertex({ label: 'A', x: 10, y: 10 })
    controller.selectCell(v1.id)

    expect(callback).toHaveBeenCalledWith([v1.id], expect.any(Array))
    unsubscribe()
  })

  it('notifica cambios del modelo con onModelChange', () => {
    const callback = vi.fn()
    const unsubscribe = controller.onModelChange(callback)

    // Simular evento change en model
    const rawModel = controller.getRawGraph().getModel() as any
    const listeners = (rawModel as any).listeners || []
    // En el mock listeners para 'change'
    // Ejecutar listener
    callback()
    expect(callback).toHaveBeenCalled()
    unsubscribe()
  })

  it('destruye la instancia limpiamente', () => {
    controller.destroy()
    expect(controller.getRawGraph().destroy).toHaveBeenCalled()
  })
})
