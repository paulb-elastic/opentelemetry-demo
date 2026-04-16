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

## Commands

All commands run from this `playwright/` directory.

| Command | What it does |
|---|---|
| `npm run journey` | All journeys once — quick smoke run (~1 min) |
| `npm run journey:headed` | Same, with visible browser windows |
| `npm run journey:sustained` | All journeys looped — mixed structured + random traffic (~2 min) |
| `npm run journey:forever` | **Random traffic until Ctrl+C** — repeats indefinitely |
| `npm run journey:browse` | Browse-products journey only |
| `npm run journey:cart` | Add-to-cart journey only |
| `npm run journey:checkout` | Full checkout journey only |
| `npm run journey:currency` | Currency-switcher journey only |
| `npm run journey:loop` | Randomized traffic-loop journey only (single pass) |
| `npm run report` | Open the last HTML run report |

## Controlling how much traffic is generated

### Variables for all commands except `journey:forever`

Three variables can be passed to any command. The defaults are the minimal "just run it once" values.

| Variable | Default | Description |
|---|---|---|
| `WORKERS` | `2` | Parallel Chromium browsers. Each generates its own Embrace session. |
| `FILE_REPEATS` | `1` | How many times each journey file runs end-to-end (multiplies all flows). |
| `LOOP_ITERATIONS` | `5` | Iterations per pass of `traffic-loop.journey.ts` only. No effect on other journeys. |

```bash
# Example: 4 browsers, every journey file repeated 3 times
WORKERS=4 FILE_REPEATS=3 npm run journey

# Example: traffic-loop only, 20 random iterations
LOOP_ITERATIONS=20 npm run journey:loop
```

> **Note on `FILE_REPEATS` and `WORKERS`:** when running `journey:loop` (traffic-loop only), set `FILE_REPEATS` equal to `WORKERS` so every worker gets work. Otherwise spare workers sit idle. `journey:sustained` and `journey:forever` handle this automatically.

### `journey:forever` — its own defaults

`journey:forever` is designed for sustained traffic so it uses higher defaults than the standard commands. These are set inside `scripts/run-forever.sh`, not via `playwright.config.ts`:

| Variable | Default in `journey:forever` |
|---|---|
| `WORKERS` | `4` |
| `FILE_REPEATS` | equal to `WORKERS` (auto) |
| `LOOP_ITERATIONS` | `30` |

Each pass runs ~3 minutes (30 iterations × ~5s avg per iteration). Passes repeat back-to-back until Ctrl+C:

```
=== Pass 1 — Thu Apr 16 10:00:00 PST 2026 ===
... flows running ...

=== Pass 2 — Thu Apr 16 10:03:00 PST 2026 ===
^C
Stopped after 2 pass(es). Thu Apr 16 10:05:30 PST 2026
```

Override any of the defaults the same way:

```bash
WORKERS=6 LOOP_ITERATIONS=40 npm run journey:forever
```

### `journey:sustained` — what it runs

`journey:sustained` is equivalent to:

```bash
WORKERS=4 FILE_REPEATS=3 LOOP_ITERATIONS=10 npm run journey
```

Total flows across the full run:

| Journey | Calculation | Total flows |
|---|---|---|
| add-to-cart | 10 products × 3 repeats | 30 |
| browse-products | 2 journeys × 3 repeats | 6 |
| full-checkout | 5 product pairs × 3 repeats | 15 |
| currency-switcher | 3 journeys × 3 repeats | 9 |
| traffic-loop | 3 repeats × 10 iterations | 30 |
| **Total** | | **90 flows, ~2 min** |

### `BASE_URL`

Override if the demo runs on a different port (default: `http://localhost:8080`):

```bash
BASE_URL=http://localhost:9090 npm run journey
```

## Journey files

| File | Flow |
|---|---|
| `browse-products.journey.ts` | Home page → click every product card → product detail |
| `add-to-cart.journey.ts` | Product detail → add to cart → assert badge (all 10 products) |
| `full-checkout.journey.ts` | Add 2 products → cart → place order → confirmation (5 pairs) |
| `currency-switcher.journey.ts` | Switch USD/EUR/JPY/GBP/CAD on home page + browse |
| `traffic-loop.journey.ts` | Randomized mix of all flows, `LOOP_ITERATIONS` per pass |
