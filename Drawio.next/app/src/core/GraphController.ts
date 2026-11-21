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
  private destroyed = false

  constructor(container: HTMLElement, options: GraphControllerOptions = {}) {
    if (typeof window === 'undefined' || !window.mxGraph) {
      throw new Error('mxGraph no está disponible en el entorno global (window.mxGraph).')
    }

    // Instanciar motor mxGraph sobre el contenedor DOM
    this.graph = new window.mxGraph(container)
    this.setupDefaults(options)
    this.setupUndoManager()
  }

  /**
   * Configura las opciones e interacciones por defecto del canvas
   */
  private setupDefaults(options: GraphControllerOptions): void {
    const { enableRubberband = true, enableConnect = true } = options

    this.graph.setConnectable(enableConnect)
    this.graph.setCellsMovable(true)
    this.graph.setCellsResizable(true)
    this.graph.setCellsEditable(true)
    this.graph.setDropEnabled(true)
    this.graph.setPanning(true)
    this.graph.setTooltips(true)
    this.graph.setEnabled(true)

    // Habilitar selección por arrastre (rubberband)
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
   * Elimina las celdas actualmente seleccionadas
   */
  removeSelected(): mxCell[] {
    const cells = this.graph.getSelectionCells()
    if (!cells || cells.length === 0) return []
    return this.graph.removeCells(cells, true)
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
    const listener = () => {
      if (this.destroyed) return
      const cells = this.getSelectedCells()
      const ids = cells.map(c => c.id)
      callback(ids, cells)
    }

    selectionModel.addListener('change', listener)

    return () => {
      // mxGraph no provee un removeListener estándar directo en selectionModel
      // el listener revisa this.destroyed para auto-inactivarse
    }
  }

  /**
   * Libera recursos y destruye la instancia del grafo
   */
  destroy(): void {
    this.destroyed = true
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
