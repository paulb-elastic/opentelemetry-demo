#!/usr/bin/env bash
#
# Runs traffic-loop journeys indefinitely until Ctrl+C.
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

# Trap Ctrl+C for a clean exit message instead of a stack trace.
trap 'echo ""; echo "Stopped after $((PASS - 1)) pass(es). $(date)"; exit 0' INT TERM

PASS=1
echo "Running indefinitely — Ctrl+C to stop."
echo "  WORKERS=$WORKERS  FILE_REPEATS=$FILE_REPEATS  LOOP_ITERATIONS=$LOOP_ITERATIONS"
echo ""

while true; do
  echo "=== Pass $PASS — $(date) ==="
  WORKERS=$WORKERS FILE_REPEATS=$FILE_REPEATS LOOP_ITERATIONS=$LOOP_ITERATIONS \
    npx playwright test user_journeys/traffic-loop.journey.ts --reporter=list \
    || echo "(some flows failed in pass $PASS — continuing)"
  echo ""
  PASS=$((PASS + 1))
done
