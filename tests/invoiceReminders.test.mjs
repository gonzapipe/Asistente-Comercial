import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultInvoiceMessage, emptyInvoiceReminderDraft, invoiceAlertTime, loadInvoiceReminderDraft, nextInvoiceAlert, nextInvoiceNotificationBase, saveInvoiceReminderDraft } from '../src/utils/invoiceReminders.ts'

const reminder = { id: 'a', clientName: 'Cliente', invoiceNumbers: 'F-1', message: defaultInvoiceMessage, mode: 'weekly', alertDate: '', weekdays: [1, 4], notificationBase: 1_500_000_000, alertsStopped: false, status: 'pending' }

test('el mensaje inicial conserva el texto y el WhatsApp indicados', () => {
  assert.match(defaultInvoiceMessage, /DIMER S\.A\./)
  assert.match(defaultInvoiceMessage, /comprobante de pago/)
  assert.match(defaultInvoiceMessage, /\+569 5814 9710/)
  assert.deepEqual(invoiceAlertTime, { hour: 8, minute: 30 })
})

test('los avisos semanales ocurren a las 08:30 de los días elegidos', () => {
  assert.equal(nextInvoiceAlert(reminder, new Date(2026, 10, 23, 8, 29))?.getTime(), new Date(2026, 10, 23, 8, 30).getTime())
  assert.equal(nextInvoiceAlert(reminder, new Date(2026, 10, 23, 8, 31))?.getTime(), new Date(2026, 10, 26, 8, 30).getTime())
  assert.equal(nextInvoiceAlert({ ...reminder, alertsStopped: true }, new Date(2026, 10, 23, 8, 29)), null)
  assert.equal(nextInvoiceAlert({ ...reminder, status: 'paid' }, new Date(2026, 10, 23, 8, 29)), null)
})

test('la fecha puntual se alerta una vez y no antes del día seleccionado', () => {
  const once = { ...reminder, mode: 'once', alertDate: '2026-11-25', weekdays: [] }
  assert.equal(nextInvoiceAlert(once, new Date(2026, 10, 24, 15))?.getTime(), new Date(2026, 10, 25, 8, 30).getTime())
  assert.equal(nextInvoiceAlert(once, new Date(2026, 10, 25, 8, 30)), null)
})

test('el borrador editable persiste y los identificadores quedan fuera del rango de pedidos', () => {
  const entries = new Map()
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }
  const draft = { ...emptyInvoiceReminderDraft(), clientName: 'Los Aromos', weekdays: [2, 5], message: 'Texto propio' }
  saveInvoiceReminderDraft(draft, storage)
  assert.deepEqual(loadInvoiceReminderDraft(storage), draft)
  assert.equal(nextInvoiceNotificationBase([]), 1_500_000_000)
  assert.equal(nextInvoiceNotificationBase([reminder]), 1_500_000_010)
})
