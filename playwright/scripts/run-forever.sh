#!/usr/bin/env bash
#
# Runs traffic-loop journeys indefinitely until Ctrl+C or `npm run journey:stop`.
#
# Each pass launches WORKERS parallel browsers, each running LOOP_ITERATIONS
# random flows (browse / add-to-cart / checkout / currency).
#
# Usage:
#   ./scripts/run-forever.sh                          # defaults below
#   WORKERS=6 LOOP_ITERATIONS=40 ./scripts/run-forever.sh
#
# Defaults:
WORKERS=${WORKERS:-4}
LOOP_ITERATIONS=${LOOP_ITERATIONS:-30}
# FILE_REPEATS equals WORKERS so every worker gets a session to run.
FILE_REPEATS=${FILE_REPEATS:-$WORKERS}

PID_FILE="/tmp/journey-forever.pid"
echo $$ > "$PID_FILE"

cleanup() {
  echo ""
  echo "Stopping all journey processes..."
  # Kill entire process group to catch npx + playwright node workers
  kill -- -$$ 2>/dev/null
  # Catch any chromium/playwright processes spawned outside our group
  pkill -f "playwright.*traffic-loop" 2>/dev/null
  pkill -f "chromium" 2>/dev/null
  wait 2>/dev/null
  rm -f "$PID_FILE"
  echo "Stopped after $((PASS - 1)) pass(es). $(date)"
  exit 0
}

trap cleanup INT TERM

PASS=1
echo "Running indefinitely — Ctrl+C or 'npm run journey:stop' to stop."
echo "  PID=$$  WORKERS=$WORKERS  FILE_REPEATS=$FILE_REPEATS  LOOP_ITERATIONS=$LOOP_ITERATIONS"
echo ""

while true; do
  echo "=== Pass $PASS — $(date) ==="
  WORKERS=$WORKERS FILE_REPEATS=$FILE_REPEATS LOOP_ITERATIONS=$LOOP_ITERATIONS \
    npx playwright test user_journeys/traffic-loop.journey.ts --reporter=list \
    || echo "(some flows failed in pass $PASS — continuing)"
  echo ""
  PASS=$((PASS + 1))
done
