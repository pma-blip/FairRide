import type { TripState } from './types';

/** Current Malaysia RON95 default price (RM/L). */
export const DEFAULT_FUEL_PRICE = 2.05;
export const DEFAULT_MAINTENANCE_RATE = 0.1;

let idCounter = 0;

/** Reasonably unique id generator (crypto.randomUUID when available). */
export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function createEmptyTrip(): TripState {
  return {
    vehicle: {
      fuelEfficiency: 10,
      efficiencyUnit: 'L_PER_100KM',
      fuelPrice: DEFAULT_FUEL_PRICE,
      maintenanceRate: DEFAULT_MAINTENANCE_RATE,
    },
    driverPolicy: 'SHARED',
    passengers: [],
    segments: [],
  };
}

/** A fully-populated example trip for the "Load Sample" action. */
export function createSampleTrip(): TripState {
  const ahmad = { id: createId('p'), name: 'Ahmad' };
  const muthu = { id: createId('p'), name: 'Muthu' };
  const siti = { id: createId('p'), name: 'Siti' };

  return {
    vehicle: {
      fuelEfficiency: 7.5,
      efficiencyUnit: 'L_PER_100KM',
      fuelPrice: DEFAULT_FUEL_PRICE,
      maintenanceRate: DEFAULT_MAINTENANCE_RATE,
    },
    driverPolicy: 'SHARED',
    passengers: [ahmad, muthu, siti],
    segments: [
      {
        id: createId('s'),
        label: 'Trip 1: House to Mall',
        distanceKm: 15,
        tollAmountRm: 3.5,
        passengerIdsPresent: [ahmad.id, muthu.id, siti.id],
      },
      {
        id: createId('s'),
        label: 'Trip 2: Mall to Restaurant',
        distanceKm: 12,
        tollAmountRm: 0,
        passengerIdsPresent: [ahmad.id, muthu.id],
      },
      {
        id: createId('s'),
        label: 'Trip 3: Restaurant to Home',
        distanceKm: 18,
        tollAmountRm: 2.5,
        passengerIdsPresent: [ahmad.id],
      },
    ],
  };
}
