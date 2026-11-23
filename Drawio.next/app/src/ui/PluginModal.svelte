<script lang="ts">
  import { pluginRegistry } from '../plugins/PluginRegistry'

  const notification = pluginRegistry.notificationStore
  const plugins = pluginRegistry.pluginsStore
  const enabledPlugins = pluginRegistry.enabledPluginsStore

  interface Props {
    showManager?: boolean
  }

  let { showManager = $bindable(false) }: Props = $props()

  function closeNotification() {
    notification.set(null)
  }

  function togglePlugin(id: string) {
    if (pluginRegistry.isEnabled(id)) {
      pluginRegistry.disable(id)
    } else {
      pluginRegistry.enable(id)
    }
  }

  function closeManager() {
    showManager = false
  }
</script>

{#if $notification}
  <div class="plugin-toast" class:type-warning={$notification.type === 'warning'} class:type-success={$notification.type === 'success'}>
    <div class="toast-header">
      <span class="toast-title">{$notification.title || 'Notificación de Plugin'}</span>
      <button class="toast-close" onclick={closeNotification}>✕</button>
    </div>
    <div class="toast-body">
      {$notification.message}
    </div>
  </div>
{/if}

{#if showManager}
  <div class="modal-backdrop" onclick={closeManager} role="presentation">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header">
        <div class="modal-title">🧩 Gestor de Plugins</div>
        <button class="modal-close" onclick={closeManager}>✕</button>
      </div>

      <div class="modal-body">
        {#if $plugins.length === 0}
          <div class="empty-plugins">No hay plugins instalados actualmente.</div>
        {:else}
          <div class="plugin-list">
            {#each $plugins as plugin}
              {@const isEnabled = $enabledPlugins.includes(plugin.id)}
              <div class="plugin-item">
                <div class="plugin-info">
                  <div class="plugin-name">
                    {plugin.name}
                    <span class="plugin-version">v{plugin.version}</span>
                  </div>
                  <div class="plugin-desc">{plugin.description}</div>
                  {#if plugin.author}
                    <div class="plugin-author">Por: {plugin.author}</div>
                  {/if}
                </div>
                <div class="plugin-actions">
                  <button
                    class="plugin-toggle-btn"
                    class:active={isEnabled}
                    onclick={() => togglePlugin(plugin.id)}
                  >
                    {isEnabled ? 'Activo' : 'Desactivado'}
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .plugin-toast {
    position: fixed;
    bottom: calc(var(--statusbar-h) + 16px);
    right: 20px;
    z-index: 9999;
    min-width: 320px;
    max-width: 440px;
    background: var(--bg-elevated);
    border: var(--border-w) solid var(--accent);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    color: var(--text-primary);
    padding: var(--space-3) var(--space-4);
    animation: slide-up 200ms ease;
  }
  .plugin-toast.type-warning { border-color: var(--warning); }
  .plugin-toast.type-success { border-color: var(--success); }

  @keyframes slide-up {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .toast-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }
  .toast-title {
    font-size: var(--text-base);
    font-weight: var(--font-bold);
  }
  .toast-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: var(--text-md);
  }
  .toast-body {
    font-size: var(--text-sm);
    line-height: 1.4;
    white-space: pre-line;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  .modal-card {
    background: var(--bg-secondary);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-lg);
    width: 480px;
    max-width: 90vw;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) var(--space-5);
    border-bottom: var(--border-w) solid var(--border);
    background: var(--bg-elevated);
  }
  .modal-title {
    font-size: var(--text-md);
    font-weight: var(--font-bold);
    color: var(--text-primary);
  }
  .modal-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: var(--text-md);
    cursor: pointer;
  }
  .modal-body {
    padding: var(--space-4) var(--space-5);
    max-height: 400px;
    overflow-y: auto;
  }
  .plugin-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) 0;
    border-bottom: var(--border-w) solid var(--border);
  }
  .plugin-item:last-child { border-bottom: none; }
  .plugin-name {
    font-weight: var(--font-medium);
    font-size: var(--text-base);
    color: var(--text-primary);
  }
  .plugin-version {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-left: var(--space-2);
  }
  .plugin-desc {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-top: var(--space-1);
  }
  .plugin-author {
    font-size: var(--text-xs);
    color: var(--text-disabled);
    margin-top: 2px;
  }
  .plugin-toggle-btn {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-sm);
    border: var(--border-w) solid var(--border);
    background: var(--bg-primary);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .plugin-toggle-btn.active {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }
  .empty-plugins {
    text-align: center;
    color: var(--text-secondary);
    padding: var(--space-6);
  }
</style>
