# Diagnóstico e Informe Global del Proyecto: draw.io (diagrams.net)

Este informe presenta la radiografía completa del proyecto analizado a nivel de estructura de directorios, volumen de código, dependencias, backend, frontend y capacidades del entorno de ejecución local.

---

## 1. Métricas Generales del Repositorio

- **Rama actual:** `dev` (sincronizada con `origin/dev`).
- **Archivos totales analizados:** Más de 3,400 archivos entre código fuente, stencils, templates y recursos gráficos.
- **Líneas de código JavaScript estimadas:** > 120,000 líneas distribuidas en 3 módulos cliente.
- **Líneas de código Java estimadas:** ~15,000 líneas en Servlets y utilidades de backend.
- **Assets vectoriales / Stencils XML:** 204 archivos de stencils técnicos y 312 plantillas de diagramas prediseñadas.

---

## 2. Radiografía de Módulos del Proyecto

### 2.1. Frontend (`src/main/webapp/`)
El cliente es una Single Page Application (SPA) basada en Vanilla JavaScript (ES5/ES6) y SVG nativo:

1. **`src/main/webapp/mxgraph/` (Motor Matemático Core)**
   - Implementación pura del grafo (`mxGraph`, `mxGraphModel`, `mxCell`, `mxGraphView`).
   - Gestión de layouts automáticos (`mxHierarchicalLayout`, `mxCompactTreeLayout`).
   - Manipuladores de mouse y conexiones (`mxConnectionHandler`, `mxGraphHandler`).
   - Renderizador SVG vectorial `mxSvgCanvas2D`.

2. **`src/main/webapp/js/grapheditor/` (Editor Base)**
   - `Editor.js`: Estado del diagrama, control de modificaciones (`isModified`) e historial (`mxUndoManager`).
   - `EditorUi.js`: Ensamblaje físico del DOM (layout, header, menús, barras de herramientas).
   - `Sidebar.js`: Paleta izquierda de figuras con renderizado en grafo oculto en RAM (`createTemporaryGraph`).
   - `Format.js`: Inspector derecho reactivo de estilos, texto y orden.

3. **`src/main/webapp/js/diagramly/` (Plataforma draw.io Completa)**
   - `App.js`: Orquestador principal, temas visuales, control de diálogos y ciclo de vida de la aplicación.
   - `DrawioFile.js` & `DrawioFileSync.js`: Abstracción de archivo unificada con motor 3-Way Merge y copia base en `shadowPages`.
   - Clientes de Almacenamiento Nube: `DriveClient`, `GitHubClient`, `GitLabClient`, `OneDriveClient`, `DropboxClient`, `TrelloClient` y `LocalFile` (File System Access API).
   - `vsdx/importer.js`: Parser descompresor nativo de archivos Microsoft Visio OOXML (.vsdx).

4. **`src/main/webapp/plugins/` (Ecosistema de Extensiones)**
   - 22 plugins integrados listos para uso: animaciones (`animation.js`), anonimización (`anonymize.js`), layouts WebCola (`webcola`), conexión SQL (`sql.js`), integración Nextcloud (`nextcloud.js`), etiquetas avanzadas (`tags.js`), replay paso a paso (`replay.js`), etc.

5. **`src/main/webapp/stencils/`, `shapes/` y `templates/`**
   - Catálogo exhaustivo de figuras: AWS, Azure, GCP, Cisco, Kubernetes, IBM Cloud, BPMN, UML, Redes, etc.

---

### 2.2. Backend Java (`src/main/java/com/mxgraph/online/`)
Diseñado con arquitectura **Stateless** (sin base de datos, sin retención de sesión):
- **`AbsAuth.java` y derivados (`GitHubAuthServlet`, `GoogleAuthServlet`, `DropboxAuthServlet`, etc.):** Canje de códigos temporales de OAuth 2.0 por Access Tokens protegiendo las credenciales secretas (`client_secret`).
- **`ProxyServlet.java` (`/proxy`):** Pasarela de elusión de restricciones CORS para descargar imágenes y recursos ajenos con protección activa contra SSRF (`Utils.sanitizeUrl`).
- **`ExportProxyServlet.java` (`/export`):** Inyección de cabecera `Content-Disposition: attachment` para descargas binarias forzadas (PNG, PDF).
- **`ConverterServlet.java` y `LogServlet.java`:** Conversores de formatos antiguos y receptor de telemetría de errores del navegador.

---

### 2.3. Herramientas de Compilación (`etc/`)
- **`etc/build/build.xml`**: Script de Apache Ant para empaquetado y minificación con Google Closure Compiler (`compiler.jar`).
- **`etc/imageResize/`**: Script Node.js para procesamiento y optimización de imágenes.
- **`etc/propgen/`**: Generador y sincronizador de archivos de propiedades de idioma (i18n).

---

## 3. Estado del Entorno del Sistema Local

- **Node.js:** Instalado (`v22.14.0`).
- **npm:** Instalado (`10.9.2`).
- **Java Runtime (JRE):** Instalado (`Java 1.8.0_431` de 64-bit).
- **Compilador Java (javac):** No disponible en el PATH del sistema.
- **Herramientas de Build Java (ant, mvn, gradle):** No disponibles en el PATH del sistema.
- **Conclusión de Ejecución Local:**
  - El **Frontend** y todas las herramientas JavaScript pueden ejecutarse y servirse inmediatamente con **Node.js** (mediante Vite, Express, HTTP-server o Next.js).
  - El backend Java requiere un JDK y Maven/Ant para recompilarse desde cero; no obstante, el frontend puede ejecutarse en modo autónomo (`?dev=1` o `?offline=1`) o conectarse a proxies locales ligeros en Node.js.

---

## 4. Estructura de Documentación Existente (`Drawio.next/doc/`)
En pasos anteriores ya estructuramos la documentación completa en Markdown y sus 10 diagramas SVG vectoriales asociados en:
- `Drawio.next/doc/arquitectura_drawio.md`
- `Drawio.next/doc/img/*.svg` (los 4 pilares, secuencia de arranque, 3-way merge, jerarquía de clases, matriz de métodos y pasarela backend).
