import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyComparison, emptyOption, loadComparisonDraft, saveComparisonDraft } from '../src/utils/comparisonDraft.ts'

test('los comparativos por kilos y cantidad conservan datos separados', () => {
  const entries = new Map()
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }
  const draft = {
    basis: 'cantidad',
    kilos: [{ ...emptyOption(1), name: 'Papas', netTotal: '17563', sizeMode: 'pack', packUnits: '5', gramsPerUnit: '2500' }, emptyOption(2)],
    cantidad: [{ ...emptyOption(1), name: 'Latas', netTotal: '12000', size: '24' }, emptyOption(2)],
  }
  saveComparisonDraft(draft, storage)
  assert.deepEqual(loadComparisonDraft(storage), draft)
})

test('comparativos antiguos por kilos se recuperan en la nueva pestaña', () => {
  const legacy = [{ id: 1, name: 'Papas', netTotal: '17563', kilos: '12.5' }, { id: 2, name: '', netTotal: '', kilos: '' }]
  const storage = { getItem: key => key.endsWith(':v1') ? JSON.stringify(legacy) : null }
  assert.deepEqual(loadComparisonDraft(storage), { basis: 'kilos', kilos: [{ ...emptyOption(1), name: 'Papas', netTotal: '17563', size: '12.5' }, emptyOption(2)], cantidad: emptyComparison() })
})
test('una fila dañada no borra las demás opciones guardadas', () => {
  const saved = { basis: 'cantidad', kilos: emptyComparison(), cantidad: [{ ...emptyOption(1), name: 'Caja válida', netTotal: '12000', size: '24' }, { id: 2, name: 123, netTotal: '5000', size: '12' }] }
  const restored = loadComparisonDraft({ getItem: () => JSON.stringify(saved) })
  assert.deepEqual(restored.cantidad, [{ ...emptyOption(1), name: 'Caja válida', netTotal: '12000', size: '24' }, emptyOption(2)])
})

test('se conserva una cantidad decimal al volver a comparativos', () => {
  const saved = { basis: 'cantidad', kilos: emptyComparison(), cantidad: [{ ...emptyOption(1), name: 'Caja de 12,5 kg', netTotal: '17563', size: '12.5' }, emptyOption(2)] }
  assert.deepEqual(loadComparisonDraft({ getItem: () => JSON.stringify(saved) }), saved)
})
