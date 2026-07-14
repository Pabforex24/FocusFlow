'use client'

import { memo, useState } from 'react'
import { Trash2, Timer, Pencil, CornerDownRight, Repeat } from 'lucide-react'
import { hexToRgba, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import dynamic from 'next/dynamic'

const FocusMode = dynamic(
  () => import('@/components/focus/FocusMode').then((m) => ({ default: m.FocusMode })),
  { ssr: false }
)


const PRIORITY_COLOR = {
  high:   '#FF5E7A',
  medium: '#C8865A',
  low:    '#2e3d5e',
}

// React.memo : le composant ne se re-rend que si ses props changent réellement
export const TaskItem = memo(function TaskItem({
  task, domain, goalTitle, onToggle, onDelete, onEdit, onPostpone, showFocusBtn = false
}) {
  const [showFocus, setShowFocus] = useState(false)
  const c = domain?.color || '#00E5B0'

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          task.done && 'opacity-40'
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(14,18,36,0.80) 0%, rgba(9,13,26,0.85) 100%)',
          border: `1px solid rgba(255,255,255,${task.done ? '0.03' : '0.06'})`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => { if (!task.done) (e.currentTarget ).style.borderColor = 'rgba(255,255,255,0.10)' }}
        onMouseLeave={(e) => { (e.currentTarget ).style.borderColor = `rgba(255,255,255,${task.done ? '0.03' : '0.06'})` }}
      >
        {/* Priority dot */}
        {task.priority && !task.done && (
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: PRIORITY_COLOR[task.priority], boxShadow: `0 0 5px ${PRIORITY_COLOR[task.priority]}80` }}
          />
        )}

        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={task.done
            ? { background: '#00E5B0', border: '1.5px solid #00E5B0', boxShadow: '0 0 8px rgba(0,229,176,0.40)' }
            : { border: '1.5px solid rgba(255,255,255,0.12)', background: 'transparent' }
          }
          onMouseEnter={(e) => { if (!task.done) (e.currentTarget ).style.borderColor = '#00E5B0' }}
          onMouseLeave={(e) => { if (!task.done) (e.currentTarget ).style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          {task.done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#050812" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span
            className={cn('text-sm font-medium truncate block', task.done ? 'line-through' : 'text-content')}
            style={task.done ? { color: '#3D4F6E' } : {}}
          >
            {task.title}
          </span>
          {/* Indicateur récurrence */}
          {task.templateId && !task.done && (
            <span className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#4A5E80' }}>
              <Repeat size={9} /> Récurrent
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          {task.duration && (
            <span className="text-[11px] hidden sm:block font-mono" style={{ color: '#3D4F6E' }}>{task.duration}</span>
          )}
          {!task.done && (
            <span
              className="hidden sm:block text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono"
              style={{ background: 'rgba(0,229,176,0.07)', color: '#3D4F6E', border: '1px solid rgba(0,229,176,0.10)' }}
            >
              +{task.xpValue ?? 10}xp
            </span>
          )}
          {task.challengeActiveId && (
            <span
              className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(200,134,90,0.10)', color: '#C8865A', border: '1px solid rgba(200,134,90,0.22)' }}
            >⚡</span>
          )}
          {goalTitle && !task.challengeActiveId && (
            <span
              className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-medium max-w-[120px] truncate"
              style={{ background: hexToRgba(c, 0.08), color: c, border: `1px solid ${hexToRgba(c, 0.18)}` }}
            >{goalTitle}</span>
          )}
          {onEdit && !task.done && (
            <button onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ color: '#3D4F6E' }}
              onMouseEnter={(e) => { (e.currentTarget ).style.color = '#C8865A' }}
              onMouseLeave={(e) => { (e.currentTarget ).style.color = '#3D4F6E' }}
            ><Pencil size={12} strokeWidth={1.75} /></button>
          )}
          {showFocusBtn && !task.done && (
            <button onClick={() => setShowFocus(true)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ color: '#3D4F6E' }}
              onMouseEnter={(e) => { (e.currentTarget ).style.color = '#00E5B0' }}
              onMouseLeave={(e) => { (e.currentTarget ).style.color = '#3D4F6E' }}
            ><Timer size={12} strokeWidth={1.75} /></button>
          )}
          {onPostpone && !task.done && (
            <Button variant="ghost" size="icon"
              className="opacity-0 group-hover:opacity-100 w-7 h-7"
              title="Reporter à demain"
              onClick={onPostpone}
            ><CornerDownRight size={13} style={{ color: '#3DD8FA' }} /></Button>
          )}
          <Button variant="danger" size="icon" className="opacity-0 group-hover:opacity-100 w-7 h-7" onClick={onDelete}>
            <Trash2 size={12} strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {showFocus && <FocusMode onClose={() => setShowFocus(false)} initialTask={task} />}
    </>
  )
})
