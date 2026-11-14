import { draftStorage } from './draftStorage.ts'
import { numericInput } from './numericInput.ts'

export type TargetDraft = { basis: 'net' | 'total'; cost: string; target: string }
export const targetDraftKey = 'venta-facil:precio-objetivo:v1'
export const emptyTargetDraft = (): TargetDraft => ({ basis: 'net', cost: '', target: '' })
export function loadTargetDraft(storage?: Pick<Storage, 'getItem'>): TargetDraft {
  try {
    const value: unknown = JSON.parse((storage ?? draftStorage).getItem(targetDraftKey) ?? 'null')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyTargetDraft()
    const data = value as Record<string, unknown>
    return { basis: data.basis === 'total' ? 'total' : 'net', cost: typeof data.cost === 'string' ? numericInput(data.cost) ?? '' : '', target: typeof data.target === 'string' ? numericInput(data.target) ?? '' : '' }
  } catch { return emptyTargetDraft() }
}
export function saveTargetDraft(draft: TargetDraft, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(targetDraftKey, JSON.stringify(draft)) } catch { /* La calculadora sigue disponible. */ }
}
