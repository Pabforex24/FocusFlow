import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LucideProvider } from 'lucide-react'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import './styles/index.css'

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
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LucideProvider>
    </ErrorBoundary>
  </StrictMode>
)

// Service worker : uniquement en production, pour ne pas gêner le développement.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.error('[pwa] service worker non enregistré', error))
  })
}
