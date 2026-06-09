'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { Plus, CheckSquare, ChevronLeft, ChevronRight, Search, X, SlidersHorizontal } from 'lucide-react'
import { useStore } from '@/store'
import { Task } from '@/types'
import { formatTaskDate } from '@/lib/utils'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Button }      from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskItem }    from '@/components/task/TaskItem'
import { TaskModal }   from '@/components/task/TaskModal'
import { useToast }    from '@/components/ui/Toast'

const PRIORITIES = ['high', 'medium', 'low'] as const
type Priority = typeof PRIORITIES[number]

const priorityLabel: Record<Priority, string> = { high: 'Haute', medium: 'Moyenne', low: 'Basse' }
const priorityColor: Record<Priority, string> = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' }

export default function TasksPage() {
  const {
    domains, goals, tasks,
    addTask, updateTask, toggleTask, deleteTask,
    getTasksForDate, postponeTask,
    restDays,
  } = useStore()
  const { toast } = useToast()

  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingTask,  setEditingTask]  = useState<Task | null>(null)

  // ── Filtres ─────────────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('')
  const [showFilters,     setShowFilters]     = useState(false)
  const [filterDomain,    setFilterDomain]    = useState<string>('')
  const [filterPriority,  setFilterPriority]  = useState<Priority | ''>('')
  const [filterStatus,    setFilterStatus]    = useState<'all' | 'done' | 'pending'>('all')

  const changeDay = (delta: number) =>
    setCurrentDate((d) => new Date(d.getTime() + delta * 86400000))

  const isSearchMode   = search.trim().length > 0
  const hasActiveFilter = filterDomain !== '' || filterPriority !== '' || filterStatus !== 'all'

  // Quand recherche active → tous les tasks ; sinon → jour courant
  const baseTasks = useMemo(
    () => isSearchMode ? tasks : getTasksForDate(currentDate),
    [isSearchMode, tasks, currentDate, getTasksForDate]
  )

  const filteredTasks = useMemo(() => {
    let list = baseTasks
    if (search.trim())   list = list.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
    if (filterDomain)    list = list.filter((t) => t.domainId === filterDomain)
    if (filterPriority)  list = list.filter((t) => t.priority === filterPriority)
    if (filterStatus === 'done')    list = list.filter((t) =>  t.done)
    if (filterStatus === 'pending') list = list.filter((t) => !t.done)
    return list
  }, [baseTasks, search, filterDomain, filterPriority, filterStatus])

  const clearFilters = () => {
    setSearch('')
    setFilterDomain('')
    setFilterPriority('')
    setFilterStatus('all')
  }

  // Stats du jour (non affectées par la recherche)
  const dayTasks  = getTasksForDate(currentDate)
  const doneTasks = dayTasks.filter((t) => t.done)
  const pct       = dayTasks.length ? Math.round((doneTasks.length / dayTasks.length) * 100) : 0

  // Groupement par domaine
  const grouped = useMemo(() =>
    filteredTasks.reduce<Record<string, Task[]>>((acc, t) => {
      const key = t.domainId || '__none__'
      if (!acc[key]) acc[key] = []
      acc[key].push(t)
      return acc
    }, {}),
    [filteredTasks]
  )

  const handleSave = (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, data)
      toast('Tâche mise à jour ✓', 'success')
      setEditingTask(null)
    } else {
      addTask(data)
      toast('Tâche ajoutée ✓', 'success')
    }
  }

  return (
    <div className="px-4 pt-4 md:p-8 max-w-2xl mx-auto page-enter pb-24 md:pb-8 mt-[calc(env(safe-area-inset-top)+52px)] md:mt-0">
      <PageHeader
        title="Tâches"
        action={
          <Button variant="primary" onClick={() => { setEditingTask(null); setModalOpen(true) }}>
            <Plus size={15} strokeWidth={2} /> Nouvelle tâche
          </Button>
        }
      />

      {/* ── Barre de recherche ───────────────────────────────────────────── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#4A5E80' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une tâche…"
            className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(14,18,36,0.9)',
              border: `1px solid ${search ? 'rgba(123,94,167,0.5)' : 'rgba(255,255,255,0.06)'}`,
              color: 'var(--color-content)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <Button
          variant={showFilters || hasActiveFilter ? 'primary' : 'outline'}
          size="icon"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal size={15} />
        </Button>
      </div>

      {/* ── Panneau de filtres ──────────────────────────────────────────── */}
      {showFilters && (
        <div
          className="rounded-xl p-4 mb-4 flex flex-col gap-3"
          style={{ background: 'rgba(14,18,36,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Domaine */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4A5E80' }}>
              Domaine
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterDomain('')}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: !filterDomain ? 'rgba(123,94,167,0.3)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${!filterDomain ? 'rgba(123,94,167,0.6)' : 'rgba(255,255,255,0.07)'}`,
                  color: !filterDomain ? 'var(--color-accent)' : 'var(--color-content-2)',
                }}
              >
                Tous
              </button>
              {domains.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setFilterDomain(filterDomain === d.id ? '' : d.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background: filterDomain === d.id ? `${d.color}25` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${filterDomain === d.id ? `${d.color}70` : 'rgba(255,255,255,0.07)'}`,
                    color: filterDomain === d.id ? d.color : 'var(--color-content-2)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priorité */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4A5E80' }}>
              Priorité
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterPriority('')}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: !filterPriority ? 'rgba(123,94,167,0.3)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${!filterPriority ? 'rgba(123,94,167,0.6)' : 'rgba(255,255,255,0.07)'}`,
                  color: !filterPriority ? 'var(--color-accent)' : 'var(--color-content-2)',
                }}
              >
                Toutes
              </button>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filterPriority === p ? `${priorityColor[p]}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${filterPriority === p ? `${priorityColor[p]}60` : 'rgba(255,255,255,0.07)'}`,
                    color: filterPriority === p ? priorityColor[p] : 'var(--color-content-2)',
                  }}
                >
                  {priorityLabel[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4A5E80' }}>
              Statut
            </div>
            <div className="flex gap-1.5">
              {([['all', 'Toutes'], ['pending', 'À faire'], ['done', 'Complétées']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filterStatus === val ? 'rgba(123,94,167,0.3)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${filterStatus === val ? 'rgba(123,94,167,0.6)' : 'rgba(255,255,255,0.07)'}`,
                    color: filterStatus === val ? 'var(--color-accent)' : 'var(--color-content-2)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 self-start"
            >
              <X size={12} /> Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* ── Navigation jour (masquée en mode recherche) ─────────────────── */}
      {!isSearchMode && (
        <div
          className="flex items-center gap-3 mb-5 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
            <ChevronLeft size={15} strokeWidth={2} />
          </Button>
          <div className="flex-1 text-center font-heading font-bold text-base capitalize">
            {formatTaskDate(currentDate)}
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDay(1)}>
            <ChevronRight size={15} strokeWidth={2} />
          </Button>
        </div>
      )}

      {/* ── Barre de progression (mode jour uniquement) ─────────────────── */}
      {!isSearchMode && dayTasks.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(14,18,36,0.88) 0%, rgba(9,13,26,0.92) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#7A8BAD' }}>
            Progression
          </span>
          <ProgressBar
            value={pct}
            color={pct === 100 ? '#00E5B0' : '#7B5EA7'}
            height="md"
            className="flex-1"
          />
          <span
            className="font-heading font-extrabold text-base whitespace-nowrap"
            style={{ color: pct === 100 ? '#00E5B0' : '#E8EDF7' }}
          >
            {doneTasks.length}/{dayTasks.length}
          </span>
        </div>
      )}

      {/* ── Info mode recherche ─────────────────────────────────────────── */}
      {isSearchMode && (
        <div className="text-xs mb-4" style={{ color: '#4A5E80' }}>
          {filteredTasks.length} résultat{filteredTasks.length !== 1 ? 's' : ''} pour «&nbsp;{search.trim()}&nbsp;»
        </div>
      )}

      {/* ── Liste des tâches ────────────────────────────────────────────── */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#3D4F6E' }}>
          <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg mb-2" style={{ color: '#7A8BAD' }}>
            {isSearchMode || hasActiveFilter ? 'Aucune tâche trouvée' : 'Aucune tâche ce jour'}
          </h3>
          <p className="text-sm mb-6">
            {isSearchMode || hasActiveFilter
              ? 'Essayez avec d\'autres termes ou filtres.'
              : 'Planifiez vos tâches pour avancer sur vos objectifs.'}
          </p>
          {!isSearchMode && !hasActiveFilter && (
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Ajouter une tâche
            </Button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([domainId, groupTasks]) => {
          const domain    = domains.find((d) => d.id === domainId)
          const doneCount = groupTasks.filter((t) => t.done).length
          return (
            <div key={domainId} className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                {domain ? (
                  <>
                    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: domain.color }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: domain.color }}>
                      {domain.name}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#3D4F6E' }}>
                    Sans domaine
                  </span>
                )}
                <span className="ml-auto text-xs" style={{ color: '#3D4F6E' }}>
                  {doneCount}/{groupTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {groupTasks.map((task) => {
                  const goal = goals.find((g) => g.id === task.goalId)
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      domain={domain}
                      goalTitle={goal?.title}
                      showFocusBtn
                      onEdit={() => { setEditingTask(task); setModalOpen(true) }}
                      onToggle={() => {
                        toggleTask(task.id)
                        if (!task.done) toast('Tâche complétée ! ✓', 'success')
                      }}
                      onPostpone={() => {
                        postponeTask(task.id)
                        toast('Tâche reportée à demain 📅', 'info')
                      }}
                      onDelete={() => {
                        deleteTask(task.id)
                        toast('Tâche supprimée', 'info')
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null) }}
        onSave={handleSave}
        domains={domains}
        goals={goals}
        defaultDate={currentDate}
        existing={editingTask}
      />
    </div>
  )
}
