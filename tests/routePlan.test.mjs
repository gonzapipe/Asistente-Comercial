import test from 'node:test'
import assert from 'node:assert/strict'
import { isRoutePlan } from '../src/utils/routePlan.ts'

const visit = (id, lat, lon) => ({ id, name: id, address: `${id}, Santiago`, lat, lon, visited: false })

test('valida rutas para respaldo sin aceptar coordenadas o paradas inválidas', () => {
  const route = { id: 'actual', date: '2026-10-11', stops: [visit('Uno', -33.45, -70.66)], createdAt: '2026-10-11T12:00:00.000Z', updatedAt: '2026-10-11T12:00:00.000Z' }
  assert.equal(isRoutePlan(route), true)
  assert.equal(isRoutePlan({ ...route, stops: [{ ...route.stops[0], lat: 200 }] }), false)
  assert.equal(isRoutePlan({ ...route, stops: [{ ...route.stops[0], visited: 'sí' }] }), false)
})
