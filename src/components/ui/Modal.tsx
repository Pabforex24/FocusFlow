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
  accent?: string   // hex couleur pour le glow du titre
}

export function Modal({ open, onClose, title, children, className, accent }: ModalProps) {
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
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md animate-fade-in" />

      {/* Scroll container */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 overflow-y-auto px-3 py-8 sm:px-6 sm:py-10"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        <div
          className={cn(
            'relative mx-auto w-full animate-scale-in',
            'max-w-md',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, rgba(14, 18, 36, 0.95) 0%, rgba(9, 13, 26, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid rgba(255,255,255,0.07)`,
            borderRadius: '20px',
            boxShadow: `0 24px 80px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          {/* Accent line top */}
          <div
            className="h-px w-full rounded-t-[20px]"
            style={{
              background: accent
                ? `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`
                : 'linear-gradient(90deg, transparent 0%, rgba(0,229,176,0.6) 50%, transparent 100%)',
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4">
            <h2
              className="font-heading font-bold text-base sm:text-lg tracking-tight"
              style={accent ? { color: accent } : {}}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-content-3 hover:text-content hover:bg-bg-4 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px mx-5 sm:mx-6" style={{ background: 'rgba(255,255,255,0.05)' }} />

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
      <label className="block text-xs font-semibold text-content-3 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full bg-bg-4 border border-border text-content rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 placeholder:text-content-4 font-medium'

export const selectCls = inputCls + ' cursor-pointer'
