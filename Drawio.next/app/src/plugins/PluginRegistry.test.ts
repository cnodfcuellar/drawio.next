import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { PluginRegistry } from './PluginRegistry'
import type { DrawioPlugin, PluginContext } from './types'
import { computeDiagramStats } from './builtin/diagram-statistics'
import { auditDiagramA11y } from './builtin/diagram-a11y'

describe('PluginRegistry — Arquitectura Extensible de Plugins', () => {
  let registry: PluginRegistry

  beforeEach(async () => {
    registry = new PluginRegistry()
    await registry.clearAll()
  })

  it('registra y auto-habilita un plugin correctamente', async () => {
    let initialized = false

    const testPlugin: DrawioPlugin = {
      id: 'test.plugin-1',
      name: 'Plugin de Prueba',
      version: '1.0.0',
      description: 'Test plugin',
      init(ctx: PluginContext) {
        initialized = true
        ctx.registerMenuItem({
          id: 'test-action',
          label: 'Acción de prueba',
          action: () => {}
        })
      }
    }

    const ok = await registry.register(testPlugin, true)
    expect(ok).toBe(true)
    expect(initialized).toBe(true)
    expect(registry.isEnabled('test.plugin-1')).toBe(true)

    // Verifica que el menú se registró en el store reactivo
    const menuItems = get(registry.menuItemsStore)
    expect(menuItems.length).toBe(1)
    expect(menuItems[0].id).toBe('test-action')
  })

  it('deshabilita un plugin y limpia automáticamente sus menús y toolbar items', async () => {
    let destroyed = false

    const testPlugin: DrawioPlugin = {
      id: 'test.plugin-clean',
      name: 'Cleanup Plugin',
      version: '1.0.0',
      description: 'Limpia recursos al desactivar',
      init(ctx: PluginContext) {
        ctx.registerMenuItem({
          id: 'menu-1',
          label: 'Menú 1',
          action: () => {}
        })
        ctx.registerToolbarItem({
          id: 'tool-1',
          label: 'Tool 1',
          icon: '🔧',
          action: () => {}
        })
      },
      destroy() {
        destroyed = true
      }
    }

    await registry.register(testPlugin, true)
    expect(get(registry.menuItemsStore).length).toBe(1)
    expect(get(registry.toolbarItemsStore).length).toBe(1)

    // Deshabilitar
    await registry.disable('test.plugin-clean')
    expect(registry.isEnabled('test.plugin-clean')).toBe(false)
    expect(destroyed).toBe(true)

    // Menús y toolbar deben haberse limpiado por completo
    expect(get(registry.menuItemsStore).length).toBe(0)
    expect(get(registry.toolbarItemsStore).length).toBe(0)
  })

  it('gestiona listeners de eventos del plugin y los limpia al deshabilitar', async () => {
    const eventHandler = vi.fn()
    let emitFn: ((ev: string, data: any) => void) | null = null

    const testPlugin: DrawioPlugin = {
      id: 'test.events',
      name: 'Event Listener Plugin',
      version: '1.0.0',
      description: 'Escucha eventos',
      init(ctx: PluginContext) {
        ctx.on('diagram:saved', eventHandler)
        emitFn = ctx.emit
      }
    }

    await registry.register(testPlugin, true)
    expect(emitFn).not.toBeNull()

    // Disparar evento
    emitFn!('diagram:saved', { id: 'diag-1' })
    expect(eventHandler).toHaveBeenCalledTimes(1)
    expect(eventHandler).toHaveBeenCalledWith({ id: 'diag-1' })

    // Deshabilitar debe desregistrar el listener
    await registry.disable('test.plugin-events')
    emitFn!('diagram:saved', { id: 'diag-2' })
  })

  it('computeDiagramStats calcula correctamente métricas de grafo', () => {
    const mockGraph = {
      getAllCells: () => [
        { id: '0' },
        { id: '1' },
        { id: 'v1', vertex: true, value: 'Inicio' },
        { id: 'v2', vertex: true, value: 'Fin' },
        { id: 'v3', vertex: true, value: 'Aislado' },
        { id: 'e1', edge: true, source: { id: 'v1' }, target: { id: 'v2' } }
      ]
    }

    const stats = computeDiagramStats(mockGraph)
    expect(stats.vertices).toBe(3)
    expect(stats.edges).toBe(1)
    expect(stats.isolatedVertices).toBe(1)
    expect(stats.connectivityRatio).toBe(0.33)
  })

  it('auditDiagramA11y detecta nodos sin etiqueta y aristas huérfanas', () => {
    const mockGraph = {
      getAllCells: () => [
        { id: '0' },
        { id: '1' },
        { id: 'node-ok', vertex: true, value: 'Con Etiqueta' },
        { id: 'node-empty', vertex: true, value: '   ' },
        { id: 'edge-orphan', edge: true, source: null, target: null }
      ]
    }

    const issues = auditDiagramA11y(mockGraph)
    expect(issues.length).toBe(2)
    expect(issues.some(i => i.type === 'empty-label' && i.cellId === 'node-empty')).toBe(true)
    expect(issues.some(i => i.type === 'dangling-edge' && i.cellId === 'edge-orphan')).toBe(true)
  })
})
