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
  private cleanupPanning: (() => void) | null = null
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
      (this.graph as any).setCellsCloneable(false)
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
        if (!isPanning && container) {
          container.style.cursor = 'grab'
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.code === 'Space') {
        isSpacePressed = false
        if (!isPanning && container) {
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
      if (container) {
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

      if (container) {
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
  }

  /**
   * Exporta el estado del grafo a formato XML (.drawio)
   */
  exportToXml(): string {
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

    const timestamp = new Date().toISOString()
    return `<mxfile host="drawio.next" modified="${timestamp}" agent="DrawioNext/1.0" version="24.0.0">
  <diagram id="diagram_1" name="Page-1">
    ${modelXml}
  </diagram>
</mxfile>`
  }

  /**
   * Importa un diagrama desde una cadena XML o archivo .drawio
   */
  importXml(xmlString: string): boolean {
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

      // Buscar el nodo mxGraphModel
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

      const dec = typeof window !== 'undefined' && window.mxCodec ? new window.mxCodec(doc) : null
      if (dec && typeof dec.decode === 'function') {
        const model = this.graph.getModel()
        model.beginUpdate()
        try {
          dec.decode(modelNode, model)
        } finally {
          model.endUpdate()
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
