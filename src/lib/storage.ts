import type { DriverPolicy, EfficiencyUnit, TripState } from './types';
import { createEmptyTrip } from './tripState';

export const STORAGE_KEY = 'carpool-cost-calculator:v1';

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Defensively coerce an unknown value (e.g. from localStorage) into a valid
 * TripState, falling back to sensible defaults for any malformed field.
 */
export function sanitizeTrip(raw: unknown): TripState {
  const base = createEmptyTrip();
  if (!raw || typeof raw !== 'object') return base;

  const obj = raw as Record<string, unknown>;
  const v = (obj.vehicle ?? {}) as Record<string, unknown>;

  const efficiencyUnit: EfficiencyUnit =
    v.efficiencyUnit === 'KM_PER_L' ? 'KM_PER_L' : 'L_PER_100KM';

  const driverPolicy: DriverPolicy =
    obj.driverPolicy === 'REIMBURSED' ? 'REIMBURSED' : 'SHARED';

  const passengers = Array.isArray(obj.passengers)
    ? obj.passengers
        .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
        .map((p) => ({
          id: toString(p.id) || `${Date.now()}-${Math.random()}`,
          name: toString(p.name, 'Passenger'),
        }))
    : [];

  const validIds = new Set(passengers.map((p) => p.id));

  const segments = Array.isArray(obj.segments)
    ? obj.segments
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          id: toString(s.id) || `${Date.now()}-${Math.random()}`,
          label: toString(s.label, 'Leg'),
          distanceKm: toNumber(s.distanceKm),
          tollAmountRm: toNumber(s.tollAmountRm),
          passengerIdsPresent: Array.isArray(s.passengerIdsPresent)
            ? (s.passengerIdsPresent as unknown[])
                .map((id) => toString(id))
                .filter((id) => validIds.has(id))
            : [],
        }))
    : [];

  return {
    vehicle: {
      fuelEfficiency: toNumber(v.fuelEfficiency, base.vehicle.fuelEfficiency),
      efficiencyUnit,
      fuelPrice: toNumber(v.fuelPrice, base.vehicle.fuelPrice),
      maintenanceRate: toNumber(v.maintenanceRate, base.vehicle.maintenanceRate),
    },
    driverPolicy,
    passengers,
    segments,
  };
}

export function loadTrip(): TripState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeTrip(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveTrip(trip: TripState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    return true;
  } catch {
    return false;
  }
}

export function clearTrip(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
