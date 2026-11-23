import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseDrawio, serializeToDrawio, extractCellsFromXml } from './DrawioSerializer'

describe('Formatos — Tests de Round-Trip Críticos (.drawio / .xml)', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures')
  const fixtureNames = ['simple', 'flowchart', 'uml', 'er', 'complex']

  fixtureNames.forEach((name) => {
    it(`Round-trip sin pérdida de datos en fixture: ${name}.drawio`, () => {
      const filePath = path.join(fixturesDir, `${name}.drawio`)
      expect(fs.existsSync(filePath)).toBe(true)

      const originalRaw = fs.readFileSync(filePath, 'utf-8')
      const parsed = parseDrawio(originalRaw)

      // Verificación de parsing inicial
      expect(parsed.pages.length).toBeGreaterThanOrEqual(1)
      if (name === 'complex') {
        expect(parsed.pages.length).toBe(2)
      }

      // Serialización fiel
      const serialized = serializeToDrawio(parsed.pages)
      expect(serialized).toContain('<mxfile')
      expect(serialized).toContain('</mxfile>')

      // Deserialización del contenido serializado (Round-trip)
      const reparsed = parseDrawio(serialized)

      // 1. Conservación de páginas
      expect(reparsed.pages.length).toBe(parsed.pages.length)

      // 2. Conservación de nombres y cantidad exacta de celdas por página
      reparsed.pages.forEach((page, i) => {
        const origPage = parsed.pages[i]
        expect(page.name).toBe(origPage.name)
        expect(page.cells.length).toBe(origPage.cells.length)

        // 3. Verificación de cada celda individual
        page.cells.forEach((cell, ci) => {
          const origCell = origPage.cells[ci]
          expect(cell.id).toBe(origCell.id)
          expect(cell.vertex).toBe(origCell.vertex)
          expect(cell.edge).toBe(origCell.edge)
          expect(cell.value).toBe(origCell.value)

          // Si tiene geometría, comprobar que las dimensiones coinciden exactamente
          if (origCell.geometry) {
            expect(cell.geometry).toBeDefined()
            expect(cell.geometry?.x).toBe(origCell.geometry.x)
            expect(cell.geometry?.y).toBe(origCell.geometry.y)
            expect(cell.geometry?.width).toBe(origCell.geometry.width)
            expect(cell.geometry?.height).toBe(origCell.geometry.height)
          }
        })
      })
    })
  })

  it('soporta deserialización de fragmentos XML puros sin etiqueta mxfile (<mxGraphModel>)', () => {
    const rawModel = `
      <mxGraphModel>
        <root>
          <mxCell id="0"/>
          <mxCell id="1" parent="0"/>
          <mxCell id="node-raw" value="Nodo Directo" vertex="1" parent="1">
            <mxGeometry x="50" y="50" width="100" height="40" as="geometry"/>
          </mxCell>
        </root>
      </mxGraphModel>
    `
    const parsed = parseDrawio(rawModel)
    expect(parsed.pages.length).toBe(1)
    expect(parsed.pages[0].cells.length).toBe(3) // 0, 1, node-raw
    expect(parsed.pages[0].cells[2].value).toBe('Nodo Directo')

    // Serializar a formato .drawio completo
    const serialized = serializeToDrawio(parsed.pages)
    expect(serialized).toContain('<mxfile')
    expect(serialized).toContain('<diagram')
  })

  it('extractCellsFromXml extrae vértices y aristas correctamente', () => {
    const xml = `
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="v1" value="A" vertex="1" parent="1">
          <mxGeometry x="10" y="20" width="80" height="30" as="geometry"/>
        </mxCell>
        <mxCell id="v2" value="B" vertex="1" parent="1">
          <mxGeometry x="110" y="20" width="80" height="30" as="geometry"/>
        </mxCell>
        <mxCell id="e1" value="conecta" edge="1" source="v1" target="v2" parent="1"/>
      </root>
    `
    const cells = extractCellsFromXml(xml)
    expect(cells.length).toBe(5)

    const v1 = cells.find(c => c.id === 'v1')
    expect(v1?.vertex).toBe(true)
    expect(v1?.geometry?.x).toBe(10)

    const e1 = cells.find(c => c.id === 'e1')
    expect(e1?.edge).toBe(true)
    expect(e1?.source).toBe('v1')
    expect(e1?.target).toBe('v2')
  })
})
