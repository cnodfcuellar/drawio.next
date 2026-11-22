<script lang="ts">
  import { activeGraph } from '../stores/graph'
  import { CATEGORIES, SHAPES, type ShapeDefinition, type ShapeCategory } from '../core/shapes/shapeDefinitions'

  let searchQuery = $state('')
  let categories = $state<ShapeCategory[]>(JSON.parse(JSON.stringify(CATEGORIES)))

  function cleanText(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  }

  // Filtrado reactivo de formas según la búsqueda con soporte de acentos
  let trimmedQuery = $derived(cleanText(searchQuery.trim()))
  let searchResults = $derived.by(() => {
    if (!trimmedQuery) return []
    return SHAPES.filter(s =>
      cleanText(s.title).includes(trimmedQuery) ||
      cleanText(s.category).includes(trimmedQuery) ||
      s.tags.some(t => cleanText(t).includes(trimmedQuery))
    )
  })

  function toggleCategory(id: string) {
    const cat = categories.find(c => c.id === id)
    if (cat) cat.open = !cat.open
  }

  function expandAll() {
    categories.forEach(c => c.open = true)
  }

  function collapseAll() {
    categories.forEach(c => c.open = false)
  }

  function getShapesForCategory(catId: string): ShapeDefinition[] {
    return SHAPES.filter(s => s.category === catId)
  }

  function handleDragStart(e: DragEvent, shape: ShapeDefinition) {
    if (!e.dataTransfer) return
    e.dataTransfer.setData('application/json', JSON.stringify(shape))
    e.dataTransfer.effectAllowed = 'copy'

    // Imagen transparente o fallback para el cursor
    const el = e.currentTarget as HTMLElement
    if (el) {
      e.dataTransfer.setDragImage(el, 20, 20)
    }
  }

  function handleShapeClick(shape: ShapeDefinition) {
    if ($activeGraph) {
      $activeGraph.insertShapeInCenter(shape)
    } else if (typeof window !== 'undefined' && (window as any).__graphController) {
      (window as any).__graphController.insertShapeInCenter(shape)
    }
  }
</script>

<aside class="sidebar" data-testid="sidebar">
  <!-- Búsqueda -->
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input
      class="search-input"
      placeholder="Buscar formas... (ej. círculo, db, actor)"
      bind:value={searchQuery}
      data-testid="shape-search"
    />
    {#if searchQuery}
      <button class="search-clear" onclick={() => searchQuery = ''} title="Limpiar búsqueda">✕</button>
    {/if}
  </div>

  <!-- Barra de control rápido de categorías -->
  <div class="category-controls">
    <span class="cat-count">{SHAPES.length} formas</span>
    <div class="cat-btns">
      <button class="cat-action-btn" onclick={expandAll} title="Abrir todas las categorías">Expandir</button>
      <span class="sep">•</span>
      <button class="cat-action-btn" onclick={collapseAll} title="Cerrar todas las categorías">Colapsar</button>
    </div>
  </div>

  <!-- Contenido scrollable -->
  <div class="sidebar-scroll">
    {#if trimmedQuery}
      <!-- Resultados de Búsqueda -->
      <div class="section">
        <div class="section-header search-header">
          <span>Resultados</span>
          <span class="badge">{searchResults.length}</span>
        </div>
        {#if searchResults.length === 0}
          <div class="no-results">
            No se encontraron formas para "{searchQuery}"
          </div>
        {:else}
          <div class="shape-grid" data-testid="search-results">
            {#each searchResults as shape (shape.id)}
              <button
                class="shape-item"
                draggable="true"
                title="{shape.title} ({shape.width} × {shape.height}px) — Arrastra al lienzo o haz clic para añadir"
                ondragstart={(e) => handleDragStart(e, shape)}
                onclick={() => handleShapeClick(shape)}
                data-testid="shape-{shape.id}"
              >
                <svg class="shape-svg" viewBox="0 0 32 32">
                  {@html shape.svgIcon}
                </svg>
                <span class="shape-name">{shape.title}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Scratchpad -->
      <div class="section">
        <div class="section-header">
          <span>Scratchpad</span>
        </div>
        <div class="scratchpad-area" data-testid="scratchpad">
          <span class="empty-hint">Arrastra formas aquí para guardarlas</span>
        </div>
      </div>

      <!-- Categorías de Formas -->
      {#each categories as cat (cat.id)}
        {@const shapes = getShapesForCategory(cat.id)}
        <div class="section">
          <button
            class="section-header clickable"
            onclick={() => toggleCategory(cat.id)}
            data-testid="category-{cat.id}"
          >
            <span class="section-icon">{cat.icon}</span>
            <span>{cat.label}</span>
            <span class="badge">{shapes.length}</span>
            <span class="chevron" class:open={cat.open}>›</span>
          </button>

          {#if cat.open}
            <div class="shape-grid" data-testid="shapes-{cat.id}">
              {#each shapes as shape (shape.id)}
                <button
                  class="shape-item"
                  draggable="true"
                  title="{shape.title} ({shape.width} × {shape.height}px) — Arrastra al lienzo o haz clic para añadir"
                  ondragstart={(e) => handleDragStart(e, shape)}
                  onclick={() => handleShapeClick(shape)}
                  data-testid="shape-{shape.id}"
                >
                  <svg class="shape-svg" viewBox="0 0 32 32">
                    {@html shape.svgIcon}
                  </svg>
                  <span class="shape-name">{shape.title}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}

    <div class="more-shapes">
      <button class="more-btn" onclick={() => searchQuery = ''}>
        + {SHAPES.length} Formas Disponibles
      </button>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: var(--text-sm);
    overflow: hidden;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: var(--border-w) solid var(--border);
    background: var(--bg-secondary);
    flex-shrink: 0;
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
  .search-input::placeholder { color: var(--text-disabled); font-size: 12px; }
  .search-clear {
    background: none; border: none;
    color: var(--text-secondary); cursor: pointer; font-size: var(--text-xs);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }
  .search-clear:hover { background: var(--bg-hover); color: var(--text-primary); }

  .category-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px var(--space-4);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    color: var(--text-secondary);
  }
  .cat-count { font-weight: var(--font-medium); }
  .cat-btns { display: flex; align-items: center; gap: 4px; }
  .cat-action-btn {
    background: none; border: none;
    color: var(--text-secondary); cursor: pointer; font-size: 10px;
    padding: 1px 4px; border-radius: var(--radius-sm);
  }
  .cat-action-btn:hover { background: var(--bg-hover); color: var(--accent); }
  .sep { color: var(--border); }

  .sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
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
    font-weight: var(--font-medium);
  }
  .section-header.clickable {
    background: none; border: none; width: 100%;
    cursor: pointer; font-family: var(--font);
    transition: background var(--t-fast);
    text-align: left;
  }
  .section-header.clickable:hover { background: var(--bg-hover); color: var(--text-primary); }
  .section-icon { font-size: var(--text-sm); }

  .badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 8px;
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    margin-left: var(--space-1);
  }

  .chevron {
    margin-left: auto; transition: transform var(--t-fast);
    transform: rotate(0deg);
    font-size: 14px;
    color: var(--text-disabled);
  }
  .chevron.open { transform: rotate(90deg); color: var(--text-primary); }

  .scratchpad-area {
    min-height: 44px;
    padding: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);
  }
  .empty-hint { color: var(--text-disabled); font-style: italic; font-size: 11px; }

  .shape-grid {
    padding: var(--space-2) var(--space-3);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
    background: var(--bg-primary);
  }

  .shape-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2) var(--space-1);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    cursor: grab;
    transition: all var(--t-fast);
    outline: none;
    min-height: 58px;
  }
  .shape-item:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  .shape-item:active {
    cursor: grabbing;
    background: var(--bg-active);
    transform: translateY(0);
  }

  .shape-svg {
    width: 26px;
    height: 26px;
    color: var(--text-primary);
    margin-bottom: var(--space-1);
    display: block;
    pointer-events: none;
  }

  .shape-name {
    font-size: 10px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    color: var(--text-secondary);
    line-height: 1.1;
  }
  .shape-item:hover .shape-name {
    color: var(--text-primary);
  }

  .no-results {
    padding: var(--space-6) var(--space-4);
    text-align: center;
    color: var(--text-disabled);
    font-style: italic;
    font-size: var(--text-xs);
  }

  .more-shapes { padding: var(--space-4); }
  .more-btn {
    width: 100%;
    background: none;
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-family: var(--font);
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .more-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
</style>
