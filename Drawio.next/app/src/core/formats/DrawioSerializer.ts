/**
 * DrawioSerializer — Serialización y deserialización fiel de formatos .drawio y .xml
 *
 * Cumple con la especificación estándar de draw.io (<mxfile><diagram>...).
 * Diseñado como módulo TypeScript desacoplado de la UI (sin dependencias de Svelte).
 */

export interface SerializedPage {
  id: string
  name: string
  xml: string
}

export interface ParsedCell {
  id: string
  value: string
  style: string
  vertex: boolean
  edge: boolean
  parent?: string
  source?: string
  target?: string
  geometry?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ParsedPage {
  id: string
  name: string
  xml: string
  cells: ParsedCell[]
}

export interface ParsedDrawio {
  pages: ParsedPage[]
}

/**
 * Obtiene una instancia funcional de DOMParser tanto en navegador como en Node / Vitest
 */
function getDOMParser(): DOMParser {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser()
  }
  if (typeof (globalThis as any).DOMParser !== 'undefined') {
    return new (globalThis as any).DOMParser()
  }
  if ((globalThis as any).window?.DOMParser) {
    return new (globalThis as any).window.DOMParser()
  }
  throw new Error('DOMParser no está disponible en este entorno.')
}

/**
 * Obtiene una instancia funcional de XMLSerializer
 */
function getXMLSerializer(): XMLSerializer {
  if (typeof XMLSerializer !== 'undefined') {
    return new XMLSerializer()
  }
  if (typeof (globalThis as any).XMLSerializer !== 'undefined') {
    return new (globalThis as any).XMLSerializer()
  }
  if ((globalThis as any).window?.XMLSerializer) {
    return new (globalThis as any).window.XMLSerializer()
  }
  return {
    serializeToString: (node: Element) => node.outerHTML || ''
  } as any
}

/**
 * Búsqueda de elementos por nombre de tag insensible a mayúsculas/minúsculas y compatible con XML
 */
function getElementsByTag(parent: Element | Document, tagName: string): Element[] {
  // 1. Tag exacto
  const exact = Array.from(parent.getElementsByTagName(tagName))
  if (exact.length > 0) return exact

  // 2. Tag en minúsculas
  const lower = Array.from(parent.getElementsByTagName(tagName.toLowerCase()))
  if (lower.length > 0) return lower

  // 3. Fallback con querySelectorAll
  try {
    const qsa = Array.from(parent.querySelectorAll(tagName))
    if (qsa.length > 0) return qsa
  } catch {
    // Ignorar si el selector no es compatible
  }

  // 4. Búsqueda insensible sobre todos los elementos
  const all = Array.from(parent.getElementsByTagName('*'))
  return all.filter((el) => el.nodeName.toLowerCase() === tagName.toLowerCase())
}

/**
 * Obtiene el primer elemento que coincida con el nombre del tag
 */
function getFirstElementByTag(parent: Element | Document, tagName: string): Element | null {
  const elements = getElementsByTag(parent, tagName)
  return elements.length > 0 ? elements[0] : null
}

/**
 * Deserializa un archivo o string .drawio / .xml en una estructura tipada de páginas y celdas
 */
export function parseDrawio(rawContent: string): ParsedDrawio {
  if (!rawContent || typeof rawContent !== 'string') {
    return { pages: [] }
  }

  const parser = getDOMParser()
  const doc = parser.parseFromString(rawContent.trim(), 'application/xml')

  const parseErrors = getElementsByTag(doc, 'parsererror')
  if (parseErrors.length > 0) {
    throw new Error(`Error de sintaxis XML: ${parseErrors[0].textContent}`)
  }

  const pages: ParsedPage[] = []
  const diagrams = getElementsByTag(doc, 'diagram')

  if (diagrams.length > 0) {
    diagrams.forEach((diag, index) => {
      const pageId = diag.getAttribute('id') || `page-${index + 1}`
      const pageName = diag.getAttribute('name') || `Página ${index + 1}`

      // Contenido del modelo XML dentro del nodo <diagram>
      const modelNode = getFirstElementByTag(diag, 'mxGraphModel')
      let pageXml = ''
      if (modelNode) {
        const serializer = getXMLSerializer()
        pageXml = serializer.serializeToString(modelNode)
      } else {
        pageXml = diag.textContent?.trim() || ''
      }

      const cells = extractCellsFromXml(pageXml || rawContent)
      pages.push({
        id: pageId,
        name: pageName,
        xml: pageXml,
        cells
      })
    })
  } else {
    // Si no contiene tags <diagram>, puede ser un <mxGraphModel> directo de un archivo .xml
    const modelNode = getFirstElementByTag(doc, 'mxGraphModel')
    let pageXml = ''
    if (modelNode) {
      const serializer = getXMLSerializer()
      pageXml = serializer.serializeToString(modelNode)
    } else {
      pageXml = rawContent
    }

    const cells = extractCellsFromXml(pageXml)
    pages.push({
      id: 'page-1',
      name: 'Página 1',
      xml: pageXml,
      cells
    })
  }

  return { pages }
}

/**
 * Extrae y parsea todas las celdas mxCell de un fragmento XML
 */
export function extractCellsFromXml(xmlString: string): ParsedCell[] {
  if (!xmlString) return []

  try {
    const parser = getDOMParser()
    const doc = parser.parseFromString(xmlString.trim(), 'application/xml')
    const cellNodes = getElementsByTag(doc, 'mxCell')

    return cellNodes.map((cell) => {
      const id = cell.getAttribute('id') || ''
      const value = cell.getAttribute('value') || ''
      const style = cell.getAttribute('style') || ''
      const vertex = cell.getAttribute('vertex') === '1'
      const edge = cell.getAttribute('edge') === '1'
      const parent = cell.getAttribute('parent') || undefined
      const source = cell.getAttribute('source') || undefined
      const target = cell.getAttribute('target') || undefined

      let geometry: ParsedCell['geometry'] = undefined
      const geoNode = getFirstElementByTag(cell, 'mxGeometry')
      if (geoNode) {
        geometry = {
          x: parseFloat(geoNode.getAttribute('x') || '0'),
          y: parseFloat(geoNode.getAttribute('y') || '0'),
          width: parseFloat(geoNode.getAttribute('width') || '0'),
          height: parseFloat(geoNode.getAttribute('height') || '0')
        }
      }

      return {
        id,
        value,
        style,
        vertex,
        edge,
        parent,
        source,
        target,
        geometry
      }
    })
  } catch {
    return []
  }
}

/**
 * Serializa una o más páginas a formato estándar .drawio (<mxfile>)
 */
export function serializeToDrawio(pages: SerializedPage[]): string {
  if (!pages || pages.length === 0) {
    return '<mxfile host="drawio.next" version="1.0"><diagram id="p1" name="Página 1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'
  }

  const diagramTags = pages.map((page, idx) => {
    const id = page.id || `page-${idx + 1}`
    const name = escapeXmlAttribute(page.name || `Página ${idx + 1}`)
    let innerXml = page.xml ? page.xml.trim() : ''

    // Si el XML de la página no tiene un mxGraphModel envolvente, añadir estructura básica
    if (!innerXml.includes('<mxGraphModel')) {
      innerXml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`
    }

    return `  <diagram id="${id}" name="${name}">\n    ${innerXml}\n  </diagram>`
  }).join('\n')

  return `<mxfile host="drawio.next" modified="${new Date().toISOString()}" version="1.0">\n${diagramTags}\n</mxfile>`
}

/**
 * Serializa un único modelo de diagrama a formato XML directo
 */
export function serializeToRawXml(modelXml: string): string {
  const trimmed = modelXml ? modelXml.trim() : ''
  if (trimmed.startsWith('<?xml')) {
    return trimmed
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${trimmed}`
}

/**
 * Escapa caracteres reservados en atributos XML
 */
function escapeXmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
