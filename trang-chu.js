(() => {
  'use strict';

  /* ========================= HELPERS ========================= */
  const $ = (sel) => document.querySelector(sel);

  function flagEmoji(iso2) {
    if (!iso2 || iso2.length !== 2 || iso2 === '1W' || iso2 === 'ZH' || iso2 === 'XZ') return '🏳️';
    const cc = iso2.toUpperCase();
    return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
  }

  function fmtCompactUSD(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    const abs = Math.abs(n);
    let v, suf;
    if (abs >= 1e12) { v = n / 1e12; suf = 'T'; }
    else if (abs >= 1e9) { v = n / 1e9; suf = 'B'; }
    else if (abs >= 1e6) { v = n / 1e6; suf = 'M'; }
    else if (abs >= 1e3) { v = n / 1e3; suf = 'K'; }
    else { v = n; suf = ''; }
    return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + suf;
  }

  function fmtPrice(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }

  function fmtPct(n, withSign = true) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    const s = n > 0 && withSign ? '+' : '';
    return s + n.toFixed(2) + '%';
  }

  function pctClass(n) {
    if (n === null || n === undefined || isNaN(n)) return '';
    return n >= 0 ? 'up' : 'down';
  }

  function timeAgo(unixSeconds) {
    const diff = Math.max(0, Date.now() / 1000 - unixSeconds);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    return Math.floor(diff / 86400) + ' ngày trước';
  }

  function errorNote(msg, retryFn) {
    const wrap = document.createElement('div');
    wrap.className = 'error-note';
    wrap.textContent = msg + ' ';
    const btn = document.createElement('a');
    btn.href = 'javascript:void(0)';
    btn.textContent = 'Thử lại';
    btn.style.color = 'var(--accent)';
    btn.style.fontWeight = '700';
    btn.addEventListener('click', retryFn);
    wrap.appendChild(btn);
    return wrap;
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // Một số mạng/trình duyệt (tường lửa công ty, extension chặn quảng cáo/tracker, DNS lọc nội dung...) chặn
  // thẳng domain api.coingecko.com hoặc min-api.cryptocompare.com ở tầng fetch() (báo lỗi CORS/net::ERR_FAILED)
  // dù bản thân 2 API này vẫn hoạt động bình thường (mở thẳng URL trên trình duyệt vẫn ra dữ liệu, vì đó là
  // điều hướng trang chứ không bị áp CORS). Do đó: thử gọi trực tiếp trước, nếu thất bại thì tự động rơi qua
  // proxy allorigins.win (proxy này đang chạy tốt, thấy rõ qua việc phần tin tức RSS vẫn tải được bình thường).
  async function fetchJSONWithCorsFallback(url, opts) {
    try {
      return await fetchJSON(url, opts);
    } catch (e) {
      const res = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), opts);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }
  }

  /* ========================= CLOCK ========================= */
  function updateClock() {
    const now = new Date();
    const time = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
    const date = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(now);
    $('#clock-time').textContent = time;
    $('#clock-date').textContent = date + ' (GMT+7)';
  }

  /* ========================= GLOBAL SESSIONS ========================= */
  const SESSIONS = [
    { name: 'Sydney', flag: '🇦🇺', tz: 'Australia/Sydney' },
    { name: 'Tokyo', flag: '🇯🇵', tz: 'Asia/Tokyo' },
    { name: 'London', flag: '🇬🇧', tz: 'Europe/London' },
    { name: 'New York', flag: '🇺🇸', tz: 'America/New_York' },
  ];

  function renderSessions() {
    const list = $('#sessions-list');
    list.innerHTML = '';
    SESSIONS.forEach((s) => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: s.tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
      }).formatToParts(now);
      const hour = parseInt(parts.find((p) => p.type === 'hour').value, 10);
      const minute = parts.find((p) => p.type === 'minute').value;
      const weekday = parts.find((p) => p.type === 'weekday').value;
      const isWeekend = weekday === 'Sat' || weekday === 'Sun';
      const isOpen = !isWeekend && hour >= 9 && hour < 17;

      const row = document.createElement('div');
      row.className = 'session-row' + (isOpen ? ' is-open' : '');
      row.innerHTML = `
        <div class="session-left">
          <span class="session-flag">${s.flag}</span>
          <span class="session-name">${s.name}</span>
        </div>
        <div style="display:flex;align-items:center;">
          <span class="session-time">${String(hour).padStart(2, '0')}:${minute}</span>
          <span class="session-status"><span class="session-dot"></span>${isOpen ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}</span>
        </div>`;
      list.appendChild(row);
    });
  }

  /* ========================= QUICK STATS ========================= */
  function renderQuickStats({ btcDominance, capChange24h, fngValue, fngLabel }) {
    const el = $('#quickstats');
    el.innerHTML = '';
    const items = [
      { label: 'Vô địch BTC Dominance', value: btcDominance != null ? btcDominance.toFixed(1) + '%' : '—', sub: 'Thị phần vốn hóa Bitcoin', subClass: '' },
      { label: 'Vốn hóa Crypto 24h', value: capChange24h != null ? fmtPct(capChange24h) : '—', sub: capChange24h >= 0 ? 'Tăng so với hôm qua' : 'Giảm so với hôm qua', subClass: pctClass(capChange24h) },
      { label: 'Chỉ số Sợ hãi & Tham lam', value: fngValue != null ? fngValue : '—', sub: fngLabel || '—', subClass: fngValue >= 55 ? 'up' : (fngValue <= 45 ? 'down' : '') },
      { label: 'Giờ Việt Nam', value: '', sub: 'Cập nhật theo thời gian thực', subClass: '', isClock: true },
    ];
    items.forEach((it) => {
      const div = document.createElement('div');
      div.className = 'qstat';
      div.innerHTML = `<div class="qstat-label">${it.label}</div><div class="qstat-value num">${it.value}</div><div class="qstat-sub ${it.subClass}">${it.sub}</div>`;
      el.appendChild(div);
    });
  }

  /* Nền kinh tế (4 chỉ số) + Xếp hạng quốc gia giờ do initEconGlobe() đảm nhiệm (y hệt Terminal) — xem cuối file. */

  /* ========================= SỐ LIỆU CRYPTO TOÀN CẦU (cho dải Quick Stats) ========================= */
  let lastBtcDominance = null, lastCapChange = null;

  async function loadTrends(onGlobalLoaded) {
    try {
      const g = await fetchJSONWithCorsFallback('https://api.coingecko.com/api/v3/global');
      const d = g.data;
      lastBtcDominance = d.market_cap_percentage.btc;
      lastCapChange = d.market_cap_change_percentage_24h_usd;
      if (onGlobalLoaded) onGlobalLoaded(lastBtcDominance, lastCapChange);
    } catch (e) { /* Quick Stats sẽ giữ giá trị lần tải trước đó, không cần thông báo lỗi riêng */ }
  }

  /* Tỷ giá ngoại tệ giờ do initEconTicker() đảm nhiệm (y hệt Terminal) — xem cuối file. */

  /* ========================= TÂM LÝ THỊ TRƯỜNG (Fear & Greed) — copy y hệt engine gauge của Terminal ========================= */
  // Engine gauge dùng chung (Long/Short & Sợ hãi-Tham lam trong Terminal) — copy y hệt script.js để ngoại hình
  // (SVG cung tròn, chấm sáng, animation mượt) giống 100% Terminal, không phải bản rút gọn conic-gradient cũ.
  function sgHexToRgb(hex) { const h = hex.replace('#', ''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
  function sgLerpColor(hexA, hexB, t) {
    const a = sgHexToRgb(hexA), b = sgHexToRgb(hexB);
    const r = Math.round(a[0] + (b[0]-a[0])*t), g = Math.round(a[1] + (b[1]-a[1])*t), bl = Math.round(a[2] + (b[2]-a[2])*t);
    return `rgb(${r},${g},${bl})`;
  }
  function sgEaseOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  const SG_CX = 150, SG_CY = 158, SG_R = 112, SG_SW = 22;
  function sgPt(s, r) { const deg = 180 - (s / 100) * 180; const rad = deg * Math.PI / 180; return { x: SG_CX + r * Math.cos(rad), y: SG_CY - r * Math.sin(rad) }; }
  function sgArcPath(r, s1, s2) { const a = sgPt(s1, r), b = sgPt(s2, r); return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`; }

  function createGaugeWidget(mountEl, opts) {
    if (!mountEl) return { update(){} };
    let animScore = 50, animFrameId = null;
    function buildShell() {
      const gap = 1.6; let arcs = '';
      opts.segments.forEach(([s1, s2, color]) => {
        const a = sgPt(s1 + gap / 2, SG_R), b = sgPt(s2 - gap / 2, SG_R);
        arcs += `<path d="M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${SG_R} ${SG_R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}" stroke="${color}" stroke-width="${SG_SW}" fill="none" stroke-linecap="round" opacity="0.32"/>`;
      });
      const gid = 'sgglow' + Math.random().toString(36).slice(2, 8);
      mountEl.innerHTML = `
        <svg viewBox="0 0 300 192" class="sg-svg">
          <defs>
            <filter id="${gid}" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <g>${arcs}</g>
          <path class="sg-highlight" d="" stroke="${opts.colorFn(50)}" stroke-width="${SG_SW}" fill="none" stroke-linecap="round"/>
          <circle class="sg-dot-glow" cx="150" cy="46" r="15" fill="${opts.colorFn(50)}" opacity="0.35" filter="url(#${gid})"/>
          <circle class="sg-dot" cx="150" cy="46" r="9" fill="#ffffff" stroke="#0a0d13" stroke-width="3"/>
          <text x="30" y="184" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="11" fill="#7c8598" letter-spacing="1">${opts.leftLabel}</text>
          <text x="270" y="184" text-anchor="end" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="11" fill="#7c8598" letter-spacing="1">${opts.rightLabel}</text>
          <text class="sg-percent" x="150" y="148" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="42" fill="${opts.colorFn(50)}">--</text>
          <text class="sg-label" x="150" y="174" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="600" font-size="15" fill="#e7eaf0">Đang tải...</text>
        </svg>`;
      mountEl.classList.add('sg-ready');
    }
    function animateTo(targetScore) {
      if (!mountEl.classList.contains('sg-ready')) buildShell();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      const startScore = animScore;
      const startColor = opts.colorFn(startScore);
      const endColor = opts.colorFn(targetScore);
      const duration = 900;
      const t0 = performance.now();
      const highlightEl = mountEl.querySelector('.sg-highlight');
      const dotEl = mountEl.querySelector('.sg-dot');
      const glowEl = mountEl.querySelector('.sg-dot-glow');
      const percentEl = mountEl.querySelector('.sg-percent');
      const labelEl = mountEl.querySelector('.sg-label');
      if (!highlightEl || !dotEl || !percentEl || !labelEl) return;

      function frame(now) {
        const t = Math.min(1, (now - t0) / duration);
        const eased = sgEaseOutCubic(t);
        const score = startScore + (targetScore - startScore) * eased;
        animScore = score;
        const color = sgLerpColor(startColor, endColor, eased);

        const hs1 = Math.max(0, score - 6), hs2 = Math.min(100, score + 6);
        highlightEl.setAttribute('d', sgArcPath(SG_R, hs1, hs2));
        highlightEl.setAttribute('stroke', color);

        const p = sgPt(score, SG_R);
        dotEl.setAttribute('cx', p.x.toFixed(2)); dotEl.setAttribute('cy', p.y.toFixed(2));
        glowEl.setAttribute('cx', p.x.toFixed(2)); glowEl.setAttribute('cy', p.y.toFixed(2)); glowEl.setAttribute('fill', color);

        percentEl.textContent = opts.formatCenter ? opts.formatCenter(score) : Math.round(score);
        percentEl.setAttribute('fill', color);
        labelEl.textContent = opts.labelFn(score);

        if (t < 1) { animFrameId = requestAnimationFrame(frame); }
        else { animFrameId = null; }
      }
      animFrameId = requestAnimationFrame(frame);
    }
    return { update: animateTo };
  }

  // Thang điểm 0-100: 0-24 Sợ hãi tột độ, 25-44 Sợ hãi, 45-55 Trung lập, 56-75 Tham lam, 76-100 Tham lam tột độ — y hệt Terminal.
  const fngGaugeWidget = createGaugeWidget($('#fng-gauge'), {
    segments: [[0, 25, '#c23a4f'], [25, 45, '#d9765a'], [45, 55, '#c99257'], [55, 75, '#5fae52'], [75, 100, '#219150']],
    colorFn: score => { if (score < 25) return '#e0455c'; if (score < 45) return '#e07a5f'; if (score < 55) return '#d9a066'; if (score < 75) return '#7fc95f'; return '#2ecc71'; },
    labelFn: score => { if (score < 25) return 'Sợ hãi tột độ'; if (score < 45) return 'Sợ hãi'; if (score < 55) return 'Trung lập'; if (score < 75) return 'Tham lam'; return 'Tham lam tột độ'; },
    leftLabel: 'SỢ HÃI', rightLabel: 'THAM LAM', unit: ' đ',
    formatCenter: s => Math.round(s),
  });

  let fngNextUpdateTs = null;

  function fngLabelFromScore(score) {
    if (score < 25) return 'Sợ hãi tột độ'; if (score < 45) return 'Sợ hãi'; if (score < 55) return 'Trung lập'; if (score < 75) return 'Tham lam'; return 'Tham lam tột độ';
  }

  async function loadSentiment(onLoaded) {
    try {
      const data = await fetchJSONWithCorsFallback('https://api.alternative.me/fng/?limit=1&format=json');
      const today = data.data[0];
      const value = parseInt(today.value, 10);
      const secUntilUpdate = parseInt(today.time_until_update || '0', 10);
      fngNextUpdateTs = Date.now() + secUntilUpdate * 1000;
      fngGaugeWidget.update(value);
      if (onLoaded) onLoaded(value, fngLabelFromScore(value));
    } catch (e) {
      if (onLoaded) onLoaded(null, null);
    }
  }

  // Nguồn dữ liệu Sợ hãi & Tham lam chỉ công bố số mới ~1 lần/ngày (đúng như Terminal) — không "liên tục"
  // theo giây được, nên chỉ cần kiểm tra mốc thời gian công bố tiếp theo để tự lấy số mới đúng lúc.
  function startSentimentCountdownLoop(onLoaded) {
    setInterval(() => {
      if (fngNextUpdateTs !== null) {
        const remain = fngNextUpdateTs - Date.now();
        if (remain <= 0) { loadSentiment(onLoaded); return; }
      }
    }, 1000);
  }

  /* ========================= TIN TỨC NÓNG ========================= */
  // Terminal gốc dùng nhiều nguồn dự phòng (nếu nguồn 1 bị chặn CORS/rate-limit thì tự rơi sang nguồn kế),
  // có timeout riêng cho từng request, và dịch tiêu đề sang tiếng Việt. Áp dụng lại y hệt ở đây.
  const NEWS_FETCH_TIMEOUT_MS = 8000;
  const RSS2JSON_API_KEY = 'zxyhlq2gqvcsvq9lovek0xkvrttzwv2dxbdnr8kh';
  const NEWS_SOURCES = [
    { type: 'cryptocompare', url: 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest' },
    { type: 'directrss', url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.coindesk.com/arc/outboundfeeds/rss/'), source: 'CoinDesk' },
    { type: 'directrss', url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://cointelegraph.com/rss'), source: 'Cointelegraph' },
    { type: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.coindesk.com/arc/outboundfeeds/rss/') + '&count=20&api_key=' + RSS2JSON_API_KEY },
    { type: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://cointelegraph.com/rss') + '&count=20&api_key=' + RSS2JSON_API_KEY },
  ];

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || NEWS_FETCH_TIMEOUT_MS);
    try { return await fetch(url, { signal: controller.signal }); } finally { clearTimeout(timer); }
  }

  function parseNewsSource(type, json, source) {
    if (type === 'cryptocompare') {
      if (!json || !Array.isArray(json.Data)) return [];
      return json.Data.slice(0, 20).map((a) => ({
        id: String(a.id || a.guid || a.url), title: a.title, url: a.url,
        source: (a.source_info && a.source_info.name) || a.source || 'Nguồn tin',
        time: a.published_on, img: a.imageurl && a.imageurl.startsWith('http') ? a.imageurl : '',
      }));
    }
    if (type === 'rss2json') {
      if (!json || json.status !== 'ok' || !Array.isArray(json.items)) return [];
      return json.items.slice(0, 20).map((a) => {
        const ts = Date.parse((a.pubDate || '').replace(' ', 'T') + 'Z');
        return {
          id: String(a.guid || a.link), title: (a.title || '').replace(/<[^>]*>/g, ''), url: a.link,
          source: (json.feed && json.feed.title) || 'Nguồn tin',
          time: isNaN(ts) ? Math.floor(Date.now() / 1000) : Math.floor(ts / 1000), img: a.thumbnail || '',
        };
      });
    }
    return [];
  }

  function parseRssXml(xmlText, sourceName) {
    try {
      const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
      if (doc.querySelector('parsererror')) return [];
      return Array.from(doc.querySelectorAll('item')).slice(0, 20).map((node) => {
        const get = (tag) => { const el = node.getElementsByTagName(tag)[0]; return el ? el.textContent.trim() : ''; };
        const link = get('link'), pubDate = get('pubDate'), ts = Date.parse(pubDate);
        let img = '';
        const media = node.getElementsByTagName('media:content')[0] || node.getElementsByTagName('enclosure')[0];
        if (media && media.getAttribute) img = media.getAttribute('url') || '';
        if (!img) { const m = get('description').match(/<img[^>]+src=["']([^"']+)["']/i); if (m) img = m[1]; }
        return {
          id: link || get('guid') || sourceName + get('title'), title: get('title').replace(/<[^>]*>/g, ''),
          url: link || '#', source: sourceName, time: isNaN(ts) ? Math.floor(Date.now() / 1000) : Math.floor(ts / 1000), img,
        };
      }).filter((it) => it.title);
    } catch (e) { return []; }
  }

  const newsTranslationCache = new Map();
  async function translateToVi(text) {
    if (!text) return text;
    if (newsTranslationCache.has(text)) return newsTranslationCache.get(text);
    try {
      const res = await fetchWithTimeout('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text), 5000);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const translated = Array.isArray(data && data[0]) ? data[0].map((seg) => seg[0]).join('') : text;
      newsTranslationCache.set(text, translated);
      return translated;
    } catch (e) { newsTranslationCache.set(text, text); return text; }
  }

  // Copy y hệt renderNewsList của Terminal: dùng thẻ <a class="news-item">, ảnh 56x56 (.news-thumb),
  // đánh dấu tin mới bằng class "is-new" (hiệu ứng flash), và badge LIVE + giờ cập nhật ở đầu card.
  const seenNewsIds = new Set();
  let newsFirstLoad = true;
  function renderNewsList(items, isRefreshOnly) {
    const listEl = $('#news-list');
    if (!listEl) return;
    if (!items.length) { listEl.innerHTML = '<div class="news-empty">Chưa có tin tức.</div>'; return; }
    listEl.innerHTML = items.map((it) => {
      const isNew = !isRefreshOnly && !newsFirstLoad && !seenNewsIds.has(it.id);
      return `<a class="news-item${isNew ? ' is-new' : ''}" href="${it.url}" target="_blank" rel="noopener noreferrer">
        ${it.img ? `<img class="news-thumb" src="${it.img}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="news-body">
          <div class="news-title">${it.title}</div>
          <div class="news-meta"><span class="news-source">${it.source}</span><span>·</span><span>${timeAgo(it.time)}</span></div>
        </div>
      </a>`;
    }).join('');
    if (!isRefreshOnly) { items.forEach((it) => seenNewsIds.add(it.id)); newsFirstLoad = false; }
  }

  let lastNewsItems = [];
  async function loadNews() {
    const list = $('#news-list');
    for (const src of NEWS_SOURCES) {
      try {
        let items;
        if (src.type === 'directrss') {
          const res = await fetchWithTimeout(src.url);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          items = parseRssXml(await res.text(), src.source);
        } else {
          const res = await fetchWithTimeout(src.url);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          items = parseNewsSource(src.type, await res.json());
        }
        if (items && items.length) {
          items = items.slice(0, 8);
          await Promise.all(items.map(async (it) => { it.title = await translateToVi(it.title); }));
          lastNewsItems = items;
          renderNewsList(items, false);
          const upd = $('#news-updated'); if (upd) upd.textContent = 'Cập nhật: ' + new Date().toLocaleTimeString('vi-VN');
          const badge = $('#news-live-badge'); if (badge) badge.innerHTML = '<span class="news-live-dot"><span class="live-dot"></span>LIVE</span>';
          return; // thành công, dừng chuỗi fallback
        }
      } catch (e) { /* thử nguồn kế tiếp */ }
    }
    // Mọi nguồn đều lỗi
    if (list && newsFirstLoad) {
      list.innerHTML = '';
      list.appendChild(errorNote('Không tải được tin tức từ mọi nguồn (có thể do adblock chặn tên miền tin tức).', loadNews));
    }
  }

  /* ========================= BẢNG GIÁ COIN ========================= */
  let coinsData = [];
  let rawCoinsData = []; // buffer top ~30 theo vốn hóa từ CoinGecko, để có mã dự phòng thay thế khi loại bỏ mã không có trên Binance
  let sortKey = 'cap';
  let sortDir = 'desc';
  let symbolMap = new Map(); // 'BTCUSDT' -> index trong coinsData
  let coinTickerWS = null;
  let renderPending = false;
  let wsReconnectTimer = null;
  let lastWsMessageTs = 0;
  let restFallbackTimer = null;
  let cgFallbackTimer = null; // lưới an toàn cuối cùng nếu cả WS lẫn REST của Binance đều bị chặn
  let prevPriceBySymbol = new Map(); // 'BTC' -> giá tick trước đó, dùng để xác định chiều tăng/giảm cho hiệu ứng flash
  let pendingCellSymbols = new Set(); // các coin vừa đổi giá, chờ update ô (không rebuild cả bảng)
  let cellUpdatePending = false;
  let searchActive = false; // true khi ô tìm kiếm đang có nội dung -> bảng hiển thị kết quả tìm toàn thị trường thay vì top 10
  let searchDebounceTimer = null;
  let searchReqSeq = 0; // đánh số mỗi lượt tìm kiếm để bỏ qua kết quả trả về trễ của lượt gõ trước đó
  let searchAbortController = null; // hủy ngay request mạng cũ khi có tìm kiếm mới hơn, đỡ tốn băng thông/thời gian chờ
  const searchCache = new Map(); // từ khóa (chữ thường) đã tìm -> kết quả, gõ lại/gõ trùng không cần gọi mạng lần nữa
  // Danh sách các cặp <MÃ>USDT thực sự đang giao dịch (status TRADING) trên Binance SPOT — không phải coin nào
  // trong top 10 CoinGecko cũng có mặt trên Binance (VD: chính USDT không thể ghép với USDT, có coin chỉ niêm
  // yết Futures chứ không có Spot, có coin quá mới/nhỏ chưa lên Binance). null = chưa tải xong danh sách.
  let binanceUsdtSymbols = null;

  async function loadBinanceSymbolWhitelist() {
    try {
      const info = await fetchJSONWithCorsFallback('https://api.binance.com/api/v3/exchangeInfo');
      const set = new Set();
      (info.symbols || []).forEach((s) => {
        if (s.status === 'TRADING' && s.quoteAsset === 'USDT') set.add(s.symbol);
      });
      binanceUsdtSymbols = set;
      // Danh sách vừa sẵn sàng -> tính lại coin nào có/không có feed thật. Nếu đang ở chế độ tìm kiếm thì chỉ
      // cập nhật cờ noFeed cho đúng kết quả tìm kiếm hiện tại, KHÔNG quay về top 10 mặc định.
      if (searchActive) applyFeedAvailability(); else refreshDisplayCoins();
      renderCoinsTable();
      updateSortHeaders();
      connectCoinTicker();
    } catch (e) { /* giữ nguyên null, coi như "chưa biết" — vẫn thử subscribe bình thường, sẽ tự sửa khi tải lại được */ }
  }

  // Chọn đúng 10 mã HIỂN THỊ từ buffer top ~30 theo vốn hóa: loại bỏ mã không thể/không có giá realtime trên
  // Binance Spot (chính USDT — không thể ghép USDT/USDT; hoặc mã đã biết chắc không có cặp <MÃ>USDT đang giao
  // dịch), rồi lấy 10 mã đầu tiên còn lại theo đúng thứ tự vốn hóa — mã bị loại sẽ tự động được thay bằng mã
  // kế tiếp trong buffer, không cần chọn tay.
  function refreshDisplayCoins() {
    const filtered = rawCoinsData.filter((c) => {
      const sym = (c.symbol || '').toUpperCase();
      if (sym === 'USDT') return false; // không có cặp USDT/USDT
      if (binanceUsdtSymbols && !binanceUsdtSymbols.has(sym + 'USDT')) return false; // đã biết chắc: không có trên Binance Spot
      return true;
    });
    coinsData = filtered.slice(0, 10);
    buildSymbolMap();
    applyFeedAvailability();
  }

  // Đánh dấu coin._noFeed = true cho những mã KHÔNG có cặp <MÃ>USDT đang giao dịch trên Binance Spot — chỉ còn
  // xảy ra trong lúc CHƯA tải xong danh sách whitelist (binanceUsdtSymbols === null); sau khi tải xong,
  // refreshDisplayCoins() ở trên đã tự loại bỏ và thay thế nên gần như sẽ không còn mã nào bị đánh dấu nữa.
  function applyFeedAvailability() {
    if (!binanceUsdtSymbols) return;
    coinsData.forEach((c) => {
      const sym = (c.symbol || '').toUpperCase() + 'USDT';
      c._noFeed = !binanceUsdtSymbols.has(sym);
    });
  }

  // Tìm kiếm TRÊN TOÀN BỘ thị trường (không chỉ 10 mã đang hiển thị): dùng API tìm kiếm của CoinGecko để tìm
  // coin theo tên/mã dù coin đó không nằm trong top 10 hay top 30 vốn hóa, rồi lấy dữ liệu giá đầy đủ cho đúng
  // các coin tìm được và hiển thị y hệt bảng mặc định (kèm realtime nếu coin đó có trên Binance Spot).
  async function performCoinSearch(query, seqIn) {
    const seq = seqIn || ++searchReqSeq;
    const ql = query.trim().toLowerCase();

    const cached = searchCache.get(ql);
    if (cached) {
      // Đã từng tìm từ khóa này trước đó (VD: gõ rồi xóa rồi gõ lại) -> trả ngay, không cần gọi mạng nữa
      coinsData = cached;
      buildSymbolMap();
      applyFeedAvailability();
      renderCoinsTable();
      updateSortHeaders();
      $('#coins-updated').textContent = coinsData.length ? ('Kết quả tìm kiếm: ' + coinsData.length + ' coin') : 'Không tìm thấy coin phù hợp trên thị trường.';
      connectCoinTicker();
      return;
    }

    const tbody = $('#coins-tbody');
    // Chỉ hiện khung loading nếu bảng đang trống — nếu bước khớp cục bộ (tức thời) đã hiện sẵn vài coin rồi
    // thì cứ để nguyên trên màn hình cho tới khi có kết quả mạng đầy đủ, đỡ bị giật/trắng bảng giữa chừng.
    if (!coinsData.length) tbody.innerHTML = '<tr><td colspan="9"><div class="skeleton" style="height:220px;border-radius:10px"></div></td></tr>';

    if (searchAbortController) searchAbortController.abort(); // huỷ ngay request cũ đang chờ, khỏi tốn băng thông chờ kết quả không dùng nữa
    const controller = new AbortController();
    searchAbortController = controller;

    try {
      const searchRes = await fetchJSONWithCorsFallback('https://api.coingecko.com/api/v3/search?query=' + encodeURIComponent(query), { signal: controller.signal });
      if (seq !== searchReqSeq) return; // người dùng đã gõ tiếp/xóa ô tìm kiếm, bỏ kết quả cũ này
      const found = (searchRes.coins || []).slice(0, 50); // đủ dùng cho mọi từ khóa thực tế; chỉ chặn trường hợp gõ 1 ký tự khớp hàng trăm coin làm URL/markets call quá tải
      if (!found.length) {
        searchCache.set(ql, []);
        if (!coinsData.length) { renderCoinsTable(); updateSortHeaders(); }
        $('#coins-updated').textContent = 'Không tìm thấy coin phù hợp trên thị trường.';
        return;
      }
      const ids = found.map((c) => c.id).join(',');
      const marketData = await fetchJSONWithCorsFallback(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + encodeURIComponent(ids) + '&sparkline=true&price_change_percentage=1h,24h,7d',
        { signal: controller.signal }
      );
      if (seq !== searchReqSeq) return;
      // Giữ đúng thứ tự mức độ phù hợp mà CoinGecko trả về (khớp tên/mã gần đúng nhất lên trước)
      const orderMap = new Map(found.map((c, i) => [c.id, i]));
      marketData.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
      searchCache.set(ql, marketData);
      coinsData = marketData;
      buildSymbolMap();
      applyFeedAvailability();
      renderCoinsTable();
      updateSortHeaders();
      $('#coins-updated').textContent = 'Kết quả tìm kiếm: ' + coinsData.length + ' coin';
      connectCoinTicker(); // mở lại WS đúng theo các coin vừa tìm được (coin nào không có trên Binance sẽ tự bị bỏ qua)
    } catch (e) {
      if (e && e.name === 'AbortError') return; // bị hủy vì có tìm kiếm mới hơn đè lên, bỏ qua êm không báo lỗi
      if (seq !== searchReqSeq) return;
      if (!coinsData.length) {
        tbody.innerHTML = '<tr><td colspan="9"></td></tr>';
        tbody.querySelector('td').appendChild(errorNote('Không thể tìm kiếm coin.', () => performCoinSearch(query)));
      }
    }
  }

  function sparklineSVG(prices, isUp) {
    if (!prices || prices.length < 2) return '';
    const min = Math.min(...prices), max = Math.max(...prices);
    const range = max - min || 1;
    const w = 100, h = 32;
    const step = w / (prices.length - 1);
    const pts = prices.map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`).join(' ');
    const color = isUp ? '#14cc8a' : '#ff4757';
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function renderCoinsTable() {
    const tbody = $('#coins-tbody');
    let rows = coinsData;

    const keyMap = {
      price: (c) => c.current_price,
      h1: (c) => c.price_change_percentage_1h_in_currency,
      h24: (c) => c.price_change_percentage_24h_in_currency,
      d7: (c) => c.price_change_percentage_7d_in_currency,
      cap: (c) => c.market_cap,
      vol: (c) => c.total_volume,
    };
    if (keyMap[sortKey]) {
      rows = rows.slice().sort((a, b) => {
        const av = keyMap[sortKey](a) ?? -Infinity, bv = keyMap[sortKey](b) ?? -Infinity;
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:30px;">Không tìm thấy coin phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((c) => {
      const h1 = c.price_change_percentage_1h_in_currency, h24 = c.price_change_percentage_24h_in_currency, d7 = c.price_change_percentage_7d_in_currency;
      const sparkPrices = c.sparkline_in_7d ? c.sparkline_in_7d.price : null;
      const isUp = sparkPrices ? sparkPrices[sparkPrices.length - 1] >= sparkPrices[0] : (h24 || 0) >= 0;
      const noFeed = !!c._noFeed;
      const rowTitle = noFeed
        ? `${(c.symbol || '').toUpperCase()} chưa niêm yết cặp USDT trên Binance Spot — không có giá realtime & không xem được biểu đồ Terminal`
        : `Xem biểu đồ ${(c.symbol || '').toUpperCase()} trên Terminal`;
      return `
        <tr data-symbol="${(c.symbol || '').toUpperCase()}" ${noFeed ? 'data-no-feed="1"' : ''} class="${noFeed ? 'no-feed-row' : ''}" title="${rowTitle}">
          <td class="num">${c.market_cap_rank ?? '—'}</td>
          <td>
            <div class="coin-name-cell">
              <img src="${c.image}" alt="">
              <span><span class="coin-name">${c.name}</span><span class="coin-sym">${c.symbol}</span>${noFeed ? '<span class="no-feed-badge">Chưa có trên Binance</span>' : ''}</span>
            </div>
          </td>
          <td class="num" data-field="price"><span class="price-arrow"></span><span class="price-val">${fmtPrice(c.current_price)}</span></td>
          <td class="num"><span class="chg-pill ${pctClass(h1)}">${fmtPct(h1)}</span></td>
          <td class="num" data-field="h24"><span class="chg-pill ${pctClass(h24)}">${fmtPct(h24)}</span></td>
          <td class="num"><span class="chg-pill ${pctClass(d7)}">${fmtPct(d7)}</span></td>
          <td class="num">${fmtCompactUSD(c.market_cap)}</td>
          <td class="num" data-field="vol">${fmtCompactUSD(c.total_volume)}</td>
          <td><div class="spark-cell">${sparklineSVG(sparkPrices, isUp)}</div></td>
        </tr>`;
    }).join('');
  }

  function updateSortHeaders() {
    document.querySelectorAll('.coins-table th.sortable').forEach((th) => {
      th.classList.toggle('sort-active', th.dataset.sort === sortKey);
    });
  }

  function buildSymbolMap() {
    symbolMap = new Map();
    coinsData.forEach((c, i) => {
      const sym = (c.symbol || '').toUpperCase() + 'USDT';
      symbolMap.set(sym, i);
    });
  }

  async function loadCoins() {
    const tbody = $('#coins-tbody');
    try {
      const data = await fetchJSONWithCorsFallback(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=true&price_change_percentage=1h,24h,7d'
      );
      rawCoinsData = data;
      if (!searchActive) {
        refreshDisplayCoins();
        renderCoinsTable();
        updateSortHeaders();
        $('#coins-updated').textContent = 'Danh sách làm mới: ' + new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        connectCoinTicker();
      }
    } catch (e) {
      if (!searchActive) {
        tbody.innerHTML = '<tr><td colspan="9"></td></tr>';
        tbody.querySelector('td').appendChild(errorNote('Không thể tải bảng giá coin.', loadCoins));
      }
    }
  }

  /* ---- WebSocket Binance: cập nhật giá & %24h theo thời gian thực, đúng cơ chế terminal đang dùng ---- */
  function setWsStatus(online) {
    const el = $('#ws-status');
    if (!el) return;
    el.classList.toggle('offline', !online);
    el.innerHTML = `<span class="live-dot"></span>${online ? 'LIVE' : 'MẤT KẾT NỐI'}`;
  }

  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
      renderPending = false;
      renderCoinsTable();
    });
  }

  // Cập nhật đúng những ô (giá / 24h% / khối lượng) vừa đổi, không đụng tới các dòng khác,
  // không xoá/tạo lại <img> hay sparkline -> mượt như terminal thay vì giật cả bảng.
  function scheduleCellUpdate() {
    if (cellUpdatePending) return;
    cellUpdatePending = true;
    requestAnimationFrame(() => {
      cellUpdatePending = false;
      const symbols = pendingCellSymbols;
      pendingCellSymbols = new Set();
      updateCoinCells(symbols);
    });
  }

  function updateCoinCells(symbols) {
    const tbody = $('#coins-tbody');
    if (!tbody) return;
    symbols.forEach((sym) => {
      const idx = symbolMap.get(sym + 'USDT');
      if (idx === undefined) return;
      const coin = coinsData[idx];
      if (!coin) return;
      const row = tbody.querySelector(`tr[data-symbol="${sym}"]`);
      if (!row) return; // dòng đang bị ẩn do search/sort chưa render lại - bỏ qua, dữ liệu vẫn đúng khi render lại

      const prev = prevPriceBySymbol.get(sym);
      const dir = prev == null ? null : (coin.current_price > prev ? 'up' : coin.current_price < prev ? 'down' : null);
      prevPriceBySymbol.set(sym, coin.current_price);

      const priceCell = row.querySelector('[data-field="price"]');
      if (priceCell) {
        const valEl = priceCell.querySelector('.price-val');
        if (valEl) valEl.textContent = fmtPrice(coin.current_price); else priceCell.textContent = fmtPrice(coin.current_price);
        if (dir) {
          flashCell(priceCell, dir);
          flashArrow(priceCell.querySelector('.price-arrow'), dir);
          flashRow(row, dir); // nhá cả dòng cho dễ nhận ra biến động dù mắt không nhìn đúng cột giá
        }
      }

      const h24Cell = row.querySelector('[data-field="h24"]');
      if (h24Cell) {
        const h24 = coin.price_change_percentage_24h_in_currency;
        const pill = h24Cell.querySelector('.chg-pill');
        if (pill) {
          pill.textContent = fmtPct(h24);
          pill.className = 'chg-pill ' + pctClass(h24);
        }
        if (dir) flashCell(h24Cell, dir);
      }

      const volCell = row.querySelector('[data-field="vol"]');
      if (volCell) {
        volCell.textContent = fmtCompactUSD(coin.total_volume);
        if (dir) flashCell(volCell, dir);
      }
    });
  }

  // Nhấp nháy xanh/đỏ ngắn khi giá đổi, giống cơ chế "tick flash" của terminal
  function flashCell(el, dir) {
    el.classList.remove('flash-up', 'flash-down');
    void el.offsetWidth; // ép reflow để restart animation nếu class vừa bị gỡ
    el.classList.add(dir === 'up' ? 'flash-up' : 'flash-down');
  }

  // Mũi tên ▲/▼ hiện ra rồi mờ dần ngay cạnh giá mỗi lần có tick mới, cho cảm giác bảng giá "sống" liên tục
  function flashArrow(el, dir) {
    if (!el) return;
    el.classList.remove('arrow-up', 'arrow-down');
    void el.offsetWidth;
    el.textContent = dir === 'up' ? '▲' : '▼';
    el.classList.add(dir === 'up' ? 'arrow-up' : 'arrow-down');
  }

  // Nhá nhẹ toàn bộ dòng (viền trái + nền mờ) mỗi khi giá của dòng đó đổi, để mắt vẫn bắt được biến động
  // dù đang nhìn cột khác — tạo cảm giác sôi động như bảng giá sàn thật thay vì chỉ lặng lẽ đổi số.
  function flashRow(row, dir) {
    row.classList.remove('row-flash-up', 'row-flash-down');
    void row.offsetWidth;
    row.classList.add(dir === 'up' ? 'row-flash-up' : 'row-flash-down');
  }

  let wsSubscribedKey = ''; // danh sách symbol đang subscribe hiện tại, dùng để biết khi nào cần mở lại kết nối

  // Xây danh sách stream cho đúng các coin đang có trong bảng (chỉ 10 mã nên rất rẻ để mở stream RIÊNG cho
  // từng mã, y hệt cách Terminal đang làm — KHÔNG dùng !ticker@arr/!bookTicker (all-market) nữa vì Binance đã
  // NGỪNG (deprecate) stream !ticker@arr từ 14/11/2025, khiến kênh đó không còn đẩy dữ liệu -> giá đứng yên mãi.
  function buildTickerStreams() {
    const list = [];
    coinsData.forEach((c) => {
      if (c._noFeed) return; // không có cặp USDT trên Binance Spot -> đăng ký stream chỉ tổ báo lỗi/không bao giờ có tick
      const sym = (c.symbol || '').toLowerCase() + 'usdt';
      list.push(sym + '@ticker');      // giá + %24h + khối lượng, Binance đẩy đều mỗi ~1 giây cho từng mã
      list.push(sym + '@bookTicker');  // giá mua/bán tốt nhất, đẩy NGAY LẬP TỨC mỗi khi có khớp lệnh mới -> nhảy liên tục
    });
    return list.join('/');
  }

  function connectCoinTicker() {
    if (!coinsData.length) return;
    const streams = buildTickerStreams();
    if (!streams) { setWsStatus(false); return; } // không mã nào có cặp USDT trên Binance -> không có gì để mở kết nối
    if (coinTickerWS && coinTickerWS.readyState === WebSocket.OPEN && wsSubscribedKey === streams) return; // đã đúng danh sách, không mở lại
    if (coinTickerWS) { try { coinTickerWS.onclose = null; coinTickerWS.close(); } catch (e) {} }
    clearTimeout(wsReconnectTimer);
    wsSubscribedKey = streams;

    coinTickerWS = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streams);

    coinTickerWS.onopen = () => {
      setWsStatus(true);
      lastWsMessageTs = Date.now();
      stopRestFallback(); // WS sống lại thì không cần fallback REST nữa
    };

    coinTickerWS.onmessage = (event) => {
      lastWsMessageTs = Date.now();
      let msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (!msg || !msg.data || !msg.data.s) return;
      const t = msg.data;
      const idx = symbolMap.get(t.s);
      if (idx === undefined) return;
      const coin = coinsData[idx];
      let touched = false;

      if (t.c !== undefined) {
        // Payload của <symbol>@ticker: c = giá cuối, P = %24h, q = khối lượng quy đổi 24h
        coin.current_price = parseFloat(t.c);
        if (t.P !== undefined) coin.price_change_percentage_24h_in_currency = parseFloat(t.P);
        if (t.q !== undefined) coin.total_volume = parseFloat(t.q);
        touched = true;
      } else if (t.b !== undefined && t.a !== undefined) {
        // Payload của <symbol>@bookTicker: b/a = giá mua/bán tốt nhất -> lấy trung điểm cho mượt giữa các lần @ticker
        const bid = parseFloat(t.b), ask = parseFloat(t.a);
        if (!isNaN(bid) && !isNaN(ask)) { coin.current_price = (bid + ask) / 2; touched = true; }
      }

      if (touched) {
        pendingCellSymbols.add((coin.symbol || '').toUpperCase());
        scheduleCellUpdate(); // gộp mọi tick trong cùng 1 khung hình -> mượt, không giật, nhưng vẫn phản ánh đúng từng thay đổi giá thật
      }
    };

    coinTickerWS.onerror = () => setWsStatus(false);
    coinTickerWS.onclose = () => {
      setWsStatus(false);
      startRestFallback(); // trong lúc chờ nối lại, vẫn cập nhật giá qua REST để không bị đứng
      wsReconnectTimer = setTimeout(connectCoinTicker, 4000); // tự kết nối lại sau 4 giây, giống cơ chế reconnect của terminal
    };
  }

  // Kiểm tra "treo": nếu quá 12s không nhận được tick nào dù socket báo đang mở, chủ động đóng để buộc nối lại
  setInterval(() => {
    if (coinTickerWS && coinTickerWS.readyState === WebSocket.OPEN && lastWsMessageTs && Date.now() - lastWsMessageTs > 12000) {
      try { coinTickerWS.close(); } catch (e) {}
    }
  }, 5000);

  // Fallback: nếu WebSocket không dùng được (bị chặn mạng/trình duyệt), vẫn lấy giá real-time qua REST mỗi 3 giây
  async function restFallbackTick() {
    if (!coinsData.length) return;
    try {
      const symbols = coinsData.filter((c) => !c._noFeed).map((c) => (c.symbol || '').toUpperCase() + 'USDT');
      if (!symbols.length) return; // không mã nào có cặp trên Binance -> khỏi gọi, tránh lỗi "Invalid symbol" hỏng cả batch
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(symbols)));
      if (!res.ok) return;
      const arr = await res.json();
      if (!Array.isArray(arr)) return;
      arr.forEach((t) => {
        const idx = symbolMap.get(t.symbol);
        if (idx === undefined) return;
        const coin = coinsData[idx];
        coin.current_price = parseFloat(t.lastPrice);
        coin.price_change_percentage_24h_in_currency = parseFloat(t.priceChangePercent);
        coin.total_volume = parseFloat(t.quoteVolume);
        pendingCellSymbols.add((coin.symbol || '').toUpperCase());
      });
      scheduleCellUpdate();
    } catch (e) { /* bỏ qua, thử lại ở lượt sau */ }
  }
  function startRestFallback() {
    if (restFallbackTimer) return;
    restFallbackTick();
    restFallbackTimer = setInterval(restFallbackTick, 3000);
    // Lưới an toàn cuối cùng: nếu domain Binance (cả WS lẫn REST) bị chặn hoàn toàn trên mạng của người dùng
    // (tường lửa/ISP chặn binance.com — khá phổ biến ở VN), restFallbackTick() ở trên sẽ luôn thất bại âm thầm
    // và bảng giá sẽ đứng yên mãi mãi dù có "fallback". Do đó vẫn cần 1 nguồn ĐỘC LẬP với Binance để bảng giá
    // luôn nhúc nhích: gọi lại loadCoins() (đã có sẵn cơ chế tự chuyển qua proxy nếu CoinGecko bị chặn trực
    // tiếp) mỗi 20 giây trong lúc WS còn mất kết nối.
    if (!cgFallbackTimer) cgFallbackTimer = setInterval(() => { loadCoins(); }, 20000);
  }
  function stopRestFallback() {
    if (restFallbackTimer) { clearInterval(restFallbackTimer); restFallbackTimer = null; }
    if (cgFallbackTimer) { clearInterval(cgFallbackTimer); cgFallbackTimer = null; }
  }

  /* ========================= NỀN KINH TẾ TOÀN CẦU: QUẢ CẦU TRÁI ĐẤT (copy y hệt Terminal script.js) =========================
     3 khối IIFE dưới đây tự chứa (không phụ thuộc biến/hàm nào khác trong file này), tự lấy dữ liệu
     World Bank thật, tự vẽ globe WebGL (Three.js) + overlay d3, tự dựng Xếp hạng quốc gia + biểu đồ
     Xu hướng toàn cầu + Tỷ giá ngoại tệ bên cạnh — đúng cơ chế & giao diện của Terminal giao dịch. */

  (function initEconGlobe() {
    const canvasEl = document.getElementById('econ-map-canvas');
    const wrapEl = document.getElementById('econ-map-wrap');
    const statusEl = document.getElementById('econ-map-status');
    const tabsEl = document.getElementById('econ-tabs');
    const titleEl = document.getElementById('econ-title');
    const tooltipEl = document.getElementById('econ-tooltip');
    const legendBarEl = document.getElementById('econ-legend-bar');
    const legendLabelsEl = document.getElementById('econ-legend-labels');
    if (!canvasEl || typeof THREE === 'undefined' || typeof d3 === 'undefined') return;

    const GEO_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
    const GRADIENT_LOW_TO_HIGH = ['#14cc8a', '#8dd66a', '#f0c419', '#ff8a3d', '#ff4757'];
    const NO_DATA_COLOR = '#232938';

    const ECON_INDICATORS = {
      inflation: {
        code: 'FP.CPI.TOTL.ZG', title: 'Bản đồ lạm phát toàn cầu', tab: 'Lạm phát', unit: '%', breaks: [0, 3, 7, 12, 25], goodDirection: 'low',
        metricName: 'Lạm phát (CPI)',
        metricDesc: '% thay đổi giá tiêu dùng (CPI) so với năm trước — số càng thấp càng tốt',
      },
      gdp: {
        code: 'NY.GDP.MKTP.KD.ZG', title: 'Bản đồ tăng trưởng GDP toàn cầu', tab: 'Tăng trưởng GDP', unit: '%', breaks: [-2, 0, 2, 4, 6], goodDirection: 'high',
        metricName: 'Tăng trưởng GDP',
        metricDesc: '% tăng trưởng GDP thực (đã trừ lạm phát) so với năm trước — số càng cao càng tốt',
      },
      unemployment: {
        code: 'SL.UEM.TOTL.ZS', title: 'Bản đồ thất nghiệp toàn cầu', tab: 'Thất nghiệp', unit: '%', breaks: [4, 7, 10, 15, 20], goodDirection: 'low',
        metricName: 'Tỷ lệ thất nghiệp',
        metricDesc: '% lực lượng lao động đang không có việc làm — số càng thấp càng tốt',
      },
    };

    const state = { current: 'inflation', cache: {}, world: null, ready: false, hoverId: null, tooltipTimer: null, pickBroken: false };

    // ===================================================================================
    // BẢNG TRA CỨU CỜ QUỐC GIA — ánh xạ mã ISO 3166-1 alpha-3 (mã "id" mà mỗi feature trong
    // GeoJSON đang dùng, cũng là mã mà World Bank trả về qua countryiso3code) sang alpha-2
    // chuẩn quốc tế, rồi từ alpha-2 dựng thẳng emoji lá cờ bằng ký tự "Regional Indicator
    // Symbol" theo chuẩn Unicode (mỗi chữ cái A-Z có 1 ký tự tương ứng, ghép 2 ký tự lại thành
    // đúng emoji cờ quốc gia đó — cách này không "vẽ" hay "đoán" cờ mà để chính hệ điều hành/
    // trình duyệt render lá cờ thật theo chuẩn, nên luôn khớp 100% với mã nước, không có chỗ
    // cho sai lệch). Bảng lấy nguyên từ danh sách ISO 3166-1 chính thức (249 mã). Nước nào
    // không có trong bảng này (vùng lãnh thổ tranh chấp/không có mã ISO chính thức) sẽ KHÔNG
    // hiển thị cờ, thay vì hiển thị một lá cờ có thể sai.
    const ISO3_TO_ISO2 = {
      AFG:'AF', ALA:'AX', ALB:'AL', DZA:'DZ', ASM:'AS', AND:'AD', AGO:'AO', AIA:'AI', ATA:'AQ',
      ATG:'AG', ARG:'AR', ARM:'AM', ABW:'AW', AUS:'AU', AUT:'AT', AZE:'AZ', BHS:'BS', BHR:'BH',
      BGD:'BD', BRB:'BB', BLR:'BY', BEL:'BE', BLZ:'BZ', BEN:'BJ', BMU:'BM', BTN:'BT', BOL:'BO',
      BES:'BQ', BIH:'BA', BWA:'BW', BVT:'BV', BRA:'BR', IOT:'IO', BRN:'BN', BGR:'BG', BFA:'BF',
      BDI:'BI', CPV:'CV', KHM:'KH', CMR:'CM', CAN:'CA', CYM:'KY', CAF:'CF', TCD:'TD', CHL:'CL',
      CHN:'CN', CXR:'CX', CCK:'CC', COL:'CO', COM:'KM', COG:'CG', COD:'CD', COK:'CK', CRI:'CR',
      CIV:'CI', HRV:'HR', CUB:'CU', CUW:'CW', CYP:'CY', CZE:'CZ', DNK:'DK', DJI:'DJ', DMA:'DM',
      DOM:'DO', ECU:'EC', EGY:'EG', SLV:'SV', GNQ:'GQ', ERI:'ER', EST:'EE', SWZ:'SZ', ETH:'ET',
      FLK:'FK', FRO:'FO', FJI:'FJ', FIN:'FI', FRA:'FR', GUF:'GF', PYF:'PF', ATF:'TF', GAB:'GA',
      GMB:'GM', GEO:'GE', DEU:'DE', GHA:'GH', GIB:'GI', GRC:'GR', GRL:'GL', GRD:'GD', GLP:'GP',
      GUM:'GU', GTM:'GT', GGY:'GG', GIN:'GN', GNB:'GW', GUY:'GY', HTI:'HT', HMD:'HM', VAT:'VA',
      HND:'HN', HKG:'HK', HUN:'HU', ISL:'IS', IND:'IN', IDN:'ID', IRN:'IR', IRQ:'IQ', IRL:'IE',
      IMN:'IM', ISR:'IL', ITA:'IT', JAM:'JM', JPN:'JP', JEY:'JE', JOR:'JO', KAZ:'KZ', KEN:'KE',
      KIR:'KI', PRK:'KP', KOR:'KR', KWT:'KW', KGZ:'KG', LAO:'LA', LVA:'LV', LBN:'LB', LSO:'LS',
      LBR:'LR', LBY:'LY', LIE:'LI', LTU:'LT', LUX:'LU', MAC:'MO', MDG:'MG', MWI:'MW', MYS:'MY',
      MDV:'MV', MLI:'ML', MLT:'MT', MHL:'MH', MTQ:'MQ', MRT:'MR', MUS:'MU', MYT:'YT', MEX:'MX',
      FSM:'FM', MDA:'MD', MCO:'MC', MNG:'MN', MNE:'ME', MSR:'MS', MAR:'MA', MOZ:'MZ', MMR:'MM',
      NAM:'NA', NRU:'NR', NPL:'NP', NLD:'NL', NCL:'NC', NZL:'NZ', NIC:'NI', NER:'NE', NGA:'NG',
      NIU:'NU', NFK:'NF', MKD:'MK', MNP:'MP', NOR:'NO', OMN:'OM', PAK:'PK', PLW:'PW', PSE:'PS',
      PAN:'PA', PNG:'PG', PRY:'PY', PER:'PE', PHL:'PH', PCN:'PN', POL:'PL', PRT:'PT', PRI:'PR',
      QAT:'QA', REU:'RE', ROU:'RO', RUS:'RU', RWA:'RW', BLM:'BL', SHN:'SH', KNA:'KN', LCA:'LC',
      MAF:'MF', SPM:'PM', VCT:'VC', WSM:'WS', SMR:'SM', STP:'ST', SAU:'SA', SEN:'SN', SRB:'RS',
      SYC:'SC', SLE:'SL', SGP:'SG', SXM:'SX', SVK:'SK', SVN:'SI', SLB:'SB', SOM:'SO', ZAF:'ZA',
      SGS:'GS', SSD:'SS', ESP:'ES', LKA:'LK', SDN:'SD', SUR:'SR', SJM:'SJ', SWE:'SE', CHE:'CH',
      SYR:'SY', TWN:'TW', TJK:'TJ', TZA:'TZ', THA:'TH', TLS:'TL', TGO:'TG', TKL:'TK', TON:'TO',
      TTO:'TT', TUN:'TN', TUR:'TR', TKM:'TM', TCA:'TC', TUV:'TV', UGA:'UG', UKR:'UA', ARE:'AE',
      GBR:'GB', USA:'US', UMI:'UM', URY:'UY', UZB:'UZ', VUT:'VU', VEN:'VE', VNM:'VN', VGB:'VG',
      VIR:'VI', WLF:'WF', ESH:'EH', YEM:'YE', ZMB:'ZM', ZWE:'ZW'
    };
    // Windows KHÔNG cài sẵn font emoji cờ quốc gia (Chrome/Edge trên Windows chỉ hiện 2 chữ cái
    // thô như "VN" thay vì hình lá cờ) — đây là giới hạn của hệ điều hành, không phải lỗi code.
    // Để hiện đúng lá cờ trên MỌI hệ điều hành (Windows/macOS/Linux/điện thoại), dùng ẢNH cờ
    // thật (SVG) từ flagcdn.com thay vì trông chờ vào font emoji của máy người dùng — vẫn tra
    // đúng 100% theo mã ISO alpha-2 chuẩn, chỉ khác là hiển thị bằng <img> thay vì ký tự Unicode.
    function flagImgHtmlForId(id, sizePx) {
      const iso2 = ISO3_TO_ISO2[id];
      if (!iso2) return '';
      const code = iso2.toLowerCase();
      const h = sizePx || 13;
      return '<img class="econ-flag" src="https://flagcdn.com/h' + (h * 2) + '/' + code + '.png" '
        + 'height="' + h + '" alt="' + iso2 + '" loading="lazy" '
        + 'onerror="this.style.display=\'none\'">';
    }

    // Danh sách các đảo/thực thể có thật thuộc từng quần đảo (toạ độ gần đúng theo bản đồ thực
    // tế) — dùng để dựng CỤM nhiều điểm đánh dấu bao trọn phạm vi thật của từng quần đảo, thay
    // vì chỉ 1 chấm duy nhất, cho sát với hình dạng/phạm vi trải dài thật trên bản đồ hơn.
    const VN_ISLAND_GROUPS = [
      {
        key: 'hoangsa', name: 'Quần đảo Hoàng Sa', color: 0xC9BE93,
        islands: [
          { name: 'Đảo Phú Lâm', lon: 112.3385, lat: 16.8345 },
          { name: 'Đảo Hoàng Sa', lon: 111.6144, lat: 16.8319 },
          { name: 'Đảo Quang Hoà', lon: 111.6106, lat: 16.4467 },
          { name: 'Đảo Duy Mộng', lon: 111.7011, lat: 16.4672 },
          { name: 'Đảo Quang Ảnh', lon: 111.6172, lat: 16.4433 },
          { name: 'Đảo Cây', lon: 112.3067, lat: 16.9908 },
          { name: 'Đá Bắc', lon: 111.6242, lat: 17.1058 },
          { name: 'Đảo Tri Tôn', lon: 111.1997, lat: 15.7836 }
        ]
      },
      {
        key: 'truongsa', name: 'Quần đảo Trường Sa', color: 0xC9BE93,
        islands: [
          { name: 'Đảo Trường Sa Lớn', lon: 111.9200, lat: 8.6450 },
          { name: 'Đảo Song Tử Tây', lon: 114.3283, lat: 11.4297 },
          { name: 'Đảo Sinh Tồn', lon: 114.3339, lat: 9.8814 },
          { name: 'Đảo Nam Yết', lon: 114.3672, lat: 10.1811 },
          { name: 'Đảo Sơn Ca', lon: 114.4694, lat: 10.3789 },
          { name: 'Đảo Sinh Tồn Đông', lon: 114.4181, lat: 9.8867 },
          { name: 'Đảo Phan Vinh', lon: 113.9678, lat: 8.9678 },
          { name: 'Đảo An Bang', lon: 112.9078, lat: 7.8858 },
          { name: 'Bãi Thuyền Chài', lon: 113.2500, lat: 8.1167 },
          { name: 'Đá Tây', lon: 112.2333, lat: 8.8500 }
        ]
      }
    ];

    function setStatus(msg, isError) {
      if (!statusEl) return;
      if (!msg) { statusEl.classList.add('hide'); return; }
      statusEl.textContent = msg;
      statusEl.classList.remove('hide');
      statusEl.classList.toggle('error', !!isError);
    }

    function gradientColorsFor(cfg) {
      return cfg.goodDirection === 'high' ? [...GRADIENT_LOW_TO_HIGH].reverse() : GRADIENT_LOW_TO_HIGH;
    }
    function scaleFor(cfg) {
      if (!cfg._scale) cfg._scale = d3.scaleLinear().domain(cfg.breaks).range(gradientColorsFor(cfg)).clamp(true);
      return cfg._scale;
    }
    function colorFor(value, cfg) {
      if (value === undefined || value === null || isNaN(value)) return NO_DATA_COLOR;
      return scaleFor(cfg)(value);
    }
    // Thang chú giải giờ là 1 cột DỌC chia thành từng khối chữ nhật đặc (không gradient mượt như
    // trước), giống phong cách TradingView: mỗi khoảng giữa 2 mốc (breaks) tô 1 màu riêng — các
    // khối chỉ khác nhau ở màu, không có hình dạng đặc biệt gì khác. CAP_RATIO quy định 2 khối
    // ngoài cùng (đại diện "vượt ngoài khung thấp nhất/cao nhất") chiếm bao nhiêu % biên độ giá
    // trị so với dải chính, để mọi mốc số (labels) và vạch đánh dấu khi hover luôn tính toán khớp
    // đúng vị trí thực trên cột.
    const LEGEND_CAP_RATIO = 0.12;
    function legendGeometry(cfg) {
      const min = cfg.breaks[0], max = cfg.breaks[cfg.breaks.length - 1];
      const span = max - min;
      const cap = span * LEGEND_CAP_RATIO;
      const total = span + cap * 2;
      return { min, max, span, cap, total };
    }
    // % tính từ ĐỈNH cột xuống (đỉnh = giá trị cao nhất) cho 1 giá trị bất kỳ, đã tính luôn 2 khối ngoài cùng.
    function valueToTopPercent(value, cfg) {
      const g = legendGeometry(cfg);
      const clamped = Math.max(g.min, Math.min(g.max, value));
      const fromBottom = g.cap + (clamped - g.min);
      return Math.max(0, Math.min(100, 100 - (fromBottom / g.total) * 100));
    }

    function renderLegend(cfg) {
      if (!legendBarEl || !legendLabelsEl) return;
      const colors = gradientColorsFor(cfg);
      const breaks = cfg.breaks;
      const n = breaks.length;
      const g = legendGeometry(cfg);
      const capGrow = (g.cap / g.total) * 100;

      // Dựng DOM từ TRÊN xuống DƯỚI: khối trên cùng (màu ở mốc cao nhất) -> các khối giữa theo thứ
      // tự giảm dần -> khối dưới cùng (màu ở mốc thấp nhất). Tất cả đều là khối chữ nhật phẳng.
      let segHtml = '<div class="econ-legend-seg econ-legend-seg-cap-top" style="flex:' + capGrow + ' 0 0; background:' + colors[n - 1] + '"></div>';
      for (let i = n - 2; i >= 0; i--) {
        const grow = ((breaks[i + 1] - breaks[i]) / g.total) * 100;
        segHtml += '<div class="econ-legend-seg" style="flex:' + grow + ' 0 0; background:' + colors[i] + '"></div>';
      }
      segHtml += '<div class="econ-legend-seg econ-legend-seg-cap-bottom" style="flex:' + capGrow + ' 0 0; background:' + colors[0] + '"></div>';
      segHtml += '<div class="econ-legend-marker" id="econ-legend-marker"></div>';
      legendBarEl.innerHTML = segHtml;

      legendLabelsEl.innerHTML = breaks.map(b => {
        const top = valueToTopPercent(b, cfg);
        return '<span style="top:' + top.toFixed(2) + '%">' + b + cfg.unit + '</span>';
      }).join('');
      resetLegendHover();
    }
    function updateLegendHover(cfg, name, rec, id) {
      const dotEl = document.getElementById('econ-legend-hover-dot');
      const textEl = document.getElementById('econ-legend-hover-text');
      const markerEl = document.getElementById('econ-legend-marker');
      if (!dotEl || !textEl) return;
      const flagHtml = flagImgHtmlForId(id);
      const nameHtml = flagHtml + name;
      if (rec) {
        dotEl.style.background = colorFor(rec.value, cfg);
        textEl.innerHTML = '<span class="econ-legend-hover-name">' + nameHtml + '</span> · '
          + '<span class="econ-legend-hover-val">' + rec.value.toFixed(1) + cfg.unit + '</span> '
          + '<span class="econ-legend-hover-year">(' + rec.year + ')</span>';
        if (markerEl) { markerEl.style.top = valueToTopPercent(rec.value, cfg) + '%'; markerEl.classList.add('show'); }
      } else {
        dotEl.style.background = NO_DATA_COLOR;
        textEl.innerHTML = '<span class="econ-legend-hover-name">' + nameHtml + '</span> · Không có dữ liệu';
        if (markerEl) markerEl.classList.remove('show');
      }
    }
    function resetLegendHover() {
      const dotEl = document.getElementById('econ-legend-hover-dot');
      const textEl = document.getElementById('econ-legend-hover-text');
      const markerEl = document.getElementById('econ-legend-marker');
      if (dotEl) dotEl.style.background = 'var(--border)';
      if (textEl) textEl.textContent = 'Di chuột vào bản đồ để xem chi tiết từng quốc gia';
      if (markerEl) markerEl.classList.remove('show');
    }

    async function fetchIndicator(key) {
      if (state.cache[key]) return state.cache[key];
      const cfg = ECON_INDICATORS[key];
      const url = 'https://api.worldbank.org/v2/country/all/indicator/' + cfg.code + '?format=json&per_page=300&mrnev=1';
      let json;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('WB API lỗi ' + res.status);
        json = await res.json();
      } catch (directErr) {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        const res2 = await fetch(proxyUrl);
        if (!res2.ok) throw new Error('WB API lỗi ' + res2.status);
        json = await res2.json();
      }
      const map = {};
      const rows = (json && json[1]) || [];
      rows.forEach(row => {
        if (row && row.value !== null && row.value !== undefined && row.countryiso3code) {
          map[row.countryiso3code] = { value: +row.value, year: row.date, name: row.country && row.country.value };
        }
      });
      state.cache[key] = map;
      return map;
    }

    function showTooltip(clientX, clientY, name, rec, cfg, id) {
      if (!tooltipEl) return;
      tooltipEl.innerHTML = '<div class="econ-tt-name"></div><div class="econ-tt-val"></div>';
      const flagHtml = flagImgHtmlForId(id, 12);
      const nameEl = tooltipEl.querySelector('.econ-tt-name');
      nameEl.innerHTML = flagHtml; // chỉ chứa <img> do chính ta tạo ra, an toàn để dùng innerHTML
      nameEl.appendChild(document.createTextNode((flagHtml ? ' ' : '') + name));
      const valEl = tooltipEl.querySelector('.econ-tt-val');
      if (rec) {
        valEl.textContent = rec.value.toFixed(1) + cfg.unit + '  ';
        const yearSpan = document.createElement('span');
        yearSpan.className = 'econ-tt-year';
        yearSpan.textContent = '(' + rec.year + ')';
        valEl.appendChild(yearSpan);
      } else {
        valEl.classList.add('econ-tt-nodata');
        valEl.textContent = 'Không có dữ liệu';
      }
      const tw = tooltipEl.offsetWidth || 140;
      // Hiện tooltip bên TRÁI con trỏ theo mặc định (thay vì bên phải như trước) vì cột chú giải/
      // chỉ số (%) luôn nằm bên phải bản đồ — nếu vẫn còn thiếu chỗ bên trái (vd. đang hover sát
      // mép trái khung), mới rơi về hiện bên phải như phương án dự phòng.
      let left = clientX - tw - 14;
      if (left < 8) left = Math.min(clientX + 14, window.innerWidth - tw - 8);
      tooltipEl.style.left = left + 'px';
      tooltipEl.style.top = Math.max(clientY - 12, 8) + 'px';
      tooltipEl.classList.add('show');
    }
    function hideTooltip() { if (tooltipEl) tooltipEl.classList.remove('show'); }

    // --- Lớp overlay 2D (biên giới + tô màu dữ liệu) vẽ bằng d3.geoPath lên canvas rời, dùng làm
    // texture trong suốt phủ lên khối cầu ảnh vệ tinh. Phép chiếu equirectangular căn đúng theo
    // hệ UV mặc định của SphereGeometry nên biên giới khớp chính xác lên bề mặt Trái Đất thật.
    const OVERLAY_W = 2048, OVERLAY_H = 1024;
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = OVERLAY_W; overlayCanvas.height = OVERLAY_H;
    const octx = overlayCanvas.getContext('2d');
    const overlayProjection = d3.geoEquirectangular()
      .translate([OVERLAY_W / 2, OVERLAY_H / 2])
      .scale(OVERLAY_W / (2 * Math.PI));
    const overlayPath = d3.geoPath(overlayProjection, octx);
    let overlayTexture = null;

    // ===================================================================================
    // "ẢNH NHẬN DIỆN" (PICK TEXTURE) — cơ chế phát hiện nước khi hover, viết lại hoàn toàn.
    // Ý tưởng: KHÔNG dùng bất kỳ phép toán hình học nào (point-in-polygon, geoContains…) vì
    // các phép toán đó phụ thuộc vào chất lượng dữ liệu biên giới (đa giác tự cắt, sai chiều
    // vẽ, lỗi vành đai quốc tế…) và dễ nhận nhầm nước. Thay vào đó: tô mỗi nước bằng ĐÚNG 1 mã
    // màu RGB duy nhất lên một canvas rời ("ảnh nhận diện"), dùng chung hệ chiếu equirectangular
    // với lớp overlay hiển thị. Khi hover, chỉ cần đọc đúng 1 điểm ảnh tại toạ độ UV giao điểm
    // trên khối cầu rồi giải mã màu -> ra thẳng nước tương ứng. Vì màu được đọc ra CHÍNH LÀ màu
    // đã thực sự được vẽ, kết quả luôn khớp tuyệt đối 100% với hình học đã dựng — không còn phụ
    // thuộc, và miễn nhiễm hoàn toàn, với các lỗi dữ liệu hình học kể trên. Đây là kỹ thuật
    // "color/GPU picking" tiêu chuẩn mà nhiều bản đồ chuyên nghiệp (kể cả TradingView) dùng để
    // nhận diện vùng hover chính xác tuyệt đối.
    const PICK_W = 4096, PICK_H = 2048; // độ phân giải riêng, cao hơn overlay hiển thị để biên
                                         // giới trên "ảnh nhận diện" mảnh & chính xác hơn nữa
    const pickCanvas = document.createElement('canvas');
    pickCanvas.width = PICK_W; pickCanvas.height = PICK_H;
    const pctx = pickCanvas.getContext('2d', { willReadFrequently: true });
    const pickProjection = d3.geoEquirectangular()
      .translate([PICK_W / 2, PICK_H / 2])
      .scale(PICK_W / (2 * Math.PI));
    const pickPath = d3.geoPath(pickProjection, pctx);

    // id 0 để dành cho "không thuộc nước nào" (biển, vùng chưa có polygon…) nên mã màu của từng
    // nước bắt đầu từ 1 — thừa sức mã hoá hơn 16 triệu nước cho tập dữ liệu chỉ ~200 quốc gia.
    function pickIdToColor(id) {
      return 'rgb(' + ((id >> 16) & 255) + ',' + ((id >> 8) & 255) + ',' + (id & 255) + ')';
    }
    function pickColorToId(r, g, b) { return (r << 16) | (g << 8) | b; }

    // Thứ tự tô lên "ảnh nhận diện" rất quan trọng với các nước lọt thỏm bên trong nước khác
    // (vd. Lesotho nằm trọn trong Nam Phi, San Marino/Vatican trong Ý…): phải tô nước có diện
    // tích LỚN trước, rồi tô nước NHỎ đè lên sau — nhờ vậy phần diện tích nhỏ xíu đó luôn được
    // nhận đúng ra nước nhỏ, thay vì bị nước lớn bao quanh ghi đè tuỳ theo thứ tự ngẫu nhiên có
    // sẵn trong dữ liệu GeoJSON gốc. Không cần dựa vào lỗ khoét (hole) hay chiều vẽ ring nào cả.
    function buildPickBuffer() {
      if (!state.world) return;
      const feats = state.world.features;
      const order = feats.map((f, i) => i).sort((a, b) => {
        let areaA = 0, areaB = 0;
        try { areaA = d3.geoArea(feats[a]); } catch (err) {}
        try { areaB = d3.geoArea(feats[b]); } catch (err) {}
        return areaB - areaA; // diện tích lớn vẽ trước, nhỏ vẽ sau (đè lên trên)
      });
      pctx.clearRect(0, 0, PICK_W, PICK_H);
      pctx.imageSmoothingEnabled = false;
      order.forEach(i => {
        const f = feats[i];
        if (!f.geometry) return;
        pctx.beginPath();
        try { pickPath(f); } catch (err) { return; }
        pctx.fillStyle = pickIdToColor(i + 1);
        pctx.fill('nonzero');
      });
    }

    // Đọc đúng 1 điểm ảnh trên "ảnh nhận diện" tại toạ độ UV (0..1) — CÙNG hệ UV với khối cầu
    // 3D (SphereGeometry mặc định) — rồi giải mã màu đó ra thẳng feature tương ứng. Không còn
    // bất kỳ phép toán hình học/lượng giác cầu nào xen vào giữa "điểm chuột trỏ vào" và "nước
    // được nhận ra" — loại bỏ tận gốc mọi khả năng sai lệch do dữ liệu biên giới.
    function pickFeatureAtUV(u, v) {
      if (!state.world) return null;
      // QUAN TRỌNG: UV.y do Three.js SphereGeometry trả về bằng 1 ở cực Bắc và 0 ở cực Nam,
      // trong khi hàng pixel (py) trên canvas 2D lại đếm từ trên (Bắc, py=0) xuống dưới (Nam,
      // py=PICK_H) — hai hệ NGƯỢC chiều nhau. Phải đảo thành (1 - v) trước khi quy đổi sang toạ
      // độ pixel, nếu không mọi điểm sẽ bị đọc nhầm sang đúng vĩ độ đối xứng ở bán cầu kia (vd.
      // rê chuột vào Việt Nam lại ra kết quả của một nước ở Nam bán cầu như Australia).
      const px = Math.min(PICK_W - 1, Math.max(0, Math.floor(u * PICK_W)));
      const py = Math.min(PICK_H - 1, Math.max(0, Math.floor((1 - v) * PICK_H)));
      // Cố tình KHÔNG try/catch ở đây: nếu getImageData bị lỗi (một số ít khung nhúng/sandbox có
      // chính sách bảo mật đặc thù chặn đọc lại điểm ảnh canvas), để lỗi bung ra cho handleHover
      // bắt và tự chuyển sang cơ chế dự phòng bên dưới, thay vì âm thầm coi như "không có nước".
      const data = pctx.getImageData(px, py, 1, 1).data;
      if (data[3] === 0) return null; // alpha 0 -> điểm chưa được tô -> ngoài mọi nước (biển)
      const id = pickColorToId(data[0], data[1], data[2]);
      if (id <= 0) return null;
      return state.world.features[id - 1] || null;
    }

    // Lưới an toàn dự phòng: cực hiếm khi cần tới, nhưng nếu trình duyệt/khung nhúng nào đó chặn
    // getImageData (dù canvas hoàn toàn "sạch", không dính ảnh cross-origin nào), hover không nên
    // "chết đứng" hoàn toàn — tự động rơi về cách dò kinh/vĩ độ bằng d3.geoContains() như trước,
    // hoạt động độc lập với "ảnh nhận diện" nên không bị ảnh hưởng bởi lý do khiến pixel-pick hỏng.
    function findFeatureAtLonLatFallback(lon, lat) {
      if (!state.world) return null;
      for (const f of state.world.features) {
        try {
          if (f.geometry && d3.geoContains(f, [lon, lat])) return f;
        } catch (err) {
          // Bỏ qua nước có dữ liệu hình học lỗi, không để crash làm treo tooltip.
        }
      }
      return null;
    }

    function drawOverlay() {
      if (!state.world) return;
      octx.clearRect(0, 0, OVERLAY_W, OVERLAY_H);
      // Chỉ vẽ viền biên giới mảnh, không tô màu cả nước theo dữ liệu — chỉ số vẫn xem được
      // qua hover (tooltip + chú giải bên dưới).
      state.world.features.forEach(f => {
        octx.beginPath();
        overlayPath(f);
        octx.lineWidth = 0.9;
        octx.strokeStyle = 'rgba(255,255,255,0.35)';
        octx.stroke();
      });
      if (state.hoverId != null) {
        const hf = state.world.features.find(f => f.id === state.hoverId);
        if (hf) {
          octx.beginPath();
          overlayPath(hf);
          octx.lineWidth = 2.4;
          octx.strokeStyle = '#ffffff';
          octx.stroke();
        }
      }
      if (overlayTexture) overlayTexture.needsUpdate = true;
    }

    // ===================================================================================
    // PANEL PHỤ #1 — XẾP HẠNG QUỐC GIA: dùng lại đúng dữ liệu World Bank vừa fetch cho bản
    // đồ (state.cache[key]), không gọi thêm API nào cả. Lọc theo ISO3_TO_ISO2 để chỉ giữ
    // quốc gia/vùng lãnh thổ thật, loại các dòng số liệu gộp theo khu vực/nhóm thu nhập mà
    // World Bank trả kèm (vd "World", "Euro area", "East Asia & Pacific"...).
    // ===================================================================================
    const rankListEl = document.getElementById('econ-rank-list');
    const rankSubEl = document.getElementById('econ-rank-sub');
    const rankTitleEl = document.getElementById('econ-rank-title');
    const rankDescEl = document.getElementById('econ-rank-desc');
    function renderRanking(cfg, key) {
      if (!rankListEl) return;
      // Tiêu đề + dòng mô tả luôn nêu rõ đang xếp hạng theo chỉ số nào và ý nghĩa con số (cao/thấp
      // là tốt), để không ai phải đoán "xếp hạng cái gì" khi nhìn vào panel này.
      if (rankTitleEl) rankTitleEl.textContent = '🏆 Xếp hạng quốc gia — ' + cfg.metricName;
      if (rankDescEl) rankDescEl.textContent = cfg.metricDesc;
      const map = state.cache[key] || {};
      const rows = Object.keys(map)
        .filter(iso3 => ISO3_TO_ISO2[iso3])
        .map(iso3 => ({ iso3: iso3, value: map[iso3].value, year: map[iso3].year, name: map[iso3].name }))
        .filter(r => !isNaN(r.value));
      if (!rows.length) { rankListEl.innerHTML = '<div class="econ-mini-empty">Không có dữ liệu</div>'; return; }
      const goodHigh = cfg.goodDirection === 'high';
      const sortedDesc = rows.slice().sort((a, b) => b.value - a.value);
      const top5 = sortedDesc.slice(0, 5);
      const bottom5 = sortedDesc.slice(-5).reverse();
      function rowHtml(r, idx, isTopGroup) {
        const good = goodHigh ? isTopGroup : !isTopGroup;
        const flag = flagImgHtmlForId(r.iso3, 12);
        return '<div class="econ-rank-row"><span class="econ-rank-rank">' + (idx + 1) + '</span>'
          + '<span class="econ-rank-name">' + flag + ' ' + (r.name || r.iso3) + '<span class="econ-rank-year"> (' + r.year + ')</span></span>'
          + '<span class="econ-rank-val ' + (good ? 'is-good' : 'is-bad') + '">' + r.value.toFixed(1) + cfg.unit + '</span></div>';
      }
      const topLabel = goodHigh ? 'CAO NHẤT (TỐT NHẤT)' : 'CAO NHẤT (XẤU NHẤT)';
      const bottomLabel = goodHigh ? 'THẤP NHẤT (XẤU NHẤT)' : 'THẤP NHẤT (TỐT NHẤT)';
      let html = '<div class="econ-rank-divider">' + topLabel + '</div>';
      html += top5.map((r, i) => rowHtml(r, i, true)).join('');
      html += '<div class="econ-rank-divider">' + bottomLabel + '</div>';
      html += bottom5.map((r, i) => rowHtml(r, i, false)).join('');
      rankListEl.innerHTML = html;
      if (rankSubEl) rankSubEl.textContent = rows.length + ' quốc gia';
    }

    // ===================================================================================
    // PANEL PHỤ #2 — XU HƯỚNG TOÀN CẦU: gọi số liệu tổng hợp TOÀN THẾ GIỚI ("WLD", chính
    // World Bank tính sẵn) theo dải năm gần nhất, vẽ 1 biểu đồ đường mini bằng canvas thuần
    // (không phụ thuộc thư viện chart ngoài) — dữ liệu thật 100%, cache theo từng chỉ số.
    // ===================================================================================
    const trendCanvasEl = document.getElementById('econ-trend-canvas');
    const trendSubEl = document.getElementById('econ-trend-sub');
    const trendTitleEl = document.getElementById('econ-trend-title');
    const trendDescEl = document.getElementById('econ-trend-desc');
    const trendCache = {};
    async function fetchWorldTrend(key) {
      if (trendCache[key]) return trendCache[key];
      const cfg = ECON_INDICATORS[key];
      const url = 'https://api.worldbank.org/v2/country/WLD/indicator/' + cfg.code + '?format=json&per_page=25&date=2005:2024';
      let json;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('WB API lỗi ' + res.status);
        json = await res.json();
      } catch (directErr) {
        const res2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
        if (!res2.ok) throw new Error('WB API lỗi ' + res2.status);
        json = await res2.json();
      }
      const rows = ((json && json[1]) || [])
        .filter(r => r && r.value !== null && r.value !== undefined)
        .map(r => ({ year: +r.date, value: +r.value }))
        .sort((a, b) => a.year - b.year);
      trendCache[key] = rows;
      return rows;
    }
    function renderTrendChart(cfg, rows) {
      if (!trendCanvasEl) return;
      const wrap = trendCanvasEl.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const cw = wrap.clientWidth || 260, ch = wrap.clientHeight || 90;
      trendCanvasEl.width = cw * dpr; trendCanvasEl.height = ch * dpr;
      const ctx = trendCanvasEl.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      if (!rows || rows.length < 2) {
        ctx.fillStyle = 'rgba(124,133,152,.8)'; ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Không có dữ liệu chuỗi thời gian', 4, ch / 2);
        return;
      }
      const padL = 4, padR = 4, padT = 8, padB = 16;
      const vals = rows.map(r => r.value);
      const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      const span = (max - min) || 1;
      const x = i => padL + (i / (rows.length - 1)) * (cw - padL - padR);
      const y = v => padT + (1 - (v - min) / span) * (ch - padT - padB);
      // vùng tô dưới đường
      ctx.beginPath();
      ctx.moveTo(x(0), y(rows[0].value));
      rows.forEach((r, i) => ctx.lineTo(x(i), y(r.value)));
      ctx.lineTo(x(rows.length - 1), ch - padB);
      ctx.lineTo(x(0), ch - padB);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, 'rgba(61,139,255,.28)');
      grad.addColorStop(1, 'rgba(61,139,255,0)');
      ctx.fillStyle = grad; ctx.fill();
      // đường chính
      ctx.beginPath();
      rows.forEach((r, i) => { const px = x(i), py = y(r.value); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.strokeStyle = '#3d8bff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();
      // chấm điểm cuối
      const lastI = rows.length - 1;
      ctx.beginPath(); ctx.arc(x(lastI), y(rows[lastI].value), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#3d8bff'; ctx.fill();
      // nhãn năm đầu/cuối
      ctx.fillStyle = 'rgba(124,133,152,.9)'; ctx.font = '9.5px "JetBrains Mono", monospace';
      ctx.fillText(String(rows[0].year), padL, ch - 4);
      const lastLabel = String(rows[lastI].year);
      ctx.fillText(lastLabel, cw - padR - ctx.measureText(lastLabel).width, ch - 4);
    }
    async function updateTrendPanel(key) {
      const cfg = ECON_INDICATORS[key];
      // Tiêu đề nêu rõ đường biểu đồ này là xu hướng của chỉ số nào (trước đây chỉ ghi chung
      // chung "Xu hướng toàn cầu" khiến không biết đang xem lạm phát, GDP hay thất nghiệp).
      if (trendTitleEl) trendTitleEl.textContent = '📈 Xu hướng toàn cầu — ' + cfg.metricName;
      if (trendDescEl) trendDescEl.textContent = cfg.metricDesc + ' (trung bình toàn thế giới, World Bank, 2005–2024).';
      try {
        const rows = await fetchWorldTrend(key);
        renderTrendChart(cfg, rows);
        if (trendSubEl && rows.length) {
          const last = rows[rows.length - 1];
          trendSubEl.textContent = last.value.toFixed(1) + cfg.unit + ' (' + last.year + ')';
        }
      } catch (e) {
        if (trendSubEl) trendSubEl.textContent = '';
        renderTrendChart(cfg, null);
      }
    }

    async function switchIndicator(key) {
      const cfg = ECON_INDICATORS[key];
      if (!cfg || !state.ready) return;
      state.current = key;
      titleEl.textContent = cfg.title;
      renderLegend(cfg);
      setStatus('Đang tải dữ liệu ' + cfg.tab.toLowerCase() + '…');
      try {
        await fetchIndicator(key);
        drawOverlay();
        renderRanking(cfg, key);
        setStatus('');
      } catch (e) {
        setStatus('Không tải được dữ liệu từ World Bank. Vui lòng thử lại sau.', true);
        // Tự ẩn sau vài giây — không để lớp thông báo che vĩnh viễn bản đồ (quả cầu vẫn
        // xoay/hover được bình thường ngay cả khi dữ liệu chỉ số này tải lỗi).
        setTimeout(() => setStatus(''), 3500);
      }
      updateTrendPanel(key);
    }

    if (tabsEl) {
      tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-econ]');
        if (!btn) return;
        tabsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        switchIndicator(btn.getAttribute('data-econ'));
      });
    }

    function latLonToVec3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    let renderer, scene, camera, earthGroup, earthMesh, overlayMesh, atmosphereMesh;
    let autoRotate = true;
    let autoRotateResumeT = null;
    const AUTO_ROTATE_SPEED = 0.00045;

    function buildAtmosphere() {
      const atmoGeo = new THREE.SphereGeometry(1.06, 48, 48);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vNormal; void main(){ float i = pow(0.68 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.2); gl_FragColor = vec4(0.45,0.72,1.0,1.0) * i; }`,
        blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
      });
      return new THREE.Mesh(atmoGeo, atmoMat);
    }
    // Texture hình tròn mờ dần (soft glow) dùng cho các ngôi sao thường — vẽ 1 lần bằng canvas
    // 2D rồi dùng làm "map" cho PointsMaterial, thay vì chấm vuông cứng mặc định của WebGL.
    function buildCircleGlowTexture(sizePx) {
      const c = document.createElement('canvas');
      c.width = c.height = sizePx;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(sizePx / 2, sizePx / 2, 0, sizePx / 2, sizePx / 2, sizePx / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, sizePx, sizePx);
      return new THREE.CanvasTexture(c);
    }

    // Texture ngôi sao "lấp lánh 4 cánh" (giống ảnh tham chiếu) cho một số ít ngôi sao to, sáng
    // nổi bật giữa nền — vẽ bằng canvas: 1 quầng sáng tròn + 2 vệt sáng bắt chéo nhau.
    function buildSparkleTexture(sizePx) {
      const c = document.createElement('canvas');
      c.width = c.height = sizePx;
      const ctx = c.getContext('2d');
      const cx = sizePx / 2, cy = sizePx / 2;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sizePx * 0.5);
      glow.addColorStop(0, 'rgba(255,255,255,1)');
      glow.addColorStop(0.3, 'rgba(255,255,255,0.5)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, sizePx * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = sizePx * 0.03;
      [0, Math.PI / 2].forEach(rot => {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(-sizePx * 0.47, 0); ctx.lineTo(sizePx * 0.47, 0);
        ctx.stroke();
        ctx.restore();
      });
      return new THREE.CanvasTexture(c);
    }

    // Dựng 1 lớp điểm sao rải ngẫu nhiên trên mặt cầu bán kính [radiusMin, radiusMax], mỗi ngôi
    // sao có màu hơi ngả (trắng/xanh dương/vàng nhạt/tím nhạt) để trông tự nhiên như ảnh chụp
    // thiên văn thật, thay vì toàn bộ cùng 1 màu trắng đơn điệu như trước.
    function buildStarLayer(count, radiusMin, radiusMax, size, texture, opacity) {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const palette = [[1, 1, 1], [0.75, 0.85, 1], [1, 0.93, 0.78], [0.85, 0.78, 1], [0.7, 0.95, 1]];
      for (let i = 0; i < count; i++) {
        const r = radiusMin + Math.random() * (radiusMax - radiusMin);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        const col = palette[Math.floor(Math.random() * palette.length)];
        const b = 0.6 + Math.random() * 0.4;
        colors[i * 3] = col[0] * b; colors[i * 3 + 1] = col[1] * b; colors[i * 3 + 2] = col[2] * b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size, sizeAttenuation: true, vertexColors: true, map: texture,
        transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending
      });
      return new THREE.Points(geo, mat);
    }

    // (Hàm dựng tinh vân 3D riêng cho khung quả cầu đã được bỏ — xem ghi chú tại buildStarfield()
    // bên dưới: giờ dùng chung 1 nền vũ trụ 2D duy nhất cho toàn khối để tránh 2 nền đá nhau.)

    // GHI CHÚ: không dựng thêm 1 lớp "tinh vân" 3D riêng bên trong khung quả cầu nữa — trước đây
    // làm vậy khiến khung quả cầu (hình vuông) có tông nền khác hẳn với nền vũ trụ 2D bao quanh
    // toàn khối "NỀN KINH TẾ" (xem initEconSpaceBackground bên dưới file), tạo cảm giác "2 nền
    // đá nhau" ở viền khung. Canvas WebGL này được tạo với alpha:true nên những chỗ không có
    // ngôi sao/quả cầu sẽ TRONG SUỐT, để lộ đúng nền vũ trụ 2D phía sau — nhờ vậy cả khối liền
    // thành 1 nền vũ trụ duy nhất, không còn viền hình vuông lộ liễu.
    function buildStarfield() {
      const group = new THREE.Group();
      group.add(buildStarLayer(500, 30, 78, 0.22, buildCircleGlowTexture(64), 0.85));
      group.add(buildStarLayer(18, 30, 72, 0.9, buildSparkleTexture(128), 0.9));
      return group;
    }
    // Danh sách các sprite "vầng sáng" phụ của từng đảo — mặc định ẩn (opacity 0), chỉ bật sáng
    // lên khi người dùng đang hover vào Việt Nam (đất liền), để hai quần đảo "sáng theo" đất liền
    // giống hệt cách viền trắng sáng lên quanh Việt Nam — xem setVNIslandsHighlighted() bên dưới.
    let vnIslandGlowSprites = [];
    const VN_MAINLAND_ID = 'VNM'; // mã ISO3 của Việt Nam trong file GeoJSON (khớp GEO_URL đang dùng)

    function addIslandMarkers(parent) {
      // Chấm đánh dấu nhỏ, dùng tông màu đất/cát tự nhiên (giống các đốm đảo/rạn san hô thật
      // nhìn từ ảnh vệ tinh) thay vì màu vàng/đỏ nổi bật kiểu quốc kỳ — và KHÔNG có vầng sáng/
      // vòng tròn hiện ra khi hover, để mọi lúc trông giống ảnh vệ tinh thật, không giống điểm
      // đánh dấu (marker) nhân tạo.
      const dotTex = buildCircleGlowTexture(64);
      vnIslandGlowSprites = [];
      VN_ISLAND_GROUPS.forEach(group => {
        const groupObj = new THREE.Group();
        groupObj.name = group.key;
        group.islands.forEach(isl => {
          const pos = latLonToVec3(isl.lat, isl.lon, 1.006);

          // Sprite nhỏ, không blending cộng sáng (Additive) — chỉ là một đốm đất/cát mờ nhẹ,
          // hoà vào nền đại dương của texture Trái Đất giống các đảo/rạn san hô nhỏ thật sự.
          const dotMat = new THREE.SpriteMaterial({
            map: dotTex, color: group.color, transparent: true, opacity: 0.85,
            depthWrite: false, sizeAttenuation: true
          });
          const dot = new THREE.Sprite(dotMat);
          dot.position.copy(pos);
          dot.scale.set(0.006, 0.006, 1);
          dot.name = isl.name;
          groupObj.add(dot);

          // Sprite "vầng sáng" phụ, to hơn hẳn chấm gốc, blending cộng sáng (Additive), màu
          // trắng-vàng nổi bật — mặc định opacity 0 (vô hình), chỉ hiện ra khi hover Việt Nam.
          const glowMat = new THREE.SpriteMaterial({
            map: dotTex, color: 0xfff2c9, transparent: true, opacity: 0,
            depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending
          });
          const glow = new THREE.Sprite(glowMat);
          glow.position.copy(pos);
          glow.scale.set(0.024, 0.024, 1);
          glow.renderOrder = 5;
          groupObj.add(glow);
          vnIslandGlowSprites.push(glow);
        });
        parent.add(groupObj);
      });
    }

    // Bật/tắt vầng sáng của TOÀN BỘ đảo thuộc Hoàng Sa + Trường Sa — gọi hàm này mỗi khi biết
    // được đang hover đúng Việt Nam (đất liền) hay không, để hai quần đảo luôn "ăn theo" cùng
    // lúc với phần đất liền, tạo cảm giác đây là MỘT lãnh thổ Việt Nam thống nhất khi hover.
    let vnIslandsHighlighted = false;
    function setVNIslandsHighlighted(on) {
      if (vnIslandsHighlighted === on) return;
      vnIslandsHighlighted = on;
      vnIslandGlowSprites.forEach(s => { s.material.opacity = on ? 0.95 : 0; });
    }

    function onResize() {
      if (!renderer || !wrapEl) return;
      const w = wrapEl.clientWidth, h = wrapEl.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function scheduleAutoRotateResume() {
      clearTimeout(autoRotateResumeT);
      autoRotateResumeT = setTimeout(() => { autoRotate = true; }, 2200);
    }

    // --- Hover: raycast từ con trỏ chuột vào khối cầu để lấy đúng toạ độ UV của điểm giao (UV
    // này đến thẳng từ hình học SphereGeometry của Three.js, không tự tính lại nên luôn chính
    // xác), rồi ĐỌC MÀU tại đúng điểm đó trên "ảnh nhận diện" (xem khối pickFeatureAtUV phía
    // trên) để biết ngay đó là nước nào — không còn một phép toán hình học/dò đa giác nào nữa.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hoverRafPending = false;

    function handleHover(clientX, clientY) {
      try {
        const rect = canvasEl.getBoundingClientRect();
        ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hits = earthMesh ? raycaster.intersectObject(earthMesh) : [];
        if (!hits.length || !hits[0].uv) {
          if (state.hoverId != null) { state.hoverId = null; drawOverlay(); }
          setVNIslandsHighlighted(false);
          hideTooltip(); resetLegendHover();
          return;
        }
        const uv = hits[0].uv;
        const cfg = ECON_INDICATORS[state.current];
        const dataMap = state.cache[state.current] || {};
        let f;
        if (state.pickBroken) {
          // Đã xác định "ảnh nhận diện" không dùng được trong môi trường này -> dùng thẳng dự phòng.
          // (uv.y=1 ở cực Bắc, uv.y=0 ở cực Nam trong hệ UV của Three.js -> vĩ độ = uv.y*180-90)
          f = findFeatureAtLonLatFallback(uv.x * 360 - 180, uv.y * 180 - 90);
        } else {
          try {
            f = pickFeatureAtUV(uv.x, uv.y);
          } catch (pickErr) {
            state.pickBroken = true; // chỉ cần rơi 1 lần -> nhớ luôn, khỏi thử lại đọc pixel mỗi lần rê chuột
            if (console && console.warn) {
              console.warn('[econGlobe] Không đọc được "ảnh nhận diện" (getImageData bị chặn trong môi trường này) — tự động chuyển sang cách dò kinh/vĩ độ dự phòng.', pickErr);
            }
            f = findFeatureAtLonLatFallback(uv.x * 360 - 180, uv.y * 180 - 90);
          }
        }
        if (f) {
          if (state.hoverId !== f.id) { state.hoverId = f.id; drawOverlay(); }
          // Đang hover đúng polygon đất liền Việt Nam (id=VNM trong GeoJSON) -> bật thêm vầng
          // sáng ở Hoàng Sa + Trường Sa để cả 3 phần cùng "sáng lên" như một lãnh thổ thống nhất.
          setVNIslandsHighlighted(f.id === VN_MAINLAND_ID);
          const name = (f.properties && f.properties.name) || f.id;
          const displayName = f.id === VN_MAINLAND_ID ? name + ' (gồm Hoàng Sa & Trường Sa)' : name;
          showTooltip(clientX, clientY, displayName, dataMap[f.id], cfg, f.id);
          updateLegendHover(cfg, displayName, dataMap[f.id], f.id);
        } else {
          if (state.hoverId != null) { state.hoverId = null; drawOverlay(); }
          setVNIslandsHighlighted(false);
          hideTooltip(); resetLegendHover();
        }
      } catch (err) {
        // Không để lỗi bất ngờ làm tooltip bị kẹt lại ở nước trước đó — nhưng vẫn log ra console
        // để chẩn đoán được nếu có sự cố, thay vì nuốt lỗi âm thầm hoàn toàn.
        if (console && console.warn) console.warn('[econGlobe] Lỗi khi xử lý hover:', err);
        state.hoverId = null;
        hideTooltip(); resetLegendHover();
      }
    }

    // --- Zoom quả cầu: cuộn chuột (desktop), chụm 2 ngón (cảm ứng), và 3 nút +/−/reset. Thay vì
    // gán thẳng camera.position.z (gây giật/nhảy khung hình), mọi thao tác chỉ cập nhật một biến
    // "targetZoom" — khoảng cách camera THỰC SỰ sẽ trôi mượt dần tới đó mỗi khung hình trong
    // animate() (xem easing bên dưới), cho cảm giác phóng to/thu nhỏ mượt như các app bản đồ thật.
    const ZOOM_MIN = 1.6, ZOOM_MAX = 5.3, ZOOM_DEFAULT = 3.15;
    let targetZoom = ZOOM_DEFAULT;
    function setTargetZoom(z) {
      targetZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    }

    // --- Quán tính (trớn) khi xoay quả cầu: kéo/vuốt vẫn xoay trực tiếp 1:1 theo tay cho cảm
    // giác bắt chuột chính xác, nhưng khi THẢ tay ra, quả cầu không dừng khựng lại ngay mà tiếp
    // tục trôi theo đúng vận tốc góc vừa đo được lúc thả, rồi giảm tốc dần đều (ma sát) mỗi khung
    // hình cho tới khi dừng hẳn — giống hệt cảm giác các app bản đồ/globe chuyên nghiệp (Google
    // Maps, Cesium...). momentumY/momentumX tính bằng radian/khung hình, được animate() cộng dồn
    // vào rotation mỗi khung hình khi momentumActive = true.
    let momentumY = 0, momentumX = 0, momentumActive = false;
    const MOMENTUM_FRICTION = 0.88;
    const MOMENTUM_STOP_EPS = 0.00006;

    function bindPointerInteraction() {
      let dragging = false, moved = false, prevX = 0, prevY = 0, prevT = 0;
      const k = 0.006;
      // Vận tốc góc đo bằng trung bình trượt (exponential moving average) trong lúc kéo, thay vì
      // lấy nguyên delta của lần pointermove cuối cùng — tránh trường hợp thả tay đúng lúc chuột
      // vừa khựng lại (delta cuối = 0) khiến quán tính bị "hụt" dù cả quá trình kéo trước đó vẫn
      // đang trôi nhanh.
      let velY = 0, velX = 0;
      canvasEl.style.touchAction = 'none';

      // Theo dõi mọi ngón tay đang chạm để nhận diện cử chỉ chụm 2 ngón (pinch-to-zoom), tách
      // biệt hẳn với thao tác xoay 1 ngón/1 chuột ở trên.
      const activePointers = new Map();
      let pinchStartDist = null, pinchStartZoom = null;

      function pinchDistance() {
        const pts = Array.from(activePointers.values());
        if (pts.length < 2) return null;
        return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }

      canvasEl.addEventListener('pointerdown', (e) => {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { canvasEl.setPointerCapture(e.pointerId); } catch (err) {}
        // Bắt đầu thao tác tay mới -> huỷ ngay mọi quán tính đang trôi dở từ lần kéo trước.
        momentumActive = false; momentumY = 0; momentumX = 0;

        if (activePointers.size >= 2) {
          dragging = false;
          pinchStartDist = pinchDistance();
          pinchStartZoom = targetZoom;
          autoRotate = false;
          clearTimeout(autoRotateResumeT);
          hideTooltip();
          return;
        }
        dragging = true; moved = false;
        autoRotate = false;
        clearTimeout(autoRotateResumeT);
        prevX = e.clientX; prevY = e.clientY; prevT = performance.now();
        velY = 0; velX = 0;
        canvasEl.classList.add('grabbing');
      });

      canvasEl.addEventListener('pointermove', (e) => {
        if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size >= 2) {
          const dist = pinchDistance();
          if (dist && pinchStartDist) {
            setTargetZoom(pinchStartZoom * (pinchStartDist / dist));
          }
          hideTooltip();
          return;
        }
        if (dragging) {
          const now = performance.now();
          const dt = Math.max(1, now - prevT);
          const dx = e.clientX - prevX, dy = e.clientY - prevY;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
          const rotDY = dx * k, rotDX = dy * k;
          earthGroup.rotation.y += rotDY;
          earthGroup.rotation.x += rotDX;
          earthGroup.rotation.x = Math.max(-1.3, Math.min(1.3, earthGroup.rotation.x));
          // Trung bình trượt vận tốc góc (radian/ms) — mượt hoá để không bị ảnh hưởng bởi 1 lần
          // rê chuột bất thường (quá nhanh/quá chậm) ngay sát thời điểm thả tay.
          velY = velY * 0.72 + (rotDY / dt) * 0.28;
          velX = velX * 0.72 + (rotDX / dt) * 0.28;
          prevX = e.clientX; prevY = e.clientY; prevT = now;
          hideTooltip();
          return;
        }
        if (hoverRafPending) return;
        hoverRafPending = true;
        requestAnimationFrame(() => { hoverRafPending = false; handleHover(e.clientX, e.clientY); });
      });

      const endDrag = (e) => {
        if (e) activePointers.delete(e.pointerId);
        if (activePointers.size < 2) { pinchStartDist = null; pinchStartZoom = null; }
        if (!dragging) return;
        dragging = false;
        canvasEl.classList.remove('grabbing');
        // Quy đổi vận tốc góc (radian/ms) sang radian/khung hình (~16.7ms ở 60fps) rồi giao cho
        // animate() tiếp tục xoay dần và giảm tốc — chỉ kích hoạt khi thực sự có di chuyển đáng kể,
        // tránh trường hợp click chuột đứng yên cũng bị "trớn" 1 chút do sai số làm tròn.
        if (moved && (Math.abs(velY) > 0.00002 || Math.abs(velX) > 0.00002)) {
          momentumY = velY * 7; momentumX = velX * 7; momentumActive = true;
        }
        scheduleAutoRotateResume();
        if (!moved && e && typeof e.clientX === 'number') handleHover(e.clientX, e.clientY);
      };
      canvasEl.addEventListener('pointerup', endDrag);
      canvasEl.addEventListener('pointercancel', endDrag);
      window.addEventListener('pointerup', endDrag);

      canvasEl.addEventListener('pointerleave', () => {
        if (dragging) return;
        state.hoverId = null; drawOverlay();
        setVNIslandsHighlighted(false);
        hideTooltip(); resetLegendHover();
        scheduleAutoRotateResume();
      });
      canvasEl.addEventListener('pointerenter', () => {
        clearTimeout(autoRotateResumeT);
        autoRotate = false;
      });

      // Cuộn chuột để phóng to/thu nhỏ — nhân theo khoảng cách MỤC TIÊU hiện tại (không phải vị
      // trí camera thực đang trôi dở) để tốc độ zoom cảm giác đều nhau và không bị giật khi cuộn
      // liên tục nhiều lần trước khi easing kịp bắt kịp.
      canvasEl.addEventListener('wheel', (e) => {
        // Chỉ zoom quả cầu khi giữ Ctrl/Cmd — lăn chuột thường phải cuộn trang bình thường
        // thay vì bị quả cầu "nuốt" mất sự kiện lăn chuột.
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        autoRotate = false;
        clearTimeout(autoRotateResumeT);
        setTargetZoom(targetZoom + e.deltaY * 0.0016 * targetZoom);
        scheduleAutoRotateResume();
      }, { passive: false });

      function stepZoom(factor) {
        autoRotate = false;
        clearTimeout(autoRotateResumeT);
        setTargetZoom(targetZoom * factor);
        scheduleAutoRotateResume();
      }
      const zoomInBtn = document.getElementById('econ-zoom-in');
      const zoomOutBtn = document.getElementById('econ-zoom-out');
      const zoomResetBtn = document.getElementById('econ-zoom-reset');
      if (zoomInBtn) zoomInBtn.addEventListener('click', () => stepZoom(0.78));
      if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => stepZoom(1 / 0.78));
      if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => setTargetZoom(ZOOM_DEFAULT));
    }

    // Vẫn cần sửa vài polygon có thứ tự đỉnh (winding order) bị đảo ngược trong bộ GeoJSON nguồn
    // (cụ thể là Bermuda) — không phải để tránh geoContains như trước nữa (kỹ thuật đó đã bị bỏ
    // hẳn), mà vì ring bị đảo ngược làm d3.geoArea() tính ra diện tích SAI (ra "gần trọn mặt cầu"
    // thay vì đúng diện tích tí hon thật của nó). Diện tích này giờ được dùng để QUYẾT ĐỊNH THỨ TỰ
    // tô lên "ảnh nhận diện" (nước lớn tô trước, nước nhỏ tô sau — xem buildPickBuffer phía trên);
    // nếu để sai, Bermuda sẽ bị tưởng là "nước lớn nhất thế giới" và được tô trước tiên, khiến các
    // nước khác đè lên che mất — vẫn cần đảo lại ring để d3.geoArea() phản ánh đúng diện tích thật.
    // Không quốc gia thực nào có diện tích vượt quá nửa mặt cầu (2π sr), nên hễ d3.geoArea() tính
    // ra lớn hơn ngưỡng đó, chắc chắn ring bị đảo ngược -> tự đảo lại thứ tự điểm cho đúng.
    function fixInvertedWinding(world) {
      if (!world || !world.features) return world;
      let fixedCount = 0;
      world.features.forEach(f => {
        if (!f.geometry) return;
        let area;
        try { area = d3.geoArea(f); } catch (err) { return; }
        if (area > 2 * Math.PI) {
          const type = f.geometry.type;
          if (type === 'Polygon') {
            f.geometry.coordinates = f.geometry.coordinates.map(ring => ring.slice().reverse());
          } else if (type === 'MultiPolygon') {
            f.geometry.coordinates = f.geometry.coordinates.map(poly => poly.map(ring => ring.slice().reverse()));
          }
          fixedCount++;
        }
      });
      if (fixedCount && console && console.warn) {
        console.warn('[econGlobe] Đã sửa ' + fixedCount + ' nước có winding order bị đảo ngược trong dữ liệu biên giới.');
      }
      return world;
    }

    (async function boot() {
      setStatus('Đang tải quả cầu…');
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 0, ZOOM_DEFAULT);

        scene.add(buildStarfield());
        scene.add(new THREE.AmbientLight(0x445066, 1.15));
        const sun = new THREE.DirectionalLight(0xffffff, 1.35);
        sun.position.set(4, 2.2, 4);
        scene.add(sun);

        earthGroup = new THREE.Group();
        earthGroup.rotation.y = THREE.MathUtils.degToRad(-110);
        earthGroup.rotation.x = THREE.MathUtils.degToRad(8);
        scene.add(earthGroup);

        atmosphereMesh = buildAtmosphere();
        scene.add(atmosphereMesh);

        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';
        const BASE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/';
        const colorMap = loader.load(BASE + 'earth-blue-marble.jpg');
        const bumpMap = loader.load(BASE + 'earth-topology.png');
        const specMap = loader.load(BASE + 'earth-water.png');

        const earthGeo = new THREE.SphereGeometry(1, 56, 56);
        const earthMat = new THREE.MeshPhongMaterial({
          map: colorMap, bumpMap: bumpMap, bumpScale: 0.015,
          specularMap: specMap, specular: new THREE.Color(0x333333), shininess: 9
        });
        earthMesh = new THREE.Mesh(earthGeo, earthMat);
        earthGroup.add(earthMesh);

        overlayTexture = new THREE.CanvasTexture(overlayCanvas);
        overlayTexture.needsUpdate = true;
        const overlayGeo = new THREE.SphereGeometry(1.004, 56, 56);
        const overlayMat = new THREE.MeshBasicMaterial({ map: overlayTexture, transparent: true, depthWrite: false });
        overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
        earthGroup.add(overlayMesh);

        addIslandMarkers(earthGroup);
        bindPointerInteraction();

        const ro = new ResizeObserver(onResize);
        ro.observe(wrapEl);
        onResize();
        window.addEventListener('resize', onResize);

        // Chỉ render khi khung quả cầu thực sự đang hiển thị trên màn hình (cuộn tới) VÀ tab đang
        // mở — tránh lãng phí GPU/pin khi người dùng cuộn xuống phần khác hoặc chuyển sang tab khác,
        // đây là nguyên nhân giật/lag phổ biến nhất với cảnh 3D chạy vòng lặp vô hạn.
        let sceneOnScreen = true;
        if (typeof IntersectionObserver !== 'undefined') {
          new IntersectionObserver((entries) => {
            sceneOnScreen = entries[0] && entries[0].isIntersecting;
          }, { threshold: 0.01 }).observe(wrapEl);
        }

        function animate() {
          requestAnimationFrame(animate);
          if (!sceneOnScreen || document.hidden) return;

          if (momentumActive) {
            // Quán tính: vẫn xoay tiếp theo đúng vận tốc lúc thả tay, giảm dần đều mỗi khung hình
            // (ma sát) cho tới khi gần như bằng 0 thì dừng hẳn và nhường lại cho auto-rotate.
            earthGroup.rotation.y += momentumY;
            earthGroup.rotation.x += momentumX;
            earthGroup.rotation.x = Math.max(-1.3, Math.min(1.3, earthGroup.rotation.x));
            momentumY *= MOMENTUM_FRICTION; momentumX *= MOMENTUM_FRICTION;
            if (Math.abs(momentumY) < MOMENTUM_STOP_EPS && Math.abs(momentumX) < MOMENTUM_STOP_EPS) {
              momentumActive = false;
            }
          } else if (autoRotate) {
            earthGroup.rotation.y += AUTO_ROTATE_SPEED;
          }

          // Zoom mượt: camera trôi dần tới targetZoom mỗi khung hình thay vì nhảy tức thì — hệ số
          // 0.14 cho cảm giác "trớn" nhẹ giống các app bản đồ/globe chuyên nghiệp.
          camera.position.z += (targetZoom - camera.position.z) * 0.14;

          renderer.render(scene, camera);
        }
        animate();

        try {
          let world;
          try {
            world = await d3.json(GEO_URL);
          } catch (directErr) {
            world = await d3.json('https://api.allorigins.win/raw?url=' + encodeURIComponent(GEO_URL));
          }
          state.world = fixInvertedWinding(world);
          // Dựng "ảnh nhận diện" 1 lần duy nhất ngay khi có hình học biên giới — hình học không
          // đổi khi chuyển tab chỉ số (Lạm phát/GDP/Thất nghiệp) nên không cần dựng lại về sau.
          buildPickBuffer();
          state.ready = true;
          await switchIndicator(state.current);
          // World Bank thường công bố/điều chỉnh số liệu quanh năm (không theo lịch cố định).
          // Cứ vài giờ tự xoá cache và tải lại chỉ số đang xem, để nếu có số mới hơn công bố
          // giữa lúc người dùng đang mở tab, trang vẫn tự bắt kịp mà không cần F5.
          setInterval(() => {
            state.cache = {};
            for (const k in trendCache) delete trendCache[k];
            switchIndicator(state.current);
          }, 3 * 60 * 60 * 1000);
        } catch (geoErr) {
          setStatus('Không tải được dữ liệu biên giới nước — quả cầu vẫn xoay nhưng chưa hover được nước.', true);
          setTimeout(() => setStatus(''), 4000);
        }
      } catch (e) {
        setStatus('Không tải được quả cầu. Kiểm tra kết nối mạng và thử lại.', true);
      }
    })();
  })();

  (function initEconSpaceBackground() {
    const starEl = document.getElementById('econ-shooting-star');
    const sectionEl = document.getElementById('econ-section');
    if (!starEl || !sectionEl) return;

    function rand(a, b) { return a + Math.random() * (b - a); }
    let onScreen = true;
    let fireTimer = null;

    function fireShootingStar() {
      const fromLeft = Math.random() < 0.5;
      const startTopPct = rand(4, 42);
      const angle = rand(14, 26); // độ nghiêng xuống, giống sao băng thật
      const distVW = rand(45, 70);
      const distVH = rand(24, 42);

      starEl.style.top = startTopPct + '%';
      starEl.style.left = fromLeft ? '-10%' : '110%';
      starEl.style.setProperty('--shoot-angle', (fromLeft ? angle : 180 - angle) + 'deg');
      starEl.style.setProperty('--shoot-dx', (fromLeft ? distVW : -distVW) + 'vw');
      starEl.style.setProperty('--shoot-dy', distVH + 'vh');

      // Bỏ rồi gắn lại class để trình duyệt restart animation từ đầu mỗi lần bắn sao băng mới.
      starEl.classList.remove('fire');
      // eslint-disable-next-line no-unused-expressions
      void starEl.offsetWidth; // ép reflow để animation restart đúng
      starEl.classList.add('fire');
    }

    function scheduleNext() {
      clearTimeout(fireTimer);
      fireTimer = setTimeout(() => {
        if (onScreen && !document.hidden) fireShootingStar();
        scheduleNext();
      }, rand(4500, 11000));
    }

    starEl.addEventListener('animationend', () => starEl.classList.remove('fire'));

    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver((entries) => {
        onScreen = entries[0] && entries[0].isIntersecting;
      }, { threshold: 0.01 }).observe(sectionEl);
    }

    scheduleNext();
  })();

  (function initEconTicker() {
    const listEl = document.getElementById('econ-ticker-list');
    const subEl = document.getElementById('econ-ticker-sub');
    if (!listEl) return;

    const PAIRS = [
      { code: 'VND', label: 'USD/VND' },
      { code: 'EUR', label: 'USD/EUR' },
      { code: 'JPY', label: 'USD/JPY' },
      { code: 'CNY', label: 'USD/CNY' },
      { code: 'KRW', label: 'USD/KRW' },
      { code: 'GBP', label: 'USD/GBP' },
      { code: 'AUD', label: 'USD/AUD' },
      { code: 'SGD', label: 'USD/SGD' }
    ];

    function fmtRate(v) {
      if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
      if (v >= 10) return v.toFixed(2);
      return v.toFixed(4);
    }

    async function loadRates() {
      try {
        const url = 'https://open.er-api.com/v6/latest/USD';
        let json;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Tỷ giá API lỗi ' + res.status);
          json = await res.json();
        } catch (directErr) {
          const res2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
          if (!res2.ok) throw new Error('Tỷ giá API lỗi ' + res2.status);
          json = await res2.json();
        }
        const rates = json && json.rates;
        if (!rates) throw new Error('Không có dữ liệu tỷ giá');
        listEl.innerHTML = PAIRS
          .filter(p => typeof rates[p.code] === 'number')
          .map(p => '<div class="econ-ticker-row"><span class="econ-ticker-pair">' + p.label + '</span>'
            + '<span class="econ-ticker-rate">' + fmtRate(rates[p.code]) + '</span></div>')
          .join('');
        if (subEl) {
          const d = json.time_last_update_utc ? new Date(json.time_last_update_utc) : null;
          subEl.textContent = d && !isNaN(d) ? 'Cập nhật ' + d.toLocaleDateString('vi-VN') : '';
        }
      } catch (e) {
        listEl.innerHTML = '<div class="econ-mini-empty">Không tải được tỷ giá, thử lại sau.</div>';
      }
    }

    loadRates();
    setInterval(loadRates, 10 * 60 * 1000);
  })();


  /* ========================= INIT & EVENTS ========================= */
  document.querySelectorAll('.coins-table th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      updateSortHeaders();
      renderCoinsTable();
    });
  });
  $('#coin-search').addEventListener('input', () => {
    const inputEl = $('#coin-search');
    // Gõ thường tự động chuyển thành in hoa ngay trong ô tìm kiếm (VD: gõ "btc" -> hiện "BTC"), giữ nguyên vị
    // trí con trỏ để gõ tiếp không bị nhảy lung tung.
    const upper = inputEl.value.toUpperCase();
    if (inputEl.value !== upper) {
      const selStart = inputEl.selectionStart, selEnd = inputEl.selectionEnd;
      inputEl.value = upper;
      try { inputEl.setSelectionRange(selStart, selEnd); } catch (e) {}
    }
    const q = (inputEl.value || '').trim();
    clearTimeout(searchDebounceTimer);
    if (!q) {
      searchActive = false;
      searchReqSeq++; // hủy mọi kết quả tìm kiếm đang chờ trả về của lượt gõ trước
      if (searchAbortController) { searchAbortController.abort(); searchAbortController = null; }
      refreshDisplayCoins(); // quay lại đúng 10 mã mặc định
      renderCoinsTable();
      updateSortHeaders();
      $('#coins-updated').textContent = 'Danh sách làm mới: ' + new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      connectCoinTicker();
      return;
    }
    searchActive = true;
    searchReqSeq++; // báo mọi kết quả (cục bộ lẫn mạng) của lượt gõ trước đều đã cũ
    const seq = searchReqSeq;

    // Trả kết quả TỨC THÌ (0ms, không cần mạng) bằng cách khớp ngay trong buffer top 30 coin đã tải sẵn đầy đủ
    // giá/24h/sparkline — phủ được hầu hết coin hay tìm (BTC, ETH, SOL,...) ngay khi vừa gõ xong, không phải chờ.
    const ql = q.toLowerCase();
    const localMatches = rawCoinsData.filter((c) =>
      (c.name || '').toLowerCase().includes(ql) || (c.symbol || '').toLowerCase().includes(ql) || (c.id || '').toLowerCase().includes(ql)
    );
    if (localMatches.length) {
      coinsData = localMatches;
      buildSymbolMap();
      applyFeedAvailability();
      renderCoinsTable();
      updateSortHeaders();
      $('#coins-updated').textContent = 'Kết quả tìm kiếm: ' + coinsData.length + ' coin';
      connectCoinTicker();
    }

    // Sau debounce ngắn, tìm tiếp TRÊN TOÀN THỊ TRƯỜNG để bổ sung cả những coin ngoài top 30 (có cache nên gõ
    // lại cùng từ khóa sau này sẽ trả về ngay không cần gọi mạng nữa).
    searchDebounceTimer = setTimeout(() => performCoinSearch(q, seq), 200);
  });

  // Bấm vào một coin -> lưu mã vào localStorage (đúng key 'ok_symbol' mà Terminal đọc khi khởi động)
  // rồi chuyển sang trang Terminal, chart sẽ tự mở đúng coin đó.
  $('#coins-tbody').addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-symbol]');
    if (!row) return;
    const symbol = row.dataset.symbol;
    if (!symbol) return;
    if (row.dataset.noFeed === '1') {
      showCoinToast(symbol + ' chưa niêm yết cặp USDT trên Binance Spot nên không có biểu đồ Terminal.');
      return;
    }
    localStorage.setItem('ok_symbol', symbol + 'USDT');
    window.location.href = 'index.html';
  });

  let coinToastTimer = null;
  function showCoinToast(msg) {
    let el = document.getElementById('coin-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'coin-toast';
      el.className = 'coin-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(coinToastTimer);
    coinToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    renderSessions();
    setInterval(renderSessions, 30000);

    renderQuickStats({});
    let fngValue = null, fngLabel = null;
    const onFng = (v, l) => { fngValue = v; fngLabel = l; renderQuickStats({ btcDominance: lastBtcDominance, capChange24h: lastCapChange, fngValue, fngLabel }); };
    loadSentiment(onFng);
    startSentimentCountdownLoop(onFng); // đếm ngược real-time, tự lấy số mới đúng lúc nguồn công bố — giống hệt terminal

    const onGlobal = (dom, chg) => { renderQuickStats({ btcDominance: dom, capChange24h: chg, fngValue, fngLabel }); };
    loadTrends(onGlobal);

    loadNews();
    loadBinanceSymbolWhitelist(); // biết mã nào thực sự có cặp USDT trên Binance Spot trước khi mở WS
    loadCoins(); // sau khi tải xong sẽ tự mở WebSocket Binance để cập nhật giá real-time từng tick

    // Xu hướng toàn cầu (vốn hóa/dominance): CoinGecko không có WebSocket công khai -> làm mới mỗi 60 giây
    setInterval(() => loadTrends(onGlobal), 60000);
    // Tin tức nóng: đúng chu kỳ 60 giây như terminal đang dùng
    setInterval(loadNews, 60000);
    // Làm mới lại nhãn "X phút trước" mỗi 30s dù chưa có tin mới (không cần gọi lại API)
    setInterval(() => { if (lastNewsItems.length) renderNewsList(lastNewsItems, true); }, 30000);
    // Danh sách coin (vốn hóa/rank/sparkline) làm mới mỗi 5 phút — còn GIÁ & %24h đã real-time qua WebSocket ở trên
    setInterval(loadCoins, 5 * 60 * 1000);
    // Danh sách cặp USDT trên Binance hiếm khi đổi -> làm mới mỗi 30 phút là đủ để bắt kịp coin mới niêm yết
    setInterval(loadBinanceSymbolWhitelist, 30 * 60 * 1000);

    // Tự kết nối lại WebSocket nếu trình duyệt mất mạng rồi có lại
    window.addEventListener('online', connectCoinTicker);
  }

  document.addEventListener('DOMContentLoaded', init);
})();