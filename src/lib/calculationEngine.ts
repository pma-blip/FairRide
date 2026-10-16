import type {
  DriverPolicy,
  LegBreakdown,
  PassengerSettlement,
  SegmentValidation,
  SettlementResult,
  TripSegment,
  TripState,
  VehicleProfile,
} from './types';

/** Treat tiny / invalid numbers as zero. */
function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Compute the vehicle's running cost rate per km (RM/km):
 *
 *   C_rate = (L/100km / 100 × fuelPrice) + maintenanceRate
 *
 * Handles the KM_PER_L unit by converting to L/100km first.
 */
export function computeCostRatePerKm(vehicle: VehicleProfile): number {
  const price = safe(vehicle.fuelPrice);
  const maintenance = safe(vehicle.maintenanceRate);
  const efficiency = safe(vehicle.fuelEfficiency);

  let litresPer100Km: number;
  if (vehicle.efficiencyUnit === 'KM_PER_L') {
    // km/L → L/100km : 100 / (km per litre)
    litresPer100Km = efficiency > 0 ? 100 / efficiency : 0;
  } else {
    litresPer100Km = efficiency;
  }

  const fuelRatePerKm = (litresPer100Km / 100) * price;
  return fuelRatePerKm + maintenance;
}

/**
 * Operational cost of a single leg:
 *
 *   LegCost_i = (d_i × C_rate) + T_i
 */
export function computeLegCost(
  segment: TripSegment,
  costRatePerKm: number
): number {
  const distance = safe(segment.distanceKm);
  const toll = safe(segment.tollAmountRm);
  return distance * costRatePerKm + toll;
}

/**
 * Number of cost-sharing riders on a leg.
 * SHARED adds the driver (+1); REIMBURSED counts passengers only.
 */
export function computeRiderCount(
  passengersPresent: number,
  policy: DriverPolicy
): number {
  if (passengersPresent <= 0) return 0;
  return policy === 'SHARED' ? passengersPresent + 1 : passengersPresent;
}

/** A leg carries cost if it has distance or tolls. */
function legHasCost(segment: TripSegment): boolean {
  return safe(segment.distanceKm) > 0 || safe(segment.tollAmountRm) > 0;
}

/**
 * Full settlement calculation for a trip.
 *
 * For each leg, the leg cost is divided among the active riders (N_i). Each
 * present passenger owes LegCost_i / N_i; a passenger's total owed is the sum
 * of their per-leg shares.
 */
export function calculateSettlement(trip: TripState): SettlementResult {
  const costRatePerKm = computeCostRatePerKm(trip.vehicle);

  const settlementMap = new Map<string, PassengerSettlement>();
  for (const p of trip.passengers) {
    settlementMap.set(p.id, {
      passengerId: p.id,
      passengerName: p.name,
      legsRiddenCount: 0,
      totalKmRidden: 0,
      totalOwedRm: 0,
      breakdownPerLeg: [],
    });
  }

  const validPassengerIds = new Set(trip.passengers.map((p) => p.id));
  const warnings: SegmentValidation[] = [];

  let totalDistanceKm = 0;
  let totalCostRm = 0;
  let driverShareRm = 0;

  for (const segment of trip.segments) {
    const distance = safe(segment.distanceKm);
    const legCost = computeLegCost(segment, costRatePerKm);

    totalDistanceKm += distance;
    totalCostRm += legCost;

    // Only count passengers that still exist in the roster.
    const presentIds = segment.passengerIdsPresent.filter((id) =>
      validPassengerIds.has(id)
    );
    const passengersPresent = presentIds.length;

    // Validation: a leg with cost but nobody present.
    if (passengersPresent === 0 && legHasCost(segment)) {
      warnings.push({
        segmentId: segment.id,
        hasNoPassengersWarning: true,
      });
    }

    const riderCount = computeRiderCount(passengersPresent, trip.driverPolicy);

    // Division-by-zero guard: skip distributing if no riders.
    if (riderCount === 0) continue;

    const sharePerRider = legCost / riderCount;

    // Driver absorbs one share under SHARED policy.
    if (trip.driverPolicy === 'SHARED') {
      driverShareRm += sharePerRider;
    }

    for (const pid of presentIds) {
      const settlement = settlementMap.get(pid);
      if (!settlement) continue;

      const leg: LegBreakdown = {
        segmentId: segment.id,
        segmentLabel: segment.label,
        distanceKm: distance,
        legCostRm: legCost,
        shareRm: sharePerRider,
      };
      settlement.breakdownPerLeg.push(leg);
      settlement.legsRiddenCount += 1;
      settlement.totalKmRidden += distance;
      settlement.totalOwedRm += sharePerRider;
    }
  }

  return {
    costRatePerKm,
    totalDistanceKm,
    totalCostRm,
    driverShareRm,
    settlements: Array.from(settlementMap.values()),
    warnings,
  };
}
