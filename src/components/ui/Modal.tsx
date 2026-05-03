'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

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
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/*
        Scroll container :
        - fixed inset-0 : couvre tout l'écran
        - overflow-y-auto : scroll si le modal est plus grand que l'écran
        - z-50 : au-dessus du backdrop
        - px/py : marges extérieures
      */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 overflow-y-auto px-3 py-8 sm:px-6 sm:py-12"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        {/*
          Modal box :
          - mx-auto : centré horizontalement
          - max-w contrôlé par className
          - PAS de centrage vertical flex → le modal commence toujours en haut
            avec le padding du conteneur (py-8 / py-12)
        */}
        <div
          className={cn(
            'relative mx-auto w-full bg-bg-2 border border-border-2 rounded-2xl shadow-card animate-scale-in',
            'max-w-md',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border rounded-t-2xl">
            <h2 className="font-heading font-bold text-base sm:text-lg">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

interface FieldProps {
  label: string
  children: React.ReactNode
  className?: string
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
