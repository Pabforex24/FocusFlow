import { ChevronRight, Plus, Timer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../Modal.jsx'
import { CREATE_ACTIONS, MOBILE_LEFT, MOBILE_RIGHT, NAV_ITEMS } from './navigation.js'
import { useFocus } from '../../contexts/FocusContext.jsx'

function SheetRow({ icon: Icon, label, hint, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-2 active:scale-[0.99]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <ChevronRight className="size-4 text-subtle" aria-hidden />
    </button>
  )
}

// Même contenu et mêmes actions sur mobile, tablette et desktop.
// La modale est une feuille en bas sur mobile et une fenêtre centrée sur grand écran.
export default function QuickActionsModal({ open, onClose }) {
  const navigate = useNavigate()
  const { openPicker } = useFocus()
  const shown = new Set([...MOBILE_LEFT, ...MOBILE_RIGHT])
  const explore = NAV_ITEMS.filter((item) => !shown.has(item.to))

  const go = (to) => { onClose(); navigate(to) }
  const startFocus = () => { onClose(); openPicker() }

  if (!open) return null

  return (
    <Modal title="Que voulez-vous faire ?" icon={Plus} onClose={onClose}>
      <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-subtle uppercase">Créer</p>
      {CREATE_ACTIONS.map((action) => <SheetRow key={action.to} {...action} onClick={() => go(action.to)} />)}
      <p className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wide text-subtle uppercase">Démarrer</p>
      <SheetRow icon={Timer} label="Focus" hint="Un minuteur, une tâche, zéro distraction" onClick={startFocus} />
      <p className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wide text-subtle uppercase">Explorer</p>
      {explore.map((item) => <SheetRow key={item.to} icon={item.icon} label={item.label} onClick={() => go(item.to)} />)}
    </Modal>
  )
}
