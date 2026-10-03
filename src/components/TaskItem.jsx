import { ArrowRightToLine, Check, Clock, Pencil, Target, Timer, Trash2, ChevronsUp } from 'lucide-react'
import { useData } from '../contexts/DataContext.jsx'
import { useFocus } from '../contexts/FocusContext.jsx'
import { Badge } from './ui/Badge.jsx'
import { Menu } from './ui/Menu.jsx'
import { cn } from '../lib/cn.js'

// compact : version pour l'accueil (sans menu d'actions).
export default function TaskItem({ task, onEdit, onDelete, compact = false }) {
  const { domains, goals, actions } = useData()
  const { openPicker } = useFocus()
  const domain = domains.find((d) => d.id === task.domain_id)
  const goal = goals.find((g) => g.id === task.goal_id)

  const menu = task.done
    ? [{ label: 'Supprimer', icon: Trash2, danger: true, onClick: () => onDelete(task) }]
    : [
        { label: 'Session Focus', icon: Timer, onClick: () => openPicker(task) },
        { label: 'Reporter à demain', icon: ArrowRightToLine, onClick: () => actions.postponeTask(task) },
        { label: 'Modifier', icon: Pencil, onClick: () => onEdit(task) },
        { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => onDelete(task) },
      ]

  return (
    <div className={cn('group flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition-colors sm:items-center dark:bg-surface/70 dark:backdrop-blur-md',
      task.done && 'bg-surface/60 dark:bg-surface/40')}>
      <button type="button" onClick={() => actions.toggleTask(task)} aria-pressed={task.done}
        aria-label={task.done ? `Marquer « ${task.title} » comme non terminée` : `Terminer « ${task.title} »`}
        className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 sm:mt-0',
          task.done ? 'animate-pop border-transparent bg-linear-to-br from-brand-300 to-brand-500 text-brand-950 shadow-[0_0_10px_rgb(79_178_134/0.4)]' : 'border-subtle/60 text-transparent hover:border-brand-500 hover:text-brand-500/40')}>
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-[15px] leading-snug font-semibold break-words text-fg', task.done && 'text-subtle line-through')}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {domain && (
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: domain.color }} />{domain.name}</span>
          )}
          {goal && <span className="inline-flex items-center gap-1"><Target className="size-3.5" aria-hidden />{goal.title}</span>}
          {task.duration && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{task.duration}</span>}
          <span className="font-semibold text-amber-600 dark:text-amber-400">+{task.xp_value} XP</span>
          {task.priority === 'high' && !task.done && <Badge tone="warning" icon={ChevronsUp}>Prioritaire</Badge>}
          {task.postponed && !task.done && <Badge tone="neutral">Reportée</Badge>}
        </div>
      </div>

      {!compact && <Menu items={menu} label={`Actions pour « ${task.title} »`} />}
    </div>
  )
}
