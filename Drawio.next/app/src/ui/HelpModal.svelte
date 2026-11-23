<script lang="ts">
  import { showHelpModal, closeHelpModal, SHORTCUTS_CATALOG, type ShortcutItem } from '../stores/help'

  let searchQuery = $state('')
  let selectedCategory = $state<'all' | ShortcutItem['category']>('all')

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'tools', label: '🛠️ Herramientas' },
    { id: 'navigation', label: '👁️ Navegación' },
    { id: 'editing', label: '✂️ Edición' },
    { id: 'arrange', label: '📐 Organización' },
    { id: 'layers', label: '📑 Capas y Páginas' },
    { id: 'plugins', label: '🧩 Plugins' }
  ] as const

  let filteredShortcuts = $derived(
    SHORTCUTS_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory
      if (!matchCat) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        item.action.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.keys.some(k => k.toLowerCase().includes(q))
      )
    })
  )
</script>

{#if $showHelpModal}
  <div class="modal-backdrop" onclick={closeHelpModal} role="presentation">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="modal-card"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="modal-header">
        <div class="title-wrap">
          <span class="icon">⌨️</span>
          <h2>Atajos de Teclado y Ayuda</h2>
        </div>
        <button class="btn-close" onclick={closeHelpModal} title="Cerrar (Escape)">✕</button>
      </div>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          placeholder="Buscar atajo o acción... (ej. conector, zoom, capas, zen)"
          bind:value={searchQuery}
          autofocus
        />
        {#if searchQuery}
          <button class="btn-clear" onclick={() => searchQuery = ''}>✕</button>
        {/if}
      </div>

      <div class="category-tabs">
        {#each categories as cat}
          <button
            class="cat-tab"
            class:active={selectedCategory === cat.id}
            onclick={() => selectedCategory = cat.id as any}
          >
            {cat.label}
          </button>
        {/each}
      </div>

      <div class="modal-body">
        {#if filteredShortcuts.length === 0}
          <div class="empty-results">
            <span>😕 No se encontraron atajos que coincidan con "{searchQuery}"</span>
          </div>
        {:else}
          <div class="shortcuts-grid">
            {#each filteredShortcuts as item (item.id)}
              <div class="shortcut-row">
                <span class="shortcut-action">{item.action}</span>
                <div class="keys-wrap">
                  {#each item.keys as key}
                    <kbd class="key-badge">{key}</kbd>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <span class="footer-tip">💡 Tip: Pulsa <kbd class="inline-kbd">?</kbd> o <kbd class="inline-kbd">F1</kbd> en cualquier momento para abrir esta guía.</span>
        <button class="btn-primary" onclick={closeHelpModal}>Entendido</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fade-in 120ms ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-card {
    background: var(--bg-secondary);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-lg);
    width: 640px;
    max-width: 92vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) var(--space-6);
    background: var(--bg-elevated);
    border-bottom: var(--border-w) solid var(--border);
  }

  .title-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .title-wrap h2 {
    font-size: var(--text-md);
    font-weight: var(--font-bold);
    color: var(--text-primary);
  }
  .title-wrap .icon { font-size: 18px; }

  .btn-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: var(--text-md);
    cursor: pointer;
    border-radius: var(--radius-sm);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--t-fast);
  }
  .btn-close:hover { background: var(--bg-hover); color: var(--danger); }

  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
    padding: var(--space-3) var(--space-6);
    background: var(--bg-secondary);
    border-bottom: var(--border-w) solid var(--border);
  }

  .search-icon {
    position: absolute;
    left: calc(var(--space-6) + 10px);
    font-size: 13px;
    opacity: 0.6;
    pointer-events: none;
  }

  .search-bar input {
    width: 100%;
    padding: var(--space-2) var(--space-4) var(--space-2) 34px;
    background: var(--bg-primary);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--t-fast);
  }
  .search-bar input:focus { border-color: var(--accent); }

  .btn-clear {
    position: absolute;
    right: calc(var(--space-6) + 10px);
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 12px;
  }

  .category-tabs {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-6);
    background: var(--bg-secondary);
    border-bottom: var(--border-w) solid var(--border);
    overflow-x: auto;
  }

  .cat-tab {
    padding: 3px 8px;
    font-size: var(--text-xs);
    font-weight: 500;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--t-fast);
  }
  .cat-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cat-tab.active {
    background: var(--bg-elevated);
    color: var(--accent);
    border-color: var(--accent);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3) var(--space-6);
  }

  .shortcuts-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .shortcut-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    border-bottom: 1px solid var(--border-light);
  }
  .shortcut-row:last-child { border-bottom: none; }
  .shortcut-row:hover { background: var(--bg-hover); }

  .shortcut-action {
    font-size: var(--text-sm);
    color: var(--text-primary);
  }

  .keys-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .key-badge {
    display: inline-block;
    padding: 2px 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-bottom: 2px solid var(--border);
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    min-width: 18px;
    text-align: center;
  }

  .inline-kbd {
    display: inline-block;
    padding: 1px 4px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 9px;
  }

  .empty-results {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-6);
    background: var(--bg-elevated);
    border-top: var(--border-w) solid var(--border);
  }

  .footer-tip {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .btn-primary {
    padding: var(--space-2) var(--space-4);
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .btn-primary:hover { background: var(--accent-hover); }
</style>
