<script lang="ts">
  import { hasSelection, selectedIds } from '../stores/selection'
  import { activeGraph } from '../stores/graph'

  const tabs = ['Style', 'Arrange', 'Text'] as const
  let activeTab: typeof tabs[number] = $state('Style')

  // Obtener celda seleccionada actual
  let firstSelectedId = $derived(Array.from($selectedIds)[0] ?? null)
  let selectedCell = $derived.by(() => {
    if (!firstSelectedId || !$activeGraph) return null
    return $activeGraph.getRawGraph().getModel().getCell(firstSelectedId)
  })

  // Propiedades geométricas
  let posX = $derived(selectedCell?.geometry?.x ?? 0)
  let posY = $derived(selectedCell?.geometry?.y ?? 0)
  let posW = $derived(selectedCell?.geometry?.width ?? 120)
  let posH = $derived(selectedCell?.geometry?.height ?? 60)
  let cellText = $derived(selectedCell?.value ?? '')

  function updateX(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, val, posY, posW, posH)
    }
  }

  function updateY(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, posX, val, posW, posH)
    }
  }

  function updateW(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, posX, posY, Math.max(10, val), posH)
    }
  }

  function updateH(val: number) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellGeometry(firstSelectedId, posX, posY, posW, Math.max(10, val))
    }
  }

  function updateText(val: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellValue(firstSelectedId, val)
    }
  }

  function updateColor(color: string) {
    if (firstSelectedId && $activeGraph) {
      $activeGraph.setCellFillColor(firstSelectedId, color)
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
        <p>Selecciona una forma en el lienzo para ver y editar sus propiedades</p>
      </div>
    {:else}
      {#if activeTab === 'Style'}
        <div class="prop-group">
          <div class="prop-label">Color de Relleno</div>
          <div class="color-palette">
            {#each ['#dae8fc', '#d5e8d4', '#ffe6cc', '#f8cecc', '#e1d5e7', '#fff2cc'] as color}
              <button
                class="color-btn"
                style="background-color: {color};"
                title="Cambiar color a {color}"
                onclick={() => updateColor(color)}
              ></button>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'Arrange'}
        <div class="prop-grid">
          <div class="prop-row">
            <label class="prop-label" for="prop-x">X</label>
            <input
              id="prop-x"
              class="prop-input"
              type="number"
              value={posX}
              onchange={(e) => updateX(Number(e.currentTarget.value))}
            />
          </div>
          <div class="prop-row">
            <label class="prop-label" for="prop-y">Y</label>
            <input
              id="prop-y"
              class="prop-input"
              type="number"
              value={posY}
              onchange={(e) => updateY(Number(e.currentTarget.value))}
            />
          </div>
          <div class="prop-row">
            <label class="prop-label" for="prop-w">Ancho</label>
            <input
              id="prop-w"
              class="prop-input"
              type="number"
              value={posW}
              onchange={(e) => updateW(Number(e.currentTarget.value))}
            />
          </div>
          <div class="prop-row">
            <label class="prop-label" for="prop-h">Alto</label>
            <input
              id="prop-h"
              class="prop-input"
              type="number"
              value={posH}
              onchange={(e) => updateH(Number(e.currentTarget.value))}
            />
          </div>
        </div>
      {:else if activeTab === 'Text'}
        <div class="prop-group">
          <label class="prop-label" for="prop-text">Texto de la Forma</label>
          <input
            id="prop-text"
            class="prop-input text-input"
            type="text"
            value={cellText}
            oninput={(e) => updateText(e.currentTarget.value)}
          />
        </div>
      {/if}
    {/if}
  </div>

  <!-- Diagram props (siempre visible) -->
  <div class="diagram-section">
    <div class="section-title">Diagrama</div>
    <div class="diag-info">
      <small>Atajos: <b>Supr/Backspace</b> para borrar, <b>Ctrl+Z</b> deshacer, <b>Ctrl+Y</b> rehacer.</small>
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
  .tab-btn:hover  { color: var(--text-primary); }
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
  .no-sel-icon { font-size: 28px; display: block; margin-bottom: var(--space-2); opacity: 0.4; }

  .prop-group { margin-bottom: var(--space-4); }
  .prop-label {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .color-palette {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .color-btn {
    width: 26px;
    height: 26px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  .color-btn:hover {
    transform: scale(1.15);
  }

  .prop-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }
  .prop-row { display: flex; flex-direction: column; }

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
