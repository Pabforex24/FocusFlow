import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FocusFlow — Discipline Personnelle',
  description: 'Transformez vos objectifs long terme en actions quotidiennes concrètes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={outfit.variable}>
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
