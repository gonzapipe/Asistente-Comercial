import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Copy, Info, Plus, Trash2 } from 'lucide-react'
import { useAppSettings } from '../components/SettingsContext'
import { Field, Money, PageTitle } from '../components/ui/Fields'
import { CalculatorTabs } from '../components/ui/CalculatorTabs'
import { ShareButton } from '../components/ui/ShareButton'
import { bpsPercent, calculateLine, compareProductsByUnit, discountAmount, formatMoney, kilosFromPack, netFromTotal, percentBps, priceWithMargin, taxFromNet, totalFromNet, unitNetAfterDiscount } from '../utils/money'
import { numericInput, numericValue } from '../utils/numericInput'
import { clearCalculatorDraft, emptyCalculatorDraft, loadCalculatorDraft, saveCalculatorDraft } from '../utils/calculatorDraft'
import { emptyComparison, emptyOption, loadComparisonDraft, saveComparisonDraft, type ComparisonBasis, type CompareOption } from '../utils/comparisonDraft'
import { db } from '../db/database'
import { normalizeCatalogText } from '../utils/priceCatalog'
import type { PriceCatalogProduct } from '../types/domain'

export type CalculatorMode = 'iva' | 'descuento' | 'margen' | 'cantidad' | 'comparar'
type ProductRow = ReturnType<typeof compareProductsByUnit>['rows'][number]
const paths: Record<CalculatorMode, string> = { iva: '/iva', descuento: '/descuentos', margen: '/margen', cantidad: '/cantidades', comparar: '/comparativos' }
const labels: Record<CalculatorMode, string> = { iva: 'Calculadora de IVA', descuento: 'Calculadora de descuentos', margen: 'Margen y utilidad', cantidad: 'Precio por cantidad', comparar: 'Comparar precios' }
const optionLabel = (index: number) => { let value = index + 1, label = ''; while (value > 0) { value--; label = String.fromCharCode(65 + value % 26) + label; value = Math.floor(value / 26) } return label }
const marginDetailsFor = (entry: { index: number; percent: number; result: ReturnType<typeof priceWithMargin> }, basis: 'net' | 'total') => {
  const percentLabel = bpsPercent(percentBps(entry.percent))
  const rows: [string, number][] = basis === 'net'
    ? [[`Aumento neto (${percentLabel})`, entry.result.increase], ['Total con IVA y margen', entry.result.saleTotal]]
    : [[`Aumento total (${percentLabel})`, entry.result.increase], ['Total con IVA', entry.result.costTotal]]
  const total = basis === 'net' ? entry.result.saleNet : entry.result.saleTotal
  const totalLabel = basis === 'net' ? 'NETO CON MARGEN' : 'TOTAL CON IVA Y MARGEN'
  return { percentLabel, rows, total, totalLabel, details: [`Margen ${entry.index + 1} (${percentLabel})`, ...rows.map(([label, value]) => `${label}: ${formatMoney(value)}`), `${totalLabel}: ${formatMoney(total)}`].join('\n') }
}
const productDetails = (row: ProductRow, taxRateBps: number, basis: ComparisonBasis) => [
  `Producto: ${row.name}`,
  `Total neto: ${formatMoney(row.netTotal)}`,
  `IVA ${bpsPercent(taxRateBps)}: ${formatMoney(row.taxTotal)}`,
  `Total con IVA: ${formatMoney(row.grossTotal)}`,
  basis === 'kilos' ? `Kilos por caja: ${row.size.toLocaleString('es-CL', { maximumFractionDigits: 3 })} kg` : `Cantidad por caja: ${row.size.toLocaleString('es-CL', { maximumFractionDigits: 3 })}`,
  `${basis === 'kilos' ? 'Neto por kilo' : 'Neto por unidad de medida'}: ${formatMoney(row.netPerUnit)}`,
  `${basis === 'kilos' ? 'Total por kilo' : 'Total por unidad de medida'}: ${formatMoney(row.grossPerUnit)}`,
].join('\n')

function NumberField({ label, value, onChange, decimals = 0, max, placeholder = 'Ingresa un número' }: { label: string; value: string; onChange: (value: string) => void; decimals?: number; max?: number; placeholder?: string }) {
  return <Field label={label} type="text" inputMode={decimals ? 'decimal' : 'numeric'} autoComplete="off" value={value} placeholder={placeholder} onChange={event => { const next = numericInput(event.target.value, decimals, max); if (next !== null) onChange(next) }} />
}

function EmptyResult({ message }: { message: string }) { return <p className="empty-result">{message}</p> }

export function Calculators({ mode }: { mode: CalculatorMode }) {
  return <CalculatorContent key={mode} mode={mode} />
}

function CalculatorContent({ mode }: { mode: CalculatorMode }) {
  const settings = useAppSettings()
  const [draft, setDraft] = useState(() => mode === 'comparar' ? emptyCalculatorDraft() : loadCalculatorDraft(mode))
  const { amount, discount, quantity, reverse, marginBasis } = draft
  const cost = marginBasis === 'net' ? draft.marginNetCost : draft.marginTotalCost
  const marginPercents = marginBasis === 'net'
    ? [draft.marginNetPercent, draft.marginNetPercent2, draft.marginNetPercent3]
    : [draft.marginTotalPercent, draft.marginTotalPercent2, draft.marginTotalPercent3]
  const setAmount = (value: string) => setDraft(current => ({ ...current, amount: value }))
  const setDiscount = (value: string) => setDraft(current => ({ ...current, discount: value }))
  const setCost = (value: string) => setDraft(current => current.marginBasis === 'net' ? { ...current, marginNetCost: value } : { ...current, marginTotalCost: value })
  const setMarginPercent = (index: number, value: string) => setDraft(current => {
    const field = current.marginBasis === 'net'
      ? (['marginNetPercent', 'marginNetPercent2', 'marginNetPercent3'] as const)[index]
      : (['marginTotalPercent', 'marginTotalPercent2', 'marginTotalPercent3'] as const)[index]
    return { ...current, [field]: value }
  })
  const setQuantity = (value: string) => setDraft(current => ({ ...current, quantity: value }))
  const setReverse = (value: boolean) => setDraft(current => ({ ...current, reverse: value }))
  const setMarginBasis = (value: 'net' | 'total') => setDraft(current => ({ ...current, marginBasis: value }))
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [copiedMarginIndex, setCopiedMarginIndex] = useState<number | null>(null)
  const [copiedOptionId, setCopiedOptionId] = useState<number | null>(null)
  const [comparisonDraft, setComparisonDraft] = useState(loadComparisonDraft)
  const catalogProducts = useLiveQuery(() => db.priceCatalog.toArray(), []) ?? []
  const [searchingOptionId, setSearchingOptionId] = useState<number | null>(null)
  const comparisonBasis = comparisonDraft.basis
  const options = comparisonDraft[comparisonBasis]
  useEffect(() => { if (mode !== 'comparar') saveCalculatorDraft(mode, draft) }, [mode, draft])
  useEffect(() => { saveComparisonDraft(comparisonDraft) }, [comparisonDraft])
  useEffect(() => {
    if (!catalogProducts.length) return
    const byId = new Map(catalogProducts.map(item => [item.id, item]))
    setComparisonDraft(current => {
      let changed = false
      const sync = (options: CompareOption[]) => options.map(option => {
        const product = option.catalogId ? byId.get(option.catalogId) : undefined
        if (!product) return option
        const net = String(netFromTotal(product.priceGross, settings.taxRateBps).net)
        const gross = String(product.priceGross)
        if (option.name === product.name && option.netTotal === net && option.catalogGross === gross) return option
        changed = true
        return { ...option, name: product.name, netTotal: net, catalogGross: gross }
      })
      const kilos = sync(current.kilos), cantidad = sync(current.cantidad)
      return changed ? { ...current, kilos, cantidad } : current
    })
  }, [catalogProducts, settings.taxRateBps])

  const amountValue = numericValue(amount), discountValue = numericValue(discount) ?? 0
  const costValue = numericValue(cost)
  const quantityValue = numericValue(quantity)
  const iva = amountValue === null ? null : reverse ? netFromTotal(amountValue, settings.taxRateBps) : { net: amountValue, tax: taxFromNet(amountValue, settings.taxRateBps), total: amountValue + taxFromNet(amountValue, settings.taxRateBps) }
  const saving = amountValue === null ? null : discountAmount(amountValue, percentBps(discountValue))
  const marginResults = costValue === null ? [] : marginPercents.flatMap((percent, index) => {
    const value = numericValue(percent)
    return value === null ? [] : [{ index, percent: value, result: priceWithMargin(costValue, percentBps(value), marginBasis, settings.taxRateBps) }]
  })
  const quantityOverflow = amountValue !== null && quantityValue !== null && amountValue * quantityValue > 100_000_000_000
  const line = amountValue === null || quantityValue === null || quantityValue < 1 || quantityOverflow ? null : calculateLine(amountValue, quantityValue, percentBps(discountValue), settings.taxRateBps)
  const optionDetails = options.map((option, index) => {
    const netTotal = numericValue(option.netTotal)
    const units = numericValue(option.packUnits), grams = numericValue(option.gramsPerUnit)
    const size = comparisonBasis === 'kilos' && option.sizeMode === 'pack'
      ? units !== null && grams !== null && Number.isSafeInteger(units) && Number.isSafeInteger(grams) && Number.isSafeInteger(units * grams) && units > 0 && grams > 0 ? kilosFromPack(units, grams) : null
      : numericValue(option.size)
    const name = option.name.trim() || `Opción ${optionLabel(index)}`
    const validNet = netTotal !== null && Number.isSafeInteger(netTotal) && netTotal <= 100_000_000_000
    const validSize = size !== null && size > 0 && size <= 1_000_000_000 && Math.abs(size * 1000 - Math.round(size * 1000)) < 0.000001 ? size : null
    const sizeEntered = comparisonBasis === 'kilos' && option.sizeMode === 'pack' ? option.packUnits !== '' && option.gramsPerUnit !== '' : option.size !== ''
    const catalogGross = option.catalogId ? numericValue(option.catalogGross ?? '') : null
    return { ...option, name, grossTotal: validNet ? catalogGross !== null && catalogGross >= netTotal ? catalogGross : totalFromNet(netTotal, settings.taxRateBps) : null, validSize, invalidNet: option.netTotal !== '' && !validNet, invalidSize: sizeEntered && validSize === null }
  })
  const validOptions = optionDetails.flatMap(option => option.grossTotal === null || option.validSize === null ? [] : [{ id: option.id, name: option.name, netTotal: Number(option.netTotal), size: option.validSize, grossTotal: option.catalogId ? option.grossTotal : undefined }])
  const comparison = compareProductsByUnit(validOptions, comparisonBasis, settings.taxRateBps)
  const comparisonRows = new Map(comparison.rows.map(row => [row.id, row]))

  function updateOptions(update: (current: CompareOption[]) => CompareOption[]) { setComparisonDraft(current => ({ ...current, [current.basis]: update(current[current.basis]) })) }
  function updateOption(id: number, field: 'name' | 'netTotal' | 'size' | 'sizeMode' | 'packUnits' | 'gramsPerUnit', value: string) { updateOptions(current => current.map(option => option.id === id ? { ...option, [field]: value, ...((field === 'name' || field === 'netTotal') && option.catalogId ? { catalogId: undefined, catalogGross: undefined, ...(field === 'name' ? { netTotal: '' } : {}) } : {}) } : option)) }
  function selectCatalogProduct(id: number, product: PriceCatalogProduct) {
    updateOptions(current => current.map(option => option.id === id ? { ...option, name: product.name, netTotal: String(netFromTotal(product.priceGross, settings.taxRateBps).net), catalogId: product.id, catalogGross: String(product.priceGross) } : option))
    setSearchingOptionId(null)
  }
  function addOption() { updateOptions(current => [...current, emptyOption(current.reduce((max, option) => Math.max(max, option.id), 0) + 1)]) }
  function removeOption(id: number) { updateOptions(current => current.length > 2 ? current.filter(option => option.id !== id) : current) }
  function clearComparison() { updateOptions(() => emptyComparison()); setCopiedOptionId(null) }
  function changeComparisonBasis(basis: ComparisonBasis) { setComparisonDraft(current => ({ ...current, basis })); setCopied(false); setCopiedOptionId(null) }
  function clearCalculator() { if (mode !== 'comparar') setDraft(current => clearCalculatorDraft(mode, current)); setCopied(false) }
  async function copy(value: string) { try { setCopyError(''); await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { setCopied(false); setCopyError('No se pudo copiar. Revisa el permiso del portapapeles.') } }
  async function copyMargin(index: number, value: string) { try { setCopyError(''); await navigator.clipboard.writeText(value); setCopiedMarginIndex(index); setTimeout(() => setCopiedMarginIndex(current => current === index ? null : current), 1800) } catch { setCopiedMarginIndex(null); setCopyError('No se pudo copiar. Revisa el permiso del portapapeles.') } }
  async function copyOption(row: ProductRow) { try { setCopyError(''); await navigator.clipboard.writeText(productDetails(row, settings.taxRateBps, comparisonBasis)); setCopiedOptionId(row.id); setTimeout(() => setCopiedOptionId(current => current === row.id ? null : current), 1800) } catch { setCopiedOptionId(null); setCopyError('No se pudo copiar. Revisa el permiso del portapapeles.') } }
  const ivaDetails = iva ? (reverse ? `Total con IVA: ${formatMoney(iva.total)}\nIVA ${bpsPercent(settings.taxRateBps)}: ${formatMoney(iva.tax)}\nTotal neto: ${formatMoney(iva.net)}` : `Neto: ${formatMoney(iva.net)}\nIVA ${bpsPercent(settings.taxRateBps)}: ${formatMoney(iva.tax)}\nTotal con IVA: ${formatMoney(iva.total)}`) : ''
  const discountDetails = amountValue !== null && saving !== null ? `Precio: ${formatMoney(amountValue)}\nDescuento: ${formatMoney(saving)}\nTotal: ${formatMoney(amountValue - saving)}` : ''
  const quantityDetails = line && quantityValue !== null ? `Subtotal: ${formatMoney(line.subtotal)}\nDescuento: ${formatMoney(line.discount)}\nPrecio unitario neto con descuento: ${formatMoney(unitNetAfterDiscount(line.net, quantityValue))}\nNeto: ${formatMoney(line.net)}\nIVA: ${formatMoney(line.tax)}\nTotal: ${formatMoney(line.total)}` : ''
  const comparisonDetails = comparison.rows.map(row => productDetails(row, settings.taxRateBps, comparisonBasis)).join('\n\n')
  const allMarginDetails = marginResults.map(entry => marginDetailsFor(entry, marginBasis).details).join('\n\n')

  return <div className="page calc-page">
    <PageTitle eyebrow="PRECIOS Y CÁLCULOS" title={labels[mode]} />
    <CalculatorTabs activePath={paths[mode]} />
    <div className="calculator-layout">
      <section className="panel calculator-form">
        <div className="panel-title"><span className="eyebrow">INGRESA LOS DATOS</span><h2>{labels[mode]}</h2></div>
        {mode === 'iva' && <><div className="segmented"><button type="button" aria-pressed={!reverse} className={!reverse ? 'selected' : ''} onClick={() => setReverse(false)}>Neto → Total</button><button type="button" aria-pressed={reverse} className={reverse ? 'selected' : ''} onClick={() => setReverse(true)}>Total → Neto</button></div><NumberField label={reverse ? 'Precio con IVA ($)' : 'Precio neto ($)'} value={amount} onChange={setAmount} /><p className="helper">IVA aplicado: {bpsPercent(settings.taxRateBps)}. Puedes cambiarlo en Ajustes.</p></>}
        {mode === 'descuento' && <><NumberField label="Precio original ($)" value={amount} onChange={setAmount} /><div className="chip-row" aria-label="Descuentos frecuentes">{[5, 10, 15, 20, 25, 30].map(n => <button type="button" key={n} className={discount === String(n) ? 'selected' : ''} onClick={() => setDiscount(String(n))}>{n}%</button>)}</div><NumberField label="Descuento (%)" value={discount} onChange={setDiscount} decimals={2} max={100} placeholder="Sin descuento" /></>}
        {mode === 'margen' && <>
          <div className="segmented" aria-label="Tipo de costo ingresado">
            <button type="button" className={marginBasis === 'net' ? 'selected' : ''} aria-pressed={marginBasis === 'net'} onClick={() => setMarginBasis('net')}>Ingresar valor neto</button>
            <button type="button" className={marginBasis === 'total' ? 'selected' : ''} aria-pressed={marginBasis === 'total'} onClick={() => setMarginBasis('total')}>Ingresar valor con IVA</button>
          </div>
          <NumberField label={marginBasis === 'net' ? 'Costo neto ($)' : 'Costo total con IVA ($)'} value={cost} onChange={setCost} />
          <div className="margin-inputs">{marginPercents.map((value, index) => <NumberField key={`${marginBasis}-${index}`} label={`Margen ${index + 1} (%)`} value={value} onChange={next => setMarginPercent(index, next)} decimals={2} max={9999.99} placeholder="Opcional" />)}</div>
          <p className="helper"><Info size={16} /> {marginBasis === 'net' ? 'Cada porcentaje se suma por separado al costo neto. Ejemplo: $1.000 + 50% ($500) = $1.500 netos. El total con IVA usa la tasa configurada.' : 'Cada porcentaje se suma por separado al costo con IVA. Ejemplo: $1.190 + 50% ($595) = $1.785 en total con IVA y margen.'}</p>
        </>}
        {mode === 'cantidad' && <><NumberField label="Precio unitario neto ($)" value={amount} onChange={setAmount} /><NumberField label="Cantidad" value={quantity} onChange={setQuantity} /><NumberField label="Descuento (%)" value={discount} onChange={setDiscount} decimals={2} max={100} placeholder="Sin descuento" />{line && quantityValue !== null && <div className="inline-calculation"><span>Precio unitario neto con descuento</span><strong><Money value={unitNetAfterDiscount(line.net, quantityValue)} /></strong></div>}</>}
        {mode === 'comparar' && <>
          <div className="segmented compare-basis" aria-label="Tipo de comparativo">
            <button type="button" className={comparisonBasis === 'kilos' ? 'selected' : ''} aria-pressed={comparisonBasis === 'kilos'} onClick={() => changeComparisonBasis('kilos')}>Kilos por caja</button>
            <button type="button" className={comparisonBasis === 'cantidad' ? 'selected' : ''} aria-pressed={comparisonBasis === 'cantidad'} onClick={() => changeComparisonBasis('cantidad')}>Cantidad por caja</button>
          </div>
          <div className="compare-inputs">{optionDetails.map((option, index) => {
            const row = comparisonRows.get(option.id)
            return <div className="compare-option" key={`${comparisonBasis}-${option.id}`}>
              <div className="compare-option-head"><h3>Opción {optionLabel(index)}</h3>{options.length > 2 && <button type="button" className="remove-option" aria-label={`Eliminar opción ${optionLabel(index)}`} onClick={() => removeOption(option.id)}><Trash2 size={17} /> Eliminar</button>}</div>
               <div className="catalog-autocomplete" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchingOptionId(null) }}>
                 <Field label={`Nombre del producto (opción ${optionLabel(index)})`} type="text" value={options[index].name} maxLength={120} autoComplete="off" role="combobox" aria-expanded={searchingOptionId === option.id && normalizeCatalogText(option.name).length >= 2} aria-autocomplete="list" onFocus={() => setSearchingOptionId(option.id)} onKeyDown={event => { if (event.key === 'Escape') setSearchingOptionId(null) }} onChange={event => { updateOption(option.id, 'name', event.target.value); setSearchingOptionId(option.id) }} />
                 {searchingOptionId === option.id && normalizeCatalogText(option.name).length >= 2 && <div className="catalog-suggestions" role="listbox" aria-label="Productos encontrados">{catalogProducts.filter(item => normalizeCatalogText(item.name).includes(normalizeCatalogText(option.name))).slice(0, 6).map(product => <button type="button" role="option" aria-selected={option.catalogId === product.id} key={product.id} onClick={() => selectCatalogProduct(option.id, product)}><strong>{product.name}</strong><small>Total con IVA {formatMoney(product.priceGross)} · Neto {formatMoney(netFromTotal(product.priceGross, settings.taxRateBps).net)}</small></button>)}{!catalogProducts.some(item => normalizeCatalogText(item.name).includes(normalizeCatalogText(option.name))) && <p>Sin coincidencias. Puedes ingresar el producto y precio manualmente.</p>}</div>}
               </div>
               <NumberField label={`Total neto de opción ${optionLabel(index)} ($)`} value={option.netTotal} onChange={value => updateOption(option.id, 'netTotal', value)} max={100_000_000_000} />
               {option.catalogId && <p className="catalog-linked-price">Precio cargado desde Productos. Puedes cambiarlo manualmente aquí.</p>}
              {comparisonBasis === 'kilos' && <div className="segmented pack-mode" aria-label={`Forma de ingresar los kilos de opción ${optionLabel(index)}`}><button type="button" className={option.sizeMode === 'manual' ? 'selected' : ''} aria-pressed={option.sizeMode === 'manual'} onClick={() => updateOption(option.id, 'sizeMode', 'manual')}>Kilos directos</button><button type="button" className={option.sizeMode === 'pack' ? 'selected' : ''} aria-pressed={option.sizeMode === 'pack'} onClick={() => updateOption(option.id, 'sizeMode', 'pack')}>Unidades × gramos</button></div>}
               {comparisonBasis === 'kilos' && option.sizeMode === 'pack' ? <><NumberField label={`Unidades por caja de opción ${optionLabel(index)}`} value={option.packUnits} onChange={value => updateOption(option.id, 'packUnits', value)} max={1_000_000_000} /><NumberField label={`Gramos por unidad de opción ${optionLabel(index)}`} value={option.gramsPerUnit} onChange={value => updateOption(option.id, 'gramsPerUnit', value)} max={1_000_000_000} />{option.validSize !== null && <div className="inline-calculation"><span>Kilos por caja</span><strong>{option.validSize.toLocaleString('es-CL', { maximumFractionDigits: 3 })} kg</strong></div>}</> : <NumberField label={`${comparisonBasis === 'kilos' ? 'Kilos' : 'Cantidad'} por caja de opción ${optionLabel(index)}`} value={option.size} onChange={value => updateOption(option.id, 'size', value)} decimals={3} max={1_000_000_000} />}
               {(option.invalidNet || option.invalidSize) && <p className="form-error" role="status">{option.invalidNet ? 'El total neto supera el límite admitido. ' : ''}{option.invalidSize ? 'Revisa el peso o la cantidad de la caja.' : ''}</p>}
              {option.grossTotal !== null && <div className="compare-live"><div><span>Total con IVA</span><strong><Money value={option.grossTotal} /></strong></div>{row && <><div><span>{comparisonBasis === 'kilos' ? 'Neto por kilo' : 'Neto por unidad de medida'}</span><strong><Money value={row.netPerUnit} /></strong></div><div><span>{comparisonBasis === 'kilos' ? 'Total por kilo' : 'Total por unidad de medida'}</span><strong><Money value={row.grossPerUnit} /></strong></div></>}</div>}
            </div>
          })}</div>
          <div className="compare-actions"><button type="button" className="secondary-button add-option" onClick={addOption}><Plus size={18} /> Agregar otra opción</button><button type="button" className="secondary-button clear-comparison" onClick={clearComparison}><Trash2 size={18} /> Limpiar datos</button></div>
          <p className="helper">{comparisonBasis === 'kilos' ? 'Compara el precio por kilo de cada caja. Los kilos aceptan hasta tres decimales.' : 'La cantidad acepta hasta tres decimales, por ejemplo 12,5 kg. Usa la misma unidad de medida en todas las opciones para comparar su precio.'}</p>
        </>}
        {mode === 'cantidad' && quantityOverflow && <p className="form-error" role="alert">El subtotal supera el máximo de $100.000.000.000. Reduce el precio o la cantidad.</p>}
        {mode !== 'comparar' && <div className="calculator-actions"><button type="button" className="secondary-button clear-comparison" onClick={clearCalculator}><Trash2 size={18} /> Limpiar datos</button></div>}
      </section>
      <section className="panel result-panel" aria-live="polite">
        {copyError && <p className="form-error" role="alert">{copyError}</p>}
        <div className="panel-title"><span className="eyebrow">RESULTADO INMEDIATO</span><h2>Resumen</h2></div>
        {mode === 'iva' && (iva ? <Result rows={reverse ? [['Total con IVA', iva.total], [`IVA ${bpsPercent(settings.taxRateBps)}`, iva.tax]] : [['Neto', iva.net], [`IVA ${bpsPercent(settings.taxRateBps)}`, iva.tax]]} total={reverse ? iva.net : iva.total} totalLabel={reverse ? 'TOTAL NETO' : 'TOTAL CON IVA'} copied={copied} onCopy={() => copy(ivaDetails)} shareDetails={ivaDetails} /> : <EmptyResult message="Ingresa un precio para calcular el IVA." />)}
        {mode === 'descuento' && (amountValue !== null && saving !== null ? <Result rows={[["Precio original", amountValue], [`Descuento ${discountValue}%`, -saving]]} total={amountValue - saving} copied={copied} onCopy={() => copy(discountDetails)} shareDetails={discountDetails} /> : <EmptyResult message="Ingresa un precio para calcular el descuento." />)}
        {mode === 'margen' && (marginResults.length > 0 ? <div className="margin-results">{marginResults.map(entry => {
          const { index } = entry
          const { percentLabel, rows, total, totalLabel, details } = marginDetailsFor(entry, marginBasis)
          return <div className="margin-result" key={`${marginBasis}-${index}`}><h3>Margen {index + 1} ({percentLabel})</h3><Result rows={rows} total={total} totalLabel={totalLabel} copied={copiedMarginIndex === index} onCopy={() => copyMargin(index, details)} shareDetails={details} /></div>
        })}{marginResults.length > 1 && <div className="all-margin-actions"><button type="button" className="secondary-button copy-all-margins" onClick={() => copy(allMarginDetails)}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copiados' : 'Copiar todos los resultados'}</button><ShareButton text={allMarginDetails} label="Compartir todos" /></div>}</div> : <EmptyResult message="Ingresa el costo y al menos un porcentaje de margen." />)}
        {mode === 'cantidad' && (line && quantityValue !== null ? <Result rows={[["Subtotal", line.subtotal], ["Descuento", -line.discount], ["Neto", line.net], ["IVA", line.tax]]} total={line.total} copied={copied} onCopy={() => copy(quantityDetails)} shareDetails={quantityDetails} /> : <EmptyResult message="Ingresa un precio unitario y una cantidad mayor que cero." />)}
        {mode === 'comparar' && <ComparisonSummary comparison={comparison} options={options} basis={comparisonBasis} taxRateBps={settings.taxRateBps} copied={copied} copiedOptionId={copiedOptionId} onCopy={() => copy(comparisonDetails)} onCopyOption={copyOption} />}
      </section>
    </div>
    <div className="page-end-actions"><button type="button" className="secondary-button clear-comparison" onClick={mode === 'comparar' ? clearComparison : clearCalculator}><Trash2 size={18} aria-hidden="true" /> Limpiar datos</button></div>
  </div>
}

function Result({ rows, total, totalLabel = 'TOTAL', onCopy, copied, shareDetails }: { rows: [string, number | string][]; total: number; totalLabel?: string; onCopy: () => void; copied: boolean; shareDetails: string }) {
  return <><div className="result-rows">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{typeof value === 'number' ? <Money value={value} /> : value}</strong></div>)}</div><div className="total-box"><span>{totalLabel}</span><strong><Money value={total} /></strong></div><div className="result-actions"><button type="button" className="secondary-button" onClick={onCopy}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copiado' : 'Copiar resultado'}</button><ShareButton text={shareDetails} label="Compartir resultado"/></div></>
}

function ComparisonSummary({ comparison, options, basis, taxRateBps, copied, copiedOptionId, onCopy, onCopyOption }: {
  comparison: ReturnType<typeof compareProductsByUnit>
  options: CompareOption[]
  basis: ComparisonBasis
  taxRateBps: number
  copied: boolean
  copiedOptionId: number | null
  onCopy: () => void
  onCopyOption: (row: ProductRow) => void
}) {
  const unit = basis === 'kilos' ? 'kilo' : 'unidad de medida'
  if (comparison.rows.length === 0) return <EmptyResult message={`Ingresa el total neto y ${basis === 'kilos' ? 'los kilos' : 'la cantidad'} de al menos una caja para ver el precio por ${unit}.`} />
  const names = new Map(comparison.rows.map(row => [row.id, row.name]))
  return <>
    <div className="comparison-results">{comparison.rows.map(row => <div className={`product-result ${comparison.winners.includes(row.id) ? 'winner' : ''}`} key={row.id}>
      <span>OPCIÓN {optionLabel(options.findIndex(option => option.id === row.id))}</span><h3>{row.name}</h3>
      <div><small>Total neto</small><strong><Money value={row.netTotal} /></strong></div>
      <div><small>IVA {bpsPercent(taxRateBps)}</small><strong><Money value={row.taxTotal} /></strong></div>
      <div><small>Total con IVA</small><strong><Money value={row.grossTotal} /></strong></div>
      <div><small>{basis === 'kilos' ? 'Kilos por caja' : 'Cantidad por caja'}</small><strong>{row.size.toLocaleString('es-CL', { maximumFractionDigits: 3 })}{basis === 'kilos' ? ' kg' : ''}</strong></div>
      <div><small>Neto por {unit}</small><strong><Money value={row.netPerUnit} /></strong></div>
      <div className="per-kilo-total"><small>Total por {unit}</small><strong><Money value={row.grossPerUnit} /></strong></div>
      <div className="result-actions"><button type="button" className="secondary-button product-copy" aria-label={`Copiar detalles de ${row.name}`} onClick={() => onCopyOption(row)}>{copiedOptionId === row.id ? <Check size={17} /> : <Copy size={17} />} {copiedOptionId === row.id ? 'Copiado' : 'Copiar detalles'}</button><ShareButton text={productDetails(row, taxRateBps, basis)} label="Compartir detalles"/></div>
    </div>)}</div>
    {comparison.rows.length >= 2 ? <><div className="total-box comparison-total"><span>{comparison.winners.length === 1 ? `MENOR TOTAL POR ${unit.toLocaleUpperCase('es-CL')}: ${names.get(comparison.winners[0])}` : `EMPATE EN TOTAL POR ${unit.toLocaleUpperCase('es-CL')}`}</span><strong><Money value={Math.min(...comparison.rows.map(row => row.grossPerUnit))} /></strong></div><p className="helper">{comparison.hasDifference ? comparison.savingsPerUnit > 0 ? `Ahorras ${formatMoney(comparison.savingsPerUnit)} por ${unit} frente a la opción más cara (${comparison.savingsPercent.toLocaleString('es-CL')}%).` : `La diferencia real es menor a $1 por ${unit}; los valores mostrados se redondean al peso.` : `Las opciones ingresadas cuestan lo mismo por ${unit}.`}</p></> : <p className="helper">Completa otra opción para comparar el precio total por {unit}.</p>}
    {comparison.rows.length < options.length && <p className="helper">Las opciones sin total neto o {basis === 'kilos' ? 'kilos' : 'cantidad'} válidos aún no se incluyen.</p>}
    <div className="result-actions"><button type="button" className="secondary-button" onClick={onCopy}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copiado' : 'Copiar comparación'}</button><ShareButton text={comparison.rows.map(row => productDetails(row, taxRateBps, basis)).join('\n\n')} label="Compartir comparación"/></div>
  </>
}
