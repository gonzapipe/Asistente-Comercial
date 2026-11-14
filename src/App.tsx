import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { SystemBars, SystemBarsStyle } from '@capacitor/core'
import { AppShell } from './components/layout/AppShell'
import { db, initializeDatabase } from './db/database'
import { storageUnavailable, subscribeStorage } from './utils/draftStorage'
import { defaultSettings } from './db/database'
import { SettingsContext } from './components/SettingsContext'

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Calculators = lazy(() => import('./pages/Calculators').then(m => ({ default: m.Calculators })))
const BasicCalculator = lazy(() => import('./pages/BasicCalculator').then(m => ({ default: m.BasicCalculator })))
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })))
const NotesPage = lazy(() => import('./pages/Notes').then(m => ({ default: m.NotesPage })))
const AgendaPage = lazy(() => import('./pages/Agenda').then(m => ({ default: m.AgendaPage })))
const TargetPricePage = lazy(() => import('./pages/TargetPrice').then(m => ({ default: m.TargetPricePage })))
const PriceCatalogPage = lazy(() => import('./pages/PriceCatalog').then(m => ({ default: m.PriceCatalog })))
const NextOrdersPage = lazy(() => import('./pages/NextOrders').then(m => ({ default: m.NextOrdersPage })))

export default function App() {
  const [dbError, setDbError] = useState('')
  const draftError = useSyncExternalStore(subscribeStorage, storageUnavailable)
  const settings = useLiveQuery(async () => await db.settings.get('global') ?? defaultSettings, [])
  const themePreference = settings?.theme
  useEffect(() => { initializeDatabase().catch(() => setDbError('No se pudo preparar el almacenamiento local. Revisa los permisos del navegador.')) }, [])
  useEffect(() => {
    const light = themePreference === 'light'
    document.documentElement.dataset.theme = light ? 'light' : 'dark'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#e8eef5' : '#0b1424')
    void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {})
  }, [themePreference])
  return <>
    <SettingsContext.Provider value={settings ?? defaultSettings}>
    <Suspense fallback={<div className="loading" role="status">Cargando Venta Fácil…</div>}>
      {settings === undefined ? <div className="loading" role="status">Cargando ajustes…</div> :
      <Routes><Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="iva" element={<Calculators mode="iva" />} />
        <Route path="descuentos" element={<Calculators mode="descuento" />} />
        <Route path="margen" element={<Calculators mode="margen" />} />
        <Route path="cantidades" element={<Calculators mode="cantidad" />} />
        <Route path="comparativos" element={<Calculators mode="comparar" />} />
        <Route path="productos" element={<PriceCatalogPage />} />
        <Route path="proximos-pedidos" element={<NextOrdersPage />} />
        <Route path="precio-objetivo" element={<TargetPricePage />} />
        <Route path="calculadora" element={<BasicCalculator />} />
        <Route path="notas" element={<NotesPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route></Routes>}
    </Suspense>
    </SettingsContext.Provider>
    {dbError && <div className="error-toast" role="alert">{dbError}</div>}
    {!dbError && draftError && <div className="error-toast" role="alert">No se pudo guardar en el dispositivo. Los últimos valores se conservan mientras la app siga abierta. Exporta un respaldo desde Ajustes antes de cerrarla.</div>}
  </>
}
