import { draftStorage } from './draftStorage.ts'
export type NoteDraft = { editingId: string | null; title: string; content: string }
export type AgendaDraft = { editingId: string | null; name: string; phone: string; address: string; email: string; company: string; notes: string }

export const noteDraftKey = 'venta-facil:notas-borrador:v1'
export const agendaDraftKey = 'venta-facil:agenda-borrador:v1'
export const emptyNoteDraft = (): NoteDraft => ({ editingId: null, title: '', content: '' })
export const emptyAgendaDraft = (): AgendaDraft => ({ editingId: null, name: '', phone: '', address: '', email: '', company: '', notes: '' })

function readDraft<T extends object>(key: string, empty: () => T, limits: Record<Exclude<keyof T, 'editingId'>, number>, storage?: Pick<Storage, 'getItem'>): T {
  try {
    const saved: unknown = JSON.parse((storage ?? draftStorage).getItem(key) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return empty()
    const data = saved as Record<string, unknown>
    const draft: Record<string, string | null> = { editingId: typeof data.editingId === 'string' && data.editingId.length <= 100 ? data.editingId : null }
    for (const field of Object.keys(limits)) {
      const value = data[field]
      draft[field] = typeof value === 'string' ? value : ''
    }
    return draft as T
  } catch { return empty() }
}

function writeDraft<T>(key: string, draft: T, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(key, JSON.stringify(draft)) } catch { /* El formulario sigue disponible durante esta sesión. */ }
}

export function loadNoteDraft(storage?: Pick<Storage, 'getItem'>): NoteDraft {
  return readDraft(noteDraftKey, emptyNoteDraft, { title: 120, content: 20_000 }, storage)
}
export function saveNoteDraft(draft: NoteDraft, storage?: Pick<Storage, 'setItem'>): void { writeDraft(noteDraftKey, draft, storage) }

export function loadAgendaDraft(storage?: Pick<Storage, 'getItem'>): AgendaDraft {
  return readDraft(agendaDraftKey, emptyAgendaDraft, { name: 120, phone: 40, address: 240, email: 160, company: 120, notes: 10_000 }, storage)
}
export function saveAgendaDraft(draft: AgendaDraft, storage?: Pick<Storage, 'setItem'>): void { writeDraft(agendaDraftKey, draft, storage) }
