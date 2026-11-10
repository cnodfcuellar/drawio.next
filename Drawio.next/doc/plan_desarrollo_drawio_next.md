# Plan de Desarrollo — Drawio.next
### Refactorización Progresiva · TypeScript + Vite + Svelte 5

> [!IMPORTANT]
> Este plan está diseñado para equipos con buena base de programación pero sin experiencia previa en Svelte 5 o mxGraph. Cada fase termina con algo **que funciona y se puede ver en el navegador**.

---

## Stack Tecnológico Confirmado

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Lenguaje | **TypeScript 5** | Tipado estricto en todo el proyecto |
| Build | **Vite 6** | Servidor de desarrollo ultra-rápido + build de producción |
| UI | **Svelte 5** | Componentes visuales compilados a JS nativo |
| Testing | **Vitest** | Tests unitarios integrado con Vite |
| Estilo | **CSS Variables + Tailwind 4** | Sistema de temas (claro/oscuro) |
| Control de versiones | **Git + GitHub** | Ramas por fase/módulo |

---

## Mapa General de Fases

```
FASE 0 ──► FASE 1 ──► FASE 2 ──► FASE 3 ──► FASE 4 ──► FASE 5
Entorno    Shell       Core TS    Canvas     Formatos   Plugins
(1 sem)   (1 sem)    (2 sem)    (3 sem)    (2 sem)    (2 sem)
```

**Tiempo estimado total: 11 semanas** *(con equipo de 2-3 devs)*

---

## FASE 0 — Configuración del Entorno
> **Duración: 1 semana | 1 desarrollador**

### Objetivo
Que todos los devs tengan el mismo entorno de desarrollo funcionando con el primer componente "Hello World" en Svelte 5.

### Tareas detalladas

#### Tarea 0.1 — Instalar herramientas base
```powershell
# Verificar Node.js 20+ (ya instalado ✅)
node -v   # debe mostrar v20.x o superior

# Instalar pnpm (más rápido que npm para monorepos)
npm install -g pnpm

# Verificar
pnpm -v
```

#### Tarea 0.2 — Crear el proyecto Svelte 5 + Vite + TypeScript
```powershell
# Desde la raíz del workspace
cd Drawio.next
pnpm create vite@latest app -- --template svelte-ts
cd app
pnpm install
pnpm dev
# → Abrir http://localhost:5173 y ver la pantalla inicial de Svelte
```

#### Tarea 0.3 — Instalar dependencias adicionales
```powershell
pnpm add -D vitest @vitest/ui
pnpm add -D tailwindcss@next @tailwindcss/vite
```

#### Tarea 0.4 — Reorganizar carpetas
Renombrar y reorganizar la estructura generada:
```
Drawio.next/
├── app/                  ← proyecto Svelte 5
│   ├── src/
│   │   ├── core/         ← (crear vacía) TypeScript puro
│   │   ├── ui/           ← (mover aquí App.svelte)
│   │   ├── stores/       ← (crear vacía) estado global
│   │   ├── plugins/      ← (crear vacía) sistema de plugins
│   │   └── main.ts       ← entry point
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
└── doc/                  ← documentación (ya existe ✅)
```

#### Tarea 0.5 — Configurar Git
```powershell
# En la rama dev, crear rama específica para esta fase
git checkout -b fase/0-entorno
# Al terminar cada tarea, hacer commit con mensaje descriptivo:
git commit -m "fase0: estructura base del proyecto Svelte 5 + Vite"
```

### ✅ Criterio de terminación
- `pnpm dev` levanta el servidor sin errores.
- Todos los devs pueden hacer un cambio en `App.svelte` y verlo en el navegador al instante (HMR funcionando).
- La carpeta `Drawio.next/app/src/core/` existe (vacía).

---

## FASE 1 — Shell Visual (Interfaz Esqueleto)
> **Duración: 1 semana | 1-2 desarrolladores**

### Objetivo
Construir la carcasa visual completa de la aplicación: barra de menú, barra lateral de formas, panel de propiedades y el área central del lienzo. **Sin lógica real, solo la estructura HTML+CSS**.

### Por qué primero el shell
Los devs novatos se motivan al ver la interfaz. Los componentes visuales también sirven como guía para diseñar el API del core en la Fase 2.

### Tareas detalladas

#### Tarea 1.1 — Crear componente raíz `AppShell.svelte`
```
src/ui/
├── AppShell.svelte       ← Layout principal (grid CSS)
├── MenuBar.svelte        ← File, Edit, View, Arrange, Extras, Help
├── Toolbar.svelte        ← Botones de acción (undo, zoom, etc.)
├── Sidebar.svelte        ← Panel izquierdo de formas
├── Canvas.svelte         ← Área central de dibujo (placeholder)
└── Inspector.svelte      ← Panel derecho de propiedades
```

#### Tarea 1.2 — Layout CSS Grid
El layout principal usa CSS Grid de 3 columnas + 2 filas:
```css
/* En AppShell.svelte */
.app-layout {
  display: grid;
  grid-template-areas:
    "menubar  menubar   menubar"
    "toolbar  toolbar   toolbar"
    "sidebar  canvas    inspector"
    "statusbar statusbar statusbar";
  grid-template-columns: 220px 1fr 240px;
  grid-template-rows: 36px 44px 1fr 24px;
  height: 100vh;
}
```

#### Tarea 1.3 — Sistema de temas (claro/oscuro)
```typescript
// src/stores/theme.ts
import { writable } from 'svelte/store';
export const theme = writable<'light' | 'dark'>('dark');
```

```svelte
<!-- En AppShell.svelte -->
<script lang="ts">
  import { theme } from '../stores/theme';
</script>
<div class="app-layout" data-theme={$theme}>
  <slot />
</div>
```

#### Tarea 1.4 — Escribir el primer test
```typescript
// src/ui/MenuBar.test.ts
import { render } from '@testing-library/svelte';
import MenuBar from './MenuBar.svelte';

test('MenuBar muestra todos los menús', () => {
  const { getByText } = render(MenuBar);
  expect(getByText('File')).toBeTruthy();
  expect(getByText('Edit')).toBeTruthy();
});
```

### ✅ Criterio de terminación
- El navegador muestra el layout completo: 4 zonas diferenciadas (menú, sidebar, lienzo vacío, panel).
- El botón de tema alterna entre claro y oscuro.
- Al menos 1 test pasa con `pnpm test`.

---

## FASE 2 — Core: Modelos de Datos en TypeScript
> **Duración: 2 semanas | 1-2 desarrolladores**

### Objetivo
Crear el corazón del editor: los modelos de datos que representan un diagrama. **Puro TypeScript, sin ningún framework, sin Svelte**. Esta es la capa más importante y más fácil de actualizar en el futuro.

### Referencia del original
El código original (`app.min.js`, 9MB) tiene estos conceptos que debemos reescribir:
- `mxCell` → nuestro `Cell` (nodo o conector)
- `mxGeometry` → nuestro `Geometry` (posición y tamaño)
- `mxGraph` → nuestro `DiagramModel` (el grafo completo)
- `mxGraphModel` → nuestro `GraphHistory` (historial de cambios)

### Tareas detalladas

#### Tarea 2.1 — Tipo `Geometry`
```typescript
// src/core/geometry/Geometry.ts
export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;   // en grados, opcional
}

export function createGeometry(x = 0, y = 0, w = 120, h = 60): Geometry {
  return { x, y, width: w, height: h };
}
```

#### Tarea 2.2 — Tipo `Cell` (nodo o conector)
```typescript
// src/core/graph/Cell.ts
export type CellType = 'vertex' | 'edge';

export interface Cell {
  id: string;           // UUID único
  type: CellType;
  label: string;        // texto visible
  style: string;        // string de estilos (compat. con .drawio)
  geometry: Geometry;
  parentId: string | null;
  sourceId?: string;    // solo para edges
  targetId?: string;    // solo para edges
  children: string[];   // ids de hijos
}
```

#### Tarea 2.3 — Modelo del Diagrama
```typescript
// src/core/graph/DiagramModel.ts
export interface DiagramModel {
  id: string;
  name: string;
  cells: Map<string, Cell>;  // id → Cell
  rootId: string;
}

export function createDiagramModel(name = 'Untitled Diagram'): DiagramModel {
  const rootId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    name,
    cells: new Map(),
    rootId
  };
}

export function addCell(model: DiagramModel, cell: Cell): DiagramModel {
  const cells = new Map(model.cells);
  cells.set(cell.id, cell);
  return { ...model, cells };  // inmutable: devuelve nuevo modelo
}
```

#### Tarea 2.4 — Historial de Cambios (Undo/Redo)
```typescript
// src/core/history/History.ts
export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export function undo<T>(history: HistoryStack<T>): HistoryStack<T> {
  if (history.past.length === 0) return history;
  const [present, ...past] = [...history.past].reverse();
  return {
    past: past.reverse(),
    present,
    future: [history.present, ...history.future]
  };
}

export function redo<T>(history: HistoryStack<T>): HistoryStack<T> {
  if (history.future.length === 0) return history;
  const [present, ...future] = history.future;
  return {
    past: [...history.past, history.present],
    present,
    future
  };
}
```

#### Tarea 2.5 — Tests del core (mínimo 1 test por módulo)
```typescript
// src/core/graph/DiagramModel.test.ts
import { createDiagramModel, addCell } from './DiagramModel';

test('crear modelo vacío tiene un nombre', () => {
  const model = createDiagramModel('Mi Diagrama');
  expect(model.name).toBe('Mi Diagrama');
  expect(model.cells.size).toBe(0);
});

test('addCell agrega una celda al modelo', () => {
  const model = createDiagramModel();
  const cell = { id: '1', type: 'vertex', ... };
  const updated = addCell(model, cell);
  expect(updated.cells.has('1')).toBe(true);
});
```

### ✅ Criterio de terminación
- Todos los tipos de `src/core/` están escritos en TypeScript sin errores (`pnpm tsc --noEmit`).
- `pnpm test` pasa con cobertura > 80% en `src/core/`.
- **No hay ninguna dependencia de Svelte en la carpeta `core/`** (verificable con grep).

---

## FASE 3 — Canvas SVG Interactivo
> **Duración: 3 semanas | 2 desarrolladores**

### Objetivo
Renderizar celdas del `DiagramModel` como elementos SVG interactivos en el lienzo: mover, seleccionar, conectar.

> [!NOTE]
> Esta es la fase más compleja. Se divide en 3 sub-semanas con objetivos diarios claros.

### Semana 3A — Renderizado básico de formas

#### Tarea 3A.1 — `Canvas.svelte` conectado al store del diagrama
```svelte
<!-- src/ui/Canvas.svelte -->
<script lang="ts">
  import { diagramStore } from '../stores/diagram';
  import CellView from './CellView.svelte';
</script>

<svg class="canvas" xmlns="http://www.w3.org/2000/svg">
  {#each [...$diagramStore.cells.values()] as cell}
    <CellView {cell} />
  {/each}
</svg>
```

#### Tarea 3A.2 — `CellView.svelte` para vértices
```svelte
<!-- src/ui/CellView.svelte -->
<script lang="ts">
  import type { Cell } from '../core/graph/Cell';
  let { cell } = $props<{ cell: Cell }>();
</script>

{#if cell.type === 'vertex'}
  <g transform="translate({cell.geometry.x}, {cell.geometry.y})">
    <rect
      width={cell.geometry.width}
      height={cell.geometry.height}
      rx="4"
      fill="white"
      stroke="#666"
    />
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">
      {cell.label}
    </text>
  </g>
{/if}
```

### Semana 3B — Interacciones básicas

#### Tarea 3B.1 — Selección de celdas
```typescript
// src/stores/selection.ts
import { writable } from 'svelte/store';
export const selectedCells = writable<Set<string>>(new Set());
```

#### Tarea 3B.2 — Drag & Drop para mover celdas
Implementar `pointerdown`, `pointermove`, `pointerup` en `CellView.svelte`.
Actualizar la geometría en el `diagramStore` al soltar.

#### Tarea 3B.3 — Zoom y pan del canvas
```typescript
// src/stores/viewport.ts
export const viewport = writable({ x: 0, y: 0, scale: 1 });
```

### Semana 3C — Conectores

#### Tarea 3C.1 — `EdgeView.svelte` (renderizar conectores como `<path>`)
#### Tarea 3C.2 — Puntos de conexión (hover muestra los 4 puntos cardinales)
#### Tarea 3C.3 — Crear conector arrastrando desde un punto de conexión

### ✅ Criterio de terminación
- Se pueden crear rectángulos haciendo doble clic en el lienzo.
- Se puede mover una forma arrastrándola.
- Se pueden conectar dos formas con una línea.
- Zoom con rueda del mouse funciona.
- Ctrl+Z / Ctrl+Y (undo/redo) funcionan.

---

## FASE 4 — Formatos de Archivo
> **Duración: 2 semanas | 1 desarrollador**

### Objetivo
Leer y escribir el formato `.drawio` (XML) nativo para ser 100% compatible con el draw.io original.

### Tareas detalladas

#### Tarea 4.1 — Parser XML → DiagramModel
```typescript
// src/core/formats/DrawioParser.ts
export function parseDrrawio(xmlString: string): DiagramModel {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const cells = doc.querySelectorAll('mxCell');
  // ... convertir cada mxCell en nuestro Cell
}
```

#### Tarea 4.2 — Serializer DiagramModel → XML
```typescript
// src/core/formats/DrawioSerializer.ts
export function serializeDiagram(model: DiagramModel): string {
  // Generar XML compatible con draw.io
}
```

#### Tarea 4.3 — Importar archivo `.drawio`
Botón "Abrir" en `MenuBar.svelte` que usa `<input type="file">` y llama al parser.

#### Tarea 4.4 — Exportar como `.drawio`
Botón "Guardar" que llama al serializer y descarga el archivo.

#### Tarea 4.5 — Exportar como SVG y PNG
```typescript
// src/core/formats/SvgExporter.ts
export function exportSvg(canvas: SVGSVGElement): string { ... }
export function exportPng(canvas: SVGSVGElement): Promise<Blob> { ... }
```

### ✅ Criterio de terminación
- Se puede abrir un archivo `.drawio` creado con el draw.io original y verlo renderizado.
- Se puede guardar el diagrama como `.drawio` y volver a abrirlo sin pérdida de datos.
- Tests de round-trip (parsear → serializar → parsear) pasan.

---

## FASE 5 — Sistema de Plugins
> **Duración: 2 semanas | 1-2 desarrolladores**

### Objetivo
Crear la infraestructura para extender Drawio.next con plugins, migrando los plugins del original (`flow.js`, `sql.js`, `animate.js`, etc.)

### Tareas detalladas

#### Tarea 5.1 — Interfaz del Plugin
```typescript
// src/plugins/Plugin.ts
export interface DrawioPlugin {
  id: string;           // ej: 'sql-import'
  name: string;         // ej: 'SQL Import'
  version: string;
  init(app: DrawioApp): void;   // hook de inicialización
  destroy(): void;              // hook de desinstalación
}
```

#### Tarea 5.2 — Registro de plugins
```typescript
// src/plugins/PluginRegistry.ts
export class PluginRegistry {
  private plugins = new Map<string, DrawioPlugin>();
  register(plugin: DrawioPlugin) { ... }
  unregister(id: string) { ... }
  getAll(): DrawioPlugin[] { ... }
}
```

#### Tarea 5.3 — Migrar plugin `flow.js` como primer plugin oficial
El plugin de animación de flujos del original se reimplementa como:
```
src/plugins/builtin/
└── FlowPlugin.ts
```

#### Tarea 5.4 — UI de gestión de plugins
Panel en `Inspector.svelte` para activar/desactivar plugins.

### ✅ Criterio de terminación
- Se puede registrar un plugin de prueba y que aparezca en la UI.
- El plugin `FlowPlugin` anima flechas en el diagrama.
- Los plugins se pueden cargar desde archivos externos (carga dinámica con `import()`).

---

## Reglas de Equipo (Para todos los devs)

> [!IMPORTANT]
> Estas reglas garantizan que el código sea mantenible y actualizable a largo plazo.

### 1. Nunca mezclar core con UI
```
✅ CORRECTO: src/core/ solo importa de src/core/
❌ INCORRECTO: src/core/graph/DiagramModel.ts importa de Svelte
```

### 2. Funciones puras en el core
```typescript
✅ CORRECTO: addCell(model, cell) → nuevo modelo (no muta)
❌ INCORRECTO: model.cells.push(cell) → mutación directa
```

### 3. Un componente = un archivo
Cada `ComponenteNombre.svelte` hace **una sola cosa**.

### 4. Tests antes de terminar una tarea
Cada función del `core/` tiene al menos un test antes de hacer el PR.

### 5. Convención de commits (Conventional Commits)
```
feat: añadir exportación PNG
fix: corregir posición de celdas al hacer zoom
test: tests para DrawioParser
docs: actualizar README de plugins
refactor: extraer lógica de drag a composable
```

### 6. Ramas por feature
```
main          ← código estable
dev           ← integración de features
fase/0-entorno
fase/1-shell
fase/2-core
fase/3-canvas
fase/4-formatos
fase/5-plugins
```

---

## Recursos de Aprendizaje

| Tema | Recurso | Tiempo estimado |
|------|---------|----------------|
| **Svelte 5** | [learn.svelte.dev](https://learn.svelte.dev) — Tutorial interactivo oficial | 4-6 horas |
| **TypeScript** | [TypeScript en 5 minutos](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) | 1 hora |
| **SVG interactivo** | [SVG Tutorial — MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial) | 2-3 horas |
| **Vite** | [Getting Started — Vite](https://vitejs.dev/guide/) | 1 hora |
| **Vitest** | [Getting Started — Vitest](https://vitest.dev/guide/) | 1 hora |
| **Formato .drawio** | Nuestro propio `doc/arquitectura_drawio.md` | 30 min |

---

## Resumen de Entregables por Fase

| Fase | Semanas | Entregable visible |
|------|---------|-------------------|
| 0 — Entorno | 1 | Pantalla de bienvenida de Svelte en `localhost:5173` |
| 1 — Shell | 1 | Layout completo con 4 paneles y toggle de tema |
| 2 — Core TS | 2 | Tests del core pasando al 100% |
| 3 — Canvas | 3 | Crear, mover y conectar formas en el lienzo |
| 4 — Formatos | 2 | Abrir y guardar archivos `.drawio` reales |
| 5 — Plugins | 2 | Plugin de animación de flujos funcionando |
| **Total** | **11** | **Editor de diagramas funcional en Drawio.next** |
