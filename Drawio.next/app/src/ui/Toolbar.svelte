<script lang="ts">
  import { hasSelection } from '../stores/selection'
  import { activeGraph, zoomLevel } from '../stores/graph'

  interface ToolGroup {
    tools: Tool[]
  }
  interface Tool {
    id: string
    icon: string
    label: string
    shortcut?: string
    action: () => void
  }

  const groups: ToolGroup[] = [
    {
      tools: [
        {
          id: 'undo',
          icon: '↩',
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          action: () => $activeGraph?.undo()
        },
        {
          id: 'redo',
          icon: '↪',
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          action: () => $activeGraph?.redo()
        },
      ]
    },
    {
      tools: [
        {
          id: 'delete',
          icon: '🗑',
          label: 'Delete',
          shortcut: 'Del',
          action: () => $activeGraph?.removeSelected()
        },
        {
          id: 'addNode',
          icon: '✚',
          label: 'Nuevo Nodo',
          shortcut: 'N',
          action: () => {
            if ($activeGraph) {
              $activeGraph.addVertex({
                label: 'Nuevo Bloque',
                x: 200 + Math.floor(Math.random() * 200),
                y: 220 + Math.floor(Math.random() * 100),
                width: 120,
                height: 60
              })
            }
          }
        }
      ]
    },
    {
      tools: [
        {
          id: 'zoomIn',
          icon: '+',
          label: 'Zoom In',
          shortcut: 'Ctrl+=',
          action: () => {
            $activeGraph?.zoomIn()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
        {
          id: 'zoomOut',
          icon: '−',
          label: 'Zoom Out',
          shortcut: 'Ctrl+-',
          action: () => {
            $activeGraph?.zoomOut()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
        {
          id: 'resetZoom',
          icon: '1:1',
          label: 'Reset Zoom (100%)',
          action: () => {
            $activeGraph?.resetZoom()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
        {
          id: 'fit',
          icon: '⊡',
          label: 'Ajustar a Pantalla',
          shortcut: 'Ctrl+Shift+H',
          action: () => {
            $activeGraph?.fit()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
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
          disabled={tool.id === 'delete' ? !$hasSelection : false}
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
    min-width: 28px;
    height: 28px;
    padding: 0 var(--space-2);
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
  .tool-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .tool-icon { line-height: 1; font-size: 13px; }
</style>
