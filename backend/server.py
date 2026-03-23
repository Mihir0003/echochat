import os
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Set up paths for frontend
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

app = FastAPI()

# State Management
# clients: websocket -> { 'username': str, 'room': str }
clients = {}

# history: room_name -> list of message dicts
history = {
    'general': [],
    'tech': [],
    'random': []
}
MAX_HISTORY = 50

# -------- Helpers --------

async def broadcast_to_room(room: str, message_data: dict, exclude_ws: WebSocket = None):
    """Send a message to all clients in a specific room."""
    msg_type = message_data.get('type')
    if msg_type in ['chat', 'system']:
        if room not in history:
            history[room] = []
        history[room].append(message_data)
        if len(history[room]) > MAX_HISTORY:
            history[room].pop(0)

    encoded = json.dumps(message_data)
    
    # Broadcast to all
    # Creating a list of websockets to avoid dictionary mutation errors during iteration
    targets = [ws for ws, info in clients.items() if info['room'] == room and ws != exclude_ws]
    for ws in targets:
        try:
            await ws.send_text(encoded)
        except Exception:
            pass

async def broadcast_users_in_room(room: str):
    """Send updated user list to everyone in a room."""
    users_in_room = [info['username'] for info in clients.values() if info['room'] == room]
    
    encoded = json.dumps({
        'type': 'users_update',
        'room': room,
        'users': users_in_room
    })
    
    targets = [ws for ws, info in clients.items() if info['room'] == room]
    for ws in targets:
        try:
            await ws.send_text(encoded)
        except Exception:
            pass

async def send_whisper(sender_ws: WebSocket, sender_name: str, target_username: str, text: str):
    """Send a private message to a specific user and echo back to sender."""
    encoded = json.dumps({
        'type': 'whisper',
        'sender': sender_name,
        'text': text,
        'to': target_username
    })
    
    target_found = False
    targets = [ws for ws, info in clients.items() if info['username'] == target_username]
    for ws in targets:
        target_found = True
        try:
            await ws.send_text(encoded)
        except Exception:
            pass
                
    if target_found:
        await sender_ws.send_text(encoded)
    else:
        await sender_ws.send_text(json.dumps({
            'type': 'system',
            'sender': 'System',
            'text': f"User '{target_username}' not found or offline."
        }))


# -------- WebSocket Server --------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Default state
    clients[websocket] = {'username': 'Anonymous', 'room': 'general'}
    
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            msg_type = data.get('type')
            current_room = clients[websocket]['room']
            sender = clients[websocket]['username']
            
            if msg_type == 'join':
                new_username = data.get('sender', 'Anonymous')
                target_room = data.get('room', 'general')
                clients[websocket] = {'username': new_username, 'room': target_room}
                sender = new_username
                current_room = target_room
                
                if current_room in history:
                    await websocket.send_text(json.dumps({
                        'type': 'history',
                        'room': current_room,
                        'messages': history[current_room]
                    }))
                
                await broadcast_to_room(current_room, {
                    'type': 'system',
                    'sender': sender,
                    'text': f"joined #{current_room}.",
                    'time': data.get('time', '')
                })
                await broadcast_users_in_room(current_room)
                
            elif msg_type == 'switch_room':
                new_room = data.get('room', 'general')
                old_room = clients[websocket]['room']
                clients[websocket]['room'] = new_room
                
                await broadcast_to_room(old_room, {
                    'type': 'system',
                    'sender': sender,
                    'text': f"left #{old_room}."
                })
                await broadcast_users_in_room(old_room)
                
                if new_room not in history:
                    history[new_room] = []
                await websocket.send_text(json.dumps({
                    'type': 'history',
                    'room': new_room,
                    'messages': history[new_room]
                }))
                
                await broadcast_to_room(new_room, {
                    'type': 'system',
                    'sender': sender,
                    'text': f"joined #{new_room}."
                })
                await broadcast_users_in_room(new_room)
                
            elif msg_type == 'chat':
                data['sender'] = sender
                data['room'] = current_room
                await broadcast_to_room(current_room, data)
                
            elif msg_type == 'whisper':
                target = data.get('target')
                text = data.get('text')
                await send_whisper(websocket, sender, target, text)
                
            elif msg_type == 'typing':
                await broadcast_to_room(current_room, {
                    'type': 'typing',
                    'sender': sender,
                    'isTyping': data.get('isTyping', True)
                }, exclude_ws=websocket)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error handling message: {e}")
    finally:
        if websocket in clients:
            info = clients[websocket]
            del clients[websocket]
            
            await broadcast_to_room(info['room'], {
                'type': 'system',
                'sender': info['username'],
                'text': f"left #{info['room']}."
            })
            await broadcast_users_in_room(info['room'])


# -------- HTTP Server --------

# Mount the static frontend directory.
# First define the root route explicitly to serve index.html 
# (sometimes StaticFiles doesn't default to index.html properly depending on config)
@app.get("/")
async def root():
    return FileResponse(os.path.join(FRONTEND_DIR, 'index.html'))

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


if __name__ == "__main__":
    if not os.path.exists(FRONTEND_DIR):
        os.makedirs(FRONTEND_DIR)
        
    print("Starting EchoChat FastAPI server...")
    # Cloud providers use the PORT environment variable. Defaults to 8000.
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
