/** Mantiene el texto vacío mientras se edita y rechaza caracteres no numéricos. */
export function numericInput(value: string, decimals = 0, max = 100_000_000_000): string | null {
  const normalized = value.replace(',', '.')
  const pattern = decimals === 0 ? /^\d*$/ : new RegExp(`^\\d*(?:\\.\\d{0,${decimals}})?$`)
  if (!pattern.test(normalized)) return null
  if (normalized !== '' && normalized !== '.' && (!Number.isFinite(Number(normalized)) || Number(normalized) > max)) return null
  return normalized
}

export function numericValue(value: string): number | null {
  if (value === '' || value === '.') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
