import test from 'node:test'
import assert from 'node:assert/strict'
import { clearCalculatorDraft, emptyCalculatorDraft, loadCalculatorDraft, saveCalculatorDraft } from '../src/utils/calculatorDraft.ts'

test('cada calculadora conserva sus valores y selección de forma independiente', () => {
  const entries = new Map()
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }
  saveCalculatorDraft('iva', { ...emptyCalculatorDraft(), amount: '1190', reverse: true }, storage)
  saveCalculatorDraft('descuento', { ...emptyCalculatorDraft(), amount: '3000', discount: '12.5' }, storage)
  saveCalculatorDraft('margen', { ...emptyCalculatorDraft(), marginNetCost: '1000', marginNetPercent: '50', marginNetPercent2: '35', marginTotalCost: '1190', marginTotalPercent: '35', marginTotalPercent3: '20', marginBasis: 'total' }, storage)
  saveCalculatorDraft('cantidad', { ...emptyCalculatorDraft(), amount: '1000', quantity: '3', discount: '10' }, storage)
  assert.deepEqual(loadCalculatorDraft('iva', storage), { ...emptyCalculatorDraft(), amount: '1190', reverse: true })
  assert.deepEqual(loadCalculatorDraft('descuento', storage), { ...emptyCalculatorDraft(), amount: '3000', discount: '12.5' })
  assert.deepEqual(loadCalculatorDraft('margen', storage), { ...emptyCalculatorDraft(), marginNetCost: '1000', marginNetPercent: '50', marginNetPercent2: '35', marginTotalCost: '1190', marginTotalPercent: '35', marginTotalPercent3: '20', marginBasis: 'total' })
  assert.deepEqual(loadCalculatorDraft('cantidad', storage), { ...emptyCalculatorDraft(), amount: '1000', quantity: '3', discount: '10' })
  saveCalculatorDraft('margen', { ...emptyCalculatorDraft(), marginBasis: 'total' }, storage)
  assert.deepEqual(loadCalculatorDraft('margen', storage), { ...emptyCalculatorDraft(), marginBasis: 'total' })
  assert.equal(loadCalculatorDraft('iva', storage).amount, '1190')
})

test('limpiar margen borra solo el modo visible y conserva el otro', () => {
  const draft = { ...emptyCalculatorDraft(), marginNetCost: '1000', marginNetPercent: '50', marginNetPercent2: '25', marginNetPercent3: '10', marginTotalCost: '1190', marginTotalPercent: '35', marginTotalPercent2: '20', marginTotalPercent3: '5' }
  const clearedNet = clearCalculatorDraft('margen', draft)
  assert.equal(clearedNet.marginNetCost, '')
  assert.equal(clearedNet.marginNetPercent, '')
  assert.equal(clearedNet.marginNetPercent2, '')
  assert.equal(clearedNet.marginNetPercent3, '')
  assert.equal(clearedNet.marginTotalCost, '1190')
  assert.equal(clearedNet.marginTotalPercent, '35')
  assert.equal(clearedNet.marginTotalPercent2, '20')
  const clearedTotal = clearCalculatorDraft('margen', { ...draft, marginBasis: 'total' })
  assert.equal(clearedTotal.marginNetCost, '1000')
  assert.equal(clearedTotal.marginNetPercent, '50')
  assert.equal(clearedTotal.marginTotalCost, '')
  assert.equal(clearedTotal.marginTotalPercent, '')
  assert.equal(clearedTotal.marginTotalPercent2, '')
  assert.equal(clearedTotal.marginTotalPercent3, '')
})

test('datos de margen de la versión anterior se asignan al modo que estaba seleccionado', () => {
  const storage = { getItem: () => JSON.stringify({ cost: '1190', desired: '50', marginBasis: 'total' }) }
  assert.deepEqual(loadCalculatorDraft('margen', storage), { ...emptyCalculatorDraft(), marginTotalCost: '1190', marginTotalPercent: '50', marginBasis: 'total' })
})

test('un borrador inválido se descarta sin bloquear la calculadora', () => {
  const storage = { getItem: () => '{', setItem: () => {} }
  assert.deepEqual(loadCalculatorDraft('iva', storage), emptyCalculatorDraft())
})
