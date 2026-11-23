import type { DrawioPlugin, PluginContext } from '../types'

export interface A11yIssue {
  cellId: string
  type: 'empty-label' | 'dangling-edge'
  message: string
}

export function auditDiagramA11y(graph: any): A11yIssue[] {
  if (!graph || typeof graph.getAllCells !== 'function') return []

  const issues: A11yIssue[] = []
  const cells = graph.getAllCells()

  cells.forEach((cell: any) => {
    // Ignorar nodos estructurales raíz 0 y 1
    if (cell.id === '0' || cell.id === '1') return

    // Vértices sin etiqueta de texto
    if (cell.vertex && (!cell.value || String(cell.value).trim() === '')) {
      issues.push({
        cellId: cell.id,
        type: 'empty-label',
        message: `El nodo "${cell.id}" no tiene etiqueta descriptiva ni texto accesible.`
      })
    }

    // Aristas sin origen o sin destino
    if (cell.edge) {
      if (!cell.source || !cell.target) {
        issues.push({
          cellId: cell.id,
          type: 'dangling-edge',
          message: `El conector "${cell.id}" está desconectado en uno de sus extremos.`
        })
      }
    }
  })

  return issues
}

export const diagramA11yPlugin: DrawioPlugin = {
  id: 'builtin.diagram-a11y',
  name: 'Auditoría de Accesibilidad & Calidad',
  version: '1.0.0',
  description: 'Verifica etiquetas accesibles en formas y detecta conectores sueltos.',
  author: 'Drawio.next Core Team',

  init(context: PluginContext) {
    context.registerMenuItem({
      id: 'audit-diagram-a11y',
      label: 'Auditar Accesibilidad del Diagrama',
      icon: '🛡️',
      action: () => {
        const graph = context.getGraph()
        if (!graph) return
        const issues = auditDiagramA11y(graph)

        if (issues.length === 0) {
          context.showNotification({
            title: '✅ Accesibilidad OK',
            message: 'No se encontraron problemas de accesibilidad ni conectores huérfanos.',
            type: 'success'
          })
        } else {
          context.showNotification({
            title: `⚠️ ${issues.length} advertencia(s) detectada(s)`,
            message: issues.map(i => i.message).slice(0, 3).join('\n') + (issues.length > 3 ? ` ...y ${issues.length - 3} más` : ''),
            type: 'warning'
          })
        }
      }
    })
  }
}
