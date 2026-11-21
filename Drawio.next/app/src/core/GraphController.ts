import type {
  mxGraph,
  mxCell,
  mxUndoManager,
  mxRubberband,
  mxEventObject
} from './types/mxgraph'

export interface AddVertexOptions {
  id?: string
  label?: string
  x: number
  y: number
  width?: number
  height?: number
  style?: string
}

export interface GraphControllerOptions {
  enableRubberband?: boolean
  enableConnect?: boolean
}

/**
 * GraphController — Capa de abstracción limpia sobre mxGraph
 *
 * Provee una API moderna, tipada en TypeScript y desacoplada de la UI
 * para interactuar con el motor gráfico de draw.io.
 */
export class GraphController {
  private graph: mxGraph
  private undoManager: mxUndoManager | null = null
  private rubberband: mxRubberband | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private destroyed = false

  constructor(container: HTMLElement, options: GraphControllerOptions = {}) {
    if (typeof window === 'undefined' || !window.mxGraph) {
      throw new Error('mxGraph no está disponible en el entorno global (window.mxGraph).')
    }

    // Parche de compatibilidad: draw.io mxClient espera isSpecialColor en mxGraph.prototype
    const proto = window.mxGraph.prototype as any
    if (!proto.isSpecialColor) {
      proto.isSpecialColor = function (color: string) {
        if (!color) return false
        const special = [
          window.mxConstants?.STYLE_STROKECOLOR || 'strokeColor',
          window.mxConstants?.STYLE_FILLCOLOR || 'fillColor',
          'inherit',
          'swimlane',
          'indicated'
        ]
        return special.indexOf(color) >= 0
      }
    }

    // Instanciar motor mxGraph sobre el contenedor DOM
    this.graph = new window.mxGraph(container)
    ;(this.graph as any).isSpecialColor = proto.isSpecialColor

    this.setupDefaults(options)
    this.setupUndoManager()
    this.setupKeyHandler()
  }

  /**
   * Configura las opciones e interacciones por defecto del canvas
   */
  private setupDefaults(options: GraphControllerOptions): void {
    const { enableRubberband = true } = options

    // 1. Habilitar interacción y manipulación completa de celdas
    this.graph.setEnabled(true)
    this.graph.setCellsSelectable(true)
    this.graph.setCellsMovable(true)
    this.graph.setCellsResizable(true)
    this.graph.setCellsEditable(true)
    if ((this.graph as any).setCellsDeletable) {
      (this.graph as any).setCellsDeletable(true)
    }
    if ((this.graph as any).setCellsCloneable) {
      (this.graph as any).setCellsCloneable(false)
    }
    if ((this.graph as any).setCellsDisconnectable) {
      (this.graph as any).setCellsDisconnectable(false)
    }
    this.graph.setDropEnabled(true)
    this.graph.setTooltips(true)
    this.graph.setAllowLoops(true)

    // 2. Desactivar PanningHandler para que NO capture los eventos de ratón
    // ¡CRÍTICO! Si ignoreCell es true, mxGraph activa forcePanning en cualquier mousedown,
    // consumiendo el evento (me.consume()) y trasladando todo el lienzo ("se mueven todos").
    const anyGraph = this.graph as any
    if (anyGraph.panningHandler) {
      anyGraph.panningHandler.panningEnabled = false
      anyGraph.panningHandler.useLeftButtonForPanning = false
      anyGraph.panningHandler.usePopupTrigger = false
      anyGraph.panningHandler.ignoreCell = false
      anyGraph.panningHandler.isPanningTrigger = () => false
      anyGraph.panningHandler.isForcePanningEvent = () => false
    }

    // 3. Configurar graphHandler para mover y seleccionar celdas individuales
    if (anyGraph.graphHandler) {
      anyGraph.graphHandler.setEnabled(true)
      anyGraph.graphHandler.setSelectEnabled(true)
      anyGraph.graphHandler.setMoveEnabled(true)
      anyGraph.graphHandler.setCloneEnabled(false)
      anyGraph.graphHandler.maxLivePreview = 16
    }

    // 4. Desactivar ConnectionHandler (hasta habilitar el modo explícito de conexión)
    // para que el click en el nodo seleccione/mueva en vez de iniciar aristas accidentales
    this.graph.setConnectable(false)
    if (anyGraph.connectionHandler) {
      anyGraph.connectionHandler.setEnabled(false)
      anyGraph.connectionHandler.isValidSource = () => false
      anyGraph.connectionHandler.setCreateTarget(false)
    }

    // 5. Habilitar selección rectangular (rubberband) en áreas vacías
    if (enableRubberband && window.mxRubberband) {
      this.rubberband = new window.mxRubberband(this.graph)
    }
  }

  /**
   * Configura el gestor de deshacer/rehacer con mxUndoManager
   */
  private setupUndoManager(): void {
    if (!window.mxUndoManager) return

    this.undoManager = new window.mxUndoManager(50)

    const listener = (_sender: any, evt: mxEventObject) => {
      const edit = evt.getProperty('edit')
      if (edit && this.undoManager) {
        this.undoManager.undoableEditHappened(edit)
      }
    }

    this.graph.getModel().addListener('undo', listener)
  }

  /**
   * Configura atajos de teclado globales (Delete, Backspace, Ctrl+Z, Ctrl+Y, Ctrl+A)
   */
  private setupKeyHandler(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return

    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.destroyed) return

      // Si el foco está en un input o textarea editable, no interceptar
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      // Borrar celda seleccionada con tecla Supr o Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.getSelectedCells().length > 0) {
          e.preventDefault()
          this.removeSelected()
        }
      }
      // Ctrl+Z / Cmd+Z (Undo) y Ctrl+Shift+Z (Redo)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          this.redo()
        } else {
          this.undo()
        }
      }
      // Ctrl+Y / Cmd+Y (Redo)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        this.redo()
      }
      // Ctrl+A / Cmd+A (Seleccionar todo)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        this.selectAll()
      }
    }

    window.addEventListener('keydown', this.keydownHandler)
  }

  /**
   * Obtiene la instancia subyacente de mxGraph
   */
  getRawGraph(): mxGraph {
    return this.graph
  }

  /**
   * Añade un nuevo vértice (nodo / forma) al grafo
   */
  addVertex(opts: AddVertexOptions): mxCell {
    const parent = this.graph.getDefaultParent()
    const width = opts.width ?? 120
    const height = opts.height ?? 60
    const label = opts.label ?? ''
    const style = opts.style ?? 'rounded=1;whiteSpace=wrap;html=1;'

    this.graph.getModel().beginUpdate()
    try {
      return this.graph.insertVertex(
        parent,
        opts.id ?? null,
        label,
        opts.x,
        opts.y,
        width,
        height,
        style
      )
    } finally {
      this.graph.getModel().endUpdate()
    }
  }

  /**
   * Conecta dos nodos existentes con una arista (edge / conector)
   */
  addEdge(sourceId: string, targetId: string, label = '', style = ''): mxCell | null {
    const model = this.graph.getModel()
    const source = model.getCell(sourceId)
    const target = model.getCell(targetId)

    if (!source || !target) {
      return null
    }

    const parent = this.graph.getDefaultParent()
    model.beginUpdate()
    try {
      return this.graph.insertEdge(parent, null, label, source, target, style)
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Modifica la geometría (posición y tamaño) de una celda
   */
  setCellGeometry(cellId: string, x: number, y: number, width: number, height: number): void {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell || !cell.geometry) return

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      const geo = (window.mxUtils ? window.mxUtils.clone(cell.geometry) : { ...cell.geometry })
      geo.x = x
      geo.y = y
      geo.width = width
      geo.height = height
      model.setGeometry(cell, geo)
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Modifica el valor textual / label de una celda
   */
  setCellValue(cellId: string, value: any): void {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell) return

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      model.setValue(cell, value)
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Modifica el color de relleno de una celda
   */
  setCellFillColor(cellId: string, color: string): void {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell) return

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      let currentStyle = model.getStyle(cell) || ''
      if (currentStyle.includes('fillColor=')) {
        currentStyle = currentStyle.replace(/fillColor=[^;]+/, `fillColor=${color}`)
      } else {
        currentStyle += `;fillColor=${color}`
      }
      model.setStyle(cell, currentStyle)
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Elimina las celdas actualmente seleccionadas
   */
  removeSelected(): mxCell[] {
    const cells = this.graph.getSelectionCells()
    if (!cells || cells.length === 0) return []
    return this.graph.removeCells(cells, true)
  }

  /**
   * Selecciona todas las celdas del diagrama
   */
  selectAll(): void {
    const anyGraph = this.graph as any
    if (anyGraph.selectAll) {
      anyGraph.selectAll()
    } else {
      const parent = this.graph.getDefaultParent()
      const model = this.graph.getModel() as any
      if (model.getChildCells) {
        this.graph.setSelectionCells(model.getChildCells(parent, true, true))
      }
    }
  }

  /**
   * Deshace la última acción
   */
  undo(): boolean {
    if (this.undoManager && this.undoManager.canUndo()) {
      this.undoManager.undo()
      return true
    }
    return false
  }

  /**
   * Rehace la última acción deshecha
   */
  redo(): boolean {
    if (this.undoManager && this.undoManager.canRedo()) {
      this.undoManager.redo()
      return true
    }
    return false
  }

  canUndo(): boolean {
    return !!this.undoManager && this.undoManager.canUndo()
  }

  canRedo(): boolean {
    return !!this.undoManager && this.undoManager.canRedo()
  }

  /**
   * Control de Zoom
   */
  zoomIn(): void {
    this.graph.zoomIn()
  }

  zoomOut(): void {
    this.graph.zoomOut()
  }

  resetZoom(): void {
    this.graph.zoomActual()
  }

  fit(): void {
    this.graph.fit()
  }

  getZoom(): number {
    return Math.round(this.graph.getView().getScale() * 100)
  }

  /**
   * Selección
   */
  getSelectedCells(): mxCell[] {
    return this.graph.getSelectionCells() ?? []
  }

  getSelectedCellIds(): string[] {
    return this.getSelectedCells().map(cell => cell.id)
  }

  selectCell(id: string): void {
    const cell = this.graph.getModel().getCell(id)
    if (cell) {
      this.graph.setSelectionCell(cell)
    }
  }

  clearSelection(): void {
    this.graph.clearSelection()
  }

  /**
   * Registra un callback que se ejecuta cuando cambia la selección en el canvas.
   * Retorna una función para cancelar la suscripción.
   */
  onSelectionChange(callback: (ids: string[], cells: mxCell[]) => void): () => void {
    const selectionModel = this.graph.getSelectionModel()
    const changeEvent = (window.mxEvent && window.mxEvent.CHANGE) || 'change'
    const listener = () => {
      if (this.destroyed) return
      const cells = this.getSelectedCells()
      const ids = cells.map(c => c.id)
      callback(ids, cells)
    }

    selectionModel.addListener(changeEvent, listener)

    return () => {
      if ((selectionModel as any).removeListener) {
        ;(selectionModel as any).removeListener(listener)
      }
    }
  }

  /**
   * Registra un callback que se ejecuta cuando el modelo del grafo cambia (geometría, valores, etc.)
   */
  onModelChange(callback: () => void): () => void {
    const model = this.graph.getModel()
    const changeEvent = (window.mxEvent && window.mxEvent.CHANGE) || 'change'
    const listener = () => {
      if (this.destroyed) return
      callback()
    }

    model.addListener(changeEvent, listener)

    return () => {
      if ((model as any).removeListener) {
        ;(model as any).removeListener(listener)
      }
    }
  }

  /**
   * Libera recursos y destruye la instancia del grafo
   */
  destroy(): void {
    this.destroyed = true
    if (this.keydownHandler && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }
    if (this.rubberband) {
      this.rubberband.destroy()
      this.rubberband = null
    }
    if (this.undoManager) {
      this.undoManager.clear()
      this.undoManager = null
    }
    this.graph.destroy()
  }
}
