import { Header } from './components/Header';
import { PassengerRoster } from './components/PassengerRoster';
import { SegmentBuilder } from './components/SegmentBuilder';
import { SettlementSummary } from './components/SettlementSummary';
import { VehicleConfig } from './components/VehicleConfig';
import { useTripState } from './hooks/useTripState';

export default function App() {
  const {
    trip,
    settlement,
    saveStatus,
    updateVehicle,
    setDriverPolicy,
    addPassenger,
    renamePassenger,
    removePassenger,
    addSegment,
    updateSegment,
    removeSegment,
    togglePassengerOnSegment,
    loadSample,
    resetTrip,
  } = useTripState();

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
        <Header
          saveStatus={saveStatus}
          onLoadSample={loadSample}
          onReset={resetTrip}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left column: inputs */}
          <div className="flex flex-col gap-4">
            <VehicleConfig
              vehicle={trip.vehicle}
              costRatePerKm={settlement.costRatePerKm}
              driverPolicy={trip.driverPolicy}
              onUpdate={updateVehicle}
              onPolicyChange={setDriverPolicy}
            />
            <PassengerRoster
              passengers={trip.passengers}
              onAdd={addPassenger}
              onRename={renamePassenger}
              onRemove={removePassenger}
            />
            <SegmentBuilder
              trip={trip}
              onAddSegment={addSegment}
              onUpdateSegment={updateSegment}
              onRemoveSegment={removeSegment}
              onTogglePassenger={togglePassengerOnSegment}
            />
          </div>

          {/* Right column: results (sticky on desktop) */}
          <div className="flex flex-col gap-4">
            <div className="lg:sticky lg:top-6">
              <SettlementSummary trip={trip} settlement={settlement} />
            </div>
          </div>
        </div>

        <footer className="mt-6 pb-8 text-center text-xs text-slate-500">
          Works offline · data stays in your browser ·{' '}
          <span className="text-slate-400">RON95 default RM2.05/L</span>
        </footer>
      </div>
    </div>
  );
}
