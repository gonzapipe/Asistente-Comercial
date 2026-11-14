import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateLine, compareProducts, compareProductsByUnit, discountAmount, kilosFromPack, netFromTotal, priceFromTarget, priceWithMargin, productPricePerKilo, taxFromNet, totalFromNet, unitNetAfterDiscount } from '../src/utils/money.ts'
import { numericInput, numericValue } from '../src/utils/numericInput.ts'

test('entradas excesivas se rechazan y márgenes grandes conservan el redondeo entero', () => {
  assert.equal(numericInput('9'.repeat(400)), null)
  assert.equal(numericInput('100000000001'), null)
  const cost = 99_999_999_999, bps = 999999
  const expected = Number((BigInt(cost) * BigInt(bps) + 5000n) / 10000n)
  assert.equal(priceWithMargin(cost,bps,'net').increase, expected)
})

test('IVA directo e inverso en CLP', () => { assert.equal(taxFromNet(100000),19000); assert.equal(totalFromNet(100000),119000); assert.deepEqual(netFromTotal(119000),{net:100000,tax:19000,total:119000}) })
test('descuento y cantidad con redondeo por línea', () => { assert.equal(discountAmount(200000,1000),20000); assert.deepEqual(calculateLine(100000,10,800),{subtotal:1000000,discount:80000,net:920000,tax:174800,total:1094800}); assert.equal(taxFromNet(1),0); assert.equal(taxFromNet(3),1) })
test('precio unitario neto con descuento divide el neto final por la cantidad', () => { const line=calculateLine(1000,3,1000); assert.equal(line.net,2700); assert.equal(unitNetAfterDiscount(line.net,3),900); assert.equal(unitNetAfterDiscount(1001,3),334); assert.throws(()=>unitNetAfterDiscount(1000,0),RangeError) })
test('50% sobre costo neto de $1.000 produce neto $1.500 y total $1.785', () => { assert.deepEqual(priceWithMargin(1000,5000,'net'),{costNet:1000,costTax:190,costTotal:1190,increase:500,saleNet:1500,saleTax:285,saleTotal:1785}) })
test('50% sobre costo con IVA de $1.190 produce total $1.785 y neto $1.500', () => { assert.deepEqual(priceWithMargin(1190,5000,'total'),{costNet:1000,costTax:190,costTotal:1190,increase:595,saleNet:1500,saleTax:285,saleTotal:1785}) })
test('el aumento se calcula sobre el costo ingresado en cada modo', () => {
  const net = priceWithMargin(1000, 5000, 'net')
  assert.equal(net.increase, 500)
  assert.equal(net.saleNet, net.costNet + net.increase)
  assert.equal(net.saleTotal, totalFromNet(net.saleNet))
  const total = priceWithMargin(1190, 5000, 'total')
  assert.equal(total.increase, 595)
  assert.equal(total.costTotal, 1190)
  assert.equal(total.saleTotal, total.costTotal + total.increase)
  assert.equal(total.saleNet + total.saleTax, total.saleTotal)
  const rounded = priceWithMargin(1191, 5000, 'total')
  assert.equal(rounded.increase, 596)
  assert.equal(rounded.saleTotal, 1787)
})
test('margen sobre costo acepta 0%, 100% y redondea al peso', () => { assert.equal(priceWithMargin(1000,0,'net').saleTotal,1190); assert.equal(priceWithMargin(1000,10000,'net').saleTotal,2380); assert.equal(priceWithMargin(1191,5000,'total').saleTotal,1787); assert.throws(()=>priceWithMargin(1000,-1,'net'),RangeError) })
test('caja de papas: neto, bruto y valores por kilo del ejemplo', () => { assert.deepEqual(productPricePerKilo(17563,12.5),{netTotal:17563,taxTotal:3337,grossTotal:20900,kilos:12.5,netPerKilo:1405,grossPerKilo:1672}); assert.throws(()=>productPricePerKilo(17563,0),RangeError) })
test('comparación de productos por precio bruto por kilo', () => { const result=compareProducts([{id:1,name:'Papas A',netTotal:17563,kilos:12.5},{id:2,name:'Papas B',netTotal:19000,kilos:10},{id:3,name:'Papas C',netTotal:16000,kilos:12.5}]); assert.deepEqual(result.rows.map(row=>row.grossPerKilo),[1672,2261,1523]); assert.deepEqual(result.winners,[3]); assert.equal(result.savingsPerKilo,738) })
test('comparación por cantidad calcula precio total por unidad de medida', () => {
  const comparison = compareProductsByUnit([{ id: 1, name: 'Latas A', netTotal: 12000, size: 24 }, { id: 2, name: 'Latas B', netTotal: 10000, size: 12 }], 'cantidad')
  assert.deepEqual(comparison.rows.map(row => ({ grossTotal: row.grossTotal, netPerUnit: row.netPerUnit, grossPerUnit: row.grossPerUnit })), [{ grossTotal: 14280, netPerUnit: 500, grossPerUnit: 595 }, { grossTotal: 11900, netPerUnit: 833, grossPerUnit: 992 }])
  assert.deepEqual(comparison.winners, [1])
  assert.equal(comparison.savingsPerUnit, 397)
  const decimal = compareProductsByUnit([{ id: 1, name: 'Caja de 12,5 kg', netTotal: 17563, size: 12.5 }], 'cantidad')
  assert.equal(decimal.rows[0].size, 12.5)
  assert.equal(decimal.rows[0].netPerUnit, 1405)
  assert.equal(decimal.rows[0].grossPerUnit, 1672)
  assert.throws(() => compareProductsByUnit([{ id: 1, name: 'Inválido', netTotal: 1000, size: 1.2345 }], 'cantidad'), RangeError)
})
test('comparativos distingue precios reales aunque ambos redondeen al mismo peso', () => {
  const result = compareProductsByUnit([{ id: 1, name: 'A', netTotal: 1000, size: 3 }, { id: 2, name: 'B', netTotal: 1001, size: 3 }], 'cantidad')
  assert.deepEqual(result.rows.map(row => row.grossPerUnit), [397, 397])
  assert.deepEqual(result.winners, [1])
  assert.equal(result.hasDifference, true)
  assert.equal(result.savingsPerUnit, 0)
})
test('tres márgenes se calculan por separado sin exigir todos los porcentajes', () => {
  assert.deepEqual([10, 25, 50].map(percent => priceWithMargin(1000, percent * 100, 'net').saleNet), [1100, 1250, 1500])
  assert.deepEqual([10, 25, 50].map(percent => priceWithMargin(1190, percent * 100, 'total').saleTotal), [1309, 1488, 1785])
})
test('los campos aceptan vacío y números, rechazan letras y múltiples decimales', () => { assert.equal(numericInput(''), ''); assert.equal(numericValue(''),null); assert.equal(numericInput('123'),'123'); assert.equal(numericInput('1e2'),null); assert.equal(numericInput('-4'),null); assert.equal(numericInput('12,5',2),'12.5'); assert.equal(numericInput('12.345',2),null); assert.equal(numericInput('101',2,100),null) })
test('conversión de unidades y gramos a kilos para comparar cajas', () => { assert.equal(kilosFromPack(12, 500), 6); assert.equal(kilosFromPack(5, 2500), 12.5); assert.throws(() => kilosFromPack(0, 500), RangeError); assert.throws(() => kilosFromPack(1.5, 500), RangeError); assert.throws(() => kilosFromPack(Number.MAX_SAFE_INTEGER, 2), RangeError) })
test('precio objetivo con IVA calcula diferencia y porcentaje sobre costo neto o total', () => {
  assert.deepEqual(priceFromTarget(1000, 1785, 'net'), { original: { net: 1000, tax: 190, total: 1190 }, sale: { net: 1500, tax: 285, total: 1785 }, difference: 500, percentBps: 5000, netDifference: 500 })
  assert.deepEqual(priceFromTarget(1190, 1785, 'total'), { original: { net: 1000, tax: 190, total: 1190 }, sale: { net: 1500, tax: 285, total: 1785 }, difference: 595, percentBps: 5000, netDifference: 500 })
  assert.equal(priceFromTarget(0, 1190, 'net').percentBps, null)
  assert.equal(priceFromTarget(1000, 952, 'net').percentBps, -2000)
})
