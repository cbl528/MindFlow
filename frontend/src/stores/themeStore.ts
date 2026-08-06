import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('mf_theme', theme)
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('mf_theme') as Theme) || 'light',
  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    apply(next)
    set({ theme: next })
  },
  setTheme: (theme) => {
    apply(theme)
    set({ theme })
  },
}))

/** 初始化主题（在 React 渲染前调用，避免闪烁） */
export function initTheme() {
  const saved = (localStorage.getItem('mf_theme') as Theme) || 'light'
  apply(saved)
  useThemeStore.setState({ theme: saved })
}
