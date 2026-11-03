import { Outlet, useLocation } from 'react-router-dom'
import CoachFab from './layout/CoachFab.jsx'
import CompactNav from './layout/CompactNav.jsx'
import DesktopHeader from './layout/DesktopHeader.jsx'
import DesktopRail from './layout/DesktopRail.jsx'
import FocusBar from './FocusBar.jsx'
import Header from './layout/Header.jsx'
import MobileNav from './layout/MobileNav.jsx'
import OfflineBanner from './OfflineBanner.jsx'
import { ErrorState } from './ui/ErrorState.jsx'
import { PageSkeleton } from './ui/LoadingState.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useNavLayout } from '../hooks/useNavLayout.js'
import { useToast } from '../contexts/ToastContext.jsx'
import { cn } from '../lib/cn.js'
import { toUserMessage } from '../lib/errors.js'

export default function Layout() {
  const { status, loadError, actions } = useData()
  const { pathname } = useLocation()
  const layout = useNavLayout()
  const desktop = layout === 'desktop'
  const compact = layout === 'compact'
  const standard = layout === 'standard'

  return (
    <div className="min-h-dvh" data-nav-layout={layout}>
      {desktop && <DesktopRail />}
      <div className={cn(desktop && 'pl-24', compact && 'pl-[calc(env(safe-area-inset-left,0px)+5.25rem)]')}>
        {desktop && <DesktopHeader />}
        {standard && <Header />}
        <main className={cn(
          'mx-auto w-full max-w-5xl',
          desktop
            ? 'px-5 pt-[6.5rem] pb-16'
            : compact
              ? 'px-4 pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] pb-24'
              : 'px-4 pt-5 pb-44',
        )}>
          {status === 'ready' && <OfflineBanner />}
          {status === 'loading' && <PageSkeleton />}
          {status === 'error' && <ErrorState message={loadError} onRetry={() => actions.refresh()} />}
          {status === 'ready' && <div key={pathname} className="animate-fade-up"><Outlet /></div>}
        </main>
      </div>
      <FocusBar layout={layout} />
      {standard && <MobileNav />}
      {compact && <CompactNav />}
      <CoachFab layout={layout} />
    </div>
  )
}

// Utilisé par la page Profil.
export function useSignOut() {
  const { signOut } = useAuth()
  const toast = useToast()
  return async () => { try { await signOut() } catch (e) { toast.error(toUserMessage(e)) } }
}
