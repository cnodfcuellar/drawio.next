# Garantía de Calidad — Drawio.next
### Paridad Funcional · Estabilidad UI/UX · Protocolo de Testing

> [!IMPORTANT]
> Este documento es el **contrato de calidad** del proyecto. Sin cumplirlo, no se hace merge a `dev`. Complementa el `plan_desarrollo_drawio_next.md`.

---

## El Problema que Resuelve Este Documento

El plan de desarrollo dice **cómo construir**. Este documento garantiza que lo construido:
1. Tiene **exactamente las mismas funciones** que el draw.io original.
2. **No rompe la UI** cuando se agrega o modifica código.
3. Mantiene una **experiencia de usuario consistente** en todos los componentes.

---

## Pilar 1 — Inventario de Paridad Funcional

### ¿Qué es?
Una lista exhaustiva y versionada de todas las funciones del draw.io original, con un estado por cada una: `pendiente`, `en progreso`, `implementada`, `verificada`.

### Inventario de Funciones Principales

#### 🗂️ Gestión de Archivos
| Función | Origen en el código | Estado en Drawio.next |
|---------|--------------------|-----------------------|
| Nuevo diagrama en blanco | `main.js → EditorUi.createFile()` | ⬜ pendiente |
| Abrir archivo `.drawio` local | `main.js → EditorUi.openFile()` | ⬜ pendiente |
| Guardar como `.drawio` | `main.js → EditorUi.save()` | ⬜ pendiente |
| Exportar como SVG | `export.js` | ⬜ pendiente |
| Exportar como PNG | `export.js` | ⬜ pendiente |
| Exportar como PDF | `export.js` | ⬜ pendiente |
| Importar desde VSDX (Visio) | `vsdxImporter.js` | ⬜ pendiente |
| Abrir desde URL | `open.js` | ⬜ pendiente |
| Autoguardado en localStorage | `app.min.js` | ⬜ pendiente |

#### ✏️ Edición del Diagrama
| Función | Estado |
|---------|--------|
| Crear vértice (API / Toolbar / lienzo) | ✅ completado |
| Crear conector (API / arrastrar punto de conexión) | ✅ completado |
| Mover celda (drag & drop interactivo) | ✅ completado |
| Redimensionar celda (handles en esquinas) | ✅ completado |
| Editar etiqueta (doble clic en celda) | ⬜ pendiente |
| Copiar / Pegar (Ctrl+C / Ctrl+V) | ⬜ pendiente |
| Deshacer / Rehacer (Ctrl+Z / Ctrl+Y / Toolbar) | ✅ completado |
| Selección múltiple (arrastrar rectángulo rubberband) | ✅ completado |
| Eliminar (botón Toolbar / API removeSelected) | ✅ completado |
| Duplicar (Ctrl+D) | ⬜ pendiente |
| Alinear y distribuir formas | ⬜ pendiente |
| Agrupar / Desagrupar (Ctrl+G) | ⬜ pendiente |
| Zoom con rueda del mouse | ⬜ pendiente |
| Zoom con botones Toolbar / StatusBar (+ / − / 1:1 / Fit) | ✅ completado |
| Pan con arrastre | ✅ completado |
| Ajustar a la cuadrícula (snap to grid) | ⬜ pendiente |

#### 🎨 Estilos y Apariencia
| Función | Estado |
|---------|--------|
| Cambiar color de relleno | ⬜ pendiente |
| Cambiar color de borde | ⬜ pendiente |
| Cambiar grosor de línea | ⬜ pendiente |
| Cambiar fuente y tamaño de texto | ⬜ pendiente |
| Aplicar estilo predefinido (style string) | ⬜ pendiente |
| Copiar estilo de una celda a otra | ⬜ pendiente |
| Tema claro / oscuro (toggle reactivo + localStorage) | ✅ completado |
| Cuadrícula: activar/desactivar, tamaño | ⬜ pendiente |

#### 📐 Tipos de Formas
| Categoría | Nº de formas en original | Estado |
|-----------|-------------------------|--------|
| General (rectángulo, elipse, diamante...) | ~20 | ⬜ pendiente |
| Flowchart | ~30 | ⬜ pendiente |
| UML | ~25 | ⬜ pendiente |
| Entity-Relation | ~15 | ⬜ pendiente |
| Network | ~40 | ⬜ pendiente |
| AWS / Azure / GCP | ~200+ | ⬜ pendiente |
| BPMN | ~30 | ⬜ pendiente |

#### 🔌 Plugins del original (20 plugins)
| Plugin | Función | Estado |
|--------|---------|--------|
| `animation.js` | Animar flechas con movimiento | ⬜ pendiente |
| `flow.js` | Animación de flujo en conectores | ⬜ pendiente |
| `sql.js` | Generar diagrama ER desde SQL | ⬜ pendiente |
| `explore.js` | Explorar grafo de dependencias | ⬜ pendiente |
| `replay.js` | Reproducir historial de edición | ⬜ pendiente |
| `tags.js` | Etiquetar y filtrar celdas | ⬜ pendiente |
| `tooltips.js` | Tooltips personalizados | ⬜ pendiente |
| `number.js` | Numerar celdas automáticamente | ⬜ pendiente |
| `page.js` | Gestión de páginas/pestañas | ⬜ pendiente |
| `props.js` | Propiedades personalizadas | ⬜ pendiente |
| `text.js` | Importar texto como diagrama | ⬜ pendiente |
| `import.js` | Importación de formatos externos | ⬜ pendiente |
| `trello.js` | Integración con Trello | ⬜ pendiente |
| `nextcloud.js` | Integración con Nextcloud | ⬜ pendiente |
| `edgeConnection.js` | Conectores avanzados | ⬜ pendiente |
| `anonymize.js` | Anonimizar texto del diagrama | ⬜ pendiente |
| `random.js` | Layouts aleatorios | ⬜ pendiente |
| `rackF5.js` | Diagramas de rack F5 | ⬜ pendiente |
| `svgdata.js` | Embeber datos en SVG | ⬜ pendiente |
| `update.js` | Actualizaciones automáticas | ⬜ pendiente |

### Regla de Paridad
> ✅ **Una función se marca `verificada`** solo cuando tiene test E2E que lo demuestra.
> ❌ **No se cierra una Fase** si alguna función de esa fase está en `pendiente`.

---

## Pilar 2 — Estrategia de Testing en 4 Capas

```
┌─────────────────────────────────────────────────────┐
│  Capa 4: Tests Visuales de Regresión (Playwright)   │  ← Detecta cambios en apariencia
├─────────────────────────────────────────────────────┤
│  Capa 3: Tests E2E de Funciones (Playwright)        │  ← Verifica paridad funcional
├─────────────────────────────────────────────────────┤
│  Capa 2: Tests de Integración (Vitest)              │  ← Verifica que módulos se comunican
├─────────────────────────────────────────────────────┤
│  Capa 1: Tests Unitarios (Vitest)                   │  ← Verifica funciones individuales
└─────────────────────────────────────────────────────┘
```

### Capa 1 — Tests Unitarios (Vitest)
**Qué cubre:** Cada función del `src/core/` de forma aislada.
**Cobertura mínima obligatoria:** 90% en `src/core/`

```typescript
// Ejemplo: src/core/graph/DiagramModel.test.ts
test('addCell agrega correctamente una celda al modelo', () => {
  const model = createDiagramModel('Test');
  const cell = createVertex({ id: '1', label: 'Nodo A', x: 0, y: 0 });
  const updated = addCell(model, cell);

  expect(updated.cells.size).toBe(1);
  expect(updated.cells.get('1')?.label).toBe('Nodo A');
  expect(model.cells.size).toBe(0); // el original NO muta
});
```

**Comandos:**
```bash
pnpm test              # ejecutar todos los tests
pnpm test --coverage   # ver cobertura
pnpm test:watch        # modo watch durante desarrollo
```

---

### Capa 2 — Tests de Integración (Vitest)
**Qué cubre:** Que los módulos del `core/` funcionan juntos (ej. parsear un XML y obtener un DiagramModel válido).

```typescript
// Ejemplo: src/core/formats/DrawioParser.integration.test.ts
import { parsDrawio } from './DrawioParser';
import { addCell } from '../graph/DiagramModel';

test('parsear un archivo .drawio real produce un DiagramModel válido', async () => {
  const xml = await readFile('./fixtures/sample.drawio', 'utf-8');
  const model = parsDrawio(xml);

  expect(model.cells.size).toBeGreaterThan(0);
  expect(model.name).toBeTruthy();

  // Verificar round-trip: parsear → serializar → parsear
  const serialized = serializeDiagram(model);
  const reparsed = parsDrawio(serialized);
  expect(reparsed.cells.size).toBe(model.cells.size);
});
```

**Ubicación de fixtures:**
```
src/core/formats/fixtures/
├── sample-simple.drawio       ← 3 nodos básicos
├── sample-complex.drawio      ← 50+ nodos, conectores, grupos
├── sample-uml.drawio          ← Diagrama de clases UML
└── sample-er.drawio           ← Diagrama entidad-relación
```

---

### Capa 3 — Tests E2E de Paridad Funcional (Playwright)
**Qué cubre:** Las mismas acciones que haría un usuario real, comprobando que el resultado es idéntico al original.

**Instalar:**
```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

**Estructura de tests E2E:**
```
tests/e2e/
├── file/
│   ├── new-diagram.spec.ts
│   ├── open-drawio.spec.ts
│   └── save-drawio.spec.ts
├── editing/
│   ├── create-vertex.spec.ts
│   ├── create-edge.spec.ts
│   ├── move-cell.spec.ts
│   ├── undo-redo.spec.ts
│   └── copy-paste.spec.ts
├── styles/
│   └── change-fill-color.spec.ts
└── plugins/
    └── flow-animation.spec.ts
```

**Ejemplo de test E2E:**
```typescript
// tests/e2e/editing/create-vertex.spec.ts
import { test, expect } from '@playwright/test';

test('doble clic en el lienzo crea un nuevo vértice', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Hacer doble clic en el centro del lienzo
  const canvas = page.locator('.canvas');
  await canvas.dblclick({ position: { x: 400, y: 300 } });

  // 2. Verificar que apareció un vértice
  const cells = page.locator('[data-testid="cell-vertex"]');
  await expect(cells).toHaveCount(1);

  // 3. Verificar que tiene un cuadro de edición de texto activo
  await expect(page.locator('.cell-editor')).toBeVisible();
});
```

**Regla:** Cada función del inventario de paridad tiene exactamente **1 test E2E** que la verifica.

---

### Capa 4 — Tests de Regresión Visual (Playwright Screenshots)
**Qué cubre:** Detectar automáticamente cuando la apariencia de un componente cambia sin querer.

**Cómo funciona:**
1. La primera vez que se corre, Playwright toma una foto de referencia del componente.
2. En cada PR o commit, vuelve a tomar la foto y la **compara píxel a píxel**.
3. Si hay diferencia, el test falla y muestra el diff visual.

```typescript
// tests/visual/toolbar.spec.ts
test('Toolbar tiene la apariencia correcta', async ({ page }) => {
  await page.goto('http://localhost:5173');
  const toolbar = page.locator('.toolbar');
  await expect(toolbar).toHaveScreenshot('toolbar-default.png');
});

test('Toolbar en tema oscuro', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="toggle-theme"]');
  const toolbar = page.locator('.toolbar');
  await expect(toolbar).toHaveScreenshot('toolbar-dark.png');
});
```

**Componentes con tests visuales obligatorios:**
- `MenuBar` (claro + oscuro)
- `Toolbar` (claro + oscuro)
- `Sidebar` (con formas cargadas)
- `Canvas` (con 3 vértices y 2 conectores)
- `Inspector` (con celda seleccionada)
- `CellView` — cada tipo de forma

**Carpeta de snapshots:**
```
tests/visual/snapshots/
├── toolbar-default.png
├── toolbar-dark.png
├── canvas-with-nodes.png
└── ...
```

> [!WARNING]
> Los snapshots visuales se actualizan **solo manualmente** con `pnpm test:visual --update-snapshots`. Nunca de forma automática en CI.

---

## Pilar 3 — Sistema de Diseño para UI/UX Estable

### ¿Qué garantiza la UI estable?
Un **Design Token System** — un conjunto de variables CSS que definen colores, tipografía, espaciados y bordes. **Todos los componentes usan los mismos tokens**. Si cambia el diseño, se cambia en un solo lugar.

### Tokens de diseño (`src/ui/styles/tokens.css`)
```css
:root {
  /* Colores base */
  --color-bg-primary: #1e1e1e;
  --color-bg-secondary: #252526;
  --color-bg-elevated: #2d2d2d;
  --color-border: #3e3e42;
  --color-text-primary: #cccccc;
  --color-text-secondary: #9d9d9d;
  --color-accent: #0078d4;
  --color-accent-hover: #106ebe;

  /* Tipografía */
  --font-family: 'Segoe UI', system-ui, sans-serif;
  --font-size-sm: 11px;
  --font-size-base: 13px;
  --font-size-lg: 15px;

  /* Espaciado */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;

  /* Bordes */
  --radius-sm: 2px;
  --radius-md: 4px;
  --border-width: 1px;

  /* Transiciones */
  --transition-fast: 100ms ease;
  --transition-base: 200ms ease;
}

[data-theme="light"] {
  --color-bg-primary: #f3f3f3;
  --color-bg-secondary: #ffffff;
  --color-border: #d4d4d4;
  --color-text-primary: #1e1e1e;
  --color-text-secondary: #666666;
}
```

### Regla de UI
> ❌ **Prohibido** usar colores, fuentes o tamaños hardcodeados en los componentes.
> ✅ **Solo se usan variables CSS** de `tokens.css`.

```svelte
<!-- ❌ INCORRECTO -->
<div style="background: #252526; color: #ccc; font-size: 13px;">

<!-- ✅ CORRECTO -->
<div class="panel">

<style>
  .panel {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
  }
</style>
```

### Storybook — Catálogo de Componentes
Instalar Storybook para que los devs vean todos los componentes en un solo lugar, con sus estados (hover, activo, deshabilitado, claro/oscuro):

```bash
pnpm dlx storybook@latest init
```

Cada componente tiene su archivo de historia:
```
src/ui/
├── Toolbar.svelte
├── Toolbar.stories.ts    ← Muestra Toolbar en todos sus estados
├── Sidebar.svelte
├── Sidebar.stories.ts
└── ...
```

```typescript
// Toolbar.stories.ts
export default { title: 'UI/Toolbar', component: Toolbar };

export const Default = {};
export const DarkTheme = { parameters: { theme: 'dark' } };
export const WithSelection = { args: { hasSelection: true } };
```

**Storybook corre en:** `http://localhost:6006`

---

## Pilar 4 — Proceso de Validación por Fase

### Checklist de cierre de cada fase

Antes de hacer merge de cualquier rama de fase a `dev`, se deben cumplir **todos** estos puntos:

```
CHECKLIST DE CIERRE DE FASE
─────────────────────────────────────────────────────
□ Tests unitarios pasan al 100%        (pnpm test)
□ Cobertura del core ≥ 90%             (pnpm test --coverage)
□ Tests E2E de las funciones de esta   (pnpm test:e2e)
  fase pasan
□ Tests visuales actualizados y        (pnpm test:visual)
  aprobados
□ No hay errores de TypeScript         (pnpm tsc --noEmit)
□ El inventario de paridad refleja     (revisar manualmente)
  el estado actual
□ Storybook muestra los nuevos         (pnpm storybook)
  componentes correctamente
□ PR revisado por al menos 1 dev       (GitHub PR review)
  del equipo
□ Demo en vivo grabada o compartida    (Loom / screenshot)
  al equipo
```

### Pipeline de CI/CD en GitHub Actions

Crear `.github/workflows/quality.yml`:

```yaml
name: Quality Gate

on:
  pull_request:
    branches: [dev, main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test --coverage
      - run: pnpm tsc --noEmit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm test:e2e

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:visual
```

> [!IMPORTANT]
> **Un PR no se puede mergear** si alguno de estos 3 jobs falla en GitHub Actions.

---

## Resumen: ¿Qué garantiza cada pilar?

| Pilar | Garantía |
|-------|----------|
| **Inventario de Paridad** | "Drawio.next tiene TODAS las funciones del original" |
| **Tests Unitarios (Vitest)** | "Cada función del core hace exactamente lo que debe" |
| **Tests E2E (Playwright)** | "El usuario puede hacer en Drawio.next todo lo que hace en draw.io" |
| **Tests Visuales** | "Ningún cambio de código rompe la apariencia visualmente" |
| **Design Tokens** | "Todos los componentes se ven consistentes entre sí" |
| **Storybook** | "Los devs pueden ver todos los estados de UI sin abrir la app" |
| **CI/CD (GitHub Actions)** | "Es imposible subir código roto a `dev` o `main`" |
| **Checklist de Fase** | "Ninguna fase termina sin estar completamente verificada" |
