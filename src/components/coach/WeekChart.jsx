'use client'

import { getWeekActivity } from '@/lib/utils'


export function WeekChart({ tasks }) {
  const data = getWeekActivity(tasks)
  const max = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-content-3">{day.pct > 0 ? `${day.pct}%` : ''}</span>
          <div className="relative w-full flex items-end" style={{ height: '80px' }}>
            {/* Background bar */}
            <div
              className="absolute bottom-0 w-full rounded-t bg-bg-4"
              style={{ height: `${Math.max(4, (day.total / max) * 80)}px` }}
            />
            {/* Done bar */}
            <div
              className="absolute bottom-0 w-full rounded-t bg-accent transition-all duration-700"
              style={{ height: `${Math.max(day.done > 0 ? 4 : 0, (day.done / max) * 80)}px` }}
            />
          </div>
          <span className="text-[10px] text-content-3 font-medium">{day.label}</span>
          <span className="text-[9px] text-content-4">{day.done}/{day.total}</span>
        </div>
      ))}
    </div>
  )
}
