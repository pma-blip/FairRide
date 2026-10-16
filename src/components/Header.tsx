import type { SaveStatus } from '../hooks/useTripState';
import { Button } from './ui';

export function Header({
  saveStatus,
  onLoadSample,
  onReset,
}: {
  saveStatus: SaveStatus;
  onLoadSample: () => void;
  onReset: () => void;
}) {
  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50 sm:text-2xl">
            🚗 Carpool Cost Splitter
          </h1>
          <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
            Fairly split fuel, tolls &amp; wear — leg by leg.
          </p>
        </div>
        <StorageStatus status={saveStatus} />
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={onLoadSample}>
          Load Sample
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (
              window.confirm('Reset the whole trip? This clears all data.')
            ) {
              onReset();
            }
          }}
        >
          Reset
        </Button>
      </div>
    </header>
  );
}

function StorageStatus({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { label: string; cls: string }> = {
    idle: { label: 'Auto-save on', cls: 'text-slate-500' },
    saving: { label: 'Saving…', cls: 'text-amber-400' },
    saved: { label: 'Saved locally ✓', cls: 'text-emerald-400' },
    error: { label: 'Save failed', cls: 'text-rose-400' },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`shrink-0 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] ${cls}`}
      title="Your trip is stored only in this browser."
    >
      {label}
    </span>
  );
}
