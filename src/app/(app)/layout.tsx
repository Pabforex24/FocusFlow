'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { FocusMode } from '@/components/focus/FocusMode'
import { useStore } from '@/store'

/**
 * Layout global des pages protégées.
 * FocusMode est ici — il survit à toutes les navigations.
 * L'état d'ouverture est dans le store Zustand, accessible partout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const focusModalOpen  = useStore((s) => s.focusModalOpen)
  const openFocusModal  = useStore((s) => s.openFocusModal)
  const closeFocusModal = useStore((s) => s.closeFocusModal)

  return (
    <div className="flex min-h-screen">
      <Sidebar onOpenFocus={openFocusModal} />

      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>


      {/* Modal Focus — persiste entre toutes les navigations */}
      {focusModalOpen && <FocusMode onClose={closeFocusModal} />}
    </div>
  )
}
