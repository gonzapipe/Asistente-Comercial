import test from 'node:test'
import assert from 'node:assert/strict'
import { dateAt, emptyNextOrderDraft, isOrderDueToday, loadNextOrderDraft, nextNotificationBase, nextReminderToday, orderDeadlinePassed, orderItems, reminderSchedule, saveNextOrderDraft } from '../src/utils/nextOrders.ts'

const order = { id: 'a', customerName: 'Cliente', productName: 'Producto', quantity: '12', entryDate: '2026-11-16', deliveryDate: '2026-11-18', notificationBase: 100000, alertsStopped: false, status: 'pending', createdAt: '2026-11-13T10:00:00.000Z', updatedAt: '2026-11-13T10:00:00.000Z' }

test('los avisos comienzan a las 08:30 y terminan antes de las 16:30', () => {
  const all = reminderSchedule(order, new Date(2026, 10, 16, 8, 29))
  assert.deepEqual(all.map(item => item.label), ['08:30', '11:00', '13:00', '15:00', '16:15'])
  assert.deepEqual(all.map(item => item.id), [100000, 100001, 100002, 100003, 100004])
  assert.deepEqual(reminderSchedule(order, new Date(2026, 10, 16, 11, 30)).map(item => item.label), ['13:00', '15:00', '16:15'])
  assert.equal(reminderSchedule(order, new Date(2026, 10, 16, 16, 16)).length, 0)
  assert.equal(orderDeadlinePassed(order, new Date(2026, 10, 16, 16, 29)), false)
  assert.equal(orderDeadlinePassed(order, new Date(2026, 10, 16, 16, 30)), true)
})

test('detener avisos o marcar ingresado cancela futuras alertas lógicas', () => {
  const now = new Date(2026, 10, 16, 8, 30)
  assert.equal(reminderSchedule({ ...order, alertsStopped: true }, now).length, 0)
  assert.equal(reminderSchedule({ ...order, status: 'entered' }, now).length, 0)
  assert.equal(isOrderDueToday(order, now), true)
  assert.equal(isOrderDueToday({ ...order, status: 'entered' }, now), false)
})

test('el resumen de inicio muestra el siguiente aviso real de los pedidos de hoy', () => {
  const now = new Date(2026, 10, 16, 10, 30)
  assert.equal(nextReminderToday([order], now), '11:00')
  assert.equal(nextReminderToday([{ ...order, alertsStopped: true }], now), null)
  assert.equal(nextReminderToday([{ ...order, status: 'entered' }], now), null)
  assert.equal(nextReminderToday([order], new Date(2026, 10, 16, 16, 16)), null)
  assert.equal(nextReminderToday([order], new Date(2026, 10, 17, 10, 30)), null)
})

test('fechas imposibles se rechazan y los identificadores de avisos no se superponen', () => {
  assert.equal(dateAt('2026-02-30', 9, 0), null)
  assert.equal(dateAt('2026-11-16', 9, 0)?.getHours(), 9)
  assert.equal(nextNotificationBase([order]), 100010)
})

test('el borrador de un próximo pedido se conserva al cambiar de pantalla', () => {
  const entries = new Map()
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }
  const draft = { ...emptyNextOrderDraft(), customerName: 'Comercial Los Aromos', items: [{ id: 'p1', name: 'Papas', quantity: '12' }, { id: 'p2', name: 'Aceite', quantity: '2.5' }], entryDate: '2026-11-16' }
  saveNextOrderDraft(draft, storage)
  assert.deepEqual(loadNextOrderDraft(storage), draft)
})

test('un recordatorio antiguo conserva su producto y un borrador antiguo se adapta', () => {
  assert.deepEqual(orderItems(order), [{ id: 'a-legacy', name: 'Producto', quantity: '12' }])
  const legacy = JSON.stringify({ customerName: 'Cliente', productName: 'Papas', quantity: '3', entryDate: '2026-11-16', deliveryDate: '2026-11-18' })
  const draft = loadNextOrderDraft({ getItem: () => legacy })
  assert.equal(draft.items.length, 1)
  assert.deepEqual({ name: draft.items[0].name, quantity: draft.items[0].quantity }, { name: 'Papas', quantity: '3' })
  assert.equal('deliveryDate' in draft, false)
})
