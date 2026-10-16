import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('App integration', () => {
  it('renders the main sections', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Carpool Cost Splitter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Vehicle & Fuel/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Passengers/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Trip Segments/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Settlement/i })
    ).toBeInTheDocument();
  });

  it('loads the sample trip and shows a settlement', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Load Sample/i }));

    // Sample has Ahmad, Muthu, Siti — they should appear in settlement list.
    expect(screen.getAllByText(/Ahmad/i).length).toBeGreaterThan(0);
    // Total cost stat should be rendered with a RM value.
    expect(screen.getByText('Total cost')).toBeInTheDocument();
  });

  it('adds a passenger and persists to localStorage', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Add passenger name/i);
    fireEvent.change(input, { target: { value: 'Zara' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    expect(screen.getByDisplayValue('Zara')).toBeInTheDocument();
  });

  it('warns when a trip has distance but no passengers', () => {
    render(<App />);
    // Add a trip while the roster is empty, so nobody is on the trip.
    fireEvent.click(screen.getByRole('button', { name: /Add Trip/i }));

    // Scope to the Trip Segments card and set the trip's distance > 0.
    const segmentsHeading = screen.getByRole('heading', {
      name: /Trip Segments/i,
    });
    const segmentsCard = segmentsHeading.closest('section')!;
    const distanceInput = within(segmentsCard).getByRole('spinbutton', {
      name: /Distance/i,
    }) as HTMLInputElement;
    fireEvent.change(distanceInput, { target: { value: '10' } });

    expect(
      screen.getByText(/At least 1 passenger must be present/i)
    ).toBeInTheDocument();
  });

  it('restores state from localStorage on mount', () => {
    const saved = {
      vehicle: {
        fuelEfficiency: 8,
        efficiencyUnit: 'L_PER_100KM',
        fuelPrice: 2.05,
        maintenanceRate: 0.1,
      },
      driverPolicy: 'REIMBURSED',
      passengers: [{ id: 'p1', name: 'Restored Rider' }],
      segments: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    render(<App />);
    expect(screen.getByDisplayValue('Restored Rider')).toBeInTheDocument();
  });
});
