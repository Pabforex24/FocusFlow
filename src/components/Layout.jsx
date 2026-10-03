import { Outlet, useLocation } from 'react-router-dom'
import FocusBar from './FocusBar.jsx'
import Header from './layout/Header.jsx'
import MobileNav from './layout/MobileNav.jsx'
import Sidebar from './layout/Sidebar.jsx'
import { ErrorState } from './ui/ErrorState.jsx'
import { PageSkeleton } from './ui/LoadingState.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { toUserMessage } from '../lib/errors.js'

export default function Layout() {
  const { status, loadError, actions } = useData()
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="md:pl-[4.5rem] lg:pl-64">
        <Header />
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-32 sm:px-6 md:pt-8 md:pb-12 lg:px-8">
          {status === 'loading' && <PageSkeleton />}
          {status === 'error' && <ErrorState message={loadError} onRetry={() => actions.refresh()} />}
          {status === 'ready' && <div key={pathname} className="animate-fade-up"><Outlet /></div>}
        </main>
      </div>
      <FocusBar />
      <MobileNav />
    </div>
  )
}

// Utilisé par la page Profil.
export function useSignOut() {
  const { signOut } = useAuth()
  const toast = useToast()
  return async () => { try { await signOut() } catch (e) { toast.error(toUserMessage(e)) } }
}
