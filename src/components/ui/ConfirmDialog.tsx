'use client'

import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
      <div className="flex gap-3 mb-5">
        {danger && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-danger" />
          </div>
        )}
        <p className="text-sm text-content-2 leading-relaxed">{description}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => { onConfirm(); onClose() }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
