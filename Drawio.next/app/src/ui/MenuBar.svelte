<script lang="ts">
  import { onMount } from 'svelte'
  import { theme } from '../stores/theme'
  import { activeGraph, zoomLevel } from '../stores/graph'
  import { hasSelection } from '../stores/selection'
  import { clearSavedDiagram } from '../stores/persistence'
  import { getAllPagesWithFreshXml, initPages, duplicatePage, addPage, activePageId } from '../stores/pages'

  const menus = ['File', 'Edit', 'View', 'Arrange', 'Extras', 'Help'] as const
  type MenuName = typeof menus[number]
  let activeMenu: MenuName | null = $state(null)

  let fileInputEl: HTMLInputElement | null = null

  function toggleMenu(name: MenuName, e?: MouseEvent) {
    if (e) e.stopPropagation()
    activeMenu = activeMenu === name ? null : name
  }

  function closeMenu() {
    activeMenu = null
  }

  function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Acciones de Archivo
  function handleNew() {
    closeMenu()
    if (confirm('¿Desea crear un nuevo diagrama? El diagrama actual se reiniciará.')) {
      $activeGraph?.clear()
      clearSavedDiagram()
    }
  }

  function handleOpenClick() {
    closeMenu()
    fileInputEl?.click()
  }

  function handleFileSelected(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target?.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const xml = event.target?.result as string
      if (xml && $activeGraph) {
        const ok = $activeGraph.importXml(xml, (extractedPages) => {
          initPages(extractedPages)
        })
        if (!ok) {
          alert('No se pudo abrir el diagrama. Verifique que el archivo sea un XML o .drawio válido.')
        }
      }
    }
    reader.readAsText(file)
    target.value = ''
  }

  function handleSaveDrawio() {
    closeMenu()
    if (!$activeGraph) return
    const pagesList = getAllPagesWithFreshXml()
    const xml = $activeGraph.exportToXml(pagesList)
    downloadBlob(xml, 'diagrama.drawio', 'application/xml;charset=utf-8')
  }

  function handleExportSvg() {
    closeMenu()
    if (!$activeGraph) return
    const svg = $activeGraph.exportToSvg()
    downloadBlob(svg, 'diagrama.svg', 'image/svg+xml;charset=utf-8')
  }

  async function handleExportPng() {
    closeMenu()
    if (!$activeGraph) return
    try {
      const dataUrl = await $activeGraph.exportToPng()
      downloadDataUrl(dataUrl, 'diagrama.png')
    } catch (err) {
      console.error('Error al exportar PNG:', err)
      alert('Error al generar la imagen PNG del diagrama.')
    }
  }

  // Acciones de Edición
  function handleUndo() {
    closeMenu()
    $activeGraph?.undo()
  }

  function handleRedo() {
    closeMenu()
    $activeGraph?.redo()
  }

  function handleSelectAll() {
    closeMenu()
    $activeGraph?.selectAll()
  }

  function handleDelete() {
    closeMenu()
    $activeGraph?.removeSelected()
  }

  function handleNewPage() {
    closeMenu()
    addPage()
  }

  function handleDuplicateCurrentPage() {
    closeMenu()
    if ($activePageId) {
      duplicatePage($activePageId)
    }
  }

  // Acciones de Vista
  function handleZoomIn() {
    closeMenu()
    $activeGraph?.zoomIn()
    if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
  }

  function handleZoomOut() {
    closeMenu()
    $activeGraph?.zoomOut()
    if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
  }

  function handleResetZoom() {
    closeMenu()
    $activeGraph?.resetZoom()
    if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
  }

  function handleFit() {
    closeMenu()
    $activeGraph?.fit()
    if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
  }

  // Acciones de Organización
  function handleBringToFront() {
    closeMenu()
    $activeGraph?.bringToFront()
  }

  function handleSendToBack() {
    closeMenu()
    $activeGraph?.sendToBack()
  }

  onMount(() => {
    const handleGlobalClick = () => {
      if (activeMenu) closeMenu()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  })
</script>

<input
  type="file"
  accept=".drawio,.xml"
  style="display: none;"
  bind:this={fileInputEl}
  onchange={handleFileSelected}
/>

<nav class="menubar" data-testid="menubar">
  <div class="logo">
    <span class="logo-text">draw<span class="logo-dot">.</span>io</span>
    <span class="logo-next">next</span>
  </div>

  <div class="menu-items">
    {#each menus as name}
      <div class="menu-wrapper">
        <button
          class="menu-btn"
          class:active={activeMenu === name}
          onclick={(e) => toggleMenu(name, e)}
          data-testid={`menu-${name.toLowerCase()}`}
        >
          {name}
        </button>

        {#if activeMenu === name}
          <!-- Dropdown Menú -->
          <div class="dropdown-menu" role="menu" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeMenu()}>
            {#if name === 'File'}
              <button class="dropdown-item" onclick={handleNew} role="menuitem">
                <span class="item-icon">📄</span>
                <span class="item-label">Nuevo</span>
              </button>
              <button class="dropdown-item" onclick={handleOpenClick} role="menuitem">
                <span class="item-icon">📂</span>
                <span class="item-label">Abrir (.drawio, .xml)...</span>
              </button>
              <div class="menu-divider"></div>
              <button class="dropdown-item" onclick={handleSaveDrawio} role="menuitem">
                <span class="item-icon">💾</span>
                <span class="item-label">Guardar (.drawio)</span>
              </button>
              <button class="dropdown-item" onclick={handleExportSvg} role="menuitem">
                <span class="item-icon">📐</span>
                <span class="item-label">Exportar como SVG</span>
              </button>
              <button class="dropdown-item" onclick={handleExportPng} role="menuitem">
                <span class="item-icon">🖼️</span>
                <span class="item-label">Exportar como PNG</span>
              </button>

            {:else if name === 'Edit'}
              <button class="dropdown-item" onclick={handleUndo} role="menuitem">
                <span class="item-icon">↩</span>
                <span class="item-label">Deshacer</span>
                <span class="item-shortcut">Ctrl+Z</span>
              </button>
              <button class="dropdown-item" onclick={handleRedo} role="menuitem">
                <span class="item-icon">↪</span>
                <span class="item-label">Rehacer</span>
                <span class="item-shortcut">Ctrl+Y</span>
              </button>
              <div class="menu-divider"></div>
              <button class="dropdown-item" onclick={handleSelectAll} role="menuitem">
                <span class="item-icon">⬚</span>
                <span class="item-label">Seleccionar todo</span>
                <span class="item-shortcut">Ctrl+A</span>
              </button>
              <button class="dropdown-item" onclick={handleDelete} disabled={!$hasSelection} role="menuitem">
                <span class="item-icon">🗑️</span>
                <span class="item-label">Borrar seleccionado</span>
                <span class="item-shortcut">Supr</span>
              </button>
              <div class="menu-divider"></div>
              <button class="dropdown-item" onclick={handleNewPage} role="menuitem">
                <span class="item-icon">➕</span>
                <span class="item-label">Nueva página</span>
              </button>
              <button class="dropdown-item" onclick={handleDuplicateCurrentPage} role="menuitem">
                <span class="item-icon">⧉</span>
                <span class="item-label">Duplicar página actual</span>
              </button>

            {:else if name === 'View'}
              <button class="dropdown-item" onclick={handleZoomIn} role="menuitem">
                <span class="item-icon">➕</span>
                <span class="item-label">Acercar Zoom</span>
                <span class="item-shortcut">Ctrl++</span>
              </button>
              <button class="dropdown-item" onclick={handleZoomOut} role="menuitem">
                <span class="item-icon">➖</span>
                <span class="item-label">Alejar Zoom</span>
                <span class="item-shortcut">Ctrl+-</span>
              </button>
              <button class="dropdown-item" onclick={handleResetZoom} role="menuitem">
                <span class="item-icon">1:1</span>
                <span class="item-label">Restablecer Zoom (100%)</span>
              </button>
              <button class="dropdown-item" onclick={handleFit} role="menuitem">
                <span class="item-icon">⊡</span>
                <span class="item-label">Ajustar a Ventana</span>
              </button>

            {:else if name === 'Arrange'}
              <button class="dropdown-item" onclick={handleBringToFront} disabled={!$hasSelection} role="menuitem">
                <span class="item-icon">▲</span>
                <span class="item-label">Traer al frente</span>
              </button>
              <button class="dropdown-item" onclick={handleSendToBack} disabled={!$hasSelection} role="menuitem">
                <span class="item-icon">▼</span>
                <span class="item-label">Enviar al fondo</span>
              </button>

            {:else if name === 'Extras'}
              <button class="dropdown-item" onclick={handleSaveDrawio} role="menuitem">
                <span class="item-icon">📋</span>
                <span class="item-label">Exportar XML Rápido</span>
              </button>
              <button class="dropdown-item" onclick={handleResetZoom} role="menuitem">
                <span class="item-icon">🎯</span>
                <span class="item-label">Centrar vista</span>
              </button>

            {:else if name === 'Help'}
              <div class="help-info-panel">
                <div class="help-title">Atajos y Navegación</div>
                <div class="help-row"><span class="help-key">Espacio + Arrastre</span><span>Navegar / Panning</span></div>
                <div class="help-row"><span class="help-key">Clic Derecho</span><span>Arrastrar para Panning</span></div>
                <div class="help-row"><span class="help-key">Ctrl + Rueda</span><span>Zoom Suave</span></div>
                <div class="help-row"><span class="help-key">Supr / Backspace</span><span>Eliminar Selección</span></div>
                <div class="help-row"><span class="help-key">Ctrl + Z / Y</span><span>Deshacer / Rehacer</span></div>
                <div class="help-row"><span class="help-key">Arrastrar Forma</span><span>Soltar en Lienzo</span></div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="menu-actions">
    <button
      class="theme-btn"
      onclick={() => theme.toggle()}
      data-testid="toggle-theme"
      title="Cambiar tema oscuro/claro"
    >
      {$theme === 'dark' ? '☀️' : '🌙'}
    </button>
  </div>
</nav>

<style>
  .menubar {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--space-4);
    gap: var(--space-2);
    user-select: none;
    background: var(--bg-secondary);
    border-bottom: var(--border-w) solid var(--border);
    position: relative;
    z-index: 50;
  }

  .logo {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    margin-right: var(--space-6);
    font-weight: var(--font-bold);
    font-size: var(--text-md);
  }
  .logo-text { color: var(--text-primary); }
  .logo-dot  { color: var(--accent); }
  .logo-next {
    font-size: var(--text-xs);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .menu-items {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
  }

  .menu-wrapper {
    position: relative;
  }

  .menu-btn {
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font);
    font-size: var(--text-base);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .menu-btn:hover, .menu-btn.active {
    background: var(--bg-hover);
  }

  /* Dropdown contextual */
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 220px;
    background: var(--bg-elevated);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    padding: var(--space-1) 0;
    z-index: 100;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--space-2) var(--space-4);
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font);
    font-size: var(--text-base);
    text-align: left;
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .dropdown-item:hover:not(:disabled) {
    background: var(--bg-hover);
  }
  .dropdown-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .item-icon {
    width: 20px;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
  }
  .item-label {
    flex: 1;
  }
  .item-shortcut {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    margin-left: var(--space-4);
  }

  .menu-divider {
    height: 1px;
    background: var(--border);
    margin: var(--space-1) 0;
  }

  /* Panel de ayuda */
  .help-info-panel {
    padding: var(--space-3) var(--space-4);
    min-width: 260px;
  }
  .help-title {
    font-size: var(--text-sm);
    font-weight: var(--font-bold);
    color: var(--accent);
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
    padding-bottom: var(--space-1);
  }
  .help-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    gap: var(--space-3);
  }
  .help-key {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 1px 4px;
    font-family: var(--font-mono);
    color: var(--text-primary);
    white-space: nowrap;
  }

  .menu-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .theme-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--text-md);
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: background var(--t-fast);
  }
  .theme-btn:hover { background: var(--bg-hover); }
</style>