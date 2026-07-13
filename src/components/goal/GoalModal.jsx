'use client'

import { useState, useEffect } from 'react'
import { Modal, Field, inputCls, selectCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'


const UNIT_SUGGESTIONS = ['heures', 'séances', 'km', 'pages', 'modules', 'projets', '']

export function GoalModal({
  open, onClose, onSave, domains, existing, defaultDomainId, challenges = [],
}: GoalModalProps) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [domainId,    setDomainId]    = useState('')
  const [unit,        setUnit]        = useState('')

  useEffect(() => {
    if (!open) return
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description || '')
      setDomainId(existing.domainId)
      setUnit(existing.unit || '')
    } else {
      setTitle('')
      setDescription('')
      setDomainId(defaultDomainId || '')
      setUnit('')
    }
  }, [existing, defaultDomainId, open])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description, domainId, unit })
    onClose()
  }

  const selectedDomain = domains.find((d) => d.id === domainId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Modifier l'objectif" : 'Nouvel objectif'}
    >
      {/* Titre */}
      <Field label="Titre de l'objectif">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex: 30h de backtest, 20 séances de sport…"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {/* Domaine */}
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
            {selectedDomain && (
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <DomainIcon name={selectedDomain.icon} size={14} color={selectedDomain.color} />
              </div>
            )}
          </div>
        </Field>

        {/* Unité (optionnel) */}
        <Field label="Unité (optionnel)">
          <input
            className={inputCls}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="heures, séances, km…"
            list="unit-suggestions"
          />
          <datalist id="unit-suggestions">
            {UNIT_SUGGESTIONS.filter(Boolean).map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
      </div>

      {/* Description */}
      <Field label="Description (optionnel)">
        <textarea
          className={inputCls + ' resize-none'}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre objectif…"
        />
      </Field>

      {/* Info — pas d'échéance */}
      <p className="text-[11px] text-content-3 bg-bg-3 rounded-xl px-3 py-2 border border-border">
        💡 Un objectif représente une cible globale (ex: "30h de backtest").
        La progression est calculée automatiquement depuis vos tâches complétées.
      </p>

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>
          Enregistrer
        </Button>
      </div>
    </Modal>
  )
}
