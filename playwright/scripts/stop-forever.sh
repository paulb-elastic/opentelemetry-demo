#!/usr/bin/env bash
#
# Stops a running `npm run journey:forever` session cleanly.
# Can be called from any terminal window — no need to Ctrl+C the original.
#
PID_FILE="/tmp/journey-forever.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  echo "Stopping journey:forever (PID $PID and its process group)..."
  kill -- -"$PID" 2>/dev/null
else
  echo "No PID file found at $PID_FILE — scanning by process name..."
  pkill -f "run-forever.sh" 2>/dev/null
fi

# Catch any chromium/playwright workers that outlived the group kill
pkill -f "playwright.*traffic-loop" 2>/dev/null
pkill -f "chromium" 2>/dev/null

rm -f "$PID_FILE"
echo "Done."
