import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Modal from '../Modal.jsx'
import { Button } from './Button.jsx'

// Confirmation avant toute action destructive.
export function ConfirmDialog({ title, message, confirmLabel = 'Supprimer', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false) }
  }
  return (
    <Modal title={title} icon={TriangleAlert} tone="danger" size="sm" onClose={onCancel}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Annuler</Button>
        <Button variant="danger" onClick={confirm} loading={busy}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
