import { writable, get } from 'svelte/store'
import type {
  DrawioPlugin,
  PluginContext,
  MenuItemContribution,
  ToolbarContribution,
  RegisteredPluginRecord,
  NotificationPayload
} from './types'
import { activeGraph } from '../stores/graph'

export class PluginRegistry {
  private plugins = new Map<string, RegisteredPluginRecord>()
  private menuItems = new Map<string, MenuItemContribution>()
  private toolbarItems = new Map<string, ToolbarContribution>()
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>()

  // Stores reactivos para sincronización transparente con Svelte
  public readonly pluginsStore = writable<DrawioPlugin[]>([])
  public readonly enabledPluginsStore = writable<string[]>([])
  public readonly menuItemsStore = writable<MenuItemContribution[]>([])
  public readonly toolbarItemsStore = writable<ToolbarContribution[]>([])
  public readonly notificationStore = writable<NotificationPayload | null>(null)

  private syncStores() {
    this.pluginsStore.set(Array.from(this.plugins.values()).map(r => r.plugin))
    this.enabledPluginsStore.set(
      Array.from(this.plugins.entries()).filter(([_, r]) => r.enabled).map(([id]) => id)
    )
    this.menuItemsStore.set(Array.from(this.menuItems.values()))
    this.toolbarItemsStore.set(Array.from(this.toolbarItems.values()))
  }

  /**
   * Crea el contexto aislado para un plugin dado
   */
  private createContext(pluginId: string): PluginContext {
    return {
      getGraph: () => get(activeGraph),
      registerMenuItem: (item: MenuItemContribution) => {
        this.menuItems.set(item.id, item)
        this.syncStores()
        const unregister = () => {
          this.menuItems.delete(item.id)
          this.syncStores()
        }
        const record = this.plugins.get(pluginId)
        if (record) record.cleanupFns.push(unregister)
        return unregister
      },
      registerToolbarItem: (item: ToolbarContribution) => {
        this.toolbarItems.set(item.id, item)
        this.syncStores()
        const unregister = () => {
          this.toolbarItems.delete(item.id)
          this.syncStores()
        }
        const record = this.plugins.get(pluginId)
        if (record) record.cleanupFns.push(unregister)
        return unregister
      },
      showNotification: (payload: NotificationPayload | string) => {
        const p: NotificationPayload = typeof payload === 'string'
          ? { message: payload, type: 'info' }
          : payload
        this.notificationStore.set(p)
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)!.add(handler)
        const unlisten = () => {
          this.eventListeners.get(event)?.delete(handler)
        }
        const record = this.plugins.get(pluginId)
        if (record) record.cleanupFns.push(unlisten)
        return unlisten
      },
      emit: (event: string, ...args: any[]) => {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
          listeners.forEach(fn => {
            try {
              fn(...args)
            } catch (err) {
              console.error(`Error en listener de evento '${event}':`, err)
            }
          })
        }
      }
    }
  }

  /**
   * Registra un nuevo plugin. Si autoEnable es true (default), lo inicializa de inmediato.
   */
  async register(plugin: DrawioPlugin, autoEnable = true): Promise<boolean> {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin con id "${plugin.id}" ya está registrado.`)
      return false
    }

    const record: RegisteredPluginRecord = {
      plugin,
      enabled: false,
      cleanupFns: []
    }
    this.plugins.set(plugin.id, record)
    this.syncStores()

    if (autoEnable) {
      await this.enable(plugin.id)
    }

    return true
  }

  /**
   * Habilita e inicializa un plugin registrado
   */
  async enable(id: string): Promise<boolean> {
    const record = this.plugins.get(id)
    if (!record || record.enabled) return false

    try {
      const context = this.createContext(id)
      await record.plugin.init(context)
      record.enabled = true
      this.syncStores()
      return true
    } catch (err) {
      console.error(`Error al inicializar plugin "${id}":`, err)
      await this.disable(id)
      return false
    }
  }

  /**
   * Deshabilita un plugin, limpiando sus menús, toolbar y listeners registrados
   */
  async disable(id: string): Promise<boolean> {
    const record = this.plugins.get(id)
    if (!record || !record.enabled) return false

    // Ejecutar funciones de limpieza registradas
    record.cleanupFns.forEach(fn => {
      try {
        fn()
      } catch (err) {
        console.error(`Error en cleanup de plugin "${id}":`, err)
      }
    })
    record.cleanupFns = []

    // Ejecutar destroy() si está implementado
    if (typeof record.plugin.destroy === 'function') {
      try {
        await record.plugin.destroy()
      } catch (err) {
        console.error(`Error en destroy de plugin "${id}":`, err)
      }
    }

    record.enabled = false
    this.syncStores()
    return true
  }

  /**
   * Desregistra un plugin completamente
   */
  async unregister(id: string): Promise<boolean> {
    const record = this.plugins.get(id)
    if (!record) return false

    if (record.enabled) {
      await this.disable(id)
    }

    this.plugins.delete(id)
    this.syncStores()
    return true
  }

  /**
   * Retorna todos los plugins registrados
   */
  getPlugins(): DrawioPlugin[] {
    return Array.from(this.plugins.values()).map(r => r.plugin)
  }

  /**
   * Indica si un plugin está actualmente activo
   */
  isEnabled(id: string): boolean {
    return Boolean(this.plugins.get(id)?.enabled)
  }

  /**
   * Limpia y reinicia todos los plugins y listeners (ideal para tests)
   */
  async clearAll(): Promise<void> {
    const ids = Array.from(this.plugins.keys())
    for (const id of ids) {
      await this.unregister(id)
    }
    this.eventListeners.clear()
    this.menuItems.clear()
    this.toolbarItems.clear()
    this.syncStores()
  }
}

export const pluginRegistry = new PluginRegistry()
