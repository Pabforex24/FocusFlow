'use client'

import { useState, useEffect } from 'react'
import { Modal, Field, inputCls, selectCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Domain, Goal } from '@/types'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba } from '@/lib/utils'

interface GoalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Goal, 'id' | 'createdAt'>) => void
  domains: Domain[]
  existing?: Goal | null
  defaultDomainId?: string
}

export function GoalModal({ open, onClose, onSave, domains, existing, defaultDomainId }: GoalModalProps) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [domainId,    setDomainId]    = useState('')
  const [deadline,    setDeadline]    = useState('')

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description || '')
      setDomainId(existing.domainId)
      setDeadline(existing.deadline || '')
    } else {
      setTitle('')
      setDescription('')
      setDomainId(defaultDomainId || '')
      setDeadline('')
    }
  }, [existing, defaultDomainId, open])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description, domainId, deadline })
    onClose()
  }

  const selectedDomain = domains.find((d) => d.id === domainId)

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Modifier l'objectif" : 'Nouvel objectif'}>
      <Field label="Titre de l'objectif">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex: Faire 30h de backtest en 1 mois"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {/* Custom domain selector with Lucide icon */}
        <Field label="Domaine">
          <div className="relative">
            <select
              className={selectCls}
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              style={selectedDomain ? { paddingLeft: '2.2rem' } : {}}
            >
              <option value="">— Choisir —</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {/* Overlay the Lucide icon on the left */}
            {selectedDomain && (
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <DomainIcon name={selectedDomain.icon} size={14} color={selectedDomain.color} />
              </div>
            )}
          </div>
        </Field>

        <Field label="Échéance">
          <input
            type="date"
            className={inputCls}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Description (optionnel)">
        <textarea
          className={inputCls + ' resize-none'}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre objectif…"
        />
      </Field>

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>
          Enregistrer
        </Button>
      </div>
    </Modal>
  )
}
