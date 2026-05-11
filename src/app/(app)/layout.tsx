'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { FocusMode } from '@/components/focus/FocusMode'
import { useStore } from '@/store'
import { useNotifications } from '@/hooks/useNotifications'

/**
 * Layout global des pages protégées.
 * FocusMode est ici — il survit à toutes les navigations.
 * L'état d'ouverture est dans le store Zustand, accessible partout.
 */
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useNotifications() // Enregistre le SW et surveille streak + rappels
  const focusModalOpen  = useStore((s) => s.focusModalOpen)
  const openFocusModal  = useStore((s) => s.openFocusModal)
  const closeFocusModal = useStore((s) => s.closeFocusModal)

  return (
    <div className="flex min-h-screen">
      <Sidebar onOpenFocus={openFocusModal} />

      <main className="flex-1 min-w-0 pb-20 md:pb-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {children}
      </main>


      {/* Modal Focus — persiste entre toutes les navigations */}
      {focusModalOpen && <FocusMode onClose={closeFocusModal} />}
    </div>
  )
}
