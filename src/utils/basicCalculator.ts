import { draftStorage } from './draftStorage.ts'
import Decimal from 'decimal.js'
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export type CalculatorOperator = '+' | '−' | '×' | '÷'
export type CalculatorKey = 'C' | '⌫' | ',' | '=' | '%' | '±' | CalculatorOperator | `${number}`

export type CalculatorState = {
  display: string
  expression: string
  accumulator: number | string | null
  operator: CalculatorOperator | null
  awaitingOperand: boolean
  error: boolean
  exactValue?: string
}

export const initialCalculatorState: CalculatorState = {
  display: '0', expression: '', accumulator: null, operator: null, awaitingOperand: false, error: false,
}

export const basicCalculatorStateKey = 'venta-facil:calculadora:v1'

export function loadBasicCalculatorState(storage?: Pick<Storage, 'getItem'>): CalculatorState {
  try {
    const saved: unknown = JSON.parse((storage ?? draftStorage).getItem(basicCalculatorStateKey) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { ...initialCalculatorState }
    const state = saved as Record<string, unknown>
    const validDisplay = typeof state.display === 'string' && state.display.length <= 150 &&
      (state.display === 'Error' || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(state.display) && Number.isFinite(Number(state.display)) && Math.abs(Number(state.display)) < 1e12)
    const validExpression = typeof state.expression === 'string' && state.expression.length <= 10_000
    const validAccumulator = state.accumulator === null || validDecimal(state.accumulator)
    const validOperator = state.operator === null || state.operator === '+' || state.operator === '−' || state.operator === '×' || state.operator === '÷'
    if (state.exactValue !== undefined && !validDecimal(state.exactValue)) return { ...initialCalculatorState }
    if (!validDisplay || !validExpression || !validAccumulator || !validOperator || (state.operator === null) !== (state.accumulator === null) || typeof state.awaitingOperand !== 'boolean' || typeof state.error !== 'boolean' || (state.error !== (state.display === 'Error'))) return { ...initialCalculatorState }
    const restored = state as CalculatorState
    return { ...restored, display: restored.display !== 'Error' && /e/i.test(restored.display) ? plainResult(new D(restored.display)) : restored.display }
  } catch { return { ...initialCalculatorState } }
}

export function saveBasicCalculatorState(state: CalculatorState, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? draftStorage).setItem(basicCalculatorStateKey, JSON.stringify(state)) } catch { /* La calculadora sigue funcionando si no hay almacenamiento. */ }
}

const maxDigits = 12

function validDecimal(value: unknown): boolean {
  if (typeof value !== 'number' && typeof value !== 'string') return false
  if (String(value).length > 150 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value))) return false
  try { const n = new D(value); return n.isFinite() && n.abs().lt('1e12') && (n.isZero() || n.abs().gte('1e-100')) } catch { return false }
}

function plainResult(value: Decimal): string {
  const rounded = value.toDecimalPlaces(10)
  return rounded.isZero() && !value.isZero() ? value.toSignificantDigits(10).toFixed() : rounded.toFixed()
}

function calculate(left: number | string, right: string, operator: CalculatorOperator): Decimal | null {
  const a = new D(left), b = new D(right)
  const result = operator === '+' ? a.plus(b) : operator === '−' ? a.minus(b) : operator === '×' ? a.times(b) : b.isZero() ? new D(NaN) : a.div(b)
  return !result.isFinite() || result.abs().gte('1e12') || (!result.isZero() && result.abs().lt('1e-100')) ? null : result
}

export function calculatorError(state: CalculatorState): string {
  if (state.error) return 'Operación anterior no válida. Pulsa C o escribe un nuevo número.'
  if (state.accumulator === null || state.operator === null || state.awaitingOperand) return ''
  if (state.operator === '÷' && new D(state.exactValue ?? state.display).isZero()) return 'No se puede dividir por cero. Corrige el segundo número o pulsa C.'
  return calculate(state.accumulator, state.exactValue ?? state.display, state.operator) === null ? 'El resultado supera el rango admitido. Corrige los números o pulsa C.' : ''
}

export function pressCalculatorKey(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (key === 'C') return { ...initialCalculatorState }
  if (state.error) return /^\d$/.test(key) ? { ...initialCalculatorState, display: key } : state

  if (/^\d$/.test(key)) {
    if (state.awaitingOperand) return { ...state, display: key, exactValue: undefined, expression: state.operator === null ? '' : state.expression, awaitingOperand: false }
    if (state.display.replace(/\D/g, '').length >= maxDigits) return state
    return { ...state, exactValue: undefined, display: state.display === '0' ? key : state.display === '-0' ? `-${key}` : state.display + key }
  }

  if (key === ',') {
    if (state.awaitingOperand) return { ...state, display: '0.', exactValue: undefined, expression: state.operator === null ? '' : state.expression, awaitingOperand: false }
    return state.display.includes('.') ? state : { ...state, display: state.display + '.', exactValue: undefined }
  }

  if (key === '⌫') {
    if (state.awaitingOperand && state.operator !== null) return state
    const next = state.display.slice(0, -1)
    return { ...state, exactValue: undefined, display: next === '' || next === '-' ? '0' : next, expression: state.awaitingOperand ? '' : state.expression, awaitingOperand: false }
  }

  if (key === '±') {
    if (state.awaitingOperand && state.operator !== null) return { ...state, display: '-0', exactValue: undefined, awaitingOperand: false }
    return { ...state, exactValue: state.exactValue === undefined ? undefined : new D(state.exactValue).neg().toString(), display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`, expression: state.awaitingOperand ? '' : state.expression, awaitingOperand: false }
  }

  if (key === '%') {
    if (state.awaitingOperand && state.operator !== null) return state
    const value = new D(state.exactValue ?? state.display).div(100)
    const result = state.accumulator !== null && (state.operator === '+' || state.operator === '−') ? new D(state.accumulator).times(value) : value
    if (!validDecimal(result.toString())) return state
    return { ...state, display: plainResult(result), exactValue: result.toString(), expression: state.awaitingOperand ? '' : state.expression, awaitingOperand: false }
  }

  if (key === '=') {
    if (state.accumulator === null || state.operator === null) return { ...state, awaitingOperand: true }
    if (state.awaitingOperand) return state
    const expression = `${state.expression} ${formatCalculatorDisplay(state.display)} =`
    const result = calculate(state.accumulator, state.exactValue ?? state.display, state.operator)
    return result === null ? state : { display: plainResult(result), exactValue: result.toString(), expression, accumulator: null, operator: null, awaitingOperand: true, error: false }
  }

  if (key === '+' || key === '−' || key === '×' || key === '÷') {
    if (state.awaitingOperand && state.operator !== null) return { ...state, operator: key, expression: state.expression.replace(/[+−×÷]$/, key) }
    const expression = state.operator === null ? `${formatCalculatorDisplay(state.display)} ${key}` : `(${state.expression} ${formatCalculatorDisplay(state.display)}) ${key}`
    const result = state.accumulator !== null && state.operator !== null
      ? calculate(state.accumulator, state.exactValue ?? state.display, state.operator)
      : new D(state.exactValue ?? state.display)
    return result === null ? state : { display: plainResult(result), exactValue: result.toString(), expression, accumulator: result.toString(), operator: key, awaitingOperand: true, error: false }
  }

  return state
}

export function formatCalculatorDisplay(display: string): string {
  if (display === 'Error') return display
  const [integer, decimals] = display.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimals === undefined ? grouped : `${grouped},${decimals}`
}

export function calculatorLiveResult(state: CalculatorState): string {
  if (state.error || state.accumulator === null || state.operator === null || state.awaitingOperand) return state.display
  const result = calculate(state.accumulator, state.exactValue ?? state.display, state.operator)
  return result === null ? 'Error' : plainResult(result)
}

export function calculatorExpression(state: CalculatorState): string {
  if (state.expression.endsWith('=') || state.error || state.awaitingOperand) return state.expression || formatCalculatorDisplay(state.display)
  return state.operator === null ? formatCalculatorDisplay(state.display) : `${state.expression} ${formatCalculatorDisplay(state.display)}`
}
