<script lang="ts">
  import { zoomLevel, activeGraph } from '../stores/graph'
  import { saveStatus, lastSavedTime } from '../stores/persistence'
  import {
    pages,
    activePageId,
    addPage,
    switchPage,
    renamePage,
    removePage,
    type PageItem
  } from '../stores/pages'

  let editingPageId = $state<string | null>(null)
  let editingName = $state('')

  function handlePageClick(pageId: string) {
    if (editingPageId) return
    switchPage(pageId)
  }

  function handleAddPage() {
    addPage()
  }

  function startEditing(page: PageItem, e: MouseEvent) {
    e.stopPropagation()
    editingPageId = page.id
    editingName = page.name
  }

  function finishEditing(pageId: string) {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim())
    }
    editingPageId = null
    editingName = ''
  }

  function cancelEditing() {
    editingPageId = null
    editingName = ''
  }

  function handleRemovePage(pageId: string) {
    if (confirm('¿Eliminar esta página? Esta acción no se puede deshacer.')) {
      removePage(pageId)
    }
  }
</script>

<div class="statusbar" data-testid="statusbar">
  <!-- Tabs de páginas -->
  <div class="pages-tabs">
    {#each $pages as page}
      <div
        class="page-tab-wrapper"
        class:active={page.id === $activePageId}
      >
        {#if editingPageId === page.id}
          <input
            class="page-edit-input"
            type="text"
            bind:value={editingName}
            onkeydown={(e) => {
              if (e.key === 'Enter') finishEditing(page.id)
              if (e.key === 'Escape') cancelEditing()
            }}
            onblur={() => finishEditing(page.id)}
          />
        {:else}
          <button
            class="page-tab"
            onclick={() => handlePageClick(page.id)}
            ondblclick={(e) => startEditing(page, e)}
            title="Clic para ver página, doble clic para renombrar"
          >
            {page.name}
          </button>
          {#if $pages.length > 1}
            <button
              class="tab-close-btn"
              onclick={(e) => {
                e.stopPropagation()
                handleRemovePage(page.id)
              }}
              title="Eliminar página"
            >
              ✕
            </button>
          {/if}
        {/if}
      </div>
    {/each}
    <button class="add-page-btn" title="Añadir nueva página" onclick={handleAddPage}>+</button>
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

  .page-tab-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
    background: transparent;
    border-top: 2px solid transparent;
    transition: background var(--t-fast);
  }
  .page-tab-wrapper:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .page-tab-wrapper.active {
    background: rgba(255, 255, 255, 0.22);
    border-top-color: white;
  }

  .page-tab {
    height: 100%;
    padding: 0 var(--space-3);
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.9);
    font-size: var(--text-xs);
    cursor: pointer;
    font-weight: var(--font-normal);
  }
  .page-tab-wrapper.active .page-tab {
    color: white;
    font-weight: var(--font-medium);
  }

  .tab-close-btn {
    width: 16px;
    height: 16px;
    margin-right: var(--space-1);
    background: none;
    border: none;
    border-radius: var(--radius-full);
    color: rgba(255, 255, 255, 0.6);
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }
  .tab-close-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }

  .page-edit-input {
    height: 20px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid white;
    border-radius: var(--radius-sm);
    color: white;
    font-size: var(--text-xs);
    padding: 0 var(--space-2);
    margin: 0 var(--space-2);
    outline: none;
    width: 90px;
  }

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
