import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'focusflow-theme'
const PALETTE_KEY = 'focusflow-palette'
export const PALETTES = ['foret', 'walnut', 'charcoal', 'navy', 'amethyst', 'sunset', 'ocean', 'gold']
// Couleur de la barre du navigateur : dépend de la palette et du mode clair/sombre.
const THEME_COLORS = {
  foret: { light: '#F2F7F4', dark: '#050909' },
  walnut: { light: '#F6F1ED', dark: '#0A0706' },
  charcoal: { light: '#F3F4F6', dark: '#121316' },
  navy: { light: '#EEF3F9', dark: '#0A111C' },
  amethyst: { light: '#F7F1FB', dark: '#0B0613' },
  sunset: { light: '#FFF5F1', dark: '#120806' },
  ocean: { light: '#EEFAF9', dark: '#04100F' },
  gold: { light: '#FAF7EF', dark: '#080704' },
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
  const [palette, setPaletteState] = useState(readPalette) // identifiant de palette validé par PALETTES
  const [systemDark, setSystemDark] = useState(prefersDark)
  const [override, setOverride] = useState(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
  const effectiveResolved = override?.mode ?? resolved
  const effectivePalette = override?.palette ?? palette

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveResolved === 'dark')
    document.documentElement.dataset.palette = effectivePalette
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[effectivePalette][effectiveResolved])
  }, [effectiveResolved, effectivePalette])

  const setThemeOverride = useCallback((next) => {
    if (!next) return setOverride(null)
    const mode = next.mode === 'light' ? 'light' : 'dark'
    return setOverride({ mode, palette: PALETTES.includes(next.palette) ? next.palette : 'foret' })
  }, [])

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
    preference, resolved: effectiveResolved, setTheme, palette: effectivePalette, setPalette, setThemeOverride,
    toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
  }), [preference, effectiveResolved, setTheme, effectivePalette, setPalette, setThemeOverride, resolved])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
