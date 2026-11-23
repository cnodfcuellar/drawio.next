import type { GraphController } from '../core/GraphController'

export interface MenuItemContribution {
  id: string
  label: string
  icon?: string
  shortcut?: string
  action: () => void | Promise<void>
}

export interface ToolbarContribution {
  id: string
  label: string
  icon: string
  shortcut?: string
  tooltip?: string
  action: () => void | Promise<void>
}

export interface NotificationPayload {
  message: string
  title?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export interface PluginContext {
  getGraph(): GraphController | null
  registerMenuItem(item: MenuItemContribution): () => void
  registerToolbarItem(item: ToolbarContribution): () => void
  showNotification(payload: NotificationPayload | string): void
  on(event: string, handler: (...args: any[]) => void): () => void
  emit(event: string, ...args: any[]): void
}

export interface DrawioPlugin {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author?: string
  init(context: PluginContext): void | Promise<void>
  destroy?(): void | Promise<void>
}

export interface RegisteredPluginRecord {
  plugin: DrawioPlugin
  enabled: boolean
  cleanupFns: Array<() => void>
}
