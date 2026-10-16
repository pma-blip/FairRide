/**
 * Core domain models for the Segment-Based Carpool Cost Calculator.
 */

/** How fuel efficiency is expressed by the user. */
export type EfficiencyUnit = 'L_PER_100KM' | 'KM_PER_L';

export interface VehicleProfile {
  /**
   * Fuel efficiency value. Interpreted according to {@link efficiencyUnit}.
   * - L_PER_100KM: litres consumed per 100 km (e.g. 7.5)
   * - KM_PER_L: kilometres travelled per litre (e.g. 13.3)
   */
  fuelEfficiency: number;
  efficiencyUnit: EfficiencyUnit;
  /** Fuel price in RM per litre. */
  fuelPrice: number;
  /** Optional wear-and-tear / maintenance rate in RM per km. */
  maintenanceRate: number;
}

export interface Passenger {
  id: string;
  name: string;
}

export interface TripSegment {
  id: string;
  label: string;
  distanceKm: number;
  tollAmountRm: number;
  /** IDs of passengers physically present in the vehicle during this leg. */
  passengerIdsPresent: string[];
}

/**
 * SHARED  – driver is counted as a rider and pays an equal share.
 * REIMBURSED – driver is excluded; passengers split 100% of the cost.
 */
export type DriverPolicy = 'SHARED' | 'REIMBURSED';

export interface TripState {
  vehicle: VehicleProfile;
  driverPolicy: DriverPolicy;
  passengers: Passenger[];
  segments: TripSegment[];
}

export interface LegBreakdown {
  segmentId: string;
  segmentLabel: string;
  distanceKm: number;
  legCostRm: number;
  shareRm: number;
}

export interface PassengerSettlement {
  passengerId: string;
  passengerName: string;
  legsRiddenCount: number;
  totalKmRidden: number;
  totalOwedRm: number;
  breakdownPerLeg: LegBreakdown[];
}

export interface SegmentValidation {
  segmentId: string;
  /** No passengers selected but a cost (distance or toll) exists. */
  hasNoPassengersWarning: boolean;
}

export interface SettlementResult {
  /** Running cost rate per km (RM/km). */
  costRatePerKm: number;
  totalDistanceKm: number;
  /** Total operational cost of the whole trip (fuel + maintenance + tolls). */
  totalCostRm: number;
  /** Portion of total cost absorbed by the driver (SHARED policy only). */
  driverShareRm: number;
  settlements: PassengerSettlement[];
  warnings: SegmentValidation[];
}
