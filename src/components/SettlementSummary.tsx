import { useState } from 'react';
import { formatKm, formatRm, legLabel } from '../lib/format';
import type { SettlementResult, TripState } from '../lib/types';
import { formatWhatsAppSummary } from '../lib/whatsappExporter';
import { Button, Card } from './ui';

export function SettlementSummary({
  trip,
  settlement,
}: {
  trip: TripState;
  settlement: SettlementResult;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const owing = settlement.settlements
    .filter((s) => s.totalOwedRm > 0.004 || s.legsRiddenCount > 0)
    .sort((a, b) => b.totalOwedRm - a.totalOwedRm);

  const copySummary = async () => {
    const text = formatWhatsAppSummary(trip);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard ✓');
    } catch {
      // Fallback for environments without the async clipboard API.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('Copied to clipboard ✓');
      } catch {
        showToast('Copy failed — select and copy manually');
      }
      document.body.removeChild(ta);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <Card
      title="Settlement"
      icon="🧾"
      action={
        <Button
          variant="primary"
          onClick={copySummary}
          disabled={trip.passengers.length === 0}
        >
          📋 Copy WhatsApp
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <SummaryStat
          label="Total distance"
          value={formatKm(settlement.totalDistanceKm)}
        />
        <SummaryStat
          label="Total cost"
          value={formatRm(settlement.totalCostRm)}
          accent
        />
      </div>

      {trip.driverPolicy === 'SHARED' && settlement.driverShareRm > 0.004 && (
        <div className="mt-2 rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
          🧑‍✈️ Driver's own share:{' '}
          <span className="font-semibold text-slate-100">
            {formatRm(settlement.driverShareRm)}
          </span>
        </div>
      )}

      <div className="mt-4">
        {owing.length === 0 ? (
          <p className="text-sm text-slate-400">
            Add passengers and trips to see who owes what.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {owing.map((s, idx) => {
              const open = expanded === s.passengerId;
              return (
                <li
                  key={s.passengerId}
                  className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(open ? null : s.passengerId)
                    }
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-800/40"
                    aria-expanded={open}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-100">
                          {s.passengerName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {legLabel(s.legsRiddenCount)} ·{' '}
                          {formatKm(s.totalKmRidden)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-emerald-300">
                        {formatRm(s.totalOwedRm)}
                      </span>
                      <span
                        className={`text-slate-500 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-slate-700/60 bg-slate-950/40 px-3 py-2">
                      {s.breakdownPerLeg.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Not present on any trip.
                        </p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-500">
                              <th className="py-1 font-normal">Trip</th>
                              <th className="py-1 text-right font-normal">
                                Trip cost
                              </th>
                              <th className="py-1 text-right font-normal">
                                Your share
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.breakdownPerLeg.map((leg) => (
                              <tr
                                key={leg.segmentId}
                                className="border-t border-slate-800"
                              >
                                <td className="py-1.5 pr-2 text-slate-300">
                                  {leg.segmentLabel}
                                  <span className="ml-1 text-slate-500">
                                    ({formatKm(leg.distanceKm)})
                                  </span>
                                </td>
                                <td className="py-1.5 text-right text-slate-400">
                                  {formatRm(leg.legCostRm)}
                                </td>
                                <td className="py-1.5 text-right font-medium text-emerald-300">
                                  {formatRm(leg.shareRm)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        accent
          ? 'border-emerald-600/40 bg-emerald-500/10'
          : 'border-slate-700 bg-slate-900/50'
      }`}
    >
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className={`text-lg font-semibold ${
          accent ? 'text-emerald-300' : 'text-slate-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
