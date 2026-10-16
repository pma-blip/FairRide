import { formatRm } from '../lib/format';
import type { DriverPolicy, EfficiencyUnit, VehicleProfile } from '../lib/types';
import { Card, NumberField } from './ui';

export function VehicleConfig({
  vehicle,
  costRatePerKm,
  driverPolicy,
  onUpdate,
  onPolicyChange,
}: {
  vehicle: VehicleProfile;
  costRatePerKm: number;
  driverPolicy: DriverPolicy;
  onUpdate: (patch: Partial<VehicleProfile>) => void;
  onPolicyChange: (policy: DriverPolicy) => void;
}) {
  const efficiencyLabel =
    vehicle.efficiencyUnit === 'KM_PER_L'
      ? 'Fuel Efficiency'
      : 'Fuel Efficiency';
  const efficiencySuffix =
    vehicle.efficiencyUnit === 'KM_PER_L' ? 'km/L' : 'L/100km';

  return (
    <Card title="Vehicle & Fuel" icon="⛽">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">{efficiencyLabel}</span>
            <UnitToggle
              value={vehicle.efficiencyUnit}
              onChange={(efficiencyUnit) => onUpdate({ efficiencyUnit })}
            />
          </div>
          <NumberFieldInline
            value={vehicle.fuelEfficiency}
            suffix={efficiencySuffix}
            onChange={(fuelEfficiency) => onUpdate({ fuelEfficiency })}
          />
        </div>

        <NumberField
          label="Fuel Price"
          value={vehicle.fuelPrice}
          suffix="RM/L"
          onChange={(fuelPrice) => onUpdate({ fuelPrice })}
        />
        <NumberField
          label="Maintenance / Wear"
          value={vehicle.maintenanceRate}
          suffix="RM/km"
          onChange={(maintenanceRate) => onUpdate({ maintenanceRate })}
        />
        <div className="flex flex-col justify-end">
          <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2">
            <div className="text-xs text-emerald-300/80">Running cost rate</div>
            <div className="text-lg font-semibold text-emerald-300">
              {formatRm(costRatePerKm)}
              <span className="text-xs font-normal text-emerald-300/70">
                {' '}
                / km
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
          Driver cost policy
        </div>
        <PolicySelector value={driverPolicy} onChange={onPolicyChange} />
      </div>
    </Card>
  );
}

function NumberFieldInline({
  value,
  suffix,
  onChange,
}: {
  value: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          onChange(Number.isNaN(n) ? 0 : Math.max(0, n));
        }}
        className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 pr-20 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
      />
      <span className="pointer-events-none absolute right-3 text-xs text-slate-400">
        {suffix}
      </span>
    </div>
  );
}

function UnitToggle({
  value,
  onChange,
}: {
  value: EfficiencyUnit;
  onChange: (v: EfficiencyUnit) => void;
}) {
  const options: { key: EfficiencyUnit; label: string }[] = [
    { key: 'L_PER_100KM', label: 'L/100km' },
    { key: 'KM_PER_L', label: 'km/L' },
  ];
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-600 text-[11px]">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`px-2 py-0.5 transition ${
            value === o.key
              ? 'bg-emerald-500 text-slate-900'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PolicySelector({
  value,
  onChange,
}: {
  value: DriverPolicy;
  onChange: (v: DriverPolicy) => void;
}) {
  const options: {
    key: DriverPolicy;
    title: string;
    desc: string;
    icon: string;
  }[] = [
    {
      key: 'SHARED',
      title: 'Shared',
      desc: 'Driver pays an equal share too',
      icon: '🤝',
    },
    {
      key: 'REIMBURSED',
      title: 'Reimbursed',
      desc: 'Passengers cover 100% of cost',
      icon: '💸',
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`rounded-lg border p-3 text-left transition ${
              active
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              <span>{o.icon}</span>
              {o.title}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">{o.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
