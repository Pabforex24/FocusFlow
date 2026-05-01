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

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-md bg-bg-2 border border-border-2 rounded-2xl p-6 shadow-card animate-scale-in',
          className
        )}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Form field wrapper ────────────────────────────────────────────────────────
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

// ── Shared input styles (use with className on native inputs) ─────────────────
export const inputCls =
  'w-full bg-bg-3 border border-border text-content rounded-xl px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-content-4'

export const selectCls = inputCls + ' cursor-pointer'
