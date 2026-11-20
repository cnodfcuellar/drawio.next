import { writable } from 'svelte/store'

export type Theme = 'dark' | 'light'

function createThemeStore() {
  const stored = (typeof localStorage !== 'undefined'
    ? localStorage.getItem('drawio-theme')
    : null) as Theme | null

  const { subscribe, set, update } = writable<Theme>(stored ?? 'dark')

  return {
    subscribe,
    toggle() {
      update((current) => {
        const next: Theme = current === 'dark' ? 'light' : 'dark'
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('drawio-theme', next)
        }
        return next
      })
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
