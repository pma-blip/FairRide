import { calculateSettlement } from './calculationEngine';
import { formatKm, formatRm, legLabel } from './format';
import type { TripState } from './types';

/**
 * Format a trip's settlement into a plain-text summary suitable for pasting
 * into WhatsApp. Passengers who owe nothing are omitted.
 */
export function formatWhatsAppSummary(trip: TripState): string {
  const result = calculateSettlement(trip);
  const divider = '----------------------------------------';
  const lines: string[] = [];

  lines.push('🚗 *Trip Cost Split Breakdown*');
  lines.push(
    `Total Distance: ${formatKm(result.totalDistanceKm)} | Total Cost: ${formatRm(
      result.totalCostRm
    )}`
  );
  lines.push(divider);

  const owing = result.settlements
    .filter((s) => s.totalOwedRm > 0.004)
    .sort((a, b) => b.totalOwedRm - a.totalOwedRm);

  if (owing.length === 0) {
    lines.push('_No passenger charges yet._');
  } else {
    owing.forEach((s, idx) => {
      lines.push(
        `${idx + 1}. ${s.passengerName}: ${formatRm(s.totalOwedRm)} (${legLabel(
          s.legsRiddenCount
        )}, ${formatKm(s.totalKmRidden)})`
      );
    });
  }

  if (trip.driverPolicy === 'SHARED' && result.driverShareRm > 0.004) {
    lines.push(divider);
    lines.push(`🧑‍✈️ Driver's own share: ${formatRm(result.driverShareRm)}`);
  }

  lines.push(divider);
  lines.push('Pay via DuitNow to Driver. 🙏');

  return lines.join('\n');
}
