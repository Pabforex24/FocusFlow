'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Target } from 'lucide-react'
import { useStore } from '@/store'
import { Goal } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Badge'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { GoalCard } from '@/components/goal/GoalCard'
import { GoalModal } from '@/components/goal/GoalModal'
import { useToast } from '@/components/ui/Toast'

// ── GoalRow — composant isolé pour éviter les hooks dans .map() ───────────────
function GoalRow({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
}) {
  const domains   = useStore((s) => s.domains)
  const tasks     = useStore((s) => s.tasks)
  const domain    = domains.find((d) => d.id === goal.domainId)
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
  const searchParams  = useSearchParams()
  const defaultDomain = searchParams.get('domain') || ''

  const domains    = useStore((s) => s.domains)
  const goals      = useStore((s) => s.goals)
  const addGoal    = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const { toast }  = useToast()

  const [domainFilter,  setDomainFilter]  = useState(defaultDomain)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null)

  const filteredGoals = goals.filter(
    (g) => domainFilter ? g.domainId === domainFilter : true
  )

  const handleSave = (data: Omit<Goal, 'id' | 'createdAt'>) => {
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
        subtitle="Vos cibles globales — progressent grâce aux tâches complétées"
        action={
          <Button variant="primary" onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}>
            <Plus size={16} /> Nouvel objectif
          </Button>
        }
      />

      {/* Filtre par domaine */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip active={!domainFilter} onClick={() => setDomainFilter('')}>
          Tous ({goals.length})
        </Chip>
        {domains.map((d) => {
          const count = goals.filter((g) => g.domainId === d.id).length
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

      {/* Liste */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 text-content-3">
          <Target size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg text-content-2 mb-2">Aucun objectif</h3>
          <p className="text-sm mb-6 max-w-xs mx-auto">
            Un objectif est une cible globale (ex: "30h de backtest", "20 séances de sport").
            Sa progression est calculée automatiquement depuis vos tâches.
          </p>
          <Button variant="primary" onClick={() => setGoalModalOpen(true)}>
            <Plus size={16} /> Créer un objectif
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onEdit={() => { setEditingGoal(goal); setGoalModalOpen(true) }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null) }}
        onSave={handleSave}
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
