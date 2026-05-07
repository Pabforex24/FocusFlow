'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Target, Trophy, Link2, ChevronDown, ChevronRight, Pencil, Trash2, CheckSquare } from 'lucide-react'
import { useStore, CHALLENGE_CATALOGUE } from '@/store'
import { Goal } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { GoalModal } from '@/components/goal/GoalModal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/components/ui/Toast'
import { hexToRgba, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── GoalRow ──────────────────────────────────────────────────────────────────

function GoalRow({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const domains   = useStore((s) => s.domains)
  const tasks     = useStore((s) => s.tasks)
  const challenges = useStore((s) => s.customChallenges)
  const getEffectiveChallenge = useStore((s) => s.getEffectiveChallenge)

  const domain      = domains.find((d) => d.id === goal.domainId)
  const goalTasks   = tasks.filter((t) => t.goalId === goal.id)
  const doneTasks   = goalTasks.filter((t) => t.done)
  const progress    = goalTasks.length ? Math.round((doneTasks.length / goalTasks.length) * 100) : 0
  const challenge   = goal.challengeId ? getEffectiveChallenge(goal.challengeId) : undefined
  const c           = domain?.color || '#00E5B0'

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3 transition-all duration-200"
      style={{
        background: 'linear-gradient(145deg, rgba(14,18,36,0.92) 0%, rgba(9,13,26,0.95) 100%)',
        border: `1px solid ${hexToRgba(c, 0.20)}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.45)`,
      }}
    >
      {/* Accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: 0.35 }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-0.5 flex-shrink-0 transition-colors"
            style={{ color: '#3D4F6E' }}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-[15px] text-content leading-snug">{goal.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Domain badge */}
                  {domain && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: hexToRgba(domain.color, 0.10), color: domain.color, border: `1px solid ${hexToRgba(domain.color, 0.20)}` }}
                    >
                      <DomainIcon name={domain.icon} size={10} color={domain.color} />
                      {domain.name}
                    </span>
                  )}
                  {/* Challenge badge */}
                  {challenge && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: hexToRgba(challenge.color, 0.10), color: challenge.color, border: `1px solid ${hexToRgba(challenge.color, 0.20)}` }}
                    >
                      <Trophy size={9} />
                      {challenge.title}
                    </span>
                  )}
                  {/* Unit */}
                  {goal.unit && (
                    <span className="text-[11px]" style={{ color: '#3D4F6E' }}>
                      {doneTasks.length} / {goalTasks.length} {goal.unit}
                    </span>
                  )}
                  {!goal.unit && (
                    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: '#3D4F6E' }}>
                      <CheckSquare size={10} strokeWidth={1.75} />
                      {doneTasks.length}/{goalTasks.length} tâches
                    </span>
                  )}
                </div>
              </div>

              {/* Progress % + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-heading font-extrabold text-xl leading-none" style={{ color: c }}>
                  {progress}%
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={onEdit}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: '#3D4F6E' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5B0')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#3D4F6E')}
                  >
                    <Pencil size={12} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={onDelete}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: '#3D4F6E' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF5E7A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#3D4F6E')}
                  >
                    <Trash2 size={12} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <ProgressBar value={progress} color={c} height="sm" />
          </div>
        </div>

        {/* Expanded — tâches récentes */}
        {open && (
          <div className="mt-3 ml-5 space-y-1.5 animate-fade-in">
            {goal.description && (
              <p className="text-xs mb-3 px-3 py-2 rounded-xl" style={{ color: '#7A8BAD', background: 'rgba(255,255,255,0.025)', border: `1px solid ${hexToRgba(c, 0.10)}` }}>
                {goal.description}
              </p>
            )}
            {goalTasks.length === 0 ? (
              <p className="text-xs" style={{ color: '#3D4F6E' }}>
                Aucune tâche liée. Créez une tâche et associez-la à cet objectif.
              </p>
            ) : (
              goalTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs" style={{ color: t.done ? '#3D4F6E' : '#7A8BAD' }}>
                  <div
                    className="w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center"
                    style={t.done ? { background: '#00E5B0' } : { border: '1px solid #2e3d5e' }}
                  >
                    {t.done && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L2.8 5L7 1" stroke="#050812" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <span className={cn('truncate', t.done && 'line-through')}>{t.title}</span>
                  {t.challengeActiveId && (
                    <span className="text-[9px] flex-shrink-0" style={{ color: '#C8865A' }}>⚡</span>
                  )}
                </div>
              ))
            )}
            {goalTasks.length > 5 && (
              <p className="text-[11px]" style={{ color: '#3D4F6E' }}>+ {goalTasks.length - 5} autres tâches…</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Challenge group ──────────────────────────────────────────────────────────

function ChallengeGroup({ challengeId, goals, onEditGoal, onDeleteGoal }: {
  challengeId: string
  goals: Goal[]
  onEditGoal: (g: Goal) => void
  onDeleteGoal: (id: string) => void
}) {
  const getEffectiveChallenge = useStore((s) => s.getEffectiveChallenge)
  const activeChallenges      = useStore((s) => s.activeChallenges)
  const getChallengeProgress  = useStore((s) => s.getChallengeProgress)
  const [open, setOpen]       = useState(true)

  const challenge = getEffectiveChallenge(challengeId)
  if (!challenge) return null

  const ac       = activeChallenges.find((a) => a.challengeId === challengeId && a.isActive)
  const progress = ac ? getChallengeProgress(ac.id) : 0

  return (
    <div className="mb-6">
      {/* Challenge header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: hexToRgba(challenge.color, 0.18), border: `1px solid ${hexToRgba(challenge.color, 0.30)}` }}
        >
          <Trophy size={14} style={{ color: challenge.color }} strokeWidth={1.75} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="font-heading font-bold text-sm text-content">{challenge.title}</span>
          {ac && (
            <div className="flex items-center gap-2 mt-1">
              <ProgressBar value={progress} color={challenge.color} height="sm" className="w-24" />
              <span className="text-[10px] font-bold" style={{ color: challenge.color }}>{progress}%</span>
              <span className="text-[10px]" style={{ color: '#3D4F6E' }}>actif</span>
            </div>
          )}
          {!ac && (
            <span className="text-[10px]" style={{ color: '#3D4F6E' }}>Challenge non démarré</span>
          )}
        </div>
        <span style={{ color: '#3D4F6E' }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="pl-3 border-l-2" style={{ borderColor: hexToRgba(challenge.color, 0.20) }}>
          {goals.length === 0 ? (
            <p className="text-xs py-3" style={{ color: '#3D4F6E' }}>
              Aucun objectif dans ce challenge.
            </p>
          ) : (
            goals.map((g) => (
              <GoalRow key={g.id} goal={g} onEdit={() => onEditGoal(g)} onDelete={() => onDeleteGoal(g.id)} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function GoalsContent() {
  const searchParams  = useSearchParams()
  const defaultDomain = searchParams.get('domain') || ''

  const domains    = useStore((s) => s.domains)
  const goals      = useStore((s) => s.goals)
  const customChallenges = useStore((s) => s.customChallenges)
  const addGoal    = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const { toast }  = useToast()

  const [domainFilter,  setDomainFilter]  = useState(defaultDomain)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null)
  const [tab,           setTab]           = useState<'all' | 'challenges' | 'free'>('all')

  // Objectifs liés à un challenge
  const challengeGoals = goals.filter((g) => !!g.challengeId && (!domainFilter || g.domainId === domainFilter))
  // Objectifs indépendants
  const freeGoals      = goals.filter((g) => !g.challengeId && (!domainFilter || g.domainId === domainFilter))

  // Challenges qui ont des objectifs
  const allChallengeIds = [...new Set(challengeGoals.map((g) => g.challengeId!))]
  const allChallenges   = [
    ...CHALLENGE_CATALOGUE,
    ...(customChallenges || []),
  ]

  const handleSave = (data: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data)
      toast('Objectif mis à jour ✓', 'success')
    } else {
      addGoal(data)
      toast('Objectif créé ! 🎯', 'success')
    }
    setEditingGoal(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cet objectif et ses tâches non générées ?')) return
    deleteGoal(id)
    toast('Objectif supprimé', 'info')
  }

  const filteredFreeGoals      = tab === 'challenges' ? [] : freeGoals
  const filteredChallengeIds   = tab === 'free'       ? [] : allChallengeIds

  const totalGoals = goals.filter((g) => !domainFilter || g.domainId === domainFilter).length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8">
      <PageHeader
        title="Objectifs"
        subtitle="Cibles globales — progression calculée depuis vos tâches"
        action={
          <Button variant="primary" onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}>
            <Plus size={15} strokeWidth={2} /> Nouvel objectif
          </Button>
        }
      />

      {/* Domain filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setDomainFilter('')}
          className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
            !domainFilter ? 'bg-accent/15 border-accent/40 text-accent' : 'border-border text-content-3 hover:border-border-2')}
        >
          Tous ({totalGoals})
        </button>
        {domains.map((d) => {
          const cnt = goals.filter((g) => g.domainId === d.id).length
          return (
            <button
              key={d.id}
              onClick={() => setDomainFilter(domainFilter === d.id ? '' : d.id)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
                domainFilter === d.id ? 'text-white' : 'border-border text-content-3 hover:border-border-2')}
              style={domainFilter === d.id ? { background: d.color, borderColor: d.color } : {}}
            >
              <DomainIcon name={d.icon} size={11} color={domainFilter === d.id ? '#fff' : d.color} />
              {d.name} ({cnt})
            </button>
          )
        })}
      </div>

      {/* Tab filter */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { key: 'all',        label: 'Tous',            count: totalGoals },
          { key: 'challenges', label: '⚡ Challenges',   count: challengeGoals.length },
          { key: 'free',       label: '📌 Indépendants', count: freeGoals.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
              tab === t.key ? 'text-content' : 'text-content-3 hover:text-content-2')}
            style={tab === t.key ? { background: 'rgba(255,255,255,0.07)' } : {}}
          >
            {t.label} <span style={{ color: tab === t.key ? '#00E5B0' : '#3D4F6E' }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {totalGoals === 0 && (
        <div className="text-center py-16" style={{ color: '#3D4F6E' }}>
          <Target size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg mb-2" style={{ color: '#7A8BAD' }}>Aucun objectif</h3>
          <p className="text-sm mb-6 max-w-xs mx-auto">
            Un objectif est une cible globale (ex: "30h de backtest"). La progression se calcule
            automatiquement depuis vos tâches complétées.
          </p>
          <Button variant="primary" onClick={() => setGoalModalOpen(true)}>
            <Plus size={15} /> Créer un objectif
          </Button>
        </div>
      )}

      {/* Challenge groups */}
      {filteredChallengeIds.map((cid) => (
        <ChallengeGroup
          key={cid}
          challengeId={cid}
          goals={challengeGoals.filter((g) => g.challengeId === cid)}
          onEditGoal={(g) => { setEditingGoal(g); setGoalModalOpen(true) }}
          onDeleteGoal={handleDelete}
        />
      ))}

      {/* Free goals */}
      {filteredFreeGoals.length > 0 && (
        <div>
          {tab === 'all' && filteredChallengeIds.length > 0 && (
            <p className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: '#3D4F6E' }}>
              📌 Objectifs indépendants
            </p>
          )}
          {filteredFreeGoals.map((g) => (
            <GoalRow
              key={g.id}
              goal={g}
              onEdit={() => { setEditingGoal(g); setGoalModalOpen(true) }}
              onDelete={() => handleDelete(g.id)}
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
        challenges={[...CHALLENGE_CATALOGUE, ...(customChallenges || [])]}
      />
    </div>
  )
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="p-8" style={{ color: '#3D4F6E' }}>Chargement…</div>}>
      <GoalsContent />
    </Suspense>
  )
}
