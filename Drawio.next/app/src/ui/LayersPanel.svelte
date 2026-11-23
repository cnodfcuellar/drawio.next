<script lang="ts">
  import {
    layers,
    activeLayerId,
    showLayersPanel,
    addLayer,
    removeLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    moveSelectionToLayer
  } from '../stores/layers'
  import { hasSelection } from '../stores/selection'

  let editingLayerId = $state<string | null>(null)
  let editingName = $state('')

  function startRenaming(layerId: string, currentName: string) {
    editingLayerId = layerId
    editingName = currentName
  }

  function finishRenaming(layerId: string) {
    if (editingName.trim()) {
      renameLayer(layerId, editingName.trim())
    }
    editingLayerId = null
    editingName = ''
  }

  function cancelRenaming() {
    editingLayerId = null
    editingName = ''
  }

  function handleCreateLayer() {
    addLayer()
  }

  function handleMoveSelection() {
    if ($activeLayerId) {
      moveSelectionToLayer($activeLayerId)
    }
  }
</script>

{#if $showLayersPanel}
  <div class="layers-floating-panel" role="region" aria-label="Gestor de Capas">
    <div class="panel-header">
      <div class="panel-title">
        <span class="icon">📑</span>
        <span>Capas ({$layers.length})</span>
      </div>
      <div class="header-actions">
        <button
          class="btn-icon"
          title="Añadir nueva capa"
          onclick={handleCreateLayer}
          data-testid="add-layer-btn"
        >
          ➕
        </button>
        <button
          class="btn-icon close-btn"
          title="Cerrar panel de capas"
          onclick={() => showLayersPanel.set(false)}
        >
          ✕
        </button>
      </div>
    </div>

    <div class="layers-list">
      {#each [...$layers].reverse() as layer (layer.id)}
        {@const isActive = $activeLayerId === layer.id}
        <div
          class="layer-item"
          class:active={isActive}
          class:hidden={!layer.visible}
          class:locked={layer.locked}
          onclick={() => setActiveLayer(layer.id)}
          role="button"
          tabindex="0"
          onkeydown={(e) => { if (e.key === 'Enter') setActiveLayer(layer.id); }}
        >
          <div class="layer-controls">
            <!-- Visibilidad -->
            <button
              class="icon-toggle"
              class:dimmed={!layer.visible}
              title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
              onclick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
              data-testid="toggle-vis-{layer.id}"
            >
              {layer.visible ? '👁️' : '🕶️'}
            </button>

            <!-- Bloqueo -->
            <button
              class="icon-toggle"
              class:active-lock={layer.locked}
              title={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'}
              onclick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
              data-testid="toggle-lock-{layer.id}"
            >
              {layer.locked ? '🔒' : '🔓'}
            </button>
          </div>

          <div class="layer-content">
            {#if editingLayerId === layer.id}
              <!-- svelte-ignore a11y_autofocus -->
              <input
                class="rename-input"
                type="text"
                bind:value={editingName}
                autofocus
                onclick={(e) => e.stopPropagation()}
                onblur={() => finishRenaming(layer.id)}
                onkeydown={(e) => {
                  if (e.key === 'Enter') finishRenaming(layer.id)
                  if (e.key === 'Escape') cancelRenaming()
                }}
              />
            {:else}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <span
                class="layer-name"
                role="button"
                tabindex="0"
                ondblclick={(e) => { e.stopPropagation(); startRenaming(layer.id, layer.name); }}
                title="Doble clic para renombrar"
              >
                {layer.name}
              </span>
              <span class="cell-count-badge" title="{layer.cellCount} elemento(s)">
                {layer.cellCount}
              </span>
            {/if}
          </div>

          <div class="layer-actions">
            {#if $layers.length > 1}
              <button
                class="btn-delete"
                title="Eliminar capa"
                onclick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                data-testid="delete-layer-{layer.id}"
              >
                🗑️
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="panel-footer">
      <button
        class="move-selection-btn"
        disabled={!$hasSelection}
        onclick={handleMoveSelection}
        title="Mover las formas seleccionadas a la capa activa"
      >
        <span>📦 Mover selección a capa activa</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .layers-floating-panel {
    position: absolute;
    bottom: calc(var(--statusbar-h) + 12px);
    right: 20px;
    width: 290px;
    max-height: 380px;
    background: var(--bg-elevated);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    overflow: hidden;
    animation: fade-scale 140ms ease;
  }

  @keyframes fade-scale {
    from { opacity: 0; transform: scale(0.96) translateY(6px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-secondary);
    border-bottom: var(--border-w) solid var(--border);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-bold);
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .btn-icon:hover { background: var(--bg-hover); }
  .close-btn:hover { color: var(--danger); }

  .layers-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-1);
  }

  .layer-item {
    display: flex;
    align-items: center;
    padding: var(--space-2) var(--space-2);
    border-radius: var(--radius-sm);
    gap: var(--space-2);
    cursor: pointer;
    transition: background var(--t-fast);
    border: 1px solid transparent;
  }
  .layer-item:hover { background: var(--bg-hover); }
  .layer-item.active {
    background: var(--bg-active);
    border-color: var(--accent);
  }
  .layer-item.hidden { opacity: 0.55; }

  .layer-controls {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .icon-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    padding: 2px;
    line-height: 1;
    opacity: 0.75;
    border-radius: var(--radius-sm);
  }
  .icon-toggle:hover { opacity: 1; background: var(--bg-hover); }
  .icon-toggle.active-lock { opacity: 1; }
  .icon-toggle.dimmed { opacity: 0.4; }

  .layer-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
  }

  .layer-name {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rename-input {
    width: 100%;
    padding: 2px 4px;
    font-size: var(--text-xs);
    background: var(--bg-primary);
    border: 1px solid var(--accent);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    outline: none;
  }

  .cell-count-badge {
    font-size: 9px;
    color: var(--text-secondary);
    background: var(--bg-primary);
    padding: 1px 4px;
    border-radius: 999px;
    border: 1px solid var(--border);
    margin-left: var(--space-2);
  }

  .layer-actions {
    display: flex;
    align-items: center;
  }

  .btn-delete {
    background: none;
    border: none;
    font-size: 10px;
    cursor: pointer;
    opacity: 0.4;
    padding: 2px;
  }
  .btn-delete:hover { opacity: 1; color: var(--danger); }

  .panel-footer {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-secondary);
    border-top: var(--border-w) solid var(--border);
  }

  .move-selection-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--bg-elevated);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .move-selection-btn:not(:disabled):hover {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }
  .move-selection-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
