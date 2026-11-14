import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyAgendaDraft, emptyNoteDraft, loadAgendaDraft, loadNoteDraft, saveAgendaDraft, saveNoteDraft } from '../src/utils/recordDraft.ts'

test('los textos largos no se recortan al recuperar el borrador', () => {
  const content = 'Texto largo '.repeat(3000)
  assert.equal(loadNoteDraft({getItem: () => JSON.stringify({title:'Nota',content})}).content, content)
  assert.equal(loadAgendaDraft({getItem: () => JSON.stringify({notes:content})}).notes, content)
})

test('Notas y Agenda recuperan lo escrito sin guardar al cambiar de opción', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const note = { editingId: null, title: 'Precio', content: 'Revisar margen mañana' }
  const contact = { editingId: null, name: 'Cliente', phone: '1234', address: 'Calle 1', email: '', company: '', notes: 'Visitar lunes' }
  saveNoteDraft(note, storage)
  saveAgendaDraft(contact, storage)
  assert.deepEqual(loadNoteDraft(storage), note)
  assert.deepEqual(loadAgendaDraft(storage), contact)
  saveNoteDraft(emptyNoteDraft(), storage)
  saveAgendaDraft(emptyAgendaDraft(), storage)
  assert.deepEqual(loadNoteDraft(storage), emptyNoteDraft())
  assert.deepEqual(loadAgendaDraft(storage), emptyAgendaDraft())
})

test('un borrador guardado con formato inválido no bloquea el formulario', () => {
  const storage = { getItem: () => '[]' }
  assert.deepEqual(loadNoteDraft(storage), emptyNoteDraft())
  assert.deepEqual(loadAgendaDraft(storage), emptyAgendaDraft())
})
