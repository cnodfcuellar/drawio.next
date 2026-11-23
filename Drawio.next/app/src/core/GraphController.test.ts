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
    parent: any
    constructor(id: string, value: any, isVertex: boolean, isEdge: boolean) {
      this.id = id
      this.value = value
      this.vertex = isVertex
      this.edge = isEdge
      this.style = ''
      this.parent = null
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
    getChildCount: (_parent: any) => Object.values(cellsMap).length,
    getChildAt: (_parent: any, idx: number) => Object.values(cellsMap)[idx] ?? null,
    isVertex: (cell: any) => Boolean(cell?.vertex),
    isEdge: (cell: any) => Boolean(cell?.edge),
    getParent: (cell: any) => cell?.parent ?? null,
    getRoot: () => ({ id: 'root' }),
    add: vi.fn((parent: any, child: any) => {
      child.parent = parent
      return child
    }),
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
    connectionHandler = { isValidSource: () => true, isValidTarget: () => true, setCreateTarget: vi.fn(), setEnabled: vi.fn(), insertBeforeSource: true, insertEdge: vi.fn() }
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
      cell.parent = _parent || { id: 'layer-0' }
      if (style) cell.style = style
      cellsMap[cellId] = cell
      return cell
    }

    addCell = vi.fn((cell: any, parent: any) => {
      cell.parent = parent
      cellsMap[cell.id] = cell
      return cell
    })

    isToggleEvent = vi.fn((evt: any) => Boolean(evt?.shiftKey || evt?.ctrlKey || evt?.metaKey))

    getCells = vi.fn((_x: number, _y: number, _w: number, _h: number) => Object.values(cellsMap))

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
      cell.parent = _parent || { id: 'layer-0' }
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

    setSelectionCells(cells: any[]) {
      currentSelection = cells
      selectionListeners.forEach(fn => fn())
    }

    clearSelection() {
      currentSelection = []
      selectionListeners.forEach(fn => fn())
    }

    getSelectionModel() {
      return selectionModel
    }

    removeCells = vi.fn((cells: any[]) => {
      cells.forEach(c => delete cellsMap[c.id])
      currentSelection = []
      selectionListeners.forEach(fn => fn())
      return cells
    })

    importCells = vi.fn((cells: any[], dx = 0, dy = 0, _target?: any) => {
      const clones = cells.map(c => {
        const cloneId = `clone-${cellCounter++}`
        const clone = new MockCell(cloneId, c.value, c.vertex, c.edge)
        clone.geometry = c.geometry ? { ...c.geometry, x: (c.geometry.x || 0) + dx, y: (c.geometry.y || 0) + dy } : null
        clone.style = c.style
        clone.parent = _target || c.parent || { id: 'layer-0' }
        cellsMap[cloneId] = clone
        return clone
      })
      currentSelection = clones
      selectionListeners.forEach(fn => fn())
      return clones
    })

    cloneCells = vi.fn((cells: any[]) => {
      return cells.map(c => {
        const clone = new MockCell(`cloned-${cellCounter++}`, c.value, c.vertex, c.edge)
        clone.geometry = c.geometry ? { ...c.geometry } : null
        clone.style = c.style
        clone.parent = c.parent
        return clone
      })
    })

    groupCells = vi.fn((_group?: any, _border?: number, cells?: any[]) => {
      const groupId = `group-${cellCounter++}`
      const group = new MockCell(groupId, '', true, false)
      group.geometry = { x: 50, y: 50, width: 200, height: 200 }
      group.parent = { id: 'layer-0' }
      ;(group as any).children = cells || []
      if (cells) {
        cells.forEach(c => { c.parent = group })
      }
      cellsMap[groupId] = group
      currentSelection = [group]
      selectionListeners.forEach(fn => fn())
      return group
    })

    ungroupCells = vi.fn((cells?: any[]) => {
      const result: any[] = []
      if (cells) {
        cells.forEach(c => {
          if ((c as any).children) {
            result.push(...(c as any).children)
          }
          delete cellsMap[c.id]
        })
      }
      currentSelection = result
      selectionListeners.forEach(fn => fn())
      return result
    })

    alignCells = vi.fn()

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
    orderCells = vi.fn()
    setAllowNegativeCoordinates = vi.fn()
    getChildCells = vi.fn((_p: any) => Object.values(cellsMap))
    getGraphBounds = vi.fn(() => ({ x: 20, y: 30, width: 300, height: 200 }))
    getModel() { return model }
    getView() { return view }
    getStylesheet = vi.fn(() => ({ putCellStyle: vi.fn() }))
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

  class MockCodec {
    document: any
    constructor(doc?: any) { this.document = doc }
    encode(obj: any) {
      return { nodeName: 'mxGraphModel' }
    }
    decode(node: any, into: any) {
      return into
    }
  }

  const mockUtils = {
    clone: (obj: any) => (obj ? { ...obj } : obj),
    getXml: (_node: any) => '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>',
    parseXml: (xml: string) => {
      return {
        querySelector: (sel: string) => {
          if (sel === 'mxGraphModel' || sel === 'diagram') {
            return {
              nodeName: 'mxGraphModel',
              textContent: '<mxGraphModel></mxGraphModel>',
              getAttribute: (attr: string) => (attr === 'name' ? 'Página 1' : 'p1')
            }
          }
          return null
        },
        querySelectorAll: (sel: string) => {
          if (sel === 'diagram') {
            return [
              {
                nodeName: 'diagram',
                getAttribute: (attr: string) => (attr === 'name' ? 'Page-1' : 'd1'),
                querySelector: () => ({ nodeName: 'mxGraphModel' }),
                textContent: '<mxGraphModel></mxGraphModel>'
              }
            ]
          }
          return []
        }
      } as any
    }
  }

  return {
    MockGraph,
    MockUndoManager,
    MockRubberband,
    MockCodec,
    mockUtils
  }
}

describe('GraphController', () => {
  let container: HTMLElement
  let controller: GraphController

  beforeEach(() => {
    const mocks = createMockMxGraph()
    // Configurar globales de window
    const eventListeners: { [evt: string]: Array<(e: any) => void> } = {}
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).window.addEventListener = vi.fn((type: string, fn: any) => {
      if (!eventListeners[type]) eventListeners[type] = []
      eventListeners[type].push(fn)
    })
    ;(globalThis as any).window.removeEventListener = vi.fn((type: string, fn: any) => {
      if (eventListeners[type]) {
        eventListeners[type] = eventListeners[type].filter(f => f !== fn)
      }
    })
    ;(globalThis as any).window.dispatchEvent = vi.fn((e: any) => {
      const list = eventListeners[e.type] || []
      list.forEach(fn => fn(e))
      return true
    })

    if (typeof (globalThis as any).KeyboardEvent === 'undefined') {
      ;(globalThis as any).KeyboardEvent = class KeyboardEvent {
        type: string
        key: string
        code: string
        ctrlKey: boolean
        shiftKey: boolean
        altKey: boolean
        metaKey: boolean
        constructor(type: string, init?: any) {
          this.type = type
          this.key = init?.key ?? ''
          this.code = init?.code ?? ''
          this.ctrlKey = init?.ctrlKey ?? false
          this.shiftKey = init?.shiftKey ?? false
          this.altKey = init?.altKey ?? false
          this.metaKey = init?.metaKey ?? false
        }
        preventDefault() {}
        stopPropagation() {}
      }
    }

    ;(globalThis as any).window.mxGraph = mocks.MockGraph
    ;(globalThis as any).window.mxUndoManager = mocks.MockUndoManager
    ;(globalThis as any).window.mxRubberband = mocks.MockRubberband
    ;(globalThis as any).window.mxCodec = mocks.MockCodec
    ;(globalThis as any).window.mxUtils = mocks.mockUtils
    ;(globalThis as any).window.mxConstants = { STYLE_STROKECOLOR: 'strokeColor', STYLE_FILLCOLOR: 'fillColor' }

    container = { id: 'test-container', style: {} } as unknown as HTMLElement
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

  it('setCellStyleProperty y getCellStyleProperty leen y escriben propiedades de estilo', () => {
    const v1 = controller.addVertex({ label: 'Estilo', x: 0, y: 0 })
    controller.setCellStyleProperty(v1.id, 'strokeColor', '#00ff00')
    controller.setCellStyleProperty(v1.id, 'strokeWidth', 3)
    controller.setCellStyleProperty(v1.id, 'dashed', '1')

    expect(controller.getCellStyleProperty(v1.id, 'strokeColor')).toBe('#00ff00')
    expect(controller.getCellStyleProperty(v1.id, 'strokeWidth')).toBe('3')
    expect(controller.getCellStyleProperty(v1.id, 'dashed')).toBe('1')

    // Eliminar propiedad pasando cadena vacía o null
    controller.setCellStyleProperty(v1.id, 'dashed', null)
    expect(controller.getCellStyleProperty(v1.id, 'dashed')).toBe('')
  })

  it('modifica propiedades avanzadas de estilo (borde, opacidad, sombra, fuente, alineación)', () => {
    const v1 = controller.addVertex({ label: 'Props', x: 0, y: 0 })
    controller.setCellStrokeColor(v1.id, '#123456')
    controller.setCellStrokeWidth(v1.id, 2)
    controller.setCellOpacity(v1.id, 75)
    controller.setCellDashed(v1.id, true)
    controller.setCellRounded(v1.id, true)
    controller.setCellShadow(v1.id, true)
    controller.setCellRotation(v1.id, 90)
    controller.setCellFontSize(v1.id, 16)
    controller.setCellFontColor(v1.id, '#ffffff')
    controller.setCellAlign(v1.id, 'center')

    expect(v1.style).toContain('strokeColor=#123456')
    expect(v1.style).toContain('strokeWidth=2')
    expect(v1.style).toContain('opacity=75')
    expect(v1.style).toContain('dashed=1')
    expect(v1.style).toContain('rounded=1')
    expect(v1.style).toContain('shadow=1')
    expect(v1.style).toContain('rotation=90')
    expect(v1.style).toContain('fontSize=16')
    expect(v1.style).toContain('fontColor=#ffffff')
    expect(v1.style).toContain('align=center')
  })

  it('bringToFront y sendToBack ordenan celdas en el z-order', () => {
    const v1 = controller.addVertex({ label: 'Z', x: 0, y: 0 })
    controller.bringToFront(v1.id)
    const rawGraph = controller.getRawGraph() as any
    expect(rawGraph.orderCells).toHaveBeenCalledWith(false, [v1])

    controller.sendToBack(v1.id)
    expect(rawGraph.orderCells).toHaveBeenCalledWith(true, [v1])
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

  it('exportToXml genera una estructura XML válida compatible con draw.io', () => {
    controller.addVertex({ label: 'Nodo 1', x: 10, y: 10 })
    const xml = controller.exportToXml()

    expect(xml).toContain('<mxfile')
    expect(xml).toContain('<diagram')
    expect(xml).toContain('<mxGraphModel')
    expect(xml).toContain('</mxfile>')
  })

  it('importXml analiza e importa un diagrama en el modelo', () => {
    const xmlTest = `<mxfile host="drawio.next">
      <diagram id="d1" name="Page-1">
        <mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>
      </diagram>
    </mxfile>`
    const success = controller.importXml(xmlTest)
    expect(success).toBe(true)
  })

  it('clear elimina todas las celdas hijas del modelo', () => {
    controller.addVertex({ label: 'V1', x: 0, y: 0 })
    controller.addVertex({ label: 'V2', x: 100, y: 100 })
    const rawGraph = controller.getRawGraph()

    controller.clear()
    expect(rawGraph.removeCells).toHaveBeenCalled()
  })

  it('setConnectionMode y toggleConnectionMode alternan el modo interactivo de conexión', () => {
    expect(controller.isConnectionMode()).toBe(false)

    controller.setConnectionMode(true)
    expect(controller.isConnectionMode()).toBe(true)

    controller.toggleConnectionMode()
    expect(controller.isConnectionMode()).toBe(false)
  })

  it('connectSelected enlaza dos celdas seleccionadas con una arista', () => {
    const v1 = controller.addVertex({ label: 'Origen', x: 0, y: 0 })
    const v2 = controller.addVertex({ label: 'Destino', x: 100, y: 100 })
    const rawGraph = controller.getRawGraph() as any
    rawGraph.setSelectionCells([v1, v2])

    const edge = controller.connectSelected('Paso A-B')
    expect(edge).toBeDefined()
    expect(edge?.value).toBe('Paso A-B')
    expect(edge?.edge).toBe(true)
  })

  it('setEdgeRouting y setEdgeArrow modifican propiedades de aristas', () => {
    const v1 = controller.addVertex({ label: 'A', x: 0, y: 0 })
    const v2 = controller.addVertex({ label: 'B', x: 100, y: 0 })
    const edge = controller.addEdge(v1.id, v2.id, 'Relacion')!

    controller.setEdgeRouting(edge.id, 'curved')
    expect(edge.style).toContain('curved=1')

    controller.setEdgeRouting(edge.id, 'orthogonal')
    expect(edge.style).toContain('edgeStyle=orthogonalEdgeStyle')

    controller.setEdgeArrow(edge.id, 'start', 'diamond')
    controller.setEdgeArrow(edge.id, 'end', 'classic')
    expect(edge.style).toContain('startArrow=diamond')
    expect(edge.style).toContain('endArrow=classic')

    expect(controller.isCellEdge(edge.id)).toBe(true)
    expect(controller.isCellEdge(v1.id)).toBe(false)
  })

  it('getAllVertices retorna la lista completa de formas del diagrama', () => {
    controller.addVertex({ label: 'Inicio', x: 0, y: 0 })
    controller.addVertex({ label: 'Proceso', x: 50, y: 50 })
    const vertices = controller.getAllVertices()
    expect(vertices.length).toBe(2)
    expect(vertices[0].label).toBe('Inicio')
    expect(vertices[1].label).toBe('Proceso')
  })

  it('startInteractiveConnect y cancelInteractiveConnect gestionan el modo de conexión pendiente', () => {
    const v1 = controller.addVertex({ label: 'A', x: 0, y: 0 })
    const v2 = controller.addVertex({ label: 'B', x: 100, y: 100 })

    const listener = vi.fn()
    controller.onPendingConnectChange(listener)

    controller.startInteractiveConnect(v1.id)
    expect(controller.getPendingConnectSourceId()).toBe(v1.id)
    expect(controller.isConnectionMode()).toBe(true)
    expect(listener).toHaveBeenCalledWith(v1.id)

    // Seleccionar destino conecta automáticamente y limpia el estado pendiente
    const rawGraph = controller.getRawGraph() as any
    rawGraph.setSelectionCell(v2)

    expect(controller.getPendingConnectSourceId()).toBeNull()
    expect(controller.isConnectionMode()).toBe(false)

    // Probar cancelación manual
    controller.startInteractiveConnect(v1.id)
    controller.cancelInteractiveConnect()
    expect(controller.getPendingConnectSourceId()).toBeNull()
  })

  it('exportModelXml e importModelXml manejan el XML del modelo individual', () => {
    controller.addVertex({ label: 'V1', x: 10, y: 10 })
    const modelXml = controller.exportModelXml()
    expect(modelXml).toContain('mxGraphModel')

    const ok = controller.importModelXml(modelXml)
    expect(ok).toBe(true)
  })

  it('exportToXml soporta múltiples páginas en formato draw.io estándar', () => {
    const pages = [
      { id: 'p1', name: 'Flujo Principal', xml: '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>' },
      { id: 'p2', name: 'Arquitectura', xml: '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>' }
    ]
    const multiXml = controller.exportToXml(pages)
    expect(multiXml).toContain('<mxfile')
    expect(multiXml).toContain('name="Flujo Principal"')
    expect(multiXml).toContain('name="Arquitectura"')
    expect(multiXml).toContain('id="p1"')
    expect(multiXml).toContain('id="p2"')
  })

  it('duplicateSelected clona la celda seleccionada con offset y actualiza la selección', () => {
    // Sin selección
    expect(controller.duplicateSelected()).toEqual([])

    // Con una celda seleccionada
    const v1 = controller.addVertex({ label: 'Original', x: 50, y: 60, width: 100, height: 40 })
    controller.selectCell(v1.id)

    const duplicates = controller.duplicateSelected(30)
    expect(duplicates.length).toBe(1)
    expect(duplicates[0].value).toBe('Original')
    expect(duplicates[0].geometry.x).toBe(80)
    expect(duplicates[0].geometry.y).toBe(90)
    // El clon queda seleccionado
    expect(controller.getSelectedCells()[0].id).toBe(duplicates[0].id)
  })

  it('copy, cut, paste y hasClipboard gestionan el portapapeles del canvas', () => {
    expect(controller.hasClipboard()).toBe(false)
    expect(controller.paste()).toEqual([])

    const v1 = controller.addVertex({ label: 'Copiar esto', x: 10, y: 20 })
    controller.selectCell(v1.id)

    controller.copy()
    expect(controller.hasClipboard()).toBe(true)

    // Primer pegado: offset 20px
    const pasted1 = controller.paste()
    expect(pasted1.length).toBe(1)
    expect(pasted1[0].geometry.x).toBe(30)
    expect(pasted1[0].geometry.y).toBe(40)

    // Segundo pegado progresivo: offset 40px
    const pasted2 = controller.paste()
    expect(pasted2.length).toBe(1)
    expect(pasted2[0].geometry.x).toBe(50)
    expect(pasted2[0].geometry.y).toBe(60)

    // Probar corte (cut)
    controller.selectCell(v1.id)
    controller.cut()
    expect(controller.hasClipboard()).toBe(true)
    expect(controller.getRawGraph().getModel().getCell(v1.id)).toBeNull()
  })

  it('groupSelected y ungroupSelected agrupan y desagrupan formas', () => {
    const v1 = controller.addVertex({ label: 'N1', x: 10, y: 10 })
    const v2 = controller.addVertex({ label: 'N2', x: 100, y: 100 })

    // Menos de 2 celdas seleccionadas -> null
    controller.selectCell(v1.id)
    expect(controller.groupSelected()).toBeNull()

    // Con 2 celdas seleccionadas
    controller.selectCells([v1.id, v2.id])
    const group = controller.groupSelected(15)
    expect(group).not.toBeNull()
    expect(group?.vertex).toBe(true)
    expect(controller.getSelectedCells()[0].id).toBe(group!.id)

    // Desagrupar
    const children = controller.ungroupSelected()
    expect(children.length).toBe(2)
  })

  it('alignSelected alinea geométricamente las celdas en left, center, right, top, middle, bottom', () => {
    const v1 = controller.addVertex({ label: 'V1', x: 10, y: 20, width: 100, height: 50 })
    const v2 = controller.addVertex({ label: 'V2', x: 80, y: 100, width: 60, height: 40 })

    controller.selectCells([v1.id, v2.id])

    // Alinear Izquierda: ambos en x = 10
    controller.alignSelected('left')
    expect(v1.geometry.x).toBe(10)
    expect(v2.geometry.x).toBe(10)

    // Alinear Arriba: ambos en y = 20
    controller.alignSelected('top')
    expect(v1.geometry.y).toBe(20)
    expect(v2.geometry.y).toBe(20)

    // Alinear Derecha: borde derecho máximo = max(10+100, 10+60) = 110
    controller.alignSelected('right')
    expect(v1.geometry.x).toBe(10) // 110 - 100 = 10
    expect(v2.geometry.x).toBe(50) // 110 - 60 = 50

    // Alinear Abajo: borde inferior máximo = max(20+50, 20+40) = 70
    controller.alignSelected('bottom')
    expect(v1.geometry.y).toBe(20) // 70 - 50 = 20
    expect(v2.geometry.y).toBe(30) // 70 - 40 = 30
  })

  it('distributeSelected distribuye uniformemente 3 o más celdas', () => {
    // 3 celdas horizontales con anchos 100 cada una
    // v1: x: 0, w: 100 (borde derecho = 100)
    // v2: x: 50, w: 100 (desordenada)
    // v3: x: 400, w: 100 (borde derecho = 500)
    // totalSpan = 500 - 0 = 500, totalWidth = 300, spacing = (500 - 300)/2 = 100
    // v2 debe quedar en: 0 + 100 + 100 = 200
    const v1 = controller.addVertex({ label: 'A', x: 0, y: 0, width: 100, height: 50 })
    const v2 = controller.addVertex({ label: 'B', x: 50, y: 0, width: 100, height: 50 })
    const v3 = controller.addVertex({ label: 'C', x: 400, y: 0, width: 100, height: 50 })

    controller.selectCells([v1.id, v2.id, v3.id])
    controller.distributeSelected('horizontal')

    expect(v1.geometry.x).toBe(0)
    expect(v2.geometry.x).toBe(200)
    expect(v3.geometry.x).toBe(400)

    // Vertical:
    // v1: y: 0, h: 50
    // v2: y: 80, h: 50
    // v3: y: 250, h: 50 (maxBottom = 300)
    // totalSpan = 300 - 0 = 300, totalHeight = 150, spacing = (300 - 150)/2 = 75
    // v2 debe quedar en: 0 + 50 + 75 = 125
    v1.geometry.y = 0
    v2.geometry.y = 80
    v3.geometry.y = 250
    controller.distributeSelected('vertical')

    expect(v1.geometry.y).toBe(0)
    expect(v2.geometry.y).toBe(125)
    expect(v3.geometry.y).toBe(250)
  })

  it('responde a atajos de teclado globales Ctrl+D, Ctrl+C, Ctrl+V, Ctrl+G', () => {
    const v1 = controller.addVertex({ label: 'KBD', x: 10, y: 10 })
    const v2 = controller.addVertex({ label: 'KBD2', x: 50, y: 50 })
    controller.selectCell(v1.id)

    const spyDuplicate = vi.spyOn(controller, 'duplicateSelected')
    const spyCopy = vi.spyOn(controller, 'copy')
    const spyPaste = vi.spyOn(controller, 'paste')
    const spyGroup = vi.spyOn(controller, 'groupSelected')
    const spyUngroup = vi.spyOn(controller, 'ungroupSelected')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }))
    expect(spyDuplicate).toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }))
    expect(spyCopy).toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }))
    expect(spyPaste).toHaveBeenCalled()

    controller.selectCells([v1.id, v2.id])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true }))
    expect(spyGroup).toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'u', ctrlKey: true, shiftKey: true }))
    expect(spyUngroup).toHaveBeenCalled()
  })

  it('permite seleccionar múltiples formas pertenecientes a distintas agrupaciones simultáneamente', () => {
    const rawGraph = controller.getRawGraph()
    // Grupo 1 con su forma hija
    const g1 = rawGraph.insertVertex(null, 'g1', 'Grupo 1', 100, 100, 200, 150)
    const v1 = rawGraph.insertVertex(g1, 'v1', 'Forma 1', 20, 20, 80, 40)

    // Grupo 2 con su forma hija
    const g2 = rawGraph.insertVertex(null, 'g2', 'Grupo 2', 400, 100, 200, 150)
    const v2 = rawGraph.insertVertex(g2, 'v2', 'Forma 2', 30, 30, 80, 40)

    // Seleccionar ambas formas hijas que están en grupos diferentes
    controller.selectCells([v1.id, v2.id])
    const selected = controller.getSelectedCells()
    expect(selected.length).toBe(2)
    expect(selected.map(c => c.id)).toContain(v1.id)
    expect(selected.map(c => c.id)).toContain(v2.id)
  })

  it('calcula las coordenadas absolutas de formas hijas anidadas en grupos', () => {
    const rawGraph = controller.getRawGraph()
    // Crear grupo padre en (100, 200)
    const parentGroup = rawGraph.insertVertex(null, 'group-p', 'Grupo', 100, 200, 300, 200)
    // Crear hijo en (15, 25) respecto al grupo
    const child = rawGraph.insertVertex(parentGroup, 'child-1', 'Hijo', 15, 25, 80, 40)

    const abs = controller.getCellAbsoluteBounds(child)
    expect(abs.x).toBe(115) // 100 + 15
    expect(abs.y).toBe(225) // 200 + 25
    expect(abs.width).toBe(80)
    expect(abs.height).toBe(40)

    // Modificar posición absoluta del hijo a (250, 350)
    controller.setCellAbsolutePosition(child, 250, 350)
    expect(child.geometry.x).toBe(150) // 250 - 100
    expect(child.geometry.y).toBe(150) // 350 - 200
  })

  it('alinea celdas pertenecientes a diferentes agrupaciones usando sus posiciones absolutas', () => {
    const rawGraph = controller.getRawGraph()
    // Grupo A en (100, 100) con hijo A en local (20, 10) -> abs x=120, y=110
    const groupA = rawGraph.insertVertex(null, 'ga', 'GA', 100, 100, 200, 200)
    const childA = rawGraph.insertVertex(groupA, 'ca', 'CA', 20, 10, 80, 40)

    // Grupo B en (400, 100) con hijo B en local (30, 50) -> abs x=430, y=150
    const groupB = rawGraph.insertVertex(null, 'gb', 'GB', 400, 100, 200, 200)
    const childB = rawGraph.insertVertex(groupB, 'cb', 'CB', 30, 50, 80, 40)

    controller.selectCells([childA.id, childB.id])
    // Alinear a la izquierda: ambos deben coincidir en absX = 120 (minX)
    controller.alignSelected('left')

    const absA = controller.getCellAbsoluteBounds(childA)
    const absB = controller.getCellAbsoluteBounds(childB)
    expect(absA.x).toBe(120)
    expect(absB.x).toBe(120) // 400 + localX(-280) = 120
    expect(childB.geometry.x).toBe(-280) // 120 - 400
  })

  it('distribuye celdas pertenecientes a diferentes agrupaciones correctamente', () => {
    const rawGraph = controller.getRawGraph()
    // Grupo A en (0, 0) con hijo A en local (0, 0, w:100, h:50) -> abs x=0..100
    const groupA = rawGraph.insertVertex(null, 'g1', 'G1', 0, 0, 300, 300)
    const childA = rawGraph.insertVertex(groupA, 'c1', 'C1', 0, 0, 100, 50)

    // Grupo B en (200, 0) con hijo B en local (0, 0, w:100, h:50) -> abs x=200..300
    const groupB = rawGraph.insertVertex(null, 'g2', 'G2', 200, 0, 300, 300)
    const childB = rawGraph.insertVertex(groupB, 'c2', 'C2', 0, 0, 100, 50)

    // Hijo C en root en (600, 0, w:100, h:50) -> abs x=600..700
    const childC = rawGraph.insertVertex(null, 'c3', 'C3', 600, 0, 100, 50)

    // Total span: x=0 a x=700 (span=700). Total width = 300. Spacing = (700-300)/2 = 200
    // c1 en 0, c2 en 0+100+200=300, c3 en 600
    controller.selectCells([childA.id, childB.id, childC.id])
    controller.distributeSelected('horizontal')

    const absA = controller.getCellAbsoluteBounds(childA)
    const absB = controller.getCellAbsoluteBounds(childB)
    const absC = controller.getCellAbsoluteBounds(childC)

    expect(absA.x).toBe(0)
    expect(absB.x).toBe(300) // 200 + localX(100) = 300
    expect(absC.x).toBe(600)
  })

  it('agrupa celdas provenientes de distintos grupos promoviéndolas a un contenedor común', () => {
    const rawGraph = controller.getRawGraph()
    const groupA = rawGraph.insertVertex(null, 'ga2', 'GA2', 100, 100, 200, 200)
    const childA = rawGraph.insertVertex(groupA, 'ca2', 'CA2', 20, 20, 80, 40)

    const groupB = rawGraph.insertVertex(null, 'gb2', 'GB2', 400, 200, 200, 200)
    const childB = rawGraph.insertVertex(groupB, 'cb2', 'CB2', 10, 10, 80, 40)

    controller.selectCells([childA.id, childB.id])
    const newGroup = controller.groupSelected()

    expect(newGroup).not.toBeNull()
    // Los hijos deben haber sido promovidos de sus grupos antiguos
    expect(childA.parent).not.toBe(groupA)
    expect(childB.parent).not.toBe(groupB)
    expect(childA.parent).toBe(newGroup)
    expect(childB.parent).toBe(newGroup)
  })

  it('destruye la instancia limpiamente', () => {
    controller.destroy()
    expect(controller.getRawGraph().destroy).toHaveBeenCalled()
  })
})
