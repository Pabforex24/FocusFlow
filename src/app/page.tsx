import { redirect } from 'next/navigation'

/**
 * Page racine — redirige vers /dashboard
 * Le middleware intercepte et redirige vers /auth/login si non connecté
 * (ou laisse passer si Supabase n'est pas configuré → mode offline)
 */
export default function Home() {
  redirect('/dashboard')
}
