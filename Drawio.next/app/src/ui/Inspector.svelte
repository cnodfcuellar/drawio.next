<script lang="ts">
  import { hasSelection, selectedIds } from "../stores/selection";
  import { activeGraph, graphRevision } from "../stores/graph";

  const tabs = ["Style", "Arrange", "Text"] as const;
  let activeTab: (typeof tabs)[number] = $state("Style");

  // Obtener celda seleccionada actual
  let firstSelectedId = $derived(Array.from($selectedIds)[0] ?? null);
  let _rev = $derived($graphRevision);
  let selectedCell = $derived.by(() => {
    void _rev;
    if (!firstSelectedId || !$activeGraph) return null;
    return $activeGraph.getRawGraph().getModel().getCell(firstSelectedId);
  });

  // Propiedades geométricas
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

  let strokeColor = $derived(getStyle("strokeColor", "#6c8ebf"));
  let strokeWidth = $derived(Number(getStyle("strokeWidth", "1")) || 1);
  let isDashed = $derived(getStyle("dashed") === "1");
  let isRounded = $derived(getStyle("rounded") === "1");
  let isShadow = $derived(getStyle("shadow") === "1");
  let opacity = $derived(Number(getStyle("opacity", "100")) || 100);
  let fontSize = $derived(Number(getStyle("fontSize", "12")) || 12);
  let textAlign = $derived(getStyle("align", "center"));

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
      $activeGraph.setCellGeometry(
        firstSelectedId,
        posX,
        posY,
        Math.max(10, val),
        posH,
      );
    }
  }

  function updateH(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(
        firstSelectedId,
        posX,
        posY,
        posW,
        Math.max(10, val),
      );
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

  function bringToFront() {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.bringToFront(firstSelectedId);
    }
  }

  function sendToBack() {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.sendToBack(firstSelectedId);
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
</script>

<aside class="inspector" data-testid="inspector">
  <!-- Tabs -->
  <div class="tab-bar">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab}
        onclick={() => (activeTab = tab)}
        data-testid="inspector-tab-{tab.toLowerCase()}"
      >
        {tab}
      </button>
    {/each}
  </div>

  <!-- Contenido -->
  <div class="tab-content">
    {#if !$hasSelection}
      <div class="no-selection">
        <span class="no-sel-icon">⬚</span>
        <p>
          Selecciona una forma en el lienzo para ver y editar sus propiedades
        </p>
      </div>
    {:else}
      {#if activeTab === "Style"}
        <!-- Relleno -->
        <div class="prop-group">
          <div class="prop-label">Color de Relleno</div>
          <div class="color-palette">
            {#each ["#dae8fc", "#d5e8d4", "#ffe6cc", "#f8cecc", "#e1d5e7", "#fff2cc", "#ffffff", "none"] as color}
              <button
                class="color-btn"
                class:none-color={color === "none"}
                style="background-color: {color === 'none'
                  ? 'transparent'
                  : color};"
                title={color === "none" ? "Sin relleno" : `Color ${color}`}
                onclick={() => updateFillColor(color)}
              >
                {#if color === "none"}⊘{/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Borde / Trazo -->
        <div class="prop-group">
          <div class="prop-label">Color de Borde</div>
          <div class="color-palette">
            {#each ["#6c8ebf", "#82b366", "#d79b00", "#b85450", "#9673a6", "#000000", "#ffffff", "none"] as color}
              <button
                class="color-btn"
                class:active-color={strokeColor === color}
                class:none-color={color === "none"}
                style="background-color: {color === 'none'
                  ? 'transparent'
                  : color};"
                title={color === "none" ? "Sin borde" : `Borde ${color}`}
                onclick={() => updateStrokeColor(color)}
              >
                {#if color === "none"}⊘{/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Grosor y Estilo de Trazo -->
        <div class="prop-group">
          <div class="prop-label">Grosor de Trazo</div>
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

        <!-- Efectos de Borde -->
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
        <!-- Posición y Dimensiones -->
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

        <!-- Orden de Capas (Z-Index) -->
        <div class="prop-group">
          <div class="prop-label">Orden de Capas</div>
          <div class="btn-group">
            <button
              class="choice-btn"
              onclick={bringToFront}
              title="Traer forma al frente"
            >
              ▲ Traer al frente
            </button>
            <button
              class="choice-btn"
              onclick={sendToBack}
              title="Enviar forma al fondo"
            >
              ▼ Enviar al fondo
            </button>
          </div>
        </div>

        <!-- Rotación Rápida -->
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
      {:else if activeTab === "Text"}
        <!-- Texto de la Forma -->
        <div class="prop-group">
          <label class="prop-label" for="prop-text">Contenido de Texto</label>
          <input
            id="prop-text"
            class="prop-input text-input"
            type="text"
            value={cellText}
            oninput={(e) => updateText(e.currentTarget.value)}
          />
        </div>

        <!-- Tamaño de Fuente -->
        <div class="prop-group">
          <div class="prop-label">Tamaño de Fuente</div>
          <div class="btn-group">
            {#each [11, 12, 14, 16, 20, 24] as sz}
              <button
                class="choice-btn"
                class:active={fontSize === sz}
                onclick={() => updateFontSize(sz)}
              >
                {sz}
              </button>
            {/each}
          </div>
        </div>

        <!-- Alineación -->
        <div class="prop-group">
          <div class="prop-label">Alineación</div>
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
        <div class="prop-group">
          <div class="prop-label">Color de Texto</div>
          <div class="color-palette">
            {#each ["#000000", "#ffffff", "#333333", "#0078d4", "#d83b01", "#107c41"] as color}
              <button
                class="color-btn"
                style="background-color: {color};"
                title="Color de texto {color}"
                onclick={() => updateFontColor(color)}
              ></button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Diagram props (siempre visible) -->
  <div class="diagram-section">
    <div class="section-title">Diagrama</div>
    <div class="diag-info">
      <small
        >Atajos: <b>Supr/Backspace</b> para borrar, <b>Ctrl+Z</b> deshacer,
        <b>Ctrl+Y</b> rehacer.</small
      >
    </div>
  </div>
</aside>

<style>
  .inspector {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: var(--text-base);
  }

  .tab-bar {
    display: flex;
    border-bottom: var(--border-w) solid var(--border);
    background: var(--bg-secondary);
  }

  .tab-btn {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .tab-btn:hover {
    color: var(--text-primary);
  }
  .tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    background: var(--bg-primary);
  }

  .tab-content {
    flex: 1;
    padding: var(--space-4);
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

  .prop-group {
    margin-bottom: var(--space-4);
  }
  .prop-label {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: var(--font-medium);
  }
  .prop-label-sub {
    font-size: 10px;
    color: var(--text-disabled);
    margin-bottom: 2px;
  }

  .color-palette {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .color-btn {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    cursor: pointer;
    transition:
      transform 0.1s ease,
      border-color 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--text-secondary);
  }
  .color-btn:hover {
    transform: scale(1.15);
    border-color: var(--text-primary);
  }
  .color-btn.active-color {
    border: 2px solid var(--accent);
    transform: scale(1.1);
  }
  .color-btn.none-color {
    border: 1px dashed var(--border-light);
  }

  .btn-group {
    display: flex;
    gap: var(--space-1);
    flex-wrap: wrap;
  }

  .choice-btn {
    flex: 1;
    min-width: 44px;
    padding: var(--space-1) var(--space-2);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 11px;
    cursor: pointer;
    transition: all var(--t-fast);
    text-align: center;
  }
  .choice-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  .choice-btn.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .slider-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-1);
  }
  .slider-val {
    font-size: 11px;
    color: var(--text-primary);
    font-family: var(--font-mono);
  }
  .prop-range {
    width: 100%;
    accent-color: var(--accent);
    cursor: pointer;
  }

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
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
    width: 100%;
  }
  .prop-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .diagram-section {
    border-top: var(--border-w) solid var(--border);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-secondary);
  }
  .section-title {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--space-2);
  }

  .diag-info small {
    color: var(--text-secondary);
    font-size: 11px;
    line-height: 1.4;
  }
</style>
