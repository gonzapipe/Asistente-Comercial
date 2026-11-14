import test from 'node:test'
import assert from 'node:assert/strict'
import { draftStorage, storageUnavailable } from '../src/utils/draftStorage.ts'

test('una cuota agotada conserva el último borrador y reintenta guardarlo al recuperarse', () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
  const saved=new Map();let blocked=true
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>{if(blocked)throw new Error('quota');saved.set(key,value)}}})
  try {
    draftStorage.setItem('test:first','nuevo')
    assert.equal(draftStorage.getItem('test:first'),'nuevo')
    assert.equal(storageUnavailable(),true)
    blocked=false
    draftStorage.setItem('test:second','otro')
    assert.equal(saved.get('test:first'),'nuevo')
    assert.equal(storageUnavailable(),false)
  } finally {if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage}
})
