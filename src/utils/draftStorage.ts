// Conserva el último borrador en memoria si el dispositivo rechaza la escritura.
const pending = new Map<string, string>()
const listeners = new Set<() => void>()
let unavailable = false
function report(value: boolean) {
  if (value === unavailable) return
  unavailable = value
  listeners.forEach(listener => listener())
}
export const draftStorage = {
  getItem(key: string): string | null {
    if (pending.has(key)) return pending.get(key)!
    try { return localStorage.getItem(key) } catch { report(true); return null }
  },
  setItem(key: string, value: string): void {
    pending.set(key, value)
    try {
      for (const [name, text] of pending) { localStorage.setItem(name, text); pending.delete(name) }
      report(false)
    } catch { report(true) }
  },
}
export const storageUnavailable = () => unavailable
export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
