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
const btnTheme = document.getElementById('btn-theme');
const btnThemeLogin = document.getElementById('btn-theme-login');

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
let reconnectTimer = null;
let connectionNoticeEl = null;
let isConnecting = false;

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
initThemeToggle();

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
        const myAvatarMeta = getUserAvatarMeta(currentUsername);
        myAvatar.textContent = myAvatarMeta.initial;
        myAvatar.style.background = myAvatarMeta.bg;
        myAvatar.style.color = '#ffffff';
        
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

async function initWebSocket() {
    if (isConnecting) return;
    isConnecting = true;

    const backend = getBackendOrigin();
    const wsUrl = getWebSocketUrl();

    connectionStatus.className = 'connection-status-pill disconnected';
    connectionStatus.innerHTML = `<div class="status-dot"></div> Connecting...`;
    setConnectionNotice(`Connecting to ${backend}...`);

    const healthy = await checkBackendHealth(backend);
    if (!healthy) {
        connectionStatus.className = 'connection-status-pill disconnected';
        connectionStatus.innerHTML = `<div class="status-dot"></div> Disconnected`;
        setConnectionNotice(
            `Cannot reach chat server at ${backend}. ` +
            'Deploy the backend on Render, then set ECHOCHAT_BACKEND_URL in Vercel to that URL. Retrying in 5s...'
        );
        updateUsersSidebar([currentUsername]);
        isConnecting = false;
        scheduleReconnect(5000);
        return;
    }

    if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
    }

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        isConnecting = false;
        clearReconnectTimer();
        clearConnectionNotice();
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
                connectionNoticeEl = null;
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
        } catch (e) {
            console.error('Parse error', e);
        }
    };

    ws.onerror = () => {
        setConnectionNotice(`WebSocket error while connecting to ${wsUrl}. Retrying...`);
    };

    ws.onclose = () => {
        isConnecting = false;
        connectionStatus.className = 'connection-status-pill disconnected';
        connectionStatus.innerHTML = `<div class="status-dot"></div> Disconnected`;
        setConnectionNotice(`Connection lost to ${backend}. Reconnecting in 3s...`);
        updateUsersSidebar([currentUsername]);
        scheduleReconnect(3000);
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
        appendSystemMessage(`${data.sender} ${data.text}`, {
            time: data.time,
            kind: getSystemMessageKind(data.text)
        });
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

    const timeStr = formatMessageTime(data.time);
    const avatar = getUserAvatarMeta(data.sender);

    let senderDisplay = escapeHTML(data.sender);
    if (isWhisper) {
        senderDisplay = isSentByMe ? `Whisper to ${escapeHTML(data.to)}` : `Whisper from ${escapeHTML(data.sender)}`;
    }

    const textHtml = data.text ? parseMarkdown(data.text) : '';
    const attHtml = renderAttachmentsHTML(data.attachments);
    const hasAttachments = !!data.attachments?.length;
    const avatarHtml = isSentByMe ? '' : `
        <div class="msg-avatar" style="background:${avatar.bg};">${avatar.initial}</div>
    `;

    msgDiv.innerHTML = `
        <div class="message-row">
            ${avatarHtml}
            <div class="message-body">
                <div class="message-meta">
                    <span class="sender-name">${senderDisplay}</span>
                </div>
                <div class="message-content ${hasAttachments && !textHtml ? 'attachments-only' : ''}">
                    ${textHtml ? `<span class="message-text">${textHtml}</span>` : ''}
                    ${attHtml}
                    <span class="message-time">${timeStr}</span>
                </div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(msgDiv);
}

function appendSystemMessage(text, options = {}) {
    const { time = '', kind = 'info', icon = '' } = options;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message system';

    const iconClass = icon || getSystemIcon(kind);
    const badgeClass = kind === 'join' ? 'system-badge join-event' : 'system-badge';
    const timeStr = time ? formatMessageTime(time) : formatMessageTime(new Date().toISOString());

    msgDiv.innerHTML = `
        <div class="${badgeClass}">
            <i class='bx ${iconClass}'></i>
            <span>${escapeHTML(text)}</span>
            <span class="system-time">${timeStr}</span>
        </div>
    `;
    messagesContainer.appendChild(msgDiv);
}

function getSystemMessageKind(text) {
    const value = (text || '').toLowerCase();
    if (value.includes('joined')) return 'join';
    if (value.includes('left')) return 'leave';
    if (value.includes('connection') || value.includes('reconnect') || value.includes('reach chat server')) {
        return 'connection';
    }
    return 'info';
}

function getSystemIcon(kind) {
    if (kind === 'join') return 'bx-log-in-circle';
    if (kind === 'leave') return 'bx-log-out-circle';
    if (kind === 'connection') return 'bx-wifi-off';
    return 'bx-info-circle';
}

function getUserAvatarMeta(username) {
    const safeName = username || '?';
    const hue = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    return {
        bg: `hsl(${hue}, 58%, 42%)`,
        initial: safeName.charAt(0).toUpperCase()
    };
}

function formatMessageTime(value) {
    if (!value) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initThemeToggle() {
    const buttons = [btnTheme, btnThemeLogin].filter(Boolean);
    buttons.forEach((button) => {
        button.addEventListener('click', toggleTheme);
    });
    applyTheme(getStoredTheme(), false);
}

function getStoredTheme() {
    const saved = localStorage.getItem('echohq_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme, persist = true) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
        localStorage.setItem('echohq_theme', theme);
    }
    updateThemeToggleIcons(theme);
}

function toggleTheme() {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
}

function updateThemeToggleIcons(theme) {
    const iconClass = theme === 'dark' ? 'bx-sun' : 'bx-moon';
    [btnTheme, btnThemeLogin].filter(Boolean).forEach((button) => {
        button.innerHTML = `<i class='bx ${iconClass}'></i>`;
        button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        button.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
    });
}

function updateUsersSidebar(users) {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    
    users.forEach(username => {
        const li = document.createElement('li');
        const isMe = (username === currentUsername);
        
        const avatar = getUserAvatarMeta(username);
        const avatarBg = avatar.bg;
        const avatarInitial = avatar.initial;

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

function isLocalDevHost() {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
}

function resolveBackendOrigin(rawParam) {
    if (isLocalDevHost()) {
        return window.location.origin;
    }

    if (rawParam) {
        const fromParam = sanitizeBackendOrigin(rawParam);
        if (fromParam) {
            localStorage.setItem('echohq_backend_origin', fromParam);
            return fromParam;
        }
    }

    const configured = sanitizeBackendOrigin(window.ECHOCHAT_CONFIG?.backendOrigin || '');
    if (configured && configured !== window.location.origin) {
        localStorage.setItem('echohq_backend_origin', configured);
        return configured;
    }

    const stored = sanitizeBackendOrigin(localStorage.getItem('echohq_backend_origin') || '');
    if (stored && stored !== window.location.origin) {
        return stored;
    }

    return window.location.origin;
}

function getBackendOrigin() {
    return backendOrigin || window.location.origin;
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
    const origin = getBackendOrigin();
    const parsed = new URL(origin);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}/ws`;
}

async function checkBackendHealth(origin) {
    try {
        const response = await fetch(`${origin}/health`, { method: 'GET', mode: 'cors' });
        if (!response.ok) return false;
        const data = await response.json();
        return data.status === 'ok';
    } catch (_) {
        return false;
    }
}

function scheduleReconnect(delayMs) {
    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        initWebSocket();
    }, delayMs);
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function setConnectionNotice(text) {
    if (!connectionNoticeEl) {
        connectionNoticeEl = document.createElement('div');
        connectionNoticeEl.className = 'message system connection-notice';
        connectionNoticeEl.innerHTML = `
            <div class="system-badge connection-notice-badge">
                <i class='bx bx-wifi-off'></i>
                <span class="connection-notice-text"></span>
                <span class="system-time">${formatMessageTime(new Date().toISOString())}</span>
            </div>
        `;
        messagesContainer.appendChild(connectionNoticeEl);
    }
    const noticeText = connectionNoticeEl.querySelector('.connection-notice-text');
    if (noticeText) noticeText.textContent = text;
    scrollToBottom();
}

function clearConnectionNotice() {
    if (connectionNoticeEl) {
        connectionNoticeEl.remove();
        connectionNoticeEl = null;
    }
}

function updateBrowserUrl() {
    const params = new URLSearchParams();
    params.set('room', currentRoom);
    if (backendOrigin && backendOrigin !== window.location.origin) {
        params.set('backend', backendOrigin);
    }
    window.history.replaceState(null, '', `?${params.toString()}`);
}
