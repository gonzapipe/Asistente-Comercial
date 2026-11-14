import test from 'node:test'
import assert from 'node:assert/strict'
import { agendaDetails, matchesSearch } from '../src/utils/textSearch.ts'

test('búsqueda instantánea ignora mayúsculas y tildes en todos los campos', () => {
  assert.equal(matchesSearch('péRez +56', ['Gonzalo Pérez', '+56 9 1234 5678']), true)
  assert.equal(matchesSearch('PAPAS 12', ['Papas corte casero', 'Caja de 12 kg']), true)
  assert.equal(matchesSearch('PAPAS 20', ['Papas corte casero', 'Caja de 12 kg']), false)
  assert.equal(matchesSearch('', ['Cualquier nota']), true)
})

test('copiar detalles omite campos vacíos y conserva el texto útil', () => {
  assert.equal(agendaDetails({ name: ' Ana ', phone: '123', address: '', email: '', company: '', notes: 'Llamar mañana' }), 'Nombre: Ana\nTeléfono: 123\nNotas: Llamar mañana')
  assert.equal(agendaDetails({ name: '', phone: '', address: '', email: '', company: '', notes: '' }), 'Contacto sin datos')
})
