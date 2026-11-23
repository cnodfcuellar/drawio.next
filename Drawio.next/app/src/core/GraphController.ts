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
 * Estilo por defecto para aristas / conectores entre formas
 */
export const DEFAULT_EDGE_STYLE = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#6c8ebf;strokeWidth=2;endArrow=classic;endFill=1;'

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
  private connectionMode = false
  private connectionModeListeners: Array<(enabled: boolean) => void> = []
  private pendingConnectSourceId: string | null = null
  private pendingConnectListeners: Array<(sourceId: string | null) => void> = []
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null
  private cleanupPanning: (() => void) | null = null
  private clipboard: mxCell[] = []
  private pasteCount = 0
  private destroyed = false

  constructor(container: HTMLElement, options: GraphControllerOptions = {}) {
    if (typeof window === 'undefined' || !window.mxGraph) {
      throw new Error('mxGraph no está disponible en el entorno global (window.mxGraph).')
    }

    // Parche de compatibilidad: draw.io mxClient espera isSpecialColor, getCompositeParent, etc.
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

    if (!proto.isPart) {
      proto.isPart = function (cell: any) {
        if (!cell) return false
        const state = (this.view != null && typeof this.view.getState === 'function') ? this.view.getState(cell) : null
        const style = state != null ? state.style : (typeof this.getCellStyle === 'function' ? this.getCellStyle(cell) : null)
        return (style && style['part'] == '1') || false
      }
    }

    if (!proto.getCompositeParent) {
      proto.getCompositeParent = function (cell: any) {
        while (cell != null && typeof this.isPart === 'function' && this.isPart(cell)) {
          const model = typeof this.getModel === 'function' ? this.getModel() : this.model
          const temp = model != null ? model.getParent(cell) : null
          if (!model || typeof model.isVertex !== 'function' || !model.isVertex(temp)) break
          cell = temp
        }
        return cell
      }
    }

    if (!proto.getCompositeParents) {
      proto.getCompositeParents = function (cells: any[]) {
        if (!cells) return []
        const lookup: Record<string, boolean> = {}
        const newCells: any[] = []
        for (let i = 0; i < cells.length; i++) {
          const cell = this.getCompositeParent(cells[i])
          if (cell != null && !lookup[cell.id]) {
            lookup[cell.id] = true
            newCells.push(cell)
          }
        }
        return newCells
      }
    }

    // Instanciar motor mxGraph sobre el contenedor DOM
    this.graph = new window.mxGraph(container)
    ;(this.graph as any).isSpecialColor = proto.isSpecialColor
    ;(this.graph as any).isPart = proto.isPart
    ;(this.graph as any).getCompositeParent = proto.getCompositeParent
    ;(this.graph as any).getCompositeParents = proto.getCompositeParents

    this.setupDefaults(options)
    this.setupUndoManager()
    this.setupKeyHandler()
    this.setupSmoothPanning()
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
      (this.graph as any).setCellsCloneable(true)
    }
    if ((this.graph as any).setCellsDisconnectable) {
      (this.graph as any).setCellsDisconnectable(false)
    }
    this.graph.setDropEnabled(true)
    this.graph.setTooltips(true)
    this.graph.setAllowLoops(true)
    if ((this.graph as any).setAllowNegativeCoordinates) {
      (this.graph as any).setAllowNegativeCoordinates(false)
    }

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

    // 4. Configurar ConnectionHandler
    if (anyGraph.connectionHandler) {
      const ch = anyGraph.connectionHandler
      ch.setCreateTarget(false)
      ch.insertBeforeSource = true
      ch.outlineConnect = true

      // Interceptar isStartEvent para garantizar que el clic/arrastre sobre cualquier forma inicie la arista
      ch.isStartEvent = function (me: any) {
        if (!this.isEnabled()) return false

        let state = me.getState ? me.getState() : null
        if (!state && me.getGraphX && this.graph?.getCellAt) {
          const cell = this.graph.getCellAt(me.getGraphX(), me.getGraphY())
          if (cell && this.graph.getModel().isVertex(cell)) {
            state = this.graph.getView().getState(cell)
          }
        }

        if (state && this.graph.getModel().isVertex(state.cell)) {
          this.previous = state
          this.error = null
          return true
        }
        return false
      }

      // Interceptar mouseDown para inicializar la línea elástica de conexión de inmediato
      const origMouseDown = ch.mouseDown
      ch.mouseDown = function (sender: any, me: any) {
        if (typeof origMouseDown === 'function') {
          origMouseDown.apply(this, arguments)
        }
        if (this.first && !this.shape && typeof this.createShape === 'function') {
          this.shape = this.createShape()
          if (this.edgeState && this.shape.apply) {
            this.shape.apply(this.edgeState)
          }
        }
      }

      // Interceptar mouseUp para garantizar que conecte con la forma destino bajo el cursor
      const origMouseUp = ch.mouseUp
      ch.mouseUp = function (sender: any, me: any) {
        if (this.isConnecting && this.isConnecting()) {
          if (!this.currentState && me.getGraphX && this.graph?.getCellAt) {
            const cell = this.graph.getCellAt(me.getGraphX(), me.getGraphY())
            if (cell && this.graph.getModel().isVertex(cell)) {
              this.currentState = this.graph.getView().getState(cell)
            }
          }
        }
        if (typeof origMouseUp === 'function') {
          origMouseUp.apply(this, arguments)
        }
      }

      // Interceptar inserción de aristas para aplicar estilo consistente por defecto
      const origInsertEdge = ch.insertEdge
      ch.insertEdge = (parent: any, id: any, value: any, source: any, target: any, style: any) => {
        const finalStyle = style || DEFAULT_EDGE_STYLE
        let edge: any
        if (typeof origInsertEdge === 'function') {
          edge = origInsertEdge.call(ch, parent, id, value || '', source, target, finalStyle)
        } else {
          edge = this.graph.insertEdge(parent, id, value || '', source, target, finalStyle)
        }
        return edge
      }
    }
    this.setConnectionMode(false)

    // Listener del modelo de selección para enlaces interactivos (clic origen -> clic destino)
    const selModel = this.graph.getSelectionModel()
    const changeEvt = (window.mxEvent && window.mxEvent.CHANGE) || 'change'
    selModel.addListener(changeEvt, () => {
      if (this.destroyed) return
      if (this.pendingConnectSourceId) {
        const selected = this.getSelectedCells()
        if (selected.length > 0) {
          const target = selected[0]
          if (target && !target.edge && target.id !== this.pendingConnectSourceId) {
            const srcId = this.pendingConnectSourceId
            this.cancelInteractiveConnect()
            const edge = this.addEdge(srcId, target.id, '')
            if (edge) {
              this.selectCell(edge.id)
            }
          }
        }
      }
    })

    // 5. Habilitar selección rectangular (rubberband) en áreas vacías
    if (enableRubberband && window.mxRubberband) {
      this.rubberband = new window.mxRubberband(this.graph)
    }

    // 6. Registrar estilos estándar de formas en la Stylesheet para compatibilidad nativa con draw.io
    const anyGraphInstance = this.graph as any
    const ss = typeof anyGraphInstance.getStylesheet === 'function' ? anyGraphInstance.getStylesheet() : null
    if (ss && typeof ss.putCellStyle === 'function') {
      const p = (window as any).mxPerimeter || {}
      ss.putCellStyle('ellipse', { shape: 'ellipse', perimeter: p.EllipsePerimeter || 'ellipsePerimeter' })
      ss.putCellStyle('rhombus', { shape: 'rhombus', perimeter: p.RhombusPerimeter || 'rhombusPerimeter' })
      ss.putCellStyle('triangle', { shape: 'triangle', perimeter: p.TrianglePerimeter || 'trianglePerimeter' })
      ss.putCellStyle('cylinder', { shape: 'cylinder', perimeter: p.CylinderPerimeter || 'cylinderPerimeter' })
      ss.putCellStyle('cylinder3', { shape: 'cylinder3', perimeter: p.CylinderPerimeter || 'cylinderPerimeter' })
      ss.putCellStyle('cloud', { shape: 'cloud', perimeter: p.EllipsePerimeter || 'ellipsePerimeter' })
      ss.putCellStyle('actor', { shape: 'actor', perimeter: p.ActorPerimeter || 'actorPerimeter' })
      ss.putCellStyle('hexagon', { shape: 'hexagon', perimeter: p.HexagonPerimeter || 'hexagonPerimeter' })
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
   * Configura atajos de teclado globales (Delete, Backspace, Ctrl+Z, Ctrl+Y, Ctrl+A, Ctrl+D, Ctrl+C/X/V, Ctrl+G)
   */
  private setupKeyHandler(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return

    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.destroyed) return

      // Si el foco está en un input o textarea editable, no interceptar atajos
      const target = e.target as HTMLElement | null
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (typeof (target as any).closest === 'function' && (target as any).closest('input, textarea, [contenteditable="true"]'))
      )
      if (isInput) {
        return
      }

      // Tecla Alt: activa temporalmente modo conector mientras se mantiene pulsada
      if (e.key === 'Alt' && !e.repeat && !this.connectionMode) {
        this.setConnectionMode(true, true)
      }

      const isCtrl = Boolean(e.ctrlKey || e.metaKey)
      const key = (e.key || '').toLowerCase()
      const code = e.code || ''

      // Tecla C (sin modificadores): alternar modo conector
      if (!isCtrl && !e.shiftKey && !e.altKey && (key === 'c' || code === 'KeyC')) {
        e.preventDefault()
        e.stopPropagation()
        this.toggleConnectionMode()
        return
      }

      // Tecla L (sin modificadores): enlace rápido de celdas
      if (!isCtrl && !e.shiftKey && !e.altKey && (key === 'l' || code === 'KeyL')) {
        const sel = this.getSelectedCells().filter(c => !c.edge)
        if (sel.length >= 2) {
          e.preventDefault()
          e.stopPropagation()
          this.connectSelected()
          return
        } else if (sel.length === 1) {
          e.preventDefault()
          e.stopPropagation()
          this.startInteractiveConnect(sel[0].id)
          return
        }
      }

      // Tecla Escape: cancelar modo de conexión pendiente o interactivo
      if (key === 'escape' || code === 'Escape') {
        if (this.pendingConnectSourceId) {
          e.preventDefault()
          e.stopPropagation()
          this.cancelInteractiveConnect()
          return
        }
        if (this.connectionMode) {
          e.preventDefault()
          e.stopPropagation()
          this.setConnectionMode(false)
          return
        }
      }

      // Tecla V (sin modificadores): salir del modo conector al modo selección
      if (!isCtrl && !e.shiftKey && !e.altKey && (key === 'v' || code === 'KeyV') && this.connectionMode) {
        e.preventDefault()
        e.stopPropagation()
        this.setConnectionMode(false)
        return
      }

      // Borrar celda seleccionada con tecla Supr o Backspace
      if (key === 'delete' || key === 'backspace' || code === 'Delete' || code === 'Backspace') {
        if (this.getSelectedCells().length > 0) {
          e.preventDefault()
          e.stopPropagation()
          this.removeSelected()
          return
        }
      }

      // Ctrl+D / Cmd+D (Duplicar seleccionado)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'd' || code === 'KeyD')) {
        e.preventDefault()
        e.stopPropagation()
        this.duplicateSelected()
        return
      }

      // Ctrl+C / Cmd+C (Copiar)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'c' || code === 'KeyC')) {
        e.preventDefault()
        e.stopPropagation()
        this.copy()
        return
      }

      // Ctrl+X / Cmd+X (Cortar)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'x' || code === 'KeyX')) {
        e.preventDefault()
        e.stopPropagation()
        this.cut()
        return
      }

      // Ctrl+V / Cmd+V (Pegar)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'v' || code === 'KeyV')) {
        e.preventDefault()
        e.stopPropagation()
        this.paste()
        return
      }

      // Ctrl+A / Cmd+A (Seleccionar todo)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'a' || code === 'KeyA')) {
        e.preventDefault()
        e.stopPropagation()
        this.selectAll()
        return
      }

      // Ctrl+Z / Cmd+Z (Undo)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'z' || code === 'KeyZ')) {
        e.preventDefault()
        e.stopPropagation()
        this.undo()
        return
      }

      // Ctrl+Y / Cmd+Y o Ctrl+Shift+Z (Redo)
      if ((isCtrl && !e.shiftKey && !e.altKey && (key === 'y' || code === 'KeyY')) ||
          (isCtrl && e.shiftKey && !e.altKey && (key === 'z' || code === 'KeyZ'))) {
        e.preventDefault()
        e.stopPropagation()
        this.redo()
        return
      }

      // Ctrl+G / Cmd+G (Agrupar sin Shift)
      if (isCtrl && !e.shiftKey && !e.altKey && (key === 'g' || code === 'KeyG')) {
        e.preventDefault()
        e.stopPropagation()
        this.groupSelected()
        return
      }

      // Ctrl+Shift+G o Ctrl+Shift+U (Desagrupar)
      if (isCtrl && e.shiftKey && !e.altKey && (key === 'g' || code === 'KeyG' || key === 'u' || code === 'KeyU')) {
        e.preventDefault()
        e.stopPropagation()
        this.ungroupSelected()
        return
      }
    }

    this.keyupHandler = (e: KeyboardEvent) => {
      if (this.destroyed) return
      // Al soltar Alt, restaurar puntero si estaba temporal
      if (e.key === 'Alt') {
        this.setConnectionMode(false, true)
      }
    }

    window.addEventListener('keydown', this.keydownHandler, { capture: true })
    window.addEventListener('keyup', this.keyupHandler, { capture: true })
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
    let parent = this.graph.getDefaultParent()
    if (!parent) {
      if (typeof (this.graph as any).setDefaultParent === 'function') {
        (this.graph as any).setDefaultParent(null)
      }
      parent = this.graph.getDefaultParent()
    }
    if (!parent) {
      const root = this.graph.getModel().getRoot()
      parent = (this.graph.getModel() as any).getChildAt ? (this.graph.getModel() as any).getChildAt(root, 0) : root
    }

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
   * Inserta una forma centrada en las coordenadas de un evento de ratón / drop
   */
  insertShapeAtEvent(
    evt: MouseEvent,
    shape: { title?: string; label?: string; width: number; height: number; style: string }
  ): mxCell {
    const anyGraph = this.graph as any
    let x = 100
    let y = 100

    if (typeof anyGraph.getPointForEvent === 'function') {
      const pt = anyGraph.getPointForEvent(evt, false)
      x = Math.max(0, Math.round(pt.x - shape.width / 2))
      y = Math.max(0, Math.round(pt.y - shape.height / 2))
    } else {
      const container = this.graph.container
      const rect = container?.getBoundingClientRect?.() ?? { left: 0, top: 0 }
      const scale = this.graph.getView().getScale() || 1
      const tr = (this.graph.getView() as any).translate || { x: 0, y: 0 }
      x = Math.max(0, Math.round((evt.clientX - rect.left) / scale - tr.x - shape.width / 2))
      y = Math.max(0, Math.round((evt.clientY - rect.top) / scale - tr.y - shape.height / 2))
    }

    const cell = this.addVertex({
      label: shape.label ?? '',
      x,
      y,
      width: shape.width,
      height: shape.height,
      style: shape.style
    })
    this.graph.setSelectionCell(cell)
    return cell
  }

  /**
   * Inserta una forma en el centro visible del viewport del canvas
   */
  insertShapeInCenter(
    shape: { title?: string; label?: string; width: number; height: number; style: string }
  ): mxCell {
    const container = this.graph.container
    const width = container?.clientWidth || 800
    const height = container?.clientHeight || 600
    const scale = this.graph.getView().getScale() || 1
    const tr = (this.graph.getView() as any).translate || { x: 0, y: 0 }

    // Pequeño desplazamiento aleatorio para evitar que formas consecutivas se apilen exactamente
    const offset = Math.floor(Math.random() * 30) - 15
    const centerX = width / 2 / scale - tr.x + offset
    const centerY = height / 2 / scale - tr.y + offset

    const x = Math.max(20, Math.round(centerX - shape.width / 2))
    const y = Math.max(20, Math.round(centerY - shape.height / 2))

    const cell = this.addVertex({
      label: shape.label ?? '',
      x,
      y,
      width: shape.width,
      height: shape.height,
      style: shape.style
    })
    this.graph.setSelectionCell(cell)
    return cell
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
    const edgeStyle = style || DEFAULT_EDGE_STYLE
    model.beginUpdate()
    try {
      return this.graph.insertEdge(parent, null, label, source, target, edgeStyle)
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Activa o desactiva el modo interactivo de conexión de aristas
   */
  setConnectionMode(enabled: boolean, temporary = false): void {
    this.connectionMode = enabled
    const anyGraph = this.graph as any

    this.graph.setConnectable(enabled)
    if (anyGraph.connectionHandler) {
      anyGraph.connectionHandler.setEnabled(enabled)
      anyGraph.connectionHandler.isValidSource = (cell: any) => cell != null && !cell.edge
      anyGraph.connectionHandler.isValidTarget = (cell: any) => cell != null && !cell.edge
    }

    // En modo conexión, desactivar el arrastre de celdas para que el drag trace la conexión
    if (anyGraph.graphHandler) {
      anyGraph.graphHandler.setMoveEnabled(!enabled)
    }

    const container = this.graph.container
    if (container?.style) {
      container.style.cursor = enabled ? 'crosshair' : ''
    }

    if (!temporary) {
      this.connectionModeListeners.forEach(fn => fn(enabled))
    }
  }

  /**
   * Indica si el modo interactivo de conexión está activo
   */
  isConnectionMode(): boolean {
    return this.connectionMode
  }

  /**
   * Alterna el modo interactivo de conexión
   */
  toggleConnectionMode(): boolean {
    const next = !this.connectionMode
    this.setConnectionMode(next)
    return next
  }

  /**
   * Registra un callback reactivo para cambios de estado en el modo de conexión
   */
  onConnectionModeChange(callback: (enabled: boolean) => void): () => void {
    this.connectionModeListeners.push(callback)
    return () => {
      this.connectionModeListeners = this.connectionModeListeners.filter(fn => fn !== callback)
    }
  }

  /**
   * Conecta las dos celdas actualmente seleccionadas con una arista
   */
  connectSelected(label = ''): mxCell | null {
    const selected = this.getSelectedCells().filter(c => !c.edge)
    if (selected.length < 2) return null
    const source = selected[0]
    const target = selected[1]
    const edge = this.addEdge(source.id, target.id, label, DEFAULT_EDGE_STYLE)
    if (edge) {
      this.selectCell(edge.id)
    }
    return edge
  }

  /**
   * Inicia el modo de enlace interactivo con un nodo de origen específico.
   * El usuario solo tiene que hacer clic en el nodo destino en el lienzo para crear la conexión.
   */
  startInteractiveConnect(sourceId: string): void {
    this.pendingConnectSourceId = sourceId
    this.setConnectionMode(true, true)
    this.notifyPendingConnectListeners(sourceId)
    const container = this.graph.container
    if (container?.style) {
      container.style.cursor = 'crosshair'
    }
  }

  /**
   * Cancela la conexión interactiva pendiente
   */
  cancelInteractiveConnect(): void {
    this.pendingConnectSourceId = null
    this.setConnectionMode(false)
    this.notifyPendingConnectListeners(null)
  }

  /**
   * Devuelve el ID del nodo origen pendiente de conectar, si existe
   */
  getPendingConnectSourceId(): string | null {
    return this.pendingConnectSourceId
  }

  /**
   * Registra un callback reactivo para cambios en la conexión pendiente
   */
  onPendingConnectChange(callback: (sourceId: string | null) => void): () => void {
    this.pendingConnectListeners.push(callback)
    return () => {
      this.pendingConnectListeners = this.pendingConnectListeners.filter(fn => fn !== callback)
    }
  }

  private notifyPendingConnectListeners(sourceId: string | null): void {
    this.pendingConnectListeners.forEach(fn => fn(sourceId))
  }

  /**
   * Devuelve todos los vértices / formas disponibles en el modelo
   */
  getAllVertices(): Array<{ id: string; label: string }> {
    const model = this.graph.getModel()
    const parent = this.graph.getDefaultParent()
    const childCount = (model as any).getChildCount ? (model as any).getChildCount(parent) : 0
    const vertices: Array<{ id: string; label: string }> = []

    for (let i = 0; i < childCount; i++) {
      const child = (model as any).getChildAt ? (model as any).getChildAt(parent, i) : null
      if (child && !child.edge && (model as any).isVertex && (model as any).isVertex(child)) {
        let label = ''
        if (child.value) {
          label = typeof child.value === 'string' ? child.value : (child.value.toString?.() || '')
        }
        vertices.push({
          id: child.id,
          label: label || `Forma ${child.id}`
        })
      }
    }
    return vertices
  }

  /**
   * Modifica el tipo de enrutamiento de una arista (recto, ortogonal, curvo, ER)
   */
  setEdgeRouting(cellId: string, routing: 'straight' | 'orthogonal' | 'curved' | 'entityRelation'): void {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell) return

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      if (routing === 'straight') {
        this.setCellStyleProperty(cellId, 'edgeStyle', 'none')
        this.setCellStyleProperty(cellId, 'curved', '0')
        this.setCellStyleProperty(cellId, 'rounded', '0')
      } else if (routing === 'orthogonal') {
        this.setCellStyleProperty(cellId, 'edgeStyle', 'orthogonalEdgeStyle')
        this.setCellStyleProperty(cellId, 'curved', '0')
        this.setCellStyleProperty(cellId, 'rounded', '0')
      } else if (routing === 'curved') {
        this.setCellStyleProperty(cellId, 'edgeStyle', 'orthogonalEdgeStyle')
        this.setCellStyleProperty(cellId, 'curved', '1')
        this.setCellStyleProperty(cellId, 'rounded', '1')
      } else if (routing === 'entityRelation') {
        this.setCellStyleProperty(cellId, 'edgeStyle', 'entityRelationEdgeStyle')
        this.setCellStyleProperty(cellId, 'curved', '0')
      }
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Modifica el marcador de punta de una arista (inicio o fin)
   */
  setEdgeArrow(cellId: string, position: 'start' | 'end', arrowType: string, fill = true): void {
    const arrowProp = position === 'start' ? 'startArrow' : 'endArrow'
    const fillProp = position === 'start' ? 'startFill' : 'endFill'

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      this.setCellStyleProperty(cellId, arrowProp, arrowType)
      this.setCellStyleProperty(cellId, fillProp, fill ? '1' : '0')
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Comprueba si una celda es un conector / arista
   */
  isCellEdge(cellId: string): boolean {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell) return false
    return Boolean(cell.edge || (this.graph.getModel() as any).isEdge?.(cell))
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
    this.setCellStyleProperty(cellId, 'fillColor', color)
  }

  /**
   * Modifica una propiedad arbitraria en el estilo de una celda
   */
  setCellStyleProperty(cellId: string, key: string, value: string | number | null): void {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell) return

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      let currentStyle = model.getStyle(cell) || ''
      const regex = new RegExp(`(^|;)${key}=[^;]*`, 'g')

      if (value === null || value === undefined || value === '') {
        currentStyle = currentStyle.replace(regex, '')
      } else if (currentStyle.includes(`${key}=`)) {
        currentStyle = currentStyle.replace(new RegExp(`${key}=[^;]+`), `${key}=${value}`)
      } else {
        currentStyle = currentStyle ? `${currentStyle};${key}=${value}` : `${key}=${value}`
      }

      currentStyle = currentStyle.replace(/;;+/g, ';').replace(/^;|;$/g, '')
      model.setStyle(cell, currentStyle)
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Obtiene una propiedad de estilo de una celda
   */
  getCellStyleProperty(cellId: string, key: string, defaultValue = ''): string {
    const cell = this.graph.getModel().getCell(cellId)
    if (!cell) return defaultValue
    const style = this.graph.getModel().getStyle(cell) || ''
    const match = style.match(new RegExp(`(?:^|;)${key}=([^;]*)`))
    return match ? match[1] : defaultValue
  }

  /**
   * Modifica el color de borde de una celda
   */
  setCellStrokeColor(cellId: string, color: string): void {
    this.setCellStyleProperty(cellId, 'strokeColor', color)
  }

  /**
   * Modifica el grosor de trazo de una celda
   */
  setCellStrokeWidth(cellId: string, width: number): void {
    this.setCellStyleProperty(cellId, 'strokeWidth', width)
  }

  /**
   * Modifica la opacidad de una celda (0 a 100)
   */
  setCellOpacity(cellId: string, opacity: number): void {
    this.setCellStyleProperty(cellId, 'opacity', opacity)
  }

  /**
   * Alterna línea discontinua (dashed)
   */
  setCellDashed(cellId: string, dashed: boolean): void {
    this.setCellStyleProperty(cellId, 'dashed', dashed ? '1' : '0')
  }

  /**
   * Alterna esquinas redondeadas
   */
  setCellRounded(cellId: string, rounded: boolean): void {
    this.setCellStyleProperty(cellId, 'rounded', rounded ? '1' : '0')
  }

  /**
   * Alterna sombra
   */
  setCellShadow(cellId: string, shadow: boolean): void {
    this.setCellStyleProperty(cellId, 'shadow', shadow ? '1' : '0')
  }

  /**
   * Modifica la rotación en grados
   */
  setCellRotation(cellId: string, rotation: number): void {
    this.setCellStyleProperty(cellId, 'rotation', rotation)
  }

  /**
   * Modifica el tamaño de fuente
   */
  setCellFontSize(cellId: string, size: number): void {
    this.setCellStyleProperty(cellId, 'fontSize', size)
  }

  /**
   * Modifica el color de fuente
   */
  setCellFontColor(cellId: string, color: string): void {
    this.setCellStyleProperty(cellId, 'fontColor', color)
  }

  /**
   * Modifica la alineación del texto
   */
  setCellAlign(cellId: string, align: 'left' | 'center' | 'right'): void {
    this.setCellStyleProperty(cellId, 'align', align)
  }

  /**
   * Mueve una celda (o las celdas seleccionadas) al frente (z-order)
   */
  bringToFront(cellId?: string): void {
    let cells: mxCell[] = []
    if (cellId) {
      const c = this.graph.getModel().getCell(cellId)
      if (c) cells = [c]
    } else {
      cells = this.getSelectedCells()
    }
    if (cells.length > 0 && typeof (this.graph as any).orderCells === 'function') {
      ;(this.graph as any).orderCells(false, cells)
    }
  }

  /**
   * Mueve una celda (o las celdas seleccionadas) al fondo (z-order)
   */
  sendToBack(cellId?: string): void {
    let cells: mxCell[] = []
    if (cellId) {
      const c = this.graph.getModel().getCell(cellId)
      if (c) cells = [c]
    } else {
      cells = this.getSelectedCells()
    }
    if (cells.length > 0 && typeof (this.graph as any).orderCells === 'function') {
      ;(this.graph as any).orderCells(true, cells)
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
   * Duplica las celdas actualmente seleccionadas con un desplazamiento (offset)
   */
  duplicateSelected(offset = 20): mxCell[] {
    const cells = this.getSelectedCells()
    if (!cells || cells.length === 0) return []

    const anyGraph = this.graph as any
    const parent = this.graph.getDefaultParent()
    let clones: mxCell[] = []

    this.graph.getModel().beginUpdate()
    try {
      if (typeof anyGraph.importCells === 'function') {
        clones = anyGraph.importCells(cells, offset, offset, parent) || []
      }
      if ((!clones || clones.length === 0) && typeof anyGraph.cloneCells === 'function') {
        const cloned = anyGraph.cloneCells(cells) || []
        for (const cell of cloned) {
          if (cell && cell.geometry) {
            const g = cell.geometry.clone ? cell.geometry.clone() : { ...cell.geometry }
            g.x = (g.x || 0) + offset
            g.y = (g.y || 0) + offset
            cell.geometry = g
          }
          if (cell && typeof anyGraph.addCell === 'function') {
            anyGraph.addCell(cell, parent)
            clones.push(cell)
          }
        }
      }
      if (clones && clones.length > 0) {
        this.graph.setSelectionCells(clones)
        if (typeof this.graph.refresh === 'function') {
          this.graph.refresh()
        }
      }
    } finally {
      this.graph.getModel().endUpdate()
    }
    return clones
  }

  /**
   * Copia las celdas seleccionadas al portapapeles interno
   */
  copy(): void {
    const cells = this.getSelectedCells()
    if (!cells || cells.length === 0) return

    const anyGraph = this.graph as any
    if (typeof anyGraph.cloneCells === 'function') {
      this.clipboard = anyGraph.cloneCells(cells) || []
    } else {
      this.clipboard = cells.map(c => ({
        ...c,
        geometry: c.geometry ? { ...c.geometry } : null
      }))
    }
    this.pasteCount = 0
  }

  /**
   * Corta las celdas seleccionadas (las copia y las remueve del canvas)
   */
  cut(): void {
    this.copy()
    this.removeSelected()
  }

  /**
   * Pega las celdas desde el portapapeles con un desplazamiento progresivo
   */
  paste(): mxCell[] {
    if (!this.clipboard || this.clipboard.length === 0) return []

    this.pasteCount += 1
    const offset = 20 * this.pasteCount
    const anyGraph = this.graph as any
    const parent = this.graph.getDefaultParent()
    let clones: mxCell[] = []

    this.graph.getModel().beginUpdate()
    try {
      const toPaste = anyGraph.cloneCells ? anyGraph.cloneCells(this.clipboard) : this.clipboard
      if (typeof anyGraph.importCells === 'function') {
        clones = anyGraph.importCells(toPaste, offset, offset, parent) || []
      }
      if ((!clones || clones.length === 0) && toPaste && toPaste.length > 0) {
        for (const cell of toPaste) {
          if (cell && cell.geometry) {
            const g = cell.geometry.clone ? cell.geometry.clone() : { ...cell.geometry }
            g.x = (g.x || 0) + offset
            g.y = (g.y || 0) + offset
            cell.geometry = g
          }
          if (cell && typeof anyGraph.addCell === 'function') {
            anyGraph.addCell(cell, parent)
            clones.push(cell)
          }
        }
      }
      if (clones && clones.length > 0) {
        this.graph.setSelectionCells(clones)
        if (typeof this.graph.refresh === 'function') {
          this.graph.refresh()
        }
      }
    } finally {
      this.graph.getModel().endUpdate()
    }
    return clones
  }

  /**
   * Indica si hay elementos guardados en el portapapeles
   */
  hasClipboard(): boolean {
    return this.clipboard.length > 0
  }

  /**
   * Agrupa las celdas seleccionadas bajo una celda contenedora (grupo)
   */
  groupSelected(border = 20): mxCell | null {
    const cells = this.getSelectedCells()
    if (!cells || cells.length < 2) return null

    const anyGraph = this.graph as any
    if (typeof anyGraph.groupCells === 'function') {
      this.graph.getModel().beginUpdate()
      try {
        const group = anyGraph.groupCells(null, border, cells)
        if (group) {
          this.graph.setSelectionCell(group)
          if (typeof this.graph.refresh === 'function') {
            this.graph.refresh()
          }
        }
        return group
      } finally {
        this.graph.getModel().endUpdate()
      }
    }
    return null
  }

  /**
   * Desagrupa los contenedores seleccionados
   */
  ungroupSelected(): mxCell[] {
    const cells = this.getSelectedCells()
    if (!cells || cells.length === 0) return []

    const anyGraph = this.graph as any
    if (typeof anyGraph.ungroupCells === 'function') {
      this.graph.getModel().beginUpdate()
      try {
        const result = anyGraph.ungroupCells(cells) || []
        if (result.length > 0) {
          this.graph.setSelectionCells(result)
          if (typeof this.graph.refresh === 'function') {
            this.graph.refresh()
          }
        }
        return result
      } finally {
        this.graph.getModel().endUpdate()
      }
    }
    return []
  }

  /**
   * Alinea las celdas seleccionadas (left, center, right, top, middle, bottom)
   */
  alignSelected(align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    const cells = this.getSelectedCells().filter(c => !c.edge && c.geometry)
    if (cells.length < 2) return

    const anyGraph = this.graph as any
    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      if (typeof anyGraph.alignCells === 'function') {
        anyGraph.alignCells(align, cells)
      }

      // Asegurar cálculo geométrico determinista si alignCells no actualiza las geometrías directamente
      if (align === 'left') {
        const minX = Math.min(...cells.map(c => c.geometry!.x))
        cells.forEach(c => {
          this.setCellGeometry(c.id, minX, c.geometry!.y, c.geometry!.width, c.geometry!.height)
        })
      } else if (align === 'center') {
        const minX = Math.min(...cells.map(c => c.geometry!.x))
        const maxX = Math.max(...cells.map(c => c.geometry!.x + c.geometry!.width))
        const centerX = (minX + maxX) / 2
        cells.forEach(c => {
          const newX = Math.round(centerX - c.geometry!.width / 2)
          this.setCellGeometry(c.id, newX, c.geometry!.y, c.geometry!.width, c.geometry!.height)
        })
      } else if (align === 'right') {
        const maxX = Math.max(...cells.map(c => c.geometry!.x + c.geometry!.width))
        cells.forEach(c => {
          const newX = maxX - c.geometry!.width
          this.setCellGeometry(c.id, newX, c.geometry!.y, c.geometry!.width, c.geometry!.height)
        })
      } else if (align === 'top') {
        const minY = Math.min(...cells.map(c => c.geometry!.y))
        cells.forEach(c => {
          this.setCellGeometry(c.id, c.geometry!.x, minY, c.geometry!.width, c.geometry!.height)
        })
      } else if (align === 'middle') {
        const minY = Math.min(...cells.map(c => c.geometry!.y))
        const maxY = Math.max(...cells.map(c => c.geometry!.y + c.geometry!.height))
        const centerY = (minY + maxY) / 2
        cells.forEach(c => {
          const newY = Math.round(centerY - c.geometry!.height / 2)
          this.setCellGeometry(c.id, c.geometry!.x, newY, c.geometry!.width, c.geometry!.height)
        })
      } else if (align === 'bottom') {
        const maxY = Math.max(...cells.map(c => c.geometry!.y + c.geometry!.height))
        cells.forEach(c => {
          const newY = maxY - c.geometry!.height
          this.setCellGeometry(c.id, c.geometry!.x, newY, c.geometry!.width, c.geometry!.height)
        })
      }
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Distribuye uniformemente las celdas seleccionadas en el eje horizontal o vertical
   */
  distributeSelected(direction: 'horizontal' | 'vertical'): void {
    const cells = this.getSelectedCells().filter(c => !c.edge && c.geometry)
    if (cells.length < 3) return

    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      if (direction === 'horizontal') {
        const sorted = [...cells].sort((a, b) => a.geometry!.x - b.geometry!.x)
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        const minX = first.geometry!.x
        const maxRight = last.geometry!.x + last.geometry!.width
        const totalSpan = maxRight - minX
        const totalWidth = sorted.reduce((sum, c) => sum + c.geometry!.width, 0)
        const spacing = (totalSpan - totalWidth) / (sorted.length - 1)

        let currentX = minX + first.geometry!.width + spacing
        for (let i = 1; i < sorted.length - 1; i++) {
          this.setCellGeometry(
            sorted[i].id,
            Math.round(currentX),
            sorted[i].geometry!.y,
            sorted[i].geometry!.width,
            sorted[i].geometry!.height
          )
          currentX += sorted[i].geometry!.width + spacing
        }
      } else {
        const sorted = [...cells].sort((a, b) => a.geometry!.y - b.geometry!.y)
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        const minY = first.geometry!.y
        const maxBottom = last.geometry!.y + last.geometry!.height
        const totalSpan = maxBottom - minY
        const totalHeight = sorted.reduce((sum, c) => sum + c.geometry!.height, 0)
        const spacing = (totalSpan - totalHeight) / (sorted.length - 1)

        let currentY = minY + first.geometry!.height + spacing
        for (let i = 1; i < sorted.length - 1; i++) {
          this.setCellGeometry(
            sorted[i].id,
            sorted[i].geometry!.x,
            Math.round(currentY),
            sorted[i].geometry!.width,
            sorted[i].geometry!.height
          )
          currentY += sorted[i].geometry!.height + spacing
        }
      }
    } finally {
      model.endUpdate()
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

  selectCells(ids: string[]): void {
    const cells = ids
      .map(id => this.graph.getModel().getCell(id))
      .filter((c): c is mxCell => c !== null)
    this.graph.setSelectionCells(cells)
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
   * Configura navegación fluida mediante Panning (Espacio + Arrastre, Clic derecho o Botón central)
   * y Zoom con la rueda del ratón (Ctrl + Scroll).
   */
  private setupSmoothPanning(): void {
    const container = this.graph.container
    if (!container || typeof window === 'undefined' || typeof container.addEventListener !== 'function' || typeof window.addEventListener !== 'function') return

    let isPanning = false
    let startX = 0
    let startY = 0
    let initTranslateX = 0
    let initTranslateY = 0
    let isSpacePressed = false

    const handleKeyDown = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.code === 'Space' && !isSpacePressed) {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return
        }
        isSpacePressed = true
        if (!isPanning && container?.style) {
          container.style.cursor = 'grab'
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.code === 'Space') {
        isSpacePressed = false
        if (!isPanning && container?.style) {
          container.style.cursor = ''
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || this.destroyed) return
      e.preventDefault()

      const view = this.graph.getView()
      if (!view) return
      const scale = view.getScale ? view.getScale() : 1
      const dx = (e.clientX - startX) / (scale || 1)
      const dy = (e.clientY - startY) / (scale || 1)

      if (typeof view.setTranslate === 'function') {
        view.setTranslate(initTranslateX + dx, initTranslateY + dy)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isPanning) return
      isPanning = false
      if (container?.style) {
        container.style.cursor = isSpacePressed ? 'grab' : ''
      }
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.userSelect = ''
      }

      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (this.destroyed) return
      // Panning con:
      // 1. Clic derecho (button === 2)
      // 2. Botón central (button === 1)
      // 3. Clic izquierdo (button === 0) con barra espaciadora
      const shouldPan = e.button === 2 || e.button === 1 || (e.button === 0 && isSpacePressed)
      if (!shouldPan) return

      e.preventDefault()
      e.stopPropagation()

      isPanning = true
      startX = e.clientX
      startY = e.clientY

      const view = this.graph.getView()
      const trans = view && typeof view.getTranslate === 'function' ? view.getTranslate() : { x: 0, y: 0 }
      initTranslateX = trans?.x ?? 0
      initTranslateY = trans?.y ?? 0

      if (container?.style) {
        container.style.cursor = 'grabbing'
      }
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.userSelect = 'none'
      }

      window.addEventListener('mousemove', handleMouseMove, { passive: false })
      window.addEventListener('mouseup', handleMouseUp, { passive: false })
    }

    const handleContextMenu = (e: MouseEvent) => {
      // Prevenir el menú contextual predeterminado del navegador en el canvas
      e.preventDefault()
    }

    const handleWheel = (e: WheelEvent) => {
      if (this.destroyed) return
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) {
          this.zoomIn()
        } else if (e.deltaY > 0) {
          this.zoomOut()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('contextmenu', handleContextMenu)
    container.addEventListener('wheel', handleWheel, { passive: false })

    this.cleanupPanning = () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
      if (typeof container.removeEventListener === 'function') {
        container.removeEventListener('mousedown', handleMouseDown)
        container.removeEventListener('contextmenu', handleContextMenu)
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }

  /**
   * Obtiene la cantidad de celdas hijas en el padre por defecto
   */
  getChildCount(): number {
    const parent = this.graph.getDefaultParent()
    if (!parent) return 0
    const model = this.graph.getModel()
    if (typeof (model as any).getChildCount === 'function') {
      return (model as any).getChildCount(parent) || 0
    }
    return 0
  }

  /**
   * Inserta un diagrama inicial de bienvenida
   */
  insertWelcomeDiagram(): void {
    const v1 = this.addVertex({
      label: 'Inicio',
      x: 140,
      y: 120,
      width: 130,
      height: 60,
      style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#000000;fontSize=13;'
    })

    const v2 = this.addVertex({
      label: 'Procesamiento',
      x: 360,
      y: 120,
      width: 140,
      height: 60,
      style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#000000;fontSize=13;'
    })

    const v3 = this.addVertex({
      label: 'Fin / Resultado',
      x: 580,
      y: 120,
      width: 140,
      height: 60,
      style: 'shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontColor=#000000;fontSize=13;'
    })

    this.addEdge(v1.id, v2.id, 'Paso 1')
    this.addEdge(v2.id, v3.id, 'Paso 2')
    if (typeof (this.graph as any).refresh === 'function') {
      (this.graph as any).refresh()
    }
  }

  /**
   * Limpia todas las celdas del diagrama
   */
  clear(): void {
    const model = this.graph.getModel()
    model.beginUpdate()
    try {
      const parent = this.graph.getDefaultParent()
      let childCells: mxCell[] = []
      if (typeof (this.graph as any).getChildCells === 'function') {
        childCells = (this.graph as any).getChildCells(parent, true, true)
      } else if (typeof (model as any).getChildCells === 'function') {
        childCells = (model as any).getChildCells(parent, true, true)
      } else {
        const anyModel = model as any
        if (anyModel.cells) {
          childCells = Object.values(anyModel.cells).filter((c: any) => c && c.id !== parent?.id && c.id !== '0') as mxCell[]
        }
      }
      if (childCells.length > 0) {
        this.graph.removeCells(childCells, true)
      }
    } finally {
      model.endUpdate()
    }
    if (typeof (this.graph as any).refresh === 'function') {
      (this.graph as any).refresh()
    }
  }

  /**
   * Exporta únicamente el fragmento XML del modelo actual (<mxGraphModel>...</mxGraphModel>)
   */
  exportModelXml(): string {
    const enc = typeof window !== 'undefined' && window.mxCodec ? new window.mxCodec() : null
    let modelXml = ''
    if (enc && typeof enc.encode === 'function') {
      const node = enc.encode(this.graph.getModel())
      modelXml = (typeof window !== 'undefined' && window.mxUtils && typeof window.mxUtils.getXml === 'function')
        ? window.mxUtils.getXml(node)
        : (typeof XMLSerializer !== 'undefined' ? new XMLSerializer().serializeToString(node) : '<mxGraphModel><root></root></mxGraphModel>')
    } else {
      modelXml = '<mxGraphModel><root></root></mxGraphModel>'
    }
    return modelXml
  }

  /**
   * Importa únicamente el fragmento XML de un modelo (<mxGraphModel>...), reemplazando las celdas del lienzo
   */
  importModelXml(modelXmlString: string): boolean {
    if (!modelXmlString || typeof modelXmlString !== 'string') {
      this.clear()
      return true
    }
    try {
      let doc: Document
      if (typeof window !== 'undefined' && window.mxUtils && typeof window.mxUtils.parseXml === 'function') {
        doc = window.mxUtils.parseXml(modelXmlString)
      } else if (typeof DOMParser !== 'undefined') {
        doc = new DOMParser().parseFromString(modelXmlString, 'text/xml')
      } else {
        return false
      }

      let modelNode: Element | null = doc.querySelector('mxGraphModel')
      if (!modelNode) {
        const rootNode = doc.querySelector('root')
        if (rootNode) modelNode = rootNode.parentElement
      }

      if (!modelNode) {
        this.clear()
        return true
      }

      const dec = typeof window !== 'undefined' && window.mxCodec ? new window.mxCodec(modelNode.ownerDocument || doc) : null
      if (dec && typeof dec.decode === 'function') {
        const model = this.graph.getModel()
        model.beginUpdate()
        try {
          if (typeof (model as any).clear === 'function') {
            (model as any).clear()
          } else {
            this.clear()
          }
          dec.decode(modelNode, model)
        } finally {
          model.endUpdate()
        }

        if (typeof (this.graph as any).setDefaultParent === 'function') {
          (this.graph as any).setDefaultParent(null)
        }
        if (typeof (this.graph as any).refresh === 'function') {
          (this.graph as any).refresh()
        }
        return true
      }
      return false
    } catch (err) {
      console.error('Error al importar modelXml:', err)
      return false
    }
  }

  /**
   * Exporta el estado del grafo a formato XML (.drawio).
   * Soporta múltiples páginas opcionales.
   */
  exportToXml(pagesList?: Array<{ id: string; name: string; xml: string }>): string {
    const timestamp = new Date().toISOString()
    const currentModelXml = this.exportModelXml()

    if (pagesList && pagesList.length > 0) {
      const diagramsXml = pagesList.map(p => {
        const content = p.xml || currentModelXml
        return `  <diagram id="${p.id}" name="${p.name}">\n    ${content}\n  </diagram>`
      }).join('\n')

      return `<mxfile host="drawio.next" modified="${timestamp}" agent="DrawioNext/1.0" version="24.0.0">\n${diagramsXml}\n</mxfile>`
    }

    return `<mxfile host="drawio.next" modified="${timestamp}" agent="DrawioNext/1.0" version="24.0.0">
  <diagram id="diagram_1" name="Page-1">
    ${currentModelXml}
  </diagram>
</mxfile>`
  }

  /**
   * Importa un diagrama desde una cadena XML o archivo .drawio.
   * Soporta extracción de múltiples páginas.
   */
  importXml(
    xmlString: string,
    onPagesExtracted?: (pages: Array<{ id: string; name: string; xml: string }>) => void
  ): boolean {
    if (!xmlString || typeof xmlString !== 'string') return false
    try {
      let doc: Document
      if (typeof window !== 'undefined' && window.mxUtils && typeof window.mxUtils.parseXml === 'function') {
        doc = window.mxUtils.parseXml(xmlString)
      } else if (typeof DOMParser !== 'undefined') {
        doc = new DOMParser().parseFromString(xmlString, 'text/xml')
      } else {
        return false
      }

      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        console.error('Error al parsear XML:', parserError.textContent)
        return false
      }

      // Si el archivo contiene nodos <diagram>, extraer las páginas
      const diagramNodes = (doc && typeof doc.querySelectorAll === 'function')
        ? Array.from(doc.querySelectorAll('diagram'))
        : []
      if (diagramNodes.length > 0) {
        const extractedPages: Array<{ id: string; name: string; xml: string }> = []
        diagramNodes.forEach((node, idx) => {
          const id = (typeof node.getAttribute === 'function' ? node.getAttribute('id') : null) || `page-${idx + 1}`
          const name = (typeof node.getAttribute === 'function' ? node.getAttribute('name') : null) || `Page-${idx + 1}`
          let xml = ''
          const modelEl = (node && typeof node.querySelector === 'function') ? node.querySelector('mxGraphModel') : null
          if (modelEl) {
            xml = (typeof window !== 'undefined' && window.mxUtils && typeof window.mxUtils.getXml === 'function')
              ? window.mxUtils.getXml(modelEl)
              : (typeof XMLSerializer !== 'undefined' ? new XMLSerializer().serializeToString(modelEl) : '')
          } else if (node.textContent) {
            const raw = node.textContent.trim()
            if (raw.startsWith('<mxGraphModel') || raw.startsWith('<root')) {
              xml = raw
            }
          }
          extractedPages.push({ id, name, xml })
        })

        if (typeof onPagesExtracted === 'function' && extractedPages.length > 0) {
          onPagesExtracted(extractedPages)
        }
      }

      // Buscar el nodo mxGraphModel para cargar en el canvas
      let modelNode: Element | null = doc.querySelector('mxGraphModel')
      if (!modelNode) {
        const diagramNode = doc.querySelector('diagram')
        if (diagramNode && diagramNode.textContent) {
          const content = diagramNode.textContent.trim()
          if (content.startsWith('<mxGraphModel') || content.startsWith('<root')) {
            const innerDoc = new DOMParser().parseFromString(content, 'text/xml')
            modelNode = innerDoc.querySelector('mxGraphModel')
          }
        }
      }

      if (!modelNode) {
        const rootNode = doc.querySelector('root')
        if (rootNode) {
          modelNode = rootNode.parentElement
        }
      }

      if (!modelNode) {
        console.warn('No se encontró nodo mxGraphModel en el XML proporcionado')
        return false
      }

      const dec = typeof window !== 'undefined' && window.mxCodec ? new window.mxCodec(modelNode.ownerDocument || doc) : null
      if (dec && typeof dec.decode === 'function') {
        const model = this.graph.getModel()
        model.beginUpdate()
        try {
          if (typeof (model as any).clear === 'function') {
            (model as any).clear()
          } else {
            this.clear()
          }
          dec.decode(modelNode, model)
        } finally {
          model.endUpdate()
        }

        if (typeof (this.graph as any).setDefaultParent === 'function') {
          (this.graph as any).setDefaultParent(null)
        }
        if (typeof (this.graph as any).refresh === 'function') {
          (this.graph as any).refresh()
        }
        return true
      }
      return false
    } catch (err) {
      console.error('Error al importar diagrama XML:', err)
      return false
    }
  }

  /**
   * Exporta el diagrama como gráfico vectorial SVG
   */
  exportToSvg(): string {
    const container = this.graph.container
    const svg = container ? container.querySelector('svg') : null
    if (!svg) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>'
    }

    const clone = svg.cloneNode(true) as SVGSVGElement
    const bounds = typeof (this.graph as any).getGraphBounds === 'function' ? (this.graph as any).getGraphBounds() : null

    if (bounds && bounds.width > 0 && bounds.height > 0) {
      const pad = 24
      const x = Math.max(0, Math.floor(bounds.x - pad))
      const y = Math.max(0, Math.floor(bounds.y - pad))
      const w = Math.ceil(bounds.width + pad * 2)
      const h = Math.ceil(bounds.height + pad * 2)

      clone.setAttribute('viewBox', `${x} ${y} ${w} ${h}`)
      clone.setAttribute('width', `${w}px`)
      clone.setAttribute('height', `${h}px`)
    }

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    clone.setAttribute('style', 'background-color: transparent;')

    return typeof XMLSerializer !== 'undefined'
      ? new XMLSerializer().serializeToString(clone)
      : clone.outerHTML
  }

  /**
   * Exporta el diagrama como imagen rasterizada PNG (Data URL)
   */
  exportToPng(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const svgString = this.exportToSvg()
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const img = new Image()

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const width = img.naturalWidth || img.width || 800
            const height = img.naturalHeight || img.height || 600
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              URL.revokeObjectURL(url)
              reject(new Error('No se pudo obtener el contexto 2d del canvas'))
              return
            }

            // Fondo blanco para PNG exportado legible
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)
            const pngDataUrl = canvas.toDataURL('image/png')
            resolve(pngDataUrl)
          } catch (e) {
            URL.revokeObjectURL(url)
            reject(e)
          }
        }

        img.onerror = (err) => {
          URL.revokeObjectURL(url)
          reject(err)
        }

        img.src = url
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Libera recursos y destruye la instancia del grafo
   */
  destroy(): void {
    this.destroyed = true
    if (this.cleanupPanning) {
      this.cleanupPanning()
      this.cleanupPanning = null
    }
    if (this.keydownHandler && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this.keydownHandler, { capture: true })
      this.keydownHandler = null
    }
    if (this.keyupHandler && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('keyup', this.keyupHandler, { capture: true })
      this.keyupHandler = null
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
