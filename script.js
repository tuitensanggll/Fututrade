// Khôi phục thứ tự pane (Volume/RSI) đã lưu — chạy trước khi khởi tạo chart
  (function restorePaneOrder(){
    try {
      const saved = JSON.parse(localStorage.getItem('ok_pane_order') || 'null');
      if (!saved) return;
      const wrapper = document.getElementById('chart-wrapper');
      saved.forEach(key => { const el = document.getElementById('pane-' + key); if (el) wrapper.appendChild(el); });
    } catch (e) {}
  })();

  // Thiết bị cảm ứng (điện thoại/tablet) cần vùng chạm lớn hơn & UI gọn/khác hành vi hover so với
  // chuột trên desktop — dùng chung cho cả hệ thống vẽ lẫn legend chỉ báo bên dưới.
  const isTouchDevice = (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches)) || ('ontouchstart' in window);

  // =========================================================
  // BỘ ICON LINEAL DÙNG CHUNG (thay toàn bộ icon emoji cũ bằng icon nét mảnh đồng bộ)
  // =========================================================
  const ICONS = {
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.4 12S5 5.2 12 5.2 22.6 12 22.6 12 19 18.8 12 18.8 1.4 12 1.4 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.3A11 11 0 0112 5.2c7 0 10.6 6.8 10.6 6.8a13.9 13.9 0 01-3.1 4M6.2 6.6C3.4 8.5 1.4 12 1.4 12S5 18.8 12 18.8a10.7 10.7 0 004.1-.8"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M4.5 15.5H4A1.5 1.5 0 012.5 14V4A1.5 1.5 0 014 2.5h10A1.5 1.5 0 0115.5 4v.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="1.8"/><path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="1.8"/><path d="M7.5 10.5V7a4.5 4.5 0 018.5-2.2"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.8A1.8 1.8 0 0110.8 3h2.4A1.8 1.8 0 0115 4.8V7"/><path d="M6 7l1 12.2A2 2 0 009 21h6a2 2 0 002-1.8L18 7"/><path d="M10 11v6M14 11v6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3.2L8.7 5.8h6.6L16.8 8H20a1 1 0 011 1v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
    barChart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></svg>',
    trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6 6 4-4 8 9"/><path d="M15 18h6v-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 015 5c0 3.5-5 11-5 11S7 10.5 7 7a5 5 0 015-5z"/><circle cx="12" cy="7" r="1.6"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16 9.4"/></svg>',
    whale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 13c0-3.3 3-5.9 6.9-5.9 4 0 7.4 1.8 9.8 4.2.7.8 1.9 1 2.8.4-.4 1.6-1.7 2.6-3.1 2.7.5.9 1.6 1.4 2.9 1.3-1 1.4-2.7 2-4.4 1.8-2 1.9-5.1 3.1-8.3 2.8-4-.4-6.6-3.4-6.6-7.3z"/><circle cx="6.7" cy="10.4" r="0.7" fill="currentColor" stroke="none"/><path d="M9 17.2c-1.5.6-3.1.5-4.4-.4"/></svg>',
    dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
    trendFlat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 12l5-5M3 12l5 5M21 12l-5-5M21 12l-5 5"/></svg>',
    alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2L22 20.5H2z"/><path d="M12 9.5v5.2"/><circle cx="12" cy="17.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.6c0 4.6-3.1 8.4-7.5 9.4-4.4-1-7.5-4.8-7.5-9.4V6z"/><path d="M9 12l2.2 2.2L15.3 10"/></svg>',
  };
  function icon(name, cls) { return `<span class="ico${cls ? ' ' + cls : ''}">${ICONS[name] || ''}</span>`; }


  let currentSymbol = localStorage.getItem('ok_symbol') || 'BTCUSDT';
  let currentInterval = localStorage.getItem('ok_interval') || '4h';
  let aiEnabled = localStorage.getItem('ok_ai') !== 'false';
  let currentUpColor = localStorage.getItem('ok_upColor') || '#14cc8a';
  let currentDownColor = localStorage.getItem('ok_downColor') || '#ff4757';

  // ==========================================
  // DANH SÁCH TOÀN BỘ COIN (cặp USDT) TRÊN BINANCE — phục vụ gợi ý tìm kiếm,
  // cho phép tìm bất kỳ coin nào đang giao dịch thay vì chỉ 5 nút nhanh cố định.
  // Cache 24h trong localStorage để không phải gọi API mỗi lần tải trang.
  // ==========================================
  let allMarketSymbols = []; // [{ symbol:'BTCUSDT', base:'BTC' }, ...]
  const SYMBOL_CACHE_KEY = 'ok_all_symbols_v1';
  const SYMBOL_CACHE_TIME_KEY = 'ok_all_symbols_time_v1';
  const SYMBOL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

  function loadMarketSymbols() {
    try {
      const cachedTime = parseInt(localStorage.getItem(SYMBOL_CACHE_TIME_KEY) || '0', 10);
      const cachedData = localStorage.getItem(SYMBOL_CACHE_KEY);
      if (cachedData && Date.now() - cachedTime < SYMBOL_CACHE_TTL) {
        allMarketSymbols = JSON.parse(cachedData);
        if (typeof startMarketWhaleWatcher === 'function') startMarketWhaleWatcher();
        return;
      }
    } catch (e) { /* cache lỗi thì bỏ qua, tải lại từ mạng */ }

    fetch('https://api.binance.com/api/v3/exchangeInfo')
      .then(r => r.json())
      .then(data => {
        if (!data || !Array.isArray(data.symbols)) return;
        const list = data.symbols
          .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
          .map(s => ({ symbol: s.symbol, base: s.baseAsset }));
        allMarketSymbols = list;
        try {
          localStorage.setItem(SYMBOL_CACHE_KEY, JSON.stringify(list));
          localStorage.setItem(SYMBOL_CACHE_TIME_KEY, String(Date.now()));
        } catch (e) { /* localStorage đầy hoặc bị chặn — không ảnh hưởng tính năng chính */ }
        if (typeof startMarketWhaleWatcher === 'function') startMarketWhaleWatcher();
      })
      .catch(err => console.log('Không tải được danh sách coin toàn thị trường:', err));
  }
  loadMarketSymbols();

  
  let whaleLogs = JSON.parse(localStorage.getItem('ok_whale_logs') || '[]');
  // Trước đây chỉ lưu tối đa 50 lệnh vì chỉ theo dõi 1 coin đang xem. Giờ giám sát NỀN toàn bộ
  // coin trên thị trường cùng lúc nên nâng giới hạn lên nhiều hơn để log của các coin ít giao dịch
  // không bị các coin sôi động (BTC, ETH...) đẩy trôi mất quá nhanh.
  const MAX_WHALE_LOGS = 400;

  let whaleLarge = parseFloat(localStorage.getItem('ok_whale_large')) || 500000;
  let whaleMid = parseFloat(localStorage.getItem('ok_whale_mid')) || 100000;
  let whaleSmall = parseFloat(localStorage.getItem('ok_whale_small')) || 30000;
  let aiVolMult = parseFloat(localStorage.getItem('ok_ai_vol')) || 2.5;

  let candlesData = []; let volumesData = [];
  let candlesDataMap = new Map(); let volumesDataMap = new Map();
  let signalsMap = new Map(); 
  let currentWebSocket = null; let currentTickerWS = null; let whaleWS = null;
  let reconnectTimeout = null; let syncInterval = null;
  let isLiveSignalPreview = false; let liveAnalysisTimer = null;
  let lastIndicatorUpdateTs = 0; // throttle tính lại chỉ báo khi giá chạy liên tục — tránh giật máy, đặc biệt trên mobile
  // Phân tích tức thời trên nến đang chạy (chưa đóng) — throttle 3s để tránh giật máy khi tick dồn dập
  function scheduleLiveAIAnalysis() {
    isLiveSignalPreview = true;
    if (liveAnalysisTimer) return;
    liveAnalysisTimer = setTimeout(() => { liveAnalysisTimer = null; if (isLiveSignalPreview) runAIAnalysis(); }, 3000);
  }

  // =========================================================
  // HỆ THỐNG QUẢN LÝ XÓA NHẬT KÝ - ĐÃ SỬA LỖI TỰ ĐỘNG LƯU
  // =========================================================
  
  // Tải dữ liệu đã xóa từ ổ cứng trình duyệt (localStorage) khi tải lại trang
  let aiIgnoreBeforeTime = parseFloat(localStorage.getItem('ok_ai_ignore_time')) || 0;
  let deletedLogTimes = new Set(JSON.parse(localStorage.getItem('ok_ai_deleted_logs') || '[]'));

  window.deleteSingleLog = function(time, isWhale = false) {
    try {
      if (isWhale) {
        // Xử lý xóa nhật ký Cá Mập
        if (typeof whaleLogs !== 'undefined') {
          whaleLogs = whaleLogs.filter(log => log.time !== time);
          localStorage.setItem('ok_whale_logs', JSON.stringify(whaleLogs));
        }
        if (typeof renderWhaleLogs === 'function') renderWhaleLogs();
      } else {
        // Xử lý xóa thư lẻ AI (Lưu lại để F5 không bị hiện lại)
        deletedLogTimes.add(time);
        localStorage.setItem('ok_ai_deleted_logs', JSON.stringify(Array.from(deletedLogTimes)));
        
        // Xóa ngay lập tức phần tử đó trên màn hình giao diện
        const targets = [document.getElementById(`log-${time}`), document.querySelector(`[data-time="${time}"]`)];
        targets.forEach(el => { if(el) el.remove(); });

        if (typeof runAIAnalysis === 'function') runAIAnalysis();
      }
    } catch (error) {
      console.log("Hệ thống bỏ qua lỗi xóa lẻ:", error);
    }
  };

  window.clearAllAILogs = function() {
    try {
      if (typeof candlesData !== 'undefined' && candlesData && candlesData.length > 1) {
        // Chặn toàn bộ tín hiệu cũ trước thời điểm bấm nút
        aiIgnoreBeforeTime = candlesData[candlesData.length - 1].time; 
        localStorage.setItem('ok_ai_ignore_time', aiIgnoreBeforeTime);
        
        // Dọn dẹp bộ nhớ các thư lẻ cho nhẹ máy
        deletedLogTimes.clear();
        localStorage.setItem('ok_ai_deleted_logs', '[]');
      }
      
      const aiList = document.getElementById('ai-signal-list');
      if (aiList) aiList.innerHTML = '<div class="ai-empty">Đã dọn dẹp rác. Đang chờ tín hiệu mới...</div>';
      
      if (typeof runAIAnalysis === 'function') runAIAnalysis();
    } catch (error) {
      console.log("Hệ thống bỏ qua lỗi xóa tất cả AI:", error);
    }
  };

  window.clearAllSharkLogs = function() {
    try {
      // Nhật ký cá mập giờ hiển thị riêng theo từng coin, nên "Xóa tất cả" chỉ dọn log của
      // coin đang xem — không xóa dữ liệu nền của các coin khác đang được âm thầm ghi nhận.
      const coinLabel = (typeof currentSymbol !== 'undefined' ? currentSymbol.replace('USDT', '') : '');
      if (confirm(`Bạn có chắc chắn muốn dọn sạch nhật ký cá mập của ${coinLabel}? (Dữ liệu các coin khác vẫn được giữ nguyên)`)) { 
        if (typeof whaleLogs !== 'undefined') whaleLogs = whaleLogs.filter(log => log.symbol !== currentSymbol); 
        localStorage.setItem('ok_whale_logs', JSON.stringify(whaleLogs)); 
        if (typeof renderWhaleLogs === 'function') renderWhaleLogs(); 
      }
    } catch (error) {
      console.log("Hệ thống bỏ qua lỗi xóa tất cả Cá mập:", error);
    }
  };

  // =========================================================
  // ENGINE GAUGE DÙNG CHUNG (Long/Short & Sợ hãi-Tham lam) — animation mượt, glow, pulse
  // =========================================================
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

  // Tạo 1 widget gauge độc lập, gắn vào 1 container. opts: segments, colorFn, labelFn, leftLabel, rightLabel, formatCenter, unit
  function createGaugeWidget(mountEl, opts) {
    if (!mountEl) return { update(){} };
    let animScore = 50, animFrameId = null, prevScore = null;
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
    function animateTo(targetScore, meta) {
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

      const deltaEl = mountEl.querySelector('.sg-delta');
      if (deltaEl) {
        if (prevScore !== null) {
          const diff = targetScore - prevScore; const unit = opts.unit || '';
          if (Math.abs(diff) < 0.05) { deltaEl.innerHTML = icon('dot', 'ico-inline') + ' Không đổi'; deltaEl.className = 'sg-delta flat'; }
          else if (diff > 0) { deltaEl.innerHTML = icon('trendUp', 'ico-inline') + ` +${diff.toFixed(1)}${unit}`; deltaEl.className = 'sg-delta up'; }
          else { deltaEl.innerHTML = icon('trendDown', 'ico-inline') + ` ${diff.toFixed(1)}${unit}`; deltaEl.className = 'sg-delta down'; }
          deltaEl.classList.remove('pulse'); void deltaEl.offsetWidth; deltaEl.classList.add('pulse');
        }
        prevScore = targetScore;
      }
    }
    return { update: animateTo };
  }

  // ===== Widget 1: Tỷ lệ Long/Short (Binance Futures) =====
  let binanceLSRatio = 1.0;
  let liveBuyPressureScore = null; // % áp lực mua tính từ dòng lệnh khớp thật (tick-by-tick), cập nhật liên tục
  const lsGaugeWidget = createGaugeWidget(document.getElementById('sentiment-gauge'), {
    segments: [[0, 20, '#c23a4f'], [20, 40, '#d9765a'], [40, 60, '#c99257'], [60, 80, '#5fae52'], [80, 100, '#219150']],
    colorFn: score => { if (score < 20) return '#e0455c'; if (score < 40) return '#e07a5f'; if (score < 60) return '#d9a066'; if (score < 80) return '#7fc95f'; return '#2ecc71'; },
    labelFn: score => { if (score < 20) return 'Short áp đảo'; if (score < 40) return 'Nghiêng Short'; if (score < 60) return 'Cân bằng'; if (score < 80) return 'Nghiêng Long'; return 'Long áp đảo'; },
    leftLabel: 'SHORT', rightLabel: 'LONG', unit: '%',
    formatCenter: s => Math.round(s) + '%'
  });
  // Quy đổi tỉ lệ Long/Short thành % tài khoản Long — công thức toán học trực tiếp
  // từ số liệu thật của Binance (ratio = longAccount / shortAccount), không suy đoán.
  function ratioToScore(ratio) {
    if (!ratio || ratio <= 0) return 50;
    return (ratio / (1 + ratio)) * 100; // % Long chính xác theo công thức của Binance
  }
  // Kim của gauge được dẫn động bởi ÁP LỰC MUA/BÁN THỰC TẾ, tính liên tục từ dòng lệnh khớp (aggTrade) —
  // xem hàm updateLiveBuyPressure() trong initWebSockets(). Tỷ lệ tài khoản Long/Short (REST, 5 phút/lần
  // theo đúng chu kỳ dữ liệu gốc của Binance) chỉ đóng vai trò thông tin bổ sung hiển thị bên dưới.
  function refreshGaugeDisplay() {
    const score = liveBuyPressureScore !== null ? liveBuyPressureScore : ratioToScore(binanceLSRatio);
    lsGaugeWidget.update(score, { ratio: binanceLSRatio, live: liveBuyPressureScore !== null, liveScore: liveBuyPressureScore });
  }
  async function fetchBinanceSentiment(symbol = currentSymbol) {
    try {
      const response = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        binanceLSRatio = parseFloat(data[0].longShortRatio);
        refreshGaugeDisplay();
      }
    } catch (error) { console.error("Không lấy được L/S:", error); }
  }
  // Chu kỳ dữ liệu gốc của Binance cho chỉ số này là 5 phút — gọi lại mỗi 20s chỉ để bắt kịp sớm nhất
  // ngay khi Binance công bố số mới, không có ý nghĩa gọi nhanh hơn vì bản thân số liệu chưa đổi.
  setInterval(() => fetchBinanceSentiment(currentSymbol), 20000);
  setTimeout(() => fetchBinanceSentiment(currentSymbol), 1000);

  // ===== Widget 2: Chỉ số Sợ hãi & Tham lam (Tâm lý thị trường chung — chuẩn phân loại như Binance) =====
  // Thang điểm 0-100: 0-24 Sợ hãi tột độ, 25-44 Sợ hãi, 45-55 Trung lập, 56-75 Tham lam, 76-100 Tham lam tột độ.
  const fngGaugeWidget = createGaugeWidget(document.getElementById('fng-gauge'), {
    segments: [[0, 25, '#c23a4f'], [25, 45, '#d9765a'], [45, 55, '#c99257'], [55, 75, '#5fae52'], [75, 100, '#219150']],
    colorFn: score => { if (score < 25) return '#e0455c'; if (score < 45) return '#e07a5f'; if (score < 55) return '#d9a066'; if (score < 75) return '#7fc95f'; return '#2ecc71'; },
    labelFn: score => { if (score < 25) return 'Sợ hãi tột độ'; if (score < 45) return 'Sợ hãi'; if (score < 55) return 'Trung lập'; if (score < 75) return 'Tham lam'; return 'Tham lam tột độ'; },
    leftLabel: 'SỢ HÃI', rightLabel: 'THAM LAM', unit: ' đ',
    formatCenter: s => Math.round(s)
  });
  let fngPrevValue = null;
  let fngNextUpdateTs = null; // mốc thời gian (ms) nguồn dữ liệu sẽ công bố số mới, dùng để đếm ngược live
  function fmtCountdown(ms) {
    if (ms == null || ms < 0) return '--';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
    return (h > 0 ? h + 'h' : '') + m + 'p' + s + 's';
  }
  async function fetchFearGreedIndex() {
    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=1&format=json');
      const json = await res.json();
      if (json && json.data && json.data.length) {
        const val = parseFloat(json.data[0].value);
        const secUntilUpdate = parseInt(json.data[0].time_until_update || '0', 10);
        fngPrevValue = val;
        fngNextUpdateTs = Date.now() + secUntilUpdate * 1000;
        fngGaugeWidget.update(val, { updated: new Date().toLocaleTimeString('vi-VN'), countdown: fmtCountdown(secUntilUpdate * 1000) });
      }
    } catch (error) { console.error("Không lấy được Chỉ số Sợ hãi & Tham lam:", error); }
  }
  // Nguồn dữ liệu Sợ hãi & Tham lam chỉ công bố số mới ~1 lần/ngày (đúng như trên Binance thật) — không thể
  // "liên tục" theo giây vì bản chất chỉ số này là tổng hợp theo ngày. Bù lại, đồng hồ đếm ngược tới kỳ cập
  // nhật tiếp theo chạy LIVE mỗi giây thật (tính từ time_until_update do nguồn trả về), và ta poll lại đúng
  // lúc kỳ mới tới để lấy số mới sớm nhất có thể, thay vì đợi cố định.
  setInterval(() => {
    if (fngNextUpdateTs !== null) {
      const remain = fngNextUpdateTs - Date.now();
      if (remain <= 0) { fetchFearGreedIndex(); return; }
    }
  }, 1000);
  setTimeout(fetchFearGreedIndex, 1300);

  // =========================================================
  // TIN TỨC NÓNG THỊ TRƯỜNG — tự động lấy tin mới liên tục
  // =========================================================
  const seenNewsIds = new Set();
  let newsFirstLoad = true;
  function newsRelTime(unixSec) {
    const diffSec = Math.max(0, Math.floor(Date.now() / 1000) - unixSec);
    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + ' phút trước';
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + ' giờ trước';
    return Math.floor(diffSec / 86400) + ' ngày trước';
  }
  let lastNewsItems = [];
  function renderNewsList(items, isRefreshOnly) {
    const listEl = document.getElementById('news-list');
    if (!listEl) return;
    if (!items.length) { listEl.innerHTML = '<div class="news-empty">Chưa có tin tức.</div>'; return; }
    listEl.innerHTML = items.map(it => {
      const isNew = !isRefreshOnly && !newsFirstLoad && !seenNewsIds.has(it.id);
      const origAttr = it.titleOriginal && it.titleOriginal !== it.title ? ` title="${it.titleOriginal.replace(/"/g, '&quot;')}"` : '';
      return `<a class="news-item${isNew ? ' is-new' : ''}" href="${it.url}" target="_blank" rel="noopener noreferrer"${origAttr}>
        ${it.img ? `<img class="news-thumb" src="${it.img}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="news-body">
          <div class="news-title">${it.title}</div>
          <div class="news-meta"><span class="news-source">${it.source}</span><span>·</span><span>${newsRelTime(it.time)}</span></div>
        </div>
      </a>`;
    }).join('');
    if (!isRefreshOnly) { items.forEach(it => seenNewsIds.add(it.id)); newsFirstLoad = false; }
  }
  // Dịch tự động tiêu đề tin tức sang tiếng Việt (dùng API dịch miễn phí của Google, không cần key)
  const newsTranslationCache = new Map();
  async function translateToVi(text) {
    if (!text) return text;
    if (newsTranslationCache.has(text)) return newsTranslationCache.get(text);
    try {
      const res = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const translated = (data && Array.isArray(data[0])) ? data[0].map(seg => seg[0]).join('') : text;
      newsTranslationCache.set(text, translated);
      return translated;
    } catch (error) {
      console.warn('Lỗi dịch tiêu đề tin tức, giữ nguyên bản gốc:', error);
      newsTranslationCache.set(text, text);
      return text;
    }
  }
  async function translateNewsItems(items) {
    await Promise.all(items.map(async (it) => {
      const original = it.title;
      const translated = await translateToVi(original);
      it.titleOriginal = original;
      it.title = translated;
    }));
    return items;
  }
  async function tryFetchJson(url, headers) {
    const res = await fetch(url, headers ? { headers } : undefined);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  // Nhiều nguồn dự phòng: nếu nguồn 1 bị chặn CORS/rate-limit trên môi trường host (VD GitHub Pages),
  // tự động rơi (fallback) sang nguồn kế tiếp thay vì phụ thuộc vào đúng 1 API duy nhất.
  // ⚠️ DÁN API KEY MIỄN PHÍ CỦA BẠN VÀO ĐÂY (lấy tại https://openapi.coinstats.app — đăng ký free, không cần thẻ):
  const COINSTATS_API_KEY = 'ed9c3d6960e6737cb4f8bf0988db2008a3b252162316'; // VD: 'ab12cd34-...'

  const NEWS_SOURCES = [
    ...(COINSTATS_API_KEY ? [{ type: 'coinstats', url: 'https://openapiv1.coinstats.app/news?limit=20' }] : []),
    { type: 'cryptocompare', url: 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest' },
    { type: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.coindesk.com/arc/outboundfeeds/rss/') + '&count=20' },
    { type: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://cointelegraph.com/rss') + '&count=20' }
  ];
  function parseSourceItems(type, json) {
    if (type === 'coinstats') {
      const arr = Array.isArray(json) ? json : (Array.isArray(json && json.news) ? json.news : (Array.isArray(json && json.result) ? json.result : []));
      if (!arr.length) return [];
      return arr.slice(0, 20).map(a => {
        const rawTime = a.feedDate || a.publishedAt || a.createdAt || a.date;
        const ts = typeof rawTime === 'number' ? (rawTime > 2e10 ? Math.floor(rawTime / 1000) : rawTime) : Math.floor(Date.parse(rawTime || '') / 1000);
        return {
          id: String(a.id || a._id || a.link || a.url),
          title: a.title || a.name || '',
          url: a.link || a.url || a.sourceUrl || '#',
          source: a.source || a.feedName || 'CoinStats',
          time: isNaN(ts) ? Math.floor(Date.now() / 1000) : ts,
          img: a.imgUrl || a.image || a.thumbnail || ''
        };
      }).filter(it => it.title);
    }
    if (type === 'cryptocompare') {
      if (!json || !Array.isArray(json.Data)) return [];
      return json.Data.slice(0, 20).map(a => ({
        id: String(a.id || a.guid || a.url), title: a.title, url: a.url,
        source: (a.source_info && a.source_info.name) || a.source || 'Nguồn tin',
        time: a.published_on,
        img: a.imageurl && a.imageurl.startsWith('http') ? a.imageurl : ''
      }));
    }
    if (type === 'rss2json') {
      if (!json || json.status !== 'ok' || !Array.isArray(json.items)) return [];
      return json.items.slice(0, 20).map(a => {
        const ts = Date.parse((a.pubDate || '').replace(' ', 'T') + 'Z');
        return {
          id: String(a.guid || a.link),
          title: (a.title || '').replace(/<[^>]*>/g, ''),
          url: a.link,
          source: (json.feed && json.feed.title) || 'Nguồn tin',
          time: isNaN(ts) ? Math.floor(Date.now() / 1000) : Math.floor(ts / 1000),
          img: a.thumbnail || ''
        };
      });
    }
    return [];
  }
  async function fetchMarketNews() {
    let lastError = null;
    for (const src of NEWS_SOURCES) {
      try {
        const headers = src.type === 'coinstats' ? { 'X-API-KEY': COINSTATS_API_KEY } : undefined;
        const json = await tryFetchJson(src.url, headers);
        let items = parseSourceItems(src.type, json);
        if (items.length) {
          items = await translateNewsItems(items);
          lastNewsItems = items;
          renderNewsList(items, false);
          const upd = document.getElementById('news-updated'); if (upd) upd.innerText = 'Cập nhật: ' + new Date().toLocaleTimeString('vi-VN');
          const badge = document.getElementById('news-live-badge'); if (badge) badge.innerHTML = '<span class="news-live-dot"><span class="live-dot"></span>LIVE</span>';
          return; // Thành công, không cần thử nguồn tiếp theo
        }
      } catch (error) { lastError = error; console.warn('Nguồn tin tức lỗi, thử nguồn kế tiếp:', src.url, error); }
    }
    console.error("Không lấy được tin tức từ mọi nguồn:", lastError);
    const listEl = document.getElementById('news-list');
    if (listEl && newsFirstLoad) {
      const hint = location.protocol === 'file:'
        ? 'Trang đang mở trực tiếp từ file (file://) — hãy chạy qua Live Server / một host thật (kể cả GitHub Pages) rồi thử lại.'
        : 'Có thể do mất mạng, tất cả nguồn tin tạm nghẽn, hoặc trình chặn quảng cáo (adblock) đang chặn các domain tin tức.';
      listEl.innerHTML = `<div class="news-empty">Không tải được tin tức lúc này.<br><span style="font-size:11px;opacity:.85;">${hint}</span><br><button id="news-retry-btn" type="button" style="margin-top:8px;background:var(--surface-alt);border:1px solid var(--border);color:var(--text);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Thử lại</button></div>`;
      const btn = document.getElementById('news-retry-btn'); if (btn) btn.onclick = fetchMarketNews;
    }
  }
  setInterval(fetchMarketNews, 60000); // Tin tức mới liên tục — kiểm tra lại mỗi 60 giây
  setTimeout(fetchMarketNews, 1500);
  // Làm mới lại nhãn "X phút trước" mỗi 30s dù chưa có tin mới, để đồng hồ luôn đúng (không tính là tin mới)
  setInterval(() => { if (lastNewsItems.length) renderNewsList(lastNewsItems, true); }, 30000);

  // Cài đặt Modal Events
  function getWhaleThreshold(symbol) {
    const s = symbol.toUpperCase();
    if (s.includes('BTC') || s.includes('ETH')) return whaleLarge;
    const midCaps = ['SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT'];
    if (midCaps.includes(s)) return whaleMid; return whaleSmall;
  }
  const modal = document.getElementById('settings-modal');
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('set-whale-large').value = whaleLarge; document.getElementById('set-whale-mid').value = whaleMid;
    document.getElementById('set-whale-small').value = whaleSmall; document.getElementById('set-ai-vol').value = aiVolMult;
    modal.classList.add('show');
  });
  const closeModal = () => modal.classList.remove('show');
  document.getElementById('close-modal').addEventListener('click', closeModal); document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('btn-save-modal').addEventListener('click', () => {
    whaleLarge = parseFloat(document.getElementById('set-whale-large').value); whaleMid = parseFloat(document.getElementById('set-whale-mid').value);
    whaleSmall = parseFloat(document.getElementById('set-whale-small').value); aiVolMult = parseFloat(document.getElementById('set-ai-vol').value);
    localStorage.setItem('ok_whale_large', whaleLarge); localStorage.setItem('ok_whale_mid', whaleMid);
    localStorage.setItem('ok_whale_small', whaleSmall); localStorage.setItem('ok_ai_vol', aiVolMult);
    closeModal(); runAIAnalysis();
  });

  // INIT UI
  document.getElementById('symbol-input').value = currentSymbol.replace('USDT', '');
  document.getElementById('color-up').value = currentUpColor; document.getElementById('color-down').value = currentDownColor;
  if (!aiEnabled) document.getElementById('ai-switch').classList.remove('on');
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-symbol') === currentSymbol.replace('USDT', '')));
  document.querySelectorAll('.tf-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-interval') === currentInterval));

  function updateCSSVariables(upHex, downHex) {
    document.documentElement.style.setProperty('--up', upHex); document.documentElement.style.setProperty('--down', downHex);
    document.documentElement.style.setProperty('--up-dim', upHex + '33'); document.documentElement.style.setProperty('--down-dim', downHex + '33');
  }
  updateCSSVariables(currentUpColor, currentDownColor);

  const commonOptions = {
    layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#7c8598', attributionLogo: false },
    grid: { vertLines: { color: '#171c27' }, horzLines: { color: '#171c27' } },
    rightPriceScale: { minimumWidth: 90, alignLabels: true, scaleMargins: { top: 0.15, bottom: 0.15 } },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: {
        color: '#7c8598',
        style: LightweightCharts.LineStyle.Dashed,
        width: 1,
        labelVisible: true,
        labelBackgroundColor: '#10141c',
        labelTextColor: '#e7eaf0',
        labelFontSize: 11
      },
      horzLine: {
        color: '#7c8598',
        style: LightweightCharts.LineStyle.Dashed,
        width: 1,
        labelVisible: true,
        labelBackgroundColor: '#10141c',
        labelTextColor: '#e7eaf0',
        labelFontSize: 11
      }
    }
  };
  const chartPrice = LightweightCharts.createChart(document.getElementById('chart-price'), { ...commonOptions, timeScale: { timeVisible: true, visible: false, rightOffset: 12 } });
  const candleSeries = chartPrice.addSeries(LightweightCharts.CandlestickSeries, { upColor: currentUpColor, downColor: currentDownColor, borderVisible: false, wickUpColor: currentUpColor, wickDownColor: currentDownColor });
  const candleSeriesMarkers = LightweightCharts.createSeriesMarkers(candleSeries, []);
  const volumePane = document.getElementById('chart-volume');
  const chartVolume = LightweightCharts.createChart(volumePane, {
    ...commonOptions,
    crosshair: { ...commonOptions.crosshair, mode: LightweightCharts.CrosshairMode.Normal },
    timeScale: { timeVisible: true, visible: false, rightOffset: 0 },
    leftPriceScale: { visible: false, borderVisible: false, minWidth: 0 },
    rightPriceScale: { visible: true, borderVisible: false, alignLabels: true, minimumWidth: 90, scaleMargins: { top: 0.15, bottom: 0.15 } }
  });
  const volumeSeries = chartVolume.addSeries(LightweightCharts.HistogramSeries, {
    priceFormat: {
      type: 'custom',
      formatter: price => {
        if (Math.abs(price) >= 1000000) return (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (Math.abs(price) >= 1000) return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return price.toFixed(0);
      }
    },
    priceScaleId: 'right'
  });

  // ===== HỆ THỐNG CHỈ BÁO KỸ THUẬT ĐỘNG: thêm / xóa / kéo-thả đổi pane =====
  // Mỗi pane là 1 chart lightweight-charts riêng (đồng bộ trục thời gian).
  // Chỉ báo "overlay" (SMA/EMA/BB) mặc định vẽ trên giá; "volume" vẽ trên Khối lượng;
  // "oscillator" (RSI/MACD/Stoch) luôn có pane riêng để giữ đúng thang đo 0-100 chuẩn sàn lớn.
  const INDICATOR_CATALOG = {
    sma:   { label: 'SMA — Trung bình động đơn giản', category: 'overlay',
             params: [{ key:'period', label:'Chu kỳ', def:20, step:1 }] },
    ema:   { label: 'EMA — Trung bình động lũy thừa', category: 'overlay',
             params: [{ key:'period', label:'Chu kỳ', def:20, step:1 }] },
    bb:    { label: 'Bollinger Bands', category: 'overlay',
             params: [{ key:'period', label:'Chu kỳ', def:20, step:1 }, { key:'mult', label:'Độ lệch chuẩn', def:2, step:0.1 }] },
    volma: { label: 'MA Khối lượng', category: 'volume',
             params: [{ key:'period', label:'Chu kỳ', def:20, step:1 }] },
    rsi:   { label: 'RSI — Chỉ số sức mạnh tương đối', category: 'oscillator',
             params: [{ key:'period', label:'Chu kỳ RSI', def:14, step:1 }, { key:'smaPeriod', label:'Chu kỳ SMA tín hiệu', def:14, step:1 }] },
    macd:  { label: 'MACD', category: 'oscillator',
             params: [{ key:'fast', label:'EMA nhanh', def:12, step:1 }, { key:'slow', label:'EMA chậm', def:26, step:1 }, { key:'signal', label:'Đường tín hiệu', def:9, step:1 }] },
    stoch: { label: 'Stochastic Oscillator', category: 'oscillator',
             params: [{ key:'kPeriod', label:'Chu kỳ %K', def:14, step:1 }, { key:'dPeriod', label:'Chu kỳ %D', def:3, step:1 }, { key:'smooth', label:'Làm mượt', def:3, step:1 }] }
  };
  const LINE_STYLE_MAP = { solid: 0, dotted: 1, dashed: 2 };
  const DEFAULT_COLORS = ['#3d8bff', '#7c5cff', '#c792ea', '#ffc93c', '#14cc8a', '#ff4757', '#4dd0e1', '#ff9f43'];
  let colorCursor = 2;
  function nextColor() { const c = DEFAULT_COLORS[colorCursor % DEFAULT_COLORS.length]; colorCursor++; return c; }
  function genId(type) { return type + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function labelFor(ind) {
    if (ind.type === 'bb') return `BB ${ind.period},${ind.mult}`;
    if (ind.type === 'rsi') return `RSI ${ind.period}`;
    if (ind.type === 'macd') return `MACD ${ind.fast},${ind.slow},${ind.signal}`;
    if (ind.type === 'stoch') return `Stoch ${ind.kPeriod},${ind.dPeriod}`;
    if (ind.type === 'volma') return `Vol MA ${ind.period}`;
    if (ind.type === 'sma') return `SMA ${ind.period}`;
    if (ind.type === 'ema') return `EMA ${ind.period}`;
    return ind.type;
  }
  // Mô tả từng ĐƯỜNG con của 1 chỉ báo (nhãn + màu riêng) để hiện đủ giá trị ở góc trái pane,
  // giống đúng cách Binance/TradingView hiện "RSI 14: 52.30  MA 14: 48.75" hay "%K: 63.5  %D: 58.2"
  // — trước đây chỉ hiện được 1 giá trị (đường chính), thiếu hẳn đường tín hiệu/phụ.
  function subSeriesMeta(ind) {
    if (ind.type === 'rsi') return [ { label: `RSI ${ind.period}`, color: ind.color }, { label: `MA ${ind.smaPeriod}`, color: ind.color2 } ];
    if (ind.type === 'stoch') return [ { label: `%K ${ind.kPeriod}`, color: ind.color }, { label: `%D ${ind.dPeriod}`, color: ind.color2 } ];
    if (ind.type === 'macd') return [ { label: 'MACD', color: ind.color }, { label: 'Signal', color: ind.color2 }, { label: 'Hist', color: '#7c8598' } ];
    if (ind.type === 'bb') return [ { label: 'Basis', color: ind.color }, { label: 'Upper', color: ind.color }, { label: 'Lower', color: ind.color } ];
    return [ { label: labelFor(ind), color: ind.color } ];
  }

  function defaultIndicators() {
    return [
      { id: genId('bb'), type: 'bb', pane: 'price', visible: true, period: 20, mult: 2, color: '#3d8bff', width: 1, style: 'solid' },
      { id: genId('bb'), type: 'bb', pane: 'price', visible: true, period: 20, mult: 3, color: '#7c5cff', width: 1, style: 'dashed' },
      { id: genId('rsi'), type: 'rsi', pane: 'rsi', visible: true, period: 14, smaPeriod: 14, color: '#c792ea', color2: '#ffc93c', width: 2, width2: 1, style: 'solid' }
    ];
  }
  function loadIndicators() {
    try {
      const saved = JSON.parse(localStorage.getItem('ok_indicators_v2') || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) {}
    // Di chuyển dữ liệu từ phiên bản cấu hình cũ để không mất tùy biến của người dùng
    try {
      const old = JSON.parse(localStorage.getItem('ok_indicator_config') || 'null');
      if (old) {
        const migrated = [];
        if (old.bb2) migrated.push({ id: genId('bb'), type: 'bb', pane: 'price', visible: old.bb2.visible, period: old.bb2.period, mult: old.bb2.mult, color: old.bb2.color, width: old.bb2.width, style: old.bb2.style });
        if (old.bb3) migrated.push({ id: genId('bb'), type: 'bb', pane: 'price', visible: old.bb3.visible, period: old.bb3.period, mult: old.bb3.mult, color: old.bb3.color, width: old.bb3.width, style: old.bb3.style });
        if (old.rsi) migrated.push({ id: genId('rsi'), type: 'rsi', pane: 'rsi', visible: old.rsi.visible, period: old.rsi.period, smaPeriod: old.rsiSma ? old.rsiSma.period : 14, color: old.rsi.color, color2: old.rsiSma ? old.rsiSma.color : '#ffc93c', width: old.rsi.width, width2: old.rsiSma ? old.rsiSma.width : 1, style: old.rsi.style });
        if (migrated.length) return migrated;
      }
    } catch (e) {}
    return defaultIndicators();
  }
  let indicators = loadIndicators();
  function saveIndicators() { localStorage.setItem('ok_indicators_v2', JSON.stringify(indicators)); }

  // ===== CHART RSI mặc định (pane có sẵn) =====
  const chartRSI = LightweightCharts.createChart(document.getElementById('chart-rsi'), { ...commonOptions, crosshair: { ...commonOptions.crosshair, mode: LightweightCharts.CrosshairMode.Normal }, timeScale: { timeVisible: true }, rightPriceScale: { minimumWidth: 90, scaleMargins: { top: 0.15, bottom: 0.15 } } });

  const paneRegistry = {
    price: { chart: chartPrice, elId: 'chart-price' },
    volume: { chart: chartVolume, elId: 'chart-volume' },
    rsi: { chart: chartRSI, elId: 'chart-rsi', homeType: 'rsi' }
  };
  function clearAllCrosshairs() {
    Object.values(paneRegistry).forEach(reg => { if (reg && reg.chart) reg.chart.clearCrosshairPosition(); });
  }
  function getPaneChartElement(paneId) {
    const reg = paneRegistry[paneId]; return reg ? document.getElementById(reg.elId) : null;
  }
  function getIndicatorValueForPane(paneId, time) {
    for (const ind of indicators) {
      if (ind.pane !== paneId || !ind.visible) continue;
      const store = seriesStore[ind.id];
      if (!store || !store.dataMap) continue;
      const value = store.dataMap.get(time);
      if (value !== undefined && value !== null) return value;
    }
    return null;
  }
  function getPaneCrosshairValue(paneId, time) {
    if (paneId === 'price') {
      const c = candlesDataMap.get(time); return c ? c.close : null;
    }
    if (paneId === 'volume') {
      const v = volumesDataMap.get(time); return v ? v.value : null;
    }
    return getIndicatorValueForPane(paneId, time);
  }
  function getPaneCrosshairSeries(paneId) {
    if (paneId === 'price') return candleSeries;
    if (paneId === 'volume') return volumeSeries;
    const ind = indicators.find(i => i.pane === paneId && i.visible);
    if (!ind) return null;
    const store = seriesStore[ind.id];
    return store && store.series && store.series[0] ? store.series[0] : null;
  }
  function buildValueMap(data) {
    const map = new Map();
    if (!Array.isArray(data)) return map;
    data.forEach(item => { if (item && item.time !== undefined && item.value !== undefined) map.set(item.time, item.value); });
    return map;
  }
  function isChartPointValid(paneId, param) {
    if (!param || !param.point || param.time === undefined || param.time === null) return false;
    if (param.point.x < 0 || param.point.y < 0) return false;
    const el = getPaneChartElement(paneId);
    if (!el) return false;
    return param.point.x <= el.clientWidth && param.point.y <= el.clientHeight;
  }
  function syncCrosshairAcrossCharts(sourcePaneId, time) {
    Object.entries(paneRegistry).forEach(([paneId, reg]) => {
      if (!reg || paneId === sourcePaneId) return;
      const value = getPaneCrosshairValue(paneId, time);
      const series = getPaneCrosshairSeries(paneId);
      if (value === null || series === null) { reg.chart.clearCrosshairPosition(); return; }
      reg.chart.setCrosshairPosition(value, time, series);
    });
  }
  function attachCrosshairSync(chart, paneId) {
    chart.subscribeCrosshairMove(param => {
      if (isResizing) return;
      if (!isChartPointValid(paneId, param)) { clearAllCrosshairs(); if (paneId === 'price') tooltip.style.display = 'none'; updateAllLegendValues(); return; }
      syncCrosshairAcrossCharts(paneId, param.time);
      updateAllLegendValues(param.time);
    });
  }
  function resizeAllCharts() {
    const wrapper = document.getElementById('chart-wrapper');
    if (!wrapper) return;
    const width = wrapper.clientWidth;
    Object.values(paneRegistry).forEach(reg => {
      const el = document.getElementById(reg.elId);
      if (!el || !reg.chart) return;
      const height = el.clientHeight || 120;
      reg.chart.applyOptions({ width, height });
    });
    syncPriceScaleWidths();
  }

  // ===== Ép TẤT CẢ các pane (giá / volume / RSI / chỉ báo động) dùng CHUNG một độ rộng trục phải =====
  // Mặc định mỗi chart lightweight-charts tự co giãn trục theo độ dài số của chính nó (VD: "66000.00" dài hơn
  // "70.00" dài hơn "15K"), khiến vùng vẽ nến/cột/đường bị lệch pixel giữa các pane dù cùng 1 mốc thời gian
  // (đây chính là hiện tượng "3 biểu đồ lệch nhau" trong ảnh). Đo độ rộng lớn nhất rồi áp lại cho mọi pane
  // để cột nến, cột volume và đường RSI luôn thẳng hàng theo trục dọc, giống chuẩn Binance/TradingView.
  let widthSyncPending = false;
  function syncPriceScaleWidths() {
    if (widthSyncPending) return;
    widthSyncPending = true;
    requestAnimationFrame(() => {
      widthSyncPending = false;
      applyPriceScaleWidthSync();
    });
  }
  function applyPriceScaleWidthSync() {
    const regs = Object.values(paneRegistry).filter(r => r && r.chart);
    if (!regs.length) return;
    let maxWidth = 90;
    regs.forEach(reg => {
      try {
        const w = reg.chart.priceScale('right').width();
        if (w && w > maxWidth) maxWidth = w;
      } catch (e) {}
    });
    regs.forEach(reg => {
      try { reg.chart.priceScale('right').applyOptions({ minimumWidth: maxWidth }); } catch (e) {}
    });
    return maxWidth;
  }
  // Vòng lặp tự-chữa-lành: đo & ép lại độ rộng trục nếu có thay đổi.
  // Đây là lưới an toàn cuối cùng — dù bất kỳ thao tác nào (thêm/xoá chỉ báo, đổi màu, kéo resize,
  // đổi coin, tick giá mới...) làm lệch trục mà quên gọi syncPriceScaleWidths(), vòng lặp này vẫn
  // tự phát hiện và ép các pane thẳng hàng lại — không bao giờ bị "thụt".
  // Trước đây chạy bằng requestAnimationFrame (60 lần/giây, MÃI MÃI, kể cả khi không ai thao tác gì
  // và kể cả khi tab đang ẩn) — đây là 1 trong 2 nguyên nhân chính gây ì máy/tốn pin liên tục.
  // Việc đo độ rộng trục chỉ thực sự cần thiết sau các thao tác làm lệch trục, không cần tần suất
  // khung hình. Đổi sang kiểm tra định kỳ (rất nhẹ) và tạm dừng hẳn khi tab đang ẩn.
  let lastSyncedAxisWidth = 0;
  function widthSyncWatchLoop() {
    if (document.hidden) return;
    const regs = Object.values(paneRegistry).filter(r => r && r.chart);
    if (regs.length) {
      let maxWidth = 90;
      regs.forEach(reg => { try { const w = reg.chart.priceScale('right').width(); if (w && w > maxWidth) maxWidth = w; } catch (e) {} });
      if (maxWidth !== lastSyncedAxisWidth) {
        lastSyncedAxisWidth = maxWidth;
        regs.forEach(reg => { try { reg.chart.priceScale('right').applyOptions({ minimumWidth: maxWidth }); } catch (e) {} });
      }
    }
  }
  setInterval(widthSyncWatchLoop, 800);
  function updatePaneAxisVisibility() {
    const panes = Array.from(document.getElementById('chart-wrapper').querySelectorAll('.sub-pane'));
    panes.forEach((p, idx) => { const reg = paneRegistry[p.dataset.pane]; if (reg) reg.chart.applyOptions({ timeScale: { visible: idx === panes.length - 1 } }); });
    requestAnimationFrame(resizeAllCharts);
  }

  // ===== Đồng bộ trục thời gian (mesh) — tự động cuốn theo pane mới tạo =====
  let allTimeScales = [];
  function registerTimeScale(ts) {
    ts.subscribeVisibleLogicalRangeChange(range => { if (!range) return; panZoomActiveUntil = Date.now() + 400; if (typeof ensureDrawLoopRunning === 'function') ensureDrawLoopRunning(); allTimeScales.forEach(o => { if (o !== ts) o.setVisibleLogicalRange(range); }); });
    allTimeScales.push(ts);
  }
  const priceTimeScale = chartPrice.timeScale(); const volTimeScale = chartVolume.timeScale(); const rsiTimeScale = chartRSI.timeScale();
  registerTimeScale(priceTimeScale); registerTimeScale(volTimeScale); registerTimeScale(rsiTimeScale);


  // ===== Hàm tính toán chỉ báo chuẩn theo công thức phổ biến trên các sàn lớn =====
  function computeBollinger(values, period, mult) {
    const n = values.length; const basis = computeSMA(values, period);
    const upper = new Array(n).fill(null); const lower = new Array(n).fill(null);
    for (let i = period - 1; i < n; i++) {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) { const d = values[j] - basis[i]; sumSq += d * d; }
      const sd = Math.sqrt(sumSq / period);
      upper[i] = basis[i] + sd * mult; lower[i] = basis[i] - sd * mult;
    }
    return { basis, upper, lower };
  }
  function computeMACD(closes, fast, slow, signal) {
    const emaFast = computeEMA(closes, fast), emaSlow = computeEMA(closes, slow);
    const macd = closes.map((_, i) => emaFast[i] - emaSlow[i]);
    const sig = computeEMA(macd, signal);
    const hist = macd.map((v, i) => v - sig[i]);
    return { macd, sig, hist };
  }
  function computeStochastic(highs, lows, closes, kPeriod, dPeriod, smooth) {
    const n = closes.length; const rawK = new Array(n).fill(null);
    for (let i = kPeriod - 1; i < n; i++) {
      let hh = -Infinity, ll = Infinity;
      for (let j = i - kPeriod + 1; j <= i; j++) { if (highs[j] > hh) hh = highs[j]; if (lows[j] < ll) ll = lows[j]; }
      rawK[i] = hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100;
    }
    const kFilled = rawK.map(v => v === null ? 0 : v);
    const kSmoothed = computeSMA(kFilled, smooth).map((v, i) => rawK[i] === null ? null : v);
    const dFilled = kSmoothed.map(v => v === null ? 0 : v);
    const d = computeSMA(dFilled, dPeriod).map((v, i) => kSmoothed[i] === null ? null : v);
    return { k: kSmoothed, d };
  }
  function toLineData(times, values, fromIndex) {
    // QUAN TRỌNG: không được bỏ hẳn các điểm chưa đủ dữ liệu (giai đoạn "khởi động" của chỉ báo, VD RSI
    // cần 14 nến đầu). Nếu bỏ, mảng dữ liệu của chỉ báo sẽ NGẮN HƠN mảng Nến/Volume, khiến chỉ số (index)
    // của pane chỉ báo bị lệch so với pane Nến/Volume — cơ chế đồng bộ trục thời gian giữa các pane dùng
    // logical range (theo index) nên sẽ đồng bộ SAI, làm đường chỉ báo (RSI/MACD/...) luôn hụt một đoạn so
    // với Nến/Volume. Thay vào đó, dùng "whitespace point" ({time} không kèm value) để giữ đúng vị trí trục
    // thời gian mà không vẽ giá trị — nhờ vậy mọi pane luôn có CÙNG số điểm, cùng index, thẳng hàng tuyệt đối.
    const out = [];
    for (let i = 0; i < times.length; i++) {
      const v = values[i];
      if (i < fromIndex || v === null || v === undefined) out.push({ time: times[i] });
      else out.push({ time: times[i], value: v });
    }
    return out;
  }

  // ===== Xác định price scale cho từng chỉ báo: chia sẻ trục phải nếu là chỉ báo "đúng nhà" của pane.
  // Nếu chỉ báo bị kéo/ghép sang pane khác, dùng một trục ẨN riêng (không vẽ, độ rộng = 0) để tự co giãn
  // độc lập mà KHÔNG chiếm thêm bề ngang — vì trục trái hiển thị sẽ làm pane đó rộng hơn pane khác,
  // khiến nến/cột/đường bị lệch cột với các pane còn lại (đây chính là nguyên nhân "3 biểu đồ lệch nhau"). =====
  const seriesStore = {}; // id -> { series:[...], scaleId, guides:[...] }

  // Số lẻ hiển thị phải co giãn theo biên độ giá — giống Binance/TradingView: BTC/ETH chỉ cần 2 số lẻ,
  // nhưng altcoin giá nhỏ (kiểu SHIB, PEPE...) mà cũng chỉ hiện 2 số lẻ thì toàn ra "0.00" vô nghĩa.
  function computePriceDecimals(price) {
    const p = Math.abs(price);
    if (!isFinite(p) || p === 0) return 2;
    if (p >= 100) return 2;
    if (p >= 1) return 3;
    if (p >= 0.1) return 4;
    if (p >= 0.01) return 5;
    if (p >= 0.001) return 6;
    if (p >= 0.0001) return 7;
    return 8;
  }
  function fmt(n){ if (n === null || n === undefined || !isFinite(n)) return '--'; const d = computePriceDecimals(n); return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function fmtVol(n){ if(n>=1e9) return (n/1e9).toFixed(2)+'B'; if(n>=1e6) return (n/1e6).toFixed(2)+'M'; if(n>=1e3) return (n/1e3).toFixed(2)+'K'; return n.toFixed(2); }
  function fmtTime(t){ return new Date(t*1000).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }

  // ===== Đồng bộ số lẻ trên TRỤC (không chỉ chữ số trong tooltip/legend) cho khung giá + chỉ báo vẽ đè lên giá =====
  // RSI/Stochastic giữ nguyên thang 0-100 mặc định (đã chuẩn), chỉ giá (candles), SMA/EMA/BB và MACD mới cần co giãn
  // theo biên độ giá vì chúng dao động cùng đơn vị với giá gốc.
  let lastAppliedPriceDecimals = null;
  function currentPriceDecimals() {
    const last = candlesData.length ? candlesData[candlesData.length - 1].close : null;
    return computePriceDecimals(last || 1);
  }
  function applyDynamicPricePrecision(force) {
    const d = currentPriceDecimals();
    if (!force && d === lastAppliedPriceDecimals) return;
    lastAppliedPriceDecimals = d;
    const fmtOpt = { type: 'price', precision: d, minMove: 1 / Math.pow(10, d) };
    try { candleSeries.applyOptions({ priceFormat: fmtOpt }); } catch (e) {}
    indicators.forEach(ind => {
      const cat = INDICATOR_CATALOG[ind.type] && INDICATOR_CATALOG[ind.type].category;
      if (!((ind.pane === 'price' && cat === 'overlay') || ind.type === 'macd')) return;
      const store = seriesStore[ind.id]; if (!store) return;
      store.series.forEach(s => { try { s.applyOptions({ priceFormat: fmtOpt }); } catch (e) {} });
    });
  }
  function decideScale(ind) {
    const def = INDICATOR_CATALOG[ind.type];
    if (ind.pane === 'price') return def.category === 'overlay' ? 'right' : ('hidden-' + ind.id);
    if (ind.pane === 'volume') return ind.type === 'volma' ? 'right' : ('hidden-' + ind.id);
    const reg = paneRegistry[ind.pane];
    return (reg && reg.homeType === ind.type) ? 'right' : ('hidden-' + ind.id);
  }
  function isHiddenScaleId(scaleId) { return typeof scaleId === 'string' && scaleId.indexOf('hidden-') === 0; }
  function refreshLeftScaleVisibility(paneId) {
    const reg = paneRegistry[paneId]; if (!reg) return;
    reg.chart.applyOptions({ leftPriceScale: { visible: false, borderVisible: false } });
  }
  function createSeriesForIndicator(ind) {
    const reg = paneRegistry[ind.pane]; if (!reg) return;
    const chart = reg.chart; const scaleId = decideScale(ind);
    const lineStyle = LINE_STYLE_MAP[ind.style] ?? 0;
    // lastValueVisible: false — tránh chồng ô giá trị lên trục phải khi nhiều đường (EMA/RSI...) có giá trị gần nhau.
    // Giá trị hiện tại của từng chỉ báo được hiển thị trong legend góc trái (giống Binance/TradingView), không phải trên trục.
    // crosshairMarkerVisible: false — loại bỏ toàn bộ dấu chấm hiện ra khi rê chuột trên các đường chỉ báo (EMA/RSI/MACD/Stoch...)
    const mkLine = (color, width, extra) => chart.addSeries(LightweightCharts.LineSeries, Object.assign({ color, lineWidth: width, lineStyle, priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, visible: ind.visible }, extra || {}));
    let series = []; const guides = [];
    if (ind.type === 'sma' || ind.type === 'ema' || ind.type === 'volma') {
      series = [mkLine(ind.color, ind.width)];
    } else if (ind.type === 'bb') {
      series = [mkLine(ind.color + '4d', ind.width, { lastValueVisible: false }), mkLine(ind.color, ind.width), mkLine(ind.color, ind.width)];
    } else if (ind.type === 'rsi') {
      const main = mkLine(ind.color, ind.width); const sig = mkLine(ind.color2, ind.width2 || 1);
      series = [main, sig];
      guides.push(main.createPriceLine({ price: 70, color: '#ff475766', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '70' }));
      guides.push(main.createPriceLine({ price: 30, color: '#14cc8a66', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '30' }));
      guides.push(main.createPriceLine({ price: 50, color: '#7c859855', lineWidth: 1, lineStyle: 3, axisLabelVisible: false, title: '' }));
    } else if (ind.type === 'macd') {
      const macdLine = mkLine(ind.color, ind.width); const signalLine = mkLine(ind.color2, ind.width2 || 1);
      const hist = chart.addSeries(LightweightCharts.HistogramSeries, { priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: false, visible: ind.visible });
      series = [macdLine, signalLine, hist];
    } else if (ind.type === 'stoch') {
      const k = mkLine(ind.color, ind.width); const d = mkLine(ind.color2, ind.width2 || 1);
      series = [k, d];
      guides.push(k.createPriceLine({ price: 80, color: '#ff475766', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '80' }));
      guides.push(k.createPriceLine({ price: 20, color: '#14cc8a66', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '20' }));
    }
    seriesStore[ind.id] = { series, scaleId, guides, dataMap: new Map(), dataMaps: [] };
    applyDynamicPricePrecision(true);
    if (isHiddenScaleId(scaleId)) {
      try { chart.priceScale(scaleId).applyOptions({ visible: false, borderVisible: false, minimumWidth: 0 }); } catch (e) {}
    }
  }
  function removeSeriesForIndicator(ind) {
    const store = seriesStore[ind.id]; if (!store) return;
    const reg = paneRegistry[ind.pane]; const chart = reg && reg.chart;
    if (chart) store.series.forEach(s => { try { chart.removeSeries(s); } catch (e) {} });
    delete seriesStore[ind.id];
    refreshLeftScaleVisibility(ind.pane);
  }
  function applyIndicatorStyle(ind) {
    const store = seriesStore[ind.id]; if (!store) return;
    const lineStyle = LINE_STYLE_MAP[ind.style] ?? 0;
    if (ind.type === 'bb') {
      store.series[0].applyOptions({ color: ind.color + '4d', lineWidth: ind.width, lineStyle, visible: ind.visible });
      store.series[1].applyOptions({ color: ind.color, lineWidth: ind.width, lineStyle, visible: ind.visible });
      store.series[2].applyOptions({ color: ind.color, lineWidth: ind.width, lineStyle, visible: ind.visible });
    } else if (ind.type === 'rsi' || ind.type === 'stoch') {
      store.series[0].applyOptions({ color: ind.color, lineWidth: ind.width, lineStyle, visible: ind.visible });
      store.series[1].applyOptions({ color: ind.color2, lineWidth: ind.width2 || 1, lineStyle, visible: ind.visible });
    } else if (ind.type === 'macd') {
      store.series[0].applyOptions({ color: ind.color, lineWidth: ind.width, lineStyle, visible: ind.visible });
      store.series[1].applyOptions({ color: ind.color2, lineWidth: ind.width2 || 1, lineStyle, visible: ind.visible });
      store.series[2].applyOptions({ visible: ind.visible });
    } else {
      store.series[0].applyOptions({ color: ind.color, lineWidth: ind.width, lineStyle, visible: ind.visible });
    }
  }
  function updateAllIndicators() {
    if (candlesData.length < 20) return;
    const times = candlesData.map(c => c.time); const closes = candlesData.map(c => c.close);
    const highs = candlesData.map(c => c.high); const lows = candlesData.map(c => c.low);
    const vols = volumesData.map(v => v.value);
    indicators.forEach(ind => {
      const store = seriesStore[ind.id]; if (!store) return;
      if (ind.type === 'sma') {
        const arr = computeSMA(closes, ind.period);
        const data = toLineData(times, arr, ind.period - 1);
        store.series[0].setData(data);
        store.dataMaps = [buildValueMap(data)]; store.dataMap = store.dataMaps[0];
      } else if (ind.type === 'ema') {
        const arr = computeEMA(closes, ind.period);
        const data = toLineData(times, arr, ind.period - 1);
        store.series[0].setData(data);
        store.dataMaps = [buildValueMap(data)]; store.dataMap = store.dataMaps[0];
      } else if (ind.type === 'volma') {
        const arr = computeSMA(vols, ind.period);
        const data = toLineData(times, arr, ind.period - 1);
        store.series[0].setData(data);
        store.dataMaps = [buildValueMap(data)]; store.dataMap = store.dataMaps[0];
      } else if (ind.type === 'bb') {
        const bb = computeBollinger(closes, ind.period, ind.mult);
        const basis = toLineData(times, bb.basis, ind.period - 1);
        const upper = toLineData(times, bb.upper, ind.period - 1);
        const lower = toLineData(times, bb.lower, ind.period - 1);
        store.series[0].setData(basis);
        store.series[1].setData(upper);
        store.series[2].setData(lower);
        store.dataMaps = [buildValueMap(basis), buildValueMap(upper), buildValueMap(lower)]; store.dataMap = store.dataMaps[0];
      } else if (ind.type === 'rsi') {
        const rsiArr = computeRSI(closes, ind.period); const smaArr = computeSMA(rsiArr, ind.smaPeriod);
        const main = toLineData(times, rsiArr, ind.period);
        const sig = toLineData(times, smaArr, ind.period + ind.smaPeriod - 1);
        store.series[0].setData(main);
        store.series[1].setData(sig);
        store.dataMaps = [buildValueMap(main), buildValueMap(sig)]; store.dataMap = store.dataMaps[0];
      } else if (ind.type === 'macd') {
        const { macd, sig, hist } = computeMACD(closes, ind.fast, ind.slow, ind.signal);
        const from = ind.slow - 1; const fromSig = from + ind.signal - 1;
        const main = toLineData(times, macd, from);
        const signal = toLineData(times, sig, fromSig);
        store.series[0].setData(main);
        store.series[1].setData(signal);
        const histData = [];
        for (let i = 0; i < times.length; i++) {
          if (i < fromSig || hist[i] == null) histData.push({ time: times[i] });
          else histData.push({ time: times[i], value: hist[i], color: hist[i] >= 0 ? (currentUpColor + '99') : (currentDownColor + '99') });
        }
        store.series[2].setData(histData);
        store.dataMaps = [buildValueMap(main), buildValueMap(signal), buildValueMap(histData)]; store.dataMap = store.dataMaps[0];
      } else if (ind.type === 'stoch') {
        const { k, d } = computeStochastic(highs, lows, closes, ind.kPeriod, ind.dPeriod, ind.smooth);
        const main = toLineData(times, k, ind.kPeriod + ind.smooth - 2);
        const sig = toLineData(times, d, ind.kPeriod + ind.smooth - 2 + ind.dPeriod - 1);
        store.series[0].setData(main);
        store.series[1].setData(sig);
        store.dataMaps = [buildValueMap(main), buildValueMap(sig)]; store.dataMap = store.dataMaps[0];
      }
    });
    updateAllLegendValues();
    syncPriceScaleWidths();
  }

  // ===== Tạo / xóa PANE ĐỘNG cho các chỉ báo dao động (oscillator) tự thêm =====
  let paneCounter = 0;
  function createDynamicPane(homeType) {
    const id = 'pane_' + (++paneCounter) + '_' + Date.now().toString(36);
    const wrapper = document.getElementById('chart-wrapper');
    const paneEl = document.createElement('div');
    paneEl.className = 'sub-pane'; paneEl.id = 'pane-' + id; paneEl.dataset.pane = id;
    paneEl.innerHTML = `<div class="pane-header"><span class="pane-drag" title="Kéo để đổi vị trí">${icon('grip')}</span><span class="pane-title">${INDICATOR_CATALOG[homeType].label}</span><button class="pane-remove" type="button" title="Xóa toàn bộ pane">${icon('trash')}</button></div><div id="chart-${id}" style="position:relative; height:130px;"><div class="chart-legend" id="legend-${id}"></div></div>`;
    wrapper.appendChild(paneEl);
    const chart = LightweightCharts.createChart(document.getElementById('chart-' + id), {
      ...commonOptions,
      crosshair: { ...commonOptions.crosshair, mode: LightweightCharts.CrosshairMode.Normal },
      timeScale: { timeVisible: true },
      leftPriceScale: { visible: false, borderVisible: false },
      rightPriceScale: { minimumWidth: 90, scaleMargins: { top: 0.15, bottom: 0.15 } }
    });
    paneRegistry[id] = { chart, elId: 'chart-' + id, homeType };
    registerTimeScale(chart.timeScale());
    attachCrosshairSync(chart, id);
    attachPaneHeaderEvents(paneEl.querySelector('.pane-header'));
    attachPaneReorderDropTarget(paneEl);
    attachPaneDropZone(paneEl, id);
    paneEl.querySelector('.pane-remove').addEventListener('click', () => { if (confirm('Xóa toàn bộ pane này cùng các chỉ báo bên trong?')) removeDynamicPane(id); });
    initLegendEvents('legend-' + id, id);
    updatePaneAxisVisibility();
    requestAnimationFrame(resizeAllCharts);
    return id;
  }
  function removeDynamicPane(paneId) {
    const reg = paneRegistry[paneId]; if (!reg) return;
    [...indicators].forEach(i => { if (i.pane === paneId) deleteIndicator(i.id, true); });
    const idx = allTimeScales.indexOf(reg.chart.timeScale()); if (idx > -1) allTimeScales.splice(idx, 1);
    try { reg.chart.remove(); } catch (e) {}
    const el = document.getElementById('pane-' + paneId); if (el) el.remove();
    delete paneRegistry[paneId];
    savePaneOrder(); updatePaneAxisVisibility(); renderAllLegends();
  }

  // ===== Thêm / xóa chỉ báo =====
  function addIndicator(type) {
    const def = INDICATOR_CATALOG[type];
    const ind = { id: genId(type), type, visible: true, color: nextColor(), width: 2, style: 'solid' };
    def.params.forEach(p => { ind[p.key] = p.def; });
    if (def.category === 'oscillator') { ind.color2 = nextColor(); ind.width2 = 1; ind.pane = createDynamicPane(type); }
    else if (type === 'volma') ind.pane = 'volume';
    else ind.pane = 'price';
    indicators.push(ind);
    createSeriesForIndicator(ind);
    saveIndicators(); updateAllIndicators(); renderAllLegends(); closeIndicatorMenu();
    requestAnimationFrame(resizeAllCharts);
  }
  function deleteIndicator(id, skipPaneCleanup) {
    const idx = indicators.findIndex(i => i.id === id); if (idx === -1) return;
    const ind = indicators[idx];
    removeSeriesForIndicator(ind);
    indicators.splice(idx, 1);
    if (!skipPaneCleanup && ind.pane && ind.pane !== 'price' && ind.pane !== 'volume' && !indicators.some(i => i.pane === ind.pane)) removeDynamicPane(ind.pane);
    saveIndicators(); renderAllLegends();
  }

  // ===== Kéo-thả chỉ báo GIỮA CÁC PANE (vd: kéo RSI xuống pane Khối lượng) =====
  let draggingIndicatorId = null;
  function moveIndicatorToPane(indId, targetPaneId, insertBeforeId) {
    const ind = indicators.find(i => i.id === indId); if (!ind || !paneRegistry[targetPaneId]) return;
    const oldPane = ind.pane;
    if (oldPane !== targetPaneId) {
      removeSeriesForIndicator(ind);
      ind.pane = targetPaneId;
      createSeriesForIndicator(ind);
      applyIndicatorStyle(ind);
      updateAllIndicators();
    }
    const curIdx = indicators.indexOf(ind); indicators.splice(curIdx, 1);
    if (insertBeforeId) { const t = indicators.findIndex(i => i.id === insertBeforeId); indicators.splice(t === -1 ? indicators.length : t, 0, ind); }
    else indicators.push(ind);
    if (oldPane !== targetPaneId && oldPane && oldPane !== 'price' && oldPane !== 'volume' && !indicators.some(i => i.pane === oldPane)) removeDynamicPane(oldPane);
    saveIndicators(); renderAllLegends();
    draggingIndicatorId = null;
  }
  function attachPaneDropZone(el, paneId) {
    if (!el) return;
    el.addEventListener('dragover', e => { if (draggingIndicatorId) { e.preventDefault(); el.classList.add('pane-drop-target'); } });
    el.addEventListener('dragleave', () => el.classList.remove('pane-drop-target'));
    el.addEventListener('drop', e => {
      el.classList.remove('pane-drop-target');
      if (!draggingIndicatorId) return; e.preventDefault(); e.stopPropagation();
      moveIndicatorToPane(draggingIndicatorId, paneId, null);
    });
  }

  // ===== Popover cài đặt chỉ báo (chu kỳ, màu, độ dày, kiểu nét, xóa) =====
  const indPopover = document.createElement('div');
  indPopover.className = 'ind-popover';
  document.body.appendChild(indPopover);
  function closeIndicatorPopover() { indPopover.classList.remove('show'); }
  function openIndicatorPopover(id, anchorEl) {
    const ind = indicators.find(i => i.id === id); if (!ind) return;
    const def = INDICATOR_CATALOG[ind.type];
    let rows = def.params.map(p => `<div class="ind-pop-row"><label>${p.label}</label><input type="number" step="${p.step}" min="1" class="ip-param" data-k="${p.key}" data-step="${p.step}" value="${ind[p.key]}"></div>`).join('');
    rows += `<div class="ind-pop-row"><label>Màu chính</label><input type="color" id="ip-color" value="${ind.color}"></div>`;
    if (['rsi', 'macd', 'stoch'].includes(ind.type)) rows += `<div class="ind-pop-row"><label>Màu phụ</label><input type="color" id="ip-color2" value="${ind.color2 || '#ffc93c'}"></div>`;
    rows += `<div class="ind-pop-row"><label>Độ dày</label><select id="ip-width">${[1, 2, 3, 4].map(w => `<option value="${w}" ${ind.width === w ? 'selected' : ''}>${w}px</option>`).join('')}</select></div>`;
    rows += `<div class="ind-pop-row"><label>Kiểu nét</label><select id="ip-style">
      <option value="solid" ${ind.style === 'solid' ? 'selected' : ''}>Liền nét</option>
      <option value="dashed" ${ind.style === 'dashed' ? 'selected' : ''}>Đứt nét</option>
      <option value="dotted" ${ind.style === 'dotted' ? 'selected' : ''}>Chấm chấm</option>
    </select></div>`;
    indPopover.innerHTML = `<div class="ind-pop-title">${labelFor(ind)}<button class="ind-pop-close" type="button">${icon('x')}</button></div>${rows}<div class="ind-pop-footer"><button class="ind-pop-reset" id="ip-delete" type="button">Xóa chỉ báo</button><button class="ind-pop-save" id="ip-save" type="button">Lưu</button></div>`;
    const rect = anchorEl.getBoundingClientRect();
    indPopover.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    indPopover.style.left = Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 260)) + 'px';
    indPopover.classList.add('show');
    document.getElementById('ip-save').onclick = () => {
      indPopover.querySelectorAll('.ip-param').forEach(inp => {
        const step = parseFloat(inp.dataset.step); const v = parseFloat(inp.value);
        if (!isNaN(v) && v > 0) ind[inp.dataset.k] = step < 1 ? v : Math.round(v);
      });
      ind.color = document.getElementById('ip-color').value;
      const c2 = document.getElementById('ip-color2'); if (c2) ind.color2 = c2.value;
      ind.width = parseInt(document.getElementById('ip-width').value);
      ind.style = document.getElementById('ip-style').value;
      saveIndicators(); applyIndicatorStyle(ind); updateAllIndicators(); renderAllLegends(); closeIndicatorPopover();
    };
    document.getElementById('ip-delete').onclick = () => { closeIndicatorPopover(); if (confirm('Xóa chỉ báo này khỏi biểu đồ?')) deleteIndicator(id); };
    indPopover.querySelector('.ind-pop-close').onclick = closeIndicatorPopover;
  }
  document.addEventListener('click', e => {
    if (indPopover.classList.contains('show') && !indPopover.contains(e.target) && !e.target.closest('.ind-gear')) closeIndicatorPopover();
  });
  function toggleIndicatorVisibility(id) {
    const ind = indicators.find(i => i.id === id); if (!ind) return;
    ind.visible = !ind.visible;
    saveIndicators(); applyIndicatorStyle(ind); renderAllLegends();
  }

  // ===== Vẽ legend cho từng pane + gắn sự kiện kéo-thả / ẩn-hiện / cài đặt / xóa =====
  function paneLegendElId(paneId) {
    if (paneId === 'price') return 'price-legend';
    if (paneId === 'volume') return 'volume-legend';
    if (paneId === 'rsi') return 'rsi-legend';
    return 'legend-' + paneId;
  }
  function renderLegend(paneId) {
    const container = document.getElementById(paneLegendElId(paneId)); if (!container) return;
    container.innerHTML = '';
    indicators.filter(i => i.pane === paneId).forEach(ind => {
      const item = document.createElement('div');
      item.className = 'ind-item' + (ind.visible ? '' : ' ind-hidden');
      item.draggable = true; item.dataset.key = ind.id;
      const meta = subSeriesMeta(ind);
      // Chỉ hiện tên chỉ báo riêng khi có từ 2 đường con trở lên (RSI/MACD/Stoch/BB) để không lặp lại
      // tên 2 lần như trước — 1 dòng gọn giống đúng cách Binance/TradingView hiện: "BB 20,2  Basis .. Upper .. Lower .."
      const nameHtml = meta.length > 1 ? `<span class="ind-name">${labelFor(ind)}</span>` : '';
      const groupsHtml = meta.map((m, idx) => `<span class="ind-group"><span class="ind-dot" style="background:${m.color}"></span><span class="ind-label">${m.label}</span><span class="ind-value" data-key="${ind.id}_${idx}" style="color:${m.color}"></span></span>`).join('');
      item.innerHTML = `${nameHtml}${groupsHtml}<span class="ind-actions"><button class="ind-eye" data-key="${ind.id}" type="button" title="Ẩn/hiện">${ind.visible ? icon('eye') : icon('eyeOff')}</button><button class="ind-gear" data-key="${ind.id}" type="button" title="Cài đặt">${icon('gear')}</button><button class="ind-trash" data-key="${ind.id}" type="button" title="Xóa">${icon('trash')}</button></span>`;
      container.appendChild(item);
    });
  }
  function renderAllLegends() { Object.keys(paneRegistry).forEach(renderLegend); updateAllLegendValues(); }

  // ===== Hiển thị giá trị hiện tại (hoặc giá trị tại điểm đang rê chuột) của TỪNG ĐƯỜNG trong chỉ báo =====
  // Thay thế cho nhãn giá trị trên trục phải (đã tắt ở mkLine) để tránh chồng chéo con số như trên các sàn lớn.
  function getLatestTime() { return candlesData.length ? candlesData[candlesData.length - 1].time : null; }
  function updateLegendValues(paneId, time) {
    const container = document.getElementById(paneLegendElId(paneId)); if (!container) return;
    const t = (time === undefined || time === null) ? getLatestTime() : time;
    indicators.filter(i => i.pane === paneId).forEach(ind => {
      const store = seriesStore[ind.id]; if (!store) return;
      const maps = store.dataMaps || [store.dataMap];
      maps.forEach((map, idx) => {
        const el = container.querySelector(`.ind-value[data-key="${ind.id}_${idx}"]`);
        if (!el) return;
        const val = (t !== null && t !== undefined && map) ? map.get(t) : null;
        el.textContent = (val === null || val === undefined) ? '' : fmt(val);
      });
    });
  }
  function updateAllLegendValues(time) { Object.keys(paneRegistry).forEach(paneId => updateLegendValues(paneId, time)); }
  function initLegendEvents(containerId, paneId) {
    const container = document.getElementById(containerId); if (!container) return;
    container.addEventListener('click', e => {
      const eyeBtn = e.target.closest('.ind-eye'), gearBtn = e.target.closest('.ind-gear'), trashBtn = e.target.closest('.ind-trash');
      if (eyeBtn) { toggleIndicatorVisibility(eyeBtn.dataset.key); return; }
      if (gearBtn) { openIndicatorPopover(gearBtn.dataset.key, gearBtn); return; }
      if (trashBtn) { if (confirm('Xóa chỉ báo này khỏi biểu đồ?')) deleteIndicator(trashBtn.dataset.key); return; }
      // Trên cảm ứng không có hover — chạm vào 1 dòng chỉ báo để lộ nút ẩn/hiện-cài đặt-xoá,
      // chạm dòng khác hoặc ra ngoài sẽ tự đóng lại (giống app các sàn lớn trên di động).
      if (isTouchDevice) {
        const item = e.target.closest('.ind-item'); if (!item) return;
        const wasOpen = item.classList.contains('legend-open');
        container.querySelectorAll('.ind-item.legend-open').forEach(el => el.classList.remove('legend-open'));
        if (!wasOpen) item.classList.add('legend-open');
      }
    });
    container.addEventListener('dragstart', e => { const item = e.target.closest('.ind-item'); if (!item) return; draggingIndicatorId = item.dataset.key; item.classList.add('dragging'); });
    container.addEventListener('dragend', e => { const item = e.target.closest('.ind-item'); if (item) item.classList.remove('dragging'); draggingIndicatorId = null; });
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      const item = e.target.closest('.ind-item'); if (!draggingIndicatorId) return;
      moveIndicatorToPane(draggingIndicatorId, paneId, item ? item.dataset.key : null);
    });
  }
  if (isTouchDevice) {
    document.addEventListener('click', e => {
      if (e.target.closest('.ind-item')) return;
      document.querySelectorAll('.ind-item.legend-open').forEach(el => el.classList.remove('legend-open'));
    });
  }

  // ===== Menu "+ Chỉ báo" (giống danh mục chỉ báo trên các sàn lớn) =====
  const indicatorMenu = document.createElement('div');
  indicatorMenu.className = 'indicator-menu';
  document.body.appendChild(indicatorMenu);
  function closeIndicatorMenu() { indicatorMenu.classList.remove('show'); }
  (function renderIndicatorMenu() {
    const cats = { overlay: 'Trên biểu đồ giá', volume: 'Khối lượng', oscillator: 'Chỉ báo dao động (pane riêng)' };
    let html = '';
    Object.keys(cats).forEach(cat => {
      html += `<div class="im-cat">${cats[cat]}</div>`;
      Object.keys(INDICATOR_CATALOG).filter(k => INDICATOR_CATALOG[k].category === cat).forEach(k => {
        html += `<div class="im-item" data-type="${k}"><span>${INDICATOR_CATALOG[k].label}</span><span class="im-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></div>`;
      });
    });
    indicatorMenu.innerHTML = html;
    indicatorMenu.querySelectorAll('.im-item').forEach(el => el.addEventListener('click', () => addIndicator(el.dataset.type)));
  })();
  document.getElementById('btn-add-indicator').addEventListener('click', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    indicatorMenu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    indicatorMenu.style.left = Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 280)) + 'px';
    indicatorMenu.classList.toggle('show');
  });
  document.addEventListener('click', e => {
    if (indicatorMenu.classList.contains('show') && !indicatorMenu.contains(e.target) && e.target.id !== 'btn-add-indicator') closeIndicatorMenu();
  });

  // ===== Kéo-thả đổi VỊ TRÍ PANE (khung) — dùng chung cho pane có sẵn & pane tự tạo =====
  let dragPaneEl = null;
  function savePaneOrder() {
    const order = Array.from(document.getElementById('chart-wrapper').querySelectorAll('.sub-pane')).map(p => p.dataset.pane);
    localStorage.setItem('ok_pane_order', JSON.stringify(order));
  }
  function attachPaneHeaderEvents(header) {
    header.setAttribute('draggable', 'true');
    header.addEventListener('dragstart', e => {
      dragPaneEl = header.closest('.sub-pane'); dragPaneEl.classList.add('pane-dragging');
      e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragPaneEl.id); } catch (err) {}
    });
    header.addEventListener('dragend', () => {
      if (dragPaneEl) dragPaneEl.classList.remove('pane-dragging'); dragPaneEl = null;
      document.getElementById('chart-wrapper').querySelectorAll('.sub-pane').forEach(p => p.classList.remove('drop-target-before', 'drop-target-after'));
    });
  }
  function attachPaneReorderDropTarget(pane) {
    pane.addEventListener('dragover', e => {
      e.preventDefault(); if (!dragPaneEl || dragPaneEl === pane) return;
      const rect = pane.getBoundingClientRect(); const before = (e.clientY - rect.top) < rect.height / 2;
      pane.classList.toggle('drop-target-before', before); pane.classList.toggle('drop-target-after', !before);
    });
    pane.addEventListener('dragleave', () => pane.classList.remove('drop-target-before', 'drop-target-after'));
    pane.addEventListener('drop', e => {
      e.preventDefault(); if (!dragPaneEl || dragPaneEl === pane) return;
      const wrapper = document.getElementById('chart-wrapper');
      const rect = pane.getBoundingClientRect(); const before = (e.clientY - rect.top) < rect.height / 2;
      if (before) wrapper.insertBefore(dragPaneEl, pane); else wrapper.insertBefore(dragPaneEl, pane.nextSibling);
      pane.classList.remove('drop-target-before', 'drop-target-after');
      savePaneOrder(); updatePaneAxisVisibility();
      setTimeout(() => { resizeAllCharts(); window.dispatchEvent(new Event('resize')); }, 0);
    });
  }

  // ===== Khởi tạo: mount toàn bộ chỉ báo đã lưu (tạo lại pane nếu cần), gắn sự kiện legend & drop-zone gốc =====
  function mountAllIndicators() {
    indicators.forEach(ind => {
      if (!paneRegistry[ind.pane]) { ind.pane = createDynamicPane(ind.type); }
      createSeriesForIndicator(ind);
      applyIndicatorStyle(ind);
    });
    saveIndicators();
  }
  mountAllIndicators();
  requestAnimationFrame(resizeAllCharts);
  // Pane RSI gốc từng bị người dùng xóa hết chỉ báo trong phiên trước -> dọn luôn, tránh khung rỗng "hồi sinh"
  if (paneRegistry.rsi && !indicators.some(i => i.pane === 'rsi')) removeDynamicPane('rsi');
  initLegendEvents('price-legend', 'price');
  initLegendEvents('volume-legend', 'volume');
  initLegendEvents('rsi-legend', 'rsi');
  attachPaneDropZone(document.getElementById('chart-price'), 'price');
  attachPaneDropZone(document.getElementById('pane-volume'), 'volume');
  attachPaneDropZone(document.getElementById('pane-rsi'), 'rsi');
  document.getElementById('chart-wrapper').querySelectorAll('.pane-header').forEach(attachPaneHeaderEvents);
  document.getElementById('chart-wrapper').querySelectorAll('.sub-pane').forEach(attachPaneReorderDropTarget);
  updatePaneAxisVisibility();
  renderAllLegends();

  const priceElement = document.getElementById('current-price'); const changeBadge = document.getElementById('change-badge'); const titleElement = document.getElementById('chart-title');

  // =========================================================
  // HỆ THỐNG VẼ CHUYÊN NGHIỆP TRÊN BIỂU ĐỒ GIÁ
  // Nguyên lý giống Binance/TradingView: 1 canvas trong suốt phủ lên chart,
  // toạ độ mỗi điểm vẽ được lưu dưới dạng (thời gian, giá) — không phải pixel —
  // nên khi kéo/zoom biểu đồ, canvas tự vẽ lại đúng vị trí mỗi khung hình (requestAnimationFrame).
  // Dữ liệu vẽ được lưu riêng theo từng mã coin trong localStorage, giữ nguyên khi đổi khung thời gian.
  // =========================================================
  const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
  const TOOL_POINTS = { trendline: 2, ray: 2, hline: 1, hray: 1, vline: 1, channel: 3, fib: 2, rect: 2, circle: 2, arrow: 2, text: 1, measure: 2 };
  const HINT_TEXT = {
    trendline: 'Click điểm đầu, rồi click điểm cuối để vẽ đường xu hướng',
    ray: 'Click điểm đầu, rồi click hướng đi để vẽ tia xu hướng (kéo dài vô hạn)',
    hline: 'Click vào biểu đồ để đặt đường ngang (kháng cự/hỗ trợ)',
    hray: 'Click vào biểu đồ để đặt tia ngang bắt đầu từ điểm click',
    vline: 'Click vào biểu đồ để đặt đường thẳng đứng đánh dấu thời điểm',
    channel: 'Click 2 điểm để vẽ đường chính, click điểm thứ 3 để đặt độ rộng kênh',
    fib: 'Click điểm đỉnh/đáy bắt đầu, rồi click điểm kết thúc để vẽ Fibonacci',
    rect: 'Click 1 góc, rồi click góc đối diện để vẽ hình chữ nhật',
    circle: 'Click 1 điểm, rồi click điểm còn lại để vẽ hình tròn/ê-líp',
    polyline: 'Click nhiều điểm liên tiếp — nhấn Enter hoặc chạm đúp (double-tap) để hoàn tất, Esc để huỷ',
    arrow: 'Click điểm bắt đầu, rồi click vị trí đầu mũi tên',
    text: 'Click vào vị trí muốn chèn ghi chú',
    measure: 'Click điểm đầu, rồi click điểm cuối để đo chênh lệch giá/%/số nến',
    eraser: 'Click vào 1 bản vẽ để xoá riêng bản vẽ đó'
  };

  let currentTool = 'cursor';
  let drawings = [];
  let pendingPoints = [];
  let lastPolyClick = null; // theo dõi lần chạm/click gần nhất để nhận diện double-tap/double-click hoàn tất polyline
  let previewPoint = null;
  let selectedId = null;
  let magnetOn = localStorage.getItem('ok_draw_magnet') === 'true';
  let lockOn = localStorage.getItem('ok_draw_lock') === 'true';
  let hiddenOn = false;
  let W = 0, H = 0;
  // Thiết bị cảm ứng cần vùng chạm lớn hơn nhiều so với con trỏ chuột để chọn/kéo đường vẽ chính
  // xác bằng ngón tay — giống cách TradingView tăng "hit area" trên mobile. (isTouchDevice khai
  // báo ở đầu file để dùng chung cho cả legend chỉ báo.)
  const HIT_TOL = isTouchDevice ? 16 : 8;      // dung sai để chọn/xoá 1 bản vẽ
  const HANDLE_TOL = isTouchDevice ? 20 : 10;  // dung sai để tóm lấy 1 chấm neo (handle) mà kéo
  const HANDLE_R = isTouchDevice ? 7 : 5;      // bán kính vẽ chấm neo trên canvas
  // Vòng lặp vẽ canvas (renderDrawings, bên dưới) trước đây chạy requestAnimationFrame MÃI MÃI —
  // 60 lần/giây suốt vòng đời trang, kể cả khi không ai chạm gì vào biểu đồ. Đây là nguyên nhân
  // chính thứ 2 gây ì máy/tốn pin (cùng với widthSyncWatchLoop ở trên). Giờ chỉ chạy khi thực sự
  // đang có tương tác (hover/kéo bản vẽ/pan-zoom/đang đặt điểm vẽ dở); ở trạng thái nghỉ thì dừng hẳn.
  let drawLoopRunning = false;
  let isPointerOverChartArea = false;
  let panZoomActiveUntil = 0;
  function isChartInteractionActive() {
    return isPointerOverChartArea || isDragging || Date.now() < panZoomActiveUntil || pendingPoints.length > 0;
  }
  function ensureDrawLoopRunning() {
    if (drawLoopRunning) return;
    drawLoopRunning = true;
    requestAnimationFrame(renderDrawings);
  }

  function drawColor() { return document.getElementById('draw-color')?.value || '#3d8bff'; }
  function drawStorageKey() { return 'ok_drawings_' + currentSymbol; }
  function saveDrawings() { try { localStorage.setItem(drawStorageKey(), JSON.stringify(drawings)); } catch (e) {} }
  function loadDrawings() { try { drawings = JSON.parse(localStorage.getItem(drawStorageKey()) || '[]'); drawings.forEach(normalizeDrawing); } catch (e) { drawings = []; } }
  loadDrawings();

  // ===== Thuộc tính từng bản vẽ: màu / độ dày nét / ẩn riêng / khoá riêng =====
  const WIDTH_STEPS = [1, 2, 3, 4, 5];
  function isDrawLocked(d) { return !!(lockOn || (d && d.locked)); }
  function normalizeDrawing(d) {
    if (!d) return d;
    if (typeof d.width !== 'number') d.width = 2;
    if (typeof d.hidden !== 'boolean') d.hidden = false;
    if (typeof d.locked !== 'boolean') d.locked = false;
    return d;
  }

  function showDrawToast(msg) {
    const el = document.createElement('div'); el.className = 'draw-toast'; el.textContent = msg;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 2200);
  }

  function nearestCandle(t) {
    if (!candlesData.length) return null;
    let lo = 0, hi = candlesData.length - 1;
    if (t <= candlesData[0].time) return candlesData[0];
    if (t >= candlesData[hi].time) return candlesData[hi];
    while (lo < hi) { const mid = (lo + hi) >> 1; if (candlesData[mid].time < t) lo = mid + 1; else hi = mid; }
    const a = candlesData[lo - 1], b = candlesData[lo];
    if (!a) return b;
    return (t - a.time) < (b.time - t) ? a : b;
  }
  function snapPoint(time, price) {
    if (!magnetOn) return { time, price };
    const c = nearestCandle(time);
    if (!c) return { time, price };
    const vals = [c.open, c.high, c.low, c.close];
    let best = price, bestDist = Infinity;
    vals.forEach(v => { const d = Math.abs(v - price); if (d < bestDist) { bestDist = d; best = v; } });
    return { time: c.time, price: best };
  }
  function countBarsBetween(t1, t2) {
    const lo = Math.min(t1, t2), hi = Math.max(t1, t2); let c = 0;
    for (const cd of candlesData) { if (cd.time >= lo && cd.time <= hi) c++; }
    return Math.max(0, c - 1);
  }
  function textColorFor(bg) {
    const r = parseInt(bg.slice(1, 3), 16), g = parseInt(bg.slice(3, 5), 16), b = parseInt(bg.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#0b0f17' : '#ffffff';
  }

  // ===== Canvas phủ lên #chart-price =====
  const drawCanvas = document.createElement('canvas');
  drawCanvas.id = 'drawing-canvas';
  document.getElementById('chart-price').appendChild(drawCanvas);
  const dctx = drawCanvas.getContext('2d');
  function resizeDrawCanvas() {
    const host = document.getElementById('chart-price'); if (!host) return;
    W = host.clientWidth; H = host.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    drawCanvas.width = Math.max(1, Math.round(W * dpr)); drawCanvas.height = Math.max(1, Math.round(H * dpr));
    drawCanvas.style.width = W + 'px'; drawCanvas.style.height = H + 'px';
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeDrawCanvas();

  // Đánh thức vòng lặp vẽ khi có tương tác, để nó chạy mượt trong lúc dùng và tự dừng lúc nghỉ.
  const chartWrapperElForDraw = document.getElementById('chart-wrapper');
  if (chartWrapperElForDraw) {
    chartWrapperElForDraw.addEventListener('pointerenter', () => { isPointerOverChartArea = true; ensureDrawLoopRunning(); });
    chartWrapperElForDraw.addEventListener('pointerleave', () => { isPointerOverChartArea = false; });
    chartWrapperElForDraw.addEventListener('pointerdown', () => { isPointerOverChartArea = true; ensureDrawLoopRunning(); });
  }
  window.addEventListener('resize', () => ensureDrawLoopRunning());

  // ===== Thanh công cụ nổi cho bản vẽ đang được chọn (đổi màu / độ dày / ẩn / nhân bản / khoá / xoá) =====
  const objToolbar = document.createElement('div');
  objToolbar.className = 'draw-obj-toolbar';
  objToolbar.innerHTML = `
    <button type="button" class="dot-swatch" data-act="color" title="Đổi màu"><span class="dot-swatch-inner"></span></button>
    <input type="color" class="dot-color-input">
    <button type="button" data-act="width" title="Độ dày nét">2px</button>
    <button type="button" data-act="eye" title="Ẩn/hiện bản vẽ này">${icon('eye')}</button>
    <button type="button" data-act="dup" title="Nhân bản">${icon('copy')}</button>
    <button type="button" data-act="lock" title="Khoá bản vẽ này">${icon('unlock')}</button>
    <button type="button" class="danger" data-act="del" title="Xoá bản vẽ này">${icon('x')}</button>
  `;
  document.getElementById('chart-price').appendChild(objToolbar);
  const objColorInput = objToolbar.querySelector('.dot-color-input');
  const objSwatchDot = objToolbar.querySelector('.dot-swatch-inner');
  const objWidthBtn = objToolbar.querySelector('[data-act="width"]');
  const objEyeBtn = objToolbar.querySelector('[data-act="eye"]');
  const objLockBtn = objToolbar.querySelector('[data-act="lock"]');

  function getSelectedDrawing() { return selectedId ? drawings.find(x => x.id === selectedId) : null; }

  function anchorFor(d) {
    if (!d) return null;
    if (d.type === 'hline') { const y = yOf(d.points[0].price); return y == null ? null : { x: 14, y }; }
    if (d.type === 'vline') { const x = xOf(d.points[0].time); return x == null ? null : { x, y: 14 }; }
    // Dùng điểm trên-cùng-bên-trái của bản vẽ làm điểm neo cho thanh công cụ
    const pts = (d.points || []).map(xy).filter(Boolean);
    if (!pts.length) return null;
    let best = pts[0];
    pts.forEach(p => { if (p.y < best.y || (p.y === best.y && p.x < best.x)) best = p; });
    return best;
  }

  function refreshObjToolbarContent(d) {
    if (!d) return;
    objSwatchDot.style.background = d.color;
    objWidthBtn.textContent = (d.width || 2) + 'px';
    objEyeBtn.innerHTML = d.hidden ? icon('eyeOff') : icon('eye');
    objEyeBtn.classList.toggle('toggle-on', !!d.hidden);
    objLockBtn.innerHTML = d.locked ? icon('lock') : icon('unlock');
    objLockBtn.classList.toggle('toggle-on', !!d.locked);
  }

  function updateObjToolbar() {
    const d = getSelectedDrawing();
    const p = d ? anchorFor(d) : null;
    if (!p) { objToolbar.classList.remove('show'); return; }
    refreshObjToolbarContent(d);
    const boxW = 208, boxH = 30;
    objToolbar.style.left = Math.max(2, Math.min(W - boxW - 2, p.x - boxW / 2)) + 'px';
    objToolbar.style.top = Math.max(2, p.y - boxH - 12) + 'px';
    objToolbar.classList.add('show');
  }

  objToolbar.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]'); if (!btn) return;
    const d = getSelectedDrawing(); if (!d) return;
    const act = btn.getAttribute('data-act');
    if (act === 'del') {
      if (isDrawLocked(d)) { showDrawToast('Bản vẽ đang bị khoá — mở khoá để xoá'); return; }
      removeDrawing(d.id); selectedId = null; objToolbar.classList.remove('show'); return;
    }
    if (act === 'color') { objColorInput.value = d.color || '#3d8bff'; objColorInput.click(); return; }
    if (act === 'width') {
      if (isDrawLocked(d)) { showDrawToast('Bản vẽ đang bị khoá'); return; }
      const cur = WIDTH_STEPS.indexOf(d.width || 2);
      d.width = WIDTH_STEPS[(cur + 1) % WIDTH_STEPS.length]; saveDrawings(); refreshObjToolbarContent(d); return;
    }
    if (act === 'eye') { d.hidden = !d.hidden; saveDrawings(); refreshObjToolbarContent(d); return; }
    if (act === 'lock') { d.locked = !d.locked; saveDrawings(); refreshObjToolbarContent(d); return; }
    if (act === 'dup') {
      const clone = JSON.parse(JSON.stringify(d));
      delete clone.id; clone.locked = false;
      // Dịch nhẹ bản sao theo giá để không đè khít lên bản gốc
      clone.points = (clone.points || []).map(pt => ({ ...pt, price: pt.price ? pt.price * 1.006 : pt.price }));
      const added = addDrawing(clone);
      selectedId = added.id; updateObjToolbar(); return;
    }
  });
  objColorInput.addEventListener('input', () => {
    const d = getSelectedDrawing(); if (!d) return;
    d.color = objColorInput.value; saveDrawings(); refreshObjToolbarContent(d);
  });
  objColorInput.addEventListener('change', () => { saveDrawings(); });

  // ===== Quy đổi thời gian <-> toạ độ dựa trên "chỉ số logic" (logical index) =====
  // API gốc timeToCoordinate/coordinateToTime của thư viện chỉ hoạt động chính xác trong vùng có nến thật.
  // Dùng logical index (coordinateToLogical/logicalToCoordinate) thì có thể ngoại suy ra cả vùng trống bên phải
  // (sau cây nến mới nhất) và bên trái, nhờ đó vẽ được ở BẤT KỲ đâu trong khung chart, không bị giới hạn.
  const INTERVAL_SEC = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 };
  function intervalSeconds() { return INTERVAL_SEC[currentInterval] || 14400; }
  function logicalToTime(logical) {
    if (!candlesData.length || logical == null) return null;
    const n = candlesData.length, isec = intervalSeconds();
    if (logical <= 0) return candlesData[0].time + logical * isec;
    if (logical >= n - 1) return candlesData[n - 1].time + (logical - (n - 1)) * isec;
    const i0 = Math.floor(logical), i1 = Math.min(i0 + 1, n - 1), frac = logical - i0;
    return candlesData[i0].time + (candlesData[i1].time - candlesData[i0].time) * frac;
  }
  function timeToLogical(time) {
    if (!candlesData.length || time == null) return null;
    const n = candlesData.length, isec = intervalSeconds();
    if (time <= candlesData[0].time) return (time - candlesData[0].time) / isec;
    if (time >= candlesData[n - 1].time) return (n - 1) + (time - candlesData[n - 1].time) / isec;
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (candlesData[mid].time < time) lo = mid + 1; else hi = mid; }
    const i1 = lo, i0 = Math.max(0, lo - 1);
    if (candlesData[i1].time === candlesData[i0].time) return i0;
    return i0 + (time - candlesData[i0].time) / (candlesData[i1].time - candlesData[i0].time);
  }
  // Toạ độ x (pixel) -> thời gian, hoạt động cả ở vùng trống chưa có nến (bên phải/trái biểu đồ)
  function xToTime(x) {
    const logical = chartPrice.timeScale().coordinateToLogical(x);
    return logical == null ? null : logicalToTime(logical);
  }

  function xOf(time) {
    const direct = chartPrice.timeScale().timeToCoordinate(time);
    if (direct !== null) return direct;
    const logical = timeToLogical(time);
    if (logical == null) return null;
    return chartPrice.timeScale().logicalToCoordinate(logical);
  }
  function yOf(price) { return candleSeries.priceToCoordinate(price); }
  function xy(pt) { const x = xOf(pt.time), y = yOf(pt.price); return (x === null || y === null) ? null : { x, y }; }
  function lineRaw(x1, y1, x2, y2) { dctx.beginPath(); dctx.moveTo(x1, y1); dctx.lineTo(x2, y2); dctx.stroke(); }
  function extendRay(p1, p2) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (Math.abs(dx) < 0.01) return { x: p2.x, y: dy >= 0 ? H : 0 };
    const targetX = dx >= 0 ? W : 0; const t = (targetX - p1.x) / dx;
    return { x: targetX, y: p1.y + dy * t };
  }
  function drawArrowHead(p1, p2) {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); const len = 10;
    dctx.beginPath(); dctx.moveTo(p2.x, p2.y); dctx.lineTo(p2.x - len * Math.cos(angle - 0.4), p2.y - len * Math.sin(angle - 0.4));
    dctx.moveTo(p2.x, p2.y); dctx.lineTo(p2.x - len * Math.cos(angle + 0.4), p2.y - len * Math.sin(angle + 0.4)); dctx.stroke();
  }
  function priceLabel(y, price, color) {
    const text = fmt(price); dctx.font = '600 11px "JetBrains Mono", monospace';
    const tw = dctx.measureText(text).width; const boxW = tw + 12, boxH = 18; const x = W - boxW - 2;
    dctx.fillStyle = color; dctx.fillRect(x, y - boxH / 2, boxW, boxH);
    dctx.fillStyle = textColorFor(color); dctx.textBaseline = 'middle'; dctx.textAlign = 'left';
    dctx.fillText(text, x + 6, y + 0.5);
  }
  function drawFib(d) {
    const t1 = d.points[0].time, t2 = d.points[1].time, pr1 = d.points[0].price, pr2 = d.points[1].price;
    const x1 = xOf(Math.min(t1, t2)), x2 = xOf(Math.max(t1, t2));
    if (x1 == null || x2 == null) return;
    FIB_LEVELS.forEach((lv, i) => {
      const price = pr1 + (pr2 - pr1) * lv; const y = yOf(price); if (y == null) return;
      dctx.strokeStyle = d.color; dctx.globalAlpha = 0.85; dctx.setLineDash(lv === 0 || lv === 1 ? [] : [5, 4]);
      lineRaw(x1, y, x2, y); dctx.setLineDash([]); dctx.globalAlpha = 1;
      dctx.font = '600 10px "JetBrains Mono", monospace'; dctx.fillStyle = d.color; dctx.textBaseline = 'bottom'; dctx.textAlign = 'left';
      dctx.fillText((lv * 100).toFixed(1) + '%  ' + fmt(price), x1 + 4, y - 2);
      if (i < FIB_LEVELS.length - 1) {
        const y2 = yOf(pr1 + (pr2 - pr1) * FIB_LEVELS[i + 1]);
        if (y2 != null) { dctx.fillStyle = d.color + (i % 2 === 0 ? '14' : '0a'); dctx.fillRect(x1, Math.min(y, y2), x2 - x1, Math.abs(y2 - y)); }
      }
    });
  }
  function drawMeasure(d) {
    const p1 = xy(d.points[0]), p2 = xy(d.points[1]); if (!p1 || !p2) return;
    const priceDiff = d.points[1].price - d.points[0].price; const pct = (priceDiff / d.points[0].price) * 100;
    const up = priceDiff >= 0; const col = up ? (currentUpColor || '#14cc8a') : (currentDownColor || '#ff4757');
    const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y), rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
    dctx.fillStyle = col + '26'; dctx.fillRect(x, y, rw, rh);
    dctx.strokeStyle = col; dctx.setLineDash([4, 3]); dctx.strokeRect(x, y, rw, rh); dctx.setLineDash([]);
    const bars = countBarsBetween(d.points[0].time, d.points[1].time);
    const label = (up ? '+' : '') + fmt(priceDiff) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%) • ' + bars + ' nến';
    dctx.font = '700 11px "JetBrains Mono", monospace'; const tw = dctx.measureText(label).width;
    const lx = p2.x + 8, ly = p2.y < p1.y ? p2.y : p2.y;
    dctx.fillStyle = col; dctx.fillRect(lx - 4, ly - 20, tw + 8, 20);
    dctx.fillStyle = textColorFor(col); dctx.textBaseline = 'middle'; dctx.textAlign = 'left'; dctx.fillText(label, lx, ly - 10);
  }
  function drawOne(d, selected) {
    dctx.save();
    const baseW = d.width || 2;
    dctx.strokeStyle = d.color; dctx.fillStyle = d.color; dctx.lineWidth = selected ? baseW + 1.5 : baseW; dctx.lineCap = 'round';
    switch (d.type) {
      case 'trendline': case 'ray': case 'arrow': case 'channel': {
        const p1 = xy(d.points[0]), p2raw = d.points[1] ? xy(d.points[1]) : null;
        if (!p1 || !p2raw) break;
        let p2 = p2raw;
        if (d.type === 'ray') p2 = extendRay(p1, p2raw);
        lineRaw(p1.x, p1.y, p2.x, p2.y);
        if (d.type === 'arrow') drawArrowHead(p1, p2raw);
        if (d.type === 'channel' && d.points[2]) {
          const p3 = xy(d.points[2]);
          if (p3) {
            const dy = p3.y - p1.y;
            lineRaw(p1.x, p1.y + dy, p2raw.x, p2raw.y + dy);
            dctx.fillStyle = d.color + '1c';
            dctx.beginPath(); dctx.moveTo(p1.x, p1.y); dctx.lineTo(p2raw.x, p2raw.y); dctx.lineTo(p2raw.x, p2raw.y + dy); dctx.lineTo(p1.x, p1.y + dy); dctx.closePath(); dctx.fill();
          }
        }
        break;
      }
      case 'hline': { const y = yOf(d.points[0].price); if (y == null) break; dctx.setLineDash([7, 5]); lineRaw(0, y, W, y); dctx.setLineDash([]); priceLabel(y, d.points[0].price, d.color); break; }
      case 'hray': { const p = xy(d.points[0]); if (!p) break; lineRaw(p.x, p.y, W, p.y); priceLabel(p.y, d.points[0].price, d.color); break; }
      case 'vline': { const x = xOf(d.points[0].time); if (x == null) break; lineRaw(x, 0, x, H); break; }
      case 'rect': { const p1 = xy(d.points[0]), p2 = xy(d.points[1]); if (!p1 || !p2) break; const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y), rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y); dctx.fillStyle = d.color + '22'; dctx.fillRect(x, y, rw, rh); dctx.strokeStyle = d.color; dctx.strokeRect(x, y, rw, rh); break; }
      case 'circle': { const p1 = xy(d.points[0]), p2 = xy(d.points[1]); if (!p1 || !p2) break; const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2, rx = Math.abs(p2.x - p1.x) / 2, ry = Math.abs(p2.y - p1.y) / 2; dctx.beginPath(); dctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); dctx.fillStyle = d.color + '22'; dctx.fill(); dctx.strokeStyle = d.color; dctx.stroke(); break; }
      case 'fib': drawFib(d); break;
      case 'measure': drawMeasure(d); break;
      case 'polyline': { const pts = d.points.map(xy).filter(Boolean); if (pts.length < 2) break; dctx.beginPath(); dctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => dctx.lineTo(p.x, p.y)); dctx.stroke(); break; }
      case 'text': { const p = xy(d.points[0]); if (!p) break; dctx.font = '600 13px Inter, sans-serif'; dctx.fillStyle = d.color; dctx.textBaseline = 'bottom'; dctx.textAlign = 'left'; dctx.fillText(d.text || '', p.x + 4, p.y - 4); break; }
    }
    if (selected) {
      (d.points || []).forEach(pt => {
        const p = xy(pt); if (!p) return;
        dctx.beginPath(); dctx.arc(p.x, p.y, HANDLE_R + 2, 0, Math.PI * 2);
        dctx.fillStyle = '#0e131b'; dctx.fill();
        dctx.beginPath(); dctx.arc(p.x, p.y, HANDLE_R, 0, Math.PI * 2);
        dctx.fillStyle = d.color; dctx.fill();
        dctx.lineWidth = 1.6; dctx.strokeStyle = '#ffffff'; dctx.stroke();
      });
    }
    if (d.locked) {
      const anchorPt = (d.points || [])[0]; const p = anchorPt ? xy(anchorPt) : null;
      if (p) {
        const lx = p.x + 8, ly = p.y - 18;
        dctx.save();
        dctx.strokeStyle = d.color; dctx.lineWidth = 1.4; dctx.lineCap = 'round'; dctx.lineJoin = 'round';
        dctx.beginPath(); dctx.roundRect ? dctx.roundRect(lx, ly + 4, 11, 8, 1.5) : dctx.rect(lx, ly + 4, 11, 8); dctx.stroke();
        dctx.beginPath(); dctx.arc(lx + 5.5, ly + 4, 3.6, Math.PI, 0); dctx.stroke();
        dctx.restore();
      }
    }
    dctx.restore();
  }
  function drawPending() {
    if (currentTool === 'cursor' || currentTool === 'eraser' || !pendingPoints.length) return;
    const pts = pendingPoints.concat(previewPoint ? [previewPoint] : []);
    dctx.globalAlpha = 0.75; drawOne({ type: currentTool, points: pts, color: drawColor(), text: '' }, false); dctx.globalAlpha = 1;
  }
  function drawMagnetHighlight() {
    if (!magnetOn) return;
    let pt = null;
    if (dragDrawing && dragPointIndex >= 0 && isDragging) pt = dragDrawing.points[dragPointIndex];
    else if (currentTool !== 'cursor' && currentTool !== 'eraser' && previewPoint) pt = previewPoint;
    if (!pt) return;
    const p = xy(pt); if (!p) return;
    dctx.save();
    dctx.strokeStyle = '#f0b90b'; dctx.lineWidth = 1.5;
    dctx.globalAlpha = 0.95; dctx.beginPath(); dctx.arc(p.x, p.y, 5, 0, Math.PI * 2); dctx.stroke();
    dctx.globalAlpha = 0.35; dctx.beginPath(); dctx.arc(p.x, p.y, 9, 0, Math.PI * 2); dctx.stroke();
    dctx.restore();
  }
  function renderDrawings() {
    if (document.hidden) { requestAnimationFrame(renderDrawings); return; }
    const host = document.getElementById('chart-price');
    if (!host) { requestAnimationFrame(renderDrawings); return; }
    const dpr = window.devicePixelRatio || 1;
    if (drawCanvas.width !== Math.round(host.clientWidth * dpr) || drawCanvas.height !== Math.round(host.clientHeight * dpr)) resizeDrawCanvas();
    dctx.clearRect(0, 0, W, H);
    if (!hiddenOn) drawings.forEach(d => { if (!d.hidden) drawOne(d, d.id === selectedId); });
    drawPending();
    drawMagnetHighlight();
    updateObjToolbar();
    // Chỉ tiếp tục lặp khung hình kế tiếp khi vẫn đang có tương tác thật sự; nếu không, dừng hẳn
    // vòng lặp để không ngốn CPU/pin ở trạng thái nghỉ. ensureDrawLoopRunning() sẽ khởi động lại
    // ngay khi có tương tác mới (hover vào biểu đồ, kéo bản vẽ, pan/zoom, resize, đổi coin...).
    if (isChartInteractionActive()) { requestAnimationFrame(renderDrawings); } else { drawLoopRunning = false; }
  }
  ensureDrawLoopRunning();

  // ===== Hit-test (chọn / xoá bản vẽ) =====
  function distToSeg(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1; const len = C * C + D * D;
    let t = len ? (A * C + B * D) / len : -1; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * C), py - (y1 + t * D));
  }
  function hitTestOne(d, x, y, tol) {
    switch (d.type) {
      case 'trendline': case 'ray': case 'arrow': case 'channel': {
        const p1 = xy(d.points[0]), p2raw = d.points[1] ? xy(d.points[1]) : null; if (!p1 || !p2raw) return false;
        const p2 = d.type === 'ray' ? extendRay(p1, p2raw) : p2raw;
        if (distToSeg(x, y, p1.x, p1.y, p2.x, p2.y) <= tol) return true;
        if (d.type === 'channel' && d.points[2]) { const p3 = xy(d.points[2]); if (p3) { const dy = p3.y - p1.y; if (distToSeg(x, y, p1.x, p1.y + dy, p2raw.x, p2raw.y + dy) <= tol) return true; } }
        return false;
      }
      case 'hline': { const py = yOf(d.points[0].price); return py != null && Math.abs(y - py) <= tol; }
      case 'hray': { const p = xy(d.points[0]); return !!p && Math.abs(y - p.y) <= tol && x >= p.x - 2; }
      case 'vline': { const px = xOf(d.points[0].time); return px != null && Math.abs(x - px) <= tol; }
      case 'rect': case 'circle': case 'measure': {
        const p1 = xy(d.points[0]), p2 = xy(d.points[1]); if (!p1 || !p2) return false;
        const bx = Math.min(p1.x, p2.x) - tol, by = Math.min(p1.y, p2.y) - tol, bw = Math.abs(p2.x - p1.x) + 2 * tol, bh = Math.abs(p2.y - p1.y) + 2 * tol;
        return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
      }
      case 'fib': {
        const p1 = xy(d.points[0]), p2 = xy(d.points[1]); if (!p1 || !p2) return false;
        const minX = Math.min(p1.x, p2.x) - tol, maxX = Math.max(p1.x, p2.x) + tol; if (x < minX || x > maxX) return false;
        const pr1 = d.points[0].price, pr2 = d.points[1].price;
        return FIB_LEVELS.some(lv => { const py = yOf(pr1 + (pr2 - pr1) * lv); return py != null && Math.abs(y - py) <= tol; });
      }
      case 'polyline': { const pts = d.points.map(xy).filter(Boolean); for (let i = 0; i < pts.length - 1; i++) if (distToSeg(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= tol) return true; return false; }
      case 'text': { const p = xy(d.points[0]); return !!p && x >= p.x - 4 && x <= p.x + 130 && y >= p.y - 22 && y <= p.y + 4; }
    }
    return false;
  }
  function hitTest(x, y) { for (let i = drawings.length - 1; i >= 0; i--) if (hitTestOne(drawings[i], x, y, HIT_TOL)) return drawings[i]; return null; }
  function addDrawing(obj) { obj.id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); normalizeDrawing(obj); drawings.push(obj); saveDrawings(); return obj; }
  function removeDrawing(id) { drawings = drawings.filter(d => d.id !== id); saveDrawings(); }

  // ===== Chọn công cụ trên thanh toolbar =====
  function updateDrawHint() { const el = document.getElementById('draw-hint'); if (!el) return; const t = HINT_TEXT[currentTool]; if (t) { el.textContent = t; el.style.display = 'block'; } else el.style.display = 'none'; }
  const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
      currentTool = btn.getAttribute('data-tool'); pendingPoints = []; previewPoint = null; selectedId = null; lastPolyClick = null;
      chartPrice.applyOptions({ crosshair: { mode: currentTool === 'cursor' ? LightweightCharts.CrosshairMode.Normal : LightweightCharts.CrosshairMode.Magnet } });
      document.getElementById('chart-price').style.cursor = currentTool === 'cursor' ? 'default' : 'crosshair';
      updateDrawHint();
    });
  });
  function resetToolAfterUse() { document.querySelector('.tool-btn[data-tool="cursor"]').click(); }

  // ===== Công tắc Nam châm / Khoá / Ẩn =====
  const toggleState = { magnet: () => magnetOn, lock: () => lockOn, hide: () => hiddenOn };
  document.querySelectorAll('.tool-toggle').forEach(btn => {
    const key = btn.getAttribute('data-toggle');
    btn.classList.toggle('toggle-on', toggleState[key]());
    btn.addEventListener('click', () => {
      if (key === 'magnet') { magnetOn = !magnetOn; localStorage.setItem('ok_draw_magnet', magnetOn); showDrawToast(magnetOn ? 'Đã bật Nam châm — điểm vẽ sẽ hút vào nến gần nhất' : 'Đã tắt Nam châm'); }
      if (key === 'lock') { lockOn = !lockOn; localStorage.setItem('ok_draw_lock', lockOn); showDrawToast(lockOn ? 'Đã khoá toàn bộ bản vẽ' : 'Đã mở khoá bản vẽ'); }
      if (key === 'hide') { hiddenOn = !hiddenOn; showDrawToast(hiddenOn ? 'Đã ẩn toàn bộ bản vẽ' : 'Đã hiện lại bản vẽ'); }
      btn.classList.toggle('toggle-on', toggleState[key]());
    });
  });

  // ===== Xử lý click / di chuột trên biểu đồ giá =====
  chartPrice.subscribeCrosshairMove(param => {
    if (!param || !param.point) { previewPoint = null; return; }
    const time = param.time !== undefined ? param.time : xToTime(param.point.x);
    const price = candleSeries.coordinateToPrice(param.point.y);
    previewPoint = (price == null || time == null) ? null : snapPoint(time, price);
    if (currentTool === 'cursor' && selectedId && !dragDrawing) {
      const d = getSelectedDrawing();
      const host = document.getElementById('chart-price');
      if (d && !isDrawLocked(d) && hitTestOne(d, param.point.x, param.point.y, HANDLE_TOL)) host.style.cursor = 'move';
      else host.style.cursor = 'default';
    }
  });
  chartPrice.subscribeClick(param => {
    if (!param || !param.point) return;
    const time = param.time !== undefined ? param.time : xToTime(param.point.x); if (time == null) return;
    const rawPrice = candleSeries.coordinateToPrice(param.point.y); if (rawPrice == null) return;
    const pt = snapPoint(time, rawPrice);

    if (currentTool === 'cursor') { const hit = hitTest(param.point.x, param.point.y); selectedId = hit ? hit.id : null; return; }
    if (currentTool === 'eraser') {
      const hit = hitTest(param.point.x, param.point.y);
      if (hit) { if (isDrawLocked(hit)) { showDrawToast('Bản vẽ đang bị khoá — mở khoá để xoá'); return; } removeDrawing(hit.id); }
      return;
    }
    if (currentTool === 'text') {
      const txt = window.prompt('Nội dung ghi chú:', '');
      if (txt && txt.trim()) addDrawing({ type: 'text', points: [pt], text: txt.trim().slice(0, 140), color: drawColor() });
      resetToolAfterUse(); return;
    }
    if (currentTool === 'polyline') {
      const now = Date.now();
      const isDouble = lastPolyClick && (now - lastPolyClick.t) < 400 && Math.hypot(param.point.x - lastPolyClick.x, param.point.y - lastPolyClick.y) < 14;
      lastPolyClick = { t: now, x: param.point.x, y: param.point.y };
      if (isDouble && pendingPoints.length >= 2) {
        addDrawing({ type: 'polyline', points: pendingPoints.slice(), color: drawColor() });
        pendingPoints = []; lastPolyClick = null; resetToolAfterUse(); return;
      }
      pendingPoints.push(pt); return;
    }

    pendingPoints.push(pt);
    const need = TOOL_POINTS[currentTool] || 2;
    if (pendingPoints.length >= need) {
      addDrawing({ type: currentTool, points: pendingPoints.slice(), color: drawColor() });
      pendingPoints = []; resetToolAfterUse();
    }
  });

  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') { pendingPoints = []; previewPoint = null; selectedId = null; lastPolyClick = null; document.querySelector('.tool-btn[data-tool="cursor"]').click(); }
    if (e.key === 'Enter' && currentTool === 'polyline' && pendingPoints.length >= 2) { addDrawing({ type: 'polyline', points: pendingPoints.slice(), color: drawColor() }); pendingPoints = []; resetToolAfterUse(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      const d = getSelectedDrawing();
      if (isDrawLocked(d)) { showDrawToast('Bản vẽ đang bị khoá — mở khoá để xoá'); return; }
      removeDrawing(selectedId); selectedId = null;
    }
    // Mũi tên: nhích bản vẽ đang chọn theo pixel màn hình (giữ Shift để nhích nhanh hơn) — giống TradingView
    if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const d = getSelectedDrawing(); if (!d || isDrawLocked(d)) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dxPx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dyPx = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      d.points = d.points.map(pt => {
        const p = xy(pt); if (!p) return pt;
        const tp = coordToTimePrice(p.x + dxPx, p.y + dyPx);
        return (tp.time == null || tp.price == null) ? pt : { time: tp.time, price: tp.price };
      });
      saveDrawings(); ensureDrawLoopRunning();
    }
    // Ctrl/Cmd+D: nhân bản bản vẽ đang chọn — giống phím tắt của TradingView
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedId) {
      e.preventDefault();
      const d = getSelectedDrawing(); if (!d) return;
      const clone = JSON.parse(JSON.stringify(d));
      delete clone.id; clone.locked = false;
      clone.points = (clone.points || []).map(p => ({ ...p, price: p.price ? p.price * 1.006 : p.price }));
      const added = addDrawing(clone); selectedId = added.id; ensureDrawLoopRunning();
    }
  });

  document.getElementById('clear-drawings').addEventListener('click', () => {
    if (lockOn) { showDrawToast('Đang khoá — mở khoá để xoá tất cả bản vẽ'); return; }
    if (!drawings.length) return;
    const lockedCount = drawings.filter(d => d.locked).length;
    if (lockedCount && !confirm(`Có ${lockedCount} bản vẽ đang bị khoá riêng sẽ được giữ lại. Xoá tất cả bản vẽ còn lại?`)) return;
    if (!lockedCount && !confirm('Xoá toàn bộ bản vẽ trên biểu đồ này?')) return;
    drawings = drawings.filter(d => d.locked); selectedId = null; saveDrawings();
  });

  // Cho phép updateChart() nạp lại đúng bộ bản vẽ khi đổi mã coin
  window.__drawSystemOnSymbolChange = function () { loadDrawings(); selectedId = null; pendingPoints = []; previewPoint = null; ensureDrawLoopRunning(); };

  // ===== Kéo-thả để DI CHUYỂN hoặc CHỈNH SỬA bản vẽ đã chọn (giống các sàn lớn) =====
  // Kéo vào thân bản vẽ -> di chuyển toàn bộ. Kéo vào 1 chấm neo -> chỉnh lại điểm đó. Bị khoá thì không kéo được.
  function coordToTimePrice(x, y) {
    return { time: xToTime(x), price: candleSeries.coordinateToPrice(y) };
  }
  let dragDrawing = null, dragPointIndex = -1, dragOriginalPoints = null, dragStartTP = null, dragStartXY = null, isDragging = false;
  const chartPriceEl = document.getElementById('chart-price');
  chartPriceEl.addEventListener('pointerdown', e => {
    if (e.target.closest('.draw-obj-toolbar')) return;
    if (currentTool !== 'cursor' || !selectedId) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const d = getSelectedDrawing(); if (!d || isDrawLocked(d)) return;
    const rect = chartPriceEl.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let idx = -1, bestDist = Infinity;
    (d.points || []).forEach((pt, i) => { const p = xy(pt); if (!p) return; const dist = Math.hypot(x - p.x, y - p.y); if (dist <= HANDLE_TOL && dist < bestDist) { bestDist = dist; idx = i; } });
    if (idx === -1 && !hitTestOne(d, x, y, HIT_TOL)) return;
    // Khoá pan/zoom NGAY khi vừa nhận diện được điểm/thân sẽ kéo (không đợi di chuyển đủ 3px) —
    // tránh tình trạng biểu đồ "giật" pan 1 chút trước khi vào chế độ kéo bản vẽ trên cảm ứng.
    chartPrice.applyOptions({ handleScroll: false, handleScale: false });
    e.preventDefault();
    dragDrawing = d; dragPointIndex = idx; dragOriginalPoints = d.points.map(p => ({ ...p }));
    dragStartTP = coordToTimePrice(x, y); dragStartXY = { x, y }; isDragging = false;
    try { chartPriceEl.setPointerCapture(e.pointerId); } catch (err) {}
  });
  chartPriceEl.addEventListener('pointermove', e => {
    if (!dragDrawing) return;
    const rect = chartPriceEl.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (!isDragging) {
      if (Math.hypot(x - dragStartXY.x, y - dragStartXY.y) < 3) return;
      isDragging = true;
      chartPrice.applyOptions({ handleScroll: false, handleScale: false });
      objToolbar.classList.remove('show');
    }
    const tp = coordToTimePrice(x, y); if (tp.time == null || tp.price == null) return;
    if (dragPointIndex >= 0) {
      dragDrawing.points[dragPointIndex] = snapPoint(tp.time, tp.price);
    } else {
      const timeDelta = tp.time - dragStartTP.time, priceDelta = tp.price - dragStartTP.price;
      dragDrawing.points = dragOriginalPoints.map(op => ({ time: op.time + timeDelta, price: op.price + priceDelta }));
    }
    e.preventDefault();
  });
  function endDrag(e) {
    if (dragDrawing) {
      if (isDragging) saveDrawings();
      chartPrice.applyOptions({ handleScroll: true, handleScale: true });
      try { if (e) chartPriceEl.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    dragDrawing = null; dragPointIndex = -1; isDragging = false;
  }
  chartPriceEl.addEventListener('pointerup', endDrag);
  chartPriceEl.addEventListener('pointercancel', endDrag);
  chartPriceEl.addEventListener('pointerleave', e => { if (dragDrawing && !isDragging) endDrag(e); });

  const tooltip = document.createElement('div');
  tooltip.style = `position: absolute; display: none; padding: 10px; box-sizing: border-box; font-size: 13px; color: #fff; background-color: rgba(23, 28, 39, 0.95); border: 1px solid #2d3342; border-radius: 8px; pointer-events: none; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-family: sans-serif;`;
  document.getElementById('chart-price').appendChild(tooltip);

  chartPrice.subscribeCrosshairMove(param => {
    if (isResizing) { tooltip.style.display = 'none'; return; }
    if (!param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0 || param.point.x > document.getElementById('chart-price').clientWidth || param.point.y > document.getElementById('chart-price').clientHeight) {
      clearAllCrosshairs(); tooltip.style.display = 'none'; updateAllLegendValues(); return;
    }
    syncCrosshairAcrossCharts('price', param.time);
    updateAllLegendValues(param.time);
    const volData = volumesDataMap.get(param.time);
    const c = candlesDataMap.get(param.time);
    if (!c) { tooltip.style.display = 'none'; return; }
    const isUp = c.close >= c.open; const color = isUp ? currentUpColor : currentDownColor;
    
    let html = `<div style="font-weight:700; margin-bottom: 8px; border-bottom: 1px solid #2d3342; padding-bottom:6px">${fmtTime(param.time)}</div>`;
    html += `<div style="display:flex; justify-content:space-between; width:140px; margin-bottom: 4px;"><span>Mở:</span> <span style="color:${color}">${fmt(c.open)}</span></div>`;
    html += `<div style="display:flex; justify-content:space-between; width:140px; margin-bottom: 4px;"><span>Cao:</span> <span style="color:${color}">${fmt(c.high)}</span></div>`;
    html += `<div style="display:flex; justify-content:space-between; width:140px; margin-bottom: 4px;"><span>Thấp:</span> <span style="color:${color}">${fmt(c.low)}</span></div>`;
    html += `<div style="display:flex; justify-content:space-between; width:140px; margin-bottom: 4px;"><span>Đóng:</span> <span style="color:${color}; font-weight:bold">${fmt(c.close)}</span></div>`;
    if(volData) html += `<div style="display:flex; justify-content:space-between; width:140px; margin-top:6px;"><span>Vol:</span> <span>${fmtVol(volData.value)}</span></div>`;
    
    if (aiEnabled) {
        const sigList = signalsMap.get(param.time);
        if (sigList && sigList.length) {
           sigList.forEach(signal => {
             html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed ${signal.color};">`;
             html += `<div style="display:inline-block; font-size:9.5px; font-weight:700; letter-spacing:0.5px; color:#0a0d13; background:${signal.color}; padding:1px 6px; border-radius:4px; margin-bottom:4px;">${signalCategoryLabel(signal)}</div>`;
             html += `<div style="color:${signal.color}; font-weight:bold; font-size: 13px; display:flex; align-items:center;">${icon(signalIconName(signal), 'ico-inline')}${signal.label}</div>`;
             html += `<div style="color:#a9b1c2; font-size:11.5px; margin-top:4px; max-width: 240px; white-space: normal; line-height: 1.45; font-family:'JetBrains Mono', monospace;">`;
             if (signal.entry) {
                html += `<span style="color:var(--up)">${icon('dot','ico-inline')}Entry: ${fmt(signal.entry)}</span><br>`;
                html += `<span style="color:var(--gold)">${icon('dot','ico-inline')}Target: ${fmt(signal.target)}</span><br>`;
                html += `<span style="color:var(--down)">${icon('dot','ico-inline')}SL(Động): ${fmt(signal.sl)}</span><br>`;
             }
             html += `<div style="margin-top:6px; color:#8b93a7; font-family:'Inter', sans-serif; font-weight:500; font-size:11px; line-height:1.55; display:flex; gap:5px; align-items:flex-start;">${icon('pin', 'ico-inline')}<span>${getProNote(signal)}</span></div>`;
             html += `</div></div>`;
           });
        }
    }
    tooltip.innerHTML = html; tooltip.style.display = 'block';
    const chartEl = document.getElementById('chart-price');
    let x = param.point.x; let y = param.point.y;
    const tooltipW = tooltip.offsetWidth || 160; const tooltipH = tooltip.offsetHeight || 120;
    const chartW = chartEl.clientWidth; const chartH = chartEl.clientHeight;
    // Căn trái/phải và trên/dưới theo mép chart để tooltip không bao giờ bị cắt/tràn ra ngoài
    if (x + tooltipW + 20 > chartW) { x = x - tooltipW - 15; } else { x = x + 15; }
    x = Math.max(4, Math.min(x, chartW - tooltipW - 4));
    let top = y + 15;
    if (top + tooltipH + 10 > chartH) { top = y - tooltipH - 15; }
    top = Math.max(4, Math.min(top, chartH - tooltipH - 4));
    tooltip.style.left = x + 'px'; tooltip.style.top = top + 'px';
  });

  attachCrosshairSync(chartVolume, 'volume');
  attachCrosshairSync(chartRSI, 'rsi');

  function renderWhaleLogs() {
    const list = document.getElementById('whale-log-list'); list.innerHTML = '';
    // Chỉ hiển thị nhật ký của đúng coin đang xem — dữ liệu các coin khác vẫn được ghi nhận
    // ở nền (xem startMarketWhaleWatcher) nhưng không hiện ra cho tới khi người dùng chuyển sang coin đó.
    const coinLogs = whaleLogs.filter(log => log.symbol === currentSymbol);
    if (coinLogs.length === 0) { list.innerHTML = `<div class="ai-empty">Chưa có dữ liệu cá mập cho ${currentSymbol.replace('USDT','')}...</div>`; return; }
    const recent = coinLogs.slice().reverse();
    recent.forEach(log => {
      const row = document.createElement('div'); row.className = 'signal-row';
      const tone = log.isBuy ? 'up' : 'down'; const label = log.isBuy ? 'CÁ MẬP MUA' : 'CÁ MẬP BÁN';
      row.innerHTML = `<div style="display:flex; flex:1; padding-right: 10px;"><div class="signal-badge ${tone}">${label}</div><div class="signal-body" style="flex:1;"><div class="signal-meta"><span class="signal-time">${new Date(log.time).toLocaleTimeString('vi-VN')}</span><span class="signal-price" style="color:var(--${tone}); font-weight:700">${fmtVol(log.usd)} USDT</span></div><div class="signal-desc">Coin: <b>${log.symbol}</b> ở mức giá <b>${fmt(log.price)}</b></div></div></div><div style="display:flex; align-items:center;"><button class="btn-delete-item" onclick="deleteSingleLog(${log.time}, true)" title="Xóa">${icon('x')}</button></div>`;
      list.appendChild(row);
    });
  }
  renderWhaleLogs();

  function showWhaleAlert(isBuy, usdAmount, price, symbol) {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    toast.className = `whale-toast ${isBuy ? 'buy' : 'sell'}`;
    toast.innerHTML = `<div class="whale-icon">${isBuy ? icon('whale') + icon('trendUp') : icon('whale') + icon('trendDown')}</div><div class="whale-content"><div class="whale-title">${isBuy ? 'CÁ MẬP MUA' : 'CÁ MẬP BÁN'}</div><div class="whale-desc">${fmtVol(usdAmount)} USDT ở giá ${fmt(price)}</div><div class="whale-time">${new Date().toLocaleTimeString('vi-VN')}</div></div>`;
    container.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 6000);
    whaleLogs.push({ time: Date.now(), isBuy, usd: usdAmount, price, symbol });
    if (whaleLogs.length > MAX_WHALE_LOGS) whaleLogs.shift();
    localStorage.setItem('ok_whale_logs', JSON.stringify(whaleLogs)); renderWhaleLogs();
  }

  // ==========================================
  // GIÁM SÁT NỀN CÁ MẬP TOÀN THỊ TRƯỜNG
  // Coin đang xem trên biểu đồ đã có kết nối riêng (whaleWS trong updateChart) để hiện toast + gauge.
  // Kết nối multiplex dưới đây gộp aggTrade của TẤT CẢ cặp USDT trên Binance vào 1 socket duy nhất,
  // chạy độc lập, không phụ thuộc coin đang xem — để nhật ký cá mập của các coin KHÔNG được xem
  // vẫn tiếp tục được cập nhật âm thầm (không toast, không cần vẽ lại UI) và sẵn sàng hiện ra
  // ngay khi người dùng chuyển sang xem đúng coin đó.
  // ==========================================
  let marketWhaleWS = null;
  let marketWhaleReconnectTimeout = null;
  const MARKET_WHALE_STREAM_CAP = 1000; // Binance giới hạn tối đa 1024 stream / 1 kết nối multiplex
  // localStorage.setItem là thao tác ĐỒNG BỘ (chặn luồng chính). Khi thị trường biến động mạnh,
  // hàng trăm coin có thể sinh lệnh cá mập dồn dập trong 1 giây -> nếu ghi localStorage ngay mỗi
  // lệnh sẽ gây giật rõ rệt. Gộp lại, chỉ ghi ổ đĩa tối đa 1 lần / 2 giây.
  let whaleLogPersistPending = false;
  function persistWhaleLogsThrottled() {
    if (whaleLogPersistPending) return;
    whaleLogPersistPending = true;
    setTimeout(() => { whaleLogPersistPending = false; try { localStorage.setItem('ok_whale_logs', JSON.stringify(whaleLogs)); } catch (e) {} }, 2000);
  }

  function startMarketWhaleWatcher() {
    if (!allMarketSymbols.length) return; // Chờ tải xong danh sách toàn bộ coin USDT trên Binance
    if (marketWhaleWS) { marketWhaleWS.onclose = null; marketWhaleWS.close(); }
    const streams = allMarketSymbols.slice(0, MARKET_WHALE_STREAM_CAP).map(s => s.symbol.toLowerCase() + '@aggTrade').join('/');
    marketWhaleWS = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    marketWhaleWS.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const d = msg && msg.data; if (!d || !d.s) return;
        const symbol = d.s;
        // Coin đang xem đã được ghi nhận (kèm toast + gauge) qua kết nối riêng trong updateChart(),
        // bỏ qua ở đây để tránh ghi trùng lệnh 2 lần.
        if (symbol === currentSymbol) return;
        const p = parseFloat(d.p); const q = parseFloat(d.q); const isBuy = !d.m; const usd = p * q;
        const dynamicThreshold = getWhaleThreshold(symbol);
        if (usd >= dynamicThreshold) {
          whaleLogs.push({ time: Date.now(), isBuy, usd, price: p, symbol });
          if (whaleLogs.length > MAX_WHALE_LOGS) whaleLogs.shift();
          persistWhaleLogsThrottled();
          // Không hiện toast và không vẽ lại danh sách ở đây vì coin này không đang được xem —
          // tránh giật máy/spam. Danh sách sẽ tự hiện đúng dữ liệu ngay khi đổi sang coin đó (xem updateChart).
        }
      } catch (e) { /* Bỏ qua gói tin lỗi định dạng */ }
    };
    marketWhaleWS.onerror = handleMarketWhaleDisconnect;
    marketWhaleWS.onclose = handleMarketWhaleDisconnect;
  }
  function handleMarketWhaleDisconnect() {
    if (marketWhaleReconnectTimeout) return;
    console.warn("Mất kết nối giám sát cá mập toàn thị trường. Kết nối lại sau 5s...");
    marketWhaleReconnectTimeout = setTimeout(() => { marketWhaleReconnectTimeout = null; startMarketWhaleWatcher(); }, 5000);
  }

  function computeSMA(values, period) { let sma = new Array(values.length).fill(0); let sum = 0; for(let i=0; i<values.length; i++) { sum += values[i]; if(i >= period) sum -= values[i - period]; if(i >= period - 1) sma[i] = sum / period; } return sma; }
  function computeEMA(values, period){ const k = 2 / (period + 1); const out = new Array(values.length); out[0] = values[0]; for (let i = 1; i < values.length; i++) out[i] = values[i] * k + out[i - 1] * (1 - k); return out; }
  function computeRSI(values, period = 14) { let rsi = new Array(values.length).fill(50); if (values.length <= period) return rsi; let gains = 0, losses = 0; for (let i = 1; i <= period; i++) { let diff = values[i] - values[i - 1]; if (diff > 0) gains += diff; else losses -= diff; } let avgGain = gains / period; let avgLoss = losses / period; rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)); for (let i = period + 1; i < values.length; i++) { let diff = values[i] - values[i - 1]; let gain = diff > 0 ? diff : 0; let loss = diff < 0 ? -diff : 0; avgGain = (avgGain * (period - 1) + gain) / period; avgLoss = (avgLoss * (period - 1) + loss) / period; rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)); } return rsi; }
  // ATR (Average True Range) — đo biến động thực tế để SL/Target co giãn theo thị trường thay vì cố định
  function computeATR(candles, period = 14) {
    const n = candles.length; const tr = new Array(n).fill(0); const atr = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      if (i === 0) { tr[i] = candles[i].high - candles[i].low; continue; }
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr[i] = Math.max(hl, hc, lc);
    }
    atr[0] = tr[0];
    for (let i = 1; i < n; i++) {
      if (i < period) { let sum = 0; for (let j = 0; j <= i; j++) sum += tr[j]; atr[i] = sum / (i + 1); }
      else atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
    }
    return atr;
  }
  function emaSlopeSignal(emaArr, lookback){ const n = emaArr.length; if (n <= lookback) return 0; const diff = (emaArr[n - 1] - emaArr[n - 1 - lookback]) / emaArr[n - 1 - lookback]; if (diff > 0.001) return 1; if (diff < -0.001) return -1; return 0; }
  function findSwings(candles, left, right){ const highs = [], lows = []; for (let i = left; i < candles.length - right; i++){ let isHigh = true, isLow = true; for (let j = i - left; j <= i + right; j++){ if (j === i) continue; if (candles[j].high >= candles[i].high) isHigh = false; if (candles[j].low <= candles[i].low) isLow = false; } if (isHigh) highs.push(candles[i].high); if (isLow) lows.push(candles[i].low); } return { highs, lows }; }
  function structureSignal(candles, windowSize, left, right){ const slice = candles.slice(Math.max(0, candles.length - windowSize)); if (slice.length < left + right + 4) return 0; const { highs, lows } = findSwings(slice, left, right); if (highs.length < 2 || lows.length < 2) return 0; const hh = highs[highs.length - 1] > highs[highs.length - 2]; const hl = lows[lows.length - 1] > lows[lows.length - 2]; const lh = highs[highs.length - 1] < highs[highs.length - 2]; const ll = lows[lows.length - 1] < lows[lows.length - 2]; if (hh && hl) return 1; if (lh && ll) return -1; return 0; }
  function computeHorizonTrend(candles, fastP, slowP, slopeLookback, structWindow, fracL, fracR){ if (candles.length < slowP + 5) return { trend: 0, emaSig: 0, structSig: 0, insufficient: true }; const closes = candles.map(c => c.close); const emaFast = computeEMA(closes, fastP); const emaSlow = computeEMA(closes, slowP); const lastClose = closes[closes.length - 1]; const lastFast = emaFast[emaFast.length - 1]; const lastSlow = emaSlow[emaSlow.length - 1]; const slope = emaSlopeSignal(emaFast, slopeLookback); let emaSig = 0; if (lastFast > lastSlow && lastClose > lastFast && slope >= 0) emaSig = 1; else if (lastFast < lastSlow && lastClose < lastFast && slope <= 0) emaSig = -1; const structSig = structureSignal(candles, structWindow, fracL, fracR); let trend = 0; if (emaSig === 1 && structSig === 1) trend = 1; else if (emaSig === -1 && structSig === -1) trend = -1; else if (emaSig !== 0 && structSig === 0) trend = emaSig * 0.5; else trend = 0; return { trend, emaSig, structSig, insufficient: false }; }
  function renderTrendCard(elId, result, horizonName){ const card = document.getElementById(elId); card.className = "trend-card"; if (result.insufficient){ card.classList.add('side'); card.querySelector('.trend-arrow').innerText = '—'; card.querySelector('.trend-label').innerText = 'Chưa đủ dữ liệu'; card.querySelector('.trend-desc').innerHTML = 'Cần thêm dữ liệu lịch sử.'; return; } const agree = result.emaSig !== 0 && result.emaSig === result.structSig; let cls, arrowIcon, label, reason; if (result.trend === 1){ cls = 'up'; arrowIcon = 'trendUp'; label = 'TĂNG'; reason = agree ? `Đồng thuận cấu trúc & EMA.` : `Chỉ EMA tăng.`; } else if (result.trend === -1){ cls = 'down'; arrowIcon = 'trendDown'; label = 'GIẢM'; reason = agree ? `Đồng thuận cấu trúc & EMA.` : `Chỉ EMA giảm.`; } else { cls = 'side'; arrowIcon = 'trendFlat'; label = 'ĐI NGANG'; reason = 'Tín hiệu giằng co, chưa rõ ràng.'; } card.classList.add(cls); card.querySelector('.trend-arrow').innerHTML = icon(arrowIcon); card.querySelector('.trend-label').innerText = label; card.querySelector('.trend-desc').innerHTML = reason + (agree ? '<span class="trend-confirm agree">Đồng thuận</span>' : ''); }
  function runTrendAnalysis(){ if (candlesData.length < 30) return; renderTrendCard('trend-short', computeHorizonTrend(candlesData, 9, 21, 5, 40, 2, 2), 'Ngắn hạn'); renderTrendCard('trend-medium', computeHorizonTrend(candlesData, 21, 50, 10, 120, 3, 3), 'Trung hạn'); renderTrendCard('trend-long', computeHorizonTrend(candlesData, 50, 200, 20, candlesData.length, 5, 5), 'Dài hạn'); }

  // =========================================================
  // ĐỘNG CƠ AI ĐÃ FIX: TRẢ LẠI HIỂN THỊ VOL SPIKE & CLIMAX
  // =========================================================
  // Ghi chú chuyên nghiệp chi tiết cho từng loại tín hiệu — hiện khi di chuột vào chỉ báo
  function getProNote(s) {
    switch (s.type) {
      case 'trend_long':
        return `Chiến lược thuận xu hướng LONG: giá phá lên EMA21 trong uptrend đã xác nhận đa khung (EMA9/21, 21/50, 50/200). Khuyến nghị: rủi ro tối đa 1-2% vốn/lệnh, tuân thủ SL nghiêm ngặt, có thể chốt lời 1 phần tại Target rồi dời SL về hòa vốn để bảo toàn lợi nhuận.`;
      case 'trend_short':
        return `Chiến lược thuận xu hướng SHORT: giá gãy xuống EMA21 trong downtrend đã xác nhận đa khung (EMA9/21, 21/50, 50/200). Khuyến nghị: rủi ro tối đa 1-2% vốn/lệnh, tuân thủ SL nghiêm ngặt, có thể chốt lời 1 phần tại Target rồi dời SL về hòa vốn để bảo toàn lợi nhuận.`;
      case 'climax_buy':
        return `Buying Climax: khối lượng đột biến kèm bấc nến trên dài sau một nhịp tăng — dấu hiệu bên mua đuối sức, dòng tiền lớn có thể đang chốt lời/phân phối. Nên thận trọng khi mở Long mới, cân nhắc chốt lời một phần vị thế Long đang nắm giữ, tránh mua đuổi (FOMO).`;
      case 'climax_sell':
        return `Selling Climax: khối lượng đột biến kèm bấc nến dưới dài sau một nhịp giảm — dấu hiệu bên bán đuối sức, có thể xuất hiện lực bắt đáy. Nên thận trọng khi mở Short mới, cân nhắc chốt lời một phần vị thế Short đang nắm giữ, tránh bán đuổi theo cảm xúc.`;
      case 'vol_spike':
        return `Khối lượng vượt trội xác nhận lực ${s.tone === 'up' ? 'mua' : 'bán'} đang chiếm ưu thế tại vùng giá này — có thể là khởi đầu một nhịp đẩy giá ngắn hạn, nhưng chưa đủ điều kiện xác nhận xu hướng để vào lệnh mới theo hệ thống.`;
      case 'fng_block':
        return `AI đã hủy tín hiệu vì tâm lý đám đông (tỉ lệ Long/Short Binance) đang lệch cực đoan — vào lệnh ngược dòng đám đông lúc này có xác suất thua cao hơn bình thường.`;
      default:
        return s.desc || '';
    }
  }

  function runAIAnalysis(){
    updateAllIndicators();
    const liveStatusEl = document.getElementById('ai-live-status');
    if (liveStatusEl) liveStatusEl.innerHTML = isLiveSignalPreview ? '<span class="live-dot" style="display:inline-block; margin-right:4px; vertical-align:middle;"></span>LIVE · nến chưa đóng, tín hiệu có thể đổi' : icon('checkCircle', 'ico-inline') + ' Đã xác nhận nến đóng';
    runTrendAnalysis(); signalsMap.clear();
    const aiList = document.getElementById('ai-signal-list');
    if(!aiEnabled){ candleSeriesMarkers.setMarkers([]); aiList.innerHTML='<div class="ai-empty">AI Đang tắt. Bật công tắc để phân tích.</div>'; return;}
    if(candlesData.length < 200) { aiList.innerHTML='<div class="ai-empty">Vui lòng chờ tải đủ 200 nến dữ liệu lịch sử...</div>'; return; }
    
    const closes = candlesData.map(c => c.close);
    const vols = volumesData.map(v => v.value);
    
    const ema9 = computeEMA(closes, 9);
    const ema21 = computeEMA(closes, 21);
    const ema50 = computeEMA(closes, 50);
    const ema200 = computeEMA(closes, 200);
    const rsi14 = computeRSI(closes, 14);
    const volSma = computeSMA(vols, 20);
    const atr14 = computeATR(candlesData, 14);
    const avgAtr = computeSMA(atr14, 50);

    const signals = [];
    function addSignal(sig) { signals.push(sig); if (!signalsMap.has(sig.time)) signalsMap.set(sig.time, []); signalsMap.get(sig.time).push(sig); }
    function signalIconName(s) {
      if (s.type === 'trend_long') return 'trendUp';
      if (s.type === 'trend_short') return 'trendDown';
      if (s.type === 'climax_buy' || s.type === 'climax_sell') return 'alertTriangle';
      if (s.type === 'fng_block') return 'shield';
      return 'target';
    }
    // Phân loại chú thích: AI TÍN HIỆU (khuyến nghị vào lệnh / lọc lệnh theo tâm lý) vs WYCKOFF (climax & volume bất thường)
    function signalCategoryLabel(s) {
      if (s.type === 'climax_buy' || s.type === 'climax_sell' || s.type === 'vol_spike') return 'WYCKOFF';
      return 'AI TÍN HIỆU';
    }
    let lastLongIdx = -9999, lastShortIdx = -9999; const cooldownBars = 10;
    
    for (let i = 200; i < candlesData.length; i++) {
      const c = candlesData[i]; const prevC = candlesData[i-1]; const v = vols[i]; const currRsi = rsi14[i];
      let isLongEntry = false; let isShortEntry = false; let isClimax = false;

      // 1. TÍN HIỆU THUẬN XU HƯỚNG — yêu cầu đồng thuận đa khung (EMA9/21, 21/50, 50/200)
      const shortSig = ema9[i] > ema21[i] ? 1 : -1;
      const mediumSig = ema21[i] > ema50[i] ? 1 : -1;
      const longSig = ema50[i] > ema200[i] ? 1 : -1;
      const confluence = shortSig + mediumSig + longSig; // -3..+3, càng lớn càng đồng thuận nhiều khung

      const isUptrend = ema50[i] > ema200[i] && c.close > ema200[i] && confluence >= 2;
      const isDowntrend = ema50[i] < ema200[i] && c.close < ema200[i] && confluence <= -2;
      if (isUptrend && prevC.close < ema21[i-1] && c.close > ema21[i] && c.close > c.open && currRsi > 50 && currRsi < 75 && (i - lastLongIdx) >= cooldownBars) isLongEntry = true;
      if (isDowntrend && prevC.close > ema21[i-1] && c.close < ema21[i] && c.close < c.open && currRsi < 50 && currRsi > 25 && (i - lastShortIdx) >= cooldownBars) isShortEntry = true;

      // Bỏ qua tín hiệu khi thị trường quá "chết" (biến động thấp hơn 60% trung bình) — tránh entry vô nghĩa trong sideway hẹp
      if (avgAtr[i] > 0 && atr14[i] < avgAtr[i] * 0.6) { isLongEntry = false; isShortEntry = false; }

      let isFilteredBySentiment = false; let filterReason = "";
      if (i === candlesData.length - 1 && typeof binanceLSRatio !== 'undefined') {
        if (isLongEntry && binanceLSRatio > 2.5) { isLongEntry = false; isFilteredBySentiment = true; filterReason = `HỦY LONG: Đám đông FOMO (L/S: ${binanceLSRatio.toFixed(2)}).`; }
        if (isShortEntry && binanceLSRatio < 0.8) { isShortEntry = false; isFilteredBySentiment = true; filterReason = `HỦY SHORT: Đám đông hoảng loạn (L/S: ${binanceLSRatio.toFixed(2)}).`; }
      }

      // R:R thưởng cho tín hiệu đồng thuận toàn bộ 3 khung (2.2) so với đồng thuận 2/3 khung (1.6)
      const rr = Math.abs(confluence) === 3 ? 2.2 : 1.6;
      const confidenceLabel = Math.abs(confluence) === 3 ? 'Rất mạnh (3/3 khung)' : 'Mạnh (2/3 khung)';
      // Khoảng cách SL dựa trên ATR (biến động thực tế), có sàn tối thiểu 0.4% giá để tránh SL quá sát
      const stopDistance = Math.max(atr14[i] * 1.3, c.close * 0.004);

      if (isLongEntry) {
        lastLongIdx = i;
        const stopLoss = c.close - stopDistance;
        const targetPrice = c.close + stopDistance * rr;
        addSignal({ time: c.time, type: 'trend_long', label: 'MUA - LONG', tone: 'up', price: c.close, entry: c.close, target: targetPrice, sl: stopLoss, desc: `Đồng thuận đa khung: ${confidenceLabel}. R:R 1:${rr}. Giá điều chỉnh về hỗ trợ và bật nảy.`, color: currentUpColor });
      } else if (isShortEntry) {
        lastShortIdx = i;
        const stopLoss = c.close + stopDistance;
        const targetPrice = c.close - stopDistance * rr;
        addSignal({ time: c.time, type: 'trend_short', label: 'BÁN - SHORT', tone: 'down', price: c.close, entry: c.close, target: targetPrice, sl: stopLoss, desc: `Đồng thuận đa khung: ${confidenceLabel}. R:R 1:${rr}. Giá gãy hỗ trợ.`, color: currentDownColor });
      }

      // 2. KHÔI PHỤC TÍN HIỆU VOLUME ĐỘT BIẾN / CLIMAX
      const avgVol = volSma[i];
      if (v > avgVol * aiVolMult) {
        const body = Math.abs(c.close - c.open);
        const upperWick = c.high - Math.max(c.open, c.close);
        const lowerWick = Math.min(c.open, c.close) - c.low;
        
        if (c.close > c.open && upperWick > body * 1.5) {
           addSignal({ time: c.time, type: 'climax_buy', label: 'BUYING CLIMAX', tone: 'warn', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)}. Bị xả mạnh.`, color: '#ffc93c' });
        } else if (c.close < c.open && lowerWick > body * 1.5) {
           addSignal({ time: c.time, type: 'climax_sell', label: 'SELLING CLIMAX', tone: 'warn', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)}. Lực bắt đáy mạnh.`, color: '#ffc93c' });
        } else if (c.close > c.open && !isLongEntry) {
           // Vẽ lại chấm tròn cho Volume Bùng nổ (Mua)
           addSignal({ time: c.time, type: 'vol_spike', label: 'BÙNG NỔ MUA', tone: 'up', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)} lần trung bình.`, color: currentUpColor });
        } else if (c.close < c.open && !isShortEntry) {
           // Vẽ lại chấm tròn cho Volume Bùng nổ (Bán)
           addSignal({ time: c.time, type: 'vol_spike', label: 'XẢ HÀNG MẠNH', tone: 'down', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)} lần trung bình.`, color: currentDownColor });
        }
      }

      if (isFilteredBySentiment) { addSignal({ time: c.time, type: 'fng_block', label: 'AI CHẶN LỆNH', tone: 'warn', price: c.close, desc: filterReason, color: '#6b7280' }); }
    }
    
    const visibleSignals = signals.filter(s => s.time >= aiIgnoreBeforeTime && !deletedLogTimes.has(s.time));

    // Chú thích cho mỗi cây nến có sự kiện: LONG/SHORT (AI tín hiệu), B.CLX/S.CLX + VOL+/VOL- (Wyckoff), CHẶN (AI lọc lệnh theo tâm lý)
    const markers = [];
    visibleSignals.forEach(s => {
      if (s.type === 'trend_long') markers.push({ time: s.time, position: 'belowBar', color: s.color, shape: 'arrowUp', text: 'LONG' });
      else if (s.type === 'trend_short') markers.push({ time: s.time, position: 'aboveBar', color: s.color, shape: 'arrowDown', text: 'SHORT' });
      else if (s.type === 'fng_block') markers.push({ time: s.time, position: 'aboveBar', color: s.color, shape: 'square', text: 'CHẶN' });
      else if (s.type === 'climax_buy') markers.push({ time: s.time, position: 'aboveBar', color: '#ffc93c', shape: 'arrowDown', text: 'B.CLX' });
      else if (s.type === 'climax_sell') markers.push({ time: s.time, position: 'belowBar', color: '#ffc93c', shape: 'arrowUp', text: 'S.CLX' });
      else if (s.type === 'vol_spike') markers.push({ time: s.time, position: (s.tone === 'up' ? 'belowBar' : 'aboveBar'), color: s.color, shape: 'circle', text: (s.tone === 'up' ? 'VOL+' : 'VOL-') });
    });
    markers.sort((a,b) => a.time - b.time);
    candleSeriesMarkers.setMarkers(markers);
    
    aiList.innerHTML = '';
    if (visibleSignals.length === 0){ aiList.innerHTML = '<div class="ai-empty">Chưa có dữ liệu hoặc đã được dọn sạch sẽ...</div>'; return; }
    
    visibleSignals.slice(-15).reverse().forEach(s => {
      const row = document.createElement('div'); row.className = 'signal-row';
      const proNoteHtml = `<div class="signal-desc" style="color:#8b93a7; font-size:11px; margin-top:5px; line-height:1.5; display:flex; gap:5px; align-items:flex-start;">${icon('pin', 'ico-inline')}<span>${getProNote(s)}</span></div>`;
      let descHtml = s.entry 
        ? `<div class="signal-desc" style="margin-top:5px; font-family:'JetBrains Mono', monospace; font-size:12px; font-weight:600;"><span style="color:var(--up)">${icon('dot','ico-inline')}Entry: ${fmt(s.entry)}</span> | <span style="color:var(--gold)">${icon('dot','ico-inline')}Target: ${fmt(s.target)}</span> | <span style="color:var(--down)">${icon('dot','ico-inline')}SL: ${fmt(s.sl)}</span></div><div class="signal-desc" style="color:var(--text-dim); font-size:11.5px; margin-top:3px;">${s.desc}</div>${proNoteHtml}` 
        : `<div class="signal-desc" style="color:var(--text-dim); font-size:12.5px; margin-top:5px;">${s.desc}</div>${proNoteHtml}`;

      row.innerHTML = `<div style="display:flex; flex:1; padding-right: 10px;"><div class="signal-badge ${s.tone}">${icon(signalIconName(s))}${s.label}</div><div class="signal-body" style="flex:1;"><div class="signal-meta"><span class="signal-time">${fmtTime(s.time)}</span><span class="signal-price" style="font-weight:700;">${s.entry ? 'Vùng:' : 'Giá:'} ${fmt(s.price)} USDT</span></div>${descHtml}</div></div><div style="display:flex; align-items:center;"><button class="btn-delete-item" onclick="deleteSingleLog(${s.time})" title="Xóa">${icon('x')}</button></div>`;
      aiList.appendChild(row);
    });
  }

  // ==========================================
  // 5. MAIN DATA LOOP & NETWORK DISCONNECT
  // ==========================================
  function fetchSyncData() {
    fetch(`https://api.binance.com/api/v3/klines?symbol=${currentSymbol}&interval=${currentInterval}&limit=1000`)
      .then(r => r.json())
      .then(data => {
        const parsedCandles = []; const parsedVolumes = []; candlesDataMap.clear(); volumesDataMap.clear();
        data.forEach(d => {
          const time = d[0]/1000; const open = parseFloat(d[1]); const high = parseFloat(d[2]); const low = parseFloat(d[3]); const close = parseFloat(d[4]); const volume = parseFloat(d[5]);
          const cData = { time, open, high, low, close };
          const vData = { time, value: volume, color: close >= open ? currentUpColor+'59' : currentDownColor+'59' };
          parsedCandles.push(cData); parsedVolumes.push(vData); candlesDataMap.set(time, cData); volumesDataMap.set(time, vData);
        });
        candleSeries.setData(parsedCandles); volumeSeries.setData(parsedVolumes); applyDynamicPricePrecision(true); syncPriceScaleWidths();
        candlesData = parsedCandles; volumesData = parsedVolumes;
        // Ép tính lại RSI/EMA/MACD... NGAY khi vừa đồng bộ lại toàn bộ nến — nếu không, các pane chỉ báo
        // (RSI, MACD...) sẽ giữ dữ liệu cũ cho tới tick websocket kế tiếp mới cập nhật, khiến đường RSI
        // hiển thị "ngắn hơn" / lệch so với Nến và Volume (vốn đã có dữ liệu mới ngay lập tức ở trên).
        updateAllIndicators();
        isLiveSignalPreview = false; runAIAnalysis();
        const upd = document.getElementById('stat-updated'); if (upd) upd.innerText = new Date().toLocaleTimeString('vi-VN');
      }).catch(err => console.log("Lỗi đồng bộ dữ liệu API:", err));
  }

  function updateChart() {
    priceElement.innerText = "Đang tải..."; titleElement.innerHTML = `${currentSymbol} <span class="quote">${currentInterval}</span>`;
    if (currentWebSocket) { currentWebSocket.onclose = null; currentWebSocket.close(); } 
    if (currentTickerWS) { currentTickerWS.onclose = null; currentTickerWS.close(); } 
    if (whaleWS) { whaleWS.onclose = null; whaleWS.close(); }
    if (reconnectTimeout) clearTimeout(reconnectTimeout); if (syncInterval) clearInterval(syncInterval);
    if (typeof window.__drawSystemOnSymbolChange === 'function') window.__drawSystemOnSymbolChange();
    // Đổi coin -> lọc lại nhật ký cá mập để chỉ hiện đúng dữ liệu của coin vừa chọn ngay lập tức
    // (dữ liệu của các coin khác vẫn được giữ nguyên, đang được ghi nhận ở nền).
    if (typeof renderWhaleLogs === 'function') renderWhaleLogs();

    fetchSyncData(); syncInterval = setInterval(fetchSyncData, 45 * 1000); fetchBinanceSentiment(currentSymbol);

    function initWebSockets() {
      currentTickerWS = new WebSocket(`wss://stream.binance.com:9443/ws/${currentSymbol.toLowerCase()}@ticker`);
      currentTickerWS.onmessage = e => {
        const t = JSON.parse(e.data); const changePct = parseFloat(t.P); const isUp = changePct >= 0;
        changeBadge.innerText = (isUp ? '+' : '') + changePct.toFixed(2) + '%'; changeBadge.className = "change-badge num " + (isUp ? "up" : "down");
        document.getElementById('stat-high').innerText = fmt(parseFloat(t.h)); document.getElementById('stat-low').innerText = fmt(parseFloat(t.l)); document.getElementById('stat-vol').innerText = fmtVol(parseFloat(t.q)) + " USDT";
      };

      currentWebSocket = new WebSocket(`wss://stream.binance.com:9443/ws/${currentSymbol.toLowerCase()}@kline_${currentInterval}`);
      currentWebSocket.onmessage = function (event) {
        const kline = JSON.parse(event.data).k; const time = kline.t / 1000;
        const liveCandle = { time, open: parseFloat(kline.o), high: parseFloat(kline.h), low: parseFloat(kline.l), close: parseFloat(kline.c) };
        const isLiveUp = liveCandle.close >= liveCandle.open;
        const liveVolume = { time, value: parseFloat(kline.v), color: isLiveUp ? currentUpColor+'59' : currentDownColor+'59' };
        candleSeries.update(liveCandle); volumeSeries.update(liveVolume); priceElement.innerText = fmt(liveCandle.close) + " USDT"; priceElement.className = "price-main num " + (isLiveUp ? "up" : "down");
        applyDynamicPricePrecision();
        syncPriceScaleWidths();
        candlesDataMap.set(time, liveCandle); volumesDataMap.set(time, liveVolume);
        const lastIdx = candlesData.length - 1;
        if (lastIdx >= 0 && candlesData[lastIdx].time === time){ candlesData[lastIdx] = liveCandle; volumesData[lastIdx] = liveVolume; } 
        else { candlesData.push(liveCandle); volumesData.push(liveVolume); }
        // Tính lại chỉ báo tối đa mỗi 400ms khi nến đang chạy (throttle) — nến vừa đóng thì luôn tính đủ ngay lập tức.
        // Trước đây gọi lại TOÀN BỘ chỉ báo trên TOÀN BỘ lịch sử nến mỗi khi có 1 tick giá (nhiều lần/giây) —
        // đây là nguyên nhân chính gây giật/lag, đặc biệt trên điện thoại có CPU yếu hơn máy tính.
        const nowTs = Date.now();
        if (kline.x === true || nowTs - lastIndicatorUpdateTs > 400) {
          lastIndicatorUpdateTs = nowTs;
          updateAllIndicators();
        }
        const upd = document.getElementById('stat-updated'); if (upd) upd.innerText = new Date().toLocaleTimeString('vi-VN');
        if (kline.x === true) { isLiveSignalPreview = false; runAIAnalysis(); } else { scheduleLiveAIAnalysis(); }
      };
      
      whaleWS = new WebSocket(`wss://stream.binance.com:9443/ws/${currentSymbol.toLowerCase()}@aggTrade`);
      // Cửa sổ trượt 60 giây các lệnh khớp thật (mua/bán) — nguồn cho gauge Long/Short "sống" theo từng nhịp giao dịch
      let liveTradeBuf = []; let lastLiveGaugeTs = 0;
      const LIVE_WINDOW_MS = 60000;
      liveBuyPressureScore = null; // reset khi đổi mã coin
      whaleWS.onmessage = (event) => {
        const d = JSON.parse(event.data);
        const p = parseFloat(d.p); const q = parseFloat(d.q); const isBuy = !d.m; const usd = p * q;
        const dynamicThreshold = getWhaleThreshold(currentSymbol);
        if (usd >= dynamicThreshold) showWhaleAlert(isBuy, usd, p, currentSymbol);

        const now = Date.now();
        liveTradeBuf.push({ t: now, usd, isBuy });
        while (liveTradeBuf.length && now - liveTradeBuf[0].t > LIVE_WINDOW_MS) liveTradeBuf.shift();
        if (now - lastLiveGaugeTs > 1000 && liveTradeBuf.length >= 5) {
          lastLiveGaugeTs = now;
          let buyUsd = 0, totalUsd = 0;
          liveTradeBuf.forEach(tr => { totalUsd += tr.usd; if (tr.isBuy) buyUsd += tr.usd; });
          liveBuyPressureScore = totalUsd > 0 ? (buyUsd / totalUsd) * 100 : 50;
          refreshGaugeDisplay();
        }
      };

      const handleWSDisconnect = () => {
        if(reconnectTimeout) return; console.warn("Đường truyền đứt. Kết nối lại sau 3s...");
        reconnectTimeout = setTimeout(() => { reconnectTimeout = null; updateChart(); }, 3000);
      };
      currentWebSocket.onerror = handleWSDisconnect; currentWebSocket.onclose = handleWSDisconnect;
    }
    initWebSockets();
  }

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") fetchSyncData(); });

  document.getElementById('color-up').addEventListener('input', e => { currentUpColor = e.target.value; localStorage.setItem('ok_upColor', currentUpColor); updateCSSVariables(currentUpColor, currentDownColor); candleSeries.applyOptions({ upColor: currentUpColor, wickUpColor: currentUpColor }); updateChart(); });
  document.getElementById('color-down').addEventListener('input', e => { currentDownColor = e.target.value; localStorage.setItem('ok_downColor', currentDownColor); updateCSSVariables(currentUpColor, currentDownColor); candleSeries.applyOptions({ downColor: currentDownColor, wickDownColor: currentDownColor }); updateChart(); });
  document.getElementById('btn-screenshot').addEventListener('click', () => { const a = document.createElement('a'); a.href = chartPrice.takeScreenshot().toDataURL('image/png'); a.download = `OngKinh_${currentSymbol}.png`; a.click(); });
  
  let isResizing = false; let startY = 0; let startH1 = 0; let startH2 = 0; let resizeTargetPane = null; let paneResizeRAF = null;
  document.getElementById('pane-resizer').addEventListener('mousedown', e => {
    const firstPane = document.getElementById('pane-resizer').nextElementSibling;
    if (!firstPane || !firstPane.classList.contains('sub-pane')) return;
    resizeTargetPane = paneRegistry[firstPane.dataset.pane]; if (!resizeTargetPane) return;
    isResizing = true; startY = e.clientY; startH1 = document.getElementById('chart-price').clientHeight; startH2 = document.getElementById(resizeTargetPane.elId).clientHeight;
    document.body.style.cursor = 'row-resize'; e.preventDefault();
  });
  // Gộp các sự kiện mousemove dồn dập trong lúc kéo thanh chia pane lại thành tối đa 1 lần cập
  // nhật / khung hình (thay vì cập nhật DOM + chart mỗi lần chuột nhích, dễ gây giật khi chuột nhạy).
  window.addEventListener('mousemove', e => {
    if (!isResizing || !resizeTargetPane) return;
    const clientY = e.clientY;
    if (paneResizeRAF) return;
    paneResizeRAF = requestAnimationFrame(() => {
      paneResizeRAF = null;
      const dy = clientY - startY; const h1 = startH1 + dy; const h2 = startH2 - dy;
      if (h1 > 100 && h2 > 60) { document.getElementById('chart-price').style.height = h1+'px'; document.getElementById(resizeTargetPane.elId).style.height = h2+'px'; chartPrice.applyOptions({ height: h1 }); resizeTargetPane.chart.applyOptions({ height: h2 }); }
    });
  });
  window.addEventListener('mouseup', () => { if (isResizing) { isResizing = false; resizeTargetPane = null; document.body.style.cursor = 'default'; if (paneResizeRAF) { cancelAnimationFrame(paneResizeRAF); paneResizeRAF = null; } } });

  // (Kéo-thả đổi vị trí pane đã được thiết lập ở phần khởi tạo hệ thống chỉ báo phía trên)

  function executeSearch(fromChip) {
    let inputVal = document.getElementById('symbol-input').value.trim().toUpperCase(); if (inputVal === "") return;
    if (!inputVal.endsWith('USDT')) inputVal += 'USDT';

    // Nếu đã tải xong danh sách toàn thị trường, kiểm tra mã có thật sự tồn tại không,
    // tránh trường hợp gõ sai mã khiến biểu đồ treo ở "Đang tải..." mà không rõ lý do.
    if (allMarketSymbols.length && !allMarketSymbols.some(s => s.symbol === inputVal)) {
      showSymbolError(`Không tìm thấy mã "${inputVal.replace('USDT', '')}" trên Binance.`);
      return;
    }
    hideSymbolError();

    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-symbol') === (fromChip ? inputVal.replace('USDT', '') : null)));
    currentSymbol = inputVal; localStorage.setItem('ok_symbol', currentSymbol); updateChart();
    hideSymbolSuggest();
  }
  document.getElementById('search-btn').addEventListener('click', () => executeSearch(false));
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', function(){ document.getElementById('symbol-input').value = this.getAttribute('data-symbol'); executeSearch(true); }));

  // ==========================================
  // GỢI Ý COIN TOÀN THỊ TRƯỜNG (autocomplete) — gõ tới đâu, gợi ý các coin khớp tới đó
  // ==========================================
  const symbolInputEl = document.getElementById('symbol-input');
  const symbolSuggestEl = document.getElementById('symbol-suggest');
  const symbolErrorEl = document.getElementById('symbol-error');
  let suggestHighlightIndex = -1;
  let currentSuggestList = [];

  function showSymbolError(msg) { symbolErrorEl.textContent = msg; symbolErrorEl.classList.add('show'); }
  function hideSymbolError() { symbolErrorEl.classList.remove('show'); }
  function hideSymbolSuggest() { symbolSuggestEl.classList.remove('show'); symbolSuggestEl.innerHTML = ''; suggestHighlightIndex = -1; currentSuggestList = []; }

  function renderSymbolSuggest(query) {
    hideSymbolError();
    if (!query || !allMarketSymbols.length) { hideSymbolSuggest(); return; }

    // Ưu tiên các mã bắt đầu đúng bằng ký tự đã gõ, sau đó mới tới các mã chỉ chứa ký tự đó ở giữa
    const starts = []; const contains = [];
    for (const s of allMarketSymbols) {
      if (s.base === query) { starts.unshift(s); }
      else if (s.base.startsWith(query)) { starts.push(s); }
      else if (s.base.includes(query)) { contains.push(s); }
      if (starts.length >= 8) break;
    }
    currentSuggestList = starts.concat(contains).slice(0, 8);
    suggestHighlightIndex = -1;

    if (!currentSuggestList.length) {
      symbolSuggestEl.innerHTML = '<div class="symbol-suggest-empty">Không có coin nào khớp</div>';
      symbolSuggestEl.classList.add('show');
      return;
    }

    symbolSuggestEl.innerHTML = currentSuggestList.map(s =>
      `<div class="symbol-suggest-item" data-symbol="${s.symbol}" data-base="${s.base}">
        <span class="symbol-suggest-base">${s.base}</span>
        <span class="symbol-suggest-quote">/USDT</span>
      </div>`
    ).join('');
    symbolSuggestEl.classList.add('show');
  }

  function selectSuggestion(base) {
    symbolInputEl.value = base;
    hideSymbolSuggest();
    executeSearch(false);
  }

  symbolInputEl.addEventListener('input', () => {
    hideSymbolError();
    renderSymbolSuggest(symbolInputEl.value.trim().toUpperCase());
  });

  symbolInputEl.addEventListener('focus', () => {
    if (symbolInputEl.value.trim()) renderSymbolSuggest(symbolInputEl.value.trim().toUpperCase());
  });

  symbolInputEl.addEventListener('keydown', (e) => {
    if (symbolSuggestEl.classList.contains('show') && currentSuggestList.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        suggestHighlightIndex = Math.min(suggestHighlightIndex + 1, currentSuggestList.length - 1);
        updateSuggestHighlight();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        suggestHighlightIndex = Math.max(suggestHighlightIndex - 1, 0);
        updateSuggestHighlight();
        return;
      }
      if (e.key === 'Escape') { hideSymbolSuggest(); return; }
      if (e.key === 'Enter' && suggestHighlightIndex >= 0) {
        e.preventDefault();
        selectSuggestion(currentSuggestList[suggestHighlightIndex].base);
        return;
      }
    }
    if (e.key === 'Enter') executeSearch(false);
  });

  function updateSuggestHighlight() {
    const items = symbolSuggestEl.querySelectorAll('.symbol-suggest-item');
    items.forEach((el, i) => el.classList.toggle('hl', i === suggestHighlightIndex));
  }

  symbolSuggestEl.addEventListener('click', (e) => {
    const item = e.target.closest('.symbol-suggest-item');
    if (item) selectSuggestion(item.getAttribute('data-base'));
  });

  // Click ra ngoài ô tìm kiếm / gợi ý thì ẩn dropdown đi
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box-wrap')) hideSymbolSuggest();
  });

  document.querySelectorAll('.tf-btn').forEach(btn => btn.addEventListener('click', function() { document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); currentInterval = this.getAttribute('data-interval'); localStorage.setItem('ok_interval', currentInterval); updateChart(); }));
  window.addEventListener('resize', resizeAllCharts);
  // ResizeObserver: bám sát kích thước THẬT của khung chart-wrapper mọi lúc — không chỉ khi cửa sổ trình
  // duyệt đổi kích thước. Điều này bắt được cả những trường hợp chiều cao đổi mà "resize" của window KHÔNG
  // bắn ra: breakpoint CSS mobile/desktop, font web tải xong làm layout dịch chuyển, xoay ngang/dọc màn hình,
  // thêm/xoá pane chỉ báo... Đây chính là nguyên nhân gây ra khoảng trắng lệch giữa các pane trên di động —
  // canvas bên trong lightweight-charts bị "đóng băng" ở kích thước cũ trong khi khung CSS bên ngoài đã đổi.
  if ('ResizeObserver' in window) {
    const chartWrapperEl = document.getElementById('chart-wrapper');
    if (chartWrapperEl) {
      const roChartWrapper = new ResizeObserver(() => { resizeAllCharts(); });
      roChartWrapper.observe(chartWrapperEl);
    }
  }
  
  document.getElementById('ai-switch').addEventListener('click', function() {
    aiEnabled = !aiEnabled;
    this.classList.toggle('on', aiEnabled);
    localStorage.setItem('ok_ai', aiEnabled);
    if (typeof runAIAnalysis === 'function') runAIAnalysis();
  });
  updateChart();
