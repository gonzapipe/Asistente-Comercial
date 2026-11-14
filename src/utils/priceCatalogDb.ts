import { db } from '../db/database'
import type { PriceCatalogProduct } from '../types/domain'
import { catalogKey, categoryForName, type PriceSheetRow } from './priceCatalog'

export async function applyPriceSheet(rows: PriceSheetRow[], replaceManual: boolean): Promise<{ added: number; updated: number; protected: number }> {
  let added = 0, updated = 0, protectedCount = 0
  await db.transaction('rw', db.priceCatalog, db.priceCatalogCategories, async () => {
    const existing = new Map((await db.priceCatalog.toArray()).map(item => [catalogKey(item.name), item]))
    const categories = new Set((await db.priceCatalogCategories.toArray()).map(category => category.id))
    const now = new Date().toISOString()
    const changes: PriceCatalogProduct[] = []
    for (const row of rows) {
      const id = catalogKey(row.name)
      const current = existing.get(id)
      if (current) {
        if (current.priceGross !== row.priceGross && current.manualPrice && !replaceManual) { protectedCount++; continue }
        if (current.priceGross === row.priceGross && current.name === row.name) continue
        changes.push({ ...current, name: row.name, priceGross: row.priceGross, manualPrice: current.priceGross === row.priceGross && current.manualPrice, updatedAt: now })
        updated++
      } else {
        const categoryName = categoryForName(row.name)
        const categoryId = catalogKey(categoryName)
        if (!categories.has(categoryId)) {
          await db.priceCatalogCategories.add({ id: categoryId, name: categoryName, createdAt: now })
          categories.add(categoryId)
        }
        changes.push({ id, name: row.name, priceGross: row.priceGross, categoryId, manualPrice: false, updatedAt: now })
        added++
      }
    }
    if (changes.length) await db.priceCatalog.bulkPut(changes)
  })
  return { added, updated, protected: protectedCount }
}
