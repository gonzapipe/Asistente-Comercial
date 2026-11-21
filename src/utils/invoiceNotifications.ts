import { Capacitor } from '@capacitor/core'
import { LocalNotifications, Weekday, type LocalNotificationSchema } from '@capacitor/local-notifications'
import { db } from '../db/database'
import type { InvoiceReminder } from '../types/domain'
import { invoiceAlertTime, nextInvoiceAlert } from './invoiceReminders'
import { exactOrderAlarmsGranted } from './orderNotifications'

const channelId = 'facturas-pendientes'
const idsFor = (reminder: InvoiceReminder) => Array.from({ length: 6 }, (_, index) => reminder.notificationBase + index)
let notificationQueue: Promise<void> = Promise.resolve()
function inOrder<T>(action: () => Promise<T>): Promise<T> {
  const result = notificationQueue.then(action, action)
  notificationQueue = result.then(() => {}, () => {})
  return result
}

export async function cancelInvoiceNotifications(reminder: InvoiceReminder): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await inOrder(async () => {
    const ids = idsFor(reminder)
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) })
    await LocalNotifications.removeDeliveredNotificationsById({ ids })
  })
}

function notification(reminder: InvoiceReminder, id: number): LocalNotificationSchema {
  return {
    id, title: 'Recordar facturas pendientes',
    body: `${reminder.clientName}${reminder.invoiceNumbers ? ` · ${reminder.invoiceNumbers}` : ''}. Abre la app para copiar el mensaje y avisar al cliente.`,
    channelId, foreground: true, extra: { invoiceReminderId: reminder.id },
  }
}

async function performSync(): Promise<{ enabled: boolean; exact: boolean; scheduled: number }> {
  if (!Capacitor.isNativePlatform()) return { enabled: false, exact: false, scheduled: 0 }
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return { enabled: false, exact: false, scheduled: 0 }
  const reminders = await db.invoiceReminders.toArray()
  const exact = await exactOrderAlarmsGranted()
  const wanted = new Map<number, LocalNotificationSchema>()
  const now = new Date()
  for (const reminder of reminders) {
    if (reminder.status !== 'pending' || reminder.alertsStopped) continue
    if (reminder.mode === 'once') {
      const at = nextInvoiceAlert(reminder, now)
      if (at) wanted.set(reminder.notificationBase + 5, { ...notification(reminder, reminder.notificationBase + 5), schedule: { at, allowWhileIdle: true }, isExactNotification: exact })
    } else {
      for (const day of reminder.weekdays) {
        const id = reminder.notificationBase + day - 1
        wanted.set(id, { ...notification(reminder, id), schedule: { on: { weekday: (day + 1) as Weekday, hour: invoiceAlertTime.hour, minute: invoiceAlertTime.minute }, allowWhileIdle: true }, isExactNotification: exact })
      }
    }
  }
  const pending = (await LocalNotifications.getPending()).notifications
  const stale = pending.filter(item => item.id >= 1_500_000_000 && item.id < 2_000_000_010 && !wanted.has(item.id))
  if (stale.length) await LocalNotifications.cancel({ notifications: stale.map(item => ({ id: item.id })) })
  const pendingIds = new Set(pending.map(item => item.id))
  const missing = [...wanted].filter(([id]) => !pendingIds.has(id)).map(([, item]) => item)
  if (missing.length) {
    await LocalNotifications.createChannel({ id: channelId, name: 'Facturas pendientes', description: 'Avisos para recordar facturas de clientes', importance: 5, visibility: 1 })
    await LocalNotifications.schedule({ notifications: missing })
  }
  return { enabled: true, exact, scheduled: missing.length }
}

export function syncInvoiceNotifications(): Promise<{ enabled: boolean; exact: boolean; scheduled: number }> {
  return inOrder(performSync)
}

export function rebuildInvoiceNotifications(): Promise<{ enabled: boolean; exact: boolean; scheduled: number }> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve({ enabled: false, exact: false, scheduled: 0 })
  return inOrder(async () => {
    const pending = (await LocalNotifications.getPending()).notifications.filter(item => item.id >= 1_500_000_000 && item.id < 2_000_000_010)
    if (pending.length) await LocalNotifications.cancel({ notifications: pending.map(item => ({ id: item.id })) })
    return performSync()
  })
}
