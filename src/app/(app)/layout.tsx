'use client'

import { Sidebar } from '@/components/layout/Sidebar'

/**
 * Layout pour toutes les pages protégées (dashboard, tasks, goals, etc.)
 * Inclut la Sidebar. Exclu des pages /auth/*.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
