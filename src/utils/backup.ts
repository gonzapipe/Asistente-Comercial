import { validateBackup, type BackupData } from './backupValidation'
export { validateBackup } from './backupValidation'
import { loadBasicCalculatorState, saveBasicCalculatorState } from './basicCalculator'
import { loadNoteDraft, saveNoteDraft, loadAgendaDraft, saveAgendaDraft } from './recordDraft'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { db, defaultSettings } from '../db/database'
import { calculatorDraftModes, draftKey, loadCalculatorDraft, saveCalculatorDraft, type DraftMode } from './calculatorDraft'
import { loadComparisonDraft, saveComparisonDraft } from './comparisonDraft'
import { loadTargetDraft, saveTargetDraft } from './targetDraft'
import { checkBackupSize } from './backupLimits'
import { loadNextOrderDraft, saveNextOrderDraft } from './nextOrders'
import { rebuildOrderNotifications } from './orderNotifications'
import { loadInvoiceReminderDraft, saveInvoiceReminderDraft } from './invoiceReminders'
import { rebuildInvoiceNotifications } from './invoiceNotifications'

async function collectBackup(): Promise<BackupData> {
  const currentSettings = await db.settings.get('global') ?? defaultSettings
  const drafts = Object.fromEntries(calculatorDraftModes.map(mode => [mode, JSON.stringify(loadCalculatorDraft(mode))])) as Record<DraftMode, string>
  return {
    format: 'venta-facil-precios', version: 7, exportedAt: new Date().toISOString(),
    settings: { taxRateBps: currentSettings.taxRateBps, theme: currentSettings.theme },
    notes: await db.notes.toArray(), agenda: await db.agendaEntries.toArray(), history: await db.calculationHistory.toArray(), routes: await db.routes.toArray(), portfolio: await db.portfolioClients.toArray(), catalog: await db.catalogItems.toArray(), orders: await db.salesOrders.toArray(), documents: await db.clientDocuments.toArray(), visits: await db.visitRecords.toArray(), priceCatalog: await db.priceCatalog.toArray(), priceCatalogCategories: await db.priceCatalogCategories.toArray(), nextOrders: await db.nextOrders.toArray(), invoiceReminders: await db.invoiceReminders.toArray(),
    drafts: { ...drafts, comparison: JSON.stringify(loadComparisonDraft()), target: JSON.stringify(loadTargetDraft()), basic: JSON.stringify(loadBasicCalculatorState()), note: JSON.stringify(loadNoteDraft()), agenda: JSON.stringify(loadAgendaDraft()), nextOrder: JSON.stringify(loadNextOrderDraft()), invoiceReminder: JSON.stringify(loadInvoiceReminderDraft()) },
  }
}

export async function createBackup(): Promise<string> {
  const text = JSON.stringify(await collectBackup(), null, 2)
  checkBackupSize(text)
  return text
}

export async function exportBackup(): Promise<string> {
  const data = await collectBackup()
  const content = JSON.stringify(data, null, 2)
  checkBackupSize(content)
  const included = 'Incluye notas, Agenda, cálculos, productos, precios, categorías, próximos pedidos y avisos de facturas.'
  const name = `Asistente-Comercial-respaldo-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({ path: name, data: content, directory: Directory.Documents, encoding: Encoding.UTF8 })
    return `Respaldo guardado en Documentos/${name}. ${included} Consérvalo en un lugar seguro.`
  }
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return `Descarga iniciada: ${name}. ${included} Consérvalo en un lugar seguro.`
}

export async function importBackup(text: string): Promise<{ notes: number; agenda: number; history: number; portfolio: number; portfolioInBackup: number; orders: number; documents: number }> {
  checkBackupSize(text)
  const data = validateBackup(JSON.parse(text) as unknown)
  let notes = 0, agenda = 0, history = 0, portfolio = 0, orders = 0, documents = 0
  await db.transaction('rw', [db.notes, db.agendaEntries, db.calculationHistory, db.routes, db.portfolioClients, db.catalogItems, db.salesOrders, db.clientDocuments, db.visitRecords, db.priceCatalog, db.priceCatalogCategories, db.nextOrders, db.invoiceReminders, db.settings], async () => {
    for (const note of data.notes) if (!(await db.notes.get(note.id))) { await db.notes.add(note); notes++ }
    for (const contact of data.agenda) if (!(await db.agendaEntries.get(contact.id))) { await db.agendaEntries.add(contact); agenda++ }
    for (const entry of data.history) if (!(await db.calculationHistory.get(entry.id))) { await db.calculationHistory.add(entry); history++ }
    for (const route of data.routes ?? []) if (!(await db.routes.get(route.id))) await db.routes.add(route)
    for (const client of data.portfolio ?? []) if (!(await db.portfolioClients.get(client.id))) { await db.portfolioClients.add(client); portfolio++ }
    for (const item of data.catalog ?? []) if (!(await db.catalogItems.get(item.id))) await db.catalogItems.add(item)
    for (const order of data.orders ?? []) if (!(await db.salesOrders.get(order.id))) { await db.salesOrders.add(order); orders++ }
    for (const document of data.documents ?? []) if (!(await db.clientDocuments.get(document.id))) { await db.clientDocuments.add(document); documents++ }
    for (const visit of data.visits ?? []) if (!(await db.visitRecords.get(visit.id))) await db.visitRecords.add(visit)
    if (data.priceCatalogCategories?.length) await db.priceCatalogCategories.bulkPut(data.priceCatalogCategories)
    if (data.priceCatalog?.length) await db.priceCatalog.bulkPut(data.priceCatalog)
    if (data.nextOrders?.length) await db.nextOrders.bulkPut(data.nextOrders)
    if (data.invoiceReminders?.length) await db.invoiceReminders.bulkPut(data.invoiceReminders)
    await db.settings.put({ ...defaultSettings, ...(await db.settings.get('global')), ...data.settings })
  })
  for (const mode of calculatorDraftModes) saveCalculatorDraft(mode, loadCalculatorDraft(mode, { getItem: key => key === draftKey(mode) ? data.drafts[mode] : null }))
  saveComparisonDraft(loadComparisonDraft({ getItem: () => data.drafts.comparison }))
  saveTargetDraft(loadTargetDraft({ getItem: () => data.drafts.target }))
  if (data.drafts.basic !== undefined) saveBasicCalculatorState(loadBasicCalculatorState({ getItem: () => data.drafts.basic! }))
  if (data.drafts.note !== undefined) saveNoteDraft(loadNoteDraft({ getItem: () => data.drafts.note! }))
  if (data.drafts.agenda !== undefined) saveAgendaDraft(loadAgendaDraft({ getItem: () => data.drafts.agenda! }))
  if (data.drafts.nextOrder !== undefined) saveNextOrderDraft(loadNextOrderDraft({ getItem: () => data.drafts.nextOrder! }))
  if (data.drafts.invoiceReminder !== undefined) saveInvoiceReminderDraft(loadInvoiceReminderDraft({ getItem: () => data.drafts.invoiceReminder! }))
  void rebuildOrderNotifications().catch(() => {})
  void rebuildInvoiceNotifications().catch(() => {})
  return { notes, agenda, history, portfolio, portfolioInBackup: data.portfolio?.length ?? 0, orders, documents }
}
