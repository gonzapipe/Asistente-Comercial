import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareProductsByUnit, netFromTotal } from '../src/utils/money.ts'
import { catalogKey, parsePriceSheet, planPriceImport } from '../src/utils/priceCatalog.ts'

test('catálogo inicial contiene 199 nombres únicos y precios CLP válidos', () => {
  const items = JSON.parse(readFileSync(new URL('../src/data/initialProducts.json', import.meta.url), 'utf8'))
  assert.equal(items.length, 199)
  assert.equal(new Set(items.map(item => catalogKey(item.name))).size, 199)
  assert.ok(items.every(item => item.name && Number.isSafeInteger(item.priceGross) && item.priceGross > 0))
  assert.deepEqual(items.find(item => item.name === 'ACEITE MEGA-FRITO 10 LITROS'), { name: 'ACEITE MEGA-FRITO 10 LITROS', priceGross: 28621 })
})

test('importación solo usa Producto y Precio nuevo y rechaza duplicados o precios inválidos', () => {
  const rows = [['DIMER'], ['Producto', 'Precio actual', 'Precio nuevo'], ['Aceites', null, null], ['Aceite A', 1000, 1190], ['Aceite B', 2000, '$2.380']]
  assert.deepEqual(parsePriceSheet(rows), [{ name: 'Aceite A', priceGross: 1190 }, { name: 'Aceite B', priceGross: 2380 }])
  assert.throws(() => parsePriceSheet([...rows, ['ACEITE A', 1, 1200]]), /repetido/)
  assert.throws(() => parsePriceSheet([...rows, ['Aceite C', 1, 'gratis']]), /inválido/)
})

test('vista previa distingue precios protegidos y productos ausentes', () => {
  const now = new Date().toISOString()
  const products = [
    { id: 'a', name: 'Aceite A', priceGross: 1190, categoryId: 'aceites', manualPrice: false, updatedAt: now },
    { id: 'b', name: 'Aceite B', priceGross: 2380, categoryId: 'aceites', manualPrice: true, updatedAt: now },
    { id: 'c', name: 'Aceite C', priceGross: 500, categoryId: 'aceites', manualPrice: false, updatedAt: now },
  ]
  const plan = planPriceImport([{ name: 'Aceite A', priceGross: 1300 }, { name: 'Aceite B', priceGross: 2500 }, { name: 'Aceite D', priceGross: 1000 }], products)
  assert.deepEqual([plan.newCount, plan.changedCount, plan.protectedCount, plan.missingCount], [1, 1, 1, 1])
})

test('comparativos conserva el total exacto del Excel aun cuando el redondeo neto difiere en un peso', () => {
  const gross = 77303
  const net = netFromTotal(gross).net
  const result = compareProductsByUnit([{ id: 1, name: 'Chuleta', netTotal: net, grossTotal: gross, size: 17 }], 'kilos')
  assert.equal(result.rows[0].grossTotal, gross)
  assert.equal(result.rows[0].taxTotal, gross - net)
})
