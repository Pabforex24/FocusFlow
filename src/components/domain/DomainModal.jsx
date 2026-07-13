'use client'

import { useState, useEffect } from 'react'
import { Modal, Field, inputCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { cn } from '@/lib/utils'


export function DomainModal({ open, onClose, onSave, existing }: DomainModalProps) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState(DOMAIN_COLORS[0])
  const [icon,  setIcon]  = useState(DOMAIN_ICONS[0])

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setColor(existing.color)
      setIcon(existing.icon)
    } else {
      setName('')
      setColor(DOMAIN_COLORS[0])
      setIcon(DOMAIN_ICONS[0])
    }
  }, [existing, open])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), color, icon })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Modifier le domaine' : 'Créer un domaine'}
    >
      <Field label="Nom du domaine">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Trading, Sport, Études…"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </Field>

      {/* Icon picker — Lucide icons */}
      <Field label="Icône">
        <div className="grid grid-cols-7 gap-1.5 mt-1">
          {DOMAIN_ICONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              title={key}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                icon === key
                  ? 'scale-110 ring-2 ring-offset-1 ring-offset-bg-2'
                  : 'bg-bg-3 border border-border hover:bg-bg-4 hover:border-border-2'
              )}
              style={
                icon === key
                  ? { background: `${color}22`, borderColor: color, border: `2px solid ${color}` }
                  : {}
              }
            >
              <DomainIcon
                name={key}
                size={16}
                color={icon === key ? color : '#8e8eaa'}
              />
            </button>
          ))}
        </div>
      </Field>

      {/* Color picker */}
      <Field label="Couleur">
        <div className="flex flex-wrap gap-2 mt-1">
          {DOMAIN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-7 h-7 rounded-full transition-all',
                color === c
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-2 scale-110'
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>

      {/* Preview */}
      <div className="flex items-center gap-3 bg-bg-3 border border-border rounded-xl px-4 py-3 mt-1 mb-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22` }}
        >
          <DomainIcon name={icon} size={20} color={color} />
        </div>
        <span className="font-heading font-semibold text-sm text-content">
          {name || 'Nom du domaine'}
        </span>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
          Enregistrer
        </Button>
      </div>
    </Modal>
  )
}
