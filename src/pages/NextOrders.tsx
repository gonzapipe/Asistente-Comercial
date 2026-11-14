import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, BellOff, Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { db } from '../db/database'
import type { NextOrder } from '../types/domain'
import { numericInput, numericValue } from '../utils/numericInput'
import { cancelOrderReminders, rebuildOrderNotifications, requestExactOrderAlarms, requestOrderNotificationPermission, syncOrderNotifications } from '../utils/orderNotifications'
import { dateAt, emptyNextOrderDraft, emptyNextOrderItem, isOrderDueToday, loadNextOrderDraft, localDateString, nextNotificationBase, orderCutoff, orderDeadlinePassed, orderItems, reminderSchedule, saveNextOrderDraft, type NextOrderDraft } from '../utils/nextOrders'
import { PageTitle } from '../components/ui/Fields'

const displayDate = (value: string) => dateAt(value, 12, 0)?.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) ?? value

export function NextOrdersPage() {
  const orders = useLiveQuery(() => db.nextOrders.toArray(), []) ?? []
  const [draft, setDraft] = useState(loadNextOrderDraft)
  const [showEntered, setShowEntered] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notificationState, setNotificationState] = useState<'unknown' | 'active' | 'approximate' | 'denied' | 'browser'>('unknown')
  const [busy, setBusy] = useState(false)
  useEffect(() => { saveNextOrderDraft(draft) }, [draft])
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) { setNotificationState('browser'); return }
    let active = true
    void syncOrderNotifications().then(result => { if (active) setNotificationState(result.enabled ? result.exact ? 'active' : 'approximate' : 'denied') }).catch(() => { if (active) setNotificationState('denied') })
    return () => { active = false }
  }, [])
  const dueToday = useMemo(() => orders.filter(order => isOrderDueToday(order, now)), [orders, now])
  const visible = useMemo(() => orders.filter(order => showEntered ? order.status === 'entered' : order.status === 'pending').sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.customerName.localeCompare(b.customerName, 'es-CL')), [orders, showEntered])
  const update = (patch: Partial<NextOrderDraft>) => setDraft(current => ({ ...current, ...patch }))
  const updateItem = (id: string, patch: Partial<NextOrderDraft['items'][number]>) => setDraft(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...patch } : item) }))
  const addItem = () => setDraft(current => ({ ...current, items: [...current.items, emptyNextOrderItem()] }))
  const removeItem = (id: string) => setDraft(current => ({ ...current, items: current.items.length > 1 ? current.items.filter(item => item.id !== id) : current.items }))

  async function refreshNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) { setNotificationState('browser'); return }
    try {
      const allowed = await requestOrderNotificationPermission()
      if (!allowed) { setNotificationState('denied'); setError('Activa las notificaciones en los ajustes del teléfono para recibir avisos con la app cerrada.'); return }
      const result = await syncOrderNotifications()
      setNotificationState(result.exact ? 'active' : 'approximate')
    } catch { setNotificationState('denied'); setError('No se pudieron activar las notificaciones. Revisa los permisos del teléfono.') }
  }

  async function enableExactAlarms(): Promise<void> {
    try {
      const granted = await requestExactOrderAlarms()
      if (granted) { const result = await rebuildOrderNotifications(); setNotificationState(result.exact ? 'active' : 'approximate'); setMessage('Avisos puntuales activados.') }
      else setError('El teléfono no autorizó los avisos puntuales. Los avisos pueden llegar con retraso.')
    } catch { setError('No se pudo abrir la configuración de avisos puntuales.') }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    const customerName = draft.customerName.trim().replace(/\s+/g, ' ')
    const items = draft.items.map(item => ({ id: item.id, name: item.name.trim().replace(/\s+/g, ' '), quantity: item.quantity }))
    const entry = dateAt(draft.entryDate, 12, 0)
    if (!customerName || items.length === 0 || items.some(item => !item.name || !numericValue(item.quantity) || numericValue(item.quantity)! <= 0 || numericValue(item.quantity)! > 1_000_000_000) || !entry) { setError('Completa cliente, cada producto y su cantidad, y la fecha de ingreso con valores válidos.'); return }
    const currentNow = new Date()
    if (!draft.editingId && draft.entryDate < localDateString(currentNow)) { setError('Elige hoy o una fecha futura para recibir avisos.'); return }
    const cutoff = dateAt(draft.entryDate, orderCutoff.hour, orderCutoff.minute)
    if (!draft.editingId && cutoff && cutoff <= currentNow) { setError('El plazo de ingreso de esa fecha ya terminó. Elige otro día.'); return }
    setBusy(true); setError(''); setMessage('')
    let previous: NextOrder | undefined
    try {
      previous = draft.editingId ? await db.nextOrders.get(draft.editingId) : undefined
      if (draft.editingId && !previous) throw new Error('El recordatorio ya no existe.')
      if (previous) await cancelOrderReminders(previous)
      const time = new Date().toISOString()
      const order: NextOrder = { id: previous?.id ?? crypto.randomUUID(), customerName, productName: items[0].name, quantity: items[0].quantity, items, entryDate: draft.entryDate, notificationBase: previous?.notificationBase ?? nextNotificationBase(orders), alertsStopped: previous?.alertsStopped ?? false, status: previous?.status ?? 'pending', createdAt: previous?.createdAt ?? time, updatedAt: time, ...(previous?.enteredAt ? { enteredAt: previous.enteredAt } : {}) }
      await db.nextOrders.put(order)
      setDraft(emptyNextOrderDraft())
      setMessage(previous ? 'Recordatorio actualizado.' : 'Recordatorio guardado.')
      await refreshNotifications()
      if (order.status === 'pending' && !order.alertsStopped && reminderSchedule(order, currentNow).length === 0) setMessage('Recordatorio guardado. No quedan avisos por programar para esa fecha.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el recordatorio.')
      if (previous) void syncOrderNotifications().catch(() => {})
    } finally { setBusy(false) }
  }

  function edit(order: NextOrder) {
    setDraft({ editingId: order.id, customerName: order.customerName, items: orderItems(order), entryDate: order.entryDate })
    setError(''); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function changeAlerts(order: NextOrder) {
    setError(''); setMessage('')
    if (order.alertsStopped && reminderSchedule({ ...order, alertsStopped: false }, new Date()).length === 0) { setError('Ya no quedan horarios de aviso para este pedido. Edita la fecha de ingreso para reactivarlos.'); return }
    try {
      if (!order.alertsStopped) await cancelOrderReminders(order)
      await db.nextOrders.update(order.id, { alertsStopped: !order.alertsStopped, updatedAt: new Date().toISOString() })
      if (order.alertsStopped) { await refreshNotifications(); setMessage('Avisos reactivados para este pedido.') }
      else setMessage('Los avisos de este pedido se detuvieron.')
    } catch { setError('No se pudo cambiar el estado de los avisos. Inténtalo de nuevo.') }
  }

  async function markEntered(order: NextOrder) {
    setError(''); setMessage('')
    try {
      await cancelOrderReminders(order)
      await db.nextOrders.update(order.id, { status: 'entered', alertsStopped: true, enteredAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      setMessage('Pedido marcado como ingresado. Se cancelaron sus avisos.')
    } catch { setError('No se pudo marcar el pedido. Inténtalo de nuevo.') }
  }

  async function remove(order: NextOrder) {
    if (!window.confirm(`¿Eliminar el recordatorio de ${order.customerName}?`)) return
    try {
      await cancelOrderReminders(order)
      await db.nextOrders.delete(order.id)
      if (draft.editingId === order.id) setDraft(emptyNextOrderDraft())
      setMessage('Recordatorio eliminado.'); setError('')
    } catch { setError('No se pudo eliminar el recordatorio.') }
  }

  return <div className="page next-orders-page"><PageTitle eyebrow="PRÓXIMOS PEDIDOS" title="Organiza tus pedidos" />
    <div className="order-reminder-note"><Bell size={18} aria-hidden="true" /><span>Avisos a las <strong>09:00, 11:00, 13:00, 15:00 y 16:15</strong> del día elegido, hasta que los detengas.</span></div>
    {notificationState === 'browser' && <p className="order-notification-status">En la web verás los pendientes al abrir esta pantalla. Instala la APK para recibir avisos del teléfono con la app cerrada.</p>}
    {notificationState === 'denied' && <div className="order-notification-status"><span>Los avisos del teléfono están desactivados.</span><button type="button" className="secondary-button" onClick={() => void refreshNotifications()}>Activar notificaciones</button></div>}
    {notificationState === 'approximate' && <div className="order-notification-status"><span>Los avisos pueden llegar con retraso por la configuración del teléfono.</span><button type="button" className="secondary-button" onClick={() => void enableExactAlarms()}>Activar avisos puntuales</button></div>}
    {dueToday.length > 0 && <div className="order-today-alert" role="status"><strong>{orderDeadlinePassed(dueToday[0], now) ? 'Plazo de hoy vencido' : `${dueToday.length} ${dueToday.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'} para hoy`}</strong><span>{orderDeadlinePassed(dueToday[0], now) ? 'Revisa los pedidos que aún no se han marcado como ingresados.' : 'Recuerda ingresarlos antes de las 16:30.'}</span></div>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
    <div className="next-orders-layout"><form className="panel next-order-form" onSubmit={event => void save(event)}><span className="eyebrow">{draft.editingId ? 'EDITAR RECORDATORIO' : 'NUEVO RECORDATORIO'}</span><h2>{draft.editingId ? 'Modificar pedido próximo' : 'Agregar pedido próximo'}</h2>
      <label className="field"><span>Nombre del cliente</span><input required maxLength={120} value={draft.customerName} onChange={event => update({ customerName: event.target.value })} placeholder="Ej.: Comercial Los Aromos" autoComplete="off" /></label>
      <div className="next-order-items"><h3>Productos</h3>{draft.items.map((item, index) => <div className="next-order-item" key={item.id}><div className={`next-order-item-fields${draft.items.length > 1 ? ' has-remove' : ''}`}><label className="field"><span>Nombre del producto {draft.items.length > 1 ? index + 1 : ''}</span><input required maxLength={160} value={item.name} onChange={event => updateItem(item.id, { name: event.target.value })} placeholder="Escribe el producto" autoComplete="off" /></label><label className="field"><span>Cantidad</span><input required type="text" inputMode="decimal" value={item.quantity} onChange={event => { const value = numericInput(event.target.value, 3, 1_000_000_000); if (value !== null) updateItem(item.id, { quantity: value }) }} placeholder="12" /></label>{draft.items.length > 1 && <button type="button" className="next-order-remove-item" aria-label={`Quitar producto ${index + 1}`} title={`Quitar producto ${index + 1}`} onClick={() => removeItem(item.id)}><Trash2 size={17} /></button>}</div></div>)}<button type="button" className="secondary-button next-order-add-item" onClick={addItem} disabled={draft.items.length >= 50}><Plus size={17} /> Agregar otro producto</button></div>
      <label className="field next-order-entry-date"><span>Fecha de ingreso del pedido</span><input required type="date" value={draft.entryDate} onChange={event => update({ entryDate: event.target.value })} /><small>Ingresar pedido antes de las 16:30.</small></label>
      <div className="next-order-form-actions"><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : draft.editingId ? 'Guardar cambios' : 'Guardar recordatorio'}</button>{draft.editingId && <button className="secondary-button" type="button" onClick={() => setDraft(emptyNextOrderDraft())}>Cancelar edición</button>}</div>
      <p className="helper">Marca “Ya ingresé el pedido” para detener los avisos.</p>
    </form><section className="next-orders-list"><div className="next-orders-heading"><h2>{showEntered ? 'Ingresados' : 'Pendientes'}</h2><div className="next-order-filter" role="group" aria-label="Estado de los recordatorios"><button type="button" className={!showEntered ? 'active' : ''} aria-pressed={!showEntered} onClick={() => setShowEntered(false)}>Pendientes</button><button type="button" className={showEntered ? 'active' : ''} aria-pressed={showEntered} onClick={() => setShowEntered(true)}>Ingresados</button></div></div>
      {visible.length === 0 && <p className="panel next-orders-empty">{showEntered ? 'No hay pedidos marcados como ingresados.' : 'Aún no tienes pedidos próximos. Agrega el primero en el formulario.'}</p>}
      {visible.map(order => {
        const items = orderItems(order)
        const itemList = <ul className="next-order-card-items">{items.map(item => <li key={item.id}><span>{item.name}</span><strong>× {item.quantity}</strong></li>)}</ul>
        return <article className="next-order-card" key={order.id}>
          <div className="next-order-card-head"><h3>{order.customerName}</h3><span className={order.status === 'entered' ? 'order-status entered' : orderDeadlinePassed(order, now) ? 'order-status overdue' : order.alertsStopped ? 'order-status stopped' : 'order-status pending'}>{order.status === 'entered' ? 'Ingresado' : orderDeadlinePassed(order, now) ? 'Plazo vencido' : order.alertsStopped ? 'Avisos detenidos' : isOrderDueToday(order, now) ? 'Ingresar hoy' : 'Próximo'}</span></div>
          {items.length === 1 ? itemList : <details className="next-order-card-details"><summary>{items.length} productos · Ver detalles</summary>{itemList}</details>}
          <div className="next-order-dates"><span>Ingresar: {displayDate(order.entryDate)}</span></div>
          {order.status === 'pending' && <div className="next-order-actions"><button type="button" className="secondary-button" onClick={() => void markEntered(order)}><Check size={16} /> Ya ingresé el pedido</button><button type="button" className="secondary-button" onClick={() => void changeAlerts(order)}>{order.alertsStopped ? <Bell size={16} /> : <BellOff size={16} />}{order.alertsStopped ? 'Reactivar avisos' : 'Detener avisos'}</button><button type="button" className="secondary-button" onClick={() => edit(order)}><Pencil size={16} /> Editar</button></div>}
          <button type="button" className="next-order-delete" onClick={() => void remove(order)}><Trash2 size={15} /> Eliminar</button>
        </article>
      })}
    </section></div>
  </div>
}
