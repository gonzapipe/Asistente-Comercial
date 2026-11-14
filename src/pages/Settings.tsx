import { useEffect, useRef, useState } from 'react'
import { updateSettings } from '../db/database'
import { useAppSettings } from '../components/SettingsContext'
import { Field, PageTitle } from '../components/ui/Fields'
import { numericInput, numericValue } from '../utils/numericInput'
import { exportBackup, importBackup } from '../utils/backup'
import { version as appVersion } from '../../package.json'
import { backupSizeError, maxBackupBytes } from '../utils/backupLimits'

export function SettingsPage() {
  const saved = useAppSettings()
  const [taxRate, setTaxRate] = useState(String(saved.taxRateBps / 100))
  const [message, setMessage] = useState('')
  const [backupMessage, setBackupMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const backupBusy = useRef(false)
  useEffect(() => { setTaxRate(String(saved.taxRateBps / 100)) }, [saved.taxRateBps])
  async function save(event: React.FormEvent) {
    event.preventDefault()
    const value = numericValue(taxRate)
    if (value === null || value < 0 || value > 100) { setMessage('Ingresa un IVA entre 0% y 100%.'); return }
    try {
      await updateSettings({ taxRateBps: Math.round(value * 100) })
      setMessage('IVA guardado. El nuevo porcentaje se aplica en todas las calculadoras.')
    } catch { setMessage('No se pudo guardar el IVA. Inténtalo de nuevo.') }
  }
  async function changeTheme(theme: 'light' | 'dark') {
    try { await updateSettings({ theme }); setMessage('') }
    catch { setMessage('No se pudo guardar el modo de visualización. Inténtalo de nuevo.') }
  }
  async function downloadBackup() {
    if (backupBusy.current) return
    backupBusy.current = true
    try { setBackupMessage(await exportBackup()) }
    catch (error) { setBackupMessage(error instanceof Error && error.message === backupSizeError ? backupSizeError : 'No se pudo crear el respaldo. Revisa el almacenamiento disponible.') }
    finally { backupBusy.current = false }
  }
  async function restoreBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || backupBusy.current) return
    if (file.size > maxBackupBytes) { setBackupMessage(backupSizeError); return }
    if (!window.confirm('Se añadirán notas, contactos y cálculos que falten. Los borradores, ajustes, productos, precios, categorías y próximos pedidos del respaldo reemplazarán los actuales. ¿Importar este archivo?')) return
    backupBusy.current = true
    try {
      const added = await importBackup(await file.text())
      setBackupMessage(`Respaldo importado: ${added.notes} notas, ${added.agenda} contactos y ${added.history} cálculos nuevos.`)
    } catch { setBackupMessage('No se pudo importar. Comprueba que sea un respaldo válido de Venta Fácil Precios.') }
    finally { backupBusy.current = false }
  }
  return <div className="page settings-page"><PageTitle eyebrow="PREFERENCIAS DE CÁLCULO" title="Ajustes"/>
    <form className="panel settings-card" onSubmit={save}><span className="eyebrow">IMPUESTOS</span><h2>IVA para tus cálculos</h2><p>La app usa pesos chilenos y un IVA inicial del 19%. Cambia el porcentaje si necesitas simular otra tasa.</p><Field label="Porcentaje de IVA (%)" type="text" inputMode="decimal" autoComplete="off" value={taxRate} onChange={e => { const next = numericInput(e.target.value, 2, 100); if (next !== null) setTaxRate(next) }}/><button className="primary-button" type="submit">Guardar IVA</button>{message && <p className={message.startsWith('Ingresa') || message.startsWith('No') ? 'form-error' : 'form-success'} role="status">{message}</p>}</form>
    <section className="panel settings-card theme-card"><span className="eyebrow">APARIENCIA</span><h2>Modo de visualización</h2><p>Elige el contraste que prefieras. Tu elección queda guardada en este dispositivo.</p><div className="segmented" role="group" aria-label="Modo de visualización"><button type="button" className={saved.theme === 'light' ? 'selected' : ''} aria-pressed={saved.theme === 'light'} onClick={() => void changeTheme('light')}>Modo claro</button><button type="button" className={saved.theme !== 'light' ? 'selected' : ''} aria-pressed={saved.theme !== 'light'} onClick={() => void changeTheme('dark')}>Modo oscuro</button></div></section>
    <section className="panel settings-card theme-card"><span className="eyebrow">TUS DATOS</span><h2>Respaldo local</h2><p>Guarda notas, Agenda, comparativos, productos, precios, categorías, próximos pedidos y últimos valores en un archivo JSON. También conserva datos históricos de respaldos anteriores. Puede contener datos personales: consérvalo en un lugar seguro.</p><div className="backup-actions"><button type="button" className="secondary-button" onClick={() => void downloadBackup()}>Exportar respaldo</button><button type="button" className="secondary-button" onClick={() => importRef.current?.click()}>Importar respaldo</button></div><input ref={importRef} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Seleccionar archivo de respaldo" onChange={event => void restoreBackup(event)}/>{backupMessage && <p className={backupMessage.startsWith('No') || backupMessage.startsWith('El') ? 'form-error' : 'form-success'} role="status">{backupMessage}</p>}</section>
    <section className="panel settings-card theme-card"><span className="eyebrow">APLICACIÓN</span><h2>Calculadora Comercial</h2><p>Versión <strong>{appVersion}</strong></p></section>
  </div>
}
