'use client'

/**
 * useDailyTaskGeneration
 * Appelle generateRecurringTasksForDate() au montage et toutes les minutes
 * pour détecter les changements de jour et créer les tâches récurrentes.
 */

import { useEffect, useRef } from 'react'
import { useStore } from '@/store'

export function useDailyTaskGeneration() {
  const generateRecurringTasksForDate = useStore((s) => s.generateRecurringTasksForDate)
  const lastDateRef = useRef('')

  useEffect(() => {
    const run = () => {
      const today = new Date()
      const todayStr = today.toDateString()
      // Générer seulement si la date a changé (ou au premier montage)
      if (lastDateRef.current !== todayStr) {
        lastDateRef.current = todayStr
        generateRecurringTasksForDate(today)
      }
    }

    run() // Exécution immédiate au montage

    const interval = setInterval(run, 60_000) // Vérification chaque minute
    return () => clearInterval(interval)
  }, [generateRecurringTasksForDate])
}
