<script lang="ts">
  import { theme } from '../stores/theme'

  const menus = ['File', 'Edit', 'View', 'Arrange', 'Extras', 'Help']
  let activeMenu: string | null = $state(null)

  function toggleMenu(name: string) {
    activeMenu = activeMenu === name ? null : name
  }
</script>

<nav class="menubar" data-testid="menubar">
  <div class="logo">
    <span class="logo-text">draw<span class="logo-dot">.</span>io</span>
    <span class="logo-next">next</span>
  </div>

  <div class="menu-items">
    {#each menus as name}
      <button
        class="menu-btn"
        class:active={activeMenu === name}
        onclick={() => toggleMenu(name)}
        data-testid={`menu-${name.toLowerCase()}`}
      >
        {name}
      </button>
    {/each}
  </div>

  <div class="menu-actions">
    <button
      class="theme-btn"
      onclick={() => theme.toggle()}
      data-testid="toggle-theme"
      title="Toggle theme"
    >
      {$theme === 'dark' ? '☀️' : '🌙'}
    </button>
  </div>
</nav>

<style>
  .menubar {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--space-4);
    gap: var(--space-2);
    user-select: none;
  }

  .logo {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    margin-right: var(--space-6);
    font-weight: var(--font-bold);
    font-size: var(--text-md);
  }
  .logo-text { color: var(--text-primary); }
  .logo-dot  { color: var(--accent); }
  .logo-next {
    font-size: var(--text-xs);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .menu-items {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
  }

  .menu-btn {
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font);
    font-size: var(--text-base);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .menu-btn:hover, .menu-btn.active {
    background: var(--bg-hover);
  }

  .menu-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .theme-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--text-md);
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: background var(--t-fast);
  }
  .theme-btn:hover { background: var(--bg-hover); }
</style>
