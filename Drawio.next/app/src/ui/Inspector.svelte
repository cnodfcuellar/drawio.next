<script lang="ts">
  import { hasSelection } from '../stores/selection'

  const tabs = ['Style', 'Arrange', 'Text'] as const
  let activeTab: typeof tabs[number] = $state('Style')
</script>

<aside class="inspector" data-testid="inspector">
  <!-- Tabs -->
  <div class="tab-bar">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab}
        onclick={() => activeTab = tab}
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
        <p>Select a shape to edit its properties</p>
      </div>
    {:else}
      {#if activeTab === 'Style'}
        <div class="prop-group">
          <div class="prop-label">Fill Color</div>
          <div class="color-preview" style="background: #dae8fc;">
            <span>#dae8fc</span>
          </div>
        </div>
        <div class="prop-group">
          <div class="prop-label">Stroke Color</div>
          <div class="color-preview" style="background: #6c8ebf;">
            <span>#6c8ebf</span>
          </div>
        </div>
      {:else if activeTab === 'Arrange'}
        <div class="prop-grid">
          <div class="prop-row">
            <label class="prop-label">X</label>
            <input class="prop-input" type="number" value="0" />
          </div>
          <div class="prop-row">
            <label class="prop-label">Y</label>
            <input class="prop-input" type="number" value="0" />
          </div>
          <div class="prop-row">
            <label class="prop-label">W</label>
            <input class="prop-input" type="number" value="120" />
          </div>
          <div class="prop-row">
            <label class="prop-label">H</label>
            <input class="prop-input" type="number" value="60" />
          </div>
        </div>
      {:else if activeTab === 'Text'}
        <div class="prop-group">
          <div class="prop-label">Font Size</div>
          <input class="prop-input" type="number" value="12" style="width:60px" />
        </div>
      {/if}
    {/if}
  </div>

  <!-- Diagram props (siempre visible) -->
  <div class="diagram-section">
    <div class="section-title">Diagram</div>
    <label class="toggle-row">
      <span>Grid</span>
      <input type="checkbox" checked />
    </label>
    <label class="toggle-row">
      <span>Connection Points</span>
      <input type="checkbox" checked />
    </label>
    <label class="toggle-row">
      <span>Guides</span>
      <input type="checkbox" checked />
    </label>
  </div>
</aside>

<style>
  .inspector { display: flex; flex-direction: column; height: 100%; font-size: var(--text-sm); }

  .tab-bar {
    display: flex;
    border-bottom: var(--border-w) solid var(--border);
  }
  .tab-btn {
    flex: 1;
    background: none; border: none;
    color: var(--text-secondary);
    font-family: var(--font);
    font-size: var(--text-sm);
    padding: var(--space-2) 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all var(--t-fast);
  }
  .tab-btn:hover  { color: var(--text-primary); }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

  .tab-content { flex: 1; padding: var(--space-4); overflow-y: auto; }

  .no-selection {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: var(--space-4); color: var(--text-disabled);
    padding: var(--space-10) var(--space-4);
    text-align: center; font-style: italic;
  }
  .no-sel-icon { font-size: 32px; opacity: 0.3; }

  .prop-group { margin-bottom: var(--space-6); }
  .prop-label { color: var(--text-secondary); margin-bottom: var(--space-2); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.5px; }
  .color-preview {
    display: flex; align-items: center; padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md); border: var(--border-w) solid var(--border);
    cursor: pointer; gap: var(--space-2);
  }
  .color-preview span { font-size: var(--text-xs); color: var(--text-secondary); }

  .prop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  .prop-row { display: flex; align-items: center; gap: var(--space-2); }
  .prop-input {
    flex: 1; background: var(--bg-elevated); border: var(--border-w) solid var(--border);
    border-radius: var(--radius-sm); color: var(--text-primary);
    font-family: var(--font); font-size: var(--text-sm);
    padding: var(--space-1) var(--space-2); outline: none;
  }
  .prop-input:focus { border-color: var(--accent); }

  .diagram-section {
    padding: var(--space-4);
    border-top: var(--border-w) solid var(--border);
  }
  .section-title {
    color: var(--text-secondary); font-size: var(--text-xs);
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: var(--space-3);
  }
  .toggle-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-2) 0; cursor: pointer;
  }
</style>
