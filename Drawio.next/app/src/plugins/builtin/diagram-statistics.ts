import type { DrawioPlugin, PluginContext } from '../types'

export interface DiagramStats {
  totalCells: number
  vertices: number
  edges: number
  isolatedVertices: number
  connectivityRatio: number
}

export function computeDiagramStats(graph: any): DiagramStats {
  if (!graph || typeof graph.getAllCells !== 'function') {
    return {
      totalCells: 0,
      vertices: 0,
      edges: 0,
      isolatedVertices: 0,
      connectivityRatio: 0
    }
  }

  const allCells = graph.getAllCells()
  const vertices = allCells.filter((c: any) => c.vertex && c.id !== '0' && c.id !== '1')
  const edges = allCells.filter((c: any) => c.edge)

  // Calcular nodos aislados (vértices sin aristas conectadas)
  const connectedNodeIds = new Set<string>()
  edges.forEach((e: any) => {
    if (e.source?.id) connectedNodeIds.add(e.source.id)
    if (e.target?.id) connectedNodeIds.add(e.target.id)
  })

  const isolated = vertices.filter((v: any) => !connectedNodeIds.has(v.id)).length
  const ratio = vertices.length > 0 ? parseFloat((edges.length / vertices.length).toFixed(2)) : 0

  return {
    totalCells: vertices.length + edges.length,
    vertices: vertices.length,
    edges: edges.length,
    isolatedVertices: isolated,
    connectivityRatio: ratio
  }
}

export const diagramStatisticsPlugin: DrawioPlugin = {
  id: 'builtin.diagram-statistics',
  name: 'Estadísticas del Diagrama',
  version: '1.0.0',
  description: 'Calcula métricas clave del diagrama: cantidad de nodos, conectores, nodos aislados y densidad.',
  author: 'Drawio.next Core Team',

  init(context: PluginContext) {
    context.registerMenuItem({
      id: 'show-diagram-stats',
      label: 'Estadísticas del Diagrama',
      icon: '📊',
      shortcut: 'Alt+S',
      action: () => {
        const graph = context.getGraph()
        if (!graph) {
          context.showNotification({
            title: 'Estadísticas',
            message: 'No hay un diagrama activo para analizar.',
            type: 'warning'
          })
          return
        }

        const stats = computeDiagramStats(graph)
        context.showNotification({
          title: '📊 Estadísticas del Diagrama',
          message: `Nodos: ${stats.vertices} | Conectores: ${stats.edges} | Nodos Aislados: ${stats.isolatedVertices} | Conectividad: ${stats.connectivityRatio}`,
          type: 'info'
        })
      }
    })

    context.registerToolbarItem({
      id: 'toolbar-diagram-stats',
      label: 'Estadísticas',
      icon: '📊',
      tooltip: 'Analizar estadísticas del diagrama (Alt+S)',
      action: () => {
        const graph = context.getGraph()
        if (!graph) return
        const stats = computeDiagramStats(graph)
        context.showNotification({
          title: '📊 Estadísticas del Diagrama',
          message: `Nodos: ${stats.vertices} | Conectores: ${stats.edges} | Aislados: ${stats.isolatedVertices}`,
          type: 'info'
        })
      }
    })
  }
}
