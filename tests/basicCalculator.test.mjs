import test from 'node:test'
import assert from 'node:assert/strict'
import { basicCalculatorStateKey, calculatorExpression, calculatorLiveResult, formatCalculatorDisplay, initialCalculatorState, loadBasicCalculatorState, pressCalculatorKey, saveBasicCalculatorState } from '../src/utils/basicCalculator.ts'

const sequence = (...keys) => keys.reduce(pressCalculatorKey, initialCalculatorState)
const digits = value => String(value).replaceAll('.', ',').split('')

test('multiplicar y dividir por decimales funciona con y sin igual intermedio', () => {
  for (const separator of [[], ['=']]) {
    const state = sequence(...digits(17563), '×', ...digits(1.19), ...separator, '÷', ...digits(12.5))
    assert.equal(calculatorLiveResult(state), '1671.9976')
    assert.equal(pressCalculatorKey(state, '=').display, '1671.9976')
    assert.equal(calculatorLiveResult(sequence(...digits(1000), '×', ...digits(1.5), ...separator, '÷', ...digits(0.5))), '3000')
  }
})

test('las divisiones encadenadas conservan precisión interna y sobreviven a recargar', () => {
  const state = sequence('1','÷','3','=')
  const restored = loadBasicCalculatorState({getItem:()=>JSON.stringify(state)})
  assert.equal(calculatorLiveResult(['×','3'].reduce(pressCalculatorKey, restored)), '1')
  assert.equal(calculatorLiveResult(sequence('0',',','1','+','0',',','2','−','0',',','3')), '0')
  assert.equal(calculatorLiveResult(sequence('1','÷',...digits(100000000000))), '0.00000000001')
})

test('igual sin operador inicia una entrada nueva y un divisor inválido se puede corregir', () => {
  assert.equal(sequence('1','2','=','3').display,'3')
  const state=sequence('8','÷','0','=')
  assert.equal(state.accumulator,'8')
  assert.equal(calculatorLiveResult(['⌫','2'].reduce(pressCalculatorKey,state)),'4')
})

test('resultados pequeños se muestran y editan sin notación científica', () => {
  const small = sequence('1', '÷', '1', '0', '0', '0', '0', '0', '0', '0', '=')
  assert.equal(small.display, '0.0000001')
  assert.equal(formatCalculatorDisplay(small.display), '0,0000001')
  assert.equal(pressCalculatorKey(small, '⌫').display, '0.000000')
  assert.equal(calculatorLiveResult(sequence('1','0','0','+','5','0')), '150')
})

test('operaciones básicas y cálculos encadenados', () => {
  assert.equal(sequence('1', '0', '+', '5', '=').display, '15')
  assert.equal(sequence('1', '0', '−', '1', '5', '=').display, '-5')
  assert.equal(sequence('1', '2', '×', '3', '=').display, '36')
  assert.equal(sequence('1', '2', '÷', '3', '=').display, '4')
  assert.equal(sequence('1', '0', '+', '5', '×', '2', '=').display, '30')
})

test('decimales, redondeo y formato chileno', () => {
  assert.equal(sequence('0', ',', '1', '+', '0', ',', '2', '=').display, '0.3')
  assert.equal(sequence('1', '÷', '3', '=').display, '0.3333333333')
  assert.equal(formatCalculatorDisplay('1234567.50'), '1.234.567,50')
})

test('borrado, cambio de operador y división por cero', () => {
  assert.equal(sequence('1', '2', '⌫').display, '1')
  assert.equal(sequence('1', '2', 'C').display, '0')
  assert.equal(sequence('8', '+', '−', '3', '=').display, '5')
  assert.equal(calculatorLiveResult(sequence('8', '÷', '0', '=')), 'Error')
  assert.equal(calculatorLiveResult(sequence('8', '÷', '0', '=', '2')), '4')
})

test('la pantalla conserva los números digitados y la operación completa', () => {
  assert.equal(calculatorExpression(sequence('1', '0', '0', '0')), '1.000')
  assert.equal(calculatorExpression(sequence('1', '0', '0', '0', '+')), '1.000 +')
  assert.equal(calculatorExpression(sequence('1', '0', '0', '0', '+', '2', '0', '0')), '1.000 + 200')
  assert.equal(calculatorExpression(sequence('1', '0', '0', '0', '+', '2', '0', '0', '=')), '1.000 + 200 =')
  assert.equal(sequence('1', '0', '0', '0', '+', '2', '0', '0', '=').display, '1200')
  assert.equal(calculatorExpression(sequence('1', '0', '+', '5', '×', '2', '=')), '(10 + 5) × 2 =')
  assert.equal(calculatorExpression(sequence('8', '+', '−', '3', '=')), '8 − 3 =')
  assert.equal(calculatorExpression(sequence('8', '÷', '0', '=')), '8 ÷ 0')
  assert.equal(calculatorExpression(sequence('8', '+', '2', '=', '3')), '3')
  assert.equal(calculatorExpression(sequence('8', '+', '2', '=', 'C')), '0')
})
test('porcentaje contextual, cambio de signo y edición del resultado', () => {
  assert.equal(sequence('1', '0', '0', '+', '1', '0', '%', '=').display, '110')
  assert.equal(sequence('1', '0', '0', '×', '1', '0', '%', '=').display, '10')
  assert.equal(sequence('5', '0', '%').display, '0.5')
  assert.equal(sequence('2', '5', '±').display, '-25')
  assert.equal(sequence('2', '5', '±', '±').display, '25')
  assert.equal(sequence('2', '5', '+', '±', '3', '=').display, '22')
  assert.equal(sequence('2', '5', '+', '5', '=', '⌫').display, '3')
})

test('el resultado aparece durante la entrada y cambia al corregir sin pulsar igual', () => {
  assert.equal(calculatorLiveResult(sequence('1', '0', '+', '5')), '15')
  assert.equal(calculatorLiveResult(sequence('1', '0', '+', '5', '0')), '60')
  assert.equal(calculatorLiveResult(sequence('1', '0', '+', '5', '0', '⌫')), '15')
  assert.equal(calculatorLiveResult(sequence('1', '0', '0', '+', '1', '0', '%')), '110')
  assert.equal(calculatorLiveResult(sequence('8', '÷', '0')), 'Error')
  assert.equal(calculatorLiveResult(sequence('8', '÷', '0', '2')), '4')
  assert.equal(calculatorLiveResult(sequence('1', '0', '+')), '10')
})

test('la operación y el resultado inmediato sobreviven al cambio de pantalla y solo C los limpia', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const pending = sequence('1', '0', '+', '5')
  saveBasicCalculatorState(pending, storage)
  const restored = loadBasicCalculatorState(storage)
  assert.equal(calculatorExpression(restored), '10 + 5')
  assert.equal(calculatorLiveResult(restored), '15')
  saveBasicCalculatorState(pressCalculatorKey(restored, 'C'), storage)
  assert.deepEqual(loadBasicCalculatorState(storage), initialCalculatorState)
  assert.ok(values.has(basicCalculatorStateKey))
})

test('descarta un estado de calculadora dañado sin impedir nuevos cálculos', () => {
  const storage = { getItem: () => '{"display":"9","expression":"9 +","accumulator":"mal","operator":"+","awaitingOperand":false,"error":false}' }
  assert.deepEqual(loadBasicCalculatorState(storage), initialCalculatorState)
})
