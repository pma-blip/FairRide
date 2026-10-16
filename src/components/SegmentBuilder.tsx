import { calculateSettlement } from '../lib/calculationEngine';
import type { Passenger, TripSegment, TripState } from '../lib/types';
import { Button, Card, NumberField } from './ui';

export function SegmentBuilder({
  trip,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment,
  onTogglePassenger,
}: {
  trip: TripState;
  onAddSegment: () => void;
  onUpdateSegment: (
    id: string,
    patch: Partial<Omit<TripSegment, 'id'>>
  ) => void;
  onRemoveSegment: (id: string) => void;
  onTogglePassenger: (segmentId: string, passengerId: string) => void;
}) {
  const result = calculateSettlement(trip);
  const warnIds = new Set(
    result.warnings.filter((w) => w.hasNoPassengersWarning).map((w) => w.segmentId)
  );

  return (
    <Card
      title="Trip Segments"
      icon="🗺️"
      action={
        <Button variant="primary" onClick={onAddSegment}>
          + Add Trip
        </Button>
      }
    >
      {trip.segments.length === 0 ? (
        <p className="text-sm text-slate-400">
          No trips yet. Add a trip for each stretch of the journey.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {trip.segments.map((segment, index) => (
            <SegmentCard
              key={segment.id}
              index={index}
              segment={segment}
              passengers={trip.passengers}
              hasWarning={warnIds.has(segment.id)}
              onUpdate={(patch) => onUpdateSegment(segment.id, patch)}
              onRemove={() => onRemoveSegment(segment.id)}
              onToggle={(pid) => onTogglePassenger(segment.id, pid)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function SegmentCard({
  index,
  segment,
  passengers,
  hasWarning,
  onUpdate,
  onRemove,
  onToggle,
}: {
  index: number;
  segment: TripSegment;
  passengers: Passenger[];
  hasWarning: boolean;
  onUpdate: (patch: Partial<Omit<TripSegment, 'id'>>) => void;
  onRemove: () => void;
  onToggle: (passengerId: string) => void;
}) {
  const presentCount = segment.passengerIdsPresent.length;

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        hasWarning
          ? 'border-amber-500/60 bg-amber-500/5'
          : 'border-slate-700 bg-slate-900/40'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
          {index + 1}
        </span>
        <input
          type="text"
          value={segment.label}
          maxLength={60}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder={`Trip ${index + 1}`}
          className="w-full rounded-md bg-transparent px-1 py-1 text-sm font-medium text-slate-100 outline-none focus:bg-slate-800/60"
          aria-label="Trip label"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove trip"
          className="rounded px-2 py-1 text-xs text-rose-400 transition hover:bg-rose-500/10"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Distance"
          value={segment.distanceKm}
          suffix="km"
          onChange={(distanceKm) => onUpdate({ distanceKm })}
        />
        <NumberField
          label="Tolls"
          value={segment.tollAmountRm}
          suffix="RM"
          onChange={(tollAmountRm) => onUpdate({ tollAmountRm })}
        />
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
            Who was in the car?
          </span>
          <span className="text-xs text-slate-500">
            {presentCount} / {passengers.length}
          </span>
        </div>
        {passengers.length === 0 ? (
          <p className="text-xs text-slate-500">Add passengers first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passengers.map((p) => {
              const checked = segment.passengerIdsPresent.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p.id)}
                  aria-pressed={checked}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                    checked
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                      : 'border-slate-600 bg-slate-800/60 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span>{checked ? '✓' : '○'}</span>
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hasWarning && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-300">
          ⚠️ At least 1 passenger must be present for this trip to be charged.
        </p>
      )}
    </div>
  );
}
