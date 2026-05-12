'use client'

export const dynamic = 'force-dynamic'

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
  const { domains, goals, tasks, addTask, updateTask, toggleTask, deleteTask, getTasksForDate } = useStore()
  const { toast } = useToast()

  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingTask,  setEditingTask]  = useState<Task | null>(null)

  const changeDay = (delta: number) =>
    setCurrentDate((d) => new Date(d.getTime() + delta * 86400000))

  const dayTasks  = getTasksForDate(currentDate)
  const doneTasks = dayTasks.filter((t) => t.done)
  const pct       = dayTasks.length ? Math.round((doneTasks.length / dayTasks.length) * 100) : 0

  const grouped = dayTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.domainId || '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

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

  const handleClose = () => {
    setModalOpen(false)
    setEditingTask(null)
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

      {/* Date navigation */}
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

      {/* Progress summary */}
      {dayTasks.length > 0 && (
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

      {/* Empty state */}
      {dayTasks.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#3D4F6E' }}>
          <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg mb-2" style={{ color: '#7A8BAD' }}>
            Aucune tâche ce jour
          </h3>
          <p className="text-sm mb-6">Planifiez vos tâches pour avancer sur vos objectifs.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Ajouter une tâche
          </Button>
        </div>
      ) : (
        Object.entries(grouped).map(([domainId, groupTasks]) => {
          const domain    = domains.find((d) => d.id === domainId)
          const doneCount = groupTasks.filter((t) => t.done).length

          return (
            <div key={domainId} className="mb-6">
              {/* Domain header */}
              <div className="flex items-center gap-2 mb-2.5">
                {domain ? (
                  <>
                    <div
                      className="w-1 h-4 rounded-full flex-shrink-0"
                      style={{ background: domain.color }}
                    />
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: domain.color }}
                    >
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
                      onEdit={() => handleOpenEdit(task)}
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
        onClose={handleClose}
        onSave={handleSave}
        domains={domains}
        goals={goals}
        defaultDate={currentDate}
        existing={editingTask}
      />
    </div>
  )
}
