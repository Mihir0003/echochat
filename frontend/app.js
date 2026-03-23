// DOM Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');

const appContainer = document.getElementById('app-container');
const connectionStatus = document.getElementById('connection-status');
const myUsernameDisplay = document.getElementById('my-username-display');
const myAvatar = document.getElementById('my-avatar');
const messagesContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const usersList = document.getElementById('users-list');
const userCount = document.getElementById('user-count');
const currentRoomTitle = document.getElementById('current-room-title');

const sessionIdDisplay = document.getElementById('session-id-display');
const btnCopyLink = document.getElementById('btn-copy-link');
const copyToast = document.getElementById('copy-toast');

const typingIndicator = document.getElementById('typing-indicator');
const typingUsersText = document.getElementById('typing-users-text');

// App State
let ws = null;
let currentUsername = '';
let currentRoom = '';
let typingTimeout = null;
let activeTypers = new Set();
let typingDisplayTimeout = null;

// Routing Logic
const urlParams = new URLSearchParams(window.location.search);
let roomParam = urlParams.get('room');

if (!roomParam) {
    // Auto-generate private room ID
    roomParam = 'hq-' + Math.random().toString(36).substring(2, 8);
    window.history.replaceState(null, '', '?room=' + roomParam);
}
currentRoom = roomParam;

// Initialization
const savedUser = sessionStorage.getItem('echohq_user');
if (savedUser) {
    currentUsername = savedUser;
    initApp();
} else {
    loginModal.classList.add('active');
}

// Event Listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (name) {
        currentUsername = name;
        sessionStorage.setItem('echohq_user', name);
        initApp();
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (!msg || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    // Check for whisper command: /whisper username message
    const whisperMatch = msg.match(/^\/whisper\s+(\w+)\s+(.+)/i) || msg.match(/^\/w\s+(\w+)\s+(.+)/i);
    
    if (whisperMatch) {
        const target = whisperMatch[1];
        const text = whisperMatch[2];
        ws.send(JSON.stringify({
            type: 'whisper',
            target: target,
            text: text
        }));
    } else {
        // Normal chat
        ws.send(JSON.stringify({
            type: 'chat',
            text: msg,
            time: new Date().toISOString()
        }));
    }
    
    messageInput.value = '';
    messageInput.focus();
    
    // Stop typing
    ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
});

// Typing Indicator Logic
messageInput.addEventListener('input', () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({ type: 'typing', isTyping: true }));
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
    }, 2000);
});

// Copy Invite Link Logic
btnCopyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        copyToast.style.opacity = '1';
        setTimeout(() => {
            copyToast.style.opacity = '0';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
    });
});


// WebSocket Implementation
function initApp() {
    loginModal.classList.remove('active');
    setTimeout(() => {
        appContainer.classList.remove('hidden');
        myUsernameDisplay.textContent = currentUsername;
        myAvatar.textContent = currentUsername.charAt(0).toUpperCase();
        
        currentRoomTitle.innerHTML = `<i class='bx bx-lock-alt'></i> ${currentRoom}`;
        sessionIdDisplay.textContent = currentRoom;
        
        initWebSocket();
    }, 300);
}

function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Dynamically connect to the same host and port used for serving HTTP
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        connectionStatus.className = 'connection-status-pill connected';
        connectionStatus.innerHTML = `<div class="status-dot"></div> Connected`;
        
        ws.send(JSON.stringify({
            type: 'join',
            sender: currentUsername,
            room: currentRoom,
            time: new Date().toISOString()
        }));
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'history') {
                messagesContainer.innerHTML = '';
                data.messages.forEach(msg => processIncomingMessage(msg));
                scrollToBottom();
            } else if (data.type === 'users_update') {
                updateUsersSidebar(data.users);
            } else if (data.type === 'typing') {
                handleTypingEvent(data);
            } else {
                processIncomingMessage(data);
                scrollToBottom();
            }
        } catch(e) {
            console.error("Parse error", e);
        }
    };
    
    ws.onclose = () => {
        connectionStatus.className = 'connection-status-pill disconnected';
        connectionStatus.innerHTML = `<div class="status-dot"></div> Disconnected`;
        appendSystemMessage('Connection lost. Reconnecting in 3s...');
        updateUsersSidebar([currentUsername]);
        setTimeout(initWebSocket, 3000);
    };
}

function processIncomingMessage(data) {
    if (data.type === 'system') {
        const timeStr = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
        const timestamp = timeStr ? ` [${timeStr}]` : '';
        appendSystemMessage(`${data.sender} ${data.text}${timestamp}`);
    } else if (data.type === 'chat' || data.type === 'whisper') {
        const isSentByMe = (data.sender === currentUsername);
        appendMessage(data, isSentByMe);
    }
}

function handleTypingEvent(data) {
    if (data.isTyping) {
        activeTypers.add(data.sender);
    } else {
        activeTypers.delete(data.sender);
    }
    
    updateTypingUI();
    
    // Auto-hide after 3 seconds of no updates
    clearTimeout(typingDisplayTimeout);
    typingDisplayTimeout = setTimeout(() => {
        activeTypers.clear();
        updateTypingUI();
    }, 3000);
}

function updateTypingUI() {
    if (activeTypers.size === 0) {
        typingIndicator.classList.add('hidden');
        return;
    }
    
    const typersArray = Array.from(activeTypers);
    let text = typersArray[0];
    if (typersArray.length === 2) text += ` and ${typersArray[1]}`;
    else if (typersArray.length > 2) text += ` and ${typersArray.length - 1} others`;
    
    typingUsersText.textContent = text;
    typingIndicator.classList.remove('hidden');
}

// Markdown Parser
function parseMarkdown(text) {
    let parsed = escapeHTML(text);
    // Bold: **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline Code: `code`
    parsed = parsed.replace(/`(.*?)`/g, '<code>$1</code>');
    return parsed;
}

// DOM Updates
function appendMessage(data, isSentByMe) {
    const msgDiv = document.createElement('div');
    const isWhisper = data.type === 'whisper';
    
    let classes = `message ${isSentByMe ? 'sent' : 'received'}`;
    if (isWhisper) classes += ' whisper';
    msgDiv.className = classes;
    
    const timeStr = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
    
    let senderDisplay = escapeHTML(data.sender);
    if (isWhisper) {
        senderDisplay = isSentByMe ? `Whisper to ${escapeHTML(data.to)}` : `Whisper from ${escapeHTML(data.sender)}`;
    }
    
    msgDiv.innerHTML = `
        <div class="message-meta">
            <span class="sender-name">${senderDisplay}</span>
            <span class="time">${timeStr}</span>
        </div>
        <div class="message-content">${parseMarkdown(data.text)}</div>
    `;
    
    messagesContainer.appendChild(msgDiv);
}

function appendSystemMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message system';
    msgDiv.innerHTML = `<div class="message-content">${escapeHTML(text)}</div>`;
    messagesContainer.appendChild(msgDiv);
}

function updateUsersSidebar(users) {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    
    users.forEach(username => {
        const li = document.createElement('li');
        const isMe = (username === currentUsername);
        
        const hue = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
        const avatarBg = `hsl(${hue}, 60%, 40%)`;
        const avatarInitial = username.charAt(0).toUpperCase();

        li.className = `user-item ${isMe ? 'hidden' : ''}`; // Hide me from list since I have a dedicated profile block up top
        
        if (!isMe) {
            li.innerHTML = `
                <div class="avatar" style="background: ${avatarBg}; color: #fff;">${avatarInitial}</div>
                <span>${escapeHTML(username)}</span>
            `;
            usersList.appendChild(li);
        }
    });
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}
