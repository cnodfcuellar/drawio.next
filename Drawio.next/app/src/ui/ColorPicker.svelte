<script lang="ts">
  import { onMount } from 'svelte'
  import { PALETTE_16, recentColors, addRecentColor, isValidHex, normalizeHex } from '../stores/colors'

  interface Props {
    label: string
    color: string
    onChange: (color: string) => void
    allowNone?: boolean
  }

  let { label, color, onChange, allowNone = true }: Props = $props()

  let isOpen = $state(false)
  let hexInputValue = $state('')
  let nativeColorInput: HTMLInputElement | null = $state(null)
  let containerRef: HTMLDivElement | null = $state(null)

  // Sincronizar input HEX cuando cambia la prop color
  $effect(() => {
    if (color && color !== 'none' && color !== 'transparent') {
      hexInputValue = color.replace(/^#/, '').toUpperCase()
    } else {
      hexInputValue = ''
    }
  })

  function toggleOpen() {
    isOpen = !isOpen
  }

  function close() {
    isOpen = false
  }

  function handleSelectColor(c: string) {
    onChange(c)
    addRecentColor(c)
  }

  function handleNone() {
    onChange('none')
    close()
  }

  function handleHexInput(e: Event) {
    const val = (e.target as HTMLInputElement).value.trim()
    hexInputValue = val.replace(/^#/, '').toUpperCase()
    if (isValidHex(val)) {
      const fullHex = normalizeHex(val).toUpperCase()
      onChange(fullHex)
      addRecentColor(fullHex)
    }
  }

  function handleNativeColorChange(e: Event) {
    const val = (e.target as HTMLInputElement).value.toUpperCase()
    onChange(val)
    addRecentColor(val)
  }

  function triggerNativePicker() {
    nativeColorInput?.click()
  }

  function handleClickOutside(e: MouseEvent) {
    if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
      close()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      close()
    }
  }

  onMount(() => {
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeydown)
    }
  })

  let isNone = $derived(color === 'none' || !color || color.toLowerCase() === 'transparent')
  let displayHex = $derived(isNone ? 'Sin color' : (color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`))
</script>

<div class="color-picker-wrapper" bind:this={containerRef}>
  <div class="picker-header">
    <span class="picker-label">{label}</span>
  </div>

  <!-- Barra en Reposo (Estado Cerrado) -->
  <button
    type="button"
    class="picker-trigger"
    class:active={isOpen}
    onclick={toggleOpen}
    title={`Cambiar ${label}`}
    data-testid={`color-picker-trigger-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div class="swatch-container">
      {#if isNone}
        <div class="swatch-none" title="Sin color">⊘</div>
      {:else}
        <div class="swatch-fill" style="background-color: {color};"></div>
      {/if}
    </div>

    <span class="color-value" class:is-none={isNone}>{displayHex}</span>

    <span class="dropdown-icon">{isOpen ? '▲' : '▼'}</span>
  </button>

  <!-- Menú Popover Desplegable -->
  {#if isOpen}
    <div
      class="picker-popover"
      role="dialog"
      aria-modal="false"
      tabindex="-1"
    >
      <!-- Cabecera Popover con Preview y Botón Ninguno -->
      <div class="popover-status-row">
        <div class="current-badge">
          {#if isNone}
            <div class="mini-swatch swatch-none">⊘</div>
            <span class="status-text">Ninguno</span>
          {:else}
            <div class="mini-swatch" style="background-color: {color};"></div>
            <span class="status-text font-mono">{displayHex}</span>
          {/if}
        </div>

        {#if allowNone}
          <button
            type="button"
            class="btn-none"
            class:active-none={isNone}
            onclick={handleNone}
            title="Quitar color"
          >
            <span>⊘</span> Ninguno
          </button>
        {/if}
      </div>

      <!-- 1. Paleta Oficial de 16 Colores (2 Filas x 8 Columnas) -->
      <div class="section-title">Paleta Oficial (16 colores)</div>
      <div class="palette-grid-16">
        {#each PALETTE_16 as swatch}
          {@const isActive = !isNone && color.toUpperCase() === swatch.hex.toUpperCase()}
          <button
            type="button"
            class="palette-btn"
            class:is-active={isActive}
            style="background-color: {swatch.hex};"
            title={`${swatch.name} (${swatch.hex})`}
            onclick={() => handleSelectColor(swatch.hex)}
          >
            {#if isActive}
              <span class="check-mark" style="color: {swatch.hex === '#FFFFFF' || swatch.hex === '#E2E8F0' || swatch.hex === '#FFF2CC' ? '#0F172A' : '#FFFFFF'};">✓</span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 2. Personalización: Input HEX y Selector de Espectro -->
      <div class="section-title">Personalizar (#HEX / Espectro)</div>
      <div class="custom-row">
        <div class="hex-input-box">
          <span class="hex-prefix">#</span>
          <input
            type="text"
            class="hex-input"
            placeholder="0284C7"
            maxlength="8"
            value={hexInputValue}
            oninput={handleHexInput}
            title="Escribe un código HEX"
          />
          {#if !isNone && isValidHex(color)}
            <div class="input-preview" style="background-color: {color};"></div>
          {/if}
        </div>

        <!-- Input Nativo Oculto + Botón Disparador -->
        <input
          type="color"
          class="native-color-input"
          bind:this={nativeColorInput}
          value={!isNone && isValidHex(color) ? (color.length === 7 ? color : '#0284C7') : '#0284C7'}
          oninput={handleNativeColorChange}
        />
        <button
          type="button"
          class="btn-spectrum"
          onclick={triggerNativePicker}
          title="Abrir rueda de color continua (16M de colores)"
        >
          <span class="icon">🎨</span>
          <span class="label">Espectro...</span>
        </button>
      </div>

      <!-- 3. Colores Recientes Compartidos -->
      {#if $recentColors && $recentColors.length > 0}
        <div class="section-title">Recientes</div>
        <div class="recents-row">
          {#each $recentColors as recent}
            {@const isRecentActive = !isNone && color.toUpperCase() === recent.toUpperCase()}
            <button
              type="button"
              class="recent-btn"
              class:is-active={isRecentActive}
              style="background-color: {recent};"
              title={`Reciente ${recent}`}
              onclick={() => handleSelectColor(recent)}
            ></button>
          {/each}
        </div>
      {/if}

      <!-- Pie del Popover -->
      <div class="popover-footer">
        <button type="button" class="btn-done" onclick={close}>Listo</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .color-picker-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: var(--space-2, 8px);
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .picker-label {
    font-size: var(--text-xs, 11px);
    font-weight: var(--font-semibold, 600);
    color: var(--text-secondary, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Trigger en reposo */
  .picker-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 36px;
    padding: 0 10px;
    background: var(--bg-secondary, #182234);
    border: 1px solid var(--border-color, #334155);
    border-radius: var(--radius-md, 6px);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    box-sizing: border-box;
  }

  .picker-trigger:hover {
    border-color: var(--accent, #0284c7);
    background: var(--bg-hover, #1e293b);
  }

  .picker-trigger.active {
    border-color: var(--accent, #0284c7);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent, #0284c7) 25%, transparent);
  }

  .swatch-container {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swatch-fill {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.3);
  }

  .swatch-none {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    border: 1px dashed var(--border-color, #64748b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--text-muted, #94a3b8);
    background: rgba(0, 0, 0, 0.15);
  }

  .color-value {
    flex: 1;
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary, #ffffff);
  }

  .color-value.is-none {
    font-family: inherit;
    color: var(--text-muted, #94a3b8);
    font-style: italic;
    font-weight: normal;
  }

  .dropdown-icon {
    font-size: 9px;
    color: var(--text-muted, #94a3b8);
  }

  /* Popover flotante */
  .picker-popover {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--bg-primary, #0f172a);
    border: 1px solid var(--accent, #0284c7);
    border-radius: var(--radius-lg, 10px);
    padding: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
  }

  .popover-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color, #1e293b);
    margin-bottom: 8px;
  }

  .current-badge {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mini-swatch {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .status-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary, #ffffff);
  }

  .btn-none {
    background: var(--bg-secondary, #1e293b);
    border: 1px solid var(--border-color, #334155);
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 11px;
    color: var(--text-secondary, #cbd5e1);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
  }

  .btn-none:hover,
  .btn-none.active-none {
    border-color: var(--accent, #0284c7);
    background: color-mix(in srgb, var(--accent, #0284c7) 20%, transparent);
    color: #ffffff;
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 8px;
    margin-bottom: 6px;
  }

  /* Grid 2x8 de la Paleta Oficial */
  .palette-grid-16 {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  .palette-btn {
    height: 26px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    box-sizing: border-box;
  }

  .palette-btn:hover {
    transform: scale(1.1);
    z-index: 2;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
  }

  .palette-btn.is-active {
    box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px var(--accent, #0284c7);
    z-index: 3;
  }

  .check-mark {
    font-size: 12px;
    font-weight: 900;
  }

  /* Fila de Personalización */
  .custom-row {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 8px;
  }

  .hex-input-box {
    flex: 1;
    display: flex;
    align-items: center;
    height: 30px;
    background: var(--bg-secondary, #1e293b);
    border: 1px solid var(--border-color, #334155);
    border-radius: 5px;
    padding: 0 6px;
  }

  .hex-input-box:focus-within {
    border-color: var(--accent, #0284c7);
  }

  .hex-prefix {
    font-family: var(--font-mono, monospace);
    color: var(--text-muted, #64748b);
    font-size: 12px;
    font-weight: 600;
    margin-right: 2px;
  }

  .hex-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    color: var(--text-primary, #ffffff);
    font-weight: 600;
    min-width: 0;
  }

  .input-preview {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    margin-left: 4px;
    flex-shrink: 0;
  }

  .native-color-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }

  .btn-spectrum {
    height: 30px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: color-mix(in srgb, var(--accent, #0284c7) 18%, transparent);
    border: 1px solid var(--accent, #0284c7);
    border-radius: 5px;
    color: var(--accent-text, #38bdf8);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .btn-spectrum:hover {
    background: color-mix(in srgb, var(--accent, #0284c7) 35%, transparent);
    color: #ffffff;
  }

  /* Recientes */
  .recents-row {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .recent-btn {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s ease;
  }

  .recent-btn:hover {
    transform: scale(1.15);
    z-index: 2;
  }

  .recent-btn.is-active {
    box-shadow: 0 0 0 1.5px #ffffff, 0 0 0 3px var(--accent, #0284c7);
  }

  /* Footer */
  .popover-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 6px;
    border-top: 1px solid var(--border-color, #1e293b);
  }

  .btn-done {
    background: var(--bg-secondary, #1e293b);
    border: 1px solid var(--border-color, #334155);
    border-radius: 4px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary, #ffffff);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-done:hover {
    background: var(--accent, #0284c7);
    border-color: var(--accent, #0284c7);
  }
</style>
