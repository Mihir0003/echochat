# EchoChat - Project Notes

Last verified: April 27, 2026

## Overview
- Real-time chat application with FastAPI backend and WebSocket messaging.
- Frontend is Vanilla JS/CSS served by the backend on the same port.

## Tech Stack
- Python 3
- FastAPI
- Uvicorn
- WebSockets
- HTML/CSS/Vanilla JS frontend

## Directory Notes
- `backend/server.py`: FastAPI app, WebSocket handling, room/user state.
- `backend/requirements.txt`: backend dependencies.
- `frontend/index.html`: chat UI.
- `frontend/app.js`: client-side WebSocket logic and commands.
- `frontend/style.css`: UI styling.

## Features
- Room-based chat sessions using URL query parameter `?room=...`.
- Auto-generated private room when no room is provided.
- Live user list per room.
- Typing indicators.
- Private whisper command from UI input:
  - `/whisper <username> <message>`
  - `/w <username> <message>`

## UI/UX Upgrade (Completed)
- Futuristic interface redesigned with:
  - New glassmorphism + bright neon visual system.
  - Upgraded typography (`Orbitron` + `Space Grotesk` + `IBM Plex Mono` for code-like snippets).
  - Cleaner chat bubble hierarchy for sent/received/whisper states.
  - Fully responsive layout for desktop, tablet, and mobile.
  - Improved readability and interaction contrast across all panels.

## Run Commands
```bash
cd echochat/backend
pip3 install -r requirements.txt
python3 server.py
```

Open:
- `http://localhost:8085`

### Access From Other Devices (Same Network)
- Do **not** open `http://0.0.0.0:8085` on phones/laptops. `0.0.0.0` is only a bind address.
- Start server:
```bash
cd echochat/backend
python3 server.py
```
- On startup, server prints:
  - `Open from another device on same Wi-Fi: http://<LAN_IP>:8085`
- Open that `<LAN_IP>` URL on other devices (must be same Wi-Fi/LAN).
- Allow incoming connections for Python in macOS Firewall if prompted.

### Access From Outside Your Network (Internet)
- Local LAN URL is not public on the internet.
- Use one of these:
  - Deploy to Render/Railway (recommended), then share HTTPS URL.
  - Or temporary tunnel for testing:
```bash
ngrok http 8085
```
Share the generated `https://...ngrok...` URL.

## API / Socket
- `GET /`: serves frontend index page.
- `WS /ws`: real-time messaging channel.

## Validation Status
- Dependency import and backend compile check passed.
- Backend runtime smoke test passed (Uvicorn started and shut down cleanly).
- Frontend JS syntax check passed:
```bash
cd echochat/frontend
node --check app.js
```
- Updated UI confirmed to load correctly through backend static serving.

## Git Status
- This folder is a git repository on branch `main`.
- No remote is configured yet.
