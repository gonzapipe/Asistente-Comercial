import { useEffect, useState } from 'react'
import { useAppSettings } from '../components/SettingsContext'
import { Field, Money, PageTitle } from '../components/ui/Fields'
import { CalculatorTabs } from '../components/ui/CalculatorTabs'
import { ShareButton } from '../components/ui/ShareButton'
import { bpsPercent, formatMoney, priceFromTarget } from '../utils/money'
import { numericInput, numericValue } from '../utils/numericInput'
import { emptyTargetDraft, loadTargetDraft, saveTargetDraft } from '../utils/targetDraft'

export function TargetPricePage() {
  const settings = useAppSettings()
  const [draft, setDraft] = useState(loadTargetDraft)
  useEffect(() => { saveTargetDraft(draft) }, [draft])
  const cost = numericValue(draft.cost), target = numericValue(draft.target)
  const result = cost === null || target === null ? null : priceFromTarget(cost, target, draft.basis, settings.taxRateBps)
  const basisName = draft.basis === 'net' ? 'neto' : 'con IVA'
  const details = result ? [
    `Costo ${basisName}: ${formatMoney(cost ?? 0)}`,
    `Precio objetivo con IVA: ${formatMoney(result.sale.total)}`,
    `Neto del precio objetivo: ${formatMoney(result.sale.net)}`,
    `IVA ${bpsPercent(settings.taxRateBps)} del precio objetivo: ${formatMoney(result.sale.tax)}`,
    `${result.difference < 0 ? 'Diferencia respecto al costo' : 'Aumento respecto al costo'}: ${formatMoney(result.difference)}`,
    `Porcentaje sobre costo ${basisName}: ${result.percentBps === null ? 'No calculable con costo cero' : bpsPercent(result.percentBps)}`,
  ].join('\n') : ''
  function update(field: 'cost' | 'target', value: string) { const valid = numericInput(value); if (valid !== null) setDraft(current => ({ ...current, [field]: valid })) }
  return <div className="page calc-page"><PageTitle eyebrow="PRECIOS Y CÁLCULOS" title="Precio objetivo"/><CalculatorTabs activePath="/precio-objetivo"/>
    <div className="calculator-layout"><section className="panel calculator-form"><div className="panel-title"><span className="eyebrow">INGRESA LOS DATOS</span><h2>Calcular desde el precio final</h2></div>
      <div className="segmented" aria-label="Tipo de costo"><button type="button" className={draft.basis === 'net' ? 'selected' : ''} aria-pressed={draft.basis === 'net'} onClick={() => setDraft(current => ({ ...current, basis: 'net' }))}>Costo neto</button><button type="button" className={draft.basis === 'total' ? 'selected' : ''} aria-pressed={draft.basis === 'total'} onClick={() => setDraft(current => ({ ...current, basis: 'total' }))}>Costo con IVA</button></div>
      <Field label={draft.basis === 'net' ? 'Costo neto ($)' : 'Costo con IVA ($)'} inputMode="numeric" value={draft.cost} placeholder="Ingresa un número" onChange={event => update('cost', event.target.value)} />
      <Field label="Precio objetivo total con IVA ($)" inputMode="numeric" value={draft.target} placeholder="Ingresa un número" onChange={event => update('target', event.target.value)} />
      <p className="helper">El porcentaje indica cuánto cambia el valor respecto al costo {basisName} ingresado. El IVA se calcula con la tasa configurada.</p>
      <div className="calculator-actions"><button type="button" className="secondary-button clear-comparison" onClick={() => setDraft(current => ({ ...emptyTargetDraft(), basis: current.basis }))}>Limpiar datos</button></div>
    </section><section className="panel result-panel" aria-live="polite"><div className="panel-title"><span className="eyebrow">RESULTADO INMEDIATO</span><h2>Precio objetivo</h2></div>
      {result ? <><div className="result-rows"><div><span>Costo {basisName}</span><strong><Money value={cost ?? 0}/></strong></div><div><span>Neto del precio objetivo</span><strong><Money value={result.sale.net}/></strong></div><div><span>IVA {bpsPercent(settings.taxRateBps)}</span><strong><Money value={result.sale.tax}/></strong></div><div><span>{result.difference < 0 ? 'Diferencia respecto al costo' : 'Aumento respecto al costo'}</span><strong><Money value={result.difference}/></strong></div><div><span>Porcentaje sobre costo {basisName}</span><strong>{result.percentBps === null ? '—' : bpsPercent(result.percentBps)}</strong></div></div><div className="total-box"><span>PRECIO OBJETIVO CON IVA</span><strong><Money value={result.sale.total}/></strong></div><div className="result-actions"><ShareButton text={details} label="Compartir resultado"/></div></> : <p className="empty-result">Ingresa el costo y el precio objetivo con IVA.</p>}
    </section></div>
    <div className="page-end-actions"><button type="button" className="secondary-button clear-comparison" onClick={() => setDraft(current => ({ ...emptyTargetDraft(), basis: current.basis }))}>Limpiar datos</button></div>
  </div>
}
