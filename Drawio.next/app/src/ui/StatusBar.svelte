<script lang="ts">
  import { zoomLevel, activeGraph } from '../stores/graph'
  import { saveStatus, lastSavedTime } from '../stores/persistence'
  import {
    pages,
    activePageId,
    addPage,
    switchPage,
    renamePage,
    duplicatePage,
    removePage,
    type PageItem
  } from '../stores/pages'

  let editingPageId = $state<string | null>(null)
  let editingName = $state('')
  let contextMenu = $state<{ x: number; y: number; page: PageItem } | null>(null)

  function handlePageClick(pageId: string) {
    if (editingPageId) return
    closeContextMenu()
    switchPage(pageId)
  }

  function handleAddPage() {
    closeContextMenu()
    addPage()
  }

  function startEditing(page: PageItem, e?: MouseEvent) {
    if (e && e.stopPropagation) e.stopPropagation()
    closeContextMenu()
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

  function handleDuplicate(pageId: string) {
    closeContextMenu()
    duplicatePage(pageId)
  }

  function handleRemovePage(pageId: string) {
    closeContextMenu()
    if (confirm('¿Eliminar esta página? Esta acción no se puede deshacer.')) {
      removePage(pageId)
    }
  }

  function handleContextMenu(page: PageItem, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    contextMenu = {
      x: e.clientX,
      y: e.clientY,
      page
    }
  }

  function closeContextMenu() {
    contextMenu = null
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
            oncontextmenu={(e) => handleContextMenu(page, e)}
            title="Clic: ver página | Doble clic: renombrar | Clic derecho: opciones"
          >
            {page.name}
          </button>
          
          <button
            class="tab-btn-action"
            onclick={(e) => {
              e.stopPropagation()
              handleDuplicate(page.id)
            }}
            title="Duplicar esta página (⧉)"
          >
            ⧉
          </button>

          {#if $pages.length > 1}
            <button
              class="tab-btn-action close"
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

  {#if contextMenu}
    <!-- Overlay para cerrar el menú contextual al hacer clic fuera -->
    <div
      class="context-overlay"
      role="button"
      tabindex="-1"
      onclick={closeContextMenu}
      oncontextmenu={(e) => { e.preventDefault(); closeContextMenu(); }}
      onkeydown={(e) => { if (e.key === 'Escape') closeContextMenu(); }}
    ></div>

    <div
      class="page-context-menu"
      style="left: {Math.max(10, Math.min(contextMenu.x - 20, window.innerWidth - 180))}px; bottom: 32px;"
    >
      <div class="menu-header">{contextMenu.page.name}</div>
      <button class="menu-item" onclick={() => startEditing(contextMenu!.page)}>
        <span class="menu-icon">✏️</span> Renombrar
      </button>
      <button class="menu-item" onclick={() => handleDuplicate(contextMenu!.page.id)}>
        <span class="menu-icon">⧉</span> Duplicar Página
      </button>
      {#if $pages.length > 1}
        <div class="menu-divider"></div>
        <button class="menu-item danger" onclick={() => handleRemovePage(contextMenu!.page.id)}>
          <span class="menu-icon">🗑️</span> Eliminar Página
        </button>
      {/if}
    </div>
  {/if}

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

  .tab-btn-action {
    width: 16px;
    height: 16px;
    margin-right: 2px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    cursor: pointer;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 1;
    transition: background var(--t-fast), color var(--t-fast);
  }
  .tab-btn-action:hover {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }
  .tab-btn-action.close:hover {
    background: rgba(239, 68, 68, 0.6);
    color: white;
  }

  /* Menú Contextual de Página */
  .context-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: transparent;
  }
  .page-context-menu {
    position: fixed;
    z-index: 1001;
    min-width: 170px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .menu-header {
    font-size: 10px;
    font-weight: var(--font-bold);
    color: var(--text-secondary);
    padding: 4px 8px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-xs);
    cursor: pointer;
    text-align: left;
    transition: background var(--t-fast);
  }
  .menu-item:hover {
    background: var(--bg-hover);
  }
  .menu-item.danger {
    color: #ef4444;
  }
  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.15);
  }
  .menu-icon {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
  }
  .menu-divider {
    height: 1px;
    background: var(--border);
    margin: 2px 0;
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
