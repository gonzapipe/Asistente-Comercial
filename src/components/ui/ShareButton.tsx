import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { shareText } from '../../utils/share'

export function ShareButton({ text, label = 'Compartir' }: { text: string; label?: string }) {
  const [message, setMessage] = useState('')
  async function share() {
    try { const result = await shareText(text); setMessage(result === 'copied' ? 'Resultado copiado. Pégalo en la aplicación que prefieras.' : '') }
    catch (error) { setMessage(error instanceof Error && error.name === 'AbortError' ? '' : 'No se pudo compartir el resultado.') }
  }
  return <><button type="button" className="secondary-button" onClick={share}><Share2 size={17} aria-hidden="true" /> {label}</button>{message && <span className={message.startsWith('No') ? 'form-error' : 'form-success'} role="status">{message}</span>}</>
}
