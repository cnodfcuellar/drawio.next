<script lang="ts">
  import { hasSelection } from '../stores/selection'

  interface ToolGroup {
    tools: Tool[]
  }
  interface Tool {
    id: string
    icon: string
    label: string
    shortcut?: string
    action: () => void
    disabled?: boolean
  }

  const groups: ToolGroup[] = [
    {
      tools: [
        { id: 'undo',     icon: '↩', label: 'Undo',     shortcut: 'Ctrl+Z',  action: () => {} },
        { id: 'redo',     icon: '↪', label: 'Redo',     shortcut: 'Ctrl+Y',  action: () => {} },
      ]
    },
    {
      tools: [
        { id: 'delete',   icon: '🗑', label: 'Delete',   shortcut: 'Del',     action: () => {} },
        { id: 'copy',     icon: '⧉',  label: 'Copy',     shortcut: 'Ctrl+C',  action: () => {} },
        { id: 'paste',    icon: '📋', label: 'Paste',    shortcut: 'Ctrl+V',  action: () => {} },
      ]
    },
    {
      tools: [
        { id: 'zoomIn',   icon: '+',  label: 'Zoom In',  shortcut: 'Ctrl+=',  action: () => {} },
        { id: 'zoomOut',  icon: '−',  label: 'Zoom Out', shortcut: 'Ctrl+-',  action: () => {} },
        { id: 'fit',      icon: '⊡',  label: 'Fit Page', shortcut: 'Ctrl+Shift+H', action: () => {} },
      ]
    },
  ]
</script>

<div class="toolbar" data-testid="toolbar">
  {#each groups as group, gi}
    {#if gi > 0}<div class="separator"></div>{/if}
    <div class="tool-group">
      {#each group.tools as tool}
        <button
          class="tool-btn"
          title="{tool.label}{tool.shortcut ? ` (${tool.shortcut})` : ''}"
          onclick={tool.action}
          data-testid="tool-{tool.id}"
        >
          <span class="tool-icon">{tool.icon}</span>
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--space-4);
    gap: var(--space-2);
  }

  .tool-group { display: flex; align-items: center; gap: var(--space-1); }

  .separator {
    width: var(--border-w);
    height: 20px;
    background: var(--border);
    margin: 0 var(--space-2);
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-md);
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .tool-btn:hover    { background: var(--bg-hover); }
  .tool-btn:active   { background: var(--bg-active); }
  .tool-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .tool-icon { line-height: 1; }
</style>
