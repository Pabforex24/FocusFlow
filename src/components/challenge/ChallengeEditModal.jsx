'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { Modal, Field, inputCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba, cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, Zap, Calendar, Target, AlertCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'


const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_BP = () => ({
  id: uid(), title: '', domainId: '', goalId: '', duration: '30min', frequency: 'daily', customDays: [],
})

const FREQ_OPTIONS = [
  { value: 'daily',    label: 'Chaque jour'    },
  { value: 'workdays', label: 'Jours ouvrables' },
  { value: 'weekend',  label: 'Week-end'        },
  { value: 'custom',   label: 'Personnalisé'    },
]
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function ChallengeEditModal({ open, onClose, existing }) {
  const { domains, goals, addCustomChallenge, updateCustomChallenge, updateCatalogueChallenge } = useStore()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [deadline,    setDeadline]    = useState(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
  const [color,       setColor]       = useState(DOMAIN_COLORS[0])
  const [icon,        setIcon]        = useState(DOMAIN_ICONS[0])
  const [blueprints,  setBlueprints]  = useState([DEFAULT_BP()])
  const [submitted,   setSubmitted]   = useState(false)

  useEffect(() => {
    if (!open) { setSubmitted(false); return }
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      setDeadline(existing.deadline || format(addDays(new Date(), existing.durationDays), 'yyyy-MM-dd'))
      setColor(existing.color)
      setIcon(existing.icon)
      setBlueprints(existing.blueprints.map((bp) => ({
        ...bp, frequency: bp.frequency || 'daily', customDays: bp.customDays || [],
      })))
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

  const titleMissing = !title.trim()
  const bpErrors     = blueprints.map((bp) => !bp.title.trim())
  const hasErrors    = titleMissing || bpErrors.some(Boolean)

  const addBP    = () => setBlueprints((b) => [...b, DEFAULT_BP()])
  const removeBP = (id) => setBlueprints((b) => b.filter((x) => x.id !== id))
  const updateBP = (id, patch: ) =>
    setBlueprints((b) => b.map((x) => (x.id === id ? { ...x, ...patch })))
  const toggleDay = (bpId, day) =>
    setBlueprints((b) => b.map((x) => {
      if (x.id !== bpId) return x
      const days = x.customDays || []
      return { ...x, customDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day] }
    }))

  const goalsForDomain = (domainId) =>
    goals.filter((g) => !domainId || g.domainId === domainId)

  const isCatalogue = !!existing?._isCatalogue

  const handleSave = () => {
    setSubmitted(true)
    if (hasErrors) return
    const data = {
      title: title.trim(), description: description.trim(),
      durationDays, deadline, color, icon, blueprints,
    }
    if (existing) {
      isCatalogue
        ? updateCatalogueChallenge(existing.id, data)
        : updateCustomChallenge(existing.id, data)
    } else {
      addCustomChallenge(data)
    }
    onClose()
  }

  const modalTitle = existing
    ? isCatalogue ? 'Modifier le challenge catalogue' : 'Modifier le challenge'
    : 'Créer un challenge'

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} className="max-w-2xl">

      {/* Alerte catalogue */}
      {isCatalogue && (
        <div className="text-[11px] bg-warning/10 border border-warning/30 text-warning rounded-xl px-3 py-2 mb-4">
          ⚠️ Modification du catalogue — visible uniquement sur votre compte.
        </div>
      )}

      {/* ── Grille 2 colonnes sur sm+ ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">

        {/* COL 1 : Titre + Description + Échéance + Aperçu */}
        <div>
          <Field label="Titre du challenge *">
            <input
              className={cn(inputCls, submitted && titleMissing && 'border-danger focus:border-danger')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Trader Discipline 30J…"
              autoFocus
            />
            {submitted && titleMissing && (
              <p className="flex items-center gap-1 text-[11px] text-danger mt-1">
                <AlertCircle size={10} /> Titre obligatoire
              </p>
            )}
          </Field>

          <Field label="Description">
            <textarea
              className={cn(inputCls, 'resize-none h-16')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris l'objectif…"
            />
          </Field>

          <Field label="Échéance">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-3 pointer-events-none" />
                <input
                  type="date" className={inputCls} style={{ paddingLeft: '2rem' }}
                  value={deadline} min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div
                className="flex-shrink-0 text-center text-sm font-bold px-3 py-2 rounded-xl"
                style={{ background: hexToRgba(color, 0.15), color }}
              >
                {durationDays}j
              </div>
            </div>
          </Field>

          {/* Aperçu */}
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 border mb-4"
            style={{ background: hexToRgba(color, 0.08), borderColor: color + '40' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(color, 0.2) }}
            >
              <DomainIcon name={icon} size={16} color={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-content truncate">
                {title || <span className="text-content-4 font-normal italic">Titre du challenge</span>}
              </p>
              <p className="text-[10px]" style={{ color }}>{deadline} · {durationDays} jours</p>
            </div>
          </div>
        </div>

        {/* COL 2 : Icône + Couleur */}
        <div>
          <Field label="Icône">
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
              {DOMAIN_ICONS.map((key) => (
                <button
                  key={key} type="button" onClick={() => setIcon(key)}
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                    icon === key ? 'scale-110' : 'bg-bg-3 border border-border hover:bg-bg-4'
                  )}
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
                <button
                  key={c} type="button" onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-2 scale-110'
                      : 'opacity-60 hover:opacity-100 hover:scale-105'
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* ── Tâches récurrentes — pleine largeur ──────────────────────── */}
      <Field label="Tâches récurrentes *">
        <div className="space-y-3">
          {blueprints.map((bp, i) => (
            <div
              key={bp.id}
              className={cn(
                'bg-bg-3 border rounded-xl p-3 space-y-2.5 transition-colors',
                submitted && bpErrors[i] ? 'border-danger/50' : 'border-border'
              )}
            >
              {/* Titre + durée + suppr */}
              <div className="flex items-center gap-2">
                <GripVertical size={13} className="text-content-4 flex-shrink-0" />
                <input
                  className={cn(
                    'flex-1 bg-transparent text-sm text-content outline-none placeholder:text-content-4 min-w-0',
                    submitted && bpErrors[i] && 'placeholder:text-danger/60'
                  )}
                  value={bp.title}
                  onChange={(e) => updateBP(bp.id, { title: e.target.value })}
                  placeholder={submitted && bpErrors[i] ? '⚠ Titre requis' : `Tâche ${i + 1}…`}
                />
                <input
                  className="w-16 bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1 outline-none text-center"
                  value={bp.duration}
                  onChange={(e) => updateBP(bp.id, { duration: e.target.value })}
                  placeholder="30min"
                />
                {blueprints.length > 1 && (
                  <button
                    type="button" onClick={() => removeBP(bp.id)}
                    className="text-content-4 hover:text-danger transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Domaine + Fréquence + Objectif */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-content-3 mb-1">Domaine</p>
                  <select
                    className="w-full bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                    value={bp.domainId}
                    onChange={(e) => updateBP(bp.id, { domainId: e.target.value, goalId: '' })}
                  >
                    <option value="">— Choisir —</option>
                    {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <p className="text-[10px] text-content-3 mb-1">Fréquence</p>
                  <select
                    className="w-full bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                    value={bp.frequency || 'daily'}
                    onChange={(e) => updateBP(bp.id, { frequency: e.target.value , customDays: [] })}
                  >
                    {FREQ_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-content-3 mb-1 flex items-center gap-1">
                    <Target size={9} /> Objectif lié
                  </p>
                  <select
                    className="w-full bg-bg-4 border border-border rounded-lg text-xs text-content-2 px-2 py-1.5 outline-none"
                    value={bp.goalId}
                    onChange={(e) => updateBP(bp.id, { goalId: e.target.value })}
                  >
                    <option value="">— Aucun —</option>
                    {goalsForDomain(bp.domainId).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}{g.unit ? ` (${g.unit})` : ''}
                      </option>
                    ))}
                  </select>
                  {bp.domainId && goalsForDomain(bp.domainId).length === 0 && (
                    <p className="text-[10px] text-warning mt-1">Aucun objectif dans ce domaine.</p>
                  )}
                </div>
              </div>

              {/* Jours personnalisés */}
              {bp.frequency === 'custom' && (
                <div className="flex gap-1 flex-wrap">
                  {DAY_LABELS.map((label, idx) => {
                    const active = (bp.customDays || []).includes(idx)
                    return (
                      <button
                        key={idx} type="button" onClick={() => toggleDay(bp.id, idx)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[11px] font-bold border transition-all',
                          active ? 'text-white border-transparent' : 'bg-bg-5 border-border text-content-3'
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
            type="button" onClick={addBP}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-content-3 hover:text-content border border-dashed border-border-2 hover:border-border-3 rounded-xl py-2.5 transition-all"
          >
            <Plus size={13} /> Ajouter une tâche
          </button>
        </div>
      </Field>

      {/* ── Actions ─────────────────────────────────────────────────────
           PAS de sticky ici — le scroll est géré par Modal.tsx (overflow-y-auto
           sur le body du modal). sticky bottom-0 dans un parent scrollable
           ne fonctionne pas correctement sur tous les navigateurs.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 pt-2 border-t border-border mt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all duration-200"
          style={{
            background:  hexToRgba(color, 0.15),
            borderColor: color + '60',
            color,
            boxShadow:   `0 0 12px ${color}30`,
            opacity: submitted && hasErrors ? 0.6 : 1,
          }}
        >
          <Zap size={13} fill="currentColor" />
          {existing ? 'Enregistrer' : 'Créer le challenge'}
        </button>
      </div>

    </Modal>
  )
}
