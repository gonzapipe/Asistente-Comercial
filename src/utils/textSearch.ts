export function matchesSearch(query: string, values: string[]): boolean {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL')
  const words = normalize(query).trim().split(/\s+/).filter(Boolean)
  const content = normalize(values.join(' '))
  return words.every(word => content.includes(word))
}

export function agendaDetails(entry: { name: string; phone: string; address: string; email: string; company: string; notes: string }): string {
  const lines = [
    ['Nombre', entry.name], ['Teléfono', entry.phone], ['Dirección', entry.address],
    ['Correo', entry.email], ['Empresa', entry.company], ['Notas', entry.notes],
  ].filter(([, value]) => value.trim())
  return lines.length ? lines.map(([label, value]) => `${label}: ${value.trim()}`).join('\n') : 'Contacto sin datos'
}
