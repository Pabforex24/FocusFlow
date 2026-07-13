'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * PWAHandler — Fix navigation iOS en mode standalone
 * ────────────────────────────────────────────────────
 * Sur iOS en mode PWA (ajouté à l'écran d'accueil), les clics sur <a> qui
 * pointent vers le même domaine ouvrent Safari au lieu de rester dans l'app.
 * Ce composant intercepte tous les clics sur des liens internes et utilise
 * le router Next.js pour naviguer, gardant l'utilisateur dans la PWA.
 */
export function PWAHandler() {
  const router = useRouter()

  useEffect(() => {
    // Détecter si on est en mode standalone (PWA installée)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator ).standalone === true)

    if (!isStandalone) return

    const handleClick = (e: MouseEvent) => {
      const target = (e.target ).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href) return

      // Ignorer les liens externes, les ancres, et les liens avec target
      if (
        href.startsWith('http') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        href.startsWith('#') ||
        target.getAttribute('target') === '_blank'
      ) return

      // Intercepter les liens internes → router Next.js
      e.preventDefault()
      router.push(href)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [router])

  return null
}
