import { describe, expect, it } from 'vitest';
import {
  calculateSettlement,
  computeCostRatePerKm,
  computeLegCost,
  computeRiderCount,
} from './calculationEngine';
import type { DriverPolicy, TripState, VehicleProfile } from './types';

const vehicle: VehicleProfile = {
  fuelEfficiency: 10, // 10 L/100km
  efficiencyUnit: 'L_PER_100KM',
  fuelPrice: 2.05, // RM/L
  maintenanceRate: 0.1, // RM/km
};

// C_rate = (10 / 100 × 2.05) + 0.10 = 0.205 + 0.10 = 0.305 RM/km
const EXPECTED_RATE = 0.305;

function buildTrip(partial: Partial<TripState>): TripState {
  return {
    vehicle,
    driverPolicy: 'SHARED',
    passengers: [],
    segments: [],
    ...partial,
  };
}

describe('computeCostRatePerKm', () => {
  it('computes rate from L/100km', () => {
    expect(computeCostRatePerKm(vehicle)).toBeCloseTo(EXPECTED_RATE, 6);
  });

  it('converts km/L to the equivalent rate', () => {
    // 10 L/100km == 10 km/L
    const kmPerL: VehicleProfile = {
      ...vehicle,
      fuelEfficiency: 10,
      efficiencyUnit: 'KM_PER_L',
    };
    expect(computeCostRatePerKm(kmPerL)).toBeCloseTo(EXPECTED_RATE, 6);
  });

  it('ignores maintenance when zero', () => {
    expect(
      computeCostRatePerKm({ ...vehicle, maintenanceRate: 0 })
    ).toBeCloseTo(0.205, 6);
  });

  it('returns 0 for invalid / empty inputs', () => {
    expect(
      computeCostRatePerKm({
        fuelEfficiency: NaN,
        efficiencyUnit: 'L_PER_100KM',
        fuelPrice: -1,
        maintenanceRate: 0,
      })
    ).toBe(0);
  });
});

describe('computeLegCost', () => {
  it('adds distance cost and tolls', () => {
    // 20 km × 0.305 + 5 toll = 6.1 + 5 = 11.1
    expect(
      computeLegCost(
        { id: 'a', label: 'L', distanceKm: 20, tollAmountRm: 5, passengerIdsPresent: [] },
        EXPECTED_RATE
      )
    ).toBeCloseTo(11.1, 6);
  });
});

describe('computeRiderCount', () => {
  it('adds driver for SHARED', () => {
    expect(computeRiderCount(3, 'SHARED')).toBe(4);
  });
  it('excludes driver for REIMBURSED', () => {
    expect(computeRiderCount(3, 'REIMBURSED')).toBe(3);
  });
  it('is 0 when nobody present', () => {
    expect(computeRiderCount(0, 'SHARED')).toBe(0);
  });
});

describe('calculateSettlement – single leg equal split', () => {
  it('splits a single leg evenly between two passengers + driver (SHARED)', () => {
    const trip = buildTrip({
      driverPolicy: 'SHARED',
      passengers: [
        { id: 'p1', name: 'Ahmad' },
        { id: 'p2', name: 'Muthu' },
      ],
      segments: [
        {
          id: 's1',
          label: 'Leg 1',
          distanceKm: 20,
          tollAmountRm: 5,
          passengerIdsPresent: ['p1', 'p2'],
        },
      ],
    });

    const result = calculateSettlement(trip);
    // Leg cost = 11.1, N = 2 passengers + driver = 3, share = 3.7
    expect(result.totalCostRm).toBeCloseTo(11.1, 6);
    expect(result.totalDistanceKm).toBe(20);
    expect(result.driverShareRm).toBeCloseTo(3.7, 6);

    const ahmad = result.settlements.find((s) => s.passengerId === 'p1')!;
    expect(ahmad.totalOwedRm).toBeCloseTo(3.7, 6);
    expect(ahmad.legsRiddenCount).toBe(1);
    expect(ahmad.totalKmRidden).toBe(20);
  });

  it('REIMBURSED gives passengers the whole cost, driver pays nothing', () => {
    const trip = buildTrip({
      driverPolicy: 'REIMBURSED',
      passengers: [
        { id: 'p1', name: 'Ahmad' },
        { id: 'p2', name: 'Muthu' },
      ],
      segments: [
        {
          id: 's1',
          label: 'Leg 1',
          distanceKm: 20,
          tollAmountRm: 5,
          passengerIdsPresent: ['p1', 'p2'],
        },
      ],
    });

    const result = calculateSettlement(trip);
    // 11.1 / 2 = 5.55 each, driver share = 0
    expect(result.driverShareRm).toBe(0);
    const total = result.settlements.reduce((a, s) => a + s.totalOwedRm, 0);
    expect(total).toBeCloseTo(11.1, 6);
    expect(result.settlements[0].totalOwedRm).toBeCloseTo(5.55, 6);
  });
});

describe('calculateSettlement – multi-leg with staggered drop-offs', () => {
  it('charges each passenger only for legs they rode', () => {
    const trip = buildTrip({
      driverPolicy: 'REIMBURSED',
      passengers: [
        { id: 'p1', name: 'Ahmad' },
        { id: 'p2', name: 'Muthu' },
        { id: 'p3', name: 'Siti' },
      ],
      segments: [
        {
          id: 's1',
          label: 'Leg 1',
          distanceKm: 10,
          tollAmountRm: 0,
          passengerIdsPresent: ['p1', 'p2', 'p3'],
        },
        {
          id: 's2',
          label: 'Leg 2',
          distanceKm: 10,
          tollAmountRm: 0,
          passengerIdsPresent: ['p1', 'p2'], // Siti dropped off
        },
        {
          id: 's3',
          label: 'Leg 3',
          distanceKm: 10,
          tollAmountRm: 0,
          passengerIdsPresent: ['p1'], // only Ahmad left
        },
      ],
    });

    const result = calculateSettlement(trip);
    // Each leg cost = 10 × 0.305 = 3.05
    // Leg1 / 3 = 1.016666..., Leg2 / 2 = 1.525, Leg3 / 1 = 3.05
    const legCost = 3.05;
    const ahmad = result.settlements.find((s) => s.passengerId === 'p1')!;
    const muthu = result.settlements.find((s) => s.passengerId === 'p2')!;
    const siti = result.settlements.find((s) => s.passengerId === 'p3')!;

    expect(ahmad.totalOwedRm).toBeCloseTo(legCost / 3 + legCost / 2 + legCost, 6);
    expect(ahmad.legsRiddenCount).toBe(3);
    expect(ahmad.totalKmRidden).toBe(30);

    expect(muthu.totalOwedRm).toBeCloseTo(legCost / 3 + legCost / 2, 6);
    expect(muthu.legsRiddenCount).toBe(2);

    expect(siti.totalOwedRm).toBeCloseTo(legCost / 3, 6);
    expect(siti.legsRiddenCount).toBe(1);

    // Conservation: sum of all shares equals total cost (REIMBURSED).
    const sum = result.settlements.reduce((a, s) => a + s.totalOwedRm, 0);
    expect(sum).toBeCloseTo(result.totalCostRm, 6);
  });
});

describe('calculateSettlement – zero distance but non-zero toll', () => {
  it('divides a stationary toll among present passengers', () => {
    const trip = buildTrip({
      driverPolicy: 'REIMBURSED',
      passengers: [
        { id: 'p1', name: 'Ahmad' },
        { id: 'p2', name: 'Muthu' },
      ],
      segments: [
        {
          id: 's1',
          label: 'Toll gate',
          distanceKm: 0,
          tollAmountRm: 6,
          passengerIdsPresent: ['p1', 'p2'],
        },
      ],
    });

    const result = calculateSettlement(trip);
    expect(result.totalCostRm).toBeCloseTo(6, 6);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.settlements[0].totalOwedRm).toBeCloseTo(3, 6);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('calculateSettlement – edge cases', () => {
  it('flags a warning when a leg has cost but no passengers', () => {
    const trip = buildTrip({
      passengers: [{ id: 'p1', name: 'Ahmad' }],
      segments: [
        {
          id: 's1',
          label: 'Empty leg',
          distanceKm: 10,
          tollAmountRm: 0,
          passengerIdsPresent: [],
        },
      ],
    });

    const result = calculateSettlement(trip);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].segmentId).toBe('s1');
    // No division-by-zero crash; nobody charged.
    expect(result.settlements[0].totalOwedRm).toBe(0);
  });

  it('does not warn for an empty leg with zero cost', () => {
    const trip = buildTrip({
      passengers: [{ id: 'p1', name: 'Ahmad' }],
      segments: [
        {
          id: 's1',
          label: 'Zero leg',
          distanceKm: 0,
          tollAmountRm: 0,
          passengerIdsPresent: [],
        },
      ],
    });
    expect(calculateSettlement(trip).warnings).toHaveLength(0);
  });

  it('ignores present IDs that are no longer in the roster', () => {
    const trip = buildTrip({
      driverPolicy: 'REIMBURSED',
      passengers: [{ id: 'p1', name: 'Ahmad' }],
      segments: [
        {
          id: 's1',
          label: 'Leg 1',
          distanceKm: 10,
          tollAmountRm: 0,
          passengerIdsPresent: ['p1', 'ghost'],
        },
      ],
    });
    const result = calculateSettlement(trip);
    // Only Ahmad counts → he pays the whole 3.05
    expect(result.settlements[0].totalOwedRm).toBeCloseTo(3.05, 6);
  });
});

const policies: DriverPolicy[] = ['SHARED', 'REIMBURSED'];
describe.each(policies)('cost conservation (%s)', (policy) => {
  it('passenger shares + driver share == total cost', () => {
    const trip = buildTrip({
      driverPolicy: policy,
      passengers: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      segments: [
        {
          id: 's1',
          label: 'L1',
          distanceKm: 17,
          tollAmountRm: 3.4,
          passengerIdsPresent: ['p1', 'p2'],
        },
        {
          id: 's2',
          label: 'L2',
          distanceKm: 8,
          tollAmountRm: 0,
          passengerIdsPresent: ['p1'],
        },
      ],
    });
    const result = calculateSettlement(trip);
    const passengerSum = result.settlements.reduce(
      (a, s) => a + s.totalOwedRm,
      0
    );
    expect(passengerSum + result.driverShareRm).toBeCloseTo(
      result.totalCostRm,
      6
    );
  });
});
