import { Outfit } from 'next/font/google'
import { ToastProvider } from '@/components/ui/Toast'
import { StoreHydrator } from '@/components/StoreHydrator'
import { PWAHandler } from '@/components/PWAHandler'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050812',
}

export const metadata = {
  title: 'FocusFlow — Discipline Personnelle',
  description: 'Transformez vos objectifs long terme en actions quotidiennes concrètes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FocusFlow',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

/**
 * Layout racine — HTML shell uniquement.
 * La Sidebar est gérée par src/app/(app)/layout.tsx (pages protégées).
 * Les pages /auth/* utilisent src/app/auth/layout.tsx (sans Sidebar).
 *
 * ⚠️ Ne pas ajouter overflow-y-auto ici ni sur <main> — cela crée un BFC
 * qui piège les modals en position:fixed hors de la viewport.
 */
export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="fr" className={outfit.variable}>
      <body className="bg-bg text-content font-body antialiased">
        <StoreHydrator />
        <PWAHandler />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
