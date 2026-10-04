import { useEffect } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Fenêtre modale accessible :
//  - le focus entre dans la fenêtre à l'ouverture (sauf si un champ a déjà pris le focus via autoFocus) ;
//  - Tab et Maj+Tab restent dans la fenêtre ;
//  - le reste de la page devient inerte (clavier et lecteurs d'écran) ;
//  - à la fermeture, le focus retourne à l'élément qui avait ouvert la fenêtre.
export function useFocusTrap(containerRef) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const opener = document.activeElement

    if (!container.contains(document.activeElement)) {
      (container.querySelector(FOCUSABLE) ?? container).focus({ preventScroll: true })
    }

    // Rend inertes les frères du conteneur de la modale (donc toute l'application derrière).
    const root = container.closest('[data-modal-root]') ?? container
    const inerted = []
    for (const node of document.body.children) {
      if (node === root || node.contains(root) || node.hasAttribute('inert')) continue
      node.setAttribute('inert', '')
      inerted.push(node)
    }

    const onKey = (event) => {
      if (event.key !== 'Tab') return
      const items = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) { event.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      for (const node of inerted) node.removeAttribute('inert')
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [containerRef])
}
