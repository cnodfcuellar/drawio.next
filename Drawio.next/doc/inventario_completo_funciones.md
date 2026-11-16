# Inventario Real de Funciones — draw.io
### Extraído directamente del código fuente · 1,347 capacidades en el sistema i18n · 57 módulos JS

> [!WARNING]
> El inventario previo en `garantia_calidad_drawio_next.md` era una **muestra mínima**. Este es el inventario real extraído del código fuente. Draw.io tiene ~350 funciones distintas agrupadas en 15 categorías.

---

## Escala Real del Proyecto

| Métrica | Valor |
|---------|-------|
| Claves de UI/i18n (cadenas únicas) | **1,347** |
| Archivos JS de lógica de negocio | **57** |
| Archivo más grande | `Extensions.js` (662 KB) |
| Plugins oficiales | **20** |
| Idiomas soportados | **45** |
| Tipos de exportación | **8** |
| Integraciones de nube | **7** |
| Categorías de formas | **50+** |
| Stencils XML | **40+ paquetes** |

---

## Categoría 1 — Gestión de Archivos y Almacenamiento
*Fuente: `DrawioFile.js`, `LocalFile.js`, `StorageFile.js`, `RemoteFile.js`, `EmbedFile.js`, `main.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| F001 | Nuevo diagrama en blanco | 🟢 Baja |
| F002 | Nuevo desde plantilla (50+ plantillas) | 🟡 Media |
| F003 | Abrir archivo local `.drawio` | 🟢 Baja |
| F004 | Abrir archivo `.xml` | 🟢 Baja |
| F005 | Abrir archivo `.html` (con diagrama embebido) | 🟡 Media |
| F006 | Abrir desde URL | 🟡 Media |
| F007 | Abrir desde arrastrar y soltar (drag & drop) | 🟡 Media |
| F008 | Guardar como `.drawio` | 🟢 Baja |
| F009 | Guardar como `.xml` | 🟢 Baja |
| F010 | Guardar como `.html` (con redirect a URL de nube) | 🟡 Media |
| F011 | Guardar como `.png` (con datos embebidos) | 🟡 Media |
| F012 | Guardar como `.svg` (con datos embebidos) | 🟡 Media |
| F013 | Autoguardado en `localStorage` (con debounce) | 🟡 Media |
| F014 | Recuperación de borradores (`draftFound`) | 🟡 Media |
| F015 | Descartar borrador | 🟢 Baja |
| F016 | Historial de revisiones | 🔴 Alta |
| F017 | Renombrar archivo | 🟢 Baja |
| F018 | Duplicar archivo | 🟢 Baja |
| F019 | Eliminar archivo | 🟢 Baja |
| F020 | Mover archivo a papelera | 🟢 Baja |
| F021 | Modo solo lectura (`readOnly`) | 🟡 Media |
| F022 | Detección de cambios externos con sincronización | 🔴 Alta |
| F023 | Bloqueo de diagrama para prevenir pérdida de datos | 🔴 Alta |

---

## Categoría 2 — Exportación
*Fuente: `export.js`, `export-init.js`, `EditorUi.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| E001 | Exportar como PNG (con DPI configurable) | 🟡 Media |
| E002 | Exportar como SVG (con fonts embebidas) | 🟡 Media |
| E003 | Exportar como PDF | 🔴 Alta |
| E004 | Exportar como HTML | 🟡 Media |
| E005 | Exportar como VSDX (Visio) | 🔴 Alta |
| E006 | Exportar como XML | 🟢 Baja |
| E007 | Exportar como Bitmap PNG editable | 🟡 Media |
| E008 | Exportar SVG editable | 🟡 Media |
| E009 | Exportar solo la selección | 🟡 Media |
| E010 | Exportar todas las páginas | 🟡 Media |
| E011 | Configurar DPI de exportación | 🟢 Baja |
| E012 | Embeber fuentes en la exportación | 🟡 Media |
| E013 | Embeber imágenes en la exportación | 🟡 Media |
| E014 | Recortar al contenido (crop) | 🟡 Media |
| E015 | Imprimir diagrama | 🟡 Media |
| E016 | Modo presentación | 🟡 Media |

---

## Categoría 3 — Importación
*Fuente: `vsdxImporter.js`, `plugins/import.js`, `Dialogs.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| I001 | Importar desde VSDX (Visio) | 🔴 Alta |
| I002 | Importar desde CSV (con mapeo de columnas) | 🔴 Alta |
| I003 | Importar desde XML draw.io | 🟢 Baja |
| I004 | Importar desde URL | 🟡 Media |
| I005 | Importar desde Gliffy | 🔴 Alta |
| I006 | Importar desde Lucidchart | 🔴 Alta |
| I007 | Importar imagen (PNG, JPG, SVG, GIF) | 🟡 Media |
| I008 | Importar desde Google Drive | 🔴 Alta |
| I009 | Importar desde OneDrive/M365 | 🔴 Alta |
| I010 | Importar desde Dropbox | 🔴 Alta |
| I011 | Agregar a diagrama existente (`addToExistingDrawing`) | 🟡 Media |
| I012 | Redimensionar imágenes grandes al importar | 🟢 Baja |

---

## Categoría 4 — Edición del Canvas
*Fuente: `mxgraph/src/`, `Extensions.js`, `Editor.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| C001 | Crear vértice (doble clic en canvas) | 🟡 Media |
| C002 | Crear conector (arrastrar desde punto de conexión) | 🟡 Media |
| C003 | Mover celda (drag & drop) | 🟡 Media |
| C004 | Redimensionar celda (handles en 8 puntos) | 🟡 Media |
| C005 | Editar etiqueta inline (doble clic) | 🟡 Media |
| C006 | Editar etiqueta con formato HTML | 🔴 Alta |
| C007 | Copiar / Pegar (Ctrl+C / Ctrl+V) | 🟡 Media |
| C008 | Pegar en posición de cursor | 🟡 Media |
| C009 | Cortar (Ctrl+X) | 🟢 Baja |
| C010 | Duplicar celda (Ctrl+D) | 🟢 Baja |
| C011 | Eliminar celda (Delete / Backspace) | 🟢 Baja |
| C012 | Deshacer (Ctrl+Z) | 🟡 Media |
| C013 | Rehacer (Ctrl+Y / Ctrl+Shift+Z) | 🟡 Media |
| C014 | Selección múltiple (Ctrl+clic) | 🟡 Media |
| C015 | Selección por rectángulo (rubber band) | 🟡 Media |
| C016 | Seleccionar todo (Ctrl+A) | 🟢 Baja |
| C017 | Seleccionar ninguno | 🟢 Baja |
| C018 | Seleccionar solo vértices | 🟢 Baja |
| C019 | Seleccionar solo conectores | 🟢 Baja |
| C020 | Zoom con rueda del mouse | 🟢 Baja |
| C021 | Zoom con Ctrl+= / Ctrl+- | 🟢 Baja |
| C022 | Ajustar al contenido (`smartFit`) | 🟡 Media |
| C023 | Pan con barra espaciadora + arrastrar | 🟡 Media |
| C024 | Pan con clic en zona vacía del canvas | 🟡 Media |
| C025 | Snap to Grid (ajuste a cuadrícula) | 🟡 Media |
| C026 | Guías de distancia inteligentes (`DistanceGuides.js`) | 🔴 Alta |
| C027 | Deshacer movimiento de forma alineada | 🟡 Media |
| C028 | Copiar tamaño de celda a otra | 🟢 Baja |
| C029 | Colapsar / expandir grupo | 🟡 Media |
| C030 | Entrar en grupo (`enterGroup`) | 🟡 Media |
| C031 | Salir de grupo (`exitGroup`) | 🟢 Baja |
| C032 | Agrupar selección (Ctrl+G) | 🟡 Media |
| C033 | Desagrupar (Ctrl+Shift+G) | 🟡 Media |
| C034 | Traer al frente | 🟢 Baja |
| C035 | Enviar al fondo | 🟢 Baja |
| C036 | Traer hacia adelante | 🟢 Baja |
| C037 | Enviar hacia atrás | 🟢 Baja |
| C038 | Revertir conexión (`reverse`) | 🟢 Baja |
| C039 | Agregar waypoint a conector | 🟡 Media |
| C040 | Eliminar waypoint | 🟢 Baja |
| C041 | Limpiar todos los waypoints | 🟢 Baja |
| C042 | Editar geometría manualmente (cuadro numérico) | 🟡 Media |
| C043 | Autosize de celda al contenido | 🟡 Media |
| C044 | Dibujo a mano alzada (`mxFreehand.js`) | 🔴 Alta |
| C045 | Regla (Ruler) horizontal y vertical (`mxRuler.js`) | 🔴 Alta |

---

## Categoría 5 — Alineación y Distribución
*Fuente: `EditorUi.js`, menú Arrange*

| ID | Función | Complejidad |
|----|---------|-------------|
| A001 | Alinear a la izquierda | 🟢 Baja |
| A002 | Alinear al centro (horizontal) | 🟢 Baja |
| A003 | Alinear a la derecha | 🟢 Baja |
| A004 | Alinear arriba | 🟢 Baja |
| A005 | Alinear al centro (vertical) | 🟢 Baja |
| A006 | Alinear abajo | 🟢 Baja |
| A007 | Distribuir horizontalmente | 🟢 Baja |
| A008 | Distribuir verticalmente | 🟢 Baja |
| A009 | Mismo ancho | 🟢 Baja |
| A010 | Misma altura | 🟢 Baja |
| A011 | Mismo tamaño | 🟢 Baja |
| A012 | Cambiar orientación | 🟢 Baja |

---

## Categoría 6 — Estilos y Apariencia
*Fuente: `EditorUi.js`, `Dialogs.js`, `styles/`*

| ID | Función | Complejidad |
|----|---------|-------------|
| S001 | Panel de estilo (Inspector derecho) | 🔴 Alta |
| S002 | Cambiar color de relleno (color picker) | 🟡 Media |
| S003 | Cambiar color de borde | 🟡 Media |
| S004 | Cambiar grosor de borde | 🟢 Baja |
| S005 | Cambiar estilo de borde (sólido, punteado, discontinuo) | 🟢 Baja |
| S006 | Cambiar color de fuente | 🟡 Media |
| S007 | Cambiar familia de fuente | 🟡 Media |
| S008 | Cambiar tamaño de fuente | 🟢 Baja |
| S009 | Negrita / Cursiva / Tachado / Subrayado | 🟢 Baja |
| S010 | Superíndice / Subíndice | 🟢 Baja |
| S011 | Alineación de texto (izq/centro/der/arriba/abajo) | 🟢 Baja |
| S012 | Opacidad del texto | 🟢 Baja |
| S013 | Opacidad del relleno | 🟢 Baja |
| S014 | Gradiente de color | 🟡 Media |
| S015 | Efecto de sombra | 🟢 Baja |
| S016 | Estilo "Glass" (reflejo) | 🟢 Baja |
| S017 | Estilo "Comic" | 🟢 Baja |
| S018 | Estilo "Sketch" (boceto a mano) | 🟡 Media |
| S019 | Estilo "Sharp" (esquinas perfectas) | 🟢 Baja |
| S020 | Estilo "Rounded" (esquinas redondeadas) | 🟢 Baja |
| S021 | Curvas: recta / curva / ortogonal / entidad | 🟡 Media |
| S022 | Tipos de flecha: inicio, fin, ambos | 🟡 Media |
| S023 | Editar style string directamente (modo experto) | 🟡 Media |
| S024 | Copiar estilo de celda (`copyStyle`) | 🟢 Baja |
| S025 | Pegar estilo de celda | 🟢 Baja |
| S026 | Establecer como estilo por defecto | 🟢 Baja |
| S027 | Limpiar estilo por defecto | 🟢 Baja |
| S028 | Colores adaptativos (`adaptiveColors`) | 🟡 Media |
| S029 | Paleta de temas predefinidos (Classic, Sketch, Dark...) | 🟡 Media |
| S030 | Fuentes de Google Fonts | 🔴 Alta |
| S031 | Imagen de fondo del diagrama | 🟡 Media |
| S032 | Color de fondo del diagrama | 🟢 Baja |
| S033 | Configurar tamaño y color de cuadrícula | 🟢 Baja |
| S034 | Activar/desactivar cuadrícula | 🟢 Baja |
| S035 | Vista de página (Page View) | 🟡 Media |
| S036 | Scrollbars en el canvas | 🟢 Baja |
| S037 | Tooltips en formas | 🟢 Baja |
| S038 | Flechas de conexión automáticas | 🟢 Baja |
| S039 | Puntos de conexión visibles | 🟢 Baja |
| S040 | Guías de alineación activables | 🟢 Baja |

---

## Categoría 7 — Formas y Paleta de Stencils
*Fuente: `shapes/`, `stencils/`, `mxgraph/src/`*

| ID | Categoría de Formas | Nº aprox. | Complejidad |
|----|--------------------|-----------|-|
| SH001 | General (rect, elipse, diamante, cilindro...) | ~25 | 🟡 |
| SH002 | Freeform (polígono editable) | 1 | 🔴 |
| SH003 | Misc y Advanced | ~30 | 🟡 |
| SH004 | Basic | ~20 | 🟢 |
| SH005 | Arrows (todos los tipos de flecha) | ~40 | 🟡 |
| SH006 | Flowchart (ANSI/ISO) | ~30 | 🟡 |
| SH007 | Entity Relation (ER) | ~15 | 🟡 |
| SH008 | UML 2.5 completo | ~40 | 🔴 |
| SH009 | BPMN 2.0 | ~35 | 🔴 |
| SH010 | Network | ~40 | 🟡 |
| SH011 | Network 2 | ~40 | 🟡 |
| SH012 | AWS 4 (iconos actuales) | ~200 | 🟡 |
| SH013 | AWS 3D | ~100 | 🟡 |
| SH014 | Azure | ~200 | 🟡 |
| SH015 | GCP 2 | ~100 | 🟡 |
| SH016 | Google Cloud Icons | ~100 | 🟡 |
| SH017 | IBM Cloud | ~80 | 🟡 |
| SH018 | Kubernetes | ~40 | 🟡 |
| SH019 | ArchiMate 2.1 / 3.0 | ~80 | 🔴 |
| SH020 | BPMN | ~35 | 🔴 |
| SH021 | SysML | ~30 | 🔴 |
| SH022 | EIP (Enterprise Integration Patterns) | ~40 | 🔴 |
| SH023 | C4 Model | ~15 | 🟡 |
| SH024 | Cisco (todos) | ~200 | 🟡 |
| SH025 | Bootstrap UI mockup | ~80 | 🟡 |
| SH026 | iOS mockup | ~60 | 🟡 |
| SH027 | Android mockup | ~50 | 🟡 |
| SH028 | Floorplans | ~40 | 🟡 |
| SH029 | Electrical | ~60 | 🔴 |
| SH030 | Rack Diagrams | ~40 | 🟡 |
| SH031 | Infographic | ~30 | 🟡 |
| SH032 | Lean Mapping | ~20 | 🟡 |
| SH033 | Cabinets | ~20 | 🟡 |
| SH034 | Signs / Señalización | ~30 | 🟡 |
| SH035 | Veeam | ~40 | 🟡 |
| SH036 | Atlassian | ~30 | 🟡 |
| SH037 | Salesforce | ~30 | 🟡 |
| SH038 | Clipart | ~300+ SVGs | 🟡 |
| SH039 | Emoji | ~100 | 🟢 |
| SH040 | Tablas (Tables) | ~10 | 🔴 |

---

## Categoría 8 — Capas (Layers)
*Fuente: `EditorUi.js`, menú View*

| ID | Función | Complejidad |
|----|---------|-------------|
| L001 | Agregar capa | 🟢 Baja |
| L002 | Eliminar capa | 🟢 Baja |
| L003 | Renombrar capa | 🟢 Baja |
| L004 | Mostrar/ocultar capa | 🟢 Baja |
| L005 | Bloquear capa (edición) | 🟢 Baja |
| L006 | Mover selección a capa | 🟡 Media |
| L007 | Duplicar capa | 🟡 Media |
| L008 | Mover capa arriba/abajo | 🟢 Baja |
| L009 | Seleccionar objetos en capa | 🟢 Baja |
| L010 | Marcar capa como capa de edición activa | 🟢 Baja |

---

## Categoría 9 — Páginas (Multi-page)
*Fuente: `Pages.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| P001 | Insertar nueva página | 🟢 Baja |
| P002 | Eliminar página | 🟢 Baja |
| P003 | Renombrar página | 🟢 Baja |
| P004 | Duplicar página | 🟡 Media |
| P005 | Reordenar páginas (drag en tabs) | 🟡 Media |
| P006 | Navegar entre páginas | 🟢 Baja |
| P007 | Exportar página específica | 🟡 Media |
| P008 | Exportar todas las páginas como PDF | 🔴 Alta |
| P009 | Vista previa de página en miniatura | 🟡 Media |
| P010 | Crear link entre páginas | 🟡 Media |

---

## Categoría 10 — Layouts Automáticos
*Fuente: `Dialogs.js`, `Extensions.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| LY001 | Layout automático: Árbol (vertical/horizontal) | 🔴 Alta |
| LY002 | Layout: Árbol Radial | 🔴 Alta |
| LY003 | Layout: Orgchart (org chart vertical) | 🔴 Alta |
| LY004 | Layout: Círculo | 🔴 Alta |
| LY005 | Layout: Fuerza dirigida (Force-directed) | 🔴 Alta |
| LY006 | Layout: Paralelo (Parallel) | 🔴 Alta |
| LY007 | Layout: Swimlane | 🔴 Alta |
| LY008 | Layout: Tabla (Stack) | 🔴 Alta |
| LY009 | Layout: Fishbone 1/2 (Espina de pescado) | 🔴 Alta |
| LY010 | Layout: Hanger 2/4 | 🔴 Alta |
| LY011 | Configurar espaciado de nodo padre-hijo | 🟡 Media |
| LY012 | Configurar espaciado entre hermanos | 🟡 Media |

---

## Categoría 11 — Colaboración en Tiempo Real
*Fuente: `DrawioFileSync.js`, `DiffSync.js`, `P2PCollab.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| CO001 | Colaboración en tiempo real (WebSocket/Polling) | 🔴 Alta |
| CO002 | Sincronización 3-way merge (diff3) | 🔴 Alta |
| CO003 | Mostrar cursores de otros usuarios | 🔴 Alta |
| CO004 | Compartir cursor del mouse | 🔴 Alta |
| CO005 | Bloqueo optimista por usuario | 🔴 Alta |
| CO006 | Notificación de usuario conectado/desconectado | 🟡 Media |
| CO007 | Link de edición compartida | 🟡 Media |
| CO008 | Modo solo lectura para colaboradores | 🟡 Media |
| CO009 | Chat en tiempo real | 🔴 Alta |
| CO010 | Tomar control del diagrama (`takeOver`) | 🔴 Alta |
| CO011 | P2P colaboración directa (`P2PCollab.js`) | 🔴 Alta |

---

## Categoría 12 — Integraciones de Nube
*Fuente: `DriveClient.js`, `OneDriveClient.js`, `DropboxClient.js`, `GitHubClient.js`, `GitLabClient.js`, `TrelloClient.js`*

| ID | Integración | Capacidades | Complejidad |
|----|-------------|-------------|-------------|
| CL001 | Google Drive | Abrir, guardar, compartir, comentarios, revisiones | 🔴 Alta |
| CL002 | OneDrive / M365 | Abrir, guardar, compartir | 🔴 Alta |
| CL003 | Dropbox | Abrir, guardar, listar archivos | 🔴 Alta |
| CL004 | GitHub | Abrir repos, guardar, commit, PRs | 🔴 Alta |
| CL005 | GitLab | Abrir repos, guardar, commit | 🔴 Alta |
| CL006 | Trello | Adjuntar diagramas a tarjetas | 🔴 Alta |
| CL007 | Notion | Via Chrome Extension | 🔴 Alta |
| CL008 | Atlassian Confluence Cloud | Plugin nativo | 🔴 Alta |
| CL009 | Microsoft Teams | Plugin nativo | 🔴 Alta |

---

## Categoría 13 — Librería de Formas Personalizadas
*Fuente: `StorageLibrary.js`, `UrlLibrary.js`, `RemoteLibrary.js`, `DriveLibrary.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| LB001 | Agregar forma al Scratchpad | 🟡 Media |
| LB002 | Crear librería personalizada | 🔴 Alta |
| LB003 | Importar librería desde archivo `.xml` | 🟡 Media |
| LB004 | Importar librería desde URL | 🟡 Media |
| LB005 | Guardar librería en Google Drive | 🔴 Alta |
| LB006 | Guardar librería en OneDrive | 🔴 Alta |
| LB007 | Renombrar librería | 🟢 Baja |
| LB008 | Eliminar librería | 🟢 Baja |
| LB009 | Búsqueda de formas | 🟡 Media |
| LB010 | Editar forma de librería (XML) | 🔴 Alta |
| LB011 | Exportar librería | 🟡 Media |

---

## Categoría 14 — Propiedades y Metadatos
*Fuente: `Dialogs.js`, `plugins/props.js`, `plugins/tags.js`*

| ID | Función | Complejidad |
|----|---------|-------------|
| M001 | Editar datos de celda (key-value) | 🟡 Media |
| M002 | Agregar propiedad personalizada | 🟢 Baja |
| M003 | Eliminar propiedad | 🟢 Baja |
| M004 | Editar tooltip de celda | 🟢 Baja |
| M005 | Editar link (URL o página interna) | 🟡 Media |
| M006 | Link especial a otra página del diagrama | 🟡 Media |
| M007 | Sistema de tags (etiquetas) | 🟡 Media |
| M008 | Filtrar por tag | 🟡 Media |
| M009 | Editar forma como polígono (puntos) | 🔴 Alta |
| M010 | Configuración del diagrama (JSON) | 🔴 Alta |
| M011 | Editor de XML del diagrama completo | 🟡 Media |
| M012 | Exportar como CSV con metadatos | 🔴 Alta |
| M013 | Tabla de contenidos automática | 🔴 Alta |

---

## Categoría 15 — Plugins Oficiales (20 plugins)
*Fuente: `plugins/*.js`*

| ID | Plugin | Función real | Complejidad |
|----|--------|-------------|-------------|
| PL001 | `animation.js` | Animar formas con movimiento frame-by-frame | 🔴 Alta |
| PL002 | `flow.js` | Animación de flujo en conectores (partículas) | 🔴 Alta |
| PL003 | `sql.js` | Generar diagrama ER desde DDL SQL | 🔴 Alta |
| PL004 | `explore.js` | Explorar grafo: expandir/contraer nodos conectados | 🔴 Alta |
| PL005 | `replay.js` | Reproducir historial de edición como video | 🔴 Alta |
| PL006 | `tags.js` | Etiquetar y filtrar celdas por tags | 🟡 Media |
| PL007 | `tooltips.js` | Tooltips personalizados HTML por celda | 🟡 Media |
| PL008 | `number.js` | Numerar celdas automáticamente | 🟡 Media |
| PL009 | `page.js` | Gestión avanzada de páginas | 🟡 Media |
| PL010 | `props.js` | Panel de propiedades personalizadas | 🟡 Media |
| PL011 | `text.js` | Importar texto plano como diagrama | 🟡 Media |
| PL012 | `import.js` | Importación avanzada de formatos externos | 🔴 Alta |
| PL013 | `trello.js` | Integración bidireccional con Trello | 🔴 Alta |
| PL014 | `nextcloud.js` | Guardar/abrir desde Nextcloud | 🔴 Alta |
| PL015 | `edgeConnection.js` | Conectores avanzados multi-punto | 🔴 Alta |
| PL016 | `anonymize.js` | Anonimizar todo el texto del diagrama | 🟡 Media |
| PL017 | `random.js` | Layouts aleatorios para testing | 🟢 Baja |
| PL018 | `rackF5.js` | Diagramas de rack con dispositivos F5 Networks | 🔴 Alta |
| PL019 | `svgdata.js` | Embeber datos arbitrarios en el SVG exportado | 🟡 Media |
| PL020 | `update.js` | Actualizaciones automáticas de formas desde datos | 🔴 Alta |

---

## Resumen por Complejidad

| Complejidad | Funciones | Estrategia |
|-------------|-----------|-----------|
| 🟢 Baja (~120) | Acciones simples sin estado | Implementar en Fase 2-3 |
| 🟡 Media (~140) | Interacciones con estado local | Implementar en Fase 3-4 |
| 🔴 Alta (~90) | Lógica compleja, integraciones externas | Implementar en Fase 4-5+ |

**Total estimado: ~350 funciones distintas**

> [!NOTE]
> Las integraciones de nube (Categoría 12) y la colaboración en tiempo real (Categoría 11) representan las ~50 funciones más complejas. Estas pueden implementarse en fases posteriores (v2.0) sin bloquear el lanzamiento del editor base funcional.

---

## Priorización para Drawio.next v1.0

### Incluir en v1.0 (funciones core del editor)
Categorías 1 (parcial), 2, 3 (parcial), 4, 5, 6, 7 (formas básicas), 8, 9, 10 (parcial), 14 (parcial), 15 (plugins básicos)
→ **~200 funciones**

### Dejar para v2.0 (integraciones y colaboración)
Categorías 11 (Colaboración), 12 (Nube), integraciones externas completas
→ **~150 funciones**
