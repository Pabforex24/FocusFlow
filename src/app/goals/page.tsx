'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Target, Wand2, X } from 'lucide-react'
import { useStore } from '@/store'
import { Goal } from '@/types'
import { useEnrichedGoals } from '@/hooks/useSelectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Badge'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { GoalCard } from '@/components/goal/GoalCard'
import { GoalModal } from '@/components/goal/GoalModal'
import { useToast } from '@/components/ui/Toast'
import { hexToRgba } from '@/lib/utils'
import { differenceInDays, addDays, format } from 'date-fns'

// ── Auto task generation modal ────────────────────────────────────────────────
function AutoGenModal({ goalId, onClose }: { goalId: string; onClose: () => void }) {
  const { goals, domains, bulkAddTasks } = useStore()
  const goal = goals.find((g) => g.id === goalId)
  const domain = domains.find((d) => d.id === goal?.domainId)
  const [frequency, setFrequency] = useState<'daily' | 'workdays' | 'weekly'>('daily')
  const [taskTitle, setTaskTitle] = useState(goal ? `Avancer sur : ${goal.title}` : '')
  const [duration, setDuration] = useState('30min')
  const [generated, setGenerated] = useState(false)

  if (!goal) return null

  const deadline = goal.deadline ? new Date(goal.deadline) : addDays(new Date(), 30)
  const daysLeft = Math.max(1, differenceInDays(deadline, new Date()))

  const getDates = () => {
    const dates: Date[] = []
    for (let i = 0; i < daysLeft; i++) {
      const d = addDays(new Date(), i)
      const dow = d.getDay()
      if (frequency === 'daily') dates.push(d)
      else if (frequency === 'workdays' && dow !== 0 && dow !== 6) dates.push(d)
      else if (frequency === 'weekly' && dow === 1) dates.push(d)
    }
    return dates
  }

  const dates = getDates()

  const handleGenerate = () => {
    bulkAddTasks(dates.map((d) => ({
      title: taskTitle,
      domainId: goal.domainId,
      goalId: goal.id,
      duration,
      scheduledAt: d.toISOString().split('T')[0] + 'T08:00:00.000Z',
      done: false,
      xpValue: 10,
      priority: 'medium' as const,
    })))
    setGenerated(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg-2 border border-border-2 rounded-2xl p-6 shadow-card animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg text-content flex items-center gap-2">
            <Wand2 size={18} className="text-accent" /> Générer les tâches
          </h2>
          <button onClick={onClose} className="text-content-3 hover:text-content">
            <X size={18} />
          </button>
        </div>

        {generated ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-heading font-bold text-lg text-content">{dates.length} tâches créées !</p>
            <p className="text-sm text-content-3 mt-1">Retrouve-les dans l'onglet Tâches.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Goal summary */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ background: hexToRgba(domain?.color || '#7B61FF', 0.08), borderColor: (domain?.color || '#7B61FF') + '30' }}
            >
              <DomainIcon name={domain?.icon || 'Target'} size={16} color={domain?.color || '#7B61FF'} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-content truncate">{goal.title}</p>
                <p className="text-[10px] text-content-3">{daysLeft} jours jusqu'à l'échéance</p>
              </div>
            </div>

            {/* Task title */}
            <div>
              <label className="text-xs text-content-3 font-medium block mb-1.5">Titre de la tâche récurrente</label>
              <input
                className="w-full bg-bg-3 border border-border rounded-xl px-3 py-2.5 text-sm text-content outline-none focus:border-accent/50"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs text-content-3 font-medium block mb-1.5">Durée estimée</label>
              <div className="flex gap-2">
                {['15min', '30min', '1h', '1h30'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      duration === d ? 'bg-accent/15 border-accent/50 text-accent' : 'bg-bg-3 border-border text-content-3'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-xs text-content-3 font-medium block mb-1.5">Fréquence</label>
              <div className="flex gap-2">
                {[
                  { value: 'daily',    label: 'Chaque jour'   },
                  { value: 'workdays', label: 'Jours ouvrés'  },
                  { value: 'weekly',   label: 'Chaque semaine' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFrequency(opt.value as any)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      frequency === opt.value ? 'bg-accent/15 border-accent/50 text-accent' : 'bg-bg-3 border-border text-content-3'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <p className="text-center text-xs text-content-3 py-1">
              → <strong className="text-content">{dates.length} tâches</strong> seront créées
            </p>

            {/* CTA */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm border border-border text-content-3 hover:text-content transition-all"
              >
                Ignorer
              </button>
              <button
                onClick={handleGenerate}
                disabled={!taskTitle.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-40"
                style={{ background: 'rgba(123,97,255,0.15)', borderColor: 'rgba(123,97,255,0.4)', color: '#7B61FF', boxShadow: '0 0 16px rgba(123,97,255,0.2)' }}
              >
                <Wand2 size={13} className="inline mr-1.5" /> Générer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
function GoalsContent() {
  const searchParams = useSearchParams()
  const defaultDomain = searchParams.get('domain') || ''

  const { domains, goals, addGoal, updateGoal, deleteGoal } = useStore()
  const { toast } = useToast()

  const [domainFilter, setDomainFilter] = useState(defaultDomain)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal]     = useState<Goal | null>(null)
  const [showAutoGen, setShowAutoGen]     = useState(false)
  const [lastGoalId, setLastGoalId]       = useState<string | null>(null)

  const enrichedGoals = useEnrichedGoals(domainFilter || undefined)

  const handleSaveGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data)
      toast('Objectif mis à jour ✓', 'success')
      setEditingGoal(null)
    } else {
      addGoal(data)
      // Propose auto-generation if deadline is set
      if (data.deadline) {
        // Defer to next tick so store has persisted the new goal
        setTimeout(() => {
          const updated = useStore.getState().goals
          const newGoal = [...updated].reverse().find((g) => g.title === data.title)
          if (newGoal) {
            setLastGoalId(newGoal.id)
            setShowAutoGen(true)
          }
        }, 50)
      }
      toast('Objectif créé ! 🎯', 'success')
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cet objectif et toutes ses tâches ?')) return
    deleteGoal(id)
    toast('Objectif supprimé', 'info')
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8">
      <PageHeader
        title="Objectifs"
        subtitle="Vos ambitions long terme, mesurées par vos tâches"
        action={
          <Button variant="primary" onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}>
            <Plus size={16} /> Nouvel objectif
          </Button>
        }
      />

      {/* Domain filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip active={!domainFilter} onClick={() => setDomainFilter('')}>
          Tous ({enrichedGoals.length})
        </Chip>
        {domains.map((d) => {
          const count = useEnrichedGoals(d.id).length
          return (
            <Chip
              key={d.id}
              active={domainFilter === d.id}
              color={d.color}
              onClick={() => setDomainFilter(domainFilter === d.id ? '' : d.id)}
            >
              <DomainIcon name={d.icon} size={11} color={d.color} /> {d.name} ({count})
            </Chip>
          )
        })}
      </div>

      {/* Goals list */}
      {enrichedGoals.length === 0 ? (
        <div className="text-center py-16 text-content-3">
          <Target size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg text-content-2 mb-2">Aucun objectif</h3>
          <p className="text-sm mb-6 max-w-xs mx-auto">
            Créez un objectif et ajoutez-lui des tâches pour suivre votre progression.
          </p>
          <Button variant="primary" onClick={() => setGoalModalOpen(true)}>
            <Plus size={16} /> Créer un objectif
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {enrichedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              domain={goal.domain}
              progress={goal.progress}
              taskCount={goal.taskCount}
              doneCount={goal.doneCount}
              onEdit={() => { setEditingGoal(goal); setGoalModalOpen(true) }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null) }}
        onSave={handleSaveGoal}
        domains={domains}
        existing={editingGoal}
        defaultDomainId={domainFilter}
      />

      {showAutoGen && lastGoalId && (
        <AutoGenModal goalId={lastGoalId} onClose={() => setShowAutoGen(false)} />
      )}
    </div>
  )
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-content-3">Chargement…</div>}>
      <GoalsContent />
    </Suspense>
  )
}
