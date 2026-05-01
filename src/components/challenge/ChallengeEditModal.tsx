'use client'

import { useState, useEffect } from 'react'
import { Challenge, ChallengeBlueprint, DOMAIN_COLORS, DOMAIN_ICONS, FrequencyType } from '@/types'
import { useStore } from '@/store'
import { Modal, Field, inputCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba, cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, Zap, Calendar } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface ChallengeEditModalProps {
  open: boolean
  onClose: () => void
  existing?: Challenge | null
}

const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_BLUEPRINT = (): ChallengeBlueprint => ({
  id: uid(),
  title: '',
  domainId: '',
  duration: '30min',
  frequency: 'daily',
  customDays: [],
})

const FREQ_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily',    label: 'Chaque jour'    },
  { value: 'workdays', label: 'Jours ouvrables' },
  { value: 'weekend',  label: 'Week-end'        },
  { value: 'custom',   label: 'Personnalisé'    },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function ChallengeEditModal({ open, onClose, existing }: ChallengeEditModalProps) {
  const { domains, addCustomChallenge, updateCustomChallenge } = useStore()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [deadline,    setDeadline]    = useState(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
  const [color,       setColor]       = useState(DOMAIN_COLORS[0])
  const [icon,        setIcon]        = useState(DOMAIN_ICONS[0])
  const [blueprints,  setBlueprints]  = useState<ChallengeBlueprint[]>([DEFAULT_BLUEPRINT()])

  useEffect(() => {
    if (!open) return
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      // Si le challenge a une deadline explicite, l'utiliser ; sinon calculer depuis durationDays
      if (existing.deadline) {
        setDeadline(existing.deadline)
      } else {
        setDeadline(format(addDays(new Date(), existing.durationDays), 'yyyy-MM-dd'))
      }
      setColor(existing.color)
      setIcon(existing.icon)
      setBlueprints(existing.blueprints.map((bp) => ({
        ...bp,
        frequency: bp.frequency || 'daily',
        customDays: bp.customDays || [],
      })))
    } else {
      setTitle('')
      setDescription('')
      setDeadline(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
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

  const toggleCustomDay = (bpId: string, day: number) => {
    setBlueprints((b) => b.map((x) => {
      if (x.id !== bpId) return x
      const days = x.customDays || []
      return { ...x, customDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day] }
    }))
  }

  // Calcul du nombre de jours entre aujourd'hui et l'échéance
  const durationDays = Math.max(1, Math.round(
    (new Date(deadline).getTime() - new Date().setHours(0,0,0,0)) / 86400000
  ))

  const canSave = title.trim() && blueprints.length > 0 && blueprints.every((b) => b.title.trim())

  const handleSave = () => {
    if (!canSave) return
    const data: Omit<Challenge, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      durationDays,
      deadline,
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
      className="max-w-lg"
    >
      <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-1">

        {/* Titre */}
        <Field label="Titre du challenge">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Trader Discipline…"
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

        {/* Échéance */}
        <Field label="Échéance">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-3 pointer-events-none" />
              <input
                type="date"
                className={inputCls}
                style={{ paddingLeft: '2.2rem' }}
                value={deadline}
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div
              className="min-w-[72px] text-center text-sm font-bold px-3 py-2 rounded-xl whitespace-nowrap"
              style={{ background: hexToRgba(color, 0.15), color }}
            >
              {durationDays}j
            </div>
          </div>
        </Field>

        {/* Icône */}
        <Field label="Icône">
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {DOMAIN_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
                  icon === key ? 'scale-110' : 'bg-bg-3 border border-border hover:bg-bg-4'
                )}
                style={icon === key ? { background: hexToRgba(color, 0.2), border: `2px solid ${color}` } : {}}
              >
                <DomainIcon name={key} size={14} color={icon === key ? color : '#55556e'} />
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
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-2 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(color, 0.2) }}>
            <DomainIcon name={icon} size={18} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-content truncate">{title || 'Titre du challenge'}</p>
            <p className="text-[10px]" style={{ color }}>Échéance : {deadline || '—'} · {durationDays} jours</p>
          </div>
        </div>

        {/* Blueprints / Tâches */}
        <Field label="Tâches récurrentes">
          <div className="space-y-3">
            {blueprints.map((bp, i) => (
              <div key={bp.id} className="bg-bg-3 border border-border rounded-xl p-3 space-y-2">
                {/* Ligne titre + durée + suppression */}
                <div className="flex items-center gap-2">
                  <GripVertical size={13} className="text-content-4 flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-sm text-content outline-none placeholder:text-content-4 min-w-0"
                    value={bp.title}
                    onChange={(e) => updateBlueprint(bp.id, { title: e.target.value })}
                    placeholder={`Tâche ${i + 1}…`}
                  />
                  <input
                    className="w-14 bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1 outline-none text-center"
                    value={bp.duration}
                    onChange={(e) => updateBlueprint(bp.id, { duration: e.target.value })}
                    placeholder="30min"
                  />
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

                {/* Domaine + Fréquence */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    className="flex-1 min-w-[100px] bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                    value={bp.domainId}
                    onChange={(e) => updateBlueprint(bp.id, { domainId: e.target.value })}
                  >
                    <option value="">Domaine…</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    className="flex-1 min-w-[130px] bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                    value={bp.frequency || 'daily'}
                    onChange={(e) => updateBlueprint(bp.id, { frequency: e.target.value as FrequencyType, customDays: [] })}
                  >
                    {FREQ_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Jours personnalisés */}
                {bp.frequency === 'custom' && (
                  <div className="flex gap-1 flex-wrap">
                    {DAY_LABELS.map((label, idx) => {
                      const active = (bp.customDays || []).includes(idx)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleCustomDay(bp.id, idx)}
                          className={cn(
                            'px-2 py-1 rounded-lg text-[11px] font-bold border transition-all',
                            active
                              ? 'text-white border-transparent'
                              : 'bg-bg-5 border-border text-content-3'
                          )}
                          style={active ? { background: color, borderColor: color } : {}}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addBlueprint}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-content-3 hover:text-content border border-dashed border-border-2 hover:border-border-3 rounded-xl py-2.5 transition-all"
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
