'use client'

import { Trash2, Timer } from 'lucide-react'
import { Task, Domain } from '@/types'
import { hexToRgba, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy load FocusMode to avoid circular dep
const FocusMode = dynamic(() => import('@/components/focus/FocusMode').then(m => ({ default: m.FocusMode })), { ssr: false })

interface TaskItemProps {
  task: Task
  domain?: Domain
  goalTitle?: string
  onToggle: () => void
  onDelete: () => void
  showFocusBtn?: boolean
}

const PRIORITY_DOT: Record<string, string> = {
  high:   '#FF6B6B',
  medium: '#FFB830',
  low:    '#55556e',
}

export function TaskItem({ task, domain, goalTitle, onToggle, onDelete, showFocusBtn = false }: TaskItemProps) {
  const [showFocus, setShowFocus] = useState(false)

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-3 px-4 py-3 bg-bg-2 border border-border rounded-xl',
          'transition-all duration-150 hover:border-border-2',
          task.done && 'opacity-45'
        )}
      >
        {/* Priority dot */}
        {task.priority && !task.done && (
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: PRIORITY_DOT[task.priority] || '#55556e' }}
          />
        )}

        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 border-2',
            task.done ? 'bg-success border-success' : 'border-border-2 hover:border-accent'
          )}
        >
          {task.done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Title */}
        <span className={cn('flex-1 text-sm text-content min-w-0 truncate', task.done && 'line-through text-content-3')}>
          {task.title}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          {task.duration && <span className="text-xs text-content-3 hidden sm:block">{task.duration}</span>}

          {/* XP badge */}
          {!task.done && (
            <span className="hidden sm:block text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-bg-3 text-content-4">
              +{task.xpValue ?? 10}xp
            </span>
          )}

          {/* Challenge badge */}
          {task.challengeActiveId && (
            <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              ⚡
            </span>
          )}

          {/* Goal badge */}
          {goalTitle && !task.challengeActiveId && (
            <span
              className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-medium max-w-[120px] truncate"
              style={domain
                ? { background: hexToRgba(domain.color, 0.1), color: domain.color }
                : { background: 'rgba(123,97,255,0.1)', color: '#7B61FF' }
              }
            >
              {goalTitle}
            </span>
          )}

          {/* Focus button */}
          {showFocusBtn && !task.done && (
            <button
              onClick={() => setShowFocus(true)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-content-3 hover:text-accent hover:bg-accent/10 transition-all"
            >
              <Timer size={12} />
            </button>
          )}

          <Button variant="danger" size="icon" className="opacity-0 group-hover:opacity-100 w-7 h-7" onClick={onDelete}>
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {showFocus && <FocusMode onClose={() => setShowFocus(false)} initialTask={task} />}
    </>
  )
}
