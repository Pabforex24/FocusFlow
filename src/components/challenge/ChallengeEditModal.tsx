'use client'

import { useState, useEffect } from 'react'
import { Challenge, ChallengeBlueprint, DOMAIN_COLORS, DOMAIN_ICONS } from '@/types'
import { useStore } from '@/store'
import { Modal, Field, inputCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba, cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, Zap } from 'lucide-react'

interface ChallengeEditModalProps {
  open: boolean
  onClose: () => void
  existing?: Challenge | null   // null = création
}

const DEFAULT_BLUEPRINT = (): Omit<ChallengeBlueprint, 'id'> & { id: string } => ({
  id: Math.random().toString(36).slice(2),
  title: '',
  domainId: '',
  duration: '30min',
})

export function ChallengeEditModal({ open, onClose, existing }: ChallengeEditModalProps) {
  const { domains, addCustomChallenge, updateCustomChallenge } = useStore()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [durationDays,setDurationDays]= useState(21)
  const [color,       setColor]       = useState(DOMAIN_COLORS[0])
  const [icon,        setIcon]        = useState(DOMAIN_ICONS[0])
  const [blueprints,  setBlueprints]  = useState<ChallengeBlueprint[]>([])

  useEffect(() => {
    if (!open) return
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      setDurationDays(existing.durationDays)
      setColor(existing.color)
      setIcon(existing.icon)
      setBlueprints(existing.blueprints)
    } else {
      setTitle('')
      setDescription('')
      setDurationDays(21)
      setColor(DOMAIN_COLORS[0])
      setIcon(DOMAIN_ICONS[0])
      setBlueprints([DEFAULT_BLUEPRINT()])
    }
  }, [open, existing])

  const addBlueprint = () =>
    setBlueprints((b) => [...b, DEFAULT_BLUEPRINT()])

  const removeBlueprint = (id: string) =>
    setBlueprints((b) => b.filter((x) => x.id !== id))

  const updateBlueprint = (id: string, patch: Partial<ChallengeBlueprint>) =>
    setBlueprints((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const canSave = title.trim() && blueprints.length > 0 && blueprints.every((b) => b.title.trim())

  const handleSave = () => {
    if (!canSave) return
    const data: Omit<Challenge, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      durationDays,
      color,
      icon,
      blueprints,
    }
    if (existing) {
      updateCustomChallenge(existing.id, data)
    } else {
      addCustomChallenge(data)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Modifier le challenge' : 'Créer un challenge'}
      className="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4">

        {/* Titre */}
        <Field label="Titre du challenge">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Trader Discipline 30J…"
            autoFocus
          />
        </Field>

        {/* Description */}
        <Field label="Description (optionnel)">
          <textarea
            className={inputCls + ' resize-none h-16'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris l'objectif du challenge…"
          />
        </Field>

        {/* Durée */}
        <Field label="Durée">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={3}
              max={90}
              step={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
              style={{ accentColor: color }}
            />
            <div
              className="min-w-[64px] text-center text-sm font-bold px-3 py-1.5 rounded-lg"
              style={{ background: hexToRgba(color, 0.15), color }}
            >
              {durationDays}j
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-content-4 mt-1 px-0.5">
            <span>3 jours</span><span>1 mois</span><span>3 mois</span>
          </div>
        </Field>

        {/* Icône */}
        <Field label="Icône">
          <div className="grid grid-cols-7 gap-1.5">
            {DOMAIN_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                  icon === key
                    ? 'scale-110'
                    : 'bg-bg-3 border border-border hover:bg-bg-4 hover:border-border-2'
                )}
                style={icon === key
                  ? { background: hexToRgba(color, 0.2), border: `2px solid ${color}` }
                  : {}
                }
              >
                <DomainIcon name={key} size={15} color={icon === key ? color : '#55556e'} />
              </button>
            ))}
          </div>
        </Field>

        {/* Couleur */}
        <Field label="Couleur">
          <div className="flex flex-wrap gap-2">
            {DOMAIN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all',
                  color === c
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-2 scale-110'
                    : 'hover:scale-105 opacity-60 hover:opacity-100'
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>

        {/* Aperçu */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 border"
          style={{ background: hexToRgba(color, 0.08), borderColor: color + '40' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: hexToRgba(color, 0.2) }}
          >
            <DomainIcon name={icon} size={18} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-content truncate">
              {title || 'Titre du challenge'}
            </p>
            <p className="text-[10px]" style={{ color }}>
              {durationDays} jours
            </p>
          </div>
        </div>

        {/* Blueprints */}
        <Field label="Tâches quotidiennes">
          <div className="space-y-2">
            {blueprints.map((bp, i) => (
              <div key={bp.id} className="flex items-center gap-2 bg-bg-3 border border-border rounded-xl px-3 py-2">
                <GripVertical size={13} className="text-content-4 flex-shrink-0" />

                <input
                  className="flex-1 bg-transparent text-sm text-content outline-none placeholder:text-content-4 min-w-0"
                  value={bp.title}
                  onChange={(e) => updateBlueprint(bp.id, { title: e.target.value })}
                  placeholder={`Tâche ${i + 1}…`}
                />

                <input
                  className="w-16 bg-transparent text-xs text-content-2 outline-none text-right placeholder:text-content-4"
                  value={bp.duration}
                  onChange={(e) => updateBlueprint(bp.id, { duration: e.target.value })}
                  placeholder="30min"
                />

                <select
                  className="w-24 bg-bg-4 border border-border rounded-lg text-[10px] text-content-2 px-1.5 py-1 outline-none"
                  value={bp.domainId}
                  onChange={(e) => updateBlueprint(bp.id, { domainId: e.target.value })}
                >
                  <option value="">Domaine</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                {blueprints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlueprint(bp.id)}
                    className="text-content-4 hover:text-danger transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addBlueprint}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-content-3 hover:text-content border border-dashed border-border-2 hover:border-border-3 rounded-xl py-2 transition-all"
            >
              <Plus size={13} /> Ajouter une tâche
            </button>
          </div>
        </Field>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            size="sm"
            className="flex-1 font-bold border"
            style={canSave ? {
              background: hexToRgba(color, 0.15),
              borderColor: color + '60',
              color,
              boxShadow: `0 0 12px ${color}30`,
            } : {}}
            disabled={!canSave}
            onClick={handleSave}
          >
            <Zap size={13} />
            {existing ? 'Enregistrer' : 'Créer le challenge'}
          </Button>
        </div>

      </div>
    </Modal>
  )
}
