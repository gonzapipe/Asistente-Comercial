import { draftStorage } from './draftStorage.ts'
import { numericInput } from './numericInput.ts'

export type DraftMode = 'iva' | 'descuento' | 'margen' | 'cantidad'
export type CalculatorDraft = {
  amount: string
  discount: string
  marginNetCost: string
  marginNetPercent: string
  marginNetPercent2: string
  marginNetPercent3: string
  marginTotalCost: string
  marginTotalPercent: string
  marginTotalPercent2: string
  marginTotalPercent3: string
  quantity: string
  reverse: boolean
  marginBasis: 'net' | 'total'
}

export const calculatorDraftModes: DraftMode[] = ['iva', 'descuento', 'margen', 'cantidad']
export const draftKey = (mode: DraftMode) => `venta-facil:${mode}:v1`
export const emptyCalculatorDraft = (): CalculatorDraft => ({ amount: '', discount: '', marginNetCost: '', marginNetPercent: '', marginNetPercent2: '', marginNetPercent3: '', marginTotalCost: '', marginTotalPercent: '', marginTotalPercent2: '', marginTotalPercent3: '', quantity: '', reverse: false, marginBasis: 'net' })

function validNumber(value: unknown, decimals = 0, max?: number): string {
  return typeof value === 'string' ? numericInput(value, decimals, max) ?? '' : ''
}

export function loadCalculatorDraft(mode: DraftMode, storage?: Pick<Storage, 'getItem'>): CalculatorDraft {
  try {
    const saved: unknown = JSON.parse((storage ?? draftStorage).getItem(draftKey(mode)) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return emptyCalculatorDraft()
    const data = saved as Record<string, unknown>
    const legacyBasis = data.marginBasis === 'total' ? 'total' : 'net'
    return {
      amount: validNumber(data.amount),
      discount: validNumber(data.discount, 2, 100),
      marginNetCost: validNumber(data.marginNetCost ?? (legacyBasis === 'net' ? data.cost : undefined)),
      marginNetPercent: validNumber(data.marginNetPercent ?? (legacyBasis === 'net' ? data.desired : undefined), 2, 9999.99),
      marginNetPercent2: validNumber(data.marginNetPercent2, 2, 9999.99),
      marginNetPercent3: validNumber(data.marginNetPercent3, 2, 9999.99),
      marginTotalCost: validNumber(data.marginTotalCost ?? (legacyBasis === 'total' ? data.cost : undefined)),
      marginTotalPercent: validNumber(data.marginTotalPercent ?? (legacyBasis === 'total' ? data.desired : undefined), 2, 9999.99),
      marginTotalPercent2: validNumber(data.marginTotalPercent2, 2, 9999.99),
      marginTotalPercent3: validNumber(data.marginTotalPercent3, 2, 9999.99),
      quantity: validNumber(data.quantity),
      reverse: data.reverse === true,
      marginBasis: legacyBasis,
    }
  } catch { return emptyCalculatorDraft() }
}

export function saveCalculatorDraft(mode: DraftMode, draft: CalculatorDraft, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(draftKey(mode), JSON.stringify(draft)) } catch { /* El cálculo sigue disponible si el almacenamiento está deshabilitado. */ }
}

export function clearCalculatorDraft(mode: DraftMode, draft: CalculatorDraft): CalculatorDraft {
  if (mode === 'margen') return draft.marginBasis === 'net'
    ? { ...draft, marginNetCost: '', marginNetPercent: '', marginNetPercent2: '', marginNetPercent3: '' }
    : { ...draft, marginTotalCost: '', marginTotalPercent: '', marginTotalPercent2: '', marginTotalPercent3: '' }
  if (mode === 'iva') return { ...draft, amount: '' }
  if (mode === 'descuento') return { ...draft, amount: '', discount: '' }
  return { ...draft, amount: '', discount: '', quantity: '' }
}
