export const FOCUS_STYLE_KEY = 'focusflow-focus-style'
export const DEFAULT_FOCUS_STYLE = 'flip'

export const FOCUS_STYLES = [
  { id: 'flip', label: 'Horloge à cartes', description: 'Cartes qui se retournent', tag: 'Classique', accent: '#6fcfa4' },
  { id: 'calendar', label: 'Calendrier', description: 'Blocs avec bande de couleur', tag: 'Rétro', accent: '#9dbbe0' },
  { id: 'thin', label: 'Chiffres fins', description: 'Grands et très épurés', tag: 'Épuré', accent: '#c8ccd4' },
  { id: 'ring', label: 'Cercle de progression', description: 'L’anneau se vide', tag: 'Focus', accent: '#8fe0bc' },
  { id: 'digital', label: 'Digital lumineux', description: 'Afficheur avec halo', tag: 'Tech', accent: '#7dd3fc' },
  { id: 'minimal', label: 'Minimal', description: 'Juste le temps', tag: 'Zen', accent: '#c9a58c' },
  { id: 'aurora', label: 'Aurore boréale', description: 'Dégradé froid et halo vivant', tag: 'Coloré', accent: '#c084fc' },
  { id: 'neon', label: 'Néon nocturne', description: 'Cyan électrique sur fond sombre', tag: 'Contrasté', accent: '#22d3ee' },
  { id: 'glass', label: 'Verre givré', description: 'Cartes translucides et lumière douce', tag: 'Élégant', accent: '#a5f3fc' },
  { id: 'orbit', label: 'Orbite', description: 'Anneau dégradé et lueur orbitale', tag: 'Animé', accent: '#fbbf24' },
]

export const FOCUS_STYLE_IDS = FOCUS_STYLES.map((style) => style.id)

export function readFocusStyle() {
  try {
    const saved = localStorage.getItem(FOCUS_STYLE_KEY)
    return FOCUS_STYLE_IDS.includes(saved) ? saved : DEFAULT_FOCUS_STYLE
  } catch (error) {
    console.warn('[focus] lecture du style impossible', error)
    return DEFAULT_FOCUS_STYLE
  }
}

export function saveFocusStyle(style) {
  if (!FOCUS_STYLE_IDS.includes(style)) return
  try {
    localStorage.setItem(FOCUS_STYLE_KEY, style)
  } catch (error) {
    console.warn('[focus] sauvegarde du style impossible', error)
  }
}
