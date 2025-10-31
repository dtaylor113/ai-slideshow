#!/bin/bash

echo "🖼️  Starting Our Wallpaper"
echo ""

# Clean up any existing processes
pkill -9 -f "python.*main.py" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 1

echo "Starting backend..."
# Get the script's directory and use relative path
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/backend"
# -u forces unbuffered output so we see logs immediately
/opt/homebrew/bin/python3.10 -u main.py 2>&1 | while IFS= read -r line; do echo "[BACKEND] $line"; done &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

sleep 3

echo "Starting frontend..."
npm run dev 2>&1 | while IFS= read -r line; do echo "[FRONTEND] $line"; done &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting..."
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait forever
wait

