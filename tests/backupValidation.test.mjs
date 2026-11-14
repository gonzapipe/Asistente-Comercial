import test from 'node:test'
import assert from 'node:assert/strict'
import { validateBackup } from '../src/utils/backupValidation.ts'

const backup = () => ({format:'venta-facil-precios',version:4,exportedAt:'2026-10-23T12:00:00Z',settings:{taxRateBps:1900,theme:'dark'},notes:[],agenda:[],history:[],portfolio:[],catalog:[],orders:[],documents:[],visits:[],drafts:{iva:'{}',descuento:'{}',margen:'{}',cantidad:'{}',comparison:'{}',target:'{}',basic:'{}',note:'{}',agenda:'{}'}})
test('respaldo actual y respaldo antiguo con comparativos en lista son compatibles',()=>{
  assert.equal(validateBackup(backup()).version,4)
  const old = backup();old.version=1;old.drafts.comparison='[]';delete old.drafts.basic;delete old.drafts.note;delete old.drafts.agenda
  assert.equal(validateBackup(old).version,1)
})
test('los ajustes importados no pueden cambiar el identificador interno',()=>{
  const data=backup();data.settings.id='otro';
  assert.deepEqual(validateBackup(data).settings,{taxRateBps:1900,theme:'dark'})
})
test('rechaza versiones falsas, datos opcionales inválidos y JSON de borradores roto',()=>{
  const version = backup();version.version='4';assert.throws(()=>validateBackup(version))
  const optional = backup();optional.version=1;optional.portfolio=[{id:'bad'}];assert.throws(()=>validateBackup(optional))
  const malformed = backup();malformed.drafts.basic='{';assert.throws(()=>validateBackup(malformed))
  const duplicates=backup();const note={id:'one',title:'a',content:'b',createdAt:'2026-10-23',updatedAt:'2026-10-23'};duplicates.notes=[note,note];assert.throws(()=>validateBackup(duplicates))
})
test('respaldo v6 incluye recordatorios y rechaza identificadores de aviso repetidos',()=>{
  const data=backup();data.version=6;data.priceCatalog=[];data.priceCatalogCategories=[]
  const order={id:'pedido-1',customerName:'Cliente',productName:'Papas',quantity:'12',entryDate:'2026-11-16',deliveryDate:'2026-11-18',notificationBase:100000,alertsStopped:false,status:'pending',createdAt:'2026-11-13T10:00:00Z',updatedAt:'2026-11-13T10:00:00Z'}
  data.nextOrders=[order]
  data.drafts.nextOrder='{}'
  assert.equal(validateBackup(data).nextOrders.length,1)
  data.nextOrders=[{...order}];delete data.nextOrders[0].deliveryDate
  assert.equal(validateBackup(data).nextOrders.length,1)
  data.nextOrders=[{...order,items:[{id:'a',name:'Papas',quantity:'12'},{id:'b',name:'Aceite',quantity:'2.5'}]}]
  assert.equal(validateBackup(data).nextOrders[0].items.length,2)
  data.nextOrders[0].items[1].quantity='0'
  assert.throws(()=>validateBackup(data))
  data.nextOrders=[order,{...order,id:'pedido-2'}]
  assert.throws(()=>validateBackup(data))
})
