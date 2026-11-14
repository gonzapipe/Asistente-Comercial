import { draftStorage } from './draftStorage.ts'
import { numericInput } from './numericInput.ts'

export type ComparisonBasis = 'kilos' | 'cantidad'
export type CompareOption = { id: number; name: string; netTotal: string; size: string; sizeMode: 'manual' | 'pack'; packUnits: string; gramsPerUnit: string; catalogId?: string; catalogGross?: string }
export type ComparisonDraft = { basis: ComparisonBasis; kilos: CompareOption[]; cantidad: CompareOption[] }

export const comparisonDraftKey = 'venta-facil:comparativos:v2'
const legacyKey = 'venta-facil:comparativos:v1'
export const emptyOption = (id: number): CompareOption => ({ id, name: '', netTotal: '', size: '', sizeMode: 'manual', packUnits: '', gramsPerUnit: '' })
export const emptyComparison = (): CompareOption[] => [emptyOption(1), emptyOption(2)]
export const emptyComparisonDraft = (): ComparisonDraft => ({ basis: 'kilos', kilos: emptyComparison(), cantidad: emptyComparison() })

function validOptions(value: unknown, basis: ComparisonBasis): CompareOption[] | null {
  if (!Array.isArray(value)) return null
  const options: CompareOption[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object' || !Number.isSafeInteger(row.id) || row.id < 1 || options.some(option => option.id === row.id) || typeof row.name !== 'string' || typeof row.netTotal !== 'string') continue
    const size = row.size ?? (basis === 'kilos' ? row.kilos : undefined)
    if (typeof size !== 'string' || numericInput(row.netTotal, 0, 100_000_000_000) === null || numericInput(size, 3, 1_000_000_000) === null) continue
    options.push({ id: row.id, name: row.name.slice(0, 120), netTotal: numericInput(row.netTotal, 0, 100_000_000_000)!, size: numericInput(size, 3, 1_000_000_000)!, sizeMode: basis === 'kilos' && row.sizeMode === 'pack' ? 'pack' : 'manual', packUnits: typeof row.packUnits === 'string' && numericInput(row.packUnits, 0, 1_000_000_000) !== null ? row.packUnits : '', gramsPerUnit: typeof row.gramsPerUnit === 'string' && numericInput(row.gramsPerUnit, 0, 1_000_000_000) !== null ? row.gramsPerUnit : '', ...(typeof row.catalogId === 'string' && row.catalogId ? { catalogId: row.catalogId } : {}), ...(typeof row.catalogGross === 'string' && numericInput(row.catalogGross, 0, 100_000_000_000) !== null ? { catalogGross: row.catalogGross } : {}) })
  }
  if (options.length === 0) return null
  while (options.length < 2) options.push(emptyOption(options.reduce((max, option) => Math.max(max, option.id), 0) + 1))
  return options
}

export function loadComparisonDraft(storage?: Pick<Storage, 'getItem'>): ComparisonDraft {
  try {
    const source = storage ?? draftStorage
    const saved: unknown = JSON.parse(source.getItem(comparisonDraftKey) ?? 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      const data = saved as Record<string, unknown>
      return {
        basis: data.basis === 'cantidad' ? 'cantidad' : 'kilos',
        kilos: validOptions(data.kilos, 'kilos') ?? emptyComparison(),
        cantidad: validOptions(data.cantidad, 'cantidad') ?? emptyComparison(),
      }
    }
    const legacy: unknown = JSON.parse(source.getItem(legacyKey) ?? 'null')
    return { ...emptyComparisonDraft(), kilos: validOptions(legacy, 'kilos') ?? emptyComparison() }
  } catch { return emptyComparisonDraft() }
}

export function saveComparisonDraft(draft: ComparisonDraft, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(comparisonDraftKey, JSON.stringify(draft)) } catch { /* El cálculo sigue disponible si el almacenamiento está deshabilitado. */ }
}
