import test from 'node:test'
import assert from 'node:assert/strict'
import { taxFromNet, totalFromNet, netFromTotal, discountAmount, priceWithMargin, calculateLine, compareProductsByUnit, priceFromTarget } from '../src/utils/money.ts'
import { emptyTargetDraft, loadTargetDraft, saveTargetDraft } from '../src/utils/targetDraft.ts'
import { checkBackupSize, maxBackupBytes } from '../src/utils/backupLimits.ts'
import { initialCalculatorState, pressCalculatorKey, calculatorLiveResult, loadBasicCalculatorState } from '../src/utils/basicCalculator.ts'

const roundedProduct = (a,b,d=10000) => Number((BigInt(a)*BigInt(b)*2n+BigInt(d))/(2n*BigInt(d)))

test('auditoría de IVA: tasas 0, fraccionarias, 19 y 100%; neto + impuesto siempre coincide con total',()=>{
  for(const rate of [0,1,1250,1900,1975,10000])for(const amount of [0,1,3,99,1000,17563,99999999999,100000000000]){
    assert.equal(taxFromNet(amount,rate),roundedProduct(amount,rate))
    assert.equal(totalFromNet(amount,rate),amount+roundedProduct(amount,rate))
    const inverse=netFromTotal(amount,rate)
    assert.equal(inverse.net,roundedProduct(amount,10000,10000+rate))
    assert.equal(inverse.net+inverse.tax,amount)
    assert.ok(inverse.tax>=0)
  }
})

test('auditoría de descuentos y cantidades: extremos y redondeos por línea',()=>{
  for(const rate of [0,1,1250,5000,9999,10000])for(const amount of [0,1,3,999,100000000]){
    const saving=discountAmount(amount,rate)
    assert.equal(saving,roundedProduct(amount,rate))
    assert.ok(saving>=0 && saving<=amount)
    const line=calculateLine(amount,7,rate)
    assert.equal(line.net,line.subtotal-line.discount)
    assert.equal(line.total,line.net+line.tax)
  }
})

test('auditoría de márgenes en ambos modos con 0%, decimales y máximo admitido',()=>{
  for(const basis of ['net','total'])for(const rate of [0,1,1250,5000,10000,999999])for(const cost of [0,1,1190,99999999999]){
    const result=priceWithMargin(cost,rate,basis)
    assert.equal(result.increase,roundedProduct(cost,rate))
    assert.equal(basis==='net'?result.saleNet:result.saleTotal,cost+result.increase)
    assert.equal(result.saleNet+result.saleTax,result.saleTotal)
    assert.equal(result.costNet+result.costTax,result.costTotal)
  }
})

test('auditoría de comparativos: empates exactos, cero y cantidades pequeñas',()=>{
  for(const basis of ['kilos','cantidad']){
    const tie=compareProductsByUnit([{id:1,name:'A',netTotal:1000,size:2},{id:2,name:'B',netTotal:2000,size:4}],basis,0)
    assert.deepEqual(tie.winners,[1,2]);assert.equal(tie.hasDifference,false)
    const result=compareProductsByUnit([{id:1,name:'A',netTotal:0,size:0.001},{id:2,name:'B',netTotal:1,size:0.001}],basis)
    assert.deepEqual(result.winners,[1]);assert.equal(result.savingsPercent,100)
    assert.equal(result.rows[1].grossPerUnit,1000)
    for(const size of [0,-1,NaN,Infinity,0.0001])assert.throws(()=>compareProductsByUnit([{id:1,name:'A',netTotal:1,size}],basis))
  }
})

test('auditoría de precio objetivo: costo cero, pérdida y distintos IVA',()=>{
  for(const basis of ['net','total'])for(const rate of [0,1900,10000])for(const target of [0,1,952,1785,100000000000]){
    const result=priceFromTarget(1000,target,basis,rate)
    assert.equal(result.sale.net+result.sale.tax,target)
    assert.equal(result.difference,basis==='net'?result.sale.net-1000:target-1000)
    assert.equal(priceFromTarget(0,target,basis,rate).percentBps,null)
  }
})

test('precio objetivo conserva valores y modo; un borrador dañado se recupera',()=>{
  const saved=new Map();const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)}
  const draft={basis:'total',cost:'1190',target:'1785'}
  saveTargetDraft(draft,storage);assert.deepEqual(loadTargetDraft(storage),draft)
  assert.deepEqual(loadTargetDraft({getItem:()=>'{'}),emptyTargetDraft())
  assert.deepEqual(loadTargetDraft({getItem:()=>JSON.stringify({basis:'other',cost:'-1',target:'Infinity'})}),emptyTargetDraft())
})

test('calculadora: matriz de operadores, signos y divisores decimales, conservada tras guardar',()=>{
  const keys=value=>String(value).replace('.',',').split('').map(key=>key==='-'?'±':key)
  for(const a of [-12.5,-1,0,1,12.5,1000])for(const b of [-12.5,-0.5,0.1,0.5,1,12.5])for(const operator of ['+','−','×','÷']){
    const expected=operator==='+'?a+b:operator==='−'?a-b:operator==='×'?a*b:a/b
    const state=[...keys(a),operator,...keys(b),'='].reduce(pressCalculatorKey,initialCalculatorState)
    assert.ok(Math.abs(Number(calculatorLiveResult(state))-expected)<1e-8)
    assert.equal(calculatorLiveResult(loadBasicCalculatorState({getItem:()=>JSON.stringify(state)})),calculatorLiveResult(state))
  }
})

test('respaldo: el tamaño se mide en bytes UTF-8 y se aplica igual al exportar e importar',()=>{
  assert.doesNotThrow(()=>checkBackupSize('á'.repeat(1000)))
  assert.throws(()=>checkBackupSize('á'.repeat(maxBackupBytes/2+1)),/50 MB/)
})
