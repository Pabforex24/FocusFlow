'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { FocusMode } from '@/components/focus/FocusMode'
import { useStore } from '@/store'
import { useNotifications } from '@/hooks/useNotifications'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import { useDailyTaskGeneration } from '@/hooks/useDailyTaskGeneration'

/**
 * Layout global des pages protégées.
 * FocusMode est ici — il survit à toutes les navigations.
 * L'état d'ouverture est dans le store Zustand, accessible partout.
 */
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useNotifications()
  useDailyTaskGeneration()
  const { manualSync, loading: syncLoading } = useSupabaseSync()
  const focusModalOpen  = useStore((s) => s.focusModalOpen)
  const openFocusModal  = useStore((s) => s.openFocusModal)
  const closeFocusModal = useStore((s) => s.closeFocusModal)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenFocus={openFocusModal} onManualSync={manualSync} syncLoading={syncLoading} />

      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Modal Focus — persiste entre toutes les navigations */}
      {focusModalOpen && <FocusMode onClose={closeFocusModal} />}
    </div>
  )
}
