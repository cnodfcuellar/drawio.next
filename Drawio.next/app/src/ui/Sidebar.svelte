<script lang="ts">
  let searchQuery = $state('')

  const categories = [
    { id: 'general',  label: 'General',        icon: '▭', open: true },
    { id: 'misc',     label: 'Misc',            icon: '◈', open: false },
    { id: 'basic',    label: 'Basic',           icon: '◇', open: false },
    { id: 'arrows',   label: 'Arrows',          icon: '→', open: false },
    { id: 'flowchart',label: 'Flowchart',       icon: '◆', open: false },
    { id: 'er',       label: 'Entity Relation', icon: '⬡', open: false },
    { id: 'uml',      label: 'UML',             icon: '⬢', open: false },
  ]

  function toggleCategory(id: string) {
    const cat = categories.find(c => c.id === id)
    if (cat) cat.open = !cat.open
  }
</script>

<aside class="sidebar" data-testid="sidebar">
  <!-- Búsqueda -->
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input
      class="search-input"
      placeholder="Search shapes..."
      bind:value={searchQuery}
      data-testid="shape-search"
    />
    {#if searchQuery}
      <button class="search-clear" onclick={() => searchQuery = ''}>✕</button>
    {/if}
  </div>

  <!-- Scratchpad -->
  <div class="section">
    <div class="section-header">
      <span>Scratchpad</span>
    </div>
    <div class="scratchpad-area" data-testid="scratchpad">
      <span class="empty-hint">Drag shapes here to save them</span>
    </div>
  </div>

  <!-- Categorías -->
  {#each categories as cat}
    <div class="section">
      <button
        class="section-header clickable"
        onclick={() => toggleCategory(cat.id)}
        data-testid="category-{cat.id}"
      >
        <span class="section-icon">{cat.icon}</span>
        <span>{cat.label}</span>
        <span class="chevron" class:open={cat.open}>›</span>
      </button>
      {#if cat.open}
        <div class="shape-grid" data-testid="shapes-{cat.id}">
          <!-- Shapes se cargarán desde los stencils en Mes 4 -->
          <div class="shape-placeholder">Coming soon</div>
        </div>
      {/if}
    </div>
  {/each}

  <div class="more-shapes">
    <button class="more-btn">+ More Shapes</button>
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: var(--text-sm);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: var(--border-w) solid var(--border);
  }
  .search-icon { color: var(--text-secondary); font-size: var(--text-sm); }
  .search-input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font);
    font-size: var(--text-sm);
    outline: none;
  }
  .search-input::placeholder { color: var(--text-disabled); }
  .search-clear {
    background: none; border: none;
    color: var(--text-secondary); cursor: pointer; font-size: var(--text-xs);
  }

  .section { border-bottom: var(--border-w) solid var(--border); }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    color: var(--text-secondary);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-header.clickable {
    background: none; border: none; width: 100%;
    cursor: pointer; font-family: var(--font);
    transition: background var(--t-fast);
  }
  .section-header.clickable:hover { background: var(--bg-hover); color: var(--text-primary); }
  .section-icon { font-size: var(--text-sm); }
  .chevron {
    margin-left: auto; transition: transform var(--t-fast);
    transform: rotate(0deg);
  }
  .chevron.open { transform: rotate(90deg); }

  .scratchpad-area {
    min-height: 48px;
    padding: var(--space-4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .empty-hint { color: var(--text-disabled); font-style: italic; }

  .shape-grid {
    padding: var(--space-2) var(--space-4);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
  }
  .shape-placeholder {
    grid-column: 1 / -1;
    color: var(--text-disabled);
    font-style: italic;
    font-size: var(--text-xs);
    padding: var(--space-2);
  }

  .more-shapes { padding: var(--space-4); }
  .more-btn {
    width: 100%;
    background: none;
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-family: var(--font);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .more-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
</style>
