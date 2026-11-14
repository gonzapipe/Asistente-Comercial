/** Todos los montos son pesos CLP enteros; las tasas son puntos base. */
export const roundDiv = (numerator: number, denominator: number): number => Math.round(numerator / denominator)
/** Evita perder pesos por redondeos binarios al multiplicar montos grandes por tasas enteras. */
function roundProduct(a: number, b: number, denominator: number): number {
  if (![a, b, denominator].every(Number.isSafeInteger) || denominator <= 0 || a < 0 || b < 0) throw new RangeError('Monto o porcentaje fuera del rango permitido')
  const divisor = BigInt(denominator)
  return Number((BigInt(a) * BigInt(b) * 2n + divisor) / (2n * divisor))
}
export const clampBps = (bps: number): number => Math.max(0, Math.min(10000, Math.round(bps)))
export const money = (value: number): number => Math.max(0, Math.round(Number.isFinite(value) ? value : 0))
export const formatMoney = (value: number, currency = 'CLP'): string => new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
export const taxFromNet = (net: number, rateBps = 1900): number => roundProduct(money(net), rateBps, 10000)
export const totalFromNet = (net: number, rateBps = 1900): number => money(net) + taxFromNet(net, rateBps)
export function netFromTotal(total: number, rateBps = 1900) {
  const cleanTotal = money(total)
  const net = roundProduct(cleanTotal, 10000, 10000 + rateBps)
  return { net, tax: cleanTotal - net, total: cleanTotal }
}
export const discountAmount = (subtotal: number, discountBps: number): number => roundProduct(money(subtotal), clampBps(discountBps), 10000)
export function calculateLine(unitPriceNet: number, quantity: number, discountBps = 0, taxRateBps = 1900) {
  const cleanQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1
  const subtotal = money(unitPriceNet) * cleanQuantity
  const discount = discountAmount(subtotal, discountBps)
  const net = subtotal - discount
  const tax = taxFromNet(net, taxRateBps)
  return { subtotal, discount, net, tax, total: net + tax }
}
export function unitNetAfterDiscount(lineNet: number, quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new RangeError('La cantidad debe ser mayor que cero')
  return roundDiv(money(lineNet), quantity)
}
/** Suma el porcentaje al costo ingresado; neto y total se redondean por separado al peso. */
export function priceWithMargin(cost: number, marginBps: number, basis: 'net' | 'total', taxRateBps = 1900) {
  if (!Number.isFinite(marginBps) || marginBps < 0) throw new RangeError('El margen no puede ser negativo')
  const cleanCost = money(cost)
  const increase = roundProduct(cleanCost, Math.round(marginBps), 10000)
  if (basis === 'net') {
    const costNet = cleanCost
    const costTax = taxFromNet(costNet, taxRateBps)
    const saleNet = costNet + increase
    const saleTax = taxFromNet(saleNet, taxRateBps)
    return { costNet, costTax, costTotal: costNet + costTax, increase, saleNet, saleTax, saleTotal: saleNet + saleTax }
  }
  const costTotal = cleanCost
  const costBreakdown = netFromTotal(costTotal, taxRateBps)
  const saleTotal = costTotal + increase
  const saleBreakdown = netFromTotal(saleTotal, taxRateBps)
  return { costNet: costBreakdown.net, costTax: costBreakdown.tax, costTotal, increase, saleNet: saleBreakdown.net, saleTax: saleBreakdown.tax, saleTotal }
}
export const percentBps = (value: number): number => Math.round((Number.isFinite(value) ? value : 0) * 100)
export const bpsPercent = (value: number): string => (value / 100).toLocaleString('es-CL', { maximumFractionDigits: 2 }) + '%'

export function productPricePerKilo(netTotal: number, kilos: number, taxRateBps = 1900) {
  if (!Number.isFinite(kilos) || kilos <= 0) throw new RangeError('Los kilos deben ser mayores que cero')
  const cleanNet = money(netTotal)
  const taxTotal = taxFromNet(cleanNet, taxRateBps)
  const grossTotal = cleanNet + taxTotal
  return { netTotal: cleanNet, taxTotal, grossTotal, kilos, netPerKilo: roundDiv(cleanNet, kilos), grossPerKilo: roundDiv(grossTotal, kilos) }
}
export function compareProducts(options: { id: number; name: string; netTotal: number; kilos: number }[], taxRateBps = 1900) {
  const rows = options.map(option => ({ id: option.id, name: option.name, ...productPricePerKilo(option.netTotal, option.kilos, taxRateBps) }))
  if (rows.length < 2) return { rows, winners: [] as number[], savingsPerKilo: 0, savingsPercent: 0 }
  const lowest = Math.min(...rows.map(row => row.grossPerKilo))
  const highest = Math.max(...rows.map(row => row.grossPerKilo))
  const savingsPerKilo = highest - lowest
  return { rows, winners: rows.filter(row => row.grossPerKilo === lowest).map(row => row.id), savingsPerKilo, savingsPercent: highest > 0 ? Math.round(savingsPerKilo / highest * 10000) / 100 : 0 }
}

export function compareProductsByUnit(options: { id: number; name: string; netTotal: number; size: number; grossTotal?: number }[], basis: 'kilos' | 'cantidad', taxRateBps = 1900) {
  const rows = options.map(option => {
    if (!Number.isFinite(option.size) || option.size <= 0 || !Number.isSafeInteger(Math.round(option.size * 1000)) || Math.abs(option.size * 1000 - Math.round(option.size * 1000)) > 0.000001) throw new RangeError(`${basis === 'kilos' ? 'Los kilos' : 'La cantidad'} por caja deben ser mayores que cero y tener hasta tres decimales`)
    const netTotal = money(option.netTotal)
    const grossTotal = option.grossTotal === undefined ? totalFromNet(netTotal, taxRateBps) : money(option.grossTotal)
    const taxTotal = grossTotal - netTotal
    return { id: option.id, name: option.name, size: option.size, netTotal, taxTotal, grossTotal, netPerUnit: roundDiv(netTotal, option.size), grossPerUnit: roundDiv(grossTotal, option.size), exactGrossPerUnit: grossTotal / option.size }
  })
  if (rows.length < 2) return { rows, winners: [] as number[], savingsPerUnit: 0, savingsPercent: 0, hasDifference: false }
  const lowest = Math.min(...rows.map(row => row.exactGrossPerUnit))
  const highest = Math.max(...rows.map(row => row.exactGrossPerUnit))
  const savingsPerUnit = Math.round(highest - lowest)
  return { rows, winners: rows.filter(row => row.exactGrossPerUnit === lowest).map(row => row.id), savingsPerUnit, savingsPercent: highest > 0 ? Math.round((highest - lowest) / highest * 10000) / 100 : 0, hasDifference: highest > lowest }
}

/** Convierte un envase de unidades enteras y gramos enteros a kilos. */
export function kilosFromPack(units: number, gramsPerUnit: number): number {
  if (!Number.isSafeInteger(units) || units <= 0 || !Number.isSafeInteger(gramsPerUnit) || gramsPerUnit <= 0) throw new RangeError('Ingresa unidades y gramos enteros mayores que cero')
  const grams = units * gramsPerUnit
  if (!Number.isSafeInteger(grams)) throw new RangeError('El peso de la caja supera el límite admitido')
  return grams / 1000
}

/** Calcula la diferencia respecto al costo ingresado usando el precio final con IVA. */
export function priceFromTarget(cost: number, targetTotal: number, basis: 'net' | 'total', taxRateBps = 1900) {
  const cleanCost = money(cost)
  const sale = netFromTotal(targetTotal, taxRateBps)
  const original = basis === 'net'
    ? { net: cleanCost, tax: taxFromNet(cleanCost, taxRateBps), total: totalFromNet(cleanCost, taxRateBps) }
    : netFromTotal(cleanCost, taxRateBps)
  const difference = basis === 'net' ? sale.net - original.net : sale.total - original.total
  const base = basis === 'net' ? original.net : original.total
  return { original, sale, difference, percentBps: base === 0 ? null : Math.round(difference * 10000 / base), netDifference: sale.net - original.net }
}
