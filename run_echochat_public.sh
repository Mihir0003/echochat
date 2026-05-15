#!/bin/bash

echo "🚀 Starting EchoChat Backend Server..."

# Start the python server in the background
cd backend
source venv/bin/activate
python server.py &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 3

echo "🌐 Exposing server to the public internet using Localtunnel..."
echo "---------------------------------------------------------"
echo "Your secure shareable link will appear below."
echo "If your friend clicks the link, they just need to click 'Continue'!"
echo "---------------------------------------------------------"

# Start localtunnel
npx localtunnel --port 8085

# When localtunnel is closed with Ctrl+C, kill the python server
kill $SERVER_PID
