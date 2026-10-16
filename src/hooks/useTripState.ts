import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateSettlement } from '../lib/calculationEngine';
import { clearTrip, loadTrip, saveTrip } from '../lib/storage';
import {
  createEmptyTrip,
  createId,
  createSampleTrip,
} from '../lib/tripState';
import type {
  DriverPolicy,
  TripSegment,
  TripState,
  VehicleProfile,
} from '../lib/types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useTripState() {
  const [trip, setTrip] = useState<TripState>(() => loadTrip() ?? createEmptyTrip());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced auto-save to localStorage.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const ok = saveTrip(trip);
      setSaveStatus(ok ? 'saved' : 'error');
    }, 400);
    return () => clearTimeout(timer.current);
  }, [trip]);

  const settlement = useMemo(() => calculateSettlement(trip), [trip]);

  // --- Vehicle ---------------------------------------------------------
  const updateVehicle = useCallback((patch: Partial<VehicleProfile>) => {
    setTrip((t) => ({ ...t, vehicle: { ...t.vehicle, ...patch } }));
  }, []);

  const setDriverPolicy = useCallback((policy: DriverPolicy) => {
    setTrip((t) => ({ ...t, driverPolicy: policy }));
  }, []);

  // --- Passengers ------------------------------------------------------
  const addPassenger = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTrip((t) => ({
      ...t,
      passengers: [...t.passengers, { id: createId('p'), name: trimmed }],
    }));
  }, []);

  const renamePassenger = useCallback((id: string, name: string) => {
    setTrip((t) => ({
      ...t,
      passengers: t.passengers.map((p) =>
        p.id === id ? { ...p, name } : p
      ),
    }));
  }, []);

  const removePassenger = useCallback((id: string) => {
    setTrip((t) => ({
      ...t,
      passengers: t.passengers.filter((p) => p.id !== id),
      segments: t.segments.map((s) => ({
        ...s,
        passengerIdsPresent: s.passengerIdsPresent.filter((pid) => pid !== id),
      })),
    }));
  }, []);

  // --- Segments --------------------------------------------------------
  const addSegment = useCallback(() => {
    setTrip((t) => {
      const nextNum = t.segments.length + 1;
      // Default new trips to carrying everyone currently in the roster.
      const everyone = t.passengers.map((p) => p.id);
      const newSegment: TripSegment = {
        id: createId('s'),
        label: `Trip ${nextNum}`,
        distanceKm: 0,
        tollAmountRm: 0,
        passengerIdsPresent: everyone,
      };
      return { ...t, segments: [...t.segments, newSegment] };
    });
  }, []);

  const updateSegment = useCallback(
    (id: string, patch: Partial<Omit<TripSegment, 'id'>>) => {
      setTrip((t) => ({
        ...t,
        segments: t.segments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    []
  );

  const removeSegment = useCallback((id: string) => {
    setTrip((t) => ({
      ...t,
      segments: t.segments.filter((s) => s.id !== id),
    }));
  }, []);

  const togglePassengerOnSegment = useCallback(
    (segmentId: string, passengerId: string) => {
      setTrip((t) => ({
        ...t,
        segments: t.segments.map((s) => {
          if (s.id !== segmentId) return s;
          const present = s.passengerIdsPresent.includes(passengerId);
          return {
            ...s,
            passengerIdsPresent: present
              ? s.passengerIdsPresent.filter((pid) => pid !== passengerId)
              : [...s.passengerIdsPresent, passengerId],
          };
        }),
      }));
    },
    []
  );

  // --- Whole trip ------------------------------------------------------
  const loadSample = useCallback(() => setTrip(createSampleTrip()), []);

  const resetTrip = useCallback(() => {
    clearTrip();
    setTrip(createEmptyTrip());
    setSaveStatus('idle');
  }, []);

  return {
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
  };
}
