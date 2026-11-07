import { useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import Layout from './components/Layout.jsx'
import { Spinner } from './components/ui/LoadingState.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { DataProvider } from './contexts/DataContext.jsx'
import { FocusProvider } from './contexts/FocusContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import Challenges from './pages/Challenges.jsx'
import Coach from './pages/Coach.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Domains from './pages/Domains.jsx'
import DomainDetail from './pages/DomainDetail.jsx'
import FocusDetail from './pages/FocusDetail.jsx'
import Goals from './pages/Goals.jsx'
import Home from './pages/Home.jsx'
import JoinSharedChallenge from './pages/JoinSharedChallenge.jsx'
import Login from './pages/Login.jsx'
import Monthly from './pages/Monthly.jsx'
import Profile from './pages/Profile.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Settings from './pages/Settings.jsx'
import Tasks from './pages/Tasks.jsx'

function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="w-full max-w-md space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <span className="grid size-12 place-items-center rounded-xl bg-amber-500/12 text-amber-600"><Settings2 className="size-6" aria-hidden /></span>
        <h1 className="text-lg font-semibold text-fg">Configuration manquante</h1>
        <p className="text-sm text-muted">Copiez <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">.env.example</code> vers <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">.env</code> et renseignez <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> et <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code>, puis relancez l'application.</p>
      </div>
    </div>
  )
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login initialMode="login" />} />
      <Route path="/signup" element={<Login initialMode="signup" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { user, loading, recovery } = useAuth()
  const location = useLocation()
  const next = new URLSearchParams(location.search).get('next')
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null
  const scrollPositions = useRef(new Map())
  const lastPath = useRef(location.pathname)
  const scrollPath = useRef(location.pathname)

  useLayoutEffect(() => {
    if (lastPath.current === location.pathname) return
    lastPath.current = location.pathname
    scrollPath.current = location.pathname
    window.scrollTo(0, scrollPositions.current.get(location.pathname) ?? 0)
  }, [location.pathname])

  useEffect(() => {
    const save = () => scrollPositions.current.set(scrollPath.current, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    save()
    return () => window.removeEventListener('scroll', save)
  }, [])

  if (!isSupabaseConfigured) return <SetupNotice />
  if (loading) return <div className="grid min-h-dvh place-items-center bg-bg"><Spinner className="size-8" /></div>
  if (!user) {
    if (location.pathname.startsWith('/challenges/rejoindre/')) {
      const target = `${location.pathname}${location.search}`
      return <Navigate to={`/login?next=${encodeURIComponent(target)}`} replace />
    }
    return <PublicRoutes />
  }
  if (recovery) return <ResetPassword />
  if (safeNext && (location.pathname === '/login' || location.pathname === '/signup')) return <Navigate to={safeNext} replace />

  return (
    <DataProvider>
      <FocusProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route path="/focus" element={<FocusDetail />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/domains/:id" element={<DomainDetail />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/rejoindre/:code" element={<JoinSharedChallenge />} />
            <Route path="/monthly" element={<Monthly />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </FocusProvider>
    </DataProvider>
  )
}
