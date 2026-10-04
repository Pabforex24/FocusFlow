import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui/Button.jsx'
import { registerServiceWorker } from '../lib/pwa.js'

// Bandeau « Nouvelle version disponible ». Au-dessus de la barre de navigation mobile.
export default function UpdatePrompt() {
  const [apply, setApply] = useState(null)

  useEffect(() => { registerServiceWorker((fn) => setApply(() => fn)) }, [])

  if (!apply) return null
  return (
    <div role="status" className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 shadow-pop md:right-6 md:bottom-6 md:left-auto md:mx-0">
      <p className="min-w-0 flex-1 text-sm font-medium text-fg">Une nouvelle version de FocusFlow est disponible.</p>
      <Button size="sm" icon={RefreshCw} onClick={apply}>Actualiser</Button>
    </div>
  )
}
