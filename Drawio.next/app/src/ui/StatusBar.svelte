<script lang="ts">
  let zoom = $state(100)
</script>

<div class="statusbar" data-testid="statusbar">
  <div class="pages">
    <button class="page-tab active">Page-1</button>
    <button class="page-add" title="Add page">+</button>
  </div>
  <div class="spacer"></div>
  <div class="zoom-ctrl">
    <button onclick={() => zoom = Math.max(10, zoom - 10)}>−</button>
    <span class="zoom-pct">{zoom}%</span>
    <button onclick={() => zoom = Math.min(400, zoom + 10)}>+</button>
  </div>
</div>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--space-2);
    gap: var(--space-2);
    font-size: var(--text-xs);
    background: var(--bg-elevated);
    border-top: var(--border-w) solid var(--border);
    color: var(--text-secondary);
  }

  .pages { display: flex; align-items: center; gap: var(--space-1); }
  .page-tab {
    background: var(--bg-secondary); border: var(--border-w) solid var(--border);
    border-bottom: none; border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    color: var(--text-secondary); font-family: var(--font); font-size: var(--text-xs);
    padding: 2px var(--space-4); cursor: pointer;
  }
  .page-tab.active { color: var(--text-primary); background: var(--bg-active); }
  .page-add {
    background: none; border: none; color: var(--text-secondary);
    cursor: pointer; font-size: var(--text-md); padding: 0 var(--space-2);
  }
  .page-add:hover { color: var(--text-primary); }

  .spacer { flex: 1; }

  .zoom-ctrl { display: flex; align-items: center; gap: var(--space-2); }
  .zoom-ctrl button {
    background: none; border: none; color: var(--text-secondary);
    cursor: pointer; font-size: var(--text-md); width: 20px; text-align: center;
  }
  .zoom-ctrl button:hover { color: var(--text-primary); }
  .zoom-pct { min-width: 36px; text-align: center; }
</style>
