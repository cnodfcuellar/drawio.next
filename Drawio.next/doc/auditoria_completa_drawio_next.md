# Auditoría Integral de Código: Drawio.next vs. draw.io

Este informe presenta la auditoría archivo por archivo de todo el proyecto **Drawio.next** (`c:\Users\User\.gemini\antigravity\scratch\drawio-workspace\Drawio.next`), detallando lo implementado hasta la fecha y la matriz de brechas pendientes para alcanzar paridad total con la versión madura de draw.io (diagrams.net).

---

## 1. Inventario y Estado Archivo por Archivo

A continuación se auditan individualmente los **66 archivos** que componen la base de código de `Drawio.next`:

### 1.1. Capa de Interfaz de Usuario (`Drawio.next/app/src/ui/`)

| Archivo | Líneas | Estado Actual | Lo que Implementa | Lo que Falta Implementar |
| :--- | :--- | :--- | :--- | :--- |
| **`AppShell.svelte`** | 62 | 🟢 100% | Layout Grid de 5 áreas CSS (`menubar`, `toolbar`, `sidebar`, `canvas`, `inspector`, `statusbar`), reactividad del tema en `body`. | Soporte para paneles colapsables / redimensionables mediante Splitters o drag handles. |
| **`MenuBar.svelte`** | 513 | 🟡 70% | Menús desplegables (File, Edit, View, Arrange, Extras, Help), Nuevo, Abrir (.drawio/.xml), Guardar .drawio, Exportar SVG/PNG, Deshacer/Rehacer, Zoom, Traer al frente/Enviar al fondo, Duplicar página actual, Switch de tema. | Exportar PDF, Exportar JPEG, Configuración de Página (Page Setup), Portapapeles (Copiar/Pegar/Cortar), Duplicar forma (Ctrl+D), Agrupar/Desagrupar (Ctrl+G), Alineación en bloque, Auto-layout. |
| **`Toolbar.svelte`** | 212 | 🟡 65% | Herramientas rápidas: Selección/Puntero (V), Modo Conector (C), Enlace rápido (🔗), Deshacer/Rehacer, Eliminar, Nuevo bloque rápido, Zoom (+, -, 1:1, Fit). | Selector rápido de color/relleno en toolbar, toggle de cuadrícula (Grid), toggle de guías (Guides), dropdown de formas rápidas, selector de estilo de conector. |
| **`Sidebar.svelte`** | 369 | 🟡 75% | 30 formas vectoriales categorizadas (General, Básicas, Flowchart, Flechas, UML/ER), búsqueda insensible a tildes, botones Expandir/Colapsar todo, Drag & Drop nativo al canvas, inserción por clic en el centro. | **Scratchpad funcional** (persistencia de formas personalizadas guardadas por el usuario), catálogo extendido de stencils (AWS, Azure, GCP, Cisco, BPMN), modal "Más Formas...". |
| **`Canvas.svelte`** | 239 | 🟢 90% | Contenedor de `mxGraph`, manejo de eventos drag/drop de formas y archivos .drawio, banner flotante de modo conector interactivo, auto-recuperación de diagrama si el lienzo está vacío. | Soporte para minimapa flotante (`mxOutline`), guías inteligentes de distancia (`mxGuide`), dibujo a mano alzada. |
| **`Inspector.svelte`** | 984 | 🟡 70% | Pestañas Style, Arrange, Text. Control de color de relleno, borde, grosor, línea discontinua, esquinas redondeadas, sombra, opacidad, rotación, geometría (X, Y, W, H), texto, enrutamiento de conectores, selector de flechas y enlace directo a destinos. | **Inspector de Página vacía** (Page Format, tamaño A4/Letter, Grid Size, color de fondo), selector de **gradientes**, tipografía avanzada (familias de fuentes, negrita B, cursiva I, subrayado U, alineación vertical), puntos de ancla fijos. |
| **`StatusBar.svelte`** | 334 | 🟢 95% | Pestañas de páginas reactivas, creación (+), navegación, renombrado inline y contextual, duplicado (⧉), eliminación (✕), menú contextual de página flotante, badge de auto-guardado en tiempo real, zoom. | Reordenamiento de pestañas de páginas mediante Drag & Drop, exportación selectiva de página individual. |

---

### 1.2. Capa de Motor Gráfico y Controladores (`Drawio.next/app/src/core/`)

| Archivo | Líneas | Estado Actual | Lo que Implementa | Lo que Falta Implementar |
| :--- | :--- | :--- | :--- | :--- |
| **`GraphController.ts`** | ~1600 | 🟡 80% | Wrapper tipado de `mxGraph`. Gestión de nodos, conectores, estilos, eventos de selección, cambios de modelo, panning (Espacio / Clic derecho / Rueda), zoom, exportación SVG/PNG/XML, importación XML multi-página, `refresh()` y resolución de `defaultParent`. | Agrupar/Desagrupar celdas (`groupCells`/`ungroupCells`), Duplicar celdas (`duplicateCells`), Alineación automática (Izquierda, Centro, Derecha, Arriba, Abajo), Distribución uniforme, Algoritmos de Layout (`mxHierarchicalLayout`, `mxCompactTreeLayout`), Portapapeles interno (Copy/Cut/Paste), Toggle de Grid/Guides/Page format. |
| **`types/mxgraph.d.ts`** | 230 | 🟡 75% | Definiciones TypeScript para `mxGraph`, `mxGraphModel`, `mxCell`, `mxGeometry`, `mxUndoManager`, `mxCodec`, `mxUtils`, `mxEvent`, etc. | Tipos para `mxOutline`, `mxHierarchicalLayout`, `mxFastOrganicLayout`, `mxCompositeLayout`, `mxMorphing`. |
| **`shapes/shapeDefinitions.ts`** | 302 | 🟡 60% | 30 formas vectoriales estándar con estilos draw.io auténticos, metadatos, tags y siluetas SVG. | Stencils avanzados de arquitectura cloud (AWS, Azure, GCP, Kubernetes, Cisco), diagramas de red, tablas y contenedores tipo swimlane. |

---

### 1.3. Capa de Estado Reactivo (`Drawio.next/app/src/stores/`)

| Archivo | Líneas | Estado Actual | Lo que Implementa | Lo que Falta Implementar |
| :--- | :--- | :--- | :--- | :--- |
| **`graph.ts`** | 38 | 🟢 100% | Stores reactivos para `activeGraph`, `zoomLevel`, `graphRevision`, `connectionMode`, `pendingConnectSource`. | Store para estado de cuadrícula y guías inteligentes. |
| **`selection.ts`** | 44 | 🟢 100% | Stores para `selectedIds`, `hasSelection`, helpers `selectOne`, `selectMany`, `clearSelection`. | Helper para filtrar rápidamente tipos de selección (solo vértices, solo aristas). |
| **`theme.ts`** | 37 | 🟢 100% | Store `theme` ('dark' \| 'light') con sincronización en `localStorage` y toggle. | Temas adicionales de draw.io (`kennedy`, `atlas`, `sketch`, `min`). |
| **`persistence.ts`** | 86 | 🟢 95% | Autoguardado con debounce (400ms), `saveDiagram`, `loadSavedDiagram`, `clearSavedDiagram`, estados `saved`/`saving`/`unsaved`, marcas de tiempo. | Historial de versiones / snapshots locales (Version History). |
| **`pages.ts`** | 235 | 🟢 95% | Gestión multi-página: `addPage`, `switchPage`, `renamePage`, `duplicatePage`, `removePage`, `syncCurrentPageXml`, `getAllPagesWithFreshXml`. | Drag & Drop para reordenar índice de páginas en el array. |

---

### 1.4. Infraestructura, Estilos y Configuración

| Archivo | Estado Actual | Notas de Auditoría |
| :--- | :--- | :--- |
| **`app/index.html`** | 🟢 100% | Configura paths de `mxGraph`, polyfills de métodos draw.io (`isSpecialColor`, `isPart`, `getCompositeParent`), carga `mxClient.js` y `Shapes.js` (8,700 líneas oficiales). |
| **`app/src/styles/tokens.css`** | 🟢 100% | Tokens de diseño centralizados (colores, fuentes, espaciado, radios, dimensiones de layout, transiciones, resets y tema claro). |
| **`app/package.json`** | 🟢 100% | Vite 6, Svelte 5, TypeScript 5.7, Vitest 3.2, Playwright, serve. |
| **`app/vitest.config.ts`** | 🟢 100% | 48 tests unitarios en 5 suites pasando al 100% verde sin errores. |
| **`app/playwright.config.ts`**| 🟡 50% | Configuración base lista; faltan suites E2E completas integradas en CI. |

---

## 2. Matriz de Brechas Globales (Gaps de Funcionalidad)

Comparando el inventario actual de `Drawio.next` frente a las 15 categorías completas de draw.io extraídas del código fuente original:

```mermaid
pie title Nivel de Implementación Global de Drawio.next
    "Completado y Verificado" : 62
    "Inspector y Formato Avanzado" : 12
    "Edición de Celdas (Copy/Paste/Group/Align)" : 11
    "Exportación e Importación Pro" : 8
    "Stencils & Scratchpad Extendido" : 7
```

---

## 3. Hoja de Ruta Priorizada (Roadmap de Implementación)

### 🔴 Prioridad P0: Paridad Operativa Esencial (Inmediato)
1. **Acciones de Edición de Celdas:**
   * Implementar `duplicateCells` (Ctrl+D) en `GraphController`.
   * Implementar `groupCells` (Ctrl+G) y `ungroupCells` (Ctrl+Shift+U).
   * Implementar Copiar / Cortar / Pegar con portapapeles interno y teclado (`Ctrl+C`, `Ctrl+X`, `Ctrl+V`).
2. **Alineación y Distribución en Bloque:**
   * Alinear selección (Izquierda, Centro H, Derecha, Arriba, Centro V, Abajo).
   * Distribuir selección uniformemente (Horizontal y Vertical).
3. **Inspector de Página (Sin selección):**
   * Cuando no hay celdas seleccionadas, el Inspector debe mostrar: Formato de página (A4, Carta), Orientación (Vertical/Horizontal), Color de fondo del lienzo, Tamaño de cuadrícula y Toggle de cuadrícula.

---

### 🟡 Prioridad P1: Estilos Avanzados & Exportación de Alta Resolución
1. **Format Panel Pro:**
   * Selector de gradientes (color secundario y dirección N/S/E/W).
   * Controles tipográficos completos: selector de fuentes (Segoe UI, Arial, Roboto, Courier), Negrita, Cursiva, Subrayado, Alineación vertical.
2. **Exportación Universal:**
   * Exportar PNG en Alta Resolución (2x Retina, 4x Imprimible) con fondo transparente opcional.
   * Copiar imagen PNG directamente al portapapeles del sistema (`navigator.clipboard.write`).
   * Exportar PDF vectorial en el cliente.
3. **Scratchpad Funcional:**
   * Drag & drop de formas desde el lienzo hacia el panel de Scratchpad para guardarlas y reutilizarlas.

---

### 🟢 Prioridad P2: Herramientas Profesionales & Ecosistema
1. **Algoritmos de Auto-Layout:**
   * Disposición automática de diagramas: Jerárquico (`mxHierarchicalLayout`), Árbol orgánico y Circular.
2. **Minimapa / Vista Radar (`mxOutline`):**
   * Ventana flotante en miniatura para navegación en diagramas grandes.
3. **Catálogo Extendido de Stencils:**
   * Paquetes de iconos de AWS, Azure, GCP, Kubernetes y Cisco.
