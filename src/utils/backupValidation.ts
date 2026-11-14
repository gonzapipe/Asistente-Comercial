import { calculatorDraftModes, type DraftMode } from './calculatorDraft.ts'
import { isRoutePlan } from './routePlan.ts'
import { isPortfolioClient, isCatalogItem, isClientDocument, isSalesOrder, isVisitRecord } from './legacyBackupValidation.ts'
import type { AgendaEntry, CalculationHistoryEntry, CatalogItem, ClientDocument, NextOrder, NoteEntry, PortfolioClient, PriceCatalogCategory, PriceCatalogProduct, RoutePlan, SalesOrder, Settings, VisitRecord } from '../types/domain.ts'
import { dateAt } from './nextOrders.ts'
import { numericValue } from './numericInput.ts'

export type BackupData = {
  format: 'venta-facil-precios'
  version: 1 | 2 | 3 | 4 | 5 | 6
  exportedAt: string
  settings: Pick<Settings, 'taxRateBps' | 'theme'>
  notes: NoteEntry[]
  agenda: AgendaEntry[]
  history: CalculationHistoryEntry[]
  routes?: RoutePlan[]
  portfolio?: PortfolioClient[]
  catalog?: CatalogItem[]
  orders?: SalesOrder[]
  documents?: ClientDocument[]
  visits?: VisitRecord[]
  priceCatalog?: PriceCatalogProduct[]
  priceCatalogCategories?: PriceCatalogCategory[]
  nextOrders?: NextOrder[]
  drafts: Record<DraftMode, string> & { comparison: string; target: string; basic?: string; note?: string; agenda?: string; nextOrder?: string }
}
const isString = (value: unknown): value is string => typeof value === 'string'
const dateOkay = (value: unknown) => isString(value) && Number.isFinite(Date.parse(value))
const isNote = (value: unknown): value is NoteEntry => {
  const row = value as NoteEntry
  return !!row && isString(row.id) && isString(row.title) && isString(row.content) && dateOkay(row.createdAt) && dateOkay(row.updatedAt)
}
const isAgenda = (value: unknown): value is AgendaEntry => {
  const row = value as AgendaEntry
  return !!row && isString(row.id) && [row.name, row.phone, row.address, row.email, row.company, row.notes].every(isString) && dateOkay(row.createdAt) && dateOkay(row.updatedAt)
}
const historyKinds = ['iva', 'descuento', 'margen', 'cantidad', 'comparar', 'objetivo']
const isHistory = (value: unknown): value is CalculationHistoryEntry => {
  const row = value as CalculationHistoryEntry
  return !!row && isString(row.id) && isString(row.title) && isString(row.summary) && isString(row.details) && isString(row.snapshot) && historyKinds.includes(row.kind) && dateOkay(row.createdAt)
}
const isPriceCatalogProduct = (value: unknown): value is PriceCatalogProduct => {
  const row = value as PriceCatalogProduct
  return !!row && isString(row.id) && row.id.length > 0 && isString(row.name) && row.name.length > 0 && Number.isSafeInteger(row.priceGross) && row.priceGross > 0 && row.priceGross <= 100_000_000_000 && isString(row.categoryId) && typeof row.manualPrice === 'boolean' && dateOkay(row.updatedAt)
}
const isPriceCatalogCategory = (value: unknown): value is PriceCatalogCategory => {
  const row = value as PriceCatalogCategory
  return !!row && isString(row.id) && row.id.length > 0 && isString(row.name) && row.name.length > 0 && dateOkay(row.createdAt)
}
const isNextOrder = (value: unknown): value is NextOrder => {
  const row = value as NextOrder
  const validItems = row?.items === undefined || (Array.isArray(row.items) && row.items.length > 0 && row.items.length <= 50 && row.items.every(item => isString(item.id) && item.id.length > 0 && isString(item.name) && item.name.trim().length > 0 && isString(item.quantity) && (numericValue(item.quantity) ?? 0) > 0 && (numericValue(item.quantity) ?? 0) <= 1_000_000_000) && new Set(row.items.map(item => item.id)).size === row.items.length && row.productName === row.items[0].name && row.quantity === row.items[0].quantity)
  return !!row && isString(row.id) && row.id.length > 0 && isString(row.customerName) && row.customerName.length > 0 && isString(row.productName) && row.productName.length > 0 && isString(row.quantity) && (numericValue(row.quantity) ?? 0) > 0 && validItems && isString(row.entryDate) && dateAt(row.entryDate, 12, 0) !== null && (row.deliveryDate === undefined || (isString(row.deliveryDate) && dateAt(row.deliveryDate, 12, 0) !== null && row.deliveryDate >= row.entryDate)) && Number.isSafeInteger(row.notificationBase) && row.notificationBase >= 100_000 && row.notificationBase <= 2_147_483_640 && typeof row.alertsStopped === 'boolean' && ['pending', 'entered'].includes(row.status) && dateOkay(row.createdAt) && dateOkay(row.updatedAt) && (row.enteredAt === undefined || dateOkay(row.enteredAt))
}

export function validateBackup(value: unknown): BackupData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Archivo de respaldo inválido.')
  const data = value as Record<string, unknown>
  const settings = data.settings as BackupData['settings'] | undefined
  const drafts = data.drafts as BackupData['drafts'] | undefined
  const validRows = (rows: unknown, check: (row: unknown) => boolean) => Array.isArray(rows) && rows.every(check) && new Set(rows.map(row => row.id)).size === rows.length
  const uniqueNotificationBases = !Array.isArray(data.nextOrders) || new Set(data.nextOrders.map((row: NextOrder) => row.notificationBase)).size === data.nextOrders.length
  const optionalRows: [string, (row: unknown) => boolean][] = [['routes', isRoutePlan], ['portfolio', isPortfolioClient], ['catalog', isCatalogItem], ['orders', isSalesOrder], ['documents', isClientDocument], ['visits', isVisitRecord], ['priceCatalog', isPriceCatalogProduct], ['priceCatalogCategories', isPriceCatalogCategory], ['nextOrders', isNextOrder]]
  const required = data.version === 2 ? ['routes'] : data.version === 3 ? ['portfolio'] : data.version === 4 ? ['portfolio', 'catalog', 'orders', 'documents', 'visits'] : data.version === 5 ? ['portfolio', 'catalog', 'orders', 'documents', 'visits', 'priceCatalog', 'priceCatalogCategories'] : data.version === 6 ? ['portfolio', 'catalog', 'orders', 'documents', 'visits', 'priceCatalog', 'priceCatalogCategories', 'nextOrders'] : []
  const jsonDraft = (entry: unknown, allowArray = false) => {
    if (!isString(entry)) return false
    try { const parsed: unknown = JSON.parse(entry); return !!parsed && typeof parsed === 'object' && (allowArray || !Array.isArray(parsed)) } catch { return false }
  }
  if (data.format !== 'venta-facil-precios' || typeof data.version !== 'number' || ![1, 2, 3, 4, 5, 6].includes(data.version) || !dateOkay(data.exportedAt) || !settings || !Number.isInteger(settings.taxRateBps) || settings.taxRateBps < 0 || settings.taxRateBps > 10000 || !['light', 'dark', 'system'].includes(settings.theme) || !validRows(data.notes, isNote) || !validRows(data.agenda, isAgenda) || !validRows(data.history, isHistory) || !uniqueNotificationBases || !required.every(key => data[key] !== undefined) || !optionalRows.every(([key, check]) => data[key] === undefined || validRows(data[key], check)) || !drafts || !calculatorDraftModes.every(mode => jsonDraft(drafts[mode])) || !jsonDraft(drafts.comparison, true) || !jsonDraft(drafts.target) || !['basic', 'note', 'agenda', 'nextOrder'].every(key => drafts[key as 'basic' | 'note' | 'agenda' | 'nextOrder'] === undefined || jsonDraft(drafts[key as 'basic' | 'note' | 'agenda' | 'nextOrder']))) throw new Error('El archivo no corresponde a un respaldo válido de Venta Fácil Precios.')
  return { ...data, settings: { taxRateBps: settings.taxRateBps, theme: settings.theme } } as BackupData
}
