import { useEffect, useReducer, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { CalculatorTabs } from '../components/ui/CalculatorTabs'
import { PageTitle } from '../components/ui/Fields'
import { calculatorError, calculatorExpression, calculatorLiveResult, formatCalculatorDisplay, initialCalculatorState, loadBasicCalculatorState, pressCalculatorKey, saveBasicCalculatorState, type CalculatorKey } from '../utils/basicCalculator'

const keys: CalculatorKey[][] = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['±', '0', ',', '='],
]

const keyNames: Partial<Record<CalculatorKey, string>> = {
  C: 'Borrar todo', '⌫': 'Borrar último dígito', '%': 'Porcentaje', '±': 'Cambiar signo', '÷': 'Dividir', '×': 'Multiplicar', '−': 'Restar', '+': 'Sumar', '=': 'Igual', ',': 'Separador decimal',
}

export function BasicCalculator() {
  const [state, press] = useReducer(pressCalculatorKey, initialCalculatorState, () => loadBasicCalculatorState())
  const liveResult = calculatorLiveResult(state)
  const operationError = calculatorError(state)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  useEffect(() => { saveBasicCalculatorState(state) }, [state])
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return
      const key = event.key
      if ((key === 'Enter' || key === ' ') && event.target instanceof HTMLElement && event.target.closest('button,a') && !(key === 'Enter' && event.target.closest('.calculator-key'))) return
      const mapped: CalculatorKey | null = /^\d$/.test(key) ? key as CalculatorKey : ({ Enter: '=', '=': '=', Backspace: '⌫', Delete: 'C', Escape: 'C', '*': '×', x: '×', X: '×', '/': '÷', '-': '−', '+': '+', '.': ',', ',': ',', '%': '%', F9: '±' } as Record<string, CalculatorKey>)[key] ?? null
      if (mapped) { event.preventDefault(); press(mapped) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  async function copyResult() {
    try { await navigator.clipboard.writeText(formatCalculatorDisplay(liveResult)); setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 1800) }
    catch { setCopyError(true) }
  }
  return <div className="page calc-page">
    <PageTitle eyebrow="PRECIOS Y CÁLCULOS" title="Calculadora" />
    <CalculatorTabs activePath="/calculadora" />
    <section className="panel basic-calculator" aria-label="Calculadora simple">
      <div className="panel-title"><span className="eyebrow">CÁLCULO RÁPIDO</span><h2>Operaciones básicas</h2></div>
      <div className="calculator-screen" role="status" aria-live="polite" aria-label="Resultado">
        <span aria-label="Operación ingresada">{calculatorExpression(state)}</span>
        <strong>{formatCalculatorDisplay(liveResult)}</strong>
      </div>
      <div className="calculator-keys">{keys.flatMap(row => row.map(key => <button key={key} type="button" className={`calculator-key ${key === '=' ? 'equals' : key === 'C' || key === '⌫' || key === '±' || key === '%' ? 'utility' : key === '+' || key === '−' || key === '×' || key === '÷' ? 'operator' : ''}`} aria-label={keyNames[key] ?? key} onClick={() => press(key)}>{key}</button>))}</div>
      <button type="button" className="secondary-button calculator-copy" disabled={liveResult === 'Error'} onClick={() => void copyResult()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copiado' : 'Copiar resultado'}</button>
      {copyError && <p className="form-error" role="status">No se pudo copiar. Revisa el permiso del portapapeles.</p>}
      {operationError && <p className="form-error" role="status">{operationError}</p>}
      <p className="helper">El resultado se actualiza al escribir. Las operaciones se resuelven en el orden ingresado; puedes continuar con × o ÷ sin pulsar =. Para decimales, usa la tecla coma; el teclado también acepta punto. En sumas y restas, % se aplica al valor anterior; en multiplicaciones y divisiones, al número actual.</p>
    </section>
    <div className="page-end-actions"><button type="button" className="secondary-button clear-comparison" onClick={() => press('C')}>Limpiar datos</button></div>
  </div>
}
