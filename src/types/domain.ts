export type Id = string
export type ISODate = string
export interface NoteEntry { id: Id; title: string; content: string; createdAt: ISODate; updatedAt: ISODate }
export interface AgendaEntry { id: Id; name: string; phone: string; address: string; email: string; company: string; notes: string; createdAt: ISODate; updatedAt: ISODate }
export interface PortfolioClient { id: Id; name: string; rut?: string; address: string; phone: string; visitDay: number; schedule?: string; lat?: number; lon?: number; demo?: boolean; createdAt: ISODate; updatedAt: ISODate }
export interface CatalogItem { id: Id; name: string; sku?: string; unit: string; priceGross: number; sourceUrl?: string; demo: boolean; updatedAt: ISODate }
export interface PriceCatalogProduct { id: Id; name: string; priceGross: number; categoryId: Id; manualPrice: boolean; updatedAt: ISODate }
export interface PriceCatalogCategory { id: Id; name: string; createdAt: ISODate }
export interface NextOrderItem { id: Id; name: string; quantity: string }
export interface NextOrder { id: Id; customerName: string; productName: string; quantity: string; items?: NextOrderItem[]; entryDate: string; deliveryDate?: string; notificationBase: number; alertsStopped: boolean; status: 'pending' | 'entered'; createdAt: ISODate; updatedAt: ISODate; enteredAt?: ISODate }
export interface InvoiceReminder { id: Id; clientName: string; invoiceNumbers: string; message: string; mode: 'once' | 'weekly'; alertDate: string; weekdays: number[]; notificationBase: number; alertsStopped: boolean; status: 'pending' | 'paid'; lastContactDate?: string; createdAt: ISODate; updatedAt: ISODate }
export interface OrderLine { id: Id; productId?: Id; name: string; quantity: number; unitPriceGross: number }
export interface SalesOrder { id: Id; clientId: Id; orderDate: string; createdAt: ISODate; updatedAt: ISODate; status: 'active' | 'replaced'; replacesOrderId?: Id; items: OrderLine[]; totalGross: number; demo?: boolean }
export interface ClientDocument { id: Id; clientId: Id; orderId?: Id; kind: 'factura' | 'boleta'; number: string; amountGross: number; dueDate?: string; paymentStatus: 'pending' | 'paid'; routeDate?: string; driverName?: string; createdAt: ISODate; updatedAt: ISODate; demo?: boolean }
export interface VisitRecord { id: Id; clientId: Id; date: string; startedAt: ISODate }
export interface RouteStop { id: Id; agendaId?: Id; name: string; address: string; lat?: number; lon?: number; visited: boolean }
export interface RoutePlan { id: Id; date: string; origin?: { lat: number; lon: number }; stops: RouteStop[]; createdAt: ISODate; updatedAt: ISODate }
export type QuoteStatus = 'borrador' | 'enviada' | 'esperando_respuesta' | 'aceptada' | 'rechazada' | 'vencida'
export type FollowUpStatus = 'pendiente' | 'completado' | 'postergado' | 'cancelado'

export interface Category {
  id: Id; name: string; description?: string; icon?: string; active: boolean; createdAt: ISODate; updatedAt: ISODate
}
export interface PriceList {
  id: Id; name: string; description?: string; active: boolean; createdAt: ISODate; updatedAt: ISODate
}
export interface Product {
  id: Id; code?: string; sku?: string; name: string; categoryId?: Id; brand?: string; description?: string
  costNet: number; priceNet: number; taxRateBps: number; unit: string; stock?: number; supplier?: string
  notes?: string; favorite: boolean; active: boolean; priceByList?: Record<Id, number>
  createdAt: ISODate; updatedAt: ISODate; demo?: boolean
}
export interface Customer {
  id: Id; firstName: string; lastName?: string; company?: string; rut?: string; phone?: string
  whatsapp?: string; email?: string; address?: string; commune?: string; city?: string; region?: string
  type: 'particular' | 'empresa' | 'distribuidor' | 'mayorista' | 'frecuente' | 'especial'
  priceListId?: Id; notes?: string; lastContactAt?: ISODate; active: boolean
  createdAt: ISODate; updatedAt: ISODate; demo?: boolean
}
export interface Quote {
  id: Id; number: string; createdAt: ISODate; updatedAt: ISODate; customerId?: Id; sellerName: string
  status: QuoteStatus; subtotal: number; discount: number; net: number; tax: number; total: number
  observations?: string; terms?: string; paymentMethod?: string; validUntil?: ISODate; demo?: boolean
}
export interface QuoteItem {
  id: Id; quoteId: Id; productId?: Id; description: string; quantity: number; unitPriceNet: number
  discountBps: number; taxRateBps: number; subtotal: number; discount: number; net: number; tax: number; total: number
}
export interface FollowUp {
  id: Id; customerId: Id; quoteId?: Id; dueAt: ISODate; reason: string; notes?: string
  status: FollowUpStatus; priority: 'baja' | 'media' | 'alta'; createdAt: ISODate; updatedAt: ISODate; demo?: boolean
}
export interface Settings {
  id: 'global'; country: string; currency: string; locale: string; taxRateBps: number
  sellerName: string; company: string; rut: string; phone: string; email: string; address: string
  website: string; terms: string; defaultValidityDays: number; theme: 'light' | 'dark' | 'system'
  demoSeeded?: boolean
  demoClientsSeeded?: boolean
}
export interface ActivityLog {
  id: Id; entity: string; entityId: Id; action: 'create' | 'update' | 'delete' | 'import'
  at: ISODate; detail?: string
}

export interface CalculationHistoryEntry {
  id: Id
  title: string
  kind: 'iva' | 'descuento' | 'margen' | 'cantidad' | 'comparar' | 'objetivo'
  createdAt: ISODate
  summary: string
  details: string
  snapshot: string
}
