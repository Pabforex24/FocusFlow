'use client'

import { useState } from 'react'
import { Plus, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { Task } from '@/types'
import { formatTaskDate } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskItem } from '@/components/task/TaskItem'
import { TaskModal } from '@/components/task/TaskModal'
import { useToast } from '@/components/ui/Toast'

export default function TasksPage() {
  const { domains, goals, tasks, addTask, toggleTask, deleteTask, getTasksForDate } = useStore()
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)

  const changeDay = (delta: number) =>
    setCurrentDate((d) => new Date(d.getTime() + delta * 86400000))

  const dayTasks = getTasksForDate(currentDate)
  const doneTasks = dayTasks.filter((t) => t.done)
  const pct = dayTasks.length ? Math.round((doneTasks.length / dayTasks.length) * 100) : 0

  // Group by domain
  const grouped = dayTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.domainId || '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto page-enter">
      <PageHeader
        title="Tâches"
        action={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nouvelle tâche
          </Button>
        }
      />

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
          <ChevronLeft size={16} />
        </Button>
        <div className="flex-1 text-center font-heading font-bold text-base capitalize">
          {formatTaskDate(currentDate)}
        </div>
        <Button variant="outline" size="icon" onClick={() => changeDay(1)}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3 mb-6">
        <span className="text-xs text-content-2 whitespace-nowrap">Progression</span>
        <ProgressBar value={pct} className="flex-1" />
        <span className="font-heading font-extrabold text-base whitespace-nowrap">
          {doneTasks.length}/{dayTasks.length}
        </span>
      </div>

      {/* Empty state */}
      {dayTasks.length === 0 ? (
        <div className="text-center py-16 text-content-3">
          <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg text-content-2 mb-2">Aucune tâche</h3>
          <p className="text-sm mb-6">Planifiez vos tâches pour avancer sur vos objectifs.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Ajouter une tâche
          </Button>
        </div>
      ) : (
        Object.entries(grouped).map(([domainId, groupTasks]) => {
          const domain = domains.find((d) => d.id === domainId)
          const doneCount = groupTasks.filter((t) => t.done).length

          return (
            <div key={domainId} className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">{domain?.icon || '📋'}</span>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: domain?.color || '#888' }}
                >
                  {domain?.name || 'Sans domaine'}
                </span>
                <span className="ml-auto text-xs text-content-3">
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
                      onToggle={() => {
                        toggleTask(task.id)
                        if (!task.done) toast('Tâche complétée ! ✓', 'success')
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
        onClose={() => setModalOpen(false)}
        onSave={(data) => { addTask(data); toast('Tâche ajoutée ✓', 'success') }}
        domains={domains}
        goals={goals}
        defaultDate={currentDate}
      />
    </div>
  )
}
