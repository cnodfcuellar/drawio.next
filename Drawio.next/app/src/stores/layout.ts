import { writable, derived } from 'svelte/store'

export interface LayoutState {
  showSidebar: boolean
  showInspector: boolean
  showToolbar: boolean
  zenMode: boolean
}

export const STORAGE_KEY_LAYOUT = 'drawio-layout'

function loadInitialLayout(): LayoutState {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAYOUT)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          showSidebar: typeof parsed.showSidebar === 'boolean' ? parsed.showSidebar : true,
          showInspector: typeof parsed.showInspector === 'boolean' ? parsed.showInspector : true,
          showToolbar: typeof parsed.showToolbar === 'boolean' ? parsed.showToolbar : true,
          zenMode: typeof parsed.zenMode === 'boolean' ? parsed.zenMode : false
        }
      }
    } catch {
      // Ignorar error de JSON parse
    }
  }
  return {
    showSidebar: true,
    showInspector: true,
    showToolbar: true,
    zenMode: false
  }
}

function persistLayout(state: LayoutState) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(state))
    } catch {
      // Ignorar write error
    }
  }
}

function createLayoutStore() {
  const { subscribe, set, update } = writable<LayoutState>(loadInitialLayout())

  return {
    subscribe,
    set,
    update,
    toggleSidebar() {
      update((state) => {
        const next = {
          ...state,
          showSidebar: !state.showSidebar,
          zenMode: false
        }
        persistLayout(next)
        return next
      })
    },
    toggleInspector() {
      update((state) => {
        const next = {
          ...state,
          showInspector: !state.showInspector,
          zenMode: false
        }
        persistLayout(next)
        return next
      })
    },
    toggleToolbar() {
      update((state) => {
        const next = {
          ...state,
          showToolbar: !state.showToolbar
        }
        persistLayout(next)
        return next
      })
    },
    toggleZenMode() {
      update((state) => {
        const nextZen = !state.zenMode
        const next: LayoutState = nextZen
          ? {
              ...state,
              zenMode: true,
              showSidebar: false,
              showInspector: false
            }
          : {
              ...state,
              zenMode: false,
              showSidebar: true,
              showInspector: true
            }
        persistLayout(next)
        return next
      })
    },
    setSidebar(visible: boolean) {
      update((state) => {
        const next = {
          ...state,
          showSidebar: visible,
          zenMode: false
        }
        persistLayout(next)
        return next
      })
    },
    setInspector(visible: boolean) {
      update((state) => {
        const next = {
          ...state,
          showInspector: visible,
          zenMode: false
        }
        persistLayout(next)
        return next
      })
    },
    resetLayout() {
      const next: LayoutState = {
        showSidebar: true,
        showInspector: true,
        showToolbar: true,
        zenMode: false
      }
      persistLayout(next)
      set(next)
    }
  }
}

export const layout = createLayoutStore()

export const showSidebar = derived(layout, ($l) => $l.showSidebar && !$l.zenMode)
export const showInspector = derived(layout, ($l) => $l.showInspector && !$l.zenMode)
export const showToolbar = derived(layout, ($l) => $l.showToolbar)
export const zenMode = derived(layout, ($l) => $l.zenMode)
