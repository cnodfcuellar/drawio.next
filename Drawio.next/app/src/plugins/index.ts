import { pluginRegistry } from './PluginRegistry'
import { diagramStatisticsPlugin } from './builtin/diagram-statistics'
import { diagramA11yPlugin } from './builtin/diagram-a11y'

export * from './types'
export * from './PluginRegistry'
export * from './builtin/diagram-statistics'
export * from './builtin/diagram-a11y'

let initialized = false

export function initDefaultPlugins() {
  if (initialized) return
  initialized = true
  pluginRegistry.register(diagramStatisticsPlugin)
  pluginRegistry.register(diagramA11yPlugin)
}
