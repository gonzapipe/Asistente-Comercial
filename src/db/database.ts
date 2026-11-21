import Dexie, { type EntityTable } from 'dexie'
import type { ActivityLog, AgendaEntry, CalculationHistoryEntry, CatalogItem, Category, ClientDocument, Customer, FollowUp, InvoiceReminder, NextOrder, NoteEntry, PortfolioClient, PriceCatalogCategory, PriceCatalogProduct, PriceList, Product, Quote, QuoteItem, RoutePlan, SalesOrder, Settings, VisitRecord } from '../types/domain'
import initialProducts from '../data/initialProducts.json'
import { categoryForName, catalogKey, defaultCatalogCategories } from '../utils/priceCatalog'

export class VentaFacilDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>
  categories!: EntityTable<Category, 'id'>
  customers!: EntityTable<Customer, 'id'>
  quotes!: EntityTable<Quote, 'id'>
  quoteItems!: EntityTable<QuoteItem, 'id'>
  followUps!: EntityTable<FollowUp, 'id'>
  priceLists!: EntityTable<PriceList, 'id'>
  settings!: EntityTable<Settings, 'id'>
  activityLog!: EntityTable<ActivityLog, 'id'>
  notes!: EntityTable<NoteEntry, 'id'>
  agendaEntries!: EntityTable<AgendaEntry, 'id'>
  calculationHistory!: EntityTable<CalculationHistoryEntry, 'id'>
  routes!: EntityTable<RoutePlan, 'id'>
  portfolioClients!: EntityTable<PortfolioClient, 'id'>
  catalogItems!: EntityTable<CatalogItem, 'id'>
  salesOrders!: EntityTable<SalesOrder, 'id'>
  clientDocuments!: EntityTable<ClientDocument, 'id'>
  visitRecords!: EntityTable<VisitRecord, 'id'>
  priceCatalog!: EntityTable<PriceCatalogProduct, 'id'>
  priceCatalogCategories!: EntityTable<PriceCatalogCategory, 'id'>
  nextOrders!: EntityTable<NextOrder, 'id'>
  invoiceReminders!: EntityTable<InvoiceReminder, 'id'>

  constructor() {
    super('VentaFacil')
    this.version(1).stores({
      products: 'id, name, code, sku, categoryId, brand, favorite, active, createdAt',
      categories: 'id, name, active',
      customers: 'id, firstName, lastName, company, rut, type, active, createdAt',
      quotes: 'id, &number, createdAt, customerId, status, total',
      quoteItems: 'id, quoteId, productId',
      followUps: 'id, customerId, quoteId, dueAt, status, priority',
      priceLists: 'id, name, active',
      settings: 'id',
      activityLog: 'id, entity, entityId, at',
    })
    this.version(2).stores({ notes: 'id, updatedAt', agendaEntries: 'id, updatedAt' })
    this.version(3).stores({ calculationHistory: 'id, createdAt, kind' })
    this.version(4).stores({ routes: 'id, updatedAt, date' })
    this.version(5).stores({ portfolioClients: 'id, name, visitDay, updatedAt' })
    this.version(6).stores({ catalogItems: 'id, name, updatedAt', salesOrders: 'id, clientId, orderDate, status', clientDocuments: 'id, clientId, orderId, dueDate, routeDate', visitRecords: 'id, clientId, date' })
    this.version(7).stores({ priceCatalog: 'id, name, categoryId, updatedAt', priceCatalogCategories: 'id, &name' })
    this.version(8).stores({ nextOrders: 'id, entryDate, deliveryDate, status, updatedAt' })
    this.version(9).stores({ invoiceReminders: 'id, clientName, alertDate, status, updatedAt' })
  }
}

export const db = new VentaFacilDatabase()

export async function updateSettings(patch: Partial<Pick<Settings, 'taxRateBps' | 'theme'>>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    await db.settings.put({ ...defaultSettings, ...await db.settings.get('global'), ...patch, id: 'global' })
  })
}

export const defaultSettings: Settings = {
  id: 'global', country: 'Chile', currency: 'CLP', locale: 'es-CL', taxRateBps: 1900,
  sellerName: '', company: '', rut: '', phone: '', email: '', address: '', website: '',
  terms: '', defaultValidityDays: 7, theme: 'system',
}

let initialization: Promise<void> | undefined
export function initializeDatabase(): Promise<void> {
  initialization ??= (async () => {
    await db.open()
    await updateSettings({})
    if (await db.priceCatalog.count() === 0) {
      const now = new Date().toISOString()
      await db.transaction('rw', db.priceCatalog, db.priceCatalogCategories, async () => {
        if (await db.priceCatalog.count() !== 0) return
        await db.priceCatalogCategories.bulkPut(defaultCatalogCategories.map(name => ({ id: catalogKey(name), name, createdAt: now })))
        await db.priceCatalog.bulkPut(initialProducts.map(item => ({ id: catalogKey(item.name), name: item.name, priceGross: item.priceGross, categoryId: catalogKey(categoryForName(item.name)), manualPrice: false, updatedAt: now })))
      })
    }
  })().catch(error => { initialization = undefined; throw error })
  return initialization
}
