'use client'

import { useState, useEffect } from 'react'
import { Modal, Field, inputCls, selectCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Domain, Goal } from '@/types'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { useStore } from '@/store'
import { CHALLENGE_CATALOGUE } from '@/store'

interface GoalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Goal, 'id' | 'createdAt'>) => void
  domains: Domain[]
  existing?: Goal | null
  defaultDomainId?: string
}

export function GoalModal({ open, onClose, onSave, domains, existing, defaultDomainId }: GoalModalProps) {
  const { customChallenges, activeChallenges } = useStore()
  const allChallenges = [...CHALLENGE_CATALOGUE, ...(customChallenges || [])]

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [domainId,    setDomainId]    = useState('')
  const [deadline,    setDeadline]    = useState('')
  const [challengeId, setChallengeId] = useState('')

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description || '')
      setDomainId(existing.domainId)
      setDeadline(existing.deadline || '')
      setChallengeId(existing.challengeId || '')
    } else {
      setTitle('')
      setDescription('')
      setDomainId(defaultDomainId || '')
      setDeadline('')
      setChallengeId('')
    }
  }, [existing, defaultDomainId, open])

  const linkedToChallenge = !!challengeId

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description,
      domainId,
      deadline: linkedToChallenge ? undefined : deadline,
      challengeId: challengeId || undefined,
    })
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Échéance ou lien challenge */}
        {!linkedToChallenge ? (
          <Field label="Échéance">
            <input
              type="date"
              className={inputCls}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
        ) : (
          <Field label="Challenge lié">
            <select
              className={selectCls}
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
            >
              <option value="">— Aucun —</option>
              {allChallenges.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* Toggle : lier à un challenge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (linkedToChallenge) setChallengeId('')
            else setDeadline('')
          }}
          className="flex items-center gap-2 text-xs text-content-3 hover:text-accent transition-colors"
        >
          <span className={`w-8 h-4 rounded-full relative transition-colors ${linkedToChallenge ? 'bg-accent' : 'bg-bg-4'}`}>
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${linkedToChallenge ? 'left-4' : 'left-0.5'}`} />
          </span>
          {linkedToChallenge ? 'Lié à un challenge' : 'Lier à un challenge'}
        </button>
        {linkedToChallenge && !challengeId && (
          <select
            className={selectCls + ' flex-1 text-xs'}
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
          >
            <option value="">— Choisir un challenge —</option>
            {allChallenges.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        )}
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
