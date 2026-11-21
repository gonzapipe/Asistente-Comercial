import type { InvoiceReminder } from '../types/domain.ts'
import { draftStorage } from './draftStorage.ts'
import { dateAt, localDateString } from './nextOrders.ts'

export const defaultInvoiceMessage = `Hola, le hablo de DIMER S.A. Le escribo para recordarle que existen facturas pendientes.

Les agradeceríamos cancelar a tiempo y con anticipación a fin de evitar atrasos en sus pedidos.

Es importante que al cancelar nos envíe el comprobante de pago al WhatsApp del vendedor para gestionar la normalización de su cuenta.

WhatsApp: +569 5814 9710`

export const invoiceWeekdays = [
  { day: 1, label: 'Lun' }, { day: 2, label: 'Mar' }, { day: 3, label: 'Mie' },
  { day: 4, label: 'Jue' }, { day: 5, label: 'Vie' },
] as const
export const invoiceAlertTime = { hour: 8, minute: 30 } as const
export type InvoiceReminderDraft = Pick<InvoiceReminder, 'clientName' | 'invoiceNumbers' | 'message' | 'mode' | 'alertDate' | 'weekdays'> & { editingId: string | null }
export const invoiceDraftKey = 'venta-facil:facturas-pendientes-borrador:v1'
export const emptyInvoiceReminderDraft = (): InvoiceReminderDraft => ({ editingId: null, clientName: '', invoiceNumbers: '', message: defaultInvoiceMessage, mode: 'weekly', alertDate: localDateString(new Date()), weekdays: [1, 4] })

export function loadInvoiceReminderDraft(storage?: Pick<Storage, 'getItem'>): InvoiceReminderDraft {
  try {
    const value: unknown = JSON.parse((storage ?? draftStorage).getItem(invoiceDraftKey) ?? 'null')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyInvoiceReminderDraft()
    const row = value as Record<string, unknown>
    const text = (key: string, max: number) => typeof row[key] === 'string' ? row[key].slice(0, max) : ''
    return {
      editingId: typeof row.editingId === 'string' && row.editingId.length <= 100 ? row.editingId : null,
      clientName: text('clientName', 120), invoiceNumbers: text('invoiceNumbers', 500),
      message: text('message', 5000), mode: row.mode === 'once' ? 'once' : 'weekly',
      alertDate: text('alertDate', 10),
      weekdays: Array.isArray(row.weekdays) ? [...new Set(row.weekdays.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= 5))].slice(0, 5) : [1, 4],
    }
  } catch { return emptyInvoiceReminderDraft() }
}

export function saveInvoiceReminderDraft(draft: InvoiceReminderDraft, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(invoiceDraftKey, JSON.stringify(draft)) } catch { /* Se conserva durante la sesión. */ }
}

export function nextInvoiceAlert(reminder: Pick<InvoiceReminder, 'mode' | 'alertDate' | 'weekdays' | 'alertsStopped' | 'status'>, now = new Date()): Date | null {
  if (reminder.alertsStopped || reminder.status !== 'pending') return null
  if (reminder.mode === 'once') {
    const at = dateAt(reminder.alertDate, invoiceAlertTime.hour, invoiceAlertTime.minute)
    return at && at.getTime() > now.getTime() ? at : null
  }
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    if (!reminder.weekdays.includes(day.getDay())) continue
    const at = dateAt(localDateString(day), invoiceAlertTime.hour, invoiceAlertTime.minute)
    if (at && at.getTime() > now.getTime()) return at
  }
  return null
}

export function nextInvoiceNotificationBase(reminders: InvoiceReminder[]): number {
  const base = Math.max(1_499_999_990, ...reminders.map(row => row.notificationBase)) + 10
  if (base > 2_000_000_000) throw new Error('Se alcanzó el límite de avisos de facturas del dispositivo.')
  return base
}
