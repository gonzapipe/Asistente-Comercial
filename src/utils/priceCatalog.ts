import type { PriceCatalogProduct } from '../types/domain.ts'

export const normalizeCatalogText = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
export const catalogKey = (value: string): string => normalizeCatalogText(value)

export const defaultCatalogCategories = ['Aceites', 'Mariscos y pescados', 'Carnes y pollos', 'Frutas', 'Lácteos y margarinas', 'Papas', 'Platos preparados', 'Verduras', 'Abarrotes', 'Otros']

export function categoryForName(name: string): string {
  const text = normalizeCatalogText(name)
  if (/^aceite\b/.test(text)) return 'Aceites'
  if (/camaron|merluza|salmon|marisco/.test(text)) return 'Mariscos y pescados'
  if (/pollo|chicken|nugget|trutro|pechuga|alita|supremita|vacuno|chuleta|cerdo|jamon|hamburguesa|churrasco|entran?a|posta negra|carne|albondiga|milanesa/.test(text)) return 'Carnes y pollos'
  if (/arandano|frambuesa|frutilla|mango|frutos rojos|pina|pulpa (10|maracuya|melon)|jugo de limon/.test(text)) return 'Frutas'
  if (/mantequilla|bonella|dorina|manteca|margarina|queso/.test(text)) return 'Lácteos y margarinas'
  if (/^papa|^papas/.test(text)) return 'Papas'
  if (/donut|megabites|muffin|pizza|lasagna|hot bowls|arrollado|humita|pasta de choclo/.test(text)) return 'Platos preparados'
  if (/arveja|brocoli|cebolla|champinon|chapsui|choclo|espinaca|esparrago|haba|poroto verde|primavera|zapallo|pimenton|ens lista|palta|sofrito|p verde|granado/.test(text)) return 'Verduras'
  if (/arroz|azucar|chancaca|endulzante|iansa cero|galleta|garbanzo|lenteja|porotos|yerba|quinoa|wok/.test(text)) return 'Abarrotes'
  return 'Otros'
}

export type PriceSheetRow = { name: string; priceGross: number }

function parseGross(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 && value <= 100_000_000_000 ? value : null
  if (typeof value !== 'string') return null
  const cleaned = value.trim().replace(/\$/g, '').replace(/\s/g, '')
  if (!/^\d{1,3}(?:\.\d{3})*$|^\d+$/.test(cleaned)) return null
  const parsed = Number(cleaned.replace(/\./g, ''))
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 100_000_000_000 ? parsed : null
}

export function parsePriceSheet(rows: unknown[][]): PriceSheetRow[] {
  if (!Array.isArray(rows) || rows.length > 20_000) throw new Error('El archivo tiene demasiadas filas.')
  const headerIndex = rows.findIndex(row => Array.isArray(row) && row.some(value => typeof value === 'string' && normalizeCatalogText(value) === 'producto') && row.some(value => typeof value === 'string' && normalizeCatalogText(value) === 'precio nuevo'))
  if (headerIndex < 0) throw new Error('No se encontraron las columnas Producto y Precio nuevo.')
  const header = rows[headerIndex]
  const nameIndex = header.findIndex(value => typeof value === 'string' && normalizeCatalogText(value) === 'producto')
  const priceIndex = header.findIndex(value => typeof value === 'string' && normalizeCatalogText(value) === 'precio nuevo')
  const result: PriceSheetRow[] = []
  const keys = new Set<string>()
  for (let index = headerIndex + 1; index < rows.length; index++) {
    const row = rows[index]
    if (!Array.isArray(row)) continue
    const name = typeof row[nameIndex] === 'string' ? row[nameIndex].trim().replace(/\s+/g, ' ') : ''
    if (!name) continue
    if (row[priceIndex] === null || row[priceIndex] === undefined || row[priceIndex] === '') continue
    if (name.length > 160) throw new Error(`El nombre en la fila ${index + 1} es demasiado largo.`)
    const priceGross = parseGross(row[priceIndex])
    if (priceGross === null) throw new Error(`Precio nuevo inválido en la fila ${index + 1}: ${name}.`)
    const key = catalogKey(name)
    if (!key || keys.has(key)) throw new Error(`El producto está repetido en el archivo: ${name}.`)
    keys.add(key)
    result.push({ name, priceGross })
  }
  if (result.length === 0) throw new Error('El archivo no contiene productos con Precio nuevo válido.')
  return result
}

export type PriceImportPlan = { newCount: number; changedCount: number; unchangedCount: number; protectedCount: number; missingCount: number; rows: PriceSheetRow[] }

export function planPriceImport(rows: PriceSheetRow[], existing: PriceCatalogProduct[]): PriceImportPlan {
  const current = new Map(existing.map(item => [catalogKey(item.name), item]))
  const incoming = new Set(rows.map(item => catalogKey(item.name)))
  const plan = { newCount: 0, changedCount: 0, unchangedCount: 0, protectedCount: 0, missingCount: existing.filter(item => !incoming.has(catalogKey(item.name))).length, rows }
  for (const item of rows) {
    const found = current.get(catalogKey(item.name))
    if (!found) plan.newCount++
    else if (found.priceGross === item.priceGross) plan.unchangedCount++
    else if (found.manualPrice) plan.protectedCount++
    else plan.changedCount++
  }
  return plan
}
