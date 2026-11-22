<script lang="ts">
  import { zoomLevel, activeGraph } from '../stores/graph'
  import { saveStatus, lastSavedTime } from '../stores/persistence'

  let pages = $state([{ id: 1, name: 'Page-1' }])
  let activePageId = $state(1)

  function addPage() {
    const nextId = pages.length + 1
    pages.push({ id: nextId, name: `Page-${nextId}` })
    activePageId = nextId
  }
</script>

<div class="statusbar" data-testid="statusbar">
  <!-- Tabs de páginas -->
  <div class="pages-tabs">
    {#each pages as page}
      <button
        class="page-tab"
        class:active={page.id === activePageId}
        onclick={() => (activePageId = page.id)}
      >
        {page.name}
      </button>
    {/each}
    <button class="add-page-btn" title="Add page" onclick={addPage}>+</button>
  </div>

  <!-- Indicador central de auto-guardado -->
  <div class="autosave-badge" title="Tus cambios se guardan automáticamente en tu navegador">
    {#if $saveStatus === 'saving'}
      <span class="save-icon spin">⏳</span>
      <span class="save-text">Guardando...</span>
    {:else if $saveStatus === 'saved'}
      <span class="save-icon">✓</span>
      <span class="save-text">Guardado {$lastSavedTime ? `(${$lastSavedTime})` : ''}</span>
    {:else}
      <span class="save-icon">⚠️</span>
      <span class="save-text">Error al guardar</span>
    {/if}
  </div>

  <!-- Controles de zoom reactivos al GraphController -->
  <div class="zoom-controls">
    <button
      class="zoom-btn"
      title="Zoom out"
      onclick={() => {
        $activeGraph?.zoomOut()
        if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
      }}>−</button
    >
    <span class="zoom-value">{$zoomLevel}%</span>
    <button
      class="zoom-btn"
      title="Zoom in"
      onclick={() => {
        $activeGraph?.zoomIn()
        if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
      }}>+</button
    >
  </div>
</div>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }

  .pages-tabs { display: flex; align-items: center; gap: 2px; height: 100%; }

  .page-tab {
    height: 100%;
    padding: 0 var(--space-4);
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: var(--text-xs);
    cursor: pointer;
    border-top: 2px solid transparent;
  }
  .page-tab:hover  { background: rgba(255, 255, 255, 0.1); color: white; }
  .page-tab.active { background: rgba(255, 255, 255, 0.2); color: white; font-weight: var(--font-medium); }

  .add-page-btn {
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    color: white;
    font-size: var(--text-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
  }
  .add-page-btn:hover { opacity: 1; }

  .zoom-controls { display: flex; align-items: center; gap: var(--space-2); }
  .zoom-value { min-width: 40px; text-align: center; }
  .zoom-btn {
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    font-size: var(--text-md);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }
  .zoom-btn:hover { background: rgba(255, 255, 255, 0.15); }

  /* Indicador central de auto-guardado */
  .autosave-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.18);
    padding: 2px 10px;
    border-radius: var(--radius-full);
    user-select: none;
  }
  .save-icon {
    font-size: 11px;
    font-weight: bold;
  }
  .save-icon.spin {
    animation: spin 1.2s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
