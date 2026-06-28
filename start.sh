#!/bin/bash
# Run both backend and frontend in one terminal
# Usage: bash start.sh

echo "Starting API Client (Postman Clone)..."

# Start backend
cd backend
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend started at http://localhost:8000 (PID $BACKEND_PID)"

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started at http://localhost:3000 (PID $FRONTEND_PID)"

echo ""
echo "Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
