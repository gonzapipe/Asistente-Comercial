import type { RoutePlan } from '../types/domain.ts'

export type Coordinates = { lat: number; lon: number }

export function validCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') return false
  const point = value as Coordinates
  return Number.isFinite(point.lat) && Number.isFinite(point.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180
}

/** Conserva la lectura de respaldos creados cuando existía el módulo de rutas. */
export function isRoutePlan(value: unknown): value is RoutePlan {
  if (!value || typeof value !== 'object') return false
  const route = value as RoutePlan
  return typeof route.id === 'string' && typeof route.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.date) && Number.isFinite(Date.parse(route.createdAt)) && Number.isFinite(Date.parse(route.updatedAt)) && (route.origin === undefined || validCoordinates(route.origin)) && Array.isArray(route.stops) && route.stops.every(stop => stop && typeof stop.id === 'string' && typeof stop.name === 'string' && typeof stop.address === 'string' && typeof stop.visited === 'boolean' && ((stop.lat === undefined && stop.lon === undefined) || validCoordinates(stop)))
}
