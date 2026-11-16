# Plan de Desarrollo — Drawio.next (Revisado)
### Modernización Incremental · TypeScript + Vite + Svelte 5
**Versión corregida basada en escala real del código fuente**

> [!IMPORTANT]
> Este plan reemplaza al plan de 11 semanas anterior, que fue escrito sin conocer la escala real del proyecto. Los tiempos aquí son realistas para un equipo de 2-3 desarrolladores buenos pero novatos en este stack.

---

## Por qué NO reescribimos mxGraph desde cero

mxGraph es el motor de grafos que mueve todo el canvas de draw.io:

| Archivo | Líneas | Función |
|---------|--------|---------|
| `mxGraph.js` | ~12,000 | Motor principal del grafo |
| `mxGraphView.js` | ~2,500 | Renderizado del canvas |
| `mxEdgeHandler.js` | ~2,300 | Manejo de conectores |
| `mxVertexHandler.js` | ~2,100 | Manejo de vértices |
| `mxConnectionHandler.js` | ~2,200 | Lógica de conexión |
| `mxGraphHandler.js` | ~1,600 | Drag, selección, pan |
| `mxCoordinateAssignment.js` | ~1,500 | Algoritmos de layout |
| **132 archivos en total** | **~2.3 MB** | 15 años de bugs corregidos |

> [!CAUTION]
> Reescribir mxGraph desde cero es el **antipatrón "Big Rewrite"** — el error más caro en la historia del software. Netscape lo intentó en el año 2000, tardó 3 años y casi quiebra la empresa. **No lo hacemos.**

**Estrategia correcta:** Envolvemos mxGraph con TypeScript, lo tipificamos, y construimos la nueva UI y arquitectura *encima* de él. Cuando el equipo tenga experiencia suficiente, se pueden reemplazar módulos de mxGraph uno por uno.

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Motor de grafos | **mxGraph** (existente, envuelto) | No se reescribe — se tipifica |
| Lenguaje | **TypeScript 5** | Tipado estricto en todo código nuevo |
| Build | **Vite 6** | HMR instantáneo en desarrollo |
| UI | **Svelte 5** | Componentes visuales compilados a JS nativo |
| Testing unitario | **Vitest** | Integrado con Vite |
| Testing E2E | **Playwright** | Verifica paridad funcional |
| Testing visual | **Playwright Screenshots** | Detecta regresiones visuales |
| Estilo | **CSS Variables + Tailwind 4** | Sistema de temas claro/oscuro |
| Catálogo UI | **Storybook** | Visualizar componentes en todos sus estados |
| CI/CD | **GitHub Actions** | Bloquea PRs que rompan tests |

---

## Mapa de Versiones

```
v1.0 (MES 1–8)         v2.0 (MES 9–16)        v3.0 (MES 17–24)
─────────────────       ─────────────────       ─────────────────
Nueva UI en Svelte 5    Formatos avanzados      Integraciones nube
mxGraph envuelto en TS  Layouts automáticos     Colaboración RT
Formatos base           Colaboración básica     Plugins completos
5 plugins esenciales    15 plugins              100% paridad
~180 funciones          ~280 funciones          ~350 funciones
```

---

# VERSIÓN 1.0
## "El Editor Moderno Usable"
**Duración: 8 meses | Equipo: 2-3 devs | ~180 funciones**

---

## MES 1 — Entorno y Shell Visual Base

### Semana 1 — Configuración del Entorno
**Dev asignado: 1 dev (todo el equipo)**

#### Tarea 1.1 — Crear proyecto Svelte 5 + Vite + TypeScript
```powershell
# Desde la carpeta Drawio.next/
pnpm create vite@latest app -- --template svelte-ts
cd app
pnpm install
pnpm add -D vitest @vitest/ui @playwright/test
pnpm add -D tailwindcss@next @tailwindcss/vite
pnpm add -D storybook
pnpm dev  # → http://localhost:5173 debe mostrar pantalla de Svelte
```

#### Tarea 1.2 — Instalar dependencias de mxGraph en el proyecto nuevo
```typescript
// app/src/lib/mxgraph.ts
// Importar mxGraph desde la ruta del proyecto original
// NO copiar — referenciar con path alias en vite.config.ts
```

```typescript
// app/vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@mxgraph': path.resolve(__dirname, '../../src/main/webapp/mxgraph/src'),
      '@drawio': path.resolve(__dirname, '../../src/main/webapp/js/diagramly')
    }
  }
});
```

#### Tarea 1.3 — Configurar GitHub Actions (CI desde el día 1)
```yaml
# .github/workflows/quality.yml
name: Quality Gate
on: [pull_request]
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd Drawio.next/app && pnpm install
      - run: pnpm tsc --noEmit
      - run: pnpm test
```

#### ✅ Criterio de terminación Semana 1
- `pnpm dev` levanta sin errores en todas las máquinas del equipo
- GitHub Actions pasa en el primer PR de prueba
- Todos los devs tienen el repo clonado y el entorno funcionando

---

### Semanas 2-4 — Shell Visual Completo
**Devs asignados: 1-2 devs**

El objetivo es reemplazar visualmente la UI HTML legacy de draw.io con componentes Svelte modernos. El canvas de mxGraph sigue corriendo internamente — solo cambia la capa de UI alrededor.

#### Tarea 2.1 — Layout principal con CSS Grid

```
app/src/
├── ui/
│   ├── AppShell.svelte       ← Layout raíz (grid)
│   ├── MenuBar.svelte        ← File / Edit / View / Arrange / Extras / Help
│   ├── Toolbar.svelte        ← Acciones principales (undo, zoom, estilos)
│   ├── Sidebar.svelte        ← Paleta de formas + búsqueda
│   ├── Canvas.svelte         ← Contenedor del canvas de mxGraph
│   ├── Inspector.svelte      ← Panel derecho de propiedades
│   ├── StatusBar.svelte      ← Barra inferior (páginas, zoom, estado)
│   └── PageTabs.svelte       ← Pestañas de páginas
├── stores/
│   ├── theme.ts              ← 'light' | 'dark'
│   ├── selection.ts          ← Set<string> de IDs seleccionados
│   └── diagram.ts            ← Estado global del diagrama
└── styles/
    └── tokens.css            ← Variables CSS de diseño
```

#### Tarea 2.2 — Sistema de tokens CSS (garantía de UI consistente)
```css
/* app/src/styles/tokens.css — TODO el equipo usa SOLO estas variables */
:root {
  --bg-primary: #1e1e1e;      --bg-secondary: #252526;
  --bg-elevated: #2d2d2d;     --border: #3e3e42;
  --text-primary: #cccccc;    --text-secondary: #9d9d9d;
  --accent: #0078d4;          --accent-hover: #106ebe;
  --font: 'Segoe UI', system-ui, sans-serif;
  --text-sm: 11px;            --text-base: 13px;
  --space-xs: 4px;            --space-sm: 8px;
  --space-md: 12px;           --space-lg: 16px;
  --radius-sm: 2px;           --radius-md: 4px;
  --transition: 150ms ease;
}
[data-theme="light"] {
  --bg-primary: #f3f3f3;      --bg-secondary: #ffffff;
  --border: #d4d4d4;          --text-primary: #1e1e1e;
}
```

> [!WARNING]
> **Regla de equipo:** Prohibido usar colores o fuentes hardcodeados en ningún `.svelte`. Solo variables CSS del `tokens.css`. El revisor del PR rechaza cualquier PR que viole esto.

#### Tarea 2.3 — Integrar canvas de mxGraph en Canvas.svelte
```svelte
<!-- app/src/ui/Canvas.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initMxGraph } from '../core/mxgraph-wrapper';

  let container: HTMLDivElement;

  onMount(() => {
    // mxGraph toma control del div — no tocamos su DOM internamente
    initMxGraph(container);
    return () => { /* cleanup */ };
  });
</script>

<div class="canvas-container" bind:this={container}></div>
```

#### Tarea 2.4 — MenuBar con todos los menús reales
Cada item del menú llama a funciones del wrapper de mxGraph/EditorUi.
```svelte
<!-- Ejemplo de un item de menú -->
<MenuItem label="New" shortcut="Ctrl+N" on:click={handleNewDiagram} />
<MenuItem label="Open..." shortcut="Ctrl+O" on:click={handleOpen} />
<Separator />
<MenuItem label="Save" shortcut="Ctrl+S" on:click={handleSave} />
```

#### Tarea 2.5 — Tests visuales de la UI (Playwright Screenshots)
```typescript
// tests/visual/shell.spec.ts
test('AppShell - tema oscuro', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveScreenshot('shell-dark.png');
});
test('AppShell - tema claro', async ({ page }) => {
  await page.click('[data-testid="toggle-theme"]');
  await expect(page).toHaveScreenshot('shell-light.png');
});
```

#### ✅ Criterio de terminación Mes 1
- El layout de 5 zonas (menú, toolbar, sidebar, canvas, inspector) se ve correcto
- Toggle de tema claro/oscuro funciona
- mxGraph carga y el canvas está activo (aunque sin la nueva lógica aún)
- Tests visuales del shell pasan y están en CI

---

## MES 2-3 — Wrapper TypeScript de mxGraph

**Devs asignados: 1-2 devs | Archivo de referencia: `src/main/webapp/mxgraph/src/`**

### Objetivo
No reescribir mxGraph. Crear una capa TypeScript que:
1. Declara los tipos de cada clase de mxGraph
2. Expone una API limpia y tipada al resto de la app
3. Permite que Svelte reactive a cambios del grafo sin acoplarse a mxGraph

#### Tarea 3.1 — Tipos TypeScript para mxGraph (`.d.ts`)

```typescript
// app/src/core/types/mxgraph.d.ts
declare class mxGraph {
  constructor(container: HTMLElement, model?: mxGraphModel);
  model: mxGraphModel;
  view: mxGraphView;
  getDefaultParent(): mxCell;
  insertVertex(parent: mxCell, id: string | null, value: string,
    x: number, y: number, width: number, height: number,
    style?: string): mxCell;
  insertEdge(parent: mxCell, id: string | null, value: string,
    source: mxCell, target: mxCell, style?: string): mxCell;
  removeCells(cells: mxCell[], includeEdges?: boolean): mxCell[];
  setSelectionCells(cells: mxCell[]): void;
  getSelectionCells(): mxCell[];
  zoomIn(): void;
  zoomOut(): void;
  fit(): void;
  undo(): void;
  redo(): void;
  // ... 80+ métodos tipados
}

declare class mxCell {
  id: string;
  value: string;
  style: string;
  vertex: boolean;
  edge: boolean;
  geometry: mxGeometry;
  parent: mxCell | null;
  children: mxCell[] | null;
}

declare class mxGeometry {
  x: number; y: number;
  width: number; height: number;
  relative: boolean;
}

declare class mxGraphModel {
  beginUpdate(): void;
  endUpdate(): void;
  getCell(id: string): mxCell | null;
  getCells(): { [id: string]: mxCell };
}
```

#### Tarea 3.2 — Wrapper `GraphController` (API limpia para Svelte)

```typescript
// app/src/core/GraphController.ts
import type { mxGraph, mxCell } from './types/mxgraph';

export interface AddVertexOptions {
  id?: string;
  label: string;
  x: number; y: number;
  width?: number; height?: number;
  style?: string;
}

export class GraphController {
  private graph: mxGraph;

  constructor(container: HTMLElement) {
    // @ts-ignore — carga el mxGraph global
    this.graph = new mxGraph(container);
    this.setupDefaults();
  }

  private setupDefaults(): void {
    this.graph.setConnectable(true);
    this.graph.setTooltips(true);
    this.graph.setEnabled(true);
  }

  addVertex(opts: AddVertexOptions): mxCell {
    const parent = this.graph.getDefaultParent();
    this.graph.model.beginUpdate();
    try {
      return this.graph.insertVertex(
        parent, opts.id ?? null, opts.label,
        opts.x, opts.y,
        opts.width ?? 120, opts.height ?? 60,
        opts.style ?? ''
      );
    } finally {
      this.graph.model.endUpdate();
    }
  }

  addEdge(sourceId: string, targetId: string, label = ''): mxCell | null {
    const source = this.graph.model.getCell(sourceId);
    const target = this.graph.model.getCell(targetId);
    if (!source || !target) return null;
    const parent = this.graph.getDefaultParent();
    this.graph.model.beginUpdate();
    try {
      return this.graph.insertEdge(parent, null, label, source, target);
    } finally {
      this.graph.model.endUpdate();
    }
  }

  removeSelected(): void {
    const cells = this.graph.getSelectionCells();
    this.graph.removeCells(cells);
  }

  undo(): void { this.graph.undo(); }
  redo(): void { this.graph.redo(); }
  zoomIn(): void { this.graph.zoomIn(); }
  zoomOut(): void { this.graph.zoomOut(); }
  fit(): void { this.graph.fit(); }

  getSelectedCellIds(): string[] {
    return this.graph.getSelectionCells().map(c => c.id);
  }

  onSelectionChange(callback: (ids: string[]) => void): void {
    this.graph.getSelectionModel().addListener('change', () => {
      callback(this.getSelectedCellIds());
    });
  }

  destroy(): void {
    this.graph.destroy();
  }
}
```

#### Tarea 3.3 — Tests del GraphController

```typescript
// app/src/core/GraphController.test.ts
// Nota: requiere un DOM (jsdom o happy-dom en Vitest)
import { GraphController } from './GraphController';

test('addVertex crea un vértice en el grafo', () => {
  const container = document.createElement('div');
  const ctrl = new GraphController(container);
  const cell = ctrl.addVertex({ label: 'Nodo A', x: 100, y: 100 });
  expect(cell.value).toBe('Nodo A');
  expect(cell.vertex).toBe(true);
  ctrl.destroy();
});

test('addEdge conecta dos vértices', () => {
  const container = document.createElement('div');
  const ctrl = new GraphController(container);
  const a = ctrl.addVertex({ label: 'A', x: 0, y: 0 });
  const b = ctrl.addVertex({ label: 'B', x: 200, y: 0 });
  const edge = ctrl.addEdge(a.id, b.id);
  expect(edge).not.toBeNull();
  expect(edge!.edge).toBe(true);
  ctrl.destroy();
});

test('undo revierte el último cambio', () => {
  // ...
});
```

#### ✅ Criterio de terminación Mes 2-3
- `GraphController` tipado en TypeScript al 100%
- Tests unitarios pasan con cobertura > 85%
- El canvas en el navegador responde a llamadas de `GraphController`
- `pnpm tsc --noEmit` sin errores en todo el proyecto

---

## MES 4-5 — Inspector de Propiedades y Sidebar Funcionales

**Devs asignados: 2 devs trabajando en paralelo**

### Dev A: Inspector de Propiedades (Panel Derecho)

Cuando el usuario selecciona una celda, el inspector muestra sus propiedades y permite cambiarlas.

```
Inspector.svelte
├── TabBar.svelte             ← "Style" | "Arrange" | "Text"
├── tabs/
│   ├── StyleTab.svelte       ← Color relleno, borde, opacidad
│   ├── ArrangeTab.svelte     ← X, Y, Width, Height, Rotation
│   └── TextTab.svelte        ← Fuente, tamaño, alineación, formato
└── controls/
    ├── ColorPicker.svelte    ← Selector de color (hex + swatch)
    ├── NumberInput.svelte    ← Input numérico con step
    └── FontSelector.svelte   ← Selector de familia tipográfica
```

Cada control llama al `GraphController` para aplicar el cambio:
```typescript
// Cuando el usuario cambia el color de relleno:
function onFillColorChange(color: string) {
  const cells = graphCtrl.getSelectedCells();
  graphCtrl.setCellStyle(cells, { fillColor: color });
}
```

### Dev B: Sidebar con Paleta de Formas

```
Sidebar.svelte
├── SearchBar.svelte          ← Búsqueda de formas en tiempo real
├── Scratchpad.svelte         ← Área de formas guardadas por el usuario
└── ShapeLibrary.svelte
    ├── ShapeCategory.svelte  ← Categoría expandible/colapsable
    └── ShapeItem.svelte      ← Forma arrastrable al canvas
```

```typescript
// Arrastrar una forma al canvas:
// ShapeItem.svelte
function onDragStart(event: DragEvent) {
  event.dataTransfer!.setData('shape', JSON.stringify({
    stencilName: shape.id,
    style: shape.defaultStyle
  }));
}

// Canvas.svelte — recibir el drop
function onDrop(event: DragEvent) {
  const { stencilName, style } = JSON.parse(event.dataTransfer!.getData('shape'));
  const { x, y } = canvasCoordinates(event.clientX, event.clientY);
  graphCtrl.addVertex({ label: '', x, y, style });
}
```

**Categorías de la Sidebar en v1.0** (priorizadas por uso):
1. General (rectángulos, elipses, diamantes, cilindros...)
2. Flowchart
3. UML
4. Entity Relation
5. Basic / Misc
6. Arrows

#### ✅ Criterio de terminación Mes 4-5
- Inspector actualiza propiedades de la celda seleccionada en tiempo real
- Sidebar muestra las 6 categorías de formas con drag & drop funcional
- Búsqueda de formas filtra en tiempo real (con debounce 300ms)
- Tests E2E: seleccionar celda → cambiar color → verificar que cambió

---

## MES 6 — Gestión de Capas y Páginas

**Devs asignados: 1 dev**

### Capas (Layers)
```typescript
// app/src/core/LayerManager.ts
export class LayerManager {
  constructor(private graph: mxGraph) {}

  addLayer(name: string): mxCell {
    const model = this.graph.model;
    model.beginUpdate();
    try {
      const layer = model.insert(model.root, new mxCell());
      model.setValue(layer, name);
      return layer;
    } finally {
      model.endUpdate();
    }
  }

  setVisible(layer: mxCell, visible: boolean): void { ... }
  setLocked(layer: mxCell, locked: boolean): void { ... }
  moveToLayer(cells: mxCell[], layer: mxCell): void { ... }
  deleteLayer(layer: mxCell): void { ... }
}
```

### Páginas (Multi-page)
```typescript
// app/src/core/PageManager.ts
// Wrapping de Pages.js de draw.io
export class PageManager {
  addPage(name?: string): void { ... }
  removePage(index: number): void { ... }
  renamePage(index: number, name: string): void { ... }
  duplicatePage(index: number): void { ... }
  navigateTo(index: number): void { ... }
  getCurrentPageIndex(): number { ... }
}
```

#### ✅ Criterio de terminación Mes 6
- Se pueden agregar, eliminar, renombrar y reordenar páginas
- Se pueden agregar, ocultar, bloquear y mover objetos entre capas
- Tests E2E para las 10 funciones de capas y 10 de páginas

---

## MES 7 — Formatos de Archivo

**Devs asignados: 1-2 devs**

### Parser y Serializer `.drawio` / `.xml`

```typescript
// app/src/core/formats/DrawioParser.ts
export function parseDrawio(xmlString: string): ParsedDiagram {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Verificar errores de parsing
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('XML inválido: ' + parseError.textContent);

  const pages: ParsedPage[] = [];
  doc.querySelectorAll('diagram').forEach(diagram => {
    const cells: ParsedCell[] = [];
    diagram.querySelectorAll('mxCell').forEach(cell => {
      const geo = cell.querySelector('mxGeometry');
      cells.push({
        id: cell.getAttribute('id') ?? '',
        value: cell.getAttribute('value') ?? '',
        style: cell.getAttribute('style') ?? '',
        vertex: cell.getAttribute('vertex') === '1',
        edge: cell.getAttribute('edge') === '1',
        source: cell.getAttribute('source') ?? undefined,
        target: cell.getAttribute('target') ?? undefined,
        geometry: geo ? {
          x: parseFloat(geo.getAttribute('x') ?? '0'),
          y: parseFloat(geo.getAttribute('y') ?? '0'),
          width: parseFloat(geo.getAttribute('width') ?? '0'),
          height: parseFloat(geo.getAttribute('height') ?? '0'),
        } : undefined,
      });
    });
    pages.push({ id: diagram.getAttribute('id') ?? '', name: diagram.getAttribute('name') ?? '', cells });
  });

  return { pages };
}
```

```typescript
// app/src/core/formats/DrawioSerializer.ts
export function serializeToDrawio(graph: mxGraph, diagramName: string): string {
  const codec = new mxCodec();
  const model = codec.encode(graph.model);
  const xml = mxUtils.getPrettyXml(model);
  return `<mxfile><diagram name="${diagramName}" id="${crypto.randomUUID()}">${xml}</diagram></mxfile>`;
}
```

### Exportación SVG y PNG

```typescript
// app/src/core/formats/Exporter.ts
export async function exportSVG(graph: mxGraph): Promise<string> {
  const scale = 1;
  const bounds = graph.getGraphBounds();
  const svgCanvas = new mxSvgCanvas2D(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
  // ... renderizar el grafo en el canvas SVG
  return new XMLSerializer().serializeToString(svgCanvas.root);
}

export async function exportPNG(graph: mxGraph, dpi = 96): Promise<Blob> {
  const svg = await exportSVG(graph);
  // Convertir SVG a PNG via Canvas API
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    // ... render y conversión
    canvas.toBlob(blob => resolve(blob!), 'image/png');
  });
}
```

### Tests de Round-Trip (Críticos)
```typescript
// tests/formats/round-trip.spec.ts
import { parsDrawio, serializeToDrawio } from '../../src/core/formats';

const fixtures = ['simple', 'complex', 'uml', 'er', 'flowchart'];

fixtures.forEach(name => {
  test(`round-trip de ${name}.drawio no pierde datos`, async () => {
    const original = await fs.readFile(`./fixtures/${name}.drawio`, 'utf-8');
    const parsed = parseDrawio(original);
    const reserialized = serializeToDrawio(parsed);
    const reparsed = parseDrawio(reserialized);

    expect(reparsed.pages.length).toBe(parsed.pages.length);
    reparsed.pages.forEach((page, i) => {
      expect(page.cells.length).toBe(parsed.pages[i].cells.length);
    });
  });
});
```

#### ✅ Criterio de terminación Mes 7
- Abrir un archivo `.drawio` creado con el draw.io original y verlo renderizado
- Guardar el diagrama como `.drawio` y abrirlo de nuevo sin pérdida
- Exportar como SVG y PNG producen archivos válidos
- Todos los tests de round-trip pasan para 5 fixtures distintos

---

## MES 8 — Plugins Base y Estabilización v1.0

**Devs asignados: 2 devs**

### Dev A: Sistema de Plugins

```typescript
// app/src/plugins/PluginSystem.ts
export interface DrawioPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  init(app: DrawioApp): void | Promise<void>;
  destroy(): void;
}

export class PluginSystem {
  private plugins = new Map<string, DrawioPlugin>();
  private app: DrawioApp;

  constructor(app: DrawioApp) { this.app = app; }

  async register(plugin: DrawioPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) return;
    await plugin.init(this.app);
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    plugin.destroy();
    this.plugins.delete(id);
  }

  // Carga dinámica desde archivo JS externo
  async loadFromUrl(url: string): Promise<void> {
    const module = await import(/* @vite-ignore */ url);
    if (module.default) await this.register(module.default);
  }
}
```

### Dev B: Migrar los 5 plugins esenciales

Prioridad basada en uso:

| Plugin original | Plugin nuevo | Complejidad |
|----------------|-------------|-------------|
| `flow.js` | `FlowPlugin.ts` | 🔴 Alta (animaciones) |
| `tags.js` | `TagsPlugin.ts` | 🟡 Media |
| `tooltips.js` | `TooltipsPlugin.ts` | 🟡 Media |
| `number.js` | `NumberPlugin.ts` | 🟢 Baja |
| `props.js` | `PropsPlugin.ts` | 🟡 Media |

```typescript
// app/src/plugins/builtin/TagsPlugin.ts
import type { DrawioPlugin, DrawioApp } from '../PluginSystem';

const TagsPlugin: DrawioPlugin = {
  id: 'tags',
  name: 'Tags',
  version: '1.0.0',
  description: 'Etiquetar y filtrar celdas por tags',
  init(app: DrawioApp) {
    // Agregar panel de tags al Inspector
    app.inspector.addPanel(TagsPanel);
    // Registrar shortcut para filtrar por tag
    app.shortcuts.register('Ctrl+Shift+T', () => app.ui.showTagFilter());
  },
  destroy() {
    // Limpiar todo lo que se registró en init()
  }
};

export default TagsPlugin;
```

### Checklist de Cierre v1.0

```
□ TESTS
  □ pnpm test → 100% pasan (unitarios + integración)
  □ pnpm test:e2e → 100% pasan (E2E de 180 funciones)
  □ pnpm test:visual → Snapshots aprobados
  □ pnpm tsc --noEmit → 0 errores

□ FUNCIONALIDAD
  □ Abrir y guardar archivos .drawio reales (sin pérdida de datos)
  □ Exportar SVG y PNG funcionan
  □ Drag & drop de formas desde sidebar al canvas
  □ Inspector actualiza propiedades en tiempo real
  □ Capas y páginas funcionan
  □ Undo/Redo con al menos 50 pasos
  □ Los 5 plugins esenciales funcionan

□ UI/UX
  □ Tema claro y oscuro sin elementos rotos
  □ Responsive hasta 1280px de ancho
  □ Shortcuts de teclado documentados y funcionando
  □ Storybook muestra todos los componentes correctamente

□ REPO
  □ PR revisado por todo el equipo
  □ CHANGELOG actualizado
  □ Tag v1.0.0 creado en GitHub
  □ Release notes escritas
```

---

# VERSIÓN 2.0
## "Formatos Avanzados y Colaboración Inicial"
**Duración: Meses 9-16 | +6-8 meses adicionales**

### Mes 9-10: Importación Avanzada
- Importar desde VSDX (Visio) — reusar `vsdxImporter.js` adaptado a TypeScript
- Importar desde CSV con mapeo de columnas (tipo: `source, target, label`)
- Importar desde texto plano (plugin `text.js` migrado)

### Mes 11-12: Layouts Automáticos
Tipificar y envolver los algoritmos de layout existentes en mxGraph:
- `mxHierarchicalLayout.js` → `HierarchicalLayout.ts`
- `mxRadialTreeLayout.js` → `RadialTreeLayout.ts`
- `mxFastOrganicLayout.js` → `OrganicLayout.ts`
- `mxCircleLayout.js` → `CircleLayout.ts`
- `mxSwimlaneLayout.js` → `SwimlaneLayout.ts`

### Mes 13-14: Colaboración Básica
- WebSocket server básico (Node.js)
- Sincronización de operaciones con 3-way merge (reusar `DiffSync.js` adaptado)
- Mostrar cursores remotos en el canvas

### Mes 15-16: Más Plugins y Librerías
- 10 plugins adicionales migrados al nuevo sistema
- Librerías de formas personalizadas
- Scratchpad persistente

---

# VERSIÓN 3.0
## "Integraciones Completas y Paridad Total"
**Duración: Meses 17-24 | +6+ meses adicionales**

- Google Drive, OneDrive, GitHub, GitLab, Trello
- Colaboración en tiempo real completa (cursores, chat, `takeOver`)
- Plugin `sql.js` migrado (generar ER desde DDL SQL)
- Plugin `replay.js` migrado (historial como video)
- Plugin `animation.js` migrado
- 100% paridad funcional con draw.io original

---

## Resumen de Tiempos Reales

| Versión | Período | Funciones | % Paridad |
|---------|---------|-----------|-----------|
| **v1.0** | Mes 1–8 | ~180 | 51% |
| **v2.0** | Mes 9–16 | ~280 | 80% |
| **v3.0** | Mes 17–24 | ~350 | 100% |

---

## Reglas de Equipo (No Negociables)

> [!IMPORTANT]
> Un PR no se mergea si viola cualquiera de estas reglas. No importa la urgencia.

| # | Regla | Cómo verificar |
|---|-------|----------------|
| 1 | `pnpm tsc --noEmit` sin errores | CI bloquea el PR |
| 2 | Tests unitarios pasan al 100% | CI bloquea el PR |
| 3 | Sin colores/fuentes hardcodeados en `.svelte` | Code review manual |
| 4 | `src/core/` no importa nada de Svelte | `grep -r "from 'svelte'"` en CI |
| 5 | Cada función nueva tiene al menos 1 test | Code review manual |
| 6 | Commits en formato Conventional Commits | `commitlint` en CI |
| 7 | PR revisado por al menos 1 compañero | GitHub branch protection |
| 8 | Tests visuales actualizados si cambia UI | CI bloquea el PR |

### Formato de commits
```
feat: agregar exportación PNG con DPI configurable
fix: corregir posición de celdas al hacer zoom > 200%
test: tests de round-trip para formato .drawio
docs: actualizar README con instrucciones de plugins
refactor: extraer LayerManager de GraphController
```

### Ramas Git
```
main     ← código estable, solo desde dev via PR
dev      ← integración de features
feat/inspector-panel
feat/sidebar-shapes
feat/drawio-parser
feat/flow-plugin
fix/zoom-cell-position
```

---

## Recursos de Aprendizaje para el Equipo

| Tema | Recurso | Horas estimadas |
|------|---------|----------------|
| **Svelte 5 completo** | [learn.svelte.dev](https://learn.svelte.dev) — Tutorial interactivo oficial | 6-8h |
| **TypeScript** | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) | 4-6h |
| **mxGraph internals** | Leer `Drawio.next/doc/arquitectura_drawio.md` | 2h |
| **SVG interactivo** | [MDN SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial) | 3h |
| **Playwright E2E** | [playwright.dev/docs](https://playwright.dev/docs/intro) | 2h |
| **Vitest** | [vitest.dev/guide](https://vitest.dev/guide/) | 1h |
| **Conventional Commits** | [conventionalcommits.org](https://www.conventionalcommits.org) | 30min |
