// El mismo límite se aplica al crear e importar para que todo respaldo sea restaurable.
export const maxBackupBytes = 50_000_000
export const backupSizeError = 'El respaldo supera el límite de 50 MB.'
export function checkBackupSize(text: string): void {
  if (new Blob([text]).size > maxBackupBytes) throw new Error(backupSizeError)
}
