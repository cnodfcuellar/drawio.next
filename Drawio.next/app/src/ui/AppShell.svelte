<script lang="ts">
  import { onMount } from 'svelte'
  import { theme } from '../stores/theme'
  import { layout, showSidebar, showInspector, zenMode } from '../stores/layout'
  import { initDefaultPlugins } from '../plugins'
  import MenuBar from './MenuBar.svelte'
  import Toolbar from './Toolbar.svelte'
  import Sidebar from './Sidebar.svelte'
  import Canvas from './Canvas.svelte'
  import Inspector from './Inspector.svelte'
  import StatusBar from './StatusBar.svelte'
  import PluginModal from './PluginModal.svelte'

  let showPluginManager = $state(false)

  onMount(() => {
    initDefaultPlugins()
  })

  // Sincronizar el data-theme con el <body>
  $effect(() => {
    document.body.setAttribute('data-theme', $theme)
  })

  // Atajos de teclado globales para layout
  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null
    const isInput = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (typeof (target as any).closest === 'function' && (target as any).closest('input, textarea, [contenteditable="true"]'))
    )
    if (isInput) return

    // F9 o Ctrl+\ : Alternar Modo Enfoque (Zen Mode)
    if (e.key === 'F9' || ((e.ctrlKey || e.metaKey) && e.key === '\\')) {
      e.preventDefault()
      layout.toggleZenMode()
    }
    // F7 o Ctrl+Shift+L: Alternar Paleta Izquierda
    else if (e.key === 'F7' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l'))) {
      e.preventDefault()
      layout.toggleSidebar()
    }
    // F8 o Ctrl+Shift+R: Alternar Inspector Derecho
    else if (e.key === 'F8' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r'))) {
      e.preventDefault()
      layout.toggleInspector()
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
  class="app-shell"
  class:hide-sidebar={!$showSidebar}
  class:hide-inspector={!$showInspector}
  class:is-zen={$zenMode}
  data-theme={$theme}
>
  <div class="area-menubar">
    <MenuBar onOpenPluginManager={() => { showPluginManager = true }} />
  </div>
  <div class="area-toolbar">
    <Toolbar />
  </div>
  <div class="area-sidebar">
    <Sidebar />
  </div>
  <div class="area-canvas">
    <Canvas />
    {#if $zenMode}
      <button
        class="zen-floating-pill"
        title="Salir del Modo Enfoque (F9 o Ctrl+\)"
        onclick={() => layout.toggleZenMode()}
      >
        <span>🗖 Salir del Modo Enfoque (F9)</span>
      </button>
    {/if}
  </div>
  <div class="area-inspector">
    <Inspector />
  </div>
  <div class="area-statusbar">
    <StatusBar />
  </div>
</div>

<PluginModal bind:showManager={showPluginManager} />

<style>
  .app-shell {
    display: grid;
    grid-template-areas:
      "menubar   menubar   menubar"
      "toolbar   toolbar   toolbar"
      "sidebar   canvas    inspector"
      "statusbar statusbar statusbar";
    grid-template-columns: var(--sidebar-w) 1fr var(--inspector-w);
    grid-template-rows:
      var(--menubar-h)
      var(--toolbar-h)
      1fr
      var(--statusbar-h);
    height: 100%;
    width: 100%;
    overflow: hidden;
    transition: grid-template-columns var(--t-base);
  }

  .app-shell.hide-sidebar {
    --sidebar-w: 0px;
  }

  .app-shell.hide-inspector {
    --inspector-w: 0px;
  }

  .area-menubar   { grid-area: menubar;    background: var(--bg-secondary); border-bottom: var(--border-w) solid var(--border); }
  .area-toolbar   { grid-area: toolbar;    background: var(--bg-secondary); border-bottom: var(--border-w) solid var(--border); }
  .area-sidebar   {
    grid-area: sidebar;
    background: var(--bg-secondary);
    border-right: var(--border-w) solid var(--border);
    overflow-y: auto;
    transition: border-color var(--t-fast);
  }
  .app-shell.hide-sidebar .area-sidebar {
    border-right: none;
    visibility: hidden;
    pointer-events: none;
  }

  .area-canvas    { grid-area: canvas;     background: var(--bg-primary);   overflow: hidden; position: relative; }

  .area-inspector {
    grid-area: inspector;
    background: var(--bg-secondary);
    border-left: var(--border-w) solid var(--border);
    overflow-y: auto;
    transition: border-color var(--t-fast);
  }
  .app-shell.hide-inspector .area-inspector {
    border-left: none;
    visibility: hidden;
    pointer-events: none;
  }

  .area-statusbar { grid-area: statusbar;  background: var(--accent);       color: white; display: flex; align-items: center; padding: 0 var(--space-4); font-size: var(--text-xs); }

  .zen-floating-pill {
    position: absolute;
    top: var(--space-3);
    right: var(--space-4);
    z-index: 100;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: var(--border-w) solid var(--border);
    border-radius: 9999px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    font-size: var(--text-xs);
    font-weight: 500;
    cursor: pointer;
    opacity: 0.88;
    transition: all var(--t-fast);
  }
  .zen-floating-pill:hover {
    opacity: 1;
    transform: translateY(-1px);
    background: var(--bg-hover);
    border-color: var(--accent);
  }
</style>
