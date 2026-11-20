<script lang="ts">
  import { theme } from '../stores/theme'
  import MenuBar from './MenuBar.svelte'
  import Toolbar from './Toolbar.svelte'
  import Sidebar from './Sidebar.svelte'
  import Canvas from './Canvas.svelte'
  import Inspector from './Inspector.svelte'
  import StatusBar from './StatusBar.svelte'

  // Sincronizar el data-theme con el <body>
  $effect(() => {
    document.body.setAttribute('data-theme', $theme)
  })
</script>

<div class="app-shell" data-theme={$theme}>
  <div class="area-menubar">
    <MenuBar />
  </div>
  <div class="area-toolbar">
    <Toolbar />
  </div>
  <div class="area-sidebar">
    <Sidebar />
  </div>
  <div class="area-canvas">
    <Canvas />
  </div>
  <div class="area-inspector">
    <Inspector />
  </div>
  <div class="area-statusbar">
    <StatusBar />
  </div>
</div>

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
  }

  .area-menubar   { grid-area: menubar;    background: var(--bg-secondary); border-bottom: var(--border-w) solid var(--border); }
  .area-toolbar   { grid-area: toolbar;    background: var(--bg-secondary); border-bottom: var(--border-w) solid var(--border); }
  .area-sidebar   { grid-area: sidebar;    background: var(--bg-secondary); border-right: var(--border-w) solid var(--border); overflow-y: auto; }
  .area-canvas    { grid-area: canvas;     background: var(--bg-primary);   overflow: hidden; position: relative; }
  .area-inspector { grid-area: inspector;  background: var(--bg-secondary); border-left: var(--border-w) solid var(--border); overflow-y: auto; }
  .area-statusbar { grid-area: statusbar;  background: var(--accent);       color: white; display: flex; align-items: center; padding: 0 var(--space-4); font-size: var(--text-xs); }
</style>
