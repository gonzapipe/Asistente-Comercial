import { draftStorage } from './draftStorage.ts'
import type { NextOrder, NextOrderItem } from '../types/domain.ts'

export type NextOrderDraft = { editingId: string | null; customerName: string; items: NextOrderItem[]; entryDate: string }
export const nextOrderDraftKey = 'venta-facil:proximos-pedidos-borrador:v1'
export const emptyNextOrderItem = (): NextOrderItem => ({ id: crypto.randomUUID(), name: '', quantity: '' })
export function orderItems(order: NextOrder): NextOrderItem[] {
  return order.items?.length ? order.items : [{ id: `${order.id}-legacy`, name: order.productName, quantity: order.quantity }]
}
export const emptyNextOrderDraft = (): NextOrderDraft => {
  const now = new Date()
  const date = now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 15) ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : now
  const day = localDateString(date)
  return { editingId: null, customerName: '', items: [emptyNextOrderItem()], entryDate: day }
}
export const reminderTimes = [{ hour: 9, minute: 0 }, { hour: 11, minute: 0 }, { hour: 13, minute: 0 }, { hour: 15, minute: 0 }, { hour: 16, minute: 15 }] as const
export const orderCutoff = { hour: 16, minute: 30 } as const

export function localDateString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dateAt(value: string, hour: number, minute: number): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const result = new Date(year, month - 1, day, hour, minute)
  return result.getFullYear() === year && result.getMonth() === month - 1 && result.getDate() === day && result.getHours() === hour && result.getMinutes() === minute ? result : null
}

export function reminderSchedule(order: Pick<NextOrder, 'entryDate' | 'notificationBase' | 'alertsStopped' | 'status'>, now = new Date()): { id: number; at: Date; label: string }[] {
  if (order.status !== 'pending' || order.alertsStopped) return []
  return reminderTimes.flatMap(({ hour, minute }, index) => {
    const at = dateAt(order.entryDate, hour, minute)
    return at && at.getTime() > now.getTime() ? [{ id: order.notificationBase + index, at, label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` }] : []
  })
}

export function nextNotificationBase(orders: NextOrder[]): number {
  const base = Math.max(99_990, ...orders.map(order => order.notificationBase)) + 10
  if (base > 2_147_483_640) throw new Error('Se alcanzó el límite de recordatorios del dispositivo.')
  return base
}

export function isOrderDueToday(order: NextOrder, now = new Date()): boolean {
  return order.status === 'pending' && order.entryDate === localDateString(now)
}

export function nextReminderToday(orders: NextOrder[], now = new Date()): string | null {
  const upcoming = orders.filter(order => isOrderDueToday(order, now)).flatMap(order => reminderSchedule(order, now))
  upcoming.sort((a, b) => a.at.getTime() - b.at.getTime())
  return upcoming[0]?.label ?? null
}

export function orderDeadlinePassed(order: NextOrder, now = new Date()): boolean {
  const cutoff = dateAt(order.entryDate, orderCutoff.hour, orderCutoff.minute)
  return order.status === 'pending' && cutoff !== null && now.getTime() >= cutoff.getTime()
}

export function loadNextOrderDraft(storage?: Pick<Storage, 'getItem'>): NextOrderDraft {
  try {
    const value: unknown = JSON.parse((storage ?? draftStorage).getItem(nextOrderDraftKey) ?? 'null')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyNextOrderDraft()
    const row = value as Record<string, unknown>
    const text = (key: string, max: number) => typeof row[key] === 'string' ? row[key].slice(0, max) : ''
    const validItem = (item: unknown): item is NextOrderItem => !!item && typeof item === 'object' && !Array.isArray(item) && typeof (item as NextOrderItem).id === 'string' && typeof (item as NextOrderItem).name === 'string' && typeof (item as NextOrderItem).quantity === 'string'
    const items = Array.isArray(row.items) && row.items.length > 0 && row.items.length <= 50 && row.items.every(validItem)
      ? row.items.map((item: NextOrderItem) => ({ id: item.id.slice(0, 100), name: item.name.slice(0, 160), quantity: item.quantity.slice(0, 24) }))
      : [{ id: crypto.randomUUID(), name: text('productName', 160), quantity: text('quantity', 24) }]
    return { editingId: typeof row.editingId === 'string' && row.editingId.length <= 100 ? row.editingId : null, customerName: text('customerName', 120), items, entryDate: text('entryDate', 10) }
  } catch { return emptyNextOrderDraft() }
}

export function saveNextOrderDraft(draft: NextOrderDraft, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(nextOrderDraftKey, JSON.stringify(draft)) } catch { /* Sigue disponible durante la sesión. */ }
}
