import type { CatalogItem, ClientDocument, OrderLine, PortfolioClient, SalesOrder, VisitRecord } from '../types/domain.ts'
import { validCoordinates } from './routePlan.ts'

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string'
const dateTime = (value: unknown) => text(value) && Number.isFinite(Date.parse(value))
const amount = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0
const dateKey = (value: unknown): value is string => {
  if (!text(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

export function isPortfolioClient(value: unknown): value is PortfolioClient {
  if (!object(value)) return false
  return text(value.id) && text(value.name) && (value.rut === undefined || text(value.rut)) && text(value.address) && text(value.phone)
    && (value.schedule === undefined || text(value.schedule)) && (value.demo === undefined || typeof value.demo === 'boolean')
    && Number.isInteger(value.visitDay) && Number(value.visitDay) >= 0 && Number(value.visitDay) <= 6
    && ((value.lat === undefined && value.lon === undefined) || validCoordinates({ lat: value.lat, lon: value.lon }))
    && dateTime(value.createdAt) && dateTime(value.updatedAt)
}

export function isCatalogItem(value: unknown): value is CatalogItem {
  return object(value) && text(value.id) && text(value.name) && text(value.unit) && amount(value.priceGross)
    && (value.sku === undefined || text(value.sku)) && (value.sourceUrl === undefined || text(value.sourceUrl))
    && typeof value.demo === 'boolean' && dateTime(value.updatedAt)
}

function isOrderLine(value: unknown): value is OrderLine {
  return object(value) && text(value.id) && text(value.name) && (value.productId === undefined || text(value.productId))
    && Number.isSafeInteger(value.quantity) && Number(value.quantity) > 0 && amount(value.unitPriceGross)
}

export function isSalesOrder(value: unknown): value is SalesOrder {
  if (!object(value) || !text(value.id) || !text(value.clientId) || !dateKey(value.orderDate) || !dateTime(value.createdAt)
    || !dateTime(value.updatedAt) || !['active', 'replaced'].includes(String(value.status))
    || (value.replacesOrderId !== undefined && !text(value.replacesOrderId)) || !Array.isArray(value.items)
    || !value.items.length || !value.items.every(isOrderLine) || !amount(value.totalGross)) return false
  const total = value.items.reduce((sum: number, line: OrderLine) => sum + line.quantity * line.unitPriceGross, 0)
  return Number.isSafeInteger(total) && total === value.totalGross
}

export function isClientDocument(value: unknown): value is ClientDocument {
  return object(value) && text(value.id) && text(value.clientId) && (value.orderId === undefined || text(value.orderId))
    && ['factura', 'boleta'].includes(String(value.kind)) && text(value.number) && amount(value.amountGross)
    && (value.dueDate === undefined || dateKey(value.dueDate)) && ['pending', 'paid'].includes(String(value.paymentStatus))
    && (value.routeDate === undefined || dateKey(value.routeDate)) && (value.driverName === undefined || text(value.driverName))
    && dateTime(value.createdAt) && dateTime(value.updatedAt)
}

export function isVisitRecord(value: unknown): value is VisitRecord {
  return object(value) && text(value.id) && text(value.clientId) && dateKey(value.date) && dateTime(value.startedAt)
}
