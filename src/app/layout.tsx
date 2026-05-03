import type { Metadata } from 'next'
import { Space_Grotesk, Bricolage_Grotesque } from 'next/font/google'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'FocusFlow — Discipline Personnelle',
  description: 'Transformez vos objectifs long terme en actions quotidiennes concrètes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${bricolageGrotesque.variable}`}>
      {/*
        ⚠️  NE PAS mettre overflow-y-auto sur <main> ni sur le wrapper flex :
        cela crée un contexte de scroll isolé (BFC) qui casse position:fixed
        des modals — ils se positionnent par rapport au conteneur, pas la viewport.
        Le scroll naturel du document (body) suffit.
      */}
      <body className="bg-bg text-content font-body antialiased">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
