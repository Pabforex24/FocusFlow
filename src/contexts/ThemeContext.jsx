import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'focusflow-theme'
const THEME_COLORS = { light: '#F2F7F4', dark: '#050909' }
const ThemeContext = createContext(null)

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch (error) {
    console.warn('[theme] lecture de la préférence impossible', error)
    return 'system'
  }
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference) // 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = useState(prefersDark)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved])
  }, [resolved])

  const setTheme = useCallback((next) => {
    setPreference(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch (error) {
      console.warn('[theme] sauvegarde de la préférence impossible', error)
    }
  }, [])

  const value = useMemo(() => ({
    preference, resolved, setTheme,
    toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
  }), [preference, resolved, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
