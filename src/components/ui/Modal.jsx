'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'


export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/*
        Wrapper de positionnement — fixed, centré, pointer-events-none
        pour que le clic sur le backdrop (au-dessus) soit géré par le div backdrop.
        PAS de overflow ici — le scroll est uniquement dans .modal-body.
      */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-16 px-4 sm:px-6 pb-6 pointer-events-none">
        <div
          className={cn(
            'relative w-full pointer-events-auto',
            'bg-bg-2 border border-border-2 rounded-2xl shadow-card animate-scale-in',
            /*
              flex flex-col + max-h-[90vh] :
              le modal ne dépasse jamais 90% de l'écran.

              SANS min-h-0 sur le body enfant, flex-1 ne se contracte pas
              et overflow-y-auto est ignoré → modal déborde.
              min-h-0 est la clé qui rend le scroll interne opérationnel.
            */
            'flex flex-col max-h-[90vh]',
            'max-w-md',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — ne scroll jamais, flex-shrink-0 */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border rounded-t-2xl">
            <h2 className="font-heading font-bold text-base sm:text-lg">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          {/*
            Body scrollable.
            flex-1   → prend tout l'espace restant après le header
            min-h-0  → INDISPENSABLE : sans ça, un enfant flex ne peut pas
                       se contracter en dessous de sa taille naturelle,
                       donc overflow-y-auto n'a aucun effet
            overflow-y-auto → scroll uniquement quand ça dépasse
          */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}


export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={cn('mb-4', className)}>
      <label className="block text-xs font-medium text-content-2 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full bg-bg-3 border border-border text-content rounded-xl px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-content-4'

export const selectCls = inputCls + ' cursor-pointer'
