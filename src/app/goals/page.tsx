'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Target, Trophy, Link2 } from 'lucide-react'
import { useStore } from '@/store'
import { CHALLENGE_CATALOGUE } from '@/store'
import { Goal } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Badge'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { GoalCard } from '@/components/goal/GoalCard'
import { GoalModal } from '@/components/goal/GoalModal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/components/ui/Toast'
import { hexToRgba } from '@/lib/utils'

// ── Challenge goals section ────────────────────────────────────────────────────
function ChallengeGoalsSection() {
  const goals            = useStore((s) => s.goals)
  const activeChallenges = useStore((s) => s.activeChallenges)
  const customChallenges = useStore((s) => s.customChallenges)
  const tasks            = useStore((s) => s.tasks)
  const allChallenges    = [...CHALLENGE_CATALOGUE, ...(customChallenges || [])]

  const challengeGoals = goals.filter((g) => g.challengeId)
  if (challengeGoals.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-widest text-content-3 mb-3">
        <Trophy size={12} /> Objectifs de challenges
      </h2>
      <div className="space-y-3">
        {challengeGoals.map((goal) => {
          const challenge  = allChallenges.find((c) => c.id === goal.challengeId)
          const goalTasks  = tasks.filter((t) => t.goalId === goal.id)
          const donePct    = goalTasks.length
            ? Math.round((goalTasks.filter((t) => t.done).length / goalTasks.length) * 100)
            : 0
          const color = challenge?.color || '#7B61FF'

          return (
            <div
              key={goal.id}
              className="bg-bg-2 border rounded-2xl px-5 py-4"
              style={{ borderColor: hexToRgba(color, 0.3) }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-[15px] text-content">{goal.title}</h3>
                  {challenge && (
                    <span
                      className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: hexToRgba(color, 0.12), color, border: `1px solid ${hexToRgba(color, 0.25)}` }}
                    >
                      <Link2 size={10} />
                      {challenge.title}
                    </span>
                  )}
                </div>
                <span className="font-heading font-extrabold text-2xl leading-none flex-shrink-0" style={{ color }}>
                  {donePct}%
                </span>
              </div>
              <ProgressBar value={donePct} color={color} height="md" />
              {goal.description && (
                <p className="text-sm text-content-3 mt-2">{goal.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── GoalRow — isolated component so hooks are called at stable component level ─
function GoalRow({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
}) {
  const domains  = useStore((s) => s.domains)
  const tasks    = useStore((s) => s.tasks)
  const domain   = domains.find((d) => d.id === goal.domainId)
  const goalTasks = tasks.filter((t) => t.goalId === goal.id)
  const progress  = goalTasks.length
    ? Math.round((goalTasks.filter((t) => t.done).length / goalTasks.length) * 100)
    : 0

  return (
    <GoalCard
      goal={goal}
      domain={domain}
      progress={progress}
      taskCount={goalTasks.length}
      doneCount={goalTasks.filter((t) => t.done).length}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
function GoalsContent() {
  const searchParams   = useSearchParams()
  const defaultDomain  = searchParams.get('domain') || ''

  const domains    = useStore((s) => s.domains)
  const goals      = useStore((s) => s.goals)
  const addGoal    = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const { toast }  = useToast()

  const [domainFilter,  setDomainFilter]  = useState(defaultDomain)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null)

  // Objectifs libres (non liés à un challenge)
  const freeGoals = goals.filter(
    (g) => !g.challengeId && (domainFilter ? g.domainId === domainFilter : true)
  )

  const handleSaveGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data)
      toast('Objectif mis à jour ✓', 'success')
      setEditingGoal(null)
    } else {
      addGoal(data)
      toast('Objectif créé ! 🎯', 'success')
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cet objectif et toutes ses tâches ?')) return
    deleteGoal(id)
    toast('Objectif supprimé', 'info')
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8">
      <PageHeader
        title="Objectifs"
        subtitle="Vos ambitions par domaine, et vos objectifs de challenge"
        action={
          <Button variant="primary" onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}>
            <Plus size={16} /> Nouvel objectif
          </Button>
        }
      />

      {/* Objectifs rattachés aux challenges */}
      <ChallengeGoalsSection />

      {/* Objectifs libres */}
      <div>
        <h2 className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-widest text-content-3 mb-3">
          <Target size={12} /> Objectifs par domaine
        </h2>

        {/* Domain filter chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Chip active={!domainFilter} onClick={() => setDomainFilter('')}>
            Tous ({goals.filter((g) => !g.challengeId).length})
          </Chip>
          {domains.map((d) => {
            const count = goals.filter((g) => g.domainId === d.id && !g.challengeId).length
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

        {freeGoals.length === 0 ? (
          <div className="text-center py-12 text-content-3">
            <Target size={40} className="mx-auto mb-4 opacity-20" />
            <h3 className="font-heading font-bold text-lg text-content-2 mb-2">Aucun objectif</h3>
            <p className="text-sm mb-6 max-w-xs mx-auto">
              Créez un objectif lié à un domaine pour suivre votre progression.
            </p>
            <Button variant="primary" onClick={() => setGoalModalOpen(true)}>
              <Plus size={16} /> Créer un objectif
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {freeGoals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                onEdit={() => { setEditingGoal(goal); setGoalModalOpen(true) }}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      <GoalModal
        open={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null) }}
        onSave={handleSaveGoal}
        domains={domains}
        existing={editingGoal}
        defaultDomainId={domainFilter}
      />
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
