import { describe, expect, it } from 'vitest';
import type { TripState } from './types';
import { formatWhatsAppSummary } from './whatsappExporter';

const base: TripState = {
  vehicle: {
    fuelEfficiency: 10,
    efficiencyUnit: 'L_PER_100KM',
    fuelPrice: 2.05,
    maintenanceRate: 0.1,
  },
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
      tollAmountRm: 0,
      passengerIdsPresent: ['p1', 'p2'],
    },
    {
      id: 's2',
      label: 'Leg 2',
      distanceKm: 10,
      tollAmountRm: 0,
      passengerIdsPresent: ['p1'],
    },
  ],
};

describe('formatWhatsAppSummary', () => {
  it('includes header, totals and sorted passenger lines', () => {
    const out = formatWhatsAppSummary(base);
    expect(out).toContain('🚗 *Trip Cost Split Breakdown*');
    expect(out).toContain('Total Distance: 30 km');
    expect(out).toContain('Pay via DuitNow');
    // Ahmad rode more, so should be ranked first.
    const ahmadIdx = out.indexOf('Ahmad');
    const muthuIdx = out.indexOf('Muthu');
    expect(ahmadIdx).toBeGreaterThan(-1);
    expect(muthuIdx).toBeGreaterThan(ahmadIdx);
    expect(out).toContain('1. Ahmad');
  });

  it('omits passengers who owe nothing', () => {
    const trip: TripState = {
      ...base,
      segments: [
        {
          id: 's1',
          label: 'Leg 1',
          distanceKm: 20,
          tollAmountRm: 0,
          passengerIdsPresent: ['p1'],
        },
      ],
    };
    const out = formatWhatsAppSummary(trip);
    expect(out).toContain('Ahmad');
    expect(out).not.toContain('Muthu');
  });

  it('shows driver share under SHARED policy', () => {
    const out = formatWhatsAppSummary({ ...base, driverPolicy: 'SHARED' });
    expect(out).toContain("Driver's own share");
  });

  it('does not show driver share under REIMBURSED policy', () => {
    const out = formatWhatsAppSummary(base);
    expect(out).not.toContain("Driver's own share");
  });
});
