import { useState } from 'react';
import type { Passenger } from '../lib/types';
import { Button, Card } from './ui';

export function PassengerRoster({
  passengers,
  onAdd,
  onRename,
  onRemove,
}: {
  passengers: Passenger[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState('');

  const submit = () => {
    onAdd(name);
    setName('');
  };

  return (
    <Card title="Passengers" icon="👥">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add passenger name…"
          maxLength={30}
          className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
        />
        <Button type="submit" variant="primary" disabled={!name.trim()}>
          Add
        </Button>
      </form>

      {passengers.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">
          No passengers yet. Add at least one to compute a split.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {passengers.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-lg bg-slate-900/50 px-2 py-1.5"
            >
              <span className="text-slate-500">•</span>
              <input
                type="text"
                value={p.name}
                maxLength={30}
                onChange={(e) => onRename(p.id, e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 outline-none"
                aria-label={`Passenger name`}
              />
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                aria-label={`Remove ${p.name}`}
                className="rounded px-2 py-1 text-xs text-rose-400 transition hover:bg-rose-500/10"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
