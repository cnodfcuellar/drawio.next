import { writable } from 'svelte/store'

export type Theme = 'dark' | 'light'

function createThemeStore() {
  const stored = (typeof localStorage !== 'undefined'
    ? localStorage.getItem('drawio-theme')
    : null) as Theme | null

  const { subscribe, set } = writable<Theme>(stored ?? 'dark')

  return {
    subscribe,
    toggle() {
      set((current: Theme) => {
        const next: Theme = current === 'dark' ? 'light' : 'dark'
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('drawio-theme', next)
        }
        return next
      } as unknown as Theme)
    },
    setTheme(t: Theme) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('drawio-theme', t)
      }
      set(t)
    }
  }
}

export const theme = createThemeStore()
