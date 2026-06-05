// Emoji & GIF picker module for EchoChat

const EMOJI_CATEGORIES = [
    {
        id: 'smileys',
        label: '😀 Smileys',
        emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾']
    },
    {
        id: 'gestures',
        label: '👋 Gestures',
        emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','💋','🩸']
    },
    {
        id: 'people',
        label: '👤 People',
        emojis: ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🕴️','👯','🧖','🧗','🤸','🏌️','🏇','⛷️','🏂','🏋️','🤼','🤽','🤾','🤺','⛹️','🏊','🚣','🧘','🛀','🛌']
    },
    {
        id: 'animals',
        label: '🐶 Animals',
        emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔']
    },
    {
        id: 'food',
        label: '🍕 Food',
        emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️','🥣','🥡','🥢','🧂']
    },
    {
        id: 'travel',
        label: '✈️ Travel',
        emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🪝','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🛖','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️','🛤️','🛣️','🗾','🎑','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁']
    },
    {
        id: 'objects',
        label: '💡 Objects',
        emojis: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓']
    },
    {
        id: 'symbols',
        label: '❤️ Symbols',
        emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧']
    },
    {
        id: 'flags',
        label: '🏳️ Flags',
        emojis: ['🏳️','🏴','🏴‍☠️','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇩🇪','🇫🇷','🇮🇹','🇪🇸','🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇧🇷','🇲🇽','🇷🇺','🇿🇦','🇳🇬','🇪🇬','🇸🇦','🇦🇪','🇹🇷','🇵🇰','🇧🇩','🇮🇩','🇵🇭','🇻🇳','🇹🇭','🇸🇬','🇲🇾','🇳🇿','🇮🇪','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇵🇱','🇺🇦','🇮🇱','🇦🇷','🇨🇱','🇨🇴','🇵🇪']
    }
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap(c => c.emojis);
const TENOR_API_KEY = 'AIzaSyCILcKZhN3QA94QL57Zu0ZJ5KHSY80w5a';
const GIPHY_API_KEY = 'YOUR_GIPHY_API_KEY';

const GIF_FETCH_LIMIT = 100;
const GIF_SCROLL_THRESHOLD = 80;
const TRENDING_CACHE_KEY = '__trending__';

class MediaPicker {
    constructor(options) {
        this.onEmojiSelect = options.onEmojiSelect;
        this.onGifSelect = options.onGifSelect;
        this.onClose = options.onClose || (() => {});
        this.pickerEl = options.pickerEl;
        this.emojiPanel = options.emojiPanel;
        this.gifPanel = options.gifPanel;
        this.emojiSearch = options.emojiSearch;
        this.emojiGrid = options.emojiGrid;
        this.emojiTabs = options.emojiTabs;
        this.gifSearch = options.gifSearch;
        this.gifGrid = options.gifGrid;
        this.gifSearchBtn = options.gifSearchBtn;
        this.activePanel = null;
        this.activeCategory = 'smileys';
        this.gifSearchTimeout = null;

        this.gifCache = {};
        this.currentGifQuery = '';
        this.mergedGifResults = [];
        this.seenGifUrls = new Set();
        this.tenorNextPos = null;
        this.giphyOffset = 0;
        this.giphyHasMore = true;
        this.tenorHasMore = true;
        this.gifLoading = false;
        this.gifLoadMoreBtn = null;

        this.init();
    }

    init() {
        this.renderEmojiTabs();
        this.renderEmojis();
        this.bindEvents();
        this.setupGifPanel();
        this.loadTrendingGifs();
    }

    setupGifPanel() {
        const footer = this.gifPanel.querySelector('.picker-footer');
        if (footer) {
            footer.textContent = 'Powered by Tenor & Giphy';
        }

        this.gifLoadMoreBtn = document.createElement('button');
        this.gifLoadMoreBtn.type = 'button';
        this.gifLoadMoreBtn.className = 'gif-load-more hidden';
        this.gifLoadMoreBtn.textContent = 'Load More GIFs';
        this.gifLoadMoreBtn.addEventListener('click', () => this.loadMoreGifs());

        if (footer) {
            this.gifPanel.insertBefore(this.gifLoadMoreBtn, footer);
        } else {
            this.gifPanel.appendChild(this.gifLoadMoreBtn);
        }
    }

    bindEvents() {
        this.emojiSearch.addEventListener('input', () => this.filterEmojis());
        this.gifSearch.addEventListener('input', () => {
            clearTimeout(this.gifSearchTimeout);
            this.gifSearchTimeout = setTimeout(() => this.searchGifs(), 400);
        });
        this.gifSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(this.gifSearchTimeout);
                this.searchGifs();
            }
        });
        this.gifSearchBtn.addEventListener('click', () => {
            clearTimeout(this.gifSearchTimeout);
            this.searchGifs();
        });

        this.gifGrid.addEventListener('scroll', () => this.handleGifScroll());

        document.addEventListener('click', (e) => {
            if (!this.pickerEl.contains(e.target) && !e.target.closest('.composer-btn')) {
                this.close();
            }
        });
    }

    renderEmojiTabs() {
        this.emojiTabs.innerHTML = EMOJI_CATEGORIES.map(cat => `
            <button type="button" class="picker-tab ${cat.id === this.activeCategory ? 'active' : ''}" data-category="${cat.id}" title="${cat.label}">
                ${cat.emojis[0]}
            </button>
        `).join('');

        this.emojiTabs.querySelectorAll('.picker-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeCategory = btn.dataset.category;
                this.emojiSearch.value = '';
                this.emojiTabs.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this.renderEmojis();
            });
        });
    }

    renderEmojis(filter = '') {
        const query = filter.toLowerCase().trim();
        let emojis;

        if (query) {
            emojis = ALL_EMOJIS.filter(e => e.includes(query) || this.emojiMatchesSearch(e, query));
        } else {
            const cat = EMOJI_CATEGORIES.find(c => c.id === this.activeCategory);
            emojis = cat ? cat.emojis : ALL_EMOJIS;
        }

        if (!emojis.length) {
            this.emojiGrid.innerHTML = '<div class="picker-empty">No emojis found</div>';
            return;
        }

        this.emojiGrid.innerHTML = emojis.map(e => `
            <button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>
        `).join('');

        this.emojiGrid.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.onEmojiSelect(btn.dataset.emoji);
            });
        });
    }

    emojiMatchesSearch(emoji, query) {
        return emoji === query;
    }

    filterEmojis() {
        const query = this.emojiSearch.value.toLowerCase().trim();
        if (!query) {
            this.renderEmojis();
            return;
        }

        const matchedCategories = EMOJI_CATEGORIES.filter(cat =>
            cat.label.toLowerCase().includes(query) || cat.id.includes(query)
        );

        let emojis = ALL_EMOJIS.filter(e => e.includes(query));
        if (matchedCategories.length) {
            const fromCats = matchedCategories.flatMap(c => c.emojis);
            emojis = [...new Set([...emojis, ...fromCats])];
        }

        if (!emojis.length) {
            this.emojiGrid.innerHTML = '<div class="picker-empty">No emojis found</div>';
            return;
        }

        this.emojiGrid.innerHTML = emojis.map(e => `
            <button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>
        `).join('');

        this.emojiGrid.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => this.onEmojiSelect(btn.dataset.emoji));
        });
    }

    getGifCacheKey(query) {
        return query ? query.toLowerCase().trim() : TRENDING_CACHE_KEY;
    }

    escapeAttr(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    normalizeTenorResults(results) {
        const normalized = [];
        (results || []).forEach(item => {
            const media = item.media_formats?.tinygif || item.media_formats?.gif;
            const full = item.media_formats?.gif || media;
            if (!media || !full?.url) return;
            normalized.push({
                url: full.url,
                preview: media.url,
                title: item.content_description || 'GIF'
            });
        });
        return normalized;
    }

    normalizeGiphyResults(results) {
        const normalized = [];
        (results || []).forEach(item => {
            const preview = item.images?.fixed_height_small || item.images?.preview_gif || item.images?.downsized_small;
            const full = item.images?.original || item.images?.downsized_medium || preview;
            if (!preview?.url || !full?.url) return;
            normalized.push({
                url: full.url,
                preview: preview.url,
                title: item.title || 'GIF'
            });
        });
        return normalized;
    }

    mergeGifResults(newResults, seenUrls = this.seenGifUrls) {
        const unique = [];
        newResults.forEach(gif => {
            if (!gif.url || seenUrls.has(gif.url)) return;
            seenUrls.add(gif.url);
            unique.push(gif);
        });
        return unique;
    }

    async fetchTenorGifs(query, pos = null) {
        const isTrending = !query;
        let url;

        if (isTrending) {
            url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=${GIF_FETCH_LIMIT}&media_filter=gif,tinygif`;
        } else {
            url = `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=${GIF_FETCH_LIMIT}&media_filter=gif,tinygif`;
            if (pos) {
                url += `&pos=${encodeURIComponent(pos)}`;
            }
        }

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('Tenor request failed');
        }

        const data = await res.json();
        return {
            results: this.normalizeTenorResults(data.results),
            nextPos: data.next || null
        };
    }

    async fetchGiphyGifs(query, offset = 0) {
        const isTrending = !query;
        let url;

        if (isTrending) {
            url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${GIF_FETCH_LIMIT}&offset=${offset}&rating=g`;
        } else {
            url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${GIF_FETCH_LIMIT}&offset=${offset}&rating=g`;
        }

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('Giphy request failed');
        }

        const data = await res.json();
        const pagination = data.pagination || {};
        const count = pagination.count || 0;
        const total = pagination.total_count || 0;
        const nextOffset = offset + count;

        return {
            results: this.normalizeGiphyResults(data.data),
            nextOffset,
            hasMore: nextOffset < total
        };
    }

    async fetchCombinedGifs({ query = '', append = false } = {}) {
        if (this.gifLoading) return null;
        this.gifLoading = true;
        this.updateLoadMoreButton();

        const cacheKey = this.getGifCacheKey(query);

        if (!append && this.gifCache[cacheKey]) {
            const cached = this.gifCache[cacheKey];
            this.restoreGifState(cached, query);
            this.renderMergedGifs(this.mergedGifResults, false);
            this.gifLoading = false;
            this.updateLoadMoreButton();
            return cached;
        }

        try {
            const tenorPos = append ? this.tenorNextPos : null;
            const giphyOffset = append ? this.giphyOffset : 0;

            const [tenorData, giphyData] = await Promise.all([
                this.fetchTenorGifs(query, tenorPos).catch(() => ({ results: [], nextPos: null })),
                this.fetchGiphyGifs(query, giphyOffset).catch(() => ({ results: [], nextOffset: giphyOffset, hasMore: false }))
            ]);

            const mergedBatch = this.mergeGifResults([
                ...tenorData.results,
                ...giphyData.results
            ]);

            if (append) {
                this.mergedGifResults = this.mergedGifResults.concat(mergedBatch);
            } else {
                this.seenGifUrls = new Set();
                this.mergedGifResults = this.mergeGifResults([
                    ...tenorData.results,
                    ...giphyData.results
                ], this.seenGifUrls);
            }

            this.tenorNextPos = tenorData.nextPos;
            this.giphyOffset = giphyData.nextOffset;
            this.tenorHasMore = !!tenorData.nextPos;
            this.giphyHasMore = giphyData.hasMore !== false && giphyData.results.length > 0;
            this.currentGifQuery = query;

            const cacheEntry = {
                query,
                results: this.mergedGifResults.slice(),
                seenUrls: Array.from(this.seenGifUrls),
                tenorNextPos: this.tenorNextPos,
                giphyOffset: this.giphyOffset,
                tenorHasMore: this.tenorHasMore,
                giphyHasMore: this.giphyHasMore
            };
            this.gifCache[cacheKey] = cacheEntry;

            return { mergedBatch, append };
        } finally {
            this.gifLoading = false;
            this.updateLoadMoreButton();
        }
    }

    restoreGifState(cached, query) {
        this.currentGifQuery = query;
        this.mergedGifResults = cached.results.slice();
        this.seenGifUrls = new Set(cached.seenUrls || []);
        this.tenorNextPos = cached.tenorNextPos || null;
        this.giphyOffset = cached.giphyOffset || 0;
        this.tenorHasMore = cached.tenorHasMore !== false;
        this.giphyHasMore = cached.giphyHasMore !== false;
    }

    async loadTrendingGifs() {
        this.currentGifQuery = '';
        this.gifGrid.innerHTML = '<div class="picker-loading">Loading GIFs...</div>';
        this.updateLoadMoreButton(true);

        try {
            const result = await this.fetchCombinedGifs({ query: '', append: false });
            if (result && result.results) {
                this.renderMergedGifs(result.results, false);
                return;
            }
            this.renderMergedGifs(this.mergedGifResults, false);
        } catch {
            this.gifGrid.innerHTML = '<div class="picker-empty">Could not load GIFs</div>';
            this.updateLoadMoreButton(true);
        }
    }

    async searchGifs() {
        const query = this.gifSearch.value.trim();
        if (!query) {
            this.loadTrendingGifs();
            return;
        }

        const cacheKey = this.getGifCacheKey(query);
        if (this.gifCache[cacheKey]) {
            const cached = this.gifCache[cacheKey];
            this.restoreGifState(cached, query);
            this.renderMergedGifs(this.mergedGifResults, false);
            return;
        }

        this.gifGrid.innerHTML = '<div class="picker-loading">Searching...</div>';
        this.updateLoadMoreButton(true);

        try {
            await this.fetchCombinedGifs({ query, append: false });
            this.renderMergedGifs(this.mergedGifResults, false);
        } catch {
            this.gifGrid.innerHTML = '<div class="picker-empty">Search failed</div>';
            this.updateLoadMoreButton(true);
        }
    }

    async loadMoreGifs() {
        if (this.gifLoading || !this.hasMoreGifs()) return;

        const query = this.currentGifQuery;
        this.updateLoadMoreButton();

        try {
            const result = await this.fetchCombinedGifs({ query, append: true });
            if (!result) return;

            const newBatch = result.mergedBatch || [];
            if (newBatch.length) {
                this.renderMergedGifs(newBatch, true);
            } else if (!this.mergedGifResults.length) {
                this.renderMergedGifs([], false);
            }
        } catch {
            // Keep existing results visible on pagination errors.
        }
    }

    hasMoreGifs() {
        return this.tenorHasMore || this.giphyHasMore;
    }

    handleGifScroll() {
        if (this.gifLoading || !this.hasMoreGifs()) return;

        const { scrollTop, clientHeight, scrollHeight } = this.gifGrid;
        if (scrollTop + clientHeight >= scrollHeight - GIF_SCROLL_THRESHOLD) {
            this.loadMoreGifs();
        }
    }

    updateLoadMoreButton(hide = false) {
        if (!this.gifLoadMoreBtn) return;

        if (hide || this.gifLoading) {
            this.gifLoadMoreBtn.classList.add('hidden');
            this.gifLoadMoreBtn.disabled = !!this.gifLoading;
            this.gifLoadMoreBtn.textContent = this.gifLoading ? 'Loading...' : 'Load More GIFs';
            return;
        }

        if (this.hasMoreGifs() && this.mergedGifResults.length) {
            this.gifLoadMoreBtn.classList.remove('hidden');
            this.gifLoadMoreBtn.disabled = false;
            this.gifLoadMoreBtn.textContent = 'Load More GIFs';
        } else {
            this.gifLoadMoreBtn.classList.add('hidden');
        }
    }

    buildGifButtonHtml(gif) {
        const url = this.escapeAttr(gif.url);
        const preview = this.escapeAttr(gif.preview);
        const title = this.escapeAttr(gif.title);
        return `
            <button type="button" class="gif-btn" data-url="${url}" data-preview="${preview}" title="${title}">
                <img src="${preview}" alt="GIF" loading="lazy" decoding="async">
            </button>
        `;
    }

    bindGifButtons(container) {
        container.querySelectorAll('.gif-btn').forEach(btn => {
            if (btn.dataset.bound === 'true') return;
            btn.dataset.bound = 'true';
            btn.addEventListener('click', () => {
                this.onGifSelect({
                    url: btn.dataset.url,
                    preview: btn.dataset.preview,
                    type: 'gif'
                });
                this.close();
            });
        });
    }

    renderMergedGifs(results, append = false) {
        if (!append) {
            if (!results.length) {
                this.gifGrid.innerHTML = '<div class="picker-empty">No GIFs found</div>';
                this.updateLoadMoreButton(true);
                return;
            }

            this.gifGrid.innerHTML = results.map(gif => this.buildGifButtonHtml(gif)).join('');
            this.bindGifButtons(this.gifGrid);
            this.updateLoadMoreButton();
            return;
        }

        const existingLoading = this.gifGrid.querySelector('.picker-loading');
        if (existingLoading) {
            existingLoading.remove();
        }

        if (!results.length) {
            this.updateLoadMoreButton();
            return;
        }

        const fragment = document.createElement('div');
        fragment.innerHTML = results.map(gif => this.buildGifButtonHtml(gif)).join('');
        const newButtons = Array.from(fragment.children);
        newButtons.forEach(node => this.gifGrid.appendChild(node));
        this.bindGifButtons(this.gifGrid);
        this.updateLoadMoreButton();
    }

    open(panel) {
        this.activePanel = panel;
        this.pickerEl.classList.remove('hidden');
        this.emojiPanel.classList.toggle('hidden', panel !== 'emoji');
        this.gifPanel.classList.toggle('hidden', panel !== 'gif');

        if (panel === 'gif' && !this.gifGrid.querySelector('.gif-btn') && !this.mergedGifResults.length) {
            this.loadTrendingGifs();
        }
    }

    close() {
        this.pickerEl.classList.add('hidden');
        this.activePanel = null;
        this.onClose();
    }

    toggle(panel) {
        if (this.activePanel === panel) {
            this.close();
        } else {
            this.open(panel);
        }
    }
}

window.MediaPicker = MediaPicker;
