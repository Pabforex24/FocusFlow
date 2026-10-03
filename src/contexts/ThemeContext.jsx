import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'focusflow-theme'
const PALETTE_KEY = 'focusflow-palette'
export const PALETTES = ['foret', 'walnut']
// Couleur de la barre du navigateur : dépend de la palette et du mode clair/sombre.
const THEME_COLORS = {
  foret: { light: '#F2F7F4', dark: '#050909' },
  walnut: { light: '#F6F1ED', dark: '#0A0706' },
}
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

function readPalette() {
  try {
    const saved = localStorage.getItem(PALETTE_KEY)
    return PALETTES.includes(saved) ? saved : 'foret'
  } catch (error) {
    console.warn('[theme] lecture de la palette impossible', error)
    return 'foret'
  }
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference) // 'light' | 'dark' | 'system'
  const [palette, setPaletteState] = useState(readPalette) // 'foret' | 'walnut'
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
    document.documentElement.dataset.palette = palette
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[palette][resolved])
  }, [resolved, palette])

  const setPalette = useCallback((next) => {
    if (!PALETTES.includes(next)) return
    setPaletteState(next)
    try {
      localStorage.setItem(PALETTE_KEY, next)
    } catch (error) {
      console.warn('[theme] sauvegarde de la palette impossible', error)
    }
  }, [])

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
    preference, resolved, setTheme, palette, setPalette,
    toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
  }), [preference, resolved, setTheme, palette, setPalette])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)