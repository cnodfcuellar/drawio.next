/**
 * Definiciones de tipos TypeScript para mxGraph
 * Drawio.next — Capa de abstracción del motor gráfico
 */

export interface mxPoint {
  x: number
  y: number
  equals(point: mxPoint): boolean
  clone(): mxPoint
}

export interface mxRectangle extends mxPoint {
  width: number
  height: number
  getCenterX(): number
  getCenterY(): number
  setRect(x: number, y: number, width: number, height: number): void
}

export interface mxGeometry extends mxRectangle {
  relative: boolean
  offset: mxPoint | null
  sourcePoint: mxPoint | null
  targetPoint: mxPoint | null
  points: mxPoint[] | null
}

export interface mxCell {
  id: string
  value: any
  geometry: mxGeometry | null
  style: string | null
  vertex: boolean
  edge: boolean
  connectable: boolean
  visible: boolean
  parent: mxCell | null
  children: mxCell[] | null
  getId(): string
  setId(id: string): void
  getValue(): any
  setValue(value: any): void
  getGeometry(): mxGeometry | null
  setGeometry(geometry: mxGeometry): void
  getStyle(): string | null
  setStyle(style: string): void
  isVertex(): boolean
  isEdge(): boolean
  isConnectable(): boolean
  isVisible(): boolean
  getChildCount(): number
  getChildAt(index: number): mxCell
}

export interface mxGraphModel {
  beginUpdate(): void
  endUpdate(): void
  getCell(id: string): mxCell | null
  getCells(): { [id: string]: mxCell }
  getRoot(): mxCell
  setRoot(root: mxCell): void
  getChildCount(cell: mxCell): number
  getChildAt(cell: mxCell, index: number): mxCell
  isVertex(cell: mxCell): boolean
  isEdge(cell: mxCell): boolean
  getValue(cell: mxCell): any
  setValue(cell: mxCell, value: any): void
  getGeometry(cell: mxCell): mxGeometry | null
  setGeometry(cell: mxCell, geometry: mxGeometry): void
  getStyle(cell: mxCell): string | null
  setStyle(cell: mxCell, style: string): void
  addListener(eventName: string, funct: (sender: any, evt: mxEventObject) => void): void
  removeListener(funct: (sender: any, evt: mxEventObject) => void): void
}

export interface mxGraphView {
  scale: number
  translate: mxPoint
  getScale(): number
  setScale(value: number): void
  getTranslate(): mxPoint
  setTranslate(dx: number, dy: number): void
  refresh(): void
}

export interface mxSelectionModel {
  cells: mxCell[]
  clear(): void
  isEmpty(): boolean
  getCells(): mxCell[]
  setCells(cells: mxCell[]): void
  addCell(cell: mxCell): void
  removeCell(cell: mxCell): void
  addListener(eventName: string, funct: (sender: any, evt: mxEventObject) => void): void
}

export interface mxUndoableEdit {
  changes: any[]
  undo(): void
  redo(): void
  die(): void
}

export interface mxUndoManager {
  size: number
  history: mxUndoableEdit[]
  indexOfNextAdd: number
  canUndo(): boolean
  canRedo(): boolean
  undo(): void
  redo(): void
  clear(): void
  undoableEditHappened(undoableEdit: mxUndoableEdit): void
}

export interface mxEventObject {
  name: string
  properties: { [key: string]: any }
  getProperty(key: string): any
}

export interface mxRubberband {
  enabled: boolean
  destroy(): void
}

export interface mxGraphOptions {
  container?: HTMLElement
  model?: mxGraphModel
}

export declare class mxGraph {
  constructor(container: HTMLElement, model?: mxGraphModel)
  container: HTMLElement
  model: mxGraphModel
  view: mxGraphView
  selectionModel: mxSelectionModel
  enabled: boolean

  getDefaultParent(): mxCell
  insertVertex(
    parent: mxCell | null,
    id: string | null,
    value: any,
    x: number,
    y: number,
    width: number,
    height: number,
    style?: string,
    relative?: boolean
  ): mxCell

  insertEdge(
    parent: mxCell | null,
    id: string | null,
    value: any,
    source: mxCell | null,
    target: mxCell | null,
    style?: string
  ): mxCell

  removeCells(cells?: mxCell[], includeEdges?: boolean): mxCell[]
  getSelectionCells(): mxCell[]
  getSelectionCell(): mxCell | null
  setSelectionCell(cell: mxCell): void
  setSelectionCells(cells: mxCell[]): void
  clearSelection(): void
  getSelectionModel(): mxSelectionModel

  zoomIn(): void
  zoomOut(): void
  zoomActual(): void
  fit(border?: number, doCentering?: boolean, maxScale?: number): void

  setConnectable(connectable: boolean): void
  setCellsMovable(movable: boolean): void
  setCellsResizable(resizable: boolean): void
  setCellsEditable(editable: boolean): void
  setDropEnabled(dropEnabled: boolean): void
  setPanning(panning: boolean): void
  setTooltips(tooltips: boolean): void
  setEnabled(enabled: boolean): void

  getModel(): mxGraphModel
  getView(): mxGraphView
  destroy(): void
}

export declare class mxClient {
  static VERSION: string
  static IS_SVG: boolean
  static IS_TOUCH: boolean
  static isBrowserSupported(): boolean
}

export declare class mxUtils {
  static clone(obj: any): any
  static getFormattedDate(): string
}

export declare class mxEvent {
  static UNDO: string
  static REDO: string
  static CHANGE: string
}

declare global {
  interface Window {
    mxGraph: typeof mxGraph
    mxCell: any
    mxGeometry: any
    mxPoint: any
    mxRectangle: any
    mxGraphModel: any
    mxUndoManager: { new (size?: number): mxUndoManager }
    mxRubberband: { new (graph: mxGraph): mxRubberband }
    mxClient: typeof mxClient
    mxUtils: typeof mxUtils
    mxEvent: typeof mxEvent
    __graphController?: any
  }
}
