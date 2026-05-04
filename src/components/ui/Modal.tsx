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

  // Bloquer le scroll du body quand le modal est ouvert
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
        Wrapper fixed plein écran — centre le modal verticalement et gère le
        scroll quand le contenu est plus grand que la viewport.
        ⚠️ overflow-y-auto ICI (pas sur <main> du layout) — ce conteneur est
        fixed donc il crée son propre contexte de formatage sans casser
        les autres éléments fixed.
      */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        {/*
          Modal box :
          - my-auto : centrage vertical quand le contenu est court
          - flex flex-col : permet au body de scroller indépendamment
          - max-h : empêche le modal de dépasser 90vh — le body scrolle en interne
        */}
        <div
          className={cn(
            'relative w-full bg-bg-2 border border-border-2 rounded-2xl shadow-card animate-scale-in',
            'flex flex-col my-auto',
            'max-h-[90vh]',
            'max-w-md',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — sticky en haut */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border rounded-t-2xl flex-shrink-0">
            <h2 className="font-heading font-bold text-base sm:text-lg">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          {/*
            Body scrollable — c'est lui qui scroll, pas le document.
            overflow-y-auto ici est safe car c'est un enfant du modal fixed,
            pas le conteneur principal de la page.
          */}
          <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
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
