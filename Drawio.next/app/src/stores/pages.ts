import { writable, get } from 'svelte/store'
import { activeGraph } from './graph'
import { scheduleAutoSave } from './persistence'

export interface PageItem {
  id: string
  name: string
  xml: string
}

const EMPTY_MODEL_XML = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'

/**
 * Lista de páginas del documento actual
 */
export const pages = writable<PageItem[]>([
  { id: 'page-1', name: 'Page-1', xml: '' }
])

/**
 * ID de la página actualmente activa
 */
export const activePageId = writable<string>('page-1')

/**
 * Inicializa las páginas del documento
 */
export function initPages(initialPages: PageItem[], currentActiveId?: string): void {
  if (!initialPages || initialPages.length === 0) {
    pages.set([{ id: 'page-1', name: 'Page-1', xml: '' }])
    activePageId.set('page-1')
    return
  }

  pages.set(initialPages)
  const targetId = currentActiveId && initialPages.some(p => p.id === currentActiveId)
    ? currentActiveId
    : initialPages[0].id
  activePageId.set(targetId)
}

/**
 * Guarda el modelo XML actual del canvas en la página activa
 */
export function syncCurrentPageXml(): void {
  const graph = get(activeGraph)
  if (!graph) return

  const currentId = get(activePageId)
  const currentXml = graph.exportModelXml()

  pages.update(list => {
    return list.map(p => {
      if (p.id === currentId) {
        return { ...p, xml: currentXml }
      }
      return p
    })
  })
}

/**
 * Cambia a una página específica, guardando previamente el estado de la página actual
 */
export function switchPage(targetId: string): boolean {
  const currentId = get(activePageId)
  if (currentId === targetId) return true

  const pageList = get(pages)
  const targetPage = pageList.find(p => p.id === targetId)
  if (!targetPage) return false

  const graph = get(activeGraph)
  if (graph) {
    // 1. Guardar la página que se está abandonando
    syncCurrentPageXml()

    // 2. Cargar el modelo de la nueva página en el canvas
    const xmlToLoad = targetPage.xml || EMPTY_MODEL_XML
    graph.importModelXml(xmlToLoad)
    graph.resetZoom()
  }

  activePageId.set(targetId)

  // Disparar autoguardado del documento completo
  if (graph) {
    scheduleAutoSave(graph)
  }

  return true
}

/**
 * Añade una nueva página al documento y la activa
 */
export function addPage(name?: string): PageItem {
  const graph = get(activeGraph)
  if (graph) {
    syncCurrentPageXml()
  }

  const pageList = get(pages)
  const nextNum = pageList.length + 1
  const pageName = name || `Page-${nextNum}`
  const pageId = `page-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const newPage: PageItem = {
    id: pageId,
    name: pageName,
    xml: EMPTY_MODEL_XML
  }

  pages.update(list => [...list, newPage])
  activePageId.set(pageId)

  if (graph) {
    graph.importModelXml(EMPTY_MODEL_XML)
    graph.resetZoom()
    scheduleAutoSave(graph)
  }

  return newPage
}

/**
 * Renombra una página existente
 */
export function renamePage(pageId: string, newName: string): boolean {
  const trimmed = newName.trim()
  if (!trimmed) return false

  pages.update(list => {
    return list.map(p => {
      if (p.id === pageId) {
        return { ...p, name: trimmed }
      }
      return p
    })
  })

  const graph = get(activeGraph)
  if (graph) {
    scheduleAutoSave(graph)
  }

  return true
}

/**
 * Duplica una página con todo su contenido gráfico
 */
export function duplicatePage(pageId: string): PageItem | null {
  const pageList = get(pages)
  const sourcePage = pageList.find(p => p.id === pageId)
  if (!sourcePage) return null

  const graph = get(activeGraph)
  if (graph) {
    syncCurrentPageXml()
  }

  // Obtener el XML más fresco de la página origen
  const freshList = get(pages)
  const freshSource = freshList.find(p => p.id === pageId) || sourcePage

  const newId = `page-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const newName = `${freshSource.name} (Copia)`

  const clonedPage: PageItem = {
    id: newId,
    name: newName,
    xml: freshSource.xml || EMPTY_MODEL_XML
  }

  pages.update(list => [...list, clonedPage])
  activePageId.set(newId)

  if (graph) {
    graph.importModelXml(clonedPage.xml)
    graph.resetZoom()
    scheduleAutoSave(graph)
  }

  return clonedPage
}

/**
 * Elimina una página del documento.
 * Siempre debe quedar al menos 1 página.
 */
export function removePage(pageId: string): boolean {
  const pageList = get(pages)
  if (pageList.length <= 1) return false

  const pageIndex = pageList.findIndex(p => p.id === pageId)
  if (pageIndex === -1) return false

  const currentActive = get(activePageId)
  let nextActiveId = currentActive

  // Si la página que se elimina es la que está activa, seleccionar una contigua
  if (currentActive === pageId) {
    const nextIndex = pageIndex > 0 ? pageIndex - 1 : 1
    nextActiveId = pageList[nextIndex].id
  }

  pages.update(list => list.filter(p => p.id !== pageId))

  if (currentActive === pageId) {
    activePageId.set(nextActiveId)
    const graph = get(activeGraph)
    if (graph) {
      const targetPage = get(pages).find(p => p.id === nextActiveId)
      graph.importModelXml(targetPage?.xml || EMPTY_MODEL_XML)
      graph.resetZoom()
      scheduleAutoSave(graph)
    }
  } else {
    const graph = get(activeGraph)
    if (graph) {
      scheduleAutoSave(graph)
    }
  }

  return true
}

/**
 * Obtiene todas las páginas actuales con su XML actualizado
 */
export function getAllPagesWithFreshXml(): PageItem[] {
  syncCurrentPageXml()
  return get(pages)
}
