# 🚗 Carpool Cost Splitter

A lightweight, mobile-first web app that fairly splits driving expenses for group
outings. It breaks a trip into **segments (legs)** — one for each stretch where
passengers get in or out — so everyone pays only for the distance they actually
rode.

Built with **React + TypeScript + Vite + Tailwind CSS v4**. Works entirely
client-side (no backend, no login) and auto-saves your trip in the browser.

## Features

- **Vehicle & fuel profile** — fuel efficiency (`L/100km` or `km/L`), fuel price
  (defaults to Malaysia RON95 at RM2.05/L), and an optional wear-and-tear rate.
  The running cost rate (RM/km) updates live.
- **Passenger roster** — add, rename, and remove riders.
- **Segment builder** — per-leg distance, tolls, and a checkbox matrix for who
  was in the car on that leg.
- **Driver cost policy** — *Shared* (driver pays an equal share) or *Reimbursed*
  (passengers cover 100%).
- **Live settlement** — total distance/cost, per-passenger fares, and an
  expandable leg-by-leg breakdown for each person.
- **WhatsApp export** — one-click copy of a formatted plain-text summary.
- **Offline + persistent** — state is debounced-saved to `localStorage`.
- **Validation** — warns when a leg has cost but nobody present; divides a
  stationary toll (0 km) among present riders; never divides by zero.

## Calculation model

```
C_rate   = (L/100km ÷ 100 × fuelPrice) + maintenanceRate        [RM/km]
LegCost_i = distance_i × C_rate + toll_i                         [RM]
N_i       = passengersPresent (+1 if driver SHARED)
Share_p,i = LegCost_i / N_i   (0 if p absent on leg i)
Owed_p    = Σ Share_p,i
```

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # typecheck + production build
npm run preview    # preview the production build
npm test           # run the test suite (Vitest)
npm run coverage   # engine coverage report
npm run lint       # oxlint
```

## Project structure

```
src/
├── lib/
│   ├── types.ts                 # domain models
│   ├── calculationEngine.ts     # pure cost/split math
│   ├── whatsappExporter.ts      # plain-text summary formatter
│   ├── format.ts                # RM / km formatting helpers
│   ├── tripState.ts             # defaults + sample trip factory
│   ├── storage.ts               # localStorage load/save + sanitizer
│   └── *.test.ts                # unit tests
├── hooks/
│   └── useTripState.ts          # state + debounced persistence
├── components/
│   ├── Header.tsx               # title, Load Sample / Reset, save status
│   ├── VehicleConfig.tsx        # fuel/efficiency inputs + policy selector
│   ├── PassengerRoster.tsx      # add/rename/remove passengers
│   ├── SegmentBuilder.tsx       # dynamic legs + passenger matrix
│   ├── SettlementSummary.tsx    # totals, fare table, WhatsApp copy
│   └── ui.tsx                   # shared primitives
├── App.tsx
└── App.test.tsx                 # integration tests
```

## Testing

`npm test` runs 26 tests:

- **Calculation engine** — single-leg equal split, multi-leg staggered
  drop-offs, SHARED vs REIMBURSED policies, zero-distance/non-zero-toll,
  no-passenger warnings, division-by-zero safety, and cost-conservation checks.
- **WhatsApp exporter** — header/totals, passenger ranking, driver-share
  visibility per policy.
- **App integration** — rendering, Load Sample, add passenger, the leg warning,
  and `localStorage` restore.

## Notes & references

- Default RON95 fuel price (RM2.05/L) per Malaysia's KPDN pricing structure.
- Private carpooling / vehicle operational context per APAD guidelines.
