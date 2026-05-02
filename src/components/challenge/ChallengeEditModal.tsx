'use client'

import { useState, useEffect } from 'react'
import { Challenge, ChallengeBlueprint, DOMAIN_COLORS, DOMAIN_ICONS, FrequencyType } from '@/types'
import { useStore } from '@/store'
import { Modal, Field, inputCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba, cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, Zap, Calendar, Target } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface ChallengeEditModalProps {
  open: boolean
  onClose: () => void
  existing?: Challenge | null
}

const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_BP = (): ChallengeBlueprint => ({
  id: uid(), title: '', domainId: '', goalId: '', duration: '30min', frequency: 'daily', customDays: [],
})

const FREQ_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily',    label: 'Chaque jour'    },
  { value: 'workdays', label: 'Jours ouvrables' },
  { value: 'weekend',  label: 'Week-end'        },
  { value: 'custom',   label: 'Personnalisé'    },
]
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function ChallengeEditModal({ open, onClose, existing }: ChallengeEditModalProps) {
  const { domains, goals, addCustomChallenge, updateCustomChallenge } = useStore()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [deadline,    setDeadline]    = useState(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
  const [color,       setColor]       = useState(DOMAIN_COLORS[0])
  const [icon,        setIcon]        = useState(DOMAIN_ICONS[0])
  const [blueprints,  setBlueprints]  = useState<ChallengeBlueprint[]>([DEFAULT_BP()])

  useEffect(() => {
    if (!open) return
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      setDeadline(existing.deadline || format(addDays(new Date(), existing.durationDays), 'yyyy-MM-dd'))
      setColor(existing.color)
      setIcon(existing.icon)
      setBlueprints(existing.blueprints.map((bp) => ({ ...bp, frequency: bp.frequency || 'daily', customDays: bp.customDays || [] })))
    } else {
      setTitle(''); setDescription('')
      setDeadline(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
      setColor(DOMAIN_COLORS[0]); setIcon(DOMAIN_ICONS[0])
      setBlueprints([DEFAULT_BP()])
    }
  }, [open, existing])

  const durationDays = Math.max(1, Math.round(
    (new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
  ))

  const addBP    = () => setBlueprints((b) => [...b, DEFAULT_BP()])
  const removeBP = (id: string) => setBlueprints((b) => b.filter((x) => x.id !== id))
  const updateBP = (id: string, patch: Partial<ChallengeBlueprint>) =>
    setBlueprints((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const toggleDay = (bpId: string, day: number) =>
    setBlueprints((b) => b.map((x) => {
      if (x.id !== bpId) return x
      const days = x.customDays || []
      return { ...x, customDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day] }
    }))

  // Filtrer les objectifs selon le domaine sélectionné du blueprint
  const goalsForDomain = (domainId: string) => goals.filter((g) => !domainId || g.domainId === domainId)

  const canSave = title.trim() && blueprints.length > 0 && blueprints.every((b) => b.title.trim())

  const handleSave = () => {
    if (!canSave) return
    const data: Omit<Challenge, 'id'> = {
      title: title.trim(), description: description.trim(),
      durationDays, deadline, color, icon, blueprints,
    }
    existing ? updateCustomChallenge(existing.id, data) : addCustomChallenge(data)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Modifier le challenge' : 'Créer un challenge'}
      className="max-w-lg"
    >
      <div className="space-y-4 overflow-y-auto max-h-[78vh] pr-0.5">

        {/* Titre */}
        <Field label="Titre du challenge">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Trader Discipline 30J…" autoFocus />
        </Field>

        {/* Description */}
        <Field label="Description (optionnel)">
          <textarea className={inputCls + ' resize-none h-14'} value={description}
            onChange={(e) => setDescription(e.target.value)} placeholder="Décris l'objectif du challenge…" />
        </Field>

        {/* Échéance */}
        <Field label="Échéance">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-3 pointer-events-none" />
              <input type="date" className={inputCls} style={{ paddingLeft: '2.2rem' }}
                value={deadline} min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="min-w-[56px] text-center text-sm font-bold px-3 py-2 rounded-xl"
              style={{ background: hexToRgba(color, 0.15), color }}>
              {durationDays}j
            </div>
          </div>
        </Field>

        {/* Icône + couleur */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Icône">
            <div className="grid grid-cols-7 gap-1">
              {DOMAIN_ICONS.map((key) => (
                <button key={key} type="button" onClick={() => setIcon(key)}
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                    icon === key ? 'scale-110' : 'bg-bg-3 border border-border hover:bg-bg-4')}
                  style={icon === key ? { background: hexToRgba(color, 0.2), border: `2px solid ${color}` } : {}}
                >
                  <DomainIcon name={key} size={13} color={icon === key ? color : '#55556e'} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Couleur">
            <div className="flex flex-wrap gap-2">
              {DOMAIN_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-all',
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-2 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105')}
                  style={{ background: c }} />
              ))}
            </div>
          </Field>
        </div>

        {/* Aperçu */}
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border"
          style={{ background: hexToRgba(color, 0.08), borderColor: color + '40' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: hexToRgba(color, 0.2) }}>
            <DomainIcon name={icon} size={18} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-content truncate">{title || 'Titre du challenge'}</p>
            <p className="text-[10px]" style={{ color }}>Échéance : {deadline} · {durationDays}j</p>
          </div>
        </div>

        {/* Tâches / Blueprints */}
        <Field label="Tâches par objectif">
          <div className="space-y-3">
            {blueprints.map((bp, i) => (
              <div key={bp.id} className="bg-bg-3 border border-border rounded-xl p-3 space-y-2.5">

                {/* Ligne 1 : titre + durée + suppression */}
                <div className="flex items-center gap-2">
                  <GripVertical size={13} className="text-content-4 flex-shrink-0" />
                  <input className="flex-1 bg-transparent text-sm text-content outline-none placeholder:text-content-4 min-w-0"
                    value={bp.title} onChange={(e) => updateBP(bp.id, { title: e.target.value })}
                    placeholder={`Titre de la tâche ${i + 1}…`} />
                  <input className="w-14 bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1 outline-none text-center"
                    value={bp.duration} onChange={(e) => updateBP(bp.id, { duration: e.target.value })} placeholder="30min" />
                  {blueprints.length > 1 && (
                    <button type="button" onClick={() => removeBP(bp.id)}
                      className="text-content-4 hover:text-danger transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Ligne 2 : Domaine */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-content-3 mb-1">Domaine</p>
                    <select className="w-full bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                      value={bp.domainId}
                      onChange={(e) => updateBP(bp.id, { domainId: e.target.value, goalId: '' })}>
                      <option value="">— Choisir —</option>
                      {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-content-3 mb-1">Fréquence</p>
                    <select className="w-full bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                      value={bp.frequency || 'daily'}
                      onChange={(e) => updateBP(bp.id, { frequency: e.target.value as FrequencyType, customDays: [] })}>
                      {FREQ_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Objectif lié */}
                <div>
                  <p className="text-[10px] text-content-3 mb-1 flex items-center gap-1">
                    <Target size={9} /> Objectif lié
                  </p>
                  <select className="w-full bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                    value={bp.goalId}
                    onChange={(e) => updateBP(bp.id, { goalId: e.target.value })}>
                    <option value="">— Aucun objectif —</option>
                    {goalsForDomain(bp.domainId).map((g) => (
                      <option key={g.id} value={g.id}>{g.title}{g.unit ? ` (${g.unit})` : ''}</option>
                    ))}
                  </select>
                  {bp.domainId && goalsForDomain(bp.domainId).length === 0 && (
                    <p className="text-[10px] text-warning mt-1">
                      Aucun objectif dans ce domaine. Créez-en un dans la page Objectifs.
                    </p>
                  )}
                </div>

                {/* Jours personnalisés */}
                {bp.frequency === 'custom' && (
                  <div className="flex gap-1 flex-wrap">
                    {DAY_LABELS.map((label, idx) => {
                      const active = (bp.customDays || []).includes(idx)
                      return (
                        <button key={idx} type="button" onClick={() => toggleDay(bp.id, idx)}
                          className={cn('px-2 py-1 rounded-lg text-[11px] font-bold border transition-all',
                            active ? 'text-white border-transparent' : 'bg-bg-5 border-border text-content-3')}
                          style={active ? { background: color, borderColor: color } : {}}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addBP}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-content-3 hover:text-content border border-dashed border-border-2 hover:border-border-3 rounded-xl py-2.5 transition-all">
              <Plus size={13} /> Ajouter une tâche
            </button>
          </div>
        </Field>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button size="sm" className="flex-1 font-bold border"
            style={canSave ? {
              background: hexToRgba(color, 0.15),
              borderColor: color + '60',
              color,
              boxShadow: `0 0 12px ${color}30`,
            } : {}}
            disabled={!canSave} onClick={handleSave}>
            <Zap size={13} />
            {existing ? 'Enregistrer' : 'Créer le challenge'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
