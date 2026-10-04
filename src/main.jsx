import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LucideProvider } from 'lucide-react'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
// Polices hébergées avec l'application (pas de Google Fonts) : rapides, disponibles hors-ligne, sans suivi par un tiers.
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/sora'
import './styles/index.css'
import { installGlobalErrorReporting } from './lib/report.js'

installGlobalErrorReporting()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Style d'icônes unique pour toute l'application : trait fin de 1,75 */}
      <LucideProvider strokeWidth={1.75}>
        <ThemeProvider>
          <BrowserRouter>
            <ToastProvider>
              <AuthProvider>
                <App />
                <UpdatePrompt />
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LucideProvider>
    </ErrorBoundary>
  </StrictMode>
)

// Le service worker (production uniquement) est enregistré par <UpdatePrompt />, qui affiche aussi le bandeau de mise à jour.
