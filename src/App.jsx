import { Navigate, Route, Routes } from 'react-router-dom'
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
import Goals from './pages/Goals.jsx'
import Login from './pages/Login.jsx'
import Monthly from './pages/Monthly.jsx'
import Profile from './pages/Profile.jsx'
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

export default function App() {
  const { user, loading } = useAuth()
  if (!isSupabaseConfigured) return <SetupNotice />
  if (loading) return <div className="grid min-h-dvh place-items-center bg-bg"><Spinner className="size-8" /></div>
  if (!user) return <Login />

  return (
    <DataProvider>
      <FocusProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/monthly" element={<Monthly />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </FocusProvider>
    </DataProvider>
  )
}
