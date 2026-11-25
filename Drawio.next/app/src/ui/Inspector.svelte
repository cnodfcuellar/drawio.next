<script lang="ts">
  import { hasSelection, selectedIds } from "../stores/selection";
  import { activeGraph, graphRevision, pendingConnectSource } from "../stores/graph";
  import ColorPicker from "./ColorPicker.svelte";

  const tabs = ["Style", "Arrange", "Text"] as const;
  let activeTab: (typeof tabs)[number] = $state("Style");

  // Obtener celda seleccionada actual
  let firstSelectedId = $derived(Array.from($selectedIds)[0] ?? null);
  let selCount = $derived($selectedIds.size);
  let _rev = $derived($graphRevision);

  let selectedCell = $derived.by(() => {
    void _rev;
    if (!firstSelectedId || !$activeGraph) return null;
    return $activeGraph.getRawGraph().getModel().getCell(firstSelectedId);
  });

  // Determinar si es una arista / conector o un vértice / bloque
  let isEdge = $derived.by(() => {
    void _rev;
    if (!selectedCell || !$activeGraph) return false;
    return Boolean(selectedCell.edge || $activeGraph.isCellEdge(firstSelectedId!));
  });

  // Propiedades geométricas (para vértices)
  let posX = $derived.by(() => {
    void _rev;
    return selectedCell?.geometry?.x ?? 0;
  });
  let posY = $derived.by(() => {
    void _rev;
    return selectedCell?.geometry?.y ?? 0;
  });
  let posW = $derived.by(() => {
    void _rev;
    return selectedCell?.geometry?.width ?? 120;
  });
  let posH = $derived.by(() => {
    void _rev;
    return selectedCell?.geometry?.height ?? 60;
  });
  let cellText = $derived.by(() => {
    void _rev;
    return selectedCell?.value ?? "";
  });

  // Estilos actuales
  let currentStyleStr = $derived.by(() => {
    void _rev;
    if (!selectedCell || !$activeGraph) return "";
    return $activeGraph.getRawGraph().getModel().getStyle(selectedCell) || "";
  });

  function getStyle(key: string, def = ""): string {
    const match = currentStyleStr.match(new RegExp(`(?:^|;)${key}=([^;]*)`));
    return match ? match[1] : def;
  }

  let fillColor = $derived(getStyle("fillColor", "#dae8fc"));
  let strokeColor = $derived(getStyle("strokeColor", "#6c8ebf"));
  let strokeWidth = $derived(Number(getStyle("strokeWidth", "1")) || 1);
  let isDashed = $derived(getStyle("dashed") === "1");
  let isRounded = $derived(getStyle("rounded") === "1");
  let isShadow = $derived(getStyle("shadow") === "1");
  let opacity = $derived(Number(getStyle("opacity", "100")) || 100);
  let fontSize = $derived(Number(getStyle("fontSize", "12")) || 12);
  let textAlign = $derived(getStyle("align", "center"));
  let fontColor = $derived(getStyle("fontColor", "#000000"));
  let fontStyleVal = $derived(Number(getStyle("fontStyle", "0")) || 0);
  let isBold = $derived((fontStyleVal & 1) === 1);
  let isItalic = $derived((fontStyleVal & 2) === 2);

  // Estilos específicos de aristas
  let edgeStyleVal = $derived(getStyle("edgeStyle", "orthogonalEdgeStyle"));
  let isCurved = $derived(getStyle("curved", "0") === "1");
  let currentRouting = $derived.by(() => {
    if (edgeStyleVal === "none") return "straight";
    if (edgeStyleVal === "entityRelationEdgeStyle") return "entityRelation";
    if (isCurved) return "curved";
    return "orthogonal";
  });

  let startArrow = $derived(getStyle("startArrow", "none"));
  let endArrow = $derived(getStyle("endArrow", "classic"));

  // Nombres de nodos conectados (si es arista)
  let sourceNodeLabel = $derived.by(() => {
    void _rev;
    return selectedCell?.source?.value || (selectedCell?.source ? `ID ${selectedCell.source.id}` : "Desconectado");
  });
  let targetNodeLabel = $derived.by(() => {
    void _rev;
    return selectedCell?.target?.value || (selectedCell?.target ? `ID ${selectedCell.target.id}` : "Desconectado");
  });

  function updateX(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, val, posY, posW, posH);
    }
  }

  function updateY(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, posX, val, posW, posH);
    }
  }

  function updateW(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, posX, posY, Math.max(10, val), posH);
    }
  }

  function updateH(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, posX, posY, posW, Math.max(10, val));
    }
  }

  function updateText(val: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellValue(firstSelectedId, val);
    }
  }

  function updateFillColor(color: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellFillColor(firstSelectedId, color);
    }
  }

  function updateStrokeColor(color: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellStrokeColor(firstSelectedId, color);
    }
  }

  function updateStrokeWidth(width: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellStrokeWidth(firstSelectedId, width);
    }
  }

  function toggleDashed() {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellDashed(firstSelectedId, !isDashed);
    }
  }

  function toggleRounded() {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellRounded(firstSelectedId, !isRounded);
    }
  }

  function toggleShadow() {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellShadow(firstSelectedId, !isShadow);
    }
  }

  function updateOpacity(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellOpacity(firstSelectedId, val);
    }
  }

  function updateRotation(angle: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellRotation(firstSelectedId, angle);
    }
  }

  function updateFontSize(size: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellFontSize(firstSelectedId, size);
    }
  }

  function updateFontColor(color: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellFontColor(firstSelectedId, color);
    }
  }

  function updateAlign(align: "left" | "center" | "right") {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellAlign(firstSelectedId, align);
    }
  }

  function toggleBold() {
    if (firstSelectedId && $activeGraph) {
      const next = isBold ? (fontStyleVal & ~1) : (fontStyleVal | 1);
      $activeGraph.setCellFontStyle(firstSelectedId, next);
    }
  }

  function toggleItalic() {
    if (firstSelectedId && $activeGraph) {
      const next = isItalic ? (fontStyleVal & ~2) : (fontStyleVal | 2);
      $activeGraph.setCellFontStyle(firstSelectedId, next);
    }
  }

  function updateRouting(routing: "straight" | "orthogonal" | "curved" | "entityRelation") {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setEdgeRouting(firstSelectedId, routing);
    }
  }

  function updateArrow(pos: "start" | "end", arrow: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setEdgeArrow(firstSelectedId, pos, arrow);
    }
  }

  function bringToFront() {
    if ($activeGraph) $activeGraph.bringToFront();
  }

  function sendToBack() {
    if ($activeGraph) $activeGraph.sendToBack();
  }

  function handleGroup() {
    if ($activeGraph) $activeGraph.groupSelected();
  }

  function handleUngroup() {
    if ($activeGraph) $activeGraph.ungroupSelected();
  }

  function handleAlignSelected(align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    if ($activeGraph) $activeGraph.alignSelected(align);
  }

  function handleDistributeSelected(direction: 'horizontal' | 'vertical') {
    if ($activeGraph) $activeGraph.distributeSelected(direction);
  }

  function handleConnectSelected() {
    if ($activeGraph) {
      $activeGraph.connectSelected();
    }
  }

  // Estado y lógica para enlazar nodo seleccionado con otro nodo
  let isPendingThisNode = $derived(
    Boolean(firstSelectedId && $pendingConnectSource === firstSelectedId)
  );

  let otherVertices = $derived.by(() => {
    void _rev;
    if (!$activeGraph || !firstSelectedId) return [];
    return $activeGraph.getAllVertices().filter((v) => v.id !== firstSelectedId);
  });

  function handleStartConnect() {
    if (!firstSelectedId || !$activeGraph) return;
    if (isPendingThisNode) {
      $activeGraph.cancelInteractiveConnect();
    } else {
      $activeGraph.startInteractiveConnect(firstSelectedId);
    }
  }

  function handleDirectConnect(targetId: string) {
    if (!firstSelectedId || !targetId || !$activeGraph) return;
    $activeGraph.addEdge(firstSelectedId, targetId);
    $activeGraph.cancelInteractiveConnect();
  }
</script>

<aside class="inspector" data-testid="inspector">
  <!-- Pestañas Superiores -->
  <div class="tabs-header">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab}
        onclick={() => (activeTab = tab)}
        data-testid={`tab-${tab.toLowerCase()}`}
      >
        {tab}
      </button>
    {/each}
  </div>

  <div class="tab-content">
    {#if selCount >= 2}
      <!-- Botón de acción rápida para selección múltiple -->
      <div class="multi-select-box">
        <div class="multi-title">{selCount} elementos seleccionados</div>
        <div class="btn-group" style="margin-bottom: var(--space-2); width: 100%;">
          <button class="choice-btn" onclick={handleGroup} title="Agrupar formas (Ctrl+G)">⛶ Agrupar</button>
          <button class="choice-btn" onclick={() => $activeGraph?.duplicateSelected()} title="Duplicar selección (Ctrl+D)">⧉ Duplicar</button>
        </div>
        <button class="action-btn-primary" onclick={handleConnectSelected} title="Crea una arista conectando los dos primeros nodos">
          🔗 Enlazar Nodos con Flecha
        </button>
      </div>
    {/if}

    {#if !$hasSelection}
      <div class="no-selection">
        <span class="no-sel-icon">👆</span>
        <p>Selecciona una forma o conector para ver y editar sus propiedades.</p>
      </div>
    {:else}
      {#if activeTab === "Style"}

        {#if isEdge}
          <!-- PROPIEDADES DE CONECTOR / FLECHA -->
          <div class="prop-group">
            <div class="prop-label">Enrutamiento de Línea</div>
            <div class="routing-grid">
              <button
                class="choice-btn"
                class:active={currentRouting === "orthogonal"}
                onclick={() => updateRouting("orthogonal")}
                title="Ángulos rectos"
              >
                ⌞⌟ Ortogonal
              </button>
              <button
                class="choice-btn"
                class:active={currentRouting === "curved"}
                onclick={() => updateRouting("curved")}
                title="Curva suave"
              >
                ∿ Curvo
              </button>
              <button
                class="choice-btn"
                class:active={currentRouting === "straight"}
                onclick={() => updateRouting("straight")}
                title="Línea recta directa"
              >
                ╱ Recto
              </button>
              <button
                class="choice-btn"
                class:active={currentRouting === "entityRelation"}
                onclick={() => updateRouting("entityRelation")}
                title="Relación de entidad"
              >
                ⑂ E-R
              </button>
            </div>
          </div>

          <!-- Puntas de Flecha -->
          <div class="prop-group">
            <div class="prop-label">Punta Inicial</div>
            <div class="btn-group">
              {#each [
                { id: "none", label: "— Ninguna" },
                { id: "classic", label: "◀ Flecha" },
                { id: "oval", label: "● Círculo" },
                { id: "diamond", label: "◆ Diamante" }
              ] as arr}
                <button
                  class="choice-btn"
                  class:active={startArrow === arr.id}
                  onclick={() => updateArrow("start", arr.id)}
                >
                  {arr.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="prop-group">
            <div class="prop-label">Punta Final</div>
            <div class="btn-group">
              {#each [
                { id: "classic", label: "▶ Flecha" },
                { id: "block", label: "▶ Bloque" },
                { id: "open", label: "▷ Abierta" },
                { id: "oval", label: "● Círculo" },
                { id: "none", label: "— Ninguna" }
              ] as arr}
                <button
                  class="choice-btn"
                  class:active={endArrow === arr.id}
                  onclick={() => updateArrow("end", arr.id)}
                >
                  {arr.label}
                </button>
              {/each}
            </div>
          </div>

        {:else}
          <!-- ENLACES Y CONEXIÓN RÁPIDA DE FORMA A FORMA -->
          <div class="prop-group connect-card">
            <div class="prop-label">⚡ Enlazar con otra Forma</div>
            <button
              class="choice-btn connect-btn"
              class:active={isPendingThisNode}
              onclick={handleStartConnect}
              title="Haz clic para seleccionar el nodo destino en el canvas (o pulsa Esc)"
            >
              {#if isPendingThisNode}
                🎯 Haz clic en el bloque destino en el lienzo...
              {:else}
                🔗 Conectar a otra forma...
              {/if}
            </button>

            {#if otherVertices.length > 0}
              <div class="quick-connect-row">
                <span class="prop-label-sub">O enlazar directamente con:</span>
                <select
                  class="prop-select"
                  value=""
                  onchange={(e) => handleDirectConnect(e.currentTarget.value)}
                >
                  <option value="" disabled selected>Selecciona bloque destino...</option>
                  {#each otherVertices as v}
                    <option value={v.id}>{v.label}</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>

          <!-- PROPIEDADES DE NODO / FORMA: Color de Relleno -->
          <ColorPicker
            label="Color de Relleno"
            color={fillColor}
            onChange={updateFillColor}
            allowNone={true}
          />
        {/if}

        <!-- Color de Trazo / Borde (Compartido para Nodos y Aristas) -->
        <ColorPicker
          label={isEdge ? "Color del Conector" : "Color de Borde"}
          color={strokeColor}
          onChange={updateStrokeColor}
          allowNone={true}
        />

        <!-- Grosor de Trazo -->
        <div class="prop-group">
          <div class="prop-label">Grosor de Línea</div>
          <div class="btn-group">
            {#each [1, 2, 3, 4] as w}
              <button
                class="choice-btn"
                class:active={strokeWidth === w}
                onclick={() => updateStrokeWidth(w)}
              >
                {w}px
              </button>
            {/each}
          </div>
        </div>

        <!-- Efectos de Línea -->
        <div class="prop-group">
          <div class="prop-label">Efectos</div>
          <div class="btn-group">
            <button
              class="choice-btn"
              class:active={isDashed}
              onclick={toggleDashed}
            >
              Línea Discontinua
            </button>
            {#if !isEdge}
              <button
                class="choice-btn"
                class:active={isRounded}
                onclick={toggleRounded}
              >
                Redondeado
              </button>
              <button
                class="choice-btn"
                class:active={isShadow}
                onclick={toggleShadow}
              >
                Sombra
              </button>
            {/if}
          </div>
        </div>

        <!-- Opacidad -->
        <div class="prop-group">
          <div class="slider-row">
            <span class="prop-label">Opacidad</span>
            <span class="slider-val">{opacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={opacity}
            class="prop-range"
            oninput={(e) => updateOpacity(Number(e.currentTarget.value))}
          />
        </div>

      {:else if activeTab === "Arrange"}
        {#if isEdge}
          <!-- Información del enlace de aristas -->
          <div class="prop-group">
            <div class="prop-label">Nodos Vinculados</div>
            <div class="edge-link-info">
              <div class="link-item">
                <span class="link-tag">Origen:</span>
                <span class="link-label">{sourceNodeLabel}</span>
              </div>
              <div class="link-arrow">➔</div>
              <div class="link-item">
                <span class="link-tag">Destino:</span>
                <span class="link-label">{targetNodeLabel}</span>
              </div>
            </div>
          </div>
        {:else}
          <!-- Posición y Dimensiones para formas -->
          <div class="prop-group">
            <div class="prop-label">Geometría</div>
            <div class="prop-grid">
              <div class="prop-row">
                <label class="prop-label-sub" for="prop-x">X</label>
                <input
                  id="prop-x"
                  class="prop-input"
                  type="number"
                  value={posX}
                  onchange={(e) => updateX(Number(e.currentTarget.value))}
                />
              </div>
              <div class="prop-row">
                <label class="prop-label-sub" for="prop-y">Y</label>
                <input
                  id="prop-y"
                  class="prop-input"
                  type="number"
                  value={posY}
                  onchange={(e) => updateY(Number(e.currentTarget.value))}
                />
              </div>
              <div class="prop-row">
                <label class="prop-label-sub" for="prop-w">Ancho</label>
                <input
                  id="prop-w"
                  class="prop-input"
                  type="number"
                  value={posW}
                  onchange={(e) => updateW(Number(e.currentTarget.value))}
                />
              </div>
              <div class="prop-row">
                <label class="prop-label-sub" for="prop-h">Alto</label>
                <input
                  id="prop-h"
                  class="prop-input"
                  type="number"
                  value={posH}
                  onchange={(e) => updateH(Number(e.currentTarget.value))}
                />
              </div>
            </div>
          </div>

          <!-- Rotación de Forma -->
          <div class="prop-group">
            <div class="prop-label">Rotación</div>
            <div class="btn-group">
              {#each [0, 90, 180, 270] as angle}
                <button class="choice-btn" onclick={() => updateRotation(angle)}>
                  {angle}°
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Orden de Capas (Z-Index) -->
        <div class="prop-group">
          <div class="prop-label">Orden de Capas</div>
          <div class="btn-group">
            <button
              class="choice-btn"
              onclick={bringToFront}
              title="Traer al frente"
            >
              ▲ Traer al frente
            </button>
            <button
              class="choice-btn"
              onclick={sendToBack}
              title="Enviar al fondo"
            >
              ▼ Enviar al fondo
            </button>
          </div>
        </div>

        <!-- Agrupación -->
        <div class="prop-group">
          <div class="prop-label">Agrupación</div>
          <div class="btn-group">
            <button
              class="choice-btn"
              disabled={selCount < 2}
              onclick={handleGroup}
              title="Agrupar formas seleccionadas (Ctrl+G)"
            >
              ⛶ Agrupar
            </button>
            <button
              class="choice-btn"
              onclick={handleUngroup}
              title="Desagrupar contenedor o formas (Ctrl+Shift+U)"
            >
              ⛿ Desagrupar
            </button>
          </div>
        </div>

        {#if selCount >= 2}
          <!-- Alineación de Formas -->
          <div class="prop-group">
            <div class="prop-label">Alineación Horizontal</div>
            <div class="btn-group">
              <button class="choice-btn" onclick={() => handleAlignSelected('left')} title="Alinear a la izquierda">
                |⬅ Izq
              </button>
              <button class="choice-btn" onclick={() => handleAlignSelected('center')} title="Centrar horizontalmente">
                ⬌ Centro
              </button>
              <button class="choice-btn" onclick={() => handleAlignSelected('right')} title="Alinear a la derecha">
                Der ➡|
              </button>
            </div>
          </div>

          <div class="prop-group">
            <div class="prop-label">Alineación Vertical</div>
            <div class="btn-group">
              <button class="choice-btn" onclick={() => handleAlignSelected('top')} title="Alinear arriba">
                ⬆ Arriba
              </button>
              <button class="choice-btn" onclick={() => handleAlignSelected('middle')} title="Centrar verticalmente">
                ↕ Medio
              </button>
              <button class="choice-btn" onclick={() => handleAlignSelected('bottom')} title="Alinear abajo">
                ⬇ Abajo
              </button>
            </div>
          </div>
        {/if}

        {#if selCount >= 3}
          <!-- Distribución Uniforme -->
          <div class="prop-group">
            <div class="prop-label">Distribución Uniforme</div>
            <div class="btn-group">
              <button class="choice-btn" onclick={() => handleDistributeSelected('horizontal')} title="Distribuir horizontalmente con espaciado idéntico">
                ⇋ Horizontal
              </button>
              <button class="choice-btn" onclick={() => handleDistributeSelected('vertical')} title="Distribuir verticalmente con espaciado idéntico">
                ⇅ Vertical
              </button>
            </div>
          </div>
        {/if}

      {:else if activeTab === "Text"}
        <!-- Texto de la Forma o Conector -->
        <div class="prop-group">
          <label class="prop-label" for="prop-text">{isEdge ? "Etiqueta del Conector" : "Texto de la Forma"}</label>
          <input
            id="prop-text"
            class="prop-input"
            type="text"
            placeholder={isEdge ? "Ej: Paso 1, Sí, No..." : "Escribe una etiqueta..."}
            value={cellText}
            oninput={(e) => updateText(e.currentTarget.value)}
          />
        </div>

        <!-- Estilos de Fuente (Negrita / Cursiva) -->
        <div class="prop-group">
          <div class="prop-label">Estilo Tipográfico</div>
          <div class="btn-group">
            <button
              class="choice-btn"
              class:active={isBold}
              onclick={toggleBold}
              title="Negrita (Ctrl+B)"
              style="font-weight: bold;"
            >
              <b>B</b> Negrita
            </button>
            <button
              class="choice-btn"
              class:active={isItalic}
              onclick={toggleItalic}
              title="Cursiva (Ctrl+I)"
              style="font-style: italic;"
            >
              <i>I</i> Cursiva
            </button>
          </div>
        </div>

        <!-- Tamaño de Fuente -->
        <div class="prop-group">
          <div class="prop-label">Tamaño de Fuente</div>
          <div class="btn-group">
            {#each [11, 12, 14, 16, 20] as sz}
              <button
                class="choice-btn"
                class:active={fontSize === sz}
                onclick={() => updateFontSize(sz)}
              >
                {sz}px
              </button>
            {/each}
          </div>
        </div>

        <!-- Alineación -->
        <div class="prop-group">
          <div class="prop-label">Alineación Horizontal</div>
          <div class="btn-group">
            <button
              class="choice-btn"
              class:active={textAlign === "left"}
              onclick={() => updateAlign("left")}
            >
              ⬅ Izq
            </button>
            <button
              class="choice-btn"
              class:active={textAlign === "center"}
              onclick={() => updateAlign("center")}
            >
              ⬌ Centro
            </button>
            <button
              class="choice-btn"
              class:active={textAlign === "right"}
              onclick={() => updateAlign("right")}
            >
              Der ➡
            </button>
          </div>
        </div>

        <!-- Color de Fuente -->
        <ColorPicker
          label="Color de Texto"
          color={fontColor}
          onChange={updateFontColor}
          allowNone={false}
        />
      {/if}
    {/if}
  </div>

  <div class="diagram-section">
    <div class="section-title">Diagrama</div>
    <div class="diag-info">
      <small>Atajos: <b>Supr</b> borrar, <b>Ctrl+Z/Y</b> deshacer/rehacer, <b>C</b> conector, <b>Alt+arrastre</b> enlazar.</small>
    </div>
  </div>
</aside>

<style>
  .inspector {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary);
    border-left: var(--border-w) solid var(--border);
    user-select: none;
    overflow: hidden;
  }

  .tabs-header {
    display: flex;
    border-bottom: var(--border-w) solid var(--border);
    background: var(--bg-primary);
  }

  .tab-btn {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    background: var(--bg-secondary);
  }

  .tab-content {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    overflow-y: auto;
  }

  .no-selection {
    text-align: center;
    color: var(--text-disabled);
    padding: var(--space-8) 0;
  }
  .no-sel-icon {
    font-size: 28px;
    display: block;
    margin-bottom: var(--space-2);
    opacity: 0.4;
  }

  .multi-select-box {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .multi-title {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
    font-weight: var(--font-bold);
  }
  .action-btn-primary {
    width: 100%;
    padding: var(--space-2);
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    color: #ffffff;
    font-weight: var(--font-medium);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .action-btn-primary:hover {
    background: var(--accent-hover);
  }

  .prop-group {
    margin-bottom: var(--space-4);
  }
  .prop-label {
    display: block;
    font-size: 11px;
    font-weight: var(--font-bold);
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .prop-label-sub {
    font-size: 10px;
    color: var(--text-secondary);
    margin-bottom: 2px;
  }


  /* Botones de opción / Choice */
  .btn-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  .routing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }
  .choice-btn {
    flex: 1;
    min-width: 50px;
    padding: var(--space-1) var(--space-2);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-xs);
    cursor: pointer;
    text-align: center;
    transition: all var(--t-fast);
  }
  .choice-btn:hover {
    background: var(--bg-hover);
  }
  .choice-btn.active {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }

  /* Sliders y Rangos */
  .slider-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-1);
  }
  .slider-val {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--text-primary);
  }
  .prop-range {
    width: 100%;
    accent-color: var(--accent);
    cursor: pointer;
  }

  /* Cuadrícula de Geometría */
  .prop-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }
  .prop-row {
    display: flex;
    flex-direction: column;
  }

  .prop-input {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-base);
    width: 100%;
  }
  .prop-input:focus {
    outline: 1px solid var(--accent);
    border-color: var(--accent);
  }

  /* Info de enlaces de arista */
  .edge-link-info {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: center;
  }
  .link-item {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    width: 100%;
  }
  .link-tag {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    font-weight: var(--font-bold);
    min-width: 55px;
  }
  .link-label {
    font-size: var(--text-sm);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-arrow {
    font-size: 14px;
    color: var(--accent);
  }

  /* Sección Inferior */
  .diagram-section {
    padding: var(--space-3) var(--space-4);
    border-top: var(--border-w) solid var(--border);
    background: var(--bg-primary);
  }
  .section-title {
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: var(--space-1);
  }
  /* Tarjeta de enlace y conexión de formas */
  .connect-card {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    margin-bottom: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .connect-btn {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    font-weight: var(--font-medium);
    justify-content: center;
    border-color: var(--accent);
    color: var(--accent);
  }
  .connect-btn.active {
    background: var(--accent);
    color: #ffffff;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  .quick-connect-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-top: var(--space-1);
  }
  .prop-select {
    width: 100%;
    height: 30px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-xs);
    padding: 0 var(--space-2);
    outline: none;
    cursor: pointer;
  }
  .prop-select:focus {
    border-color: var(--accent);
  }

  .diag-info {
    font-size: var(--text-xs);
    color: var(--text-disabled);
    line-height: 1.4;
  }
</style>