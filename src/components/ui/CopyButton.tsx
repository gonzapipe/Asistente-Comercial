import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  useEffect(() => {
    if (status === 'idle') return
    const timer = window.setTimeout(() => setStatus('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [status])
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('copied') }
    catch { setStatus('error') }
  }
  return <button type="button" className="secondary-button" onClick={copy} aria-label={status === 'copied' ? `${label}: copiado` : status === 'error' ? `${label}: no se pudo copiar` : label} aria-live="polite">
    {status === 'copied' ? <Check size={17} /> : <Copy size={17} />}
    {status === 'copied' ? 'Copiado' : status === 'error' ? 'No se pudo copiar' : label}
  </button>
}
