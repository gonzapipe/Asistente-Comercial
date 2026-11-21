import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications'
import type { NextOrder } from '../types/domain.ts'
import { db } from '../db/database'
import { orderItems, reminderSchedule, reminderTimes } from './nextOrders'

const channelId = 'proximos-pedidos'
const native = () => Capacitor.isNativePlatform()
const idsFor = (order: NextOrder) => reminderTimes.map((_, index) => order.notificationBase + index)
let notificationQueue: Promise<void> = Promise.resolve()
function inOrder<T>(action: () => Promise<T>): Promise<T> {
  const result = notificationQueue.then(action, action)
  notificationQueue = result.then(() => {}, () => {})
  return result
}

async function channel(): Promise<void> {
  await LocalNotifications.createChannel({ id: channelId, name: 'Próximos pedidos', description: 'Avisos para ingresar pedidos antes de las 16:30', importance: 5, visibility: 1, sound: 'order_reminder.wav' })
}

export async function requestOrderNotificationPermission(): Promise<boolean> {
  if (!native()) return false
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  return (await LocalNotifications.requestPermissions()).display === 'granted'
}

export async function exactOrderAlarmsGranted(): Promise<boolean> {
  if (!native()) return false
  try { return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted' }
  catch { return false }
}

export async function requestExactOrderAlarms(): Promise<boolean> {
  if (!native()) return false
  return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm === 'granted'
}

export async function cancelOrderReminders(order: NextOrder): Promise<void> {
  if (!native()) return
  await inOrder(async () => {
    const ids = idsFor(order)
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) })
    await LocalNotifications.removeDeliveredNotificationsById({ ids })
  })
}

function notification(order: NextOrder, id: number, at: Date): LocalNotificationSchema {
  const items = orderItems(order)
  const detail = items.length === 1 ? `${items[0].name} · ${items[0].quantity}` : `${items.length} productos: ${items.map(item => `${item.name} (${item.quantity})`).join(', ')}`
  return {
    id,
    title: 'Pedido pendiente antes de las 16:30',
    body: `${order.customerName}: ${detail}. Marca el pedido como ingresado para detener los avisos.`,
    schedule: { at, allowWhileIdle: true },
    channelId,
    foreground: true,
    extra: { nextOrderId: order.id },
  }
}

async function performSync(): Promise<{ enabled: boolean; exact: boolean; scheduled: number }> {
  if (!native()) return { enabled: false, exact: false, scheduled: 0 }
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return { enabled: false, exact: false, scheduled: 0 }
  const orders = await db.nextOrders.toArray()
  const exact = await exactOrderAlarmsGranted()
  const now = new Date()
  const wanted = new Map<number, { order: NextOrder; at: Date }>()
  for (const order of orders) for (const reminder of reminderSchedule(order, now)) wanted.set(reminder.id, { order, at: reminder.at })
  const pending = (await LocalNotifications.getPending()).notifications
  const stale = pending.filter(item => item.id >= 100_000 && item.id < 1_500_000_000 && !wanted.has(item.id))
  if (stale.length) await LocalNotifications.cancel({ notifications: stale.map(item => ({ id: item.id })) })
  const pendingIds = new Set(pending.map(item => item.id))
  const missing = [...wanted].filter(([id]) => !pendingIds.has(id)).map(([id, { order, at }]) => ({ ...notification(order, id, at), isExactNotification: exact }))
  if (missing.length) {
    await channel()
    await LocalNotifications.schedule({ notifications: missing })
  }
  return { enabled: true, exact, scheduled: missing.length }
}

export async function syncOrderNotifications(): Promise<{ enabled: boolean; exact: boolean; scheduled: number }> {
  return inOrder(performSync)
}

export async function rebuildOrderNotifications(): Promise<{ enabled: boolean; exact: boolean; scheduled: number }> {
  if (!native()) return { enabled: false, exact: false, scheduled: 0 }
  return inOrder(async () => {
    const pending = (await LocalNotifications.getPending()).notifications.filter(item => item.id >= 100_000 && item.id < 1_500_000_000)
    if (pending.length) await LocalNotifications.cancel({ notifications: pending.map(item => ({ id: item.id })) })
    return performSync()
  })
}
