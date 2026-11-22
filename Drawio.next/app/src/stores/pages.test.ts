import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import {
  pages,
  activePageId,
  initPages,
  addPage,
  switchPage,
  renamePage,
  duplicatePage,
  removePage,
  syncCurrentPageXml,
  getAllPagesWithFreshXml
} from './pages'
import { activeGraph } from './graph'

describe('pages store and multi-page manager', () => {
  let mockGraph: any

  beforeEach(() => {
    mockGraph = {
      exportModelXml: vi.fn(() => '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'),
      importModelXml: vi.fn((_xml: string) => true),
      resetZoom: vi.fn(),
      exportToXml: vi.fn(() => '<mxfile></mxfile>')
    }
    activeGraph.set(mockGraph)

    initPages([
      { id: 'p1', name: 'Página 1', xml: '<mxGraphModel id="1"></mxGraphModel>' },
      { id: 'p2', name: 'Página 2', xml: '<mxGraphModel id="2"></mxGraphModel>' }
    ], 'p1')
  })

  it('inicializa correctamente las páginas y la página activa', () => {
    const list = get(pages)
    expect(list.length).toBe(2)
    expect(get(activePageId)).toBe('p1')
    expect(list[0].name).toBe('Página 1')
  })

  it('syncCurrentPageXml guarda el XML fresco en la página activa', () => {
    syncCurrentPageXml()
    expect(mockGraph.exportModelXml).toHaveBeenCalled()
    const list = get(pages)
    expect(list[0].xml).toBe('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>')
  })

  it('switchPage guarda la página actual y carga la página destino', () => {
    const success = switchPage('p2')
    expect(success).toBe(true)
    expect(get(activePageId)).toBe('p2')
    expect(mockGraph.importModelXml).toHaveBeenCalledWith('<mxGraphModel id="2"></mxGraphModel>')
    expect(mockGraph.resetZoom).toHaveBeenCalled()
  })

  it('addPage crea una nueva página, guarda la anterior y activa la nueva', () => {
    const newPage = addPage('Arquitectura')
    expect(newPage.name).toBe('Arquitectura')
    expect(get(pages).length).toBe(3)
    expect(get(activePageId)).toBe(newPage.id)
    expect(mockGraph.importModelXml).toHaveBeenCalledWith(expect.stringContaining('<mxGraphModel>'))
  })

  it('renamePage actualiza el nombre de la página seleccionada', () => {
    const ok = renamePage('p1', 'Inicio Rediseñado')
    expect(ok).toBe(true)
    const list = get(pages)
    expect(list[0].name).toBe('Inicio Rediseñado')
  })

  it('duplicatePage clona la página con todo su contenido', () => {
    const dup = duplicatePage('p1')
    expect(dup).not.toBeNull()
    expect(dup?.name).toBe('Página 1 (Copia)')
    expect(get(pages).length).toBe(3)
    expect(get(activePageId)).toBe(dup?.id)
  })

  it('removePage elimina la página especificada y selecciona otra', () => {
    const ok = removePage('p1')
    expect(ok).toBe(true)
    expect(get(pages).length).toBe(1)
    expect(get(activePageId)).toBe('p2')
  })

  it('removePage no permite eliminar la última página', () => {
    removePage('p1')
    const ok = removePage('p2')
    expect(ok).toBe(false)
    expect(get(pages).length).toBe(1)
  })

  it('getAllPagesWithFreshXml sincroniza y retorna todas las páginas', () => {
    const list = getAllPagesWithFreshXml()
    expect(list.length).toBe(2)
    expect(mockGraph.exportModelXml).toHaveBeenCalled()
  })
})
