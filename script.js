// Khôi phục thứ tự pane (Volume/RSI) đã lưu — chạy trước khi khởi tạo chart
  (function restorePaneOrder(){
    try {
      const saved = JSON.parse(localStorage.getItem('ok_pane_order') || 'null');
      if (!saved) return;
      const wrapper = document.getElementById('chart-wrapper');
      saved.forEach(key => { const el = document.getElementById('pane-' + key); if (el) wrapper.appendChild(el); });
    } catch (e) {}
  })();

  // 1. LOCAL STORAGE & GLOBAL VARS
  let currentSymbol = localStorage.getItem('ok_symbol') || 'BTCUSDT';
  let currentInterval = localStorage.getItem('ok_interval') || '4h';
  let aiEnabled = localStorage.getItem('ok_ai') !== 'false';
  let currentUpColor = localStorage.getItem('ok_upColor') || '#14cc8a';
  let currentDownColor = localStorage.getItem('ok_downColor') || '#ff4757';
  
  let whaleLogs = JSON.parse(localStorage.getItem('ok_whale_logs') || '[]');

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
      if (confirm("Bạn có chắc chắn muốn dọn sạch nhật ký cá mập?")) { 
        if (typeof whaleLogs !== 'undefined') whaleLogs = []; 
        localStorage.setItem('ok_whale_logs', JSON.stringify([])); 
        if (typeof renderWhaleLogs === 'function') renderWhaleLogs(); 
      }
    } catch (error) {
      console.log("Hệ thống bỏ qua lỗi xóa tất cả Cá mập:", error);
    }
  };

  // =========================================================
  // BỘ LỌC TÂM LÝ BINANCE — Gauge Long/Short có animation mượt
  // =========================================================
  let binanceLSRatio = 1.0;
  let lsPrevScore = null;      // điểm % Long của lần cập nhật trước (để tính mũi tên tăng/giảm)
  let lsAnimScore = 50;        // điểm đang hiển thị tại thời điểm hiện tại của animation (tween)
  let lsAnimFrameId = null;
  async function fetchBinanceSentiment(symbol = currentSymbol) {
    try {
      const response = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        binanceLSRatio = parseFloat(data[0].longShortRatio);
        updateBinanceSentimentUI();
      }
    } catch (error) { console.error("Không lấy được L/S:", error); }
  }

  // Quy đổi tỉ lệ Long/Short thành % tài khoản Long — công thức toán học trực tiếp
  // từ số liệu thật của Binance (ratio = longAccount / shortAccount), không suy đoán.
  function ratioToScore(ratio) {
    if (!ratio || ratio <= 0) return 50;
    return (ratio / (1 + ratio)) * 100; // % Long chính xác theo công thức của Binance
  }
  function scoreToColor(score) {
    if (score < 20) return '#e0455c'; if (score < 40) return '#e07a5f';
    if (score < 60) return '#d9a066'; if (score < 80) return '#7fc95f';
    return '#2ecc71';
  }
  function scoreToLabel(score) {
    if (score < 20) return 'Short áp đảo'; if (score < 40) return 'Nghiêng Short';
    if (score < 60) return 'Cân bằng'; if (score < 80) return 'Nghiêng Long';
    return 'Long áp đảo';
  }
  function lsHexToRgb(hex) { const h = hex.replace('#', ''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
  function lsLerpColor(hexA, hexB, t) {
    const a = lsHexToRgb(hexA), b = lsHexToRgb(hexB);
    const r = Math.round(a[0] + (b[0]-a[0])*t), g = Math.round(a[1] + (b[1]-a[1])*t), bl = Math.round(a[2] + (b[2]-a[2])*t);
    return `rgb(${r},${g},${bl})`;
  }
  function lsEaseOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function lsPt(cx, cy, r, s) { const deg = 180 - (s / 100) * 180; const rad = deg * Math.PI / 180; return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }; }
  function lsArcPath(cx, cy, r, s1, s2) { const a = lsPt(cx, cy, r, s1), b = lsPt(cx, cy, r, s2); return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`; }

  const LS_CX = 150, LS_CY = 158, LS_R = 112, LS_SW = 22;

  // Dựng khung SVG tĩnh (nền cung màu, mốc 0/50/100) — chỉ chạy MỘT LẦN, không re-render mỗi lần có dữ liệu mới
  function buildGaugeShell() {
    const segments = [[0, 20, '#c23a4f'], [20, 40, '#d9765a'], [40, 60, '#c99257'], [60, 80, '#5fae52'], [80, 100, '#219150']];
    const gap = 1.6;
    let arcs = '';
    segments.forEach(([s1, s2, color]) => {
      const a = lsPt(LS_CX, LS_CY, LS_R, s1 + gap / 2), b = lsPt(LS_CX, LS_CY, LS_R, s2 - gap / 2);
      arcs += `<path d="M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${LS_R} ${LS_R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}" stroke="${color}" stroke-width="${LS_SW}" fill="none" stroke-linecap="round" opacity="0.32"/>`;
    });
    const svg = `
      <svg viewBox="0 0 300 192" class="ls-svg">
        <defs>
          <filter id="ls-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g class="ls-track">${arcs}</g>
        <path id="ls-highlight" d="" stroke="#7fc95f" stroke-width="${LS_SW}" fill="none" stroke-linecap="round"/>
        <circle id="ls-dot-glow" cx="150" cy="46" r="15" fill="#7fc95f" opacity="0.35" filter="url(#ls-glow)"/>
        <circle id="ls-dot" cx="150" cy="46" r="9" fill="#ffffff" stroke="#0a0d13" stroke-width="3"/>
        <text x="30" y="184" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="11" fill="#7c8598" letter-spacing="1">SHORT</text>
        <text x="270" y="184" text-anchor="end" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="11" fill="#7c8598" letter-spacing="1">LONG</text>
        <text id="ls-percent" x="150" y="148" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="42" fill="#7fc95f">50%</text>
        <text id="ls-label" x="150" y="174" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="600" font-size="15" fill="#e7eaf0">Cân bằng</text>
      </svg>
      <div class="ls-footer">
        <span>Tỷ lệ L/S thực tế: <b id="ls-ratio">1.00</b> (Long:Short)</span>
        <span id="ls-delta" class="ls-delta"></span>
      </div>`;
    const gaugeEl = document.getElementById('sentiment-gauge');
    gaugeEl.innerHTML = svg;
    gaugeEl.classList.add('ls-ready');
  }

  // Animate mượt từ điểm hiện tại -> điểm mới trong ~900ms (ease-out), không đập lại toàn bộ DOM
  function animateGaugeTo(targetScore) {
    if (lsAnimFrameId) cancelAnimationFrame(lsAnimFrameId);
    const startScore = lsAnimScore;
    const startColor = scoreToColor(startScore);
    const endColor = scoreToColor(targetScore);
    const duration = 900;
    const t0 = performance.now();
    const highlightEl = document.getElementById('ls-highlight');
    const dotEl = document.getElementById('ls-dot');
    const glowEl = document.getElementById('ls-dot-glow');
    const percentEl = document.getElementById('ls-percent');
    const labelEl = document.getElementById('ls-label');
    if (!highlightEl || !dotEl || !percentEl || !labelEl) return;

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = lsEaseOutCubic(t);
      const score = startScore + (targetScore - startScore) * eased;
      lsAnimScore = score;
      const color = lsLerpColor(startColor, endColor, eased);

      const hs1 = Math.max(0, score - 6), hs2 = Math.min(100, score + 6);
      highlightEl.setAttribute('d', lsArcPath(LS_CX, LS_CY, LS_R, hs1, hs2));
      highlightEl.setAttribute('stroke', color);

      const p = lsPt(LS_CX, LS_CY, LS_R, score);
      dotEl.setAttribute('cx', p.x.toFixed(2)); dotEl.setAttribute('cy', p.y.toFixed(2));
      glowEl.setAttribute('cx', p.x.toFixed(2)); glowEl.setAttribute('cy', p.y.toFixed(2)); glowEl.setAttribute('fill', color);

      percentEl.textContent = Math.round(score) + '%';
      percentEl.setAttribute('fill', color);
      labelEl.textContent = scoreToLabel(score);

      if (t < 1) { lsAnimFrameId = requestAnimationFrame(frame); }
      else { lsAnimFrameId = null; }
    }
    lsAnimFrameId = requestAnimationFrame(frame);
  }

  function updateBinanceSentimentUI() {
    const gaugeEl = document.getElementById('sentiment-gauge');
    if (!gaugeEl) return;
    if (!gaugeEl.classList.contains('ls-ready')) buildGaugeShell();
    const score = ratioToScore(binanceLSRatio);

    animateGaugeTo(score);

    const ratioEl = document.getElementById('ls-ratio');
    if (ratioEl) ratioEl.textContent = binanceLSRatio.toFixed(2);

    const deltaEl = document.getElementById('ls-delta');
    if (deltaEl && lsPrevScore !== null) {
      const diff = score - lsPrevScore;
      if (Math.abs(diff) < 0.05) { deltaEl.textContent = '• Không đổi'; deltaEl.className = 'ls-delta flat'; }
      else if (diff > 0) { deltaEl.textContent = `▲ +${diff.toFixed(1)}% Long`; deltaEl.className = 'ls-delta up'; }
      else { deltaEl.textContent = `▼ ${diff.toFixed(1)}% Long`; deltaEl.className = 'ls-delta down'; }
      // Ripple nhẹ báo hiệu vừa cập nhật dữ liệu mới
      deltaEl.classList.remove('pulse'); void deltaEl.offsetWidth; deltaEl.classList.add('pulse');
    }
    lsPrevScore = score;
  }
  setInterval(() => fetchBinanceSentiment(currentSymbol), 30000); 
  setTimeout(() => fetchBinanceSentiment(currentSymbol), 1000);

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
    layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#7c8598' },
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
  const chartPrice = LightweightCharts.createChart(document.getElementById('chart-price'), { ...commonOptions, timeScale: { timeVisible: true, visible: false } });
  const candleSeries = chartPrice.addCandlestickSeries({ upColor: currentUpColor, downColor: currentDownColor, borderVisible: false, wickUpColor: currentUpColor, wickDownColor: currentDownColor });
  const volumePane = document.getElementById('chart-volume');
  const chartVolume = LightweightCharts.createChart(volumePane, {
    ...commonOptions,
    crosshair: { ...commonOptions.crosshair, mode: LightweightCharts.CrosshairMode.Normal },
    timeScale: { timeVisible: true, visible: false, rightOffset: 0 },
    leftPriceScale: { visible: false, borderVisible: false, minWidth: 0 },
    rightPriceScale: { visible: true, borderVisible: false, alignLabels: true, minimumWidth: 90, scaleMargins: { top: 0.15, bottom: 0.15 } }
  });
  const volumeSeries = chartVolume.addHistogramSeries({
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
    });
  }
  function updatePaneAxisVisibility() {
    const panes = Array.from(document.getElementById('chart-wrapper').querySelectorAll('.sub-pane'));
    panes.forEach((p, idx) => { const reg = paneRegistry[p.dataset.pane]; if (reg) reg.chart.applyOptions({ timeScale: { visible: idx === panes.length - 1 } }); });
    requestAnimationFrame(resizeAllCharts);
  }

  // ===== Đồng bộ trục thời gian (mesh) — tự động cuốn theo pane mới tạo =====
  let allTimeScales = [];
  function registerTimeScale(ts) {
    ts.subscribeVisibleLogicalRangeChange(range => { if (!range) return; allTimeScales.forEach(o => { if (o !== ts) o.setVisibleLogicalRange(range); }); });
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
    const out = [];
    for (let i = Math.max(0, fromIndex); i < times.length; i++) { if (values[i] === null || values[i] === undefined) continue; out.push({ time: times[i], value: values[i] }); }
    return out;
  }

  // ===== Xác định price scale cho từng chỉ báo: chia sẻ trục phải nếu là chỉ báo "đúng nhà" của pane.
  // Nếu chỉ báo bị kéo/ghép sang pane khác, dùng một trục ẨN riêng (không vẽ, độ rộng = 0) để tự co giãn
  // độc lập mà KHÔNG chiếm thêm bề ngang — vì trục trái hiển thị sẽ làm pane đó rộng hơn pane khác,
  // khiến nến/cột/đường bị lệch cột với các pane còn lại (đây chính là nguyên nhân "3 biểu đồ lệch nhau"). =====
  const seriesStore = {}; // id -> { series:[...], scaleId, guides:[...] }
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
    const mkLine = (color, width, extra) => chart.addLineSeries(Object.assign({ color, lineWidth: width, lineStyle, priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: true, visible: ind.visible }, extra || {}));
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
      const hist = chart.addHistogramSeries({ priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: false, visible: ind.visible });
      series = [macdLine, signalLine, hist];
    } else if (ind.type === 'stoch') {
      const k = mkLine(ind.color, ind.width); const d = mkLine(ind.color2, ind.width2 || 1);
      series = [k, d];
      guides.push(k.createPriceLine({ price: 80, color: '#ff475766', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '80' }));
      guides.push(k.createPriceLine({ price: 20, color: '#14cc8a66', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '20' }));
    }
    seriesStore[ind.id] = { series, scaleId, guides, dataMap: new Map() };
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
        store.dataMap = buildValueMap(data);
      } else if (ind.type === 'ema') {
        const arr = computeEMA(closes, ind.period);
        const data = toLineData(times, arr, ind.period - 1);
        store.series[0].setData(data);
        store.dataMap = buildValueMap(data);
      } else if (ind.type === 'volma') {
        const arr = computeSMA(vols, ind.period);
        const data = toLineData(times, arr, ind.period - 1);
        store.series[0].setData(data);
        store.dataMap = buildValueMap(data);
      } else if (ind.type === 'bb') {
        const bb = computeBollinger(closes, ind.period, ind.mult);
        const basis = toLineData(times, bb.basis, ind.period - 1);
        const upper = toLineData(times, bb.upper, ind.period - 1);
        const lower = toLineData(times, bb.lower, ind.period - 1);
        store.series[0].setData(basis);
        store.series[1].setData(upper);
        store.series[2].setData(lower);
        store.dataMap = buildValueMap(basis);
      } else if (ind.type === 'rsi') {
        const rsiArr = computeRSI(closes, ind.period); const smaArr = computeSMA(rsiArr, ind.smaPeriod);
        const main = toLineData(times, rsiArr, ind.period);
        const sig = toLineData(times, smaArr, ind.period + ind.smaPeriod - 1);
        store.series[0].setData(main);
        store.series[1].setData(sig);
        store.dataMap = buildValueMap(main);
      } else if (ind.type === 'macd') {
        const { macd, sig, hist } = computeMACD(closes, ind.fast, ind.slow, ind.signal);
        const from = ind.slow - 1; const fromSig = from + ind.signal - 1;
        const main = toLineData(times, macd, from);
        const signal = toLineData(times, sig, fromSig);
        store.series[0].setData(main);
        store.series[1].setData(signal);
        const histData = [];
        for (let i = fromSig; i < times.length; i++) { if (hist[i] == null) continue; histData.push({ time: times[i], value: hist[i], color: hist[i] >= 0 ? (currentUpColor + '99') : (currentDownColor + '99') }); }
        store.series[2].setData(histData);
        store.dataMap = buildValueMap(main);
      } else if (ind.type === 'stoch') {
        const { k, d } = computeStochastic(highs, lows, closes, ind.kPeriod, ind.dPeriod, ind.smooth);
        const main = toLineData(times, k, ind.kPeriod + ind.smooth - 2);
        const sig = toLineData(times, d, ind.kPeriod + ind.smooth - 2 + ind.dPeriod - 1);
        store.series[0].setData(main);
        store.series[1].setData(sig);
        store.dataMap = buildValueMap(main);
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
    paneEl.innerHTML = `<div class="pane-header"><span class="pane-drag" title="Kéo để đổi vị trí">⠿</span><span class="pane-title">${INDICATOR_CATALOG[homeType].label}</span><button class="pane-remove" type="button" title="Xóa toàn bộ pane">🗑</button></div><div id="chart-${id}" style="position:relative; height:130px;"><div class="chart-legend" id="legend-${id}"></div></div>`;
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
    indPopover.innerHTML = `<div class="ind-pop-title">${labelFor(ind)}<button class="ind-pop-close" type="button">&times;</button></div>${rows}<div class="ind-pop-footer"><button class="ind-pop-reset" id="ip-delete" type="button">Xóa chỉ báo</button><button class="ind-pop-save" id="ip-save" type="button">Lưu</button></div>`;
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
    if (indPopover.classList.contains('show') && !indPopover.contains(e.target) && !e.target.classList.contains('ind-gear')) closeIndicatorPopover();
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
      item.innerHTML = `<span class="ind-drag">⋮⋮</span><span class="ind-dot" style="background:${ind.color}"></span><span class="ind-label">${labelFor(ind)}</span><span class="ind-value" data-key="${ind.id}" style="color:${ind.color}"></span><button class="ind-eye" data-key="${ind.id}" type="button" title="Ẩn/hiện">${ind.visible ? '👁' : '🚫'}</button><button class="ind-gear" data-key="${ind.id}" type="button" title="Cài đặt">⚙</button><button class="ind-trash" data-key="${ind.id}" type="button" title="Xóa">🗑</button>`;
      container.appendChild(item);
    });
  }
  function renderAllLegends() { Object.keys(paneRegistry).forEach(renderLegend); updateAllLegendValues(); }

  // ===== Hiển thị giá trị hiện tại (hoặc giá trị tại điểm đang rê chuột) của từng chỉ báo trong legend =====
  // Thay thế cho nhãn giá trị trên trục phải (đã tắt ở mkLine) để tránh chồng chéo con số như trên các sàn lớn.
  function getLatestTime() { return candlesData.length ? candlesData[candlesData.length - 1].time : null; }
  function updateLegendValues(paneId, time) {
    const container = document.getElementById(paneLegendElId(paneId)); if (!container) return;
    const t = (time === undefined || time === null) ? getLatestTime() : time;
    indicators.filter(i => i.pane === paneId).forEach(ind => {
      const store = seriesStore[ind.id]; const el = container.querySelector(`.ind-value[data-key="${ind.id}"]`);
      if (!store || !el) return;
      const val = (t !== null && t !== undefined) ? store.dataMap.get(t) : null;
      el.textContent = (val === null || val === undefined) ? '' : fmt(val);
    });
  }
  function updateAllLegendValues(time) { Object.keys(paneRegistry).forEach(paneId => updateLegendValues(paneId, time)); }
  function initLegendEvents(containerId, paneId) {
    const container = document.getElementById(containerId); if (!container) return;
    container.addEventListener('click', e => {
      if (e.target.classList.contains('ind-eye')) toggleIndicatorVisibility(e.target.dataset.key);
      else if (e.target.classList.contains('ind-gear')) openIndicatorPopover(e.target.dataset.key, e.target);
      else if (e.target.classList.contains('ind-trash')) { if (confirm('Xóa chỉ báo này khỏi biểu đồ?')) deleteIndicator(e.target.dataset.key); }
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
        html += `<div class="im-item" data-type="${k}"><span>${INDICATOR_CATALOG[k].label}</span><span class="im-add">＋</span></div>`;
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
  function fmt(n){ return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtVol(n){ if(n>=1e9) return (n/1e9).toFixed(2)+'B'; if(n>=1e6) return (n/1e6).toFixed(2)+'M'; if(n>=1e3) return (n/1e3).toFixed(2)+'K'; return n.toFixed(2); }
  function fmtTime(t){ return new Date(t*1000).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }

  let currentTool = 'cursor'; let priceLines = []; let trendLines = []; let drawingTrendState = 0; let trendPoint1 = null;
  const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentTool = btn.getAttribute('data-tool'); drawingTrendState = 0; 
      chartPrice.applyOptions({ crosshair: { mode: currentTool === 'cursor' ? LightweightCharts.CrosshairMode.Normal : LightweightCharts.CrosshairMode.Magnet } });
      document.getElementById('chart-price').style.cursor = 'crosshair'; 
    });
  });

  chartPrice.subscribeClick(param => {
    if (currentTool === 'cursor' || !param.point || param.time === undefined) return;
    const price = candleSeries.coordinateToPrice(param.point.y); if (!price) return;
    if (currentTool === 'hline') {
      const line = candleSeries.createPriceLine({ price: price, color: '#3d8bff', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'Cản tay' });
      priceLines.push(line); document.querySelector('.tool-btn[data-tool="cursor"]').click();
    }
    if (currentTool === 'trendline') {
      if (drawingTrendState === 0) { trendPoint1 = { time: param.time, value: price }; drawingTrendState = 1;
      } else if (drawingTrendState === 1) {
        const trendPoint2 = { time: param.time, value: price };
        if (trendPoint1.time !== trendPoint2.time) {
          const data = trendPoint1.time < trendPoint2.time ? [trendPoint1, trendPoint2] : [trendPoint2, trendPoint1];
          const tlSeries = chartPrice.addLineSeries({ color: 'var(--gold)', lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
          tlSeries.setData(data); trendLines.push(tlSeries);
        }
        drawingTrendState = 0; document.querySelector('.tool-btn[data-tool="cursor"]').click();
      }
    }
  });

  document.getElementById('clear-drawings').addEventListener('click', () => { priceLines.forEach(line => candleSeries.removePriceLine(line)); priceLines = []; trendLines.forEach(series => chartPrice.removeSeries(series)); trendLines = []; });

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
             html += `<div style="color:${signal.color}; font-weight:bold; font-size: 13px;">✨ ${signal.label}</div>`;
             html += `<div style="color:#a9b1c2; font-size:11.5px; margin-top:4px; max-width: 240px; white-space: normal; line-height: 1.45; font-family:'JetBrains Mono', monospace;">`;
             if (signal.entry) {
                html += `<span style="color:var(--up)">● Entry: ${fmt(signal.entry)}</span><br>`;
                html += `<span style="color:var(--gold)">● Target: ${fmt(signal.target)}</span><br>`;
                html += `<span style="color:var(--down)">● SL(Động): ${fmt(signal.sl)}</span><br>`;
             }
             html += `<div style="margin-top:6px; color:#8b93a7; font-family:'Inter', sans-serif; font-weight:500; font-size:11px; line-height:1.55;">📌 ${getProNote(signal)}</div>`;
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
    if (whaleLogs.length === 0) { list.innerHTML = '<div class="ai-empty">Chưa có dữ liệu cá mập...</div>'; return; }
    const recent = whaleLogs.slice().reverse();
    recent.forEach(log => {
      const row = document.createElement('div'); row.className = 'signal-row';
      const tone = log.isBuy ? 'up' : 'down'; const label = log.isBuy ? 'CÁ MẬP MUA' : 'CÁ MẬP BÁN';
      row.innerHTML = `<div style="display:flex; flex:1; padding-right: 10px;"><div class="signal-badge ${tone}">${label}</div><div class="signal-body" style="flex:1;"><div class="signal-meta"><span class="signal-time">${new Date(log.time).toLocaleTimeString('vi-VN')}</span><span class="signal-price" style="color:var(--${tone}); font-weight:700">${fmtVol(log.usd)} USDT</span></div><div class="signal-desc">Coin: <b>${log.symbol}</b> ở mức giá <b>${fmt(log.price)}</b></div></div></div><div style="display:flex; align-items:center;"><button class="btn-delete-item" onclick="deleteSingleLog(${log.time}, true)" title="Xóa">✖</button></div>`;
      list.appendChild(row);
    });
  }
  renderWhaleLogs();

  function showWhaleAlert(isBuy, usdAmount, price, symbol) {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    toast.className = `whale-toast ${isBuy ? 'buy' : 'sell'}`;
    toast.innerHTML = `<div class="whale-icon">${isBuy ? '🐳 🚀' : '🐳 🩸'}</div><div class="whale-content"><div class="whale-title">${isBuy ? 'CÁ MẬP MUA' : 'CÁ MẬP BÁN'}</div><div class="whale-desc">${fmtVol(usdAmount)} USDT ở giá ${fmt(price)}</div><div class="whale-time">${new Date().toLocaleTimeString('vi-VN')}</div></div>`;
    container.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 6000);
    whaleLogs.push({ time: Date.now(), isBuy, usd: usdAmount, price, symbol });
    if (whaleLogs.length > 50) whaleLogs.shift();
    localStorage.setItem('ok_whale_logs', JSON.stringify(whaleLogs)); renderWhaleLogs();
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
  function renderTrendCard(elId, result, horizonName){ const card = document.getElementById(elId); card.className = "trend-card"; if (result.insufficient){ card.classList.add('side'); card.querySelector('.trend-arrow').innerText = '—'; card.querySelector('.trend-label').innerText = 'Chưa đủ dữ liệu'; card.querySelector('.trend-desc').innerHTML = 'Cần thêm dữ liệu lịch sử.'; return; } const agree = result.emaSig !== 0 && result.emaSig === result.structSig; let cls, arrow, label, reason; if (result.trend === 1){ cls = 'up'; arrow = '▲'; label = 'TĂNG'; reason = agree ? `Đồng thuận cấu trúc & EMA.` : `Chỉ EMA tăng.`; } else if (result.trend === -1){ cls = 'down'; arrow = '▼'; label = 'GIẢM'; reason = agree ? `Đồng thuận cấu trúc & EMA.` : `Chỉ EMA giảm.`; } else { cls = 'side'; arrow = '↔'; label = 'ĐI NGANG'; reason = 'Tín hiệu giằng co, chưa rõ ràng.'; } card.classList.add(cls); card.querySelector('.trend-arrow').innerText = arrow; card.querySelector('.trend-label').innerText = label; card.querySelector('.trend-desc').innerHTML = reason + (agree ? '<span class="trend-confirm agree">Đồng thuận</span>' : ''); }
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
    if (liveStatusEl) liveStatusEl.innerHTML = isLiveSignalPreview ? '🔴 LIVE · nến chưa đóng, tín hiệu có thể đổi' : '✅ Đã xác nhận nến đóng';
    runTrendAnalysis(); signalsMap.clear();
    const aiList = document.getElementById('ai-signal-list');
    if(!aiEnabled){ candleSeries.setMarkers([]); aiList.innerHTML='<div class="ai-empty">AI Đang tắt. Bật công tắc để phân tích.</div>'; return;}
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
        addSignal({ time: c.time, type: 'trend_long', label: 'MUA - LONG 🚀', tone: 'up', price: c.close, entry: c.close, target: targetPrice, sl: stopLoss, desc: `Đồng thuận đa khung: ${confidenceLabel}. R:R 1:${rr}. Giá điều chỉnh về hỗ trợ và bật nảy.`, color: currentUpColor });
      } else if (isShortEntry) {
        lastShortIdx = i;
        const stopLoss = c.close + stopDistance;
        const targetPrice = c.close - stopDistance * rr;
        addSignal({ time: c.time, type: 'trend_short', label: 'BÁN - SHORT 🩸', tone: 'down', price: c.close, entry: c.close, target: targetPrice, sl: stopLoss, desc: `Đồng thuận đa khung: ${confidenceLabel}. R:R 1:${rr}. Giá gãy hỗ trợ.`, color: currentDownColor });
      }

      // 2. KHÔI PHỤC TÍN HIỆU VOLUME ĐỘT BIẾN / CLIMAX
      const avgVol = volSma[i];
      if (v > avgVol * aiVolMult) {
        const body = Math.abs(c.close - c.open);
        const upperWick = c.high - Math.max(c.open, c.close);
        const lowerWick = Math.min(c.open, c.close) - c.low;
        
        if (c.close > c.open && upperWick > body * 1.5) {
           addSignal({ time: c.time, type: 'climax_buy', label: 'BUYING CLIMAX ⚠️', tone: 'warn', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)}. Bị xả mạnh.`, color: '#ffc93c' });
        } else if (c.close < c.open && lowerWick > body * 1.5) {
           addSignal({ time: c.time, type: 'climax_sell', label: 'SELLING CLIMAX ⚠️', tone: 'warn', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)}. Lực bắt đáy mạnh.`, color: '#ffc93c' });
        } else if (c.close > c.open && !isLongEntry) {
           // Vẽ lại chấm tròn cho Volume Bùng nổ (Mua)
           addSignal({ time: c.time, type: 'vol_spike', label: 'BÙNG NỔ MUA', tone: 'up', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)} lần trung bình.`, color: currentUpColor });
        } else if (c.close < c.open && !isShortEntry) {
           // Vẽ lại chấm tròn cho Volume Bùng nổ (Bán)
           addSignal({ time: c.time, type: 'vol_spike', label: 'XẢ HÀNG MẠNH', tone: 'down', price: c.close, desc: `Vol x${(v/avgVol).toFixed(1)} lần trung bình.`, color: currentDownColor });
        }
      }

      if (isFilteredBySentiment) { addSignal({ time: c.time, type: 'fng_block', label: 'AI CHẶN LỆNH 🛡️', tone: 'warn', price: c.close, desc: filterReason, color: '#6b7280' }); }
    }
    
    const visibleSignals = signals.filter(s => s.time >= aiIgnoreBeforeTime && !deletedLogTimes.has(s.time));

    // Khôi phục Code Vẽ Dấu Chấm lên Biểu đồ
    const markers = [];
    visibleSignals.forEach(s => {
      if (s.type === 'trend_long') markers.push({ time: s.time, position: 'belowBar', color: s.color, shape: 'arrowUp', text: 'LONG' });
      else if (s.type === 'trend_short') markers.push({ time: s.time, position: 'aboveBar', color: s.color, shape: 'arrowDown', text: 'SHORT' });
      else if (s.type === 'fng_block') markers.push({ time: s.time, position: 'aboveBar', color: s.color, shape: 'square', text: '🛑' });
      else if (s.type === 'climax_buy') markers.push({ time: s.time, position: 'aboveBar', color: '#ffc93c', shape: 'arrowDown', text: 'B.CLX ⚠️' });
      else if (s.type === 'climax_sell') markers.push({ time: s.time, position: 'belowBar', color: '#ffc93c', shape: 'arrowUp', text: 'S.CLX ⚠️' });
      else if (s.type === 'vol_spike') markers.push({ time: s.time, position: (s.tone === 'up' ? 'belowBar' : 'aboveBar'), color: s.color, shape: 'circle', text: '' }); // Dấu chấm hiển thị lại
    });
    markers.sort((a,b) => a.time - b.time);
    candleSeries.setMarkers(markers);
    
    aiList.innerHTML = '';
    if (visibleSignals.length === 0){ aiList.innerHTML = '<div class="ai-empty">Chưa có dữ liệu hoặc đã được dọn sạch sẽ...</div>'; return; }
    
    visibleSignals.slice(-15).reverse().forEach(s => {
      const row = document.createElement('div'); row.className = 'signal-row';
      const proNoteHtml = `<div class="signal-desc" style="color:#8b93a7; font-size:11px; margin-top:5px; line-height:1.5;">📌 ${getProNote(s)}</div>`;
      let descHtml = s.entry 
        ? `<div class="signal-desc" style="margin-top:5px; font-family:'JetBrains Mono', monospace; font-size:12px; font-weight:600;"><span style="color:var(--up)">🟢 Entry: ${fmt(s.entry)}</span> | <span style="color:var(--gold)">🎯 Target: ${fmt(s.target)}</span> | <span style="color:var(--down)">🔴 SL: ${fmt(s.sl)}</span></div><div class="signal-desc" style="color:var(--text-dim); font-size:11.5px; margin-top:3px;">${s.desc}</div>${proNoteHtml}` 
        : `<div class="signal-desc" style="color:var(--text-dim); font-size:12.5px; margin-top:5px;">${s.desc}</div>${proNoteHtml}`;

      row.innerHTML = `<div style="display:flex; flex:1; padding-right: 10px;"><div class="signal-badge ${s.tone}">${s.label}</div><div class="signal-body" style="flex:1;"><div class="signal-meta"><span class="signal-time">${fmtTime(s.time)}</span><span class="signal-price" style="font-weight:700;">${s.entry ? 'Vùng:' : 'Giá:'} ${fmt(s.price)} USDT</span></div>${descHtml}</div></div><div style="display:flex; align-items:center;"><button class="btn-delete-item" onclick="deleteSingleLog(${s.time})" title="Xóa">✖</button></div>`;
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
        candleSeries.setData(parsedCandles); volumeSeries.setData(parsedVolumes);
        candlesData = parsedCandles; volumesData = parsedVolumes; isLiveSignalPreview = false; runAIAnalysis();
        const upd = document.getElementById('stat-updated'); if (upd) upd.innerText = new Date().toLocaleTimeString('vi-VN');
      }).catch(err => console.log("Lỗi đồng bộ dữ liệu API:", err));
  }

  function updateChart() {
    priceElement.innerText = "Đang tải..."; titleElement.innerHTML = `${currentSymbol} <span class="quote">${currentInterval}</span>`;
    if (currentWebSocket) { currentWebSocket.onclose = null; currentWebSocket.close(); } 
    if (currentTickerWS) { currentTickerWS.onclose = null; currentTickerWS.close(); } 
    if (whaleWS) { whaleWS.onclose = null; whaleWS.close(); }
    if (reconnectTimeout) clearTimeout(reconnectTimeout); if (syncInterval) clearInterval(syncInterval);
    priceLines.forEach(line => candleSeries.removePriceLine(line)); priceLines = []; trendLines.forEach(series => chartPrice.removeSeries(series)); trendLines = [];

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
        candlesDataMap.set(time, liveCandle); volumesDataMap.set(time, liveVolume);
        const lastIdx = candlesData.length - 1;
        if (lastIdx >= 0 && candlesData[lastIdx].time === time){ candlesData[lastIdx] = liveCandle; volumesData[lastIdx] = liveVolume; } 
        else { candlesData.push(liveCandle); volumesData.push(liveVolume); }
        updateAllIndicators();
        const upd = document.getElementById('stat-updated'); if (upd) upd.innerText = new Date().toLocaleTimeString('vi-VN');
        if (kline.x === true) { isLiveSignalPreview = false; runAIAnalysis(); } else { scheduleLiveAIAnalysis(); }
      };
      
      whaleWS = new WebSocket(`wss://stream.binance.com:9443/ws/${currentSymbol.toLowerCase()}@aggTrade`);
      whaleWS.onmessage = (event) => {
        const d = JSON.parse(event.data);
        const p = parseFloat(d.p); const q = parseFloat(d.q); const isBuy = !d.m; const usd = p * q;
        const dynamicThreshold = getWhaleThreshold(currentSymbol);
        if (usd >= dynamicThreshold) showWhaleAlert(isBuy, usd, p, currentSymbol);
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
  
  let isResizing = false; let startY = 0; let startH1 = 0; let startH2 = 0; let resizeTargetPane = null;
  document.getElementById('pane-resizer').addEventListener('mousedown', e => {
    const firstPane = document.getElementById('pane-resizer').nextElementSibling;
    if (!firstPane || !firstPane.classList.contains('sub-pane')) return;
    resizeTargetPane = paneRegistry[firstPane.dataset.pane]; if (!resizeTargetPane) return;
    isResizing = true; startY = e.clientY; startH1 = document.getElementById('chart-price').clientHeight; startH2 = document.getElementById(resizeTargetPane.elId).clientHeight;
    document.body.style.cursor = 'row-resize'; e.preventDefault();
  });
  window.addEventListener('mousemove', e => { if (!isResizing || !resizeTargetPane) return; const dy = e.clientY - startY; const h1 = startH1 + dy; const h2 = startH2 - dy; if (h1 > 100 && h2 > 60) { document.getElementById('chart-price').style.height = h1+'px'; document.getElementById(resizeTargetPane.elId).style.height = h2+'px'; chartPrice.applyOptions({ height: h1 }); resizeTargetPane.chart.applyOptions({ height: h2 }); } });
  window.addEventListener('mouseup', () => { if (isResizing) { isResizing = false; resizeTargetPane = null; document.body.style.cursor = 'default'; } });

  // (Kéo-thả đổi vị trí pane đã được thiết lập ở phần khởi tạo hệ thống chỉ báo phía trên)

  function executeSearch(fromChip) {
    let inputVal = document.getElementById('symbol-input').value.trim().toUpperCase(); if (inputVal === "") return;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-symbol') === (fromChip ? inputVal : null)));
    if (!inputVal.endsWith('USDT')) inputVal += 'USDT'; currentSymbol = inputVal; localStorage.setItem('ok_symbol', currentSymbol); updateChart();
  }
  document.getElementById('search-btn').addEventListener('click', () => executeSearch(false));
  document.getElementById('symbol-input').addEventListener('keypress', e => { if (e.key === 'Enter') executeSearch(false); });
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', function(){ document.getElementById('symbol-input').value = this.getAttribute('data-symbol'); executeSearch(true); }));
  document.querySelectorAll('.tf-btn').forEach(btn => btn.addEventListener('click', function() { document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); currentInterval = this.getAttribute('data-interval'); localStorage.setItem('ok_interval', currentInterval); updateChart(); }));
  window.addEventListener('resize', resizeAllCharts);
  
  document.getElementById('ai-switch').addEventListener('click', function() {
    aiEnabled = !aiEnabled;
    this.classList.toggle('on', aiEnabled);
    localStorage.setItem('ok_ai', aiEnabled);
    if (typeof runAIAnalysis === 'function') runAIAnalysis();
  });
  updateChart();
