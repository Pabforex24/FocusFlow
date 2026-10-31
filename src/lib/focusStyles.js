export const FOCUS_STYLE_KEY = 'focusflow-focus-style'
export const DEFAULT_FOCUS_STYLE = 'flip'

export const FOCUS_STYLES = [
  { id: 'flip', label: 'Horloge à cartes', description: 'Cartes qui se retournent' },
  { id: 'calendar', label: 'Calendrier', description: 'Blocs avec bande de couleur' },
  { id: 'thin', label: 'Chiffres fins', description: 'Grands et très épurés' },
  { id: 'ring', label: 'Cercle de progression', description: 'L’anneau se vide' },
  { id: 'digital', label: 'Digital lumineux', description: 'Afficheur avec halo' },
  { id: 'minimal', label: 'Minimal', description: 'Juste le temps' },
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
