import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, BellOff, Check, Pencil, Trash2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { db } from '../db/database'
import type { InvoiceReminder } from '../types/domain'
import { CopyButton } from '../components/ui/CopyButton'
import { PageTitle } from '../components/ui/Fields'
import { cancelInvoiceNotifications, rebuildInvoiceNotifications, syncInvoiceNotifications } from '../utils/invoiceNotifications'
import { emptyInvoiceReminderDraft, invoiceAlertTime, invoiceWeekdays, loadInvoiceReminderDraft, nextInvoiceAlert, nextInvoiceNotificationBase, saveInvoiceReminderDraft, type InvoiceReminderDraft } from '../utils/invoiceReminders'
import { requestExactOrderAlarms, requestOrderNotificationPermission } from '../utils/orderNotifications'
import { dateAt, localDateString } from '../utils/nextOrders'

const formatDate = (date: Date) => date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })

export function InvoiceRemindersPage() {
  const reminders = useLiveQuery(() => db.invoiceReminders.toArray(), []) ?? []
  const [draft, setDraft] = useState(loadInvoiceReminderDraft)
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [notificationState, setNotificationState] = useState<'unknown' | 'web' | 'active' | 'denied' | 'approximate'>(() => Capacitor.isNativePlatform() ? 'unknown' : 'web')
  useEffect(() => { saveInvoiceReminderDraft(draft) }, [draft])
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let active = true
    void syncInvoiceNotifications().then(result => { if (active) setNotificationState(result.enabled ? result.exact ? 'active' : 'approximate' : 'denied') }).catch(() => { if (active) setNotificationState('denied') })
    return () => { active = false }
  }, [])
  const visible = useMemo(() => [...reminders].sort((a, b) => Number(a.status === 'paid') - Number(b.status === 'paid') || (nextInvoiceAlert(a, now)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (nextInvoiceAlert(b, now)?.getTime() ?? Number.MAX_SAFE_INTEGER) || a.clientName.localeCompare(b.clientName, 'es-CL')), [reminders, now])
  const update = (patch: Partial<InvoiceReminderDraft>) => setDraft(current => ({ ...current, ...patch }))
  const toggleWeekday = (day: number) => setDraft(current => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter(value => value !== day) : [...current.weekdays, day].sort() }))

  async function activateNotifications() {
    try {
      if (!await requestOrderNotificationPermission()) { setNotificationState('denied'); setError('Activa las notificaciones en los ajustes del teléfono.'); return }
      const result = await syncInvoiceNotifications()
      setNotificationState(result.exact ? 'active' : 'approximate')
      setError(''); setMessage('Avisos del teléfono activados.')
    } catch { setError('No se pudieron activar los avisos. Revisa los permisos del teléfono.') }
  }

  async function activateExactAlarms() {
    try {
      if (!await requestExactOrderAlarms()) { setError('El teléfono no autorizó los avisos puntuales.'); return }
      const result = await rebuildInvoiceNotifications()
      setNotificationState(result.exact ? 'active' : 'approximate')
      setError(''); setMessage('Avisos puntuales activados.')
    } catch { setError('No se pudieron activar los avisos puntuales.') }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    const clientName = draft.clientName.trim().replace(/\s+/g, ' ')
    const invoiceNumbers = draft.invoiceNumbers.trim().replace(/\s+/g, ' ')
    const reminderMessage = draft.message.trim()
    if (!clientName || !reminderMessage) { setError('Ingresa el nombre del cliente y un mensaje.'); return }
    if (draft.mode === 'weekly' && draft.weekdays.length < 2) { setError('Selecciona al menos dos días por semana.'); return }
    if (draft.mode === 'once' && (!dateAt(draft.alertDate, invoiceAlertTime.hour, invoiceAlertTime.minute) || dateAt(draft.alertDate, invoiceAlertTime.hour, invoiceAlertTime.minute)!.getTime() <= Date.now())) { setError('Selecciona una fecha futura; el aviso se enviará a las 08:30.'); return }
    setBusy(true); setError(''); setMessage('')
    let previous: InvoiceReminder | undefined
    try {
      previous = draft.editingId ? await db.invoiceReminders.get(draft.editingId) : undefined
      if (draft.editingId && !previous) throw new Error('El aviso ya no existe.')
      if (previous) await cancelInvoiceNotifications(previous)
      const time = new Date().toISOString()
      const reminder: InvoiceReminder = {
        id: previous?.id ?? crypto.randomUUID(), clientName, invoiceNumbers, message: reminderMessage,
        mode: draft.mode, alertDate: draft.mode === 'once' ? draft.alertDate : '', weekdays: draft.mode === 'weekly' ? [...draft.weekdays] : [],
        notificationBase: previous?.notificationBase ?? nextInvoiceNotificationBase(await db.invoiceReminders.toArray()), alertsStopped: previous?.alertsStopped ?? false,
        status: previous?.status ?? 'pending', createdAt: previous?.createdAt ?? time, updatedAt: time,
        ...(previous?.lastContactDate ? { lastContactDate: previous.lastContactDate } : {}),
      }
      await db.invoiceReminders.put(reminder)
      setDraft(emptyInvoiceReminderDraft())
      setMessage(previous ? 'Aviso actualizado.' : 'Aviso guardado.')
      if (Capacitor.isNativePlatform()) {
        try { const result = await syncInvoiceNotifications(); setNotificationState(result.enabled ? result.exact ? 'active' : 'approximate' : 'denied') }
        catch { setError('El aviso quedó guardado, pero no se pudo programar la notificación. Revisa los permisos del teléfono.'); setNotificationState('denied') }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el aviso.')
      if (previous) void syncInvoiceNotifications().catch(() => {})
    } finally { setBusy(false) }
  }

  function edit(reminder: InvoiceReminder) {
    setDraft({ editingId: reminder.id, clientName: reminder.clientName, invoiceNumbers: reminder.invoiceNumbers, message: reminder.message, mode: reminder.mode, alertDate: reminder.alertDate || localDateString(new Date()), weekdays: [...reminder.weekdays] })
    setError(''); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function change(reminder: InvoiceReminder, patch: Partial<InvoiceReminder>, success: string) {
    setError(''); setMessage('')
    try {
      await cancelInvoiceNotifications(reminder)
      await db.invoiceReminders.update(reminder.id, { ...patch, updatedAt: new Date().toISOString() })
      try { await syncInvoiceNotifications(); setMessage(success) }
      catch { setError('El cambio quedó guardado, pero no se pudo actualizar la notificación del teléfono.') }
    } catch { setError('No se pudo actualizar el aviso. Inténtalo de nuevo.') }
  }

  async function remove(reminder: InvoiceReminder) {
    if (!window.confirm(`¿Eliminar el aviso de ${reminder.clientName}?`)) return
    try {
      await cancelInvoiceNotifications(reminder)
      await db.invoiceReminders.delete(reminder.id)
      if (draft.editingId === reminder.id) setDraft(emptyInvoiceReminderDraft())
      setMessage('Aviso eliminado.'); setError('')
    } catch { setError('No se pudo eliminar el aviso.') }
  }

  return <div className="page invoice-reminders-page"><PageTitle eyebrow="RECORDATORIOS" title="Facturas pendientes" />
    <div className="order-reminder-note"><Bell size={18} aria-hidden="true" /><span>Recibe una alerta a las <strong>08:30</strong> en cada día elegido. La app te avisa a ti; tú decides cuándo enviar el mensaje al cliente.</span></div>
    {notificationState === 'web' && <p className="order-notification-status">En la web podrás revisar tus avisos al abrir la app. Instala la APK para recibir notificaciones con la app cerrada.</p>}
    {notificationState === 'denied' && <div className="order-notification-status"><span>Los avisos del teléfono están desactivados.</span><button className="secondary-button" type="button" onClick={() => void activateNotifications()}>Activar notificaciones</button></div>}
    {notificationState === 'approximate' && <div className="order-notification-status"><span>El teléfono puede entregar los avisos con retraso si limita las alarmas exactas.</span><button className="secondary-button" type="button" onClick={() => void activateExactAlarms()}>Activar avisos puntuales</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
    <div className="invoice-reminders-layout"><form className="panel invoice-reminder-form" onSubmit={event => void save(event)}><span className="eyebrow">{draft.editingId ? 'EDITAR AVISO' : 'NUEVO AVISO'}</span><h2>{draft.editingId ? 'Modificar recordatorio' : 'Programar recordatorio'}</h2>
      <label className="field"><span>Nombre del cliente</span><input required maxLength={120} value={draft.clientName} onChange={event => update({ clientName: event.target.value })} placeholder="Escribe el nombre" autoComplete="off" /></label>
      <label className="field"><span>Facturas pendientes</span><input maxLength={500} value={draft.invoiceNumbers} onChange={event => update({ invoiceNumbers: event.target.value })} placeholder="Ej.: F-1024, F-1028" autoComplete="off" /></label>
      <label className="field"><span>Mensaje para el cliente</span><textarea required maxLength={5000} rows={8} value={draft.message} onChange={event => update({ message: event.target.value })} /></label>
      <CopyButton text={draft.message} label="Copiar mensaje" />
      <span className="field-label">Frecuencia</span><div className="invoice-mode-buttons" role="group" aria-label="Frecuencia del aviso"><button className={draft.mode === 'weekly' ? 'active' : ''} type="button" aria-pressed={draft.mode === 'weekly'} onClick={() => update({ mode: 'weekly' })}>2 o más días por semana</button><button className={draft.mode === 'once' ? 'active' : ''} type="button" aria-pressed={draft.mode === 'once'} onClick={() => update({ mode: 'once' })}>Una fecha</button></div>
      {draft.mode === 'weekly' ? <div className="invoice-weekdays"><span className="field-label">Días de aviso</span><div role="group" aria-label="Días de aviso">{invoiceWeekdays.map(({ day, label }) => <button key={day} type="button" className={draft.weekdays.includes(day) ? 'active' : ''} aria-pressed={draft.weekdays.includes(day)} onClick={() => toggleWeekday(day)}>{label}</button>)}</div><small>Elige al menos dos días. Aviso a las 08:30.</small></div> : <label className="field"><span>Fecha del aviso</span><input required type="date" value={draft.alertDate} min={localDateString(now)} onChange={event => update({ alertDate: event.target.value })} /><small>Aviso a las 08:30 de la fecha seleccionada.</small></label>}
      <div className="invoice-form-actions"><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : draft.editingId ? 'Guardar cambios' : 'Guardar aviso'}</button>{draft.editingId && <button className="secondary-button" type="button" onClick={() => setDraft(emptyInvoiceReminderDraft())}>Cancelar edición</button>}</div>
    </form><section className="invoice-reminders-list"><h2>Avisos guardados</h2>
      {visible.length === 0 && <p className="panel next-orders-empty">Aún no tienes avisos de facturas. Agrega el primero en el formulario.</p>}
      {visible.map(reminder => { const next = nextInvoiceAlert(reminder, now); return <article className="next-order-card invoice-reminder-card" key={reminder.id}><div className="next-order-card-head"><h3>{reminder.clientName}</h3><span className={`order-status ${reminder.status === 'paid' ? 'entered' : reminder.alertsStopped ? 'stopped' : 'pending'}`}>{reminder.status === 'paid' ? 'Pagadas' : reminder.alertsStopped ? 'Avisos detenidos' : 'Pendiente'}</span></div>
        {reminder.invoiceNumbers && <p>Facturas: <strong>{reminder.invoiceNumbers}</strong></p>}
        <p>{reminder.mode === 'weekly' ? `Avisos: ${invoiceWeekdays.filter(item => reminder.weekdays.includes(item.day)).map(item => item.label).join(' · ')} · 08:30` : `Fecha: ${dateAt(reminder.alertDate, 12, 0)?.toLocaleDateString('es-CL') ?? reminder.alertDate} · 08:30`}</p>
        {next && <p className="invoice-next-alert">Próximo aviso: <strong>{formatDate(next)} · 08:30</strong></p>}
        {reminder.lastContactDate && <p>Último contacto: {dateAt(reminder.lastContactDate, 12, 0)?.toLocaleDateString('es-CL') ?? reminder.lastContactDate}</p>}
        <div className="invoice-message-preview"><strong>Mensaje</strong><p>{reminder.message}</p></div>
        <div className="invoice-card-actions"><CopyButton text={reminder.message} label="Copiar mensaje" />{reminder.status === 'pending' && <><button className="secondary-button" type="button" onClick={() => void change(reminder, { lastContactDate: localDateString(new Date()) }, 'Contacto registrado. El próximo aviso seguirá programado.') }><Check size={16} /> Ya avisé</button><button className="secondary-button" type="button" onClick={() => void change(reminder, { alertsStopped: !reminder.alertsStopped }, reminder.alertsStopped ? 'Avisos reactivados.' : 'Avisos detenidos.')}>{reminder.alertsStopped ? <Bell size={16} /> : <BellOff size={16} />}{reminder.alertsStopped ? 'Reactivar' : 'Detener avisos'}</button><button className="secondary-button" type="button" onClick={() => void change(reminder, { status: 'paid', alertsStopped: true }, 'Facturas marcadas como pagadas.')}>Marcar pagadas</button></>}{reminder.status === 'paid' && <button className="secondary-button" type="button" onClick={() => void change(reminder, { status: 'pending', alertsStopped: false }, 'Aviso reactivado.')}>Reactivar</button>}<button className="secondary-button" type="button" onClick={() => edit(reminder)}><Pencil size={16} /> Editar</button></div>
        <button className="next-order-delete" type="button" onClick={() => void remove(reminder)}><Trash2 size={15} /> Eliminar</button>
      </article> })}
    </section></div>
  </div>
}
