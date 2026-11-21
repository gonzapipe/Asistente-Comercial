import { Share } from '@capacitor/share'

export async function shareText(text: string): Promise<'shared' | 'copied'> {
  const available = await Share.canShare()
  if (available.value) { await Share.share({ title: 'Asistente Comercial', text, dialogTitle: 'Compartir resultado' }); return 'shared' }
  await navigator.clipboard.writeText(text)
  return 'copied'
}
