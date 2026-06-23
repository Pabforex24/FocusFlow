'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/store'

export function useDailyTaskGeneration() {
  const generateRecurringTasksForDate = useStore((s: any) => s.generateRecurringTasksForDate)
  const lastDateRef = useRef<string>('')

  useEffect(() => {
    const run = () => {
      const today = new Date()
      const todayStr = today.toDateString()
      if (lastDateRef.current !== todayStr) {
        lastDateRef.current = todayStr
        generateRecurringTasksForDate(today)
      }
    }
    run()
    const interval = setInterval(run, 60_000)
    return () => clearInterval(interval)
  }, [generateRecurringTasksForDate])
}
