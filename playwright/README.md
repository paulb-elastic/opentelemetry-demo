# Playwright RUM Traffic Journeys

Drives real browser sessions against the OTel demo storefront (`http://localhost:8080`) so that Embrace.io RUM captures sessions, page views, XHR spans, and user interactions.

The Embrace App ID is configured via `NEXT_PUBLIC_EMBRACE_APP_ID` in the repo's `.env` file — do not hardcode it here.

These are **not tests** — they are user-journey scripts. They happen to use the Playwright runner because it provides parallel workers, repeatable runs, and real Chromium sessions that execute the Embrace SDK.

## One-time setup

```bash
# Install dependencies
npm install

# Download the Chromium browser Playwright uses
npx playwright install chromium
```

## Running journeys

All commands run from this `playwright/` directory.

### Quick reference

| Command | Workers | Repeats | What it does |
|---|---|---|---|
| `npm run journey` | 2 | 1 | All journeys once — quick smoke run |
| `npm run journey:headed` | 2 | 1 | Same, with visible browser windows |
| `npm run journey:sustained` | 4 | 3 | **All journeys looped** — default sustained traffic |
| `npm run journey:browse` | 2 | 1 | Browse-products journey only |
| `npm run journey:cart` | 2 | 1 | Add-to-cart journey only |
| `npm run journey:checkout` | 2 | 1 | Full checkout journey only |
| `npm run journey:currency` | 2 | 1 | Currency-switcher journey only |
| `npm run journey:loop` | 2 | 1 | Randomized traffic-loop journey only |
| `npm run report` | — | — | Open the last HTML run report |

### Customising workers and repeats

`WORKERS`, `REPEAT`, and `LOOP_COUNT` work with **any** command:

```bash
# All journeys, 4 workers, repeated 5 times
WORKERS=4 REPEAT=5 npm run journey

# All journeys, heavier load with custom loop count
WORKERS=6 REPEAT=4 LOOP_COUNT=20 npm run journey:sustained

# Just the checkout flow, 3 repeats
REPEAT=3 npm run journey:checkout
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:8080` | Override if the demo runs on a different port |
| `WORKERS` | `2` | Number of parallel Chromium workers (overridden to `4` by `journey:sustained`) |
| `REPEAT` | `1` | Repeat every journey file N times (overridden to `3` by `journey:sustained`) |
| `LOOP_COUNT` | `5` | Iterations per worker inside `traffic-loop.journey.ts` (overridden to `10` by `journey:sustained`) |

## Journey files

| File | Flow |
|---|---|
| `browse-products.journey.ts` | Home page → click every product card → product detail |
| `add-to-cart.journey.ts` | Product detail → add to cart → assert badge (all 10 products) |
| `full-checkout.journey.ts` | Add 2 products → cart → place order → confirmation (5 pairs) |
| `currency-switcher.journey.ts` | Switch USD/EUR/JPY/GBP/CAD on home page + browse |
| `traffic-loop.journey.ts` | Randomized mix of all flows, `LOOP_COUNT` iterations |
