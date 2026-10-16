/** Format a number as Malaysian Ringgit, e.g. "RM 12.50". */
export function formatRm(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `RM ${n.toFixed(2)}`;
}

/** Format a distance in km with up to one decimal, trimming trailing ".0". */
export function formatKm(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(n * 10) / 10;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${str} km`;
}

/** Pluralise "trip" / "trips". */
export function legLabel(count: number): string {
  return count === 1 ? '1 trip' : `${count} trips`;
}
