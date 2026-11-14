import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'

async function start() {
  if (Capacitor.isNativePlatform()) {
    // El APK ya incluye todos los archivos; un SW antiguo puede servir código de otra versión.
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations() ?? []
      const controlled = !!navigator.serviceWorker?.controller
      await Promise.all(registrations.map(registration => registration.unregister()))
      if (registrations.length && controlled) { window.location.reload(); return }
    } catch { /* Los archivos incluidos en el APK siguen disponibles. */ }
  } else registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary><App /></ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)
}
void start()
