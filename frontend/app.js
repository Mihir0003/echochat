// DOM Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const loginRoomInput = document.getElementById('login-room-input');

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
const roomCodeInput = document.getElementById('room-code-input');
const btnJoinRoom = document.getElementById('btn-join-room');
const topRoomCodeInput = document.getElementById('top-room-code-input');
const btnTopJoinRoom = document.getElementById('btn-top-join-room');
const bottomRoomCodeInput = document.getElementById('bottom-room-code-input');
const btnBottomJoinRoom = document.getElementById('btn-bottom-join-room');
const btnCopyLink = document.getElementById('btn-copy-link');
const copyToast = document.getElementById('copy-toast');

const typingIndicator = document.getElementById('typing-indicator');
const typingUsersText = document.getElementById('typing-users-text');

const btnEmoji = document.getElementById('btn-emoji');
const btnGif = document.getElementById('btn-gif');
const btnAttach = document.getElementById('btn-attach');
const fileInput = document.getElementById('file-input');
const attachmentPreview = document.getElementById('attachment-preview');
const mediaPickerEl = document.getElementById('media-picker');

// App State
let ws = null;
let currentUsername = '';
let currentRoom = '';
let typingTimeout = null;
let activeTypers = new Set();
let typingDisplayTimeout = null;
let backendOrigin = '';
let pendingAttachments = [];
let mediaPicker = null;
let isUploading = false;

// Routing Logic
const urlParams = new URLSearchParams(window.location.search);
let roomParam = urlParams.get('room');
const backendParam = urlParams.get('backend');

if (!roomParam) {
    // Auto-generate private room ID
    roomParam = 'hq-' + Math.random().toString(36).substring(2, 8);
}
currentRoom = normalizeRoomCode(roomParam);
backendOrigin = resolveBackendOrigin(backendParam);
updateBrowserUrl();

// Initialization
const savedUser = sessionStorage.getItem('echohq_user');
if (savedUser) {
    usernameInput.value = savedUser;
}
loginModal.classList.add('active');

// Event Listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    const requestedRoom = normalizeRoomCode(loginRoomInput.value || currentRoom);
    if (name) {
        currentUsername = name;
        currentRoom = requestedRoom;
        updateBrowserUrl();
        sessionStorage.setItem('echohq_user', name);
        initApp();
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if ((!msg && !pendingAttachments.length) || !ws || ws.readyState !== WebSocket.OPEN || isUploading) return;

    const attachments = pendingAttachments.map(a => ({
        type: a.type,
        url: a.url,
        name: a.name || ''
    }));

    const whisperMatch = msg.match(/^\/whisper\s+(\w+)\s+(.+)/i) || msg.match(/^\/w\s+(\w+)\s+(.+)/i);

    if (whisperMatch) {
        ws.send(JSON.stringify({
            type: 'whisper',
            target: whisperMatch[1],
            text: whisperMatch[2],
            attachments: attachments.length ? attachments : undefined
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'chat',
            text: msg,
            attachments: attachments.length ? attachments : undefined,
            time: new Date().toISOString()
        }));
    }

    messageInput.value = '';
    autoResizeTextarea();
    pendingAttachments = [];
    renderAttachmentPreview();
    messageInput.focus();
    mediaPicker?.close();

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

btnJoinRoom.addEventListener('click', () => {
    const nextRoom = normalizeRoomCode(roomCodeInput.value);
    joinRoom(nextRoom);
});

btnTopJoinRoom.addEventListener('click', () => {
    const nextRoom = normalizeRoomCode(topRoomCodeInput.value);
    joinRoom(nextRoom);
});

btnBottomJoinRoom.addEventListener('click', () => {
    const nextRoom = normalizeRoomCode(bottomRoomCodeInput.value);
    joinRoom(nextRoom);
});

roomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnJoinRoom.click();
    }
});

topRoomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnTopJoinRoom.click();
    }
});

bottomRoomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnBottomJoinRoom.click();
    }
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.requestSubmit();
    }
});

messageInput.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) files.push(file);
        }
    }
    if (files.length) {
        e.preventDefault();
        handleFiles(files);
    }
});

messageInput.addEventListener('input', autoResizeTextarea);

btnEmoji.addEventListener('click', (e) => {
    e.stopPropagation();
    mediaPicker?.toggle('emoji');
    btnEmoji.classList.toggle('active', mediaPicker?.activePanel === 'emoji');
    btnGif.classList.remove('active');
});

btnGif.addEventListener('click', (e) => {
    e.stopPropagation();
    mediaPicker?.toggle('gif');
    btnGif.classList.toggle('active', mediaPicker?.activePanel === 'gif');
    btnEmoji.classList.remove('active');
});

btnAttach.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) {
        handleFiles(Array.from(fileInput.files));
        fileInput.value = '';
    }
});

messagesContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    messagesContainer.classList.add('drag-over');
});

messagesContainer.addEventListener('dragleave', () => {
    messagesContainer.classList.remove('drag-over');
});

messagesContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    messagesContainer.classList.remove('drag-over');
    if (e.dataTransfer?.files?.length) {
        handleFiles(Array.from(e.dataTransfer.files));
    }
});

function initMediaPicker() {
    if (!window.MediaPicker) return;
    mediaPicker = new MediaPicker({
        pickerEl: mediaPickerEl,
        emojiPanel: document.getElementById('emoji-panel'),
        gifPanel: document.getElementById('gif-panel'),
        emojiSearch: document.getElementById('emoji-search'),
        emojiGrid: document.getElementById('emoji-grid'),
        emojiTabs: document.getElementById('emoji-tabs'),
        gifSearch: document.getElementById('gif-search'),
        gifGrid: document.getElementById('gif-grid'),
        gifSearchBtn: document.getElementById('gif-search-btn'),
        onEmojiSelect: (emoji) => {
            const start = messageInput.selectionStart;
            const end = messageInput.selectionEnd;
            const val = messageInput.value;
            messageInput.value = val.slice(0, start) + emoji + val.slice(end);
            messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
            messageInput.focus();
            autoResizeTextarea();
        },
        onGifSelect: (gif) => {
            pendingAttachments.push({
                type: 'gif',
                url: gif.url,
                preview: gif.preview,
                name: 'GIF'
            });
            renderAttachmentPreview();
            messageInput.focus();
        },
        onClose: () => {
            btnEmoji.classList.remove('active');
            btnGif.classList.remove('active');
        }
    });
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

async function handleFiles(files) {
    for (const file of files) {
        await uploadFile(file);
    }
}

async function uploadFile(file) {
    const tempId = 'temp-' + Date.now() + Math.random();
    pendingAttachments.push({
        id: tempId,
        type: 'uploading',
        name: file.name,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    });
    renderAttachmentPreview();
    isUploading = true;

    try {
        const formData = new FormData();
        formData.append('file', file);
        const origin = backendOrigin || window.location.origin;
        const res = await fetch(`${origin}/api/upload`, { method: 'POST', body: formData });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Upload failed');
        }
        const data = await res.json();
        const idx = pendingAttachments.findIndex(a => a.id === tempId);
        if (idx !== -1) {
            pendingAttachments[idx] = {
                type: data.type,
                url: data.url,
                name: data.name,
                preview: data.type === 'image' ? data.url : pendingAttachments[idx].preview
            };
        }
    } catch (err) {
        pendingAttachments = pendingAttachments.filter(a => a.id !== tempId);
        appendSystemMessage(`Upload failed: ${err.message}`);
    } finally {
        isUploading = false;
        renderAttachmentPreview();
    }
}

function renderAttachmentPreview() {
    if (!pendingAttachments.length) {
        attachmentPreview.classList.add('hidden');
        attachmentPreview.innerHTML = '';
        return;
    }

    attachmentPreview.classList.remove('hidden');
    attachmentPreview.innerHTML = pendingAttachments.map((att, i) => {
        let preview = '';
        if (att.type === 'uploading') {
            preview = att.preview
                ? `<img src="${att.preview}" alt="" class="preview-thumb">`
                : `<div class="preview-file"><i class='bx bx-loader-alt bx-spin'></i></div>`;
        } else if (att.type === 'gif' || att.type === 'image') {
            preview = `<img src="${att.preview || att.url}" alt="" class="preview-thumb">`;
        } else if (att.type === 'audio') {
            preview = `<div class="preview-file"><i class='bx bx-music'></i></div>`;
        } else if (att.type === 'video') {
            preview = `<div class="preview-file"><i class='bx bx-video'></i></div>`;
        } else {
            preview = `<div class="preview-file"><i class='bx bx-file'></i></div>`;
        }
        const label = escapeHTML(att.name || att.type);
        return `
            <div class="preview-item">
                ${preview}
                <span class="preview-name">${label}</span>
                <button type="button" class="preview-remove" data-index="${i}" aria-label="Remove attachment">&times;</button>
            </div>
        `;
    }).join('');

    attachmentPreview.querySelectorAll('.preview-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            pendingAttachments.splice(parseInt(btn.dataset.index), 1);
            renderAttachmentPreview();
        });
    });
}

function renderAttachmentsHTML(attachments) {
    if (!attachments?.length) return '';
    return `<div class="message-attachments">${attachments.map(att => {
        const url = escapeHTML(att.url);
        const name = escapeHTML(att.name || 'file');
        if (att.type === 'gif' || att.type === 'image') {
            return `<a href="${url}" target="_blank" rel="noopener" class="msg-att-image"><img src="${url}" alt="${name}" loading="lazy"></a>`;
        }
        if (att.type === 'audio') {
            return `<div class="msg-att-audio"><audio controls preload="metadata" src="${url}"></audio><span>${name}</span></div>`;
        }
        if (att.type === 'video') {
            return `<div class="msg-att-video"><video controls preload="metadata" src="${url}"></video></div>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener" class="msg-att-file"><i class='bx bx-download'></i> ${name}</a>`;
    }).join('')}</div>`;
}


// WebSocket Implementation
function initApp() {
    loginModal.classList.remove('active');
    setTimeout(() => {
        appContainer.classList.remove('hidden');
        myUsernameDisplay.textContent = currentUsername;
        myAvatar.textContent = currentUsername.charAt(0).toUpperCase();
        
        currentRoomTitle.innerHTML = `<i class='bx bx-lock-alt'></i> ${currentRoom}`;
        sessionIdDisplay.textContent = currentRoom;
        roomCodeInput.value = currentRoom;
        topRoomCodeInput.value = currentRoom;
        bottomRoomCodeInput.value = currentRoom;
        loginRoomInput.value = currentRoom;
        
        initMediaPicker();
        initWebSocket();
    }, 300);
}

function initWebSocket() {
    const wsUrl = getWebSocketUrl();
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

function joinRoom(roomCode) {
    if (!roomCode || roomCode === currentRoom) return;

    const oldRoom = currentRoom;
    currentRoom = roomCode;
    updateBrowserUrl();

    currentRoomTitle.innerHTML = `<i class='bx bx-lock-alt'></i> ${currentRoom}`;
    sessionIdDisplay.textContent = currentRoom;
    roomCodeInput.value = currentRoom;
    topRoomCodeInput.value = currentRoom;
    bottomRoomCodeInput.value = currentRoom;
    messagesContainer.innerHTML = '';

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'switch_room',
            room: currentRoom,
            from: oldRoom
        }));
    } else {
        appendSystemMessage(`Switched to #${currentRoom}. Reconnecting...`);
    }
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
    
    const textHtml = data.text ? parseMarkdown(data.text) : '';
    const attHtml = renderAttachmentsHTML(data.attachments);
    const hasAttachments = !!data.attachments?.length;

    msgDiv.innerHTML = `
        <div class="message-meta">
            <span class="sender-name">${senderDisplay}</span>
            <span class="time">${timeStr}</span>
        </div>
        <div class="message-content ${hasAttachments && !textHtml ? 'attachments-only' : ''}">
            ${textHtml || ''}
            ${attHtml}
        </div>
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

function normalizeRoomCode(rawCode) {
    const cleaned = (rawCode || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 32);

    return cleaned || 'hq-' + Math.random().toString(36).substring(2, 8);
}

function resolveBackendOrigin(rawParam) {
    const configured = window.ECHOCHAT_CONFIG?.backendOrigin || '';
    const stored = localStorage.getItem('echohq_backend_origin');
    const candidate = (rawParam || configured || stored || '').trim();
    const clean = sanitizeBackendOrigin(candidate);
    if (clean) {
        localStorage.setItem('echohq_backend_origin', clean);
        return clean;
    }
    return window.location.origin;
}

function sanitizeBackendOrigin(value) {
    if (!value) return '';
    try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        return parsed.origin;
    } catch (_) {
        return '';
    }
}

function getWebSocketUrl() {
    const origin = backendOrigin || window.location.origin;
    const parsed = new URL(origin);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}/ws`;
}

function updateBrowserUrl() {
    const params = new URLSearchParams();
    params.set('room', currentRoom);
    if (backendOrigin && backendOrigin !== window.location.origin) {
        params.set('backend', backendOrigin);
    }
    window.history.replaceState(null, '', `?${params.toString()}`);
}
