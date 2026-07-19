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
    shark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 14.5c2.6-4.5 6.4-7 10.7-7 4 0 7.6 1.7 9.4 4.4-1.4.9-3 1.3-4.6 1.1.9 1 2.1 1.6 3.5 1.6-1.4 1.6-3.6 2.2-5.7 1.5-2.1 1.6-5.1 2.2-8.1 1.4-2-.5-3.8-1.7-5.2-3z"/><path d="M11 8.4 12.6 4l1.6 4.6"/><circle cx="6.6" cy="13.6" r="0.7" fill="currentColor" stroke="none"/></svg>',
    dolphin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 16c1-5.5 5-10.5 11.3-10.8 2-.1 4 .6 4.9 2.3.8 1.5.2 3.2-1.3 3.9-1.3.6-2.7.3-3.6-.7-.3 2-1.5 3.8-3.3 5-2.2 1.5-5 1.9-7.5 1.1z"/><path d="M16.4 8.4c1.3-.3 2.6-.1 3.7.6" /><circle cx="15.6" cy="7.6" r="0.7" fill="currentColor" stroke="none"/></svg>',
    dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
    trendFlat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 12l5-5M3 12l5 5M21 12l-5-5M21 12l-5 5"/></svg>',
    alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2L22 20.5H2z"/><path d="M12 9.5v5.2"/><circle cx="12" cy="17.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.6c0 4.6-3.1 8.4-7.5 9.4-4.4-1-7.5-4.8-7.5-9.4V6z"/><path d="M9 12l2.2 2.2L15.3 10"/></svg>',
    extend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12h19"/><path d="M6 8l-3.5 4L6 16"/><path d="M18 8l3.5 4-3.5 4"/></svg>',
  };
  function icon(name, cls) { return `<span class="ico${cls ? ' ' + cls : ''}">${ICONS[name] || ''}</span>`; }


  let currentSymbol = localStorage.getItem('ok_symbol') || 'BTCUSDT';
  let currentInterval = localStorage.getItem('ok_interval') || '4h';
  let aiEnabled = localStorage.getItem('ok_ai') !== 'false';
  // ===== AI đa khung thời gian (Higher Timeframe) =====
  // Khung hiện tại (currentInterval) luôn đóng vai trò "khung nhỏ nhất" để bắt điểm entry chính xác.
  // TF_ORDER là thứ tự chuẩn tất cả khung của sàn; getHigherTFs() trả về TOÀN BỘ khung LỚN HƠN khung đang xem,
  // giới hạn trong dải 5m-1M. Chỉ cần MỘT trong các khung lớn đó có tín hiệu Long/Short là đủ điều kiện xác nhận.
  const TF_ORDER = ['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'];
  function getHigherTFs() {
    const idx = TF_ORDER.indexOf(currentInterval);
    const minIdx = TF_ORDER.indexOf('5m'); // dải quét khung lớn luôn bắt đầu tối thiểu từ 5m theo đúng yêu cầu
    const startIdx = Math.max(idx + 1, minIdx);
    return TF_ORDER.slice(startIdx).filter(tf => TF_ORDER.indexOf(tf) > idx);
  }
  let htfCandlesMap = {}; // { '15m': [...], '4h': [...], '1d': [...] ... } nến của TỪNG khung lớn hơn khung đang xem
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

  // ==========================================
  // KHỐI LƯỢNG GIAO DỊCH 24H THỰC TẾ của TỪNG coin — dùng để tự tính ngưỡng "Cá Heo" hợp lý theo
  // đúng thanh khoản hiện tại của từng coin (xem getCoinBaseline bên dưới), thay vì 3 mức cố định
  // dễ lỗi thời khi thị trường biến động (coin tăng/giảm thanh khoản theo thời gian).
  // ==========================================
  let symbolQuoteVolume = new Map(); // symbol -> khối lượng 24h tính bằng USDT (quoteVolume)
  function fetchAllQuoteVolumes() {
    fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        data.forEach(t => {
          if (!t.symbol || !t.symbol.endsWith('USDT')) return;
          const v = parseFloat(t.quoteVolume);
          if (v > 0) symbolQuoteVolume.set(t.symbol, v);
        });
      })
      .catch(err => console.log('Không tải được khối lượng 24h toàn thị trường:', err));
  }
  fetchAllQuoteVolumes();
  setInterval(fetchAllQuoteVolumes, 5 * 60 * 1000); // khối lượng đổi liên tục -> làm mới mỗi 5 phút

  
  let whaleLogs = JSON.parse(localStorage.getItem('ok_whale_logs') || '[]');
  // Theo yêu cầu: Nhật ký Cá Mập được LƯU MÃI MÃI, không tự động xóa bớt theo thời gian/số lượng.
  // Log chỉ mất đi khi người dùng tự bấm nút xóa (xóa lẻ hoặc "Xóa tất cả" cho từng coin).
  // Lưu ý: localStorage của trình duyệt có giới hạn dung lượng (thường ~5-10MB tùy trình duyệt).
  // Nếu dữ liệu tích lũy quá lâu và vượt quá giới hạn này, hệ thống sẽ báo cho bạn biết (xem
  // hàm persistWhaleLogsSafe bên dưới) thay vì tự ý xóa bớt log cũ.
  let whaleStorageFullWarned = false;
  function persistWhaleLogsSafe() {
    try {
      localStorage.setItem('ok_whale_logs', JSON.stringify(whaleLogs));
    } catch (e) {
      // Bộ nhớ trình duyệt đã đầy — KHÔNG tự xóa log cũ, chỉ báo cho người dùng biết 1 lần
      // để họ chủ động vào dọn bớt (nhật ký vẫn hiển thị đầy đủ trong phiên làm việc hiện tại).
      if (!whaleStorageFullWarned) {
        whaleStorageFullWarned = true;
        console.warn('Bộ nhớ trình duyệt (localStorage) đã đầy, không thể lưu thêm nhật ký cá mập mới. Vui lòng vào Nhật ký Cá Mập và xóa bớt các mục cũ.', e);
      }
    }
  }

  // Hệ số ảnh hưởng thị trường (k) và ngưỡng sàn — dùng để tính ngưỡng "Cá Heo" ĐỘNG cho từng coin
  // theo khối lượng giao dịch 24h thực tế: baseline = k * sqrt(khối lượng 24h), có sàn tối thiểu.
  let whaleImpactFactor = parseFloat(localStorage.getItem('ok_whale_factor')) || 3.5;
  let whaleFloor = parseFloat(localStorage.getItem('ok_whale_floor')) || 5000;
  let aiVolMult = parseFloat(localStorage.getItem('ok_ai_vol')) || 2.5;

  let candlesData = []; let volumesData = [];
  let candlesDataMap = new Map(); let volumesDataMap = new Map();
  // ===== Tải lịch sử vô hạn (infinite scroll-back), giống các sàn lớn =====
  // Chỉ tải trước 1000 nến gần nhất cho nhanh; khi người dùng cuộn chart về gần cây nến cũ nhất đang có,
  // tự động gọi thêm 1000 nến cũ hơn nữa (dùng endTime của Binance), nối vào đầu mảng, giữ nguyên vị trí đang xem.
  let isLoadingOlderHistory = false;
  let noMoreHistoryKey = null; // 'SYMBOL|interval' đã xác nhận tải hết lịch sử thật của coin đó
  let signalsMap = new Map(); 
  let currentWebSocket = null; let currentTickerWS = null; let whaleWS = null;
  let reconnectTimeout = null; let syncInterval = null;
  let isLiveSignalPreview = false; let liveAnalysisTimer = null;
  let lastIndicatorUpdateTs = 0; // throttle tính lại chỉ báo khi giá chạy liên tục — tránh giật máy, đặc biệt trên mobile
  // Phân tích tức thời trên nến đang chạy (chưa đóng) — throttle 1.2s (giảm từ 3s) để bắt tín hiệu MOMENTUM
  // ngay khi vol bùng nổ thay vì đợi lâu. Đây là mức cân bằng: vẫn đủ mượt trên di động vì updateAllIndicators()
  // là phần tốn CPU nhất, không phải phần dò tín hiệu. Nếu máy yếu bị giật khi thị trường biến động mạnh,
  // có thể tăng lại giá trị này lên 2000-2500.
  function scheduleLiveAIAnalysis() {
    isLiveSignalPreview = true;
    if (liveAnalysisTimer) return;
    liveAnalysisTimer = setTimeout(() => { liveAnalysisTimer = null; if (isLiveSignalPreview) runAIAnalysis(); }, 1200);
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

  // ===== LỊCH SỬ tỷ lệ Long/Short — để bộ lọc tâm lý đám đông áp dụng ĐÚNG cho TỪNG nến lịch sử khi
  // chạy AI phân tích, thay vì chỉ áp dụng cho mỗi nến hiện tại (như trước đây). Nếu không có lịch sử
  // này, các tín hiệu quá khứ hiển thị trong log sẽ KHÔNG phản ánh đúng việc lệnh có bị lọc/hủy hay
  // không nếu chạy live — gây sai lệch khi tự đánh giá hiệu suất (backtest không nhất quán với live).
  let lsHistory = []; // [{time (giây), ratio}] tăng dần theo thời gian
  let lsHistoryPtr = 0; // reset về 0 mỗi lần runAIAnalysis() duyệt lại từ đầu (xem runAIAnalysis)
  async function fetchHistoricalLSRatio(symbol = currentSymbol) {
    try {
      const res = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=500`);
      const data = await res.json();
      if (Array.isArray(data)) {
        lsHistory = data.map(d => ({ time: Math.floor(d.timestamp / 1000), ratio: parseFloat(d.longShortRatio) }))
                        .filter(d => !isNaN(d.ratio)).sort((a, b) => a.time - b.time);
      }
    } catch (e) { console.error('Không lấy được lịch sử L/S:', e); lsHistory = []; }
    lsHistoryPtr = 0;
  }
  // Lấy tỷ lệ L/S THẬT tại đúng thời điểm của 1 cây nến (con trỏ tăng dần, tái sử dụng cho cả vòng lặp)
  function lsRatioAt(time) {
    if (!lsHistory.length) return null;
    while (lsHistoryPtr < lsHistory.length - 1 && lsHistory[lsHistoryPtr + 1].time <= time) lsHistoryPtr++;
    return lsHistory[lsHistoryPtr].time <= time ? lsHistory[lsHistoryPtr].ratio : null;
  }
  fetchHistoricalLSRatio(currentSymbol);
  setInterval(() => fetchHistoricalLSRatio(currentSymbol), 5 * 60 * 1000); // đúng chu kỳ gốc 5 phút của Binance

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
      const res = await fetchWithTimeout('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text), undefined, 5000);
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
  // Timeout riêng cho mỗi request: nếu 1 nguồn bị treo (mạng chậm/CORS) thay vì chờ vô thời hạn,
  // ta huỷ sau NEWS_FETCH_TIMEOUT_MS rồi rơi ngay sang nguồn kế tiếp — đây là nguyên nhân chính khiến
  // trước đây tin tức "đứng hình" không hiển thị khi 1 API bị treo thay vì báo lỗi ngay.
  const NEWS_FETCH_TIMEOUT_MS = 8000;
  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || NEWS_FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...(options || {}), signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
  async function tryFetchJson(url, headers) {
    const res = await fetchWithTimeout(url, headers ? { headers } : undefined);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  async function tryFetchText(url) {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.text();
  }
  // Nhiều nguồn dự phòng: nếu nguồn 1 bị chặn CORS/rate-limit trên môi trường host (VD GitHub Pages),
  // tự động rơi (fallback) sang nguồn kế tiếp thay vì phụ thuộc vào đúng 1 API duy nhất.
  // ⚠️ DÁN API KEY MIỄN PHÍ CỦA BẠN VÀO ĐÂY (lấy tại https://openapi.coinstats.app — đăng ký free, không cần thẻ):
  const COINSTATS_API_KEY = '313dc547ca709e58f70d59acdfb04abb8478274b42e2';
  const RSS2JSON_API_KEY = 'zxyhlq2gqvcsvq9lovek0xkvrttzwv2dxbdnr8kh';

  const NEWS_SOURCES = [
    ...(COINSTATS_API_KEY ? [{ type: 'coinstats', url: 'https://openapiv1.coinstats.app/news?limit=20' }] : []),
    { type: 'cryptocompare', url: 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest' },
    // Lấy thẳng RSS gốc qua CORS-proxy (allorigins) — không lệ thuộc quota dùng-chung của rss2json.com
    // nên đỡ bị lỗi "Too Many Requests" vào giờ cao điểm như trước.
    { type: 'directrss', url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.coindesk.com/arc/outboundfeeds/rss/'), source: 'CoinDesk' },
    { type: 'directrss', url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://cointelegraph.com/rss'), source: 'Cointelegraph' },
    { type: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.coindesk.com/arc/outboundfeeds/rss/') + '&count=20&api_key=' + RSS2JSON_API_KEY },
    { type: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://cointelegraph.com/rss') + '&count=20&api_key=' + RSS2JSON_API_KEY }
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
  // Phân tích trực tiếp XML của RSS (dùng cho nguồn 'directrss' lấy qua CORS-proxy)
  function parseRssXmlItems(xmlText, sourceName) {
    try {
      const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
      if (doc.querySelector('parsererror')) return [];
      const nodes = Array.from(doc.querySelectorAll('item')).slice(0, 20);
      return nodes.map(node => {
        const get = (tag) => { const el = node.getElementsByTagName(tag)[0]; return el ? el.textContent.trim() : ''; };
        const link = get('link');
        const pubDate = get('pubDate');
        const ts = Date.parse(pubDate);
        // Ảnh minh hoạ: thử media:content, enclosure, rồi tới thẻ ảnh trong description
        let img = '';
        const media = node.getElementsByTagName('media:content')[0] || node.getElementsByTagName('enclosure')[0];
        if (media && media.getAttribute) img = media.getAttribute('url') || '';
        if (!img) {
          const desc = get('description');
          const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (m) img = m[1];
        }
        return {
          id: link || get('guid') || (sourceName + get('title')),
          title: get('title').replace(/<[^>]*>/g, ''),
          url: link || '#',
          source: sourceName,
          time: isNaN(ts) ? Math.floor(Date.now() / 1000) : Math.floor(ts / 1000),
          img
        };
      }).filter(it => it.title);
    } catch (e) {
      console.warn('Lỗi phân tích RSS XML:', e);
      return [];
    }
  }
  async function fetchMarketNews() {
    let lastError = null;
    for (const src of NEWS_SOURCES) {
      try {
        let items;
        if (src.type === 'directrss') {
          const xmlText = await tryFetchText(src.url);
          items = parseRssXmlItems(xmlText, src.source || 'Nguồn tin');
        } else {
          const headers = src.type === 'coinstats' ? { 'X-API-KEY': COINSTATS_API_KEY } : undefined;
          const json = await tryFetchJson(src.url, headers);
          items = parseSourceItems(src.type, json);
        }
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
  // Phân loại "cá" = (1) xác định coin thuộc nhóm nào (Top/Vừa/Cỏ) để lấy mức NỀN phù hợp,
  // rồi (2) nhân hệ số lên để ra 3 bậc cá trong CHÍNH nhóm coin đó. Nhờ vậy $30K trên 1 coin cỏ
  // vẫn được tính là "Cá Heo" (đáng chú ý với coin cỏ), còn trên BTC phải ≥500K mới được tính —
  // tránh tình trạng lệnh $30K trên BTC (xảy ra liên tục) làm log bị spam vô nghĩa.
  const FISH_TIERS = [
    { key: 'whale', name: 'Cá Voi', icon: 'whale', color: '#c084fc', mult: 10 },  // 10x mức nền của coin
    { key: 'shark', name: 'Cá Mập', icon: 'shark', color: '#ffc93c', mult: 3 },   // 3x mức nền của coin
    { key: 'dolphin', name: 'Cá Heo', icon: 'dolphin', color: '#38bdf8', mult: 1 } // đúng bằng mức nền (ngưỡng tối thiểu để được ghi nhận)
  ];
  // Mức nền dự phòng (chỉ dùng trong lúc CHỜ tải xong khối lượng 24h thực — xem fetchAllQuoteVolumes),
  // giữ nguyên giá trị mặc định cũ để không có "khoảng trống" thiếu ngưỡng ngay khi vừa mở trang.
  const FALLBACK_BASELINE = { top: 500000, mid: 100000, small: 30000 };
  const FALLBACK_MID_CAPS = ['SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT'];

  // Ngưỡng "Cá Heo" của MỖI coin được tính ĐỘNG theo khối lượng giao dịch 24h thực tế của chính coin
  // đó: baseline = k * sqrt(volume24h), theo quy luật ảnh hưởng giá kiểu căn bậc hai (square-root price
  // impact) — một lệnh có cùng % TÁC ĐỘNG lên giá thường tỉ lệ với căn bậc hai của khối lượng thị trường,
  // không phải tỉ lệ thuận tuyến tính. Nhờ vậy: BTC/ETH thanh khoản khổng lồ cần lệnh rất to mới đáng chú ý,
  // coin cỏ thanh khoản mỏng thì lệnh nhỏ hơn nhiều đã có thể coi là "cá" — và ngưỡng luôn tự cập nhật theo
  // đúng thanh khoản THỰC TẾ hiện tại của từng coin, không còn phụ thuộc danh sách nhóm coin cố định/lỗi thời.
  function getCoinBaseline(symbol) {
    const s = symbol.toUpperCase();
    const vol = symbolQuoteVolume.get(s);
    if (vol && vol > 0) return Math.max(whaleFloor, whaleImpactFactor * Math.sqrt(vol));
    // Chưa tải xong khối lượng 24h thực (vừa mở trang) -> tạm dùng phân loại tĩnh dự phòng
    if (s.includes('BTC') || s.includes('ETH')) return FALLBACK_BASELINE.top;
    if (FALLBACK_MID_CAPS.includes(s)) return FALLBACK_BASELINE.mid;
    return FALLBACK_BASELINE.small;
  }
  function getFishTier(usd, symbol) {
    const base = getCoinBaseline(symbol);
    for (const t of FISH_TIERS) { if (usd >= base * t.mult) return t; } // duyệt từ bậc cao (x10) xuống thấp (x1)
    return null; // Dưới cả mức nền -> quá nhỏ so với coin này, không ghi nhận
  }
  function fishTierByKey(key) { return FISH_TIERS.find(t => t.key === key) || FISH_TIERS[1]; }
  const modal = document.getElementById('settings-modal');
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('set-whale-factor').value = whaleImpactFactor;
    document.getElementById('set-whale-floor').value = whaleFloor;
    document.getElementById('set-ai-vol').value = aiVolMult;
    modal.classList.add('show');
  });
  const closeModal = () => modal.classList.remove('show');
  document.getElementById('close-modal').addEventListener('click', closeModal); document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('btn-save-modal').addEventListener('click', () => {
    const newFactor = parseFloat(document.getElementById('set-whale-factor').value);
    const newFloor = parseFloat(document.getElementById('set-whale-floor').value);
    const newAiVol = parseFloat(document.getElementById('set-ai-vol').value);
    if (isNaN(newFactor) || newFactor <= 0 || isNaN(newFloor) || newFloor < 0 || isNaN(newAiVol) || newAiVol <= 0) {
      alert('Giá trị không hợp lệ: Hệ số ảnh hưởng phải > 0, Ngưỡng tối thiểu phải ≥ 0, Độ bùng nổ Vol AI phải > 0.');
      return;
    }
    whaleImpactFactor = newFactor; whaleFloor = newFloor; aiVolMult = newAiVol;
    localStorage.setItem('ok_whale_factor', whaleImpactFactor);
    localStorage.setItem('ok_whale_floor', whaleFloor);
    localStorage.setItem('ok_ai_vol', aiVolMult);
    closeModal(); runAIAnalysis();
  });

  // INIT UI
  document.getElementById('symbol-input').value = currentSymbol.replace('USDT', '');
  document.getElementById('color-up').value = currentUpColor; document.getElementById('color-down').value = currentDownColor;
  (function initAIRobotState() {
    const fab = document.getElementById('ai-robot-fab');
    const stateLabel = document.getElementById('ai-robot-state-label');
    if (!fab) return;
    fab.classList.toggle('on', aiEnabled);
    fab.classList.toggle('off', !aiEnabled);
    fab.setAttribute('aria-pressed', String(aiEnabled));
    if (stateLabel) stateLabel.textContent = aiEnabled ? 'Đang bật' : 'Đang tắt';
  })();
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
    // Ép nhãn crosshair (đường kẻ dọc bám con trỏ) dùng CÙNG hàm giờ địa phương với tooltip — trước đây thư
    // viện tự định dạng theo UTC nên lệch múi giờ so với tooltip tự viết bên dưới.
    localization: { timeFormatter: crosshairTimeFormatter },
    rightPriceScale: { minimumWidth: 90, alignLabels: true, scaleMargins: { top: 0.15, bottom: 0.15 } },
    // FIX: bật "trượt theo quán tính" (kinetic/momentum) khi KÉO-THẢ CHUỘT, y hệt cảm giác lăn
    // ngón tay trên điện thoại rồi thả ra vẫn thấy biểu đồ trôi thêm một đoạn rồi từ từ dừng lại.
    // Mặc định thư viện lightweight-charts chỉ bật hiệu ứng này cho TOUCH (ngón tay), còn kéo bằng
    // CHUỘT thì dừng khựng ngay khi thả nút — đây là lý do kéo/trượt bằng chuột cảm giác không mượt
    // bằng lăn con lăn dọc trên trục giá (vốn đã được tự viết easing riêng bên dưới).
    kineticScroll: { mouse: true, touch: true },
    crosshair: {
      // Normal: đường kẻ dọc (thời gian) vẫn tự bám sát nến gần nhất như bình thường, nhưng đường kẻ ngang (giá)
      // đi CHÍNH XÁC theo vị trí con trỏ chuột — đúng chuẩn Binance/TradingView. Trước đây để Magnet nên đường
      // kẻ ngang bị "hút cứng" vào đúng giá đóng cửa của nến gần nhất, tạo cảm giác con trỏ không theo chuột.
      // Chế độ Magnet chỉ nên bật tạm thời khi đang dùng công cụ VẼ (để điểm vẽ hút chuẩn vào nến) — xem toolBtns bên dưới.
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
  const chartPrice = LightweightCharts.createChart(document.getElementById('chart-price'), { ...commonOptions, timeScale: { timeVisible: true, visible: false, rightOffset: 0, tickMarkFormatter: axisTickFormatter } });
  const candleSeries = chartPrice.addSeries(LightweightCharts.CandlestickSeries, { upColor: currentUpColor, downColor: currentDownColor, borderVisible: false, wickUpColor: currentUpColor, wickDownColor: currentDownColor });
  const candleSeriesMarkers = LightweightCharts.createSeriesMarkers(candleSeries, []);
  const volumePane = document.getElementById('chart-volume');
  const chartVolume = LightweightCharts.createChart(volumePane, {
    ...commonOptions,
    timeScale: { timeVisible: true, visible: false, rightOffset: 0, tickMarkFormatter: axisTickFormatter },
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
  const chartRSI = LightweightCharts.createChart(document.getElementById('chart-rsi'), { ...commonOptions, timeScale: { timeVisible: true, rightOffset: 0, tickMarkFormatter: axisTickFormatter }, rightPriceScale: { minimumWidth: 90, scaleMargins: { top: 0.15, bottom: 0.15 } } });

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
      // Đồng bộ mốc thời gian tuyệt đối giữa các pane
      reg.chart.setCrosshairPosition(0, time, getPaneCrosshairSeries(paneId));
    });
  }
  function attachCrosshairSync(chart, paneId) {
    chart.subscribeCrosshairMove(param => {
      if (isResizing) return;
      if (!isChartPointValid(paneId, param)) { clearAllCrosshairs(); updateAllLegendValues(); return; }
      syncCrosshairAcrossCharts(paneId, param.time);
      updateAllLegendValues(param.time);
    });
  }
  // Khi người dùng kéo chuột để LƯỚT/ZOOM biểu đồ (pan/zoom), lightweight-charts tự ẩn crosshair trong lúc kéo
  // và chỉ vẽ lại khi có thêm một lần di chuột MỚI — nên cảm giác như dấu + "tắt" mỗi lần thả chuột ra, phải
  // rê chuột lại mới hiện. Cách khắc phục: ngay khi thả chuột, tự "giả lập" thêm một sự kiện mousemove tại
  // đúng vị trí con trỏ hiện tại để buộc thư viện vẽ lại crosshair NGAY, không cần người dùng di chuột thêm.
  function forceCrosshairRefresh(el, clientX, clientY) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return; // chuột đã rời khỏi pane này, khỏi giả lập
    const evt = new MouseEvent('mousemove', { clientX, clientY, bubbles: true, cancelable: true, view: window });
    el.dispatchEvent(evt);
  }
  function attachPanEndCrosshairFix(paneId) {
    const el = getPaneChartElement(paneId);
    if (!el) return;
    const handler = e => { const x = e.clientX, y = e.clientY; requestAnimationFrame(() => forceCrosshairRefresh(el, x, y)); };
    el.addEventListener('mouseup', handler);
    el.addEventListener('pointerup', handler);
  }

  // =========================================================
  // GIỮ CROSSHAIR "SỐNG" KHI DỮ LIỆU REAL-TIME CẬP NHẬT (fix chuẩn như Binance/TradingView)
  // ---------------------------------------------------------
  // Gốc lỗi: mỗi khi 1 series gọi update()/setData() (ví dụ mỗi tick giá từ WebSocket), thư viện
  // lightweight-charts coi đó là dữ liệu đã đổi nên TỰ ẨN crosshair, và chỉ vẽ lại khi có một sự
  // kiện mousemove MỚI. Trên coin sôi động, tick giá đến liên tục nhiều lần/giây -> crosshair bị ẩn
  // đi ẩn lại liên tục dù người dùng đang để chuột đứng yên hẳn trong chart -> cảm giác "biến mất".
  // Cách khắc phục CHUẨN (đúng cách các sàn lớn làm): luôn theo dõi vị trí con trỏ chuột hiện tại,
  // và ngay sau mỗi lần dữ liệu cập nhật, tự "giả lập" lại 1 sự kiện mousemove tại đúng vị trí đó để
  // ép thư viện vẽ lại crosshair NGAY LẬP TỨC — không cần người dùng di chuột thêm.
  // CẬP NHẬT: thay vì chỉ vẽ lại crosshair MỘT LẦN mỗi khi có dữ liệu mới (cách cũ), giờ chạy hẳn một
  // vòng lặp requestAnimationFrame LIÊN TỤC trong suốt thời gian chuột còn nằm trong chart-wrapper.
  // Nhờ vậy crosshair luôn được ép vẽ lại đều đặn (~16 lần/giây, đủ mượt, khỏi tốn CPU như 60fps) bất kể
  // nguyên nhân khiến thư viện tự ẩn nó là gì (tick giá, setData chỉ báo, đồng bộ độ rộng trục giá, resize
  // pane, v.v...) — không cần phải rải keepCrosshairAlive() ở từng nơi gọi setData/update nữa. Vòng lặp tự
  // dừng hẳn (không chạy nền) ngay khi chuột rời khỏi chart, nên không tốn tài nguyên khi không ai rê chuột.
  let lastPointerX = null, lastPointerY = null, pointerInsideChartWrapper = false;
  let crosshairKeepAliveLoopId = null;
  let lastKeepAliveRefreshTs = 0;
  // FIX: khi người dùng đang GIỮ CHUỘT (kéo giãn trục giá bên phải, kéo pan/zoom, kéo bản vẽ...),
  // tuyệt đối không được bắn thêm mousemove giả — nếu không thư viện chart sẽ nhận nhầm vị trí
  // chuột (lẫn giữa toạ độ thật đang kéo và toạ độ giả lập cũ), khiến thao tác KÉO TRỤC GIÁ ĐỂ
  // GIÃN/CO CHIỀU DỌC BIỂU ĐỒ (giống Binance/TradingView) bị giật/lag hoặc không bám theo chuột.
  let isAnyMouseButtonDown = false;
  function crosshairKeepAliveLoop(ts) {
    if (!pointerInsideChartWrapper) { crosshairKeepAliveLoopId = null; return; } // chuột đã rời chart -> dừng vòng lặp
    if (!isResizing && !isAnyMouseButtonDown && lastPointerX !== null && (ts - lastKeepAliveRefreshTs >= 60)) {
      lastKeepAliveRefreshTs = ts;
      Object.values(paneRegistry).forEach(reg => {
        const el = document.getElementById(reg.elId);
        forceCrosshairRefresh(el, lastPointerX, lastPointerY);
      });
    }
    crosshairKeepAliveLoopId = requestAnimationFrame(crosshairKeepAliveLoop);
  }
  function ensureCrosshairKeepAliveLoop() {
    if (crosshairKeepAliveLoopId === null) crosshairKeepAliveLoopId = requestAnimationFrame(crosshairKeepAliveLoop);
  }
  (function trackPointerForCrosshairKeepAlive() {
    const wrapper = document.getElementById('chart-wrapper');
    if (!wrapper) return;
    wrapper.addEventListener('mousemove', e => {
      lastPointerX = e.clientX; lastPointerY = e.clientY; pointerInsideChartWrapper = true;
      ensureCrosshairKeepAliveLoop(); // khởi động vòng lặp ngay khi chuột vừa vào chart (nếu chưa chạy)
    });
    wrapper.addEventListener('mouseleave', () => { pointerInsideChartWrapper = false; });
    // Chuột rời khỏi cả cửa sổ trình duyệt (ví dụ kéo qua tab khác) cũng phải coi là đã rời chart
    window.addEventListener('blur', () => { pointerInsideChartWrapper = false; isAnyMouseButtonDown = false; });
    // FIX: bắt đầu giữ chuột trong vùng chart (kéo trục giá / pan / zoom / kéo bản vẽ...) -> tạm
    // dừng NGAY việc bắn mousemove giả, để thao tác kéo gốc của thư viện chart không bị nhiễu.
    // Dùng 'pointerdown' (bắt cả chuột lẫn bút cảm ứng) thay vì chỉ 'mousedown' cho chắc chắn.
    wrapper.addEventListener('pointerdown', e => { if (e.button === 0 || e.pointerType !== 'mouse') isAnyMouseButtonDown = true; });
    // Thả chuột ở BẤT KỲ ĐÂU trên trang (kể cả ngoài vùng chart) đều phải tính là đã thả — dùng window
    // để không bị "kẹt" trạng thái nếu người dùng kéo ra ngoài rồi mới thả chuột.
    window.addEventListener('pointerup', () => { isAnyMouseButtonDown = false; syncPriceScaleWidths(); });
    window.addEventListener('pointercancel', () => { isAnyMouseButtonDown = false; });
  })();
  // Giữ lại hàm cũ để những nơi đang gọi keepCrosshairAlive() (ngay sau setData/update) vẫn ép vẽ lại
  // NGAY LẬP TỨC thay vì chờ tới khung hình kế tiếp của vòng lặp ở trên — vẫn hữu ích cho các bước nhảy
  // lớn như đổi coin/khung (scrollToRealTime), nên không cần xoá các lệnh gọi keepCrosshairAlive() cũ.
  function keepCrosshairAlive() {
    if (!pointerInsideChartWrapper || lastPointerX === null || isResizing || isAnyMouseButtonDown) return;
    Object.values(paneRegistry).forEach(reg => {
      const el = document.getElementById(reg.elId);
      forceCrosshairRefresh(el, lastPointerX, lastPointerY);
    });
  }

  // =========================================================
  // FIX: LĂN CHUỘT (WHEEL) TRÊN TRỤC GIÁ DỌC BÊN PHẢI -> CO GIÃN TRỤC GIÁ (ZOOM DỌC), ĐÚNG CHUẨN
  // CÁC SÀN LỚN (Binance/TradingView) — thay vì mặc định thư viện lightweight-charts coi MỌI thao
  // tác lăn chuột trong pane (kể cả khi con trỏ đang nằm ngay trên dải trục giá) là zoom TRỤC THỜI
  // GIAN (zoom ngang), y hệt như lăn chuột ở giữa biểu đồ — khiến trục giá không hề co giãn được
  // bằng con lăn như người dùng mong đợi.
  // Cách làm: bắt sự kiện wheel ở PHA "CAPTURE" ngay trên chính div chứa chart (chạy trước khi thư
  // viện — vốn gắn listener sâu hơn bên trong — kịp xử lý), kiểm tra xem con trỏ có đang nằm trong
  // đúng dải bề rộng trục giá hiện tại hay không. Nếu có: chặn hẳn hành vi mặc định (preventDefault +
  // stopPropagation để thư viện không zoom ngang nữa).
  // BẢN 1 (scaleMargins): mỗi lần lăn nhảy đúng MỘT bước cố định, và lề tối đa chỉ ~48%/bên -> vừa
  // không mượt vừa không "thả ga" được.
  // BẢN 2 (setVisibleRange nhảy thẳng): dùng đúng API co giãn khoảng giá của thư viện nên hết bị chặn
  // bởi tỉ lệ lề, NHƯNG vẫn áp dụng NGAY LẬP TỨC kết quả mỗi lần lăn — con lăn chuột vật lý bắn ra
  // từng "nấc" RỜI RẠC (không liên tục như trackpad), nên giữa 2 nấc, biểu đồ bị NHẢY THẲNG từ trạng
  // thái này sang trạng thái khác chứ không hề có chuyển động — đây chính là lý do vẫn thấy "giật/
  // không mượt" dù hệ số zoom đã tính đúng cường độ lăn.
  // BẢN 3 (bản này) — THÊM HẲN MỘT VÒNG LẶP ANIMATION NỘI SUY (easing), y hệt cách Binance/TradingView/
  // Google Maps làm: mỗi lần lăn chỉ CẬP NHẬT "điểm đích" (targetRange) cần tới, còn khoảng giá THỰC
  // TẾ đang hiển thị (currentRange) sẽ được một vòng lặp requestAnimationFrame liên tục "đuổi theo"
  // điểm đích đó theo từng khung hình với hệ số nội suy (EASE) — tạo chuyển động mượt liên tục dù bạn
  // lăn từng nấc rời rạc trên chuột thường. Nếu lăn tiếp trong lúc đang nội suy, điểm đích chỉ được
  // dời thêm — vòng lặp animation vẫn đang chạy sẽ tự đuổi theo điểm đích MỚI luôn, không bị giật.
  const AXIS_WHEEL_SENSITIVITY = 0.0011; // càng lớn càng zoom nhanh mỗi "nấc" lăn chuột (đã giảm ~1/2 cho dễ điều khiển hơn)
  const AXIS_WHEEL_EASE = 0.25; // hệ số đuổi theo đích mỗi khung hình (0-1) — càng nhỏ càng mượt/trễ, càng lớn càng bám sát/nhanh
  const AXIS_WHEEL_RESYNC_GAP_MS = 250; // ngừng lăn quá lâu -> lần lăn tiếp theo coi là cử chỉ MỚI, đọc lại đúng khoảng giá thực tế hiện tại (tránh lệch nếu autoScale/pan/đổi coin đã thay đổi nó ở nơi khác)
  function attachPriceAxisWheelZoom(chart, paneId) {
    const el = getPaneChartElement(paneId);
    if (!el) return;
    let currentRange = null; // khoảng giá ĐANG hiển thị trên chart tại thời điểm hiện tại (được nội suy dần)
    let targetRange = null;  // khoảng giá ĐÍCH cần đuổi tới, cập nhật mỗi lần có sự kiện wheel mới
    let animId = null;
    let lastWheelTs = 0;
    function animateStep() {
      let ps;
      try { ps = chart.priceScale('right'); } catch (err) { animId = null; return; }
      if (!currentRange || !targetRange) { animId = null; return; }
      const span = Math.max(targetRange.to - targetRange.from, Number.EPSILON);
      const nf = currentRange.from + (targetRange.from - currentRange.from) * AXIS_WHEEL_EASE;
      const nt = currentRange.to + (targetRange.to - currentRange.to) * AXIS_WHEEL_EASE;
      currentRange = { from: nf, to: nt };
      try { ps.setAutoScale(false); ps.setVisibleRange(currentRange); } catch (err) { animId = null; return; }
      const closeEnough = Math.abs(targetRange.from - nf) < span * 0.0004 && Math.abs(targetRange.to - nt) < span * 0.0004;
      if (closeEnough) { currentRange = { from: targetRange.from, to: targetRange.to }; try { ps.setVisibleRange(currentRange); } catch (err) {} animId = null; return; }
      animId = requestAnimationFrame(animateStep);
    }
    el.addEventListener('wheel', e => {
      let axisWidth = 90;
      let ps;
      try { ps = chart.priceScale('right'); axisWidth = ps.width() || 90; } catch (err) { return; }
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width - axisWidth) return; // con trỏ không nằm trên trục giá -> để thư viện tự xử lý (zoom ngang) như cũ
      e.preventDefault(); e.stopPropagation();
      const now = performance.now();
      if (!targetRange || (now - lastWheelTs) > AXIS_WHEEL_RESYNC_GAP_MS) {
        // Bắt đầu một cử chỉ lăn MỚI (hoặc lần đầu) -> đọc đúng khoảng giá thực tế hiện tại làm gốc,
        // tránh dùng targetRange cũ đã lệch do double-click reset / kéo / đổi coin ở nơi khác.
        let r = null;
        try { r = ps.getVisibleRange(); } catch (err) {}
        if (!r) return;
        currentRange = { from: r.from, to: r.to };
        targetRange = { from: r.from, to: r.to };
      }
      lastWheelTs = now;
      // Lăn xuống (deltaY > 0) = zoom ra (khoảng giá hiển thị RỘNG hơn); lăn lên = zoom vào (HẸP hơn).
      // Dùng hàm mũ để hệ số luôn tỉ lệ thuận mượt mà với cường độ lăn, không có bước nhảy cứng.
      const factor = Math.exp(e.deltaY * AXIS_WHEEL_SENSITIVITY);
      const center = (targetRange.from + targetRange.to) / 2;
      const halfSpan = Math.max((targetRange.to - targetRange.from) / 2 * factor, Number.EPSILON);
      targetRange = { from: center - halfSpan, to: center + halfSpan };
      if (animId === null) animId = requestAnimationFrame(animateStep);
    }, { passive: false, capture: true });
  }

  // =========================================================
  // FIX: LĂN CHUỘT (WHEEL) Ở GIỮA BIỂU ĐỒ -> ZOOM NGANG (TRỤC THỜI GIAN), ÁP DỤNG ĐÚNG VÒNG LẶP
  // NỘI SUY (easing) Y HỆT bản zoom dọc trên trục giá bên trên (attachPriceAxisWheelZoom), để cảm
  // giác lăn chuột zoom ngang mượt/liên tục giống hệt zoom dọc, thay vì thư viện mặc định nhảy
  // thẳng từng nấc rời rạc theo đúng cường độ con lăn vật lý (giật, không mượt).
  // Cách làm: bắt 'wheel' ở PHA CAPTURE ngay trên div chứa chart (chạy trước khi thư viện xử lý),
  // chỉ can thiệp khi đây là cử chỉ ZOOM (lăn dọc deltaY chiếm ưu thế) và con trỏ KHÔNG nằm trên
  // dải trục giá bên phải (dải đó đã được attachPriceAxisWheelZoom xử lý riêng ở trên).
  // Nếu là cử chỉ CUỘN NGANG bằng trackpad (deltaX chiếm ưu thế) thì bỏ qua, để thư viện tự pan
  // ngang như bình thường — không đụng tới, tránh làm hỏng thao tác vuốt 2 ngón cuộn ngang.
  // Điểm neo (center) khi zoom được tính đúng NGAY TẠI VỊ TRÍ CON TRỎ (giống Binance/TradingView)
  // thay vì luôn neo giữa màn hình, để lăn chuột ở đâu thì "phóng to" đúng ngay chỗ đó.
  const TIME_WHEEL_SENSITIVITY = 0.0011; // đã giảm ~1/2 so với ban đầu cho dễ điều khiển hơn
  const TIME_WHEEL_EASE = 0.25;
  const TIME_WHEEL_RESYNC_GAP_MS = 250;
  function attachTimeWheelZoom(chart, paneId) {
    const el = getPaneChartElement(paneId);
    if (!el) return;
    const ts = chart.timeScale();
    let currentRange = null; // khoảng logical ĐANG hiển thị (nội suy dần mỗi khung hình)
    let targetRange = null;  // khoảng logical ĐÍCH cần đuổi tới
    let animId = null;
    let lastWheelTs = 0;
    function animateStep() {
      if (!currentRange || !targetRange) { animId = null; return; }
      const span = Math.max(targetRange.to - targetRange.from, Number.EPSILON);
      const nf = currentRange.from + (targetRange.from - currentRange.from) * TIME_WHEEL_EASE;
      const nt = currentRange.to + (targetRange.to - currentRange.to) * TIME_WHEEL_EASE;
      currentRange = { from: nf, to: nt };
      try { ts.setVisibleLogicalRange(currentRange); } catch (err) { animId = null; return; }
      const closeEnough = Math.abs(targetRange.from - nf) < span * 0.0004 && Math.abs(targetRange.to - nt) < span * 0.0004;
      if (closeEnough) { currentRange = { from: targetRange.from, to: targetRange.to }; try { ts.setVisibleLogicalRange(currentRange); } catch (err) {} animId = null; return; }
      animId = requestAnimationFrame(animateStep);
    }
    el.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // cuộn ngang trackpad -> để thư viện tự pan, không can thiệp
      let axisWidth = 90;
      let ps;
      try { ps = chart.priceScale('right'); axisWidth = ps.width() || 90; } catch (err) {}
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x >= rect.width - axisWidth) return; // con trỏ đang nằm trên trục giá -> đã có attachPriceAxisWheelZoom lo
      e.preventDefault(); e.stopPropagation();
      const now = performance.now();
      if (!targetRange || (now - lastWheelTs) > TIME_WHEEL_RESYNC_GAP_MS) {
        let r = null;
        try { r = ts.getVisibleLogicalRange(); } catch (err) {}
        if (!r) return;
        currentRange = { from: r.from, to: r.to };
        targetRange = { from: r.from, to: r.to };
      }
      lastWheelTs = now;
      // Lăn xuống (deltaY > 0) = zoom ra (thấy nhiều nến hơn); lăn lên = zoom vào (thấy ít nến, nến to hơn).
      const factor = Math.exp(e.deltaY * TIME_WHEEL_SENSITIVITY);
      // Neo đúng tại vị trí con trỏ chuột thay vì luôn neo giữa, để zoom "vào đúng chỗ đang trỏ".
      let center = (targetRange.from + targetRange.to) / 2;
      try {
        const cursorLogical = ts.coordinateToLogical(x);
        if (cursorLogical !== null && cursorLogical !== undefined && isFinite(cursorLogical)) center = cursorLogical;
      } catch (err) {}
      targetRange = { from: center + (targetRange.from - center) * factor, to: center + (targetRange.to - center) * factor };
      if (animId === null) animId = requestAnimationFrame(animateStep);
    }, { passive: false, capture: true });
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
    // FIX: không đo/ép lại độ rộng trục trong lúc người dùng đang giữ chuột kéo (kéo giãn trục giá,
    // pan, zoom...) — áp lại option cho priceScale giữa chừng một thao tác kéo sẽ làm nó bị "giật".
    // Vẫn sẽ tự đồng bộ lại ngay khi thả chuột (xem listener 'pointerup' ở trên) nên không mất tác dụng.
    if (document.hidden || isAnyMouseButtonDown) return;
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
  // Cuộn gần tới mép trái (cây nến cũ nhất đang tải) -> tự động nạp thêm 1000 nến cũ hơn.
  priceTimeScale.subscribeVisibleLogicalRangeChange(range => { if (range && range.from < 50) loadOlderHistory(); });


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
  function fmtTime(t){
    const d = new Date(t * 1000);
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  // Định dạng đầy đủ ngày/tháng/năm + giờ:phút:giây, dùng cho Nhật ký Cá Mập (nhận mốc thời gian tính bằng mili-giây, ví dụ Date.now())
  function fmtFullDateTime(ms){
    const d = new Date(ms);
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  // =========================================================
  // ĐỒNG BỘ THỜI GIAN TUYỆT ĐỐI GIỮA TOOLTIP <-> NHÃN CROSSHAIR <-> TRỤC THỜI GIAN
  // ---------------------------------------------------------
  // Nguyên nhân lỗi lệch giờ trước đây: tooltip dùng toLocaleString() -> giờ ĐỊA PHƯƠNG của máy người xem,
  // trong khi trục thời gian & nhãn crosshair của lightweight-charts dùng bộ định dạng MẶC ĐỊNH của thư viện,
  // vốn luôn tính theo UTC bất kể múi giờ trình duyệt. Với người xem ở Việt Nam (UTC+7) thì 2 nơi lệch nhau
  // đúng 7 tiếng — y hệt hiện tượng "07:30" ở tooltip nhưng trục dưới lại hiện giờ khác.
  // Cách fix chuẩn (giống Binance/OKX): TẤT CẢ nơi hiển thị thời gian phải dùng chung 1 nguồn giờ — ở đây
  // chọn giờ địa phương của thiết bị người xem (real-time, đúng theo đồng hồ máy, chính xác từng phút vì
  // nến Binance trả về là mốc giây UTC epoch chuẩn, chỉ khác nhau ở cách CONVERT sang hiển thị).
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  // Định dạng nhãn trên TRỤC thời gian ngang (tick cố định) — thay cho bộ định dạng UTC mặc định của thư viện.
  function axisTickFormatter(time, tickMarkType) {
    const d = new Date(time * 1000);
    const TMT = (typeof LightweightCharts !== 'undefined' && LightweightCharts.TickMarkType) || {};
    switch (tickMarkType) {
      case TMT.Year: return String(d.getFullYear());
      case TMT.Month: return pad2(d.getMonth() + 1) + '/' + d.getFullYear();
      case TMT.DayOfMonth: return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
      case TMT.TimeWithSeconds: return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
      default: return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    }
  }
  // Định dạng nhãn thời gian đi kèm đường crosshair (đường kẻ dọc bám theo con trỏ) — phải khớp 1-1 với tooltip.
  function crosshairTimeFormatter(time) {
    const d = new Date(time * 1000);
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

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
    // lastValueVisible: true — hiển thị nhãn giá trị hiện tại của chỉ báo trên trục giá bên phải.
    // crosshairMarkerVisible: false — loại bỏ toàn bộ dấu chấm hiện ra khi rê chuột trên các đường chỉ báo (EMA/RSI/MACD/Stoch...)
    const mkLine = (color, width, extra) => chart.addSeries(LightweightCharts.LineSeries, Object.assign({ color, lineWidth: width, lineStyle, priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false, visible: ind.visible }, extra || {}));
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
      const hist = chart.addSeries(LightweightCharts.HistogramSeries, { priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: true, visible: ind.visible });
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
      timeScale: { timeVisible: true, rightOffset: 0, tickMarkFormatter: axisTickFormatter },
      leftPriceScale: { visible: false, borderVisible: false },
      rightPriceScale: { minimumWidth: 90, scaleMargins: { top: 0.15, bottom: 0.15 } }
    });
    paneRegistry[id] = { chart, elId: 'chart-' + id, homeType };
    registerTimeScale(chart.timeScale());
    attachCrosshairSync(chart, id);
    attachPanEndCrosshairFix(id);
    attachPriceAxisWheelZoom(chart, id);
    attachTimeWheelZoom(chart, id);
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
  const TOOL_POINTS = {
    trendline: 2, ray: 2, hline: 1, hray: 1, vline: 1, channel: 3, fib: 2, rect: 2, circle: 2, arrow: 2, text: 1, measure: 2,
    // ===== Nhóm ĐƯỜNG (bổ sung) =====
    infoline: 2,      // Đường thông tin: như đường xu hướng, kèm nhãn Δgiá/%/số nến/góc ngay trên đường
    extline: 2,       // Đường mở rộng: 1 đường thẳng kéo dài vô hạn CẢ HAI đầu ngay khi vẽ xong
    angle: 2,         // Góc xu hướng: đường xu hướng + đường tham chiếu ngang + cung đo góc (độ)
    crossline: 1,     // Đường chữ thập: 1 đường ngang + 1 đường dọc cắt nhau tại đúng điểm click
    // ===== Nhóm KÊNH (bổ sung) =====
    regression: 2,    // Kênh hồi quy tuyến tính: chọn 2 điểm để xác định vùng thời gian, đường trung tâm + biên trên/dưới tự tính bằng hồi quy tuyến tính
    flatchannel: 3,   // Kênh mặt phẳng đỉnh/đáy: đường chính nghiêng theo xu hướng, đường thứ 2 luôn NẰM NGANG tại điểm thứ 3
    disjointchannel: 4 // Kênh rời rạc: 2 đoạn thẳng độc lập (không bắt buộc song song), mỗi đoạn 2 điểm
  };
  // Tên hiển thị của từng loại bản vẽ — hiện thành 1 nhãn nhỏ cạnh bản vẽ khi nó đang được CHỌN,
  // giống cách TradingView hiện tên công cụ (vd "Trend Line") ngay trên đối tượng đang chọn.
  const TOOL_LABELS = {
    trendline: 'Đường xu hướng', ray: 'Tia', hline: 'Đường nằm ngang', hray: 'Tia nằm ngang',
    vline: 'Đường thẳng đứng', channel: 'Kênh song song', fib: 'Fibonacci', rect: 'Hình chữ nhật',
    circle: 'Hình tròn', arrow: 'Mũi tên', text: 'Văn bản', measure: 'Đo lường', polyline: 'Bút vẽ',
    infoline: 'Đường thông tin', extline: 'Đường mở rộng', angle: 'Góc xu hướng', crossline: 'Đường chữ thập',
    regression: 'Xu hướng hồi quy', flatchannel: 'Mặt phẳng đỉnh/đáy', disjointchannel: 'Kênh rời rạc'
  };
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
    eraser: 'Click vào 1 bản vẽ để xoá riêng bản vẽ đó',
    infoline: 'Click điểm đầu, rồi click điểm cuối — hiện sẵn Δgiá / % / số nến / góc trên đường',
    extline: 'Click 2 điểm — đường sẽ tự kéo dài vô hạn về cả hai phía',
    angle: 'Click điểm đầu, rồi click điểm cuối để đo góc xu hướng so với đường nằm ngang',
    crossline: 'Click 1 điểm để đặt đường chữ thập (ngang + dọc cắt nhau tại đó)',
    regression: 'Click điểm đầu, rồi click điểm cuối vùng thời gian — kênh hồi quy tuyến tính tự tính theo giá đóng cửa',
    flatchannel: 'Click 2 điểm vẽ đường chính, click điểm thứ 3 để đặt mức NẰM NGANG (đỉnh hoặc đáy)',
    disjointchannel: 'Click 2 điểm vẽ đoạn thẳng thứ nhất, rồi click 2 điểm tiếp để vẽ đoạn thẳng thứ hai (không cần song song)'
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
    if (typeof d.extend !== 'string') d.extend = 'none'; // 'none' | 'right' | 'left' | 'both' — chỉ áp dụng cho trendline/channel
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

  // ===== Tooltip riêng cho thanh công cụ vẽ — thay tooltip mặc định thô của trình duyệt bằng
  // 1 khung nhỏ đồng bộ theme: icon lấy trực tiếp từ nút + tên công cụ đậm + mô tả ngắn bên dưới
  // (nếu title có dạng "Tên — mô tả"), hiện sát mép phải nút, giống TradingView. =====
  (function setupToolbarTooltips() {
    const tt = document.createElement('div');
    tt.className = 'custom-tooltip';
    tt.innerHTML = '<span class="ctt-icon"></span><span class="ctt-text"><span class="ctt-label"></span><span class="ctt-sub"></span></span>';
    document.body.appendChild(tt);
    const ttIcon = tt.querySelector('.ctt-icon'), ttLabel = tt.querySelector('.ctt-label'), ttSub = tt.querySelector('.ctt-sub');
    let showTimer = null, hideTimer = null, currentEl = null;

    function positionTooltip(el) {
      const r = el.getBoundingClientRect();
      tt.style.left = '0px'; tt.style.top = '0px'; // reset trước khi đo lại kích thước thật
      const ttw = tt.offsetWidth, tth = tt.offsetHeight;
      let left = r.right + 10, top = r.top + r.height / 2 - tth / 2;
      if (left + ttw > window.innerWidth - 6) left = r.left - ttw - 10; // hết chỗ bên phải -> lật sang trái
      top = Math.max(6, Math.min(window.innerHeight - tth - 6, top));
      tt.style.left = left + 'px'; tt.style.top = top + 'px';
    }
    function showFor(el) {
      const raw = el.getAttribute('data-tt'); if (!raw) return;
      const parts = raw.split(' — ');
      ttLabel.textContent = parts[0];
      ttSub.textContent = parts[1] || ''; ttSub.style.display = parts[1] ? 'block' : 'none';
      const svg = el.querySelector('svg'); ttIcon.innerHTML = svg ? svg.outerHTML : '';
      ttIcon.style.display = svg ? 'flex' : 'none';
      currentEl = el;
      tt.classList.add('show');
      positionTooltip(el);
    }
    function hide() { tt.classList.remove('show'); currentEl = null; }

    document.querySelectorAll('.drawing-toolbar [title]').forEach(el => {
      const label = el.getAttribute('title');
      el.setAttribute('data-tt', label);
      el.removeAttribute('title'); // tắt hẳn tooltip mặc định của trình duyệt để không hiện chồng 2 lớp
      el.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return; // trên cảm ứng không hiện tooltip hover
        clearTimeout(hideTimer);
        showTimer = setTimeout(() => showFor(el), 260);
      });
      el.addEventListener('pointerleave', () => {
        clearTimeout(showTimer);
        hideTimer = setTimeout(hide, 60);
      });
      el.addEventListener('pointerdown', hide);
    });
    // Nếu nút đang hiện tooltip bị cuộn/kéo ra khỏi vị trí (vd flyout mở ra), cập nhật lại vị trí
    window.addEventListener('scroll', () => { if (currentEl) positionTooltip(currentEl); }, true);
  })();


  // ===== Thanh công cụ nổi cho bản vẽ đang được chọn (đổi màu / độ dày / ẩn / nhân bản / khoá / xoá) =====
  const objToolbar = document.createElement('div');
  objToolbar.className = 'draw-obj-toolbar';
  objToolbar.innerHTML = `
    <button type="button" class="dot-swatch" data-act="color" title="Đổi màu"><span class="dot-swatch-inner"></span></button>
    <input type="color" class="dot-color-input">
    <button type="button" data-act="width" title="Độ dày nét">2px</button>
    <button type="button" data-act="extend" title="Kéo dài đường">${icon('extend')}</button>
    <button type="button" data-act="eye" title="Ẩn/hiện bản vẽ này">${icon('eye')}</button>
    <button type="button" data-act="dup" title="Nhân bản">${icon('copy')}</button>
    <button type="button" data-act="lock" title="Khoá bản vẽ này">${icon('unlock')}</button>
    <button type="button" class="danger" data-act="del" title="Xoá bản vẽ này">${icon('x')}</button>
  `;
  document.getElementById('chart-price').appendChild(objToolbar);
  const objColorInput = objToolbar.querySelector('.dot-color-input');
  const objSwatchDot = objToolbar.querySelector('.dot-swatch-inner');
  const objWidthBtn = objToolbar.querySelector('[data-act="width"]');
  const objExtendBtn = objToolbar.querySelector('[data-act="extend"]');
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
    const canExtend = d.type === 'trendline' || d.type === 'channel' || d.type === 'flatchannel';
    objExtendBtn.style.display = canExtend ? '' : 'none';
    if (canExtend) {
      const mode = d.extend || 'none';
      objExtendBtn.classList.toggle('toggle-on', mode !== 'none');
      const modeLabel = { none: 'Tắt', right: 'Bên phải', left: 'Bên trái', both: 'Cả 2 bên' }[mode];
      objExtendBtn.title = 'Kéo dài đường (hiện: ' + modeLabel + ') — click để đổi';
    }
    objEyeBtn.innerHTML = d.hidden ? icon('eyeOff') : icon('eye');
    objEyeBtn.classList.toggle('toggle-on', !!d.hidden);
    objLockBtn.innerHTML = d.locked ? icon('lock') : icon('unlock');
    objLockBtn.classList.toggle('toggle-on', !!d.locked);
  }

  const OBJ_TOOLBAR_W = 208, OBJ_TOOLBAR_H = 30, OBJ_TOOLBAR_GAP = 12; // dùng chung giữa vị trí toolbar và nhãn tên bản vẽ, tránh chồng lấp
  function updateObjToolbar() {
    const d = getSelectedDrawing();
    const p = d ? anchorFor(d) : null;
    if (!p) { objToolbar.classList.remove('show'); return; }
    refreshObjToolbarContent(d);
    objToolbar.style.left = Math.max(2, Math.min(W - OBJ_TOOLBAR_W - 2, p.x - OBJ_TOOLBAR_W / 2)) + 'px';
    objToolbar.style.top = Math.max(2, p.y - OBJ_TOOLBAR_H - OBJ_TOOLBAR_GAP) + 'px';
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
    if (act === 'extend') {
      if (isDrawLocked(d)) { showDrawToast('Bản vẽ đang bị khoá'); return; }
      const order = ['none', 'right', 'left', 'both'];
      const cur = order.indexOf(d.extend || 'none');
      d.extend = order[(cur + 1) % order.length];
      saveDrawings(); refreshObjToolbarContent(d);
      const modeLabel = { none: 'Tắt', right: 'Bên phải', left: 'Bên trái', both: 'Cả 2 bên' }[d.extend];
      showDrawToast('Kéo dài đường: ' + modeLabel);
      return;
    }
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
  const INTERVAL_SEC = {
    '1m': 60, '3m': 180, '5m': 300, '15m': 900, '30m': 1800,
    '1h': 3600, '2h': 7200, '4h': 14400, '6h': 21600, '8h': 28800, '12h': 43200,
    '1d': 86400, '3d': 259200, '1w': 604800, '1M': 2592000
  };
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
  // Tính 2 đầu mút SAU KHI áp dụng chế độ "kéo dài" (extend) của Đường xu hướng / Kênh giá, giống
  // tuỳ chọn "Extend Line" (None/Left/Right/Both) của TradingView. 'right' kéo dài đầu p2 ra mép phải
  // (dùng lại đúng công thức extendRay theo hướng p1->p2); 'left' kéo dài đầu p1 ra mép trái (đảo chiều,
  // dùng extendRay theo hướng p2->p1); 'both' áp dụng cả hai; 'none' giữ nguyên đoạn thẳng gốc.
  function extendedEndpoints(d, p1, p2) {
    const mode = d.extend || 'none';
    let a = p1, b = p2;
    if (mode === 'right' || mode === 'both') b = extendRay(p1, p2);
    if (mode === 'left' || mode === 'both') a = extendRay(p2, p1);
    return { a, b };
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
  // ===== Đường thông tin: hiện Δgiá / % / số nến / góc ngay trên đường, giống "Info Line" của TradingView =====
  function drawInfoLineLabel(d, p1, p2) {
    const priceDiff = d.points[1].price - d.points[0].price;
    const pct = d.points[0].price ? (priceDiff / d.points[0].price) * 100 : 0;
    const bars = countBarsBetween(d.points[0].time, d.points[1].time);
    const angleDeg = (Math.atan2(-(p2.y - p1.y), p2.x - p1.x) * 180 / Math.PI);
    const up = priceDiff >= 0;
    const label = (up ? '+' : '') + fmt(priceDiff) + '  (' + (up ? '+' : '') + pct.toFixed(2) + '%)  •  ' + bars + ' nến  •  ' + angleDeg.toFixed(1) + '°';
    dctx.font = '600 10.5px "JetBrains Mono", monospace';
    const tw = dctx.measureText(label).width;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const boxW = tw + 12, boxH = 18;
    const bx = Math.max(2, Math.min(W - boxW - 2, mx - boxW / 2)), by = my - boxH - 6;
    dctx.fillStyle = d.color;
    if (dctx.roundRect) { dctx.beginPath(); dctx.roundRect(bx, by, boxW, boxH, 3); dctx.fill(); } else dctx.fillRect(bx, by, boxW, boxH);
    dctx.fillStyle = textColorFor(d.color); dctx.textBaseline = 'middle'; dctx.textAlign = 'left';
    dctx.fillText(label, bx + 6, by + boxH / 2 + 0.5);
  }
  // ===== Góc xu hướng: đường + đường tham chiếu ngang (nét đứt) + cung tròn đo góc (độ) so với phương ngang =====
  function drawAngleTool(d, p1, p2) {
    dctx.save();
    dctx.globalAlpha = 0.55; dctx.setLineDash([4, 3]);
    lineRaw(p1.x, p1.y, p2.x, p1.y);
    dctx.setLineDash([]); dctx.globalAlpha = 1;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const angleRad = Math.atan2(dy, dx); // toạ độ màn hình: y dương là xuống dưới
    const angleDeg = -(angleRad * 180 / Math.PI); // đảo dấu để ra góc theo quy ước toán học (lên trên = dương)
    const r = Math.max(16, Math.min(38, Math.hypot(dx, dy) * 0.35));
    dctx.beginPath();
    if (angleRad >= 0) dctx.arc(p1.x, p1.y, r, 0, angleRad); else dctx.arc(p1.x, p1.y, r, angleRad, 0);
    dctx.globalAlpha = 0.8; dctx.stroke(); dctx.globalAlpha = 1;
    const label = Math.abs(angleDeg).toFixed(1) + '°';
    dctx.font = '700 11px "JetBrains Mono", monospace';
    const tw = dctx.measureText(label).width;
    const lx = p1.x + (dx >= 0 ? r + 8 : -r - 8 - tw);
    const ly = p1.y + (dy >= 0 ? 16 : -12);
    dctx.textBaseline = 'middle'; dctx.textAlign = 'left'; dctx.fillStyle = d.color;
    dctx.fillText(label, lx, ly);
    dctx.restore();
  }
  // ===== Kênh hồi quy tuyến tính: đường trung tâm = hồi quy giá đóng cửa theo thời gian trong vùng chọn,
  // 2 biên song song cách trung tâm ±2 lần độ lệch chuẩn (std dev) của phần dư — đúng nguyên lý TradingView "Linear Regression Channel" =====
  function computeRegression(d) {
    if (!d.points[0] || !d.points[1] || !candlesData.length) return null;
    const t1 = d.points[0].time, t2 = d.points[1].time;
    const lo = Math.min(t1, t2), hi = Math.max(t1, t2);
    const bars = candlesData.filter(c => c.time >= lo && c.time <= hi);
    const n = bars.length;
    if (n < 2) return null;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    bars.forEach((c, i) => { sumX += i; sumY += c.close; sumXY += i * c.close; sumXX += i * i; sumYY += c.close * c.close; });
    const meanX = sumX / n, meanY = sumY / n;
    const denom = sumXX - n * meanX * meanX;
    const slope = denom !== 0 ? (sumXY - n * meanX * meanY) / denom : 0;
    const intercept = meanY - slope * meanX;
    let sumSqErr = 0;
    bars.forEach((c, i) => { const pred = intercept + slope * i; sumSqErr += (c.close - pred) * (c.close - pred); });
    const stdDev = Math.sqrt(sumSqErr / n);
    // Hệ số tương quan Pearson (Pearson's R) — TradingView luôn hiện số này ở góc bắt đầu kênh hồi quy
    // (vd 0.94...), cho biết mức độ khớp của đường xu hướng tuyến tính với giá thực tế.
    const covXY = sumXY / n - meanX * meanY;
    const varX = sumXX / n - meanX * meanX;
    const varY = sumYY / n - meanY * meanY;
    const pearsonR = (varX > 0 && varY > 0) ? covXY / Math.sqrt(varX * varY) : 0;
    return { bars, slope, intercept, stdDev, pearsonR, t1: bars[0].time, t2: bars[n - 1].time, n };
  }
  // ===== Vị trí chấm neo THỰC SỰ nằm trên hình vẽ (không phải giá thô lúc click) =====
  // Với "regression", đường tâm hiển thị là kết quả TÍNH LẠI bằng hồi quy tuyến tính trên toàn bộ
  // giá đóng cửa trong vùng — gần như không bao giờ trùng đúng giá bạn đã click. Nếu vẽ chấm neo tại
  // giá click thô (như các tool khác), chấm sẽ lệch khỏi đường kênh, kéo tới đâu thấy "rời" tới đó.
  // Hàm này buộc chấm luôn bám đúng lên đường hồi quy đã tính, giữ nguyên thứ tự d.points[0]/[1].
  // ===== Bộ 6 chấm neo của Kênh song song, đúng chuẩn TradingView =====
  // 4 chấm TRÒN ở 2 đầu đường chính (p1,p2) và 2 đầu đường song song (o1,o2 — suy ra từ p1/p2 lệch
  // đúng độ rộng kênh dy): kéo BẤT KỲ chấm tròn nào cũng DI CHUYỂN cả kênh nguyên khối, giữ nguyên góc
  // nghiêng và độ rộng.
  // 2 chấm VUÔNG ở giữa mỗi đường (mid1 trên đường chính, mid2 trên đường song song): kéo BẤT KỲ chấm
  // vuông nào cũng chỉ ĐIỀU CHỈNH ĐỘ RỘNG kênh, giữ nguyên đường chính (p1,p2) — đúng cách TradingView
  // tách biệt "di chuyển" (chấm tròn) khỏi "đổi độ rộng" (chấm vuông).
  // ===== Độ rộng kênh (dy, tính bằng pixel) — ĐÚNG CHUẨN TradingView =====
  // TradingView neo đường song song đi CHÍNH XÁC qua điểm thứ 3 mà người dùng đã click, dù đường chính
  // (p1-p2) có bị kéo nghiêng/kéo giãn thế nào sau đó. Vì vậy độ rộng KHÔNG được lấy thẳng từ p1.y (như
  // trước đây), mà phải NỘI SUY giá trị đường chính tại đúng THỜI ĐIỂM của điểm neo thứ 3, rồi lấy hiệu
  // với giá điểm đó. Nhờ vậy, khi kéo giãn riêng p1 hoặc p2 (đổi góc nghiêng đường chính), đường song
  // song luôn tự động xoay theo và vẫn đi đúng qua điểm neo thứ 3 cố định — không bị méo/lệch bất
  // thường như công thức cũ (vốn chỉ đúng khi điểm thứ 3 trùng thời điểm với p1).
  function channelDy(d) {
    if (!d.points[2]) return null;
    const p1 = d.points[0], p2 = d.points[1];
    if (!p1 || !p2) return null;
    let mainPriceAtP3Time;
    if (p2.time === p1.time) {
      mainPriceAtP3Time = p1.price;
    } else {
      const ratio = (d.points[2].time - p1.time) / (p2.time - p1.time);
      mainPriceAtP3Time = p1.price + (p2.price - p1.price) * ratio;
    }
    const yMain = yOf(mainPriceAtP3Time), yP3 = yOf(d.points[2].price);
    if (yMain == null || yP3 == null) return null;
    return yP3 - yMain;
  }
  function channelHandleMeta(d) {
    if (d.type !== 'channel' || !d.points[2]) return null;
    const p1 = xy(d.points[0]), p2 = d.points[1] ? xy(d.points[1]) : null;
    if (!p1 || !p2) return null;
    const dy = channelDy(d);
    if (dy == null) return null;
    const o1 = { x: p1.x, y: p1.y + dy }, o2 = { x: p2.x, y: p2.y + dy };
    const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const mid2 = { x: (o1.x + o2.x) / 2, y: (o1.y + o2.y) / 2 };
    return [
      { x: p1.x, y: p1.y, shape: 'circle', role: 'p1' },
      { x: p2.x, y: p2.y, shape: 'circle', role: 'p2' },
      { x: o1.x, y: o1.y, shape: 'circle', role: 'o1' },
      { x: o2.x, y: o2.y, shape: 'circle', role: 'o2' },
      { x: mid1.x, y: mid1.y, shape: 'square', role: 'mid1' },
      { x: mid2.x, y: mid2.y, shape: 'square', role: 'mid2' },
    ];
  }
  function handleScreenPoints(d) {
    if (d.type === 'channel') {
      const meta = channelHandleMeta(d);
      if (meta) return meta.map(m => ({ x: m.x, y: m.y }));
    }
    if (d.type === 'regression') {
      const r = computeRegression(d);
      if (r) {
        const yAt = i => r.intercept + r.slope * i;
        const xStart = xOf(r.t1), yStart = yOf(yAt(0));
        const xEnd = xOf(r.t2), yEnd = yOf(yAt(r.n - 1));
        if (xStart != null && yStart != null && xEnd != null && yEnd != null) {
          const p0IsEarlier = d.points[0].time <= d.points[1].time;
          const out = [];
          out[p0IsEarlier ? 0 : 1] = { x: xStart, y: yStart };
          out[p0IsEarlier ? 1 : 0] = { x: xEnd, y: yEnd };
          return out;
        }
      }
    }
    return (d.points || []).map(xy);
  }
  function drawRegression(d) {
    const r = computeRegression(d); if (!r) return;
    const mult = 2; // độ rộng kênh mặc định = 2 lần độ lệch chuẩn, giống mặc định của TradingView
    const yAt = i => r.intercept + r.slope * i;
    const x1 = xOf(r.t1), x2 = xOf(r.t2);
    const yc1 = yOf(yAt(0)), yc2 = yOf(yAt(r.n - 1));
    const yu1 = yOf(yAt(0) + r.stdDev * mult), yu2 = yOf(yAt(r.n - 1) + r.stdDev * mult);
    const yd1 = yOf(yAt(0) - r.stdDev * mult), yd2 = yOf(yAt(r.n - 1) - r.stdDev * mult);
    if (x1 == null || x2 == null || yc1 == null || yc2 == null) return;
    const upCol = currentUpColor || '#14cc8a', downCol = currentDownColor || '#ff4757';
    if (yu1 != null && yd1 != null && yu2 != null && yd2 != null) {
      // Tô 2 sắc thái quanh đường hồi quy trung tâm — nửa trên (vượt dự đoán) theo màu tăng,
      // nửa dưới theo màu giảm, giống hiệu ứng kênh hồi quy đẹp mắt của TradingView thay vì 1 màu phẳng.
      dctx.fillStyle = upCol + '26';
      dctx.beginPath(); dctx.moveTo(x1, yu1); dctx.lineTo(x2, yu2); dctx.lineTo(x2, yc2); dctx.lineTo(x1, yc1); dctx.closePath(); dctx.fill();
      dctx.fillStyle = downCol + '26';
      dctx.beginPath(); dctx.moveTo(x1, yc1); dctx.lineTo(x2, yc2); dctx.lineTo(x2, yd2); dctx.lineTo(x1, yd1); dctx.closePath(); dctx.fill();
    }
    // 2 đường biên kênh: nét liền, đậm — đóng khung rõ ràng như TradingView
    dctx.save();
    dctx.lineWidth = d.width || 2;
    if (yu1 != null && yu2 != null) lineRaw(x1, yu1, x2, yu2);
    if (yd1 != null && yd2 != null) lineRaw(x1, yd1, x2, yd2);
    dctx.restore();
    // Đường hồi quy trung tâm: mảnh, mờ, đứt nét — chỉ mang tính tham chiếu, không lấn át 2 biên kênh
    dctx.save();
    dctx.lineWidth = Math.max(1, (d.width || 2) - 1);
    dctx.globalAlpha = 0.5;
    dctx.setLineDash([5, 4]);
    lineRaw(x1, yc1, x2, yc2);
    dctx.setLineDash([]);
    dctx.restore();
    // Nhãn hệ số tương quan Pearson's R — TradingView luôn hiện mặc định ở góc dưới-trái của kênh,
    // ngay dưới biên dưới tại điểm bắt đầu (vd "0.9442789370759614").
    if (yd1 != null) {
      dctx.font = '400 11px "JetBrains Mono", monospace';
      dctx.fillStyle = d.color;
      dctx.textAlign = 'left'; dctx.textBaseline = 'top';
      dctx.fillText(r.pearsonR.toFixed(13), x1, yd1 + 4);
    }
  }
  // ===== Kênh mặt phẳng đỉnh/đáy: đường chính nghiêng theo 2 điểm đầu, đường thứ 2 luôn NẰM NGANG
  // tại đúng mức giá của điểm thứ 3 — khác Kênh song song (đường 2 luôn song song, không nằm ngang) =====
  function drawFlatChannel(d) {
    const p1 = xy(d.points[0]), p2raw = d.points[1] ? xy(d.points[1]) : null;
    if (!p1 || !p2raw) return;
    const ext = extendedEndpoints(d, p1, p2raw); const pStart = ext.a, pEnd = ext.b;
    lineRaw(pStart.x, pStart.y, pEnd.x, pEnd.y);
    if (d.points[2]) {
      const p3 = xy(d.points[2]);
      if (p3) {
        lineRaw(pStart.x, p3.y, pEnd.x, p3.y);
        dctx.fillStyle = d.color + '1c';
        dctx.beginPath(); dctx.moveTo(pStart.x, pStart.y); dctx.lineTo(pEnd.x, pEnd.y); dctx.lineTo(pEnd.x, p3.y); dctx.lineTo(pStart.x, p3.y); dctx.closePath(); dctx.fill();
      }
    }
  }
  // ===== Kênh rời rạc: 2 đoạn thẳng độc lập, KHÔNG bắt buộc song song (khác hẳn Kênh song song) =====
  function drawDisjointChannel(d) {
    const p1 = xy(d.points[0]), p2 = d.points[1] ? xy(d.points[1]) : null;
    const p3 = d.points[2] ? xy(d.points[2]) : null, p4 = d.points[3] ? xy(d.points[3]) : null;
    if (p1 && p2) lineRaw(p1.x, p1.y, p2.x, p2.y);
    if (p3 && p4) lineRaw(p3.x, p3.y, p4.x, p4.y);
    if (p1 && p2 && p3 && p4) {
      dctx.fillStyle = d.color + '14';
      dctx.beginPath(); dctx.moveTo(p1.x, p1.y); dctx.lineTo(p2.x, p2.y); dctx.lineTo(p4.x, p4.y); dctx.lineTo(p3.x, p3.y); dctx.closePath(); dctx.fill();
    }
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
      case 'trendline': case 'ray': case 'arrow': case 'channel': case 'extline': {
        const p1 = xy(d.points[0]), p2raw = d.points[1] ? xy(d.points[1]) : null;
        if (!p1 || !p2raw) break;
        let pStart = p1, pEnd = p2raw;
        if (d.type === 'ray') pEnd = extendRay(p1, p2raw);
        else if (d.type === 'trendline' || d.type === 'channel' || d.type === 'extline') { const ext = extendedEndpoints(d, p1, p2raw); pStart = ext.a; pEnd = ext.b; }
        lineRaw(pStart.x, pStart.y, pEnd.x, pEnd.y);
        if (d.type === 'arrow') drawArrowHead(p1, p2raw);
        if (d.type === 'channel' && d.points[2]) {
          const dy = channelDy(d);
          if (dy != null) {
            lineRaw(pStart.x, pStart.y + dy, pEnd.x, pEnd.y + dy);
            dctx.fillStyle = d.color + '1c';
            dctx.beginPath(); dctx.moveTo(pStart.x, pStart.y); dctx.lineTo(pEnd.x, pEnd.y); dctx.lineTo(pEnd.x, pEnd.y + dy); dctx.lineTo(pStart.x, pStart.y + dy); dctx.closePath(); dctx.fill();
            // Đường trung tuyến đứt nét ở CHÍNH GIỮA 2 biên kênh — chỉ mang tính tham chiếu (không bắt
            // được chuột vào đây), giống hệt đường giữa mờ mà TradingView luôn hiện trong kênh song song.
            dctx.save();
            dctx.globalAlpha = 0.55;
            dctx.setLineDash([6, 5]);
            dctx.lineWidth = Math.max(1, baseW - 1);
            lineRaw(pStart.x, pStart.y + dy / 2, pEnd.x, pEnd.y + dy / 2);
            dctx.setLineDash([]);
            dctx.restore();
          }
        }
        break;
      }
      case 'infoline': { const p1 = xy(d.points[0]), p2 = d.points[1] ? xy(d.points[1]) : null; if (!p1 || !p2) break; lineRaw(p1.x, p1.y, p2.x, p2.y); if (d.points[1]) drawInfoLineLabel(d, p1, p2); break; }
      case 'angle': { const p1 = xy(d.points[0]), p2 = d.points[1] ? xy(d.points[1]) : null; if (!p1 || !p2) break; lineRaw(p1.x, p1.y, p2.x, p2.y); drawAngleTool(d, p1, p2); break; }
      case 'crossline': { const p = xy(d.points[0]); if (!p) break; dctx.setLineDash([6, 4]); lineRaw(0, p.y, W, p.y); lineRaw(p.x, 0, p.x, H); dctx.setLineDash([]); priceLabel(p.y, d.points[0].price, d.color); break; }
      case 'regression': drawRegression(d); break;
      case 'flatchannel': drawFlatChannel(d); break;
      case 'disjointchannel': drawDisjointChannel(d); break;
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
      // Kênh song song có bộ 6 chấm neo riêng (4 tròn + 2 vuông); mọi công cụ khác vẫn dùng chấm tròn
      // đơn giản như cũ tại đúng các điểm click gốc.
      const channelMeta = d.type === 'channel' ? channelHandleMeta(d) : null;
      const handleMeta = channelMeta || handleScreenPoints(d).map(p => p && { x: p.x, y: p.y, shape: 'circle' });
      handleMeta.forEach(p => {
        if (!p) return;
        // Chấm neo sắc nét, cố định đúng 1 điểm — không quầng mờ, không hiệu ứng lan tỏa,
        // giống hệt TradingView: tâm trắng nhỏ + viền mảnh theo màu nét vẽ. Chấm vuông (kéo để di
        // chuyển/đổi độ rộng cả kênh) dùng cùng tông màu nhưng hình vuông để phân biệt với chấm tròn
        // (kéo từng đầu mút), đúng ngôn ngữ hình học mà TradingView dùng.
        dctx.save();
        if (p.shape === 'square') {
          const s = HANDLE_R * 1.8;
          dctx.beginPath(); dctx.rect(p.x - s / 2, p.y - s / 2, s, s);
        } else {
          dctx.beginPath(); dctx.arc(p.x, p.y, HANDLE_R, 0, Math.PI * 2);
        }
        dctx.fillStyle = '#ffffff'; dctx.fill();
        dctx.lineWidth = 1.6; dctx.strokeStyle = d.color; dctx.stroke();
        dctx.restore();
      });
      // Nhãn tên công cụ (vd "Đường xu hướng", "Fibonacci"...) hiện ngay trên đối tượng đang chọn,
      // giống TradingView — giúp nhận biết ngay đây là bản vẽ loại gì mà không cần đoán qua icon.
      // Nhãn phải nằm HẲN PHÍA TRÊN thanh toolbar (không dùng chung vùng y với toolbar) — trước đây
      // cả hai được neo quá gần nhau (chỉ lệch 8px) nên toolbar (nằm đè trên canvas) che gần hết nhãn,
      // chỉ để lộ vài ký tự cuối cùng trông như chữ rác không rõ nghĩa (vd "...hồi quy" chỉ còn "uy").
      const label = TOOL_LABELS[d.type];
      const anchorP = anchorFor(d);
      if (label && anchorP) {
        dctx.font = '600 10.5px Inter, sans-serif';
        const tw = dctx.measureText(label).width;
        const padX = 6, boxH = 16;
        const toolbarTop = Math.max(2, anchorP.y - OBJ_TOOLBAR_H - OBJ_TOOLBAR_GAP);
        const lx = Math.max(2, Math.min(W - tw - padX * 2 - 2, anchorP.x));
        const ly = Math.max(2, toolbarTop - boxH - 6); // cách đáy toolbar 6px, không bao giờ chồng lấp
        dctx.fillStyle = d.color;
        if (dctx.roundRect) { dctx.beginPath(); dctx.roundRect(lx, ly, tw + padX * 2, boxH, 3); dctx.fill(); }
        else { dctx.fillRect(lx, ly, tw + padX * 2, boxH); }
        dctx.fillStyle = textColorFor(d.color); dctx.textBaseline = 'middle'; dctx.textAlign = 'left';
        dctx.fillText(label, lx + padX, ly + boxH / 2 + 0.5);
      }
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
      case 'trendline': case 'ray': case 'arrow': case 'channel': case 'extline': {
        const p1 = xy(d.points[0]), p2raw = d.points[1] ? xy(d.points[1]) : null; if (!p1 || !p2raw) return false;
        let pStart = p1, pEnd = p2raw;
        if (d.type === 'ray') pEnd = extendRay(p1, p2raw);
        else if (d.type === 'trendline' || d.type === 'channel' || d.type === 'extline') { const ext = extendedEndpoints(d, p1, p2raw); pStart = ext.a; pEnd = ext.b; }
        if (distToSeg(x, y, pStart.x, pStart.y, pEnd.x, pEnd.y) <= tol) return true;
        if (d.type === 'channel' && d.points[2]) { const dy = channelDy(d); if (dy != null) { if (distToSeg(x, y, pStart.x, pStart.y + dy, pEnd.x, pEnd.y + dy) <= tol) return true; } }
        return false;
      }
      case 'infoline': case 'angle': {
        const p1 = xy(d.points[0]), p2 = d.points[1] ? xy(d.points[1]) : null; if (!p1 || !p2) return false;
        return distToSeg(x, y, p1.x, p1.y, p2.x, p2.y) <= tol;
      }
      case 'crossline': { const p = xy(d.points[0]); return !!p && (Math.abs(y - p.y) <= tol || Math.abs(x - p.x) <= tol); }
      case 'regression': {
        const r = computeRegression(d); if (!r) return false;
        const mult = 2;
        const yAt = i => r.intercept + r.slope * i;
        const x1 = xOf(r.t1), x2 = xOf(r.t2);
        if (x1 == null || x2 == null) return false;
        const yc1 = yOf(yAt(0)), yc2 = yOf(yAt(r.n - 1));
        const yu1 = yOf(yAt(0) + r.stdDev * mult), yu2 = yOf(yAt(r.n - 1) + r.stdDev * mult);
        const yd1 = yOf(yAt(0) - r.stdDev * mult), yd2 = yOf(yAt(r.n - 1) - r.stdDev * mult);
        // Cho phép chọn khi click vào bất kỳ đường nào trong 3 đường (trung tâm/biên trên/biên dưới),
        // giống TradingView cho phép click vào cả 2 biên kênh để chọn, không chỉ đường giữa.
        if (yc1 != null && yc2 != null && distToSeg(x, y, x1, yc1, x2, yc2) <= tol) return true;
        if (yu1 != null && yu2 != null && distToSeg(x, y, x1, yu1, x2, yu2) <= tol) return true;
        if (yd1 != null && yd2 != null && distToSeg(x, y, x1, yd1, x2, yd2) <= tol) return true;
        return false;
      }
      case 'flatchannel': {
        const p1 = xy(d.points[0]), p2raw = d.points[1] ? xy(d.points[1]) : null; if (!p1 || !p2raw) return false;
        const ext = extendedEndpoints(d, p1, p2raw); const pStart = ext.a, pEnd = ext.b;
        if (distToSeg(x, y, pStart.x, pStart.y, pEnd.x, pEnd.y) <= tol) return true;
        if (d.points[2]) { const p3 = xy(d.points[2]); if (p3 && distToSeg(x, y, pStart.x, p3.y, pEnd.x, p3.y) <= tol) return true; }
        return false;
      }
      case 'disjointchannel': {
        const p1 = xy(d.points[0]), p2 = d.points[1] ? xy(d.points[1]) : null;
        const p3 = d.points[2] ? xy(d.points[2]) : null, p4 = d.points[3] ? xy(d.points[3]) : null;
        if (p1 && p2 && distToSeg(x, y, p1.x, p1.y, p2.x, p2.y) <= tol) return true;
        if (p3 && p4 && distToSeg(x, y, p3.x, p3.y, p4.x, p4.y) <= tol) return true;
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

  // ===== Chọn công cụ trên thanh toolbar (kể cả các mục bên trong flyout ĐƯỜNG / KÊNH) =====
  function updateDrawHint() { const el = document.getElementById('draw-hint'); if (!el) return; const t = HINT_TEXT[currentTool]; if (t) { el.textContent = t; el.style.display = 'block'; } else el.style.display = 'none'; }
  // Đánh dấu nút đang active trên toolbar. Nếu công cụ vừa chọn nằm trong 1 flyout (ĐƯỜNG/KÊNH),
  // nút chính (icon nhỏ luôn hiện trên thanh dọc) sẽ "nhớ" và đổi icon sang đúng công cụ đó —
  // giống hệt cách TradingView ghi nhớ biến thể vừa dùng làm icon đại diện cho cả nhóm.
  function updateToolButtonsUI(tool) {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tool-flyout-item').forEach(b => b.classList.remove('active'));
    const flyoutItem = document.querySelector('.tool-flyout-item[data-tool="' + tool + '"]');
    if (flyoutItem) {
      flyoutItem.classList.add('active');
      const group = flyoutItem.closest('.tool-group');
      const mainBtn = group ? group.querySelector('.tool-group-main') : null;
      if (mainBtn) {
        mainBtn.classList.add('active');
        mainBtn.setAttribute('data-tool', tool);
        const ic = flyoutItem.querySelector('.tfi-ic svg');
        if (ic) mainBtn.innerHTML = ic.outerHTML;
        const label = flyoutItem.querySelector('.tfi-label');
        if (label) mainBtn.title = label.textContent + ' — giữ để xem thêm';
      }
    } else {
      const btn = document.querySelector('.tool-btn[data-tool="' + tool + '"]');
      if (btn) btn.classList.add('active');
    }
  }
  function selectTool(tool) {
    currentTool = tool; pendingPoints = []; previewPoint = null; selectedId = null; lastPolyClick = null;
    chartPrice.applyOptions({ crosshair: { mode: tool === 'cursor' ? LightweightCharts.CrosshairMode.Normal : LightweightCharts.CrosshairMode.Magnet } });
    document.getElementById('chart-price').style.cursor = tool === 'cursor' ? 'default' : 'crosshair';
    updateDrawHint();
    updateToolButtonsUI(tool);
    closeAllFlyouts();
  }
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => selectTool(btn.getAttribute('data-tool')));
  });
  document.querySelectorAll('.tool-flyout-item[data-tool]').forEach(item => {
    item.addEventListener('click', (e) => { e.stopPropagation(); selectTool(item.getAttribute('data-tool')); });
  });
  function resetToolAfterUse() { selectTool('cursor'); }

  // ===== Flyout ĐƯỜNG / KÊNH: bấm mũi tên nhỏ cạnh icon để xem đủ biến thể, giống menu xổ ra của TradingView =====
  function closeAllFlyouts() {
    document.querySelectorAll('.tool-flyout.show').forEach(f => f.classList.remove('show'));
    document.querySelectorAll('.tool-group.flyout-open').forEach(g => g.classList.remove('flyout-open'));
  }
  document.querySelectorAll('.tool-group-caret[data-flyout]').forEach(caret => {
    caret.addEventListener('click', (e) => {
      e.stopPropagation();
      const flyout = document.getElementById(caret.getAttribute('data-flyout'));
      const group = caret.closest('.tool-group');
      const alreadyOpen = flyout.classList.contains('show');
      closeAllFlyouts();
      if (alreadyOpen) return;
      // Đưa flyout ra ngoài <body> với position:fixed để không bị thanh công cụ (overflow:hidden) cắt mất,
      // rồi tính toạ độ dựa trên vị trí thật của nhóm nút trên màn hình — tự lật xuống dưới nếu tràn viền phải/dưới.
      if (flyout.parentElement !== document.body) document.body.appendChild(flyout);
      const r = group.getBoundingClientRect();
      const fw = 236, fh = flyout.querySelectorAll('.tool-flyout-item').length * 36 + 46;
      let left = r.right + 8, top = r.top - 8;
      if (left + fw > window.innerWidth - 4) left = Math.max(4, r.left - fw - 8);
      if (top + fh > window.innerHeight - 4) top = Math.max(4, window.innerHeight - fh - 4);
      flyout.style.left = left + 'px'; flyout.style.top = top + 'px';
      flyout.classList.add('show'); group.classList.add('flyout-open');
    });
  });
  document.addEventListener('click', closeAllFlyouts);
  document.querySelectorAll('.tool-flyout').forEach(f => f.addEventListener('click', e => e.stopPropagation()));

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
      const created = addDrawing({ type: currentTool, points: pendingPoints.slice(), color: drawColor() });
      // Đường mở rộng luôn kéo dài vô hạn 2 phía ngay khi vừa vẽ xong, giống "Extended Line" của TradingView
      if (currentTool === 'extline') { created.extend = 'both'; saveDrawings(); }
      pendingPoints = []; resetToolAfterUse();
    }
  });

  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') { pendingPoints = []; previewPoint = null; selectedId = null; lastPolyClick = null; closeAllFlyouts(); selectTool('cursor'); }
    // Phím tắt công cụ Đường — giống hệt TradingView (Alt+T/H/J/V/C)
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const map = { t: 'trendline', h: 'hline', j: 'hray', v: 'vline', c: 'crossline' };
      const tool = map[e.key.toLowerCase()];
      if (tool) { e.preventDefault(); selectTool(tool); }
    }
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
    handleScreenPoints(d).forEach((p, i) => { if (!p) return; const dist = Math.hypot(x - p.x, y - p.y); if (dist <= HANDLE_TOL && dist < bestDist) { bestDist = dist; idx = i; } });
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
      // Khi đã tóm được đúng 1 CHẤM NEO (dragPointIndex >= 0), bắt đầu kéo NGAY từ pixel đầu tiên —
      // không cần chờ đủ 3px mới nhận, tránh hiện tượng điểm bị "giật" nhảy 1 phát tới vị trí chuột
      // hiện tại ngay khi vượt ngưỡng. Vùng đệm 3px chỉ còn giữ lại cho việc kéo THÂN bản vẽ (idx=-1),
      // để phân biệt với 1 cú click đơn thuần (chọn bản vẽ) không có ý định kéo.
      const dead = dragPointIndex >= 0 ? 0 : 3;
      if (Math.hypot(x - dragStartXY.x, y - dragStartXY.y) < dead) return;
      isDragging = true;
      chartPrice.applyOptions({ handleScroll: false, handleScale: false });
      objToolbar.classList.remove('show');
    }
    const tp = coordToTimePrice(x, y); if (tp.time == null || tp.price == null) return;
    if (dragPointIndex >= 0 && dragDrawing.type === 'channel' && dragOriginalPoints.length >= 3) {
      // 6 chấm neo của Kênh song song, đúng thứ tự sinh ra từ channelHandleMeta():
      // 0=p1, 1=p2 (2 đầu đường chính), 2=o1, 3=o2 (2 đầu đường song song), 4=mid1 (vuông giữa đường
      // chính), 5=mid2 (vuông giữa đường song song).
      // ĐÚNG chuẩn TradingView: mỗi chấm TRÒN ở đầu đường chính (p1, p2) là 1 điểm neo ĐỘC LẬP — kéo
      // chấm nào chỉ "kéo giãn" (đổi vị trí / góc nghiêng) đúng đầu đó, KHÔNG kéo dịch cả khối kênh.
      // Việc "di chuyển nguyên khối" chỉ xảy ra khi kéo vào THÂN đường (không trúng chấm neo nào, xử lý
      // ở nhánh dragPointIndex === -1 bên dưới) — giống hệt cách TradingView tách bạch "kéo điểm" và
      // "kéo cả hình".
      if (dragPointIndex === 0) {
        // p1: kéo giãn đầu 1 của đường chính
        dragDrawing.points[0] = snapPoint(tp.time, tp.price);
      } else if (dragPointIndex === 1) {
        // p2: kéo giãn đầu 2 của đường chính
        dragDrawing.points[1] = snapPoint(tp.time, tp.price);
      } else if (dragPointIndex === 2 || dragPointIndex === 3 || dragPointIndex === 5) {
        // o1, o2 (2 đầu đường song song) và mid2 (ô vuông giữa đường song song): cả 3 chấm này cùng
        // biểu diễn 1 giá trị duy nhất là ĐỘ RỘNG kênh (points[2]) — kéo bất kỳ chấm nào trong số này
        // đều dịch cả đường song song lên/xuống. Dùng DELTA (chênh lệch so với lúc bắt đầu kéo) thay vì
        // gán thẳng giá tuyệt đối của con trỏ, vì vị trí hiển thị của các chấm này (nhất là mid2, và o2
        // khi đường chính bị nghiêng) không trùng khớp tuyệt đối với giá trị points[2] đang lưu — gán
        // thẳng sẽ khiến chấm "giật" nhảy một phát tới đúng vị trí con trỏ ngay khi vừa bắt đầu kéo.
        // Dùng delta thì độ lệch ban đầu (nếu có) luôn = 0, kéo tới đâu chấm bám tới đó, mượt như TradingView.
        const priceDelta = tp.price - dragStartTP.price;
        dragDrawing.points[2] = { time: dragOriginalPoints[2].time, price: dragOriginalPoints[2].price + priceDelta };
      } else if (dragPointIndex === 4) {
        // mid1 (ô vuông giữa đường chính): dịch cả đường chính (p1,p2) lên/xuống theo đúng delta chuột,
        // đường song song đứng yên tại vị trí cũ — cũng chỉnh độ rộng kênh nhưng từ phía đường chính.
        const timeDelta = tp.time - dragStartTP.time, priceDelta = tp.price - dragStartTP.price;
        dragDrawing.points[0] = { time: dragOriginalPoints[0].time + timeDelta, price: dragOriginalPoints[0].price + priceDelta };
        dragDrawing.points[1] = { time: dragOriginalPoints[1].time + timeDelta, price: dragOriginalPoints[1].price + priceDelta };
      }
    } else if (dragPointIndex >= 0) {
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

  chartPrice.subscribeCrosshairMove(param => {
    if (isResizing) { return; }
    if (!param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0 || param.point.x > document.getElementById('chart-price').clientWidth || param.point.y > document.getElementById('chart-price').clientHeight) {
      clearAllCrosshairs(); updateAllLegendValues(); return;
    }
    syncCrosshairAcrossCharts('price', param.time);
    updateAllLegendValues(param.time);
  });

  attachCrosshairSync(chartVolume, 'volume');
  attachCrosshairSync(chartRSI, 'rsi');
  attachPanEndCrosshairFix('price'); attachPanEndCrosshairFix('volume'); attachPanEndCrosshairFix('rsi');
  attachPriceAxisWheelZoom(chartPrice, 'price'); attachPriceAxisWheelZoom(chartVolume, 'volume'); attachPriceAxisWheelZoom(chartRSI, 'rsi');
  attachTimeWheelZoom(chartPrice, 'price'); attachTimeWheelZoom(chartVolume, 'volume'); attachTimeWheelZoom(chartRSI, 'rsi');

  // Bộ lọc theo loại cá trên bảng Nhật ký Lệnh Cá Mập ('all' | 'whale' | 'shark' | 'dolphin')
  let whaleFilterTier = localStorage.getItem('ok_whale_filter') || 'all';

  // =========================================================
  // ICON CÁ TRỰC TIẾP TRÊN CÂY NẾN — hiển thị NGAY trên biểu đồ (không chỉ trong nhật ký) đúng
  // cây nến & đúng vị trí (bên dưới nến = lệnh MUA, bên trên nến = lệnh BÁN) mà cá heo/mập/voi
  // vừa khớp lệnh. Có bộ lọc RIÊNG (độc lập với bộ lọc của bảng nhật ký ở trên) để người dùng
  // tùy chỉnh chỉ xem 1 loại cá hoặc xem tất cả ngay trên biểu đồ.
  // =========================================================
  const FISH_EMOJI = { whale: '🐋', shark: '🦈', dolphin: '🐬' };
  // Đã đổi từ chọn-1-lúc-1-loại sang ĐA LỰA CHỌN: mỗi nút (Cá Heo/Cá Mập/Cá Voi) tự bật/tắt độc
  // lập, không loại trừ nhau -> có thể bật cùng lúc 2 (hoặc cả 3) loại để xem chung trên biểu đồ.
  const ALL_FISH_KEYS = FISH_TIERS.map(t => t.key); // ['whale','shark','dolphin']
  let chartWhaleActiveTiers = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ok_whale_chart_filter_v2') || 'null');
      if (Array.isArray(saved) && saved.length) return new Set(saved.filter(k => ALL_FISH_KEYS.includes(k)));
    } catch (e) {}
    return new Set(ALL_FISH_KEYS); // mặc định: bật cả 3 loại (tương đương "Tất cả")
  })();
  function saveChartWhaleActiveTiers() { localStorage.setItem('ok_whale_chart_filter_v2', JSON.stringify([...chartWhaleActiveTiers])); }
  let chartWhaleMarkersEnabled = localStorage.getItem('ok_whale_chart_markers_on') !== '0'; // mặc định BẬT
  let lastAiMarkers = []; // cache tín hiệu AI hiện tại, để gộp lại với icon cá mỗi khi 1 trong 2 nguồn thay đổi

  // =========================================================
  // NHẢY TỚI CÂY NẾN + LUỒNG SÁNG BAO QUANH NẾN NHẬN DIỆN
  // Khi người dùng bấm vào 1 dòng sự kiện trong Nhật ký (Tín hiệu AI hoặc Lệnh Cá Mập), biểu đồ tự
  // cuộn/canh giữa đúng cây nến chứa sự kiện đó, đồng thời hiện 1 vầng sáng (glow halo) phát sáng nhấp
  // nháy bao quanh trọn cây nến đó trong ~4 giây để người xem dễ nhận biết. Vầng sáng là 1 <div> phủ
  // (position: absolute) đặt ngay trong khung biểu đồ giá (#chart-price), được định vị lại liên tục theo
  // toạ độ pixel thật của cây nến (qua timeToCoordinate/priceToCoordinate) để luôn bám đúng vị trí kể cả
  // khi người dùng đang kéo/zoom biểu đồ trong lúc vầng sáng đang hiển thị.
  // =========================================================
  let flashHighlightState = null; // { time, rafId, timeoutId }
  let candleGlowEl = null;

  function ensureCandleGlowEl() {
    if (candleGlowEl) return candleGlowEl;
    const container = document.getElementById('chart-price');
    if (!container) return null;
    candleGlowEl = document.createElement('div');
    candleGlowEl.className = 'candle-glow-halo';
    container.appendChild(candleGlowEl);
    return candleGlowEl;
  }

  // Định vị lại vầng sáng đúng vào toạ độ pixel hiện tại (theo thời gian + biên độ giá cao/thấp) của cây nến
  function positionCandleGlow(candleTimeSec) {
    const el = candleGlowEl;
    if (!el) return false;
    const c = candlesDataMap.get(candleTimeSec);
    if (!c) { el.style.display = 'none'; return false; }
    let x, yHigh, yLow;
    try {
      x = chartPrice.timeScale().timeToCoordinate(candleTimeSec);
      yHigh = candleSeries.priceToCoordinate(c.high);
      yLow = candleSeries.priceToCoordinate(c.low);
    } catch (e) { x = null; }
    if (x == null || yHigh == null || yLow == null) { el.style.display = 'none'; return false; }
    // Bề rộng THÂN NẾN thực tế (không phải khoảng cách giữa 2 nến) — Lightweight Charts vẽ thân nến
    // xấp xỉ ~60% bar spacing hiện tại (phần còn lại là khoảng hở giữa các nến), dùng để vầng sáng
    // ôm SÁT đúng 1 cây nến thay vì loang rộng ra cả các nến bên cạnh.
    let spacing = 10;
    try {
      const isec = intervalSeconds();
      const xNext = chartPrice.timeScale().timeToCoordinate(candleTimeSec + isec);
      const xPrev = chartPrice.timeScale().timeToCoordinate(candleTimeSec - isec);
      if (xNext != null) spacing = Math.abs(xNext - x);
      else if (xPrev != null) spacing = Math.abs(x - xPrev);
    } catch (e) {}
    const candleBodyWidth = Math.max(spacing * 0.6, 5);
    const padX = 5; // viền sáng mỏng ôm sát 2 bên thân nến
    const padY = 6; // viền sáng mỏng ôm sát trên/dưới bấc nến
    const width = candleBodyWidth + padX * 2;
    const height = Math.max(Math.abs(yLow - yHigh) + padY * 2, candleBodyWidth + padY * 2);
    el.style.left = x + 'px';
    el.style.top = ((yHigh + yLow) / 2) + 'px';
    el.style.width = width + 'px';
    el.style.height = height + 'px';
    el.style.display = 'block';
    return true;
  }

  function stopFlashHighlight() {
    if (!flashHighlightState) return;
    if (flashHighlightState.rafId) cancelAnimationFrame(flashHighlightState.rafId);
    clearTimeout(flashHighlightState.timeoutId);
    flashHighlightState = null;
    if (candleGlowEl) { candleGlowEl.classList.remove('show'); candleGlowEl.style.display = 'none'; }
  }

  function flashCandleHighlight(candleTimeSec) {
    stopFlashHighlight();
    const el = ensureCandleGlowEl();
    if (!el) return;
    flashHighlightState = { time: candleTimeSec, rafId: null, timeoutId: null };
    el.classList.add('show');
    const TOTAL_MS = 4000; // tổng thời gian phát sáng theo yêu cầu (~4 giây)
    // Vòng lặp requestAnimationFrame giữ vầng sáng luôn bám đúng cây nến trong lúc người dùng kéo/zoom biểu đồ
    const tick = () => {
      if (!flashHighlightState) return;
      positionCandleGlow(flashHighlightState.time);
      flashHighlightState.rafId = requestAnimationFrame(tick);
    };
    tick();
    flashHighlightState.timeoutId = setTimeout(stopFlashHighlight, TOTAL_MS);
  }

  // Canh giữa biểu đồ vào đúng vị trí (logical index) của cây nến, giữ nguyên độ zoom (số nến) đang xem hiện tại
  function centerChartOnCandleIndex(idx) {
    let curRange = null;
    try { curRange = priceTimeScale.getVisibleLogicalRange(); } catch (e) {}
    const width = (curRange && isFinite(curRange.to - curRange.from) && (curRange.to - curRange.from) > 5) ? (curRange.to - curRange.from) : 60;
    const half = width / 2;
    try { priceTimeScale.setVisibleLogicalRange({ from: idx - half, to: idx + half }); } catch (e) {}
  }

  // Nhảy tới cây nến chứa mốc thời gian `candleTimeSec` (giây, đúng lưới thời gian của khung hiện tại).
  // Nếu cây nến đó nằm ngoài phạm vi lịch sử đã tải (quá cũ), tự động tải thêm lịch sử cũ hơn trước khi nhảy tới.
  function jumpToCandleTime(candleTimeSec) {
    if (candleTimeSec == null || !candlesData.length) return;
    // Tự cuộn TRANG (window) lên đúng khu vực biểu đồ trước, để người dùng khỏi phải tự lướt tay lên xem
    // (hữu ích nhất trên di động, nơi bảng Nhật ký thường nằm bên dưới biểu đồ). Tính thẳng toạ độ đích
    // rồi window.scrollTo thay vì dùng scrollIntoView, để tránh trường hợp trình duyệt chọn nhầm 1 khung
    // cuộn lồng bên trong (VD danh sách nhật ký có overflow-y riêng) thay vì cuộn cả trang.
    try {
      const wrapper = document.getElementById('chart-wrapper');
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - Math.max((window.innerHeight - rect.height) / 2, 12);
        window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
      }
    } catch (e) {}
    let triesLeft = 40; // chặn spam gọi API nếu vì lý do gì đó không bao giờ tìm thấy
    function attempt() {
      const idx = candlesData.findIndex(c => c.time === candleTimeSec);
      if (idx !== -1) { centerChartOnCandleIndex(idx); flashCandleHighlight(candleTimeSec); return; }
      const outOfRange = candleTimeSec >= candlesData[0].time; // không phải do thiếu lịch sử cũ -> khỏi tải thêm
      if (outOfRange || triesLeft-- <= 0 || noMoreHistoryKey === historyKey()) {
        // Không tìm đúng nến (VD dữ liệu đã bị dọn) -> vẫn nhảy tới nến gần nhất để người dùng có điểm tham chiếu
        let nearest = 0;
        for (let i = 1; i < candlesData.length; i++) { if (Math.abs(candlesData[i].time - candleTimeSec) < Math.abs(candlesData[nearest].time - candleTimeSec)) nearest = i; }
        centerChartOnCandleIndex(nearest); flashCandleHighlight(candlesData[nearest].time);
        return;
      }
      loadOlderHistory().then(() => attempt());
    }
    attempt();
  }

  // Gộp tín hiệu AI (mũi tên LONG/SHORT, B.CLX/S.CLX, VOL+/-, CHẶN) + icon cá (nếu đang bật) rồi vẽ 1 lần
  // lên candleSeriesMarkers — tránh việc 2 nguồn markers ghi đè lẫn nhau. (Vầng sáng chớp nháy nhận diện
  // cây nến được vẽ riêng bằng DOM overlay ở trên, không đi qua candleSeriesMarkers.)
  function applyAllChartMarkers() {
    const whaleMarkers = chartWhaleMarkersEnabled ? buildWhaleCandleMarkers() : [];
    const merged = lastAiMarkers.concat(whaleMarkers);
    merged.sort((a, b) => a.time - b.time);
    candleSeriesMarkers.setMarkers(merged);
  }


  // Gom các lệnh cá (đã lưu mãi mãi trong whaleLogs) của ĐÚNG coin đang xem vào đúng cây nến của
  // khung thời gian hiện tại (currentInterval), rồi tạo 1 marker nhỏ mỗi (cây nến, loại cá, chiều mua/bán).
  // Nhiều lệnh cùng loại/cùng chiều trong 1 cây nến -> gộp lại thành 1 icon kèm "x{số lệnh}" thay vì chồng chất.
  function buildWhaleCandleMarkers() {
    if (!candlesDataMap.size || !chartWhaleActiveTiers.size) return [];
    const isec = intervalSeconds();
    const buckets = new Map(); // key: "candleTime|tier|side" -> {time, tier, isBuy, count, maxUsd}
    for (const log of whaleLogs) {
      if (log.symbol !== currentSymbol) continue;
      const tier = log.tier || 'shark'; // log cũ chưa có field tier -> coi như Cá Mập để tương thích ngược
      if (!chartWhaleActiveTiers.has(tier)) continue;
      const tSec = Math.floor(log.time / 1000);
      const candleTime = Math.floor(tSec / isec) * isec;
      if (!candlesDataMap.has(candleTime)) continue; // ngoài phạm vi nến đã tải -> bỏ qua, tránh lỗi vẽ marker "treo"
      const key = candleTime + '|' + tier + '|' + (log.isBuy ? 'b' : 's');
      let b = buckets.get(key);
      if (!b) { b = { time: candleTime, tier, isBuy: log.isBuy, count: 0, maxUsd: 0 }; buckets.set(key, b); }
      b.count++; if (log.usd > b.maxUsd) b.maxUsd = log.usd;
    }
    const markers = [];
    buckets.forEach(b => {
      const tierDef = fishTierByKey(b.tier);
      const emoji = FISH_EMOJI[b.tier] || '🐋';
      markers.push({
        time: b.time,
        position: b.isBuy ? 'belowBar' : 'aboveBar', // MUA vẽ dưới nến, BÁN vẽ trên nến — cùng quy ước với tín hiệu AI
        color: tierDef.color,
        shape: 'circle',
        size: 0.75,
        text: emoji + (b.count > 1 ? ' x' + b.count : '')
      });
    });
    return markers;
  }

  function initChartWhaleFilterBar() {
    const bar = document.getElementById('chart-whale-filter-row');
    if (!bar || bar.childElementCount) return;
    // Nút "Tất cả" giờ là phím tắt bật/tắt hết 3 loại cùng lúc, không còn là 1 lựa chọn riêng loại trừ 3 nút kia.
    const renderActive = () => {
      bar.querySelectorAll('.whale-filter-btn[data-tier]').forEach(b => b.classList.toggle('active', chartWhaleActiveTiers.has(b.getAttribute('data-tier'))));
      const allBtn = bar.querySelector('.whale-filter-btn[data-all]');
      if (allBtn) allBtn.classList.toggle('active', chartWhaleActiveTiers.size === ALL_FISH_KEYS.length);
    };
    bar.innerHTML = `<button class="whale-filter-btn" data-all="1" title="Bật/tắt cả 3 loại cùng lúc"><span>Tất cả</span></button>`
      + FISH_TIERS.map(o => `<button class="whale-filter-btn" data-tier="${o.key}" style="--tier-color:${o.color}">${icon(o.icon)}<span>${o.name}</span></button>`).join('');
    renderActive();
    bar.querySelector('[data-all]').addEventListener('click', () => {
      chartWhaleActiveTiers = chartWhaleActiveTiers.size === ALL_FISH_KEYS.length ? new Set() : new Set(ALL_FISH_KEYS);
      saveChartWhaleActiveTiers(); renderActive(); applyAllChartMarkers();
    });
    bar.querySelectorAll('.whale-filter-btn[data-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-tier');
        // Click vào 1 nút chỉ bật/tắt riêng nút đó — có thể bật cùng lúc bao nhiêu loại tùy thích,
        // ví dụ chỉ cần Cá Mập + Cá Voi (bỏ Cá Heo) thì bấm để 2 nút đó sáng, 1 nút kia tắt.
        if (chartWhaleActiveTiers.has(key)) chartWhaleActiveTiers.delete(key); else chartWhaleActiveTiers.add(key);
        saveChartWhaleActiveTiers(); renderActive(); applyAllChartMarkers();
      });
    });
  }
  function refreshWhaleMarkerToggleBtn() {
    const btn = document.getElementById('btn-toggle-whale-markers');
    if (!btn) return;
    btn.classList.toggle('off', !chartWhaleMarkersEnabled);
    btn.innerHTML = `<span class="ico">${ICONS[chartWhaleMarkersEnabled ? 'eye' : 'eyeOff']}</span><span class="btn-txt">${chartWhaleMarkersEnabled ? 'Hiện' : 'Ẩn'}</span>`;
  }
  (function initChartWhaleMarkerToggle() {
    const btn = document.getElementById('btn-toggle-whale-markers');
    if (!btn) return;
    refreshWhaleMarkerToggleBtn();
    btn.addEventListener('click', () => {
      chartWhaleMarkersEnabled = !chartWhaleMarkersEnabled;
      localStorage.setItem('ok_whale_chart_markers_on', chartWhaleMarkersEnabled ? '1' : '0');
      refreshWhaleMarkerToggleBtn();
      applyAllChartMarkers();
    });
  })();
  initChartWhaleFilterBar();

  function initWhaleFilterBar() {
    const list = document.getElementById('whale-log-list');
    if (!list || document.getElementById('whale-filter-row')) return;
    const bar = document.createElement('div');
    bar.id = 'whale-filter-row'; bar.className = 'whale-filter-row';
    const options = [{ key: 'all', name: 'Tất cả' }, ...FISH_TIERS];
    bar.innerHTML = options.map(o => `<button class="whale-filter-btn${whaleFilterTier === o.key ? ' active' : ''}" data-tier="${o.key}"${o.color ? ` style="--tier-color:${o.color}"` : ''}>${o.icon ? icon(o.icon) : ''}<span>${o.name}</span></button>`).join('');
    list.parentNode.insertBefore(bar, list);
    bar.querySelectorAll('.whale-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        whaleFilterTier = btn.getAttribute('data-tier');
        localStorage.setItem('ok_whale_filter', whaleFilterTier);
        bar.querySelectorAll('.whale-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderWhaleLogs();
      });
    });
  }
  function renderWhaleLogs() {
    const list = document.getElementById('whale-log-list'); list.innerHTML = '';
    // Chỉ hiển thị nhật ký của đúng coin đang xem — dữ liệu các coin khác vẫn được ghi nhận
    // ở nền (xem startMarketWhaleWatcher) nhưng không hiện ra cho tới khi người dùng chuyển sang coin đó.
    // Log cũ (trước khi có phân loại) không có field `tier` -> coi như "Cá Mập" để tương thích ngược.
    const coinLogs = whaleLogs.filter(log => log.symbol === currentSymbol && (whaleFilterTier === 'all' || (log.tier || 'shark') === whaleFilterTier));
    if (coinLogs.length === 0) { list.innerHTML = `<div class="ai-empty">Chưa có dữ liệu cá ${whaleFilterTier === 'all' ? '' : fishTierByKey(whaleFilterTier).name.toLowerCase() + ' '}cho ${currentSymbol.replace('USDT','')}...</div>`; return; }
    const recent = coinLogs.slice().reverse();
    recent.forEach(log => {
      const tierDef = fishTierByKey(log.tier || 'shark');
      const row = document.createElement('div'); row.className = 'signal-row jumpable'; row.title = 'Nhấp để xem trên biểu đồ';
      const tone = log.isBuy ? 'up' : 'down'; const label = `${tierDef.name.toUpperCase()} ${log.isBuy ? 'MUA' : 'BÁN'}`;
      row.innerHTML = `<div style="display:flex; flex:1; padding-right: 10px;"><div class="signal-badge-wrap"><span class="signal-eyebrow" style="color:${tierDef.color}">${tierDef.name.toUpperCase()}</span><div class="signal-badge ${tone}">${icon(tierDef.icon)}<span class="lbl">${label}</span></div></div><div class="signal-body" style="flex:1;"><div class="signal-meta"><span class="signal-time">${fmtFullDateTime(log.time)}</span><span class="signal-price" style="color:var(--${tone}); font-weight:700">${fmtVol(log.usd)} USDT</span></div><div class="signal-desc">Coin: <b>${log.symbol}</b> ở mức giá <b>${fmt(log.price)}</b></div></div></div><div style="display:flex; align-items:center;"><button class="btn-delete-item" onclick="deleteSingleLog(${log.time}, true)" title="Xóa">${icon('x')}</button></div>`;
      // Bấm vào dòng nhật ký (trừ nút xóa) -> tự dịch chuyển biểu đồ tới đúng cây nến chứa lệnh cá này + chớp nháy nhận biết
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-item')) return;
        const isec = intervalSeconds();
        const candleTime = Math.floor(Math.floor(log.time / 1000) / isec) * isec;
        jumpToCandleTime(candleTime);
      });
      list.appendChild(row);
    });
  }
  initWhaleFilterBar();
  renderWhaleLogs();

  // Toast CẢNH BÁO SỚM riêng biệt với whale-toast thường: báo trước khi tín hiệu MOMENTUM chính thức
  // (dựa trên nến) kịp xác nhận, dựa trên tốc độ dòng lệnh khớp thật đang tăng vọt đột ngột.
  // Hiển thị lâu hơn toast thường (15s thay vì 6-7s) + dừng đếm giờ khi rê chuột vào + có nút đóng tay,
  // vì đây là cảnh báo cần thời gian đọc và cân nhắc, không phải thông báo lướt qua.
  function showBurstWarning(isBuy, ratio, usdAmount, price) {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    toast.className = `whale-toast burst ${isBuy ? 'buy' : 'sell'}`;
    const dirWord = isBuy ? 'MUA' : 'BÁN';
    const dirVerb = isBuy ? 'gom mua' : 'xả bán';
    toast.innerHTML = `
      <div class="whale-icon">${icon('barChart')}${isBuy ? icon('trendUp') : icon('trendDown')}</div>
      <div class="whale-content">
        <div class="whale-title">⚡ CẢNH BÁO SỚM — LỆNH ${dirWord} DỒN DẬP</div>
        <div class="whale-desc">Đang có lực ${dirVerb} mạnh bất thường, nhanh gấp ~${Math.round(ratio)} lần bình thường</div>
        <div class="whale-time">Giá hiện tại: ${fmt(price)} · Đây là cảnh báo SỚM, chưa phải tín hiệu MOMENTUM chính thức — chỉ để bạn cân nhắc theo dõi kỹ hơn</div>
      </div>
      <button class="whale-close" type="button" aria-label="Đóng">${icon('x')}</button>`;
    container.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show'));

    const DISPLAY_MS = 15000;
    let dismissTimer = null;
    const closeToast = () => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); };
    const startTimer = () => { dismissTimer = setTimeout(closeToast, DISPLAY_MS); };
    const stopTimer = () => { if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; } };
    startTimer();
    toast.addEventListener('mouseenter', stopTimer);
    toast.addEventListener('mouseleave', startTimer);
    toast.querySelector('.whale-close').addEventListener('click', () => { stopTimer(); closeToast(); });
  }

  function showWhaleAlert(isBuy, usdAmount, price, symbol, tierKey) {
    const tierDef = fishTierByKey(tierKey);
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    toast.className = `whale-toast ${isBuy ? 'buy' : 'sell'}`;
    const title = `${tierDef.name.toUpperCase()} ${isBuy ? 'MUA' : 'BÁN'}`;
    toast.innerHTML = `<div class="whale-icon">${isBuy ? icon(tierDef.icon) + icon('trendUp') : icon(tierDef.icon) + icon('trendDown')}</div><div class="whale-content"><div class="whale-title">${title}</div><div class="whale-desc">${fmtVol(usdAmount)} USDT ở giá ${fmt(price)}</div><div class="whale-time">${fmtFullDateTime(Date.now())}</div></div>`;
    container.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 6000);
    whaleLogs.push({ time: Date.now(), isBuy, usd: usdAmount, price, symbol, tier: tierDef.key });
    persistWhaleLogsSafe(); renderWhaleLogs();
    applyAllChartMarkers(); // vẽ ngay icon cá lên đúng cây nến hiện tại, không cần chờ vòng phân tích AI kế tiếp
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
    setTimeout(() => { whaleLogPersistPending = false; persistWhaleLogsSafe(); }, 2000);
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
        const tier = getFishTier(usd, symbol);
        if (tier) {
          whaleLogs.push({ time: Date.now(), isBuy, usd, price: p, symbol, tier: tier.key });
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
  // ADX (Average Directional Index) — đo ĐỘ MẠNH của xu hướng (không quan tâm chiều tăng/giảm).
  // ADX < 20-25: thị trường đang sideway/giằng co -> tín hiệu cắt EMA trong vùng này thường là NHIỄU.
  // ADX > 22-25: xu hướng đủ mạnh và rõ ràng -> tín hiệu thuận xu hướng đáng tin cậy hơn nhiều.
  // Dùng để LỌC bớt tín hiệu Long/Short giả trong các đoạn giá đi ngang có wick dài (đúng kiểu gây lỗ hay gặp).
  function computeADX(candles, period = 14) {
    const n = candles.length;
    const plusDM = new Array(n).fill(0), minusDM = new Array(n).fill(0), tr = new Array(n).fill(0);
    for (let i = 1; i < n; i++) {
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;
      plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
      minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr[i] = Math.max(hl, hc, lc);
    }
    // Làm mượt kiểu Wilder (giống ATR): tổng tích lũy period đầu, sau đó smoothing dần
    function wilderSmooth(arr) {
      const out = new Array(n).fill(0);
      let sum = 0;
      for (let i = 1; i <= period && i < n; i++) sum += arr[i];
      out[period] = sum;
      for (let i = period + 1; i < n; i++) out[i] = out[i - 1] - (out[i - 1] / period) + arr[i];
      return out;
    }
    const trSmooth = wilderSmooth(tr), plusDMSmooth = wilderSmooth(plusDM), minusDMSmooth = wilderSmooth(minusDM);
    const plusDI = new Array(n).fill(0), minusDI = new Array(n).fill(0), dx = new Array(n).fill(0), adx = new Array(n).fill(0);
    for (let i = period; i < n; i++) {
      plusDI[i] = trSmooth[i] > 0 ? (100 * plusDMSmooth[i] / trSmooth[i]) : 0;
      minusDI[i] = trSmooth[i] > 0 ? (100 * minusDMSmooth[i] / trSmooth[i]) : 0;
      const diSum = plusDI[i] + minusDI[i];
      dx[i] = diSum > 0 ? (100 * Math.abs(plusDI[i] - minusDI[i]) / diSum) : 0;
    }
    // ADX = trung bình trượt Wilder của DX qua period thứ 2
    let sumDx = 0; const start = period * 2;
    for (let i = period; i < Math.min(start, n); i++) sumDx += dx[i];
    if (start < n) adx[start] = sumDx / period;
    for (let i = start + 1; i < n; i++) adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
    return { adx, plusDI, minusDI };
  }
  function emaSlopeSignal(emaArr, lookback){ const n = emaArr.length; if (n <= lookback) return 0; const diff = (emaArr[n - 1] - emaArr[n - 1 - lookback]) / emaArr[n - 1 - lookback]; if (diff > 0.001) return 1; if (diff < -0.001) return -1; return 0; }
  function findSwings(candles, left, right){ const highs = [], lows = []; for (let i = left; i < candles.length - right; i++){ let isHigh = true, isLow = true; for (let j = i - left; j <= i + right; j++){ if (j === i) continue; if (candles[j].high >= candles[i].high) isHigh = false; if (candles[j].low <= candles[i].low) isLow = false; } if (isHigh) highs.push(candles[i].high); if (isLow) lows.push(candles[i].low); } return { highs, lows }; }
  function structureSignal(candles, windowSize, left, right){ const slice = candles.slice(Math.max(0, candles.length - windowSize)); if (slice.length < left + right + 4) return 0; const { highs, lows } = findSwings(slice, left, right); if (highs.length < 2 || lows.length < 2) return 0; const hh = highs[highs.length - 1] > highs[highs.length - 2]; const hl = lows[lows.length - 1] > lows[lows.length - 2]; const lh = highs[highs.length - 1] < highs[highs.length - 2]; const ll = lows[lows.length - 1] < lows[lows.length - 2]; if (hh && hl) return 1; if (lh && ll) return -1; return 0; }

  // ===== PHÂN KỲ GIÁ/RSI (divergence) — kỹ thuật kinh điển để bắt đáy/đỉnh SỚM hơn, thay vì chờ toàn bộ
  // EMA xếp hàng (vốn luôn xác nhận trễ). Cần chỉ số i TUYỆT ĐỐI (không phải slice) để so RSI đúng điểm. =====
  // Tìm 2 điểm xoay chiều (đáy hoặc đỉnh) gần nhất tính đến endIdx, trả về chỉ số tuyệt đối của chúng.
  function findLastTwoSwings(candles, endIdx, windowSize, left, right, wantHigh) {
    const start = Math.max(left, endIdx - windowSize);
    const found = [];
    for (let i = start; i <= endIdx - right; i++) {
      let isPivot = true;
      for (let j = Math.max(0, i - left); j <= Math.min(endIdx, i + right); j++) {
        if (j === i) continue;
        if (wantHigh ? candles[j].high >= candles[i].high : candles[j].low <= candles[i].low) { isPivot = false; break; }
      }
      if (isPivot) found.push(i);
    }
    if (found.length < 2) return null;
    return [found[found.length - 2], found[found.length - 1]];
  }
  // Phân kỳ TĂNG (bullish): giá tạo đáy sau THẤP hơn đáy trước, nhưng RSI tại đáy sau lại CAO hơn RSI đáy
  // trước -> lực bán đang suy yếu dần dù giá vẫn giảm => dấu hiệu SỚM của đáy thật (không phải bẫy giảm tiếp).
  function detectBullishDivergence(candles, rsi, endIdx, windowSize = 40, left = 3, right = 3) {
    const pair = findLastTwoSwings(candles, endIdx, windowSize, left, right, false);
    if (!pair) return false;
    const [i1, i2] = pair;
    return candles[i2].low < candles[i1].low && rsi[i2] > rsi[i1] + 2;
  }
  // Phân kỳ GIẢM (bearish): giá tạo đỉnh sau CAO hơn đỉnh trước, nhưng RSI tại đỉnh sau lại THẤP hơn RSI
  // đỉnh trước -> lực mua đang suy yếu dần dù giá vẫn tăng => dấu hiệu SỚM của đỉnh thật.
  function detectBearishDivergence(candles, rsi, endIdx, windowSize = 40, left = 3, right = 3) {
    const pair = findLastTwoSwings(candles, endIdx, windowSize, left, right, true);
    if (!pair) return false;
    const [i1, i2] = pair;
    return candles[i2].high > candles[i1].high && rsi[i2] < rsi[i1] - 2;
  }
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
        return `Chiến lược thuận xu hướng LONG đa khung THẬT: hệ thống quét toàn bộ các khung LỚN HƠN khung đang xem (trong dải 5m-1M), chỉ cần MỘT khung lớn xác nhận xu hướng tăng là đủ điều kiện. Điểm entry chính xác luôn bắt tại khung NHỎ NHẤT (${currentInterval}) đang xem khi giá phá lên EMA21. Target ưu tiên là dải trên Bollinger Bands của khung lớn GẦN NHẤT đang xác nhận — điểm chốt lời an toàn, không quá xa entry; nếu chưa khung lớn nào hợp lệ thì dùng R:R theo ATR làm dự phòng. Khuyến nghị: rủi ro tối đa 1-2% vốn/lệnh, tuân thủ SL nghiêm ngặt, có thể chốt lời 1 phần tại Target rồi dời SL về hòa vốn để bảo toàn lợi nhuận.`;
      case 'trend_short':
        return `Chiến lược thuận xu hướng SHORT đa khung THẬT: hệ thống quét toàn bộ các khung LỚN HƠN khung đang xem (trong dải 5m-1M), chỉ cần MỘT khung lớn xác nhận xu hướng giảm là đủ điều kiện. Điểm entry chính xác luôn bắt tại khung NHỎ NHẤT (${currentInterval}) đang xem khi giá gãy xuống EMA21. Target ưu tiên là dải dưới Bollinger Bands của khung lớn GẦN NHẤT đang xác nhận — điểm chốt lời an toàn, không quá xa entry; nếu chưa khung lớn nào hợp lệ thì dùng R:R theo ATR làm dự phòng. Khuyến nghị: rủi ro tối đa 1-2% vốn/lệnh, tuân thủ SL nghiêm ngặt, có thể chốt lời 1 phần tại Target rồi dời SL về hòa vốn để bảo toàn lợi nhuận.`;
      case 'reversal_short':
        return `Chiến lược ĐẢO CHIỀU (Wyckoff Buying Climax): khối lượng đột biến kèm bấc nến trên dài sau một nhịp tăng mạnh, RSI quá mua — bên mua đuối sức, dòng tiền lớn có thể đang phân phối/chốt lời${s.divergenceConfirmed ? '. XÁC NHẬN THÊM bởi phân kỳ giảm (giá tạo đỉnh cao hơn nhưng RSI tạo đỉnh thấp hơn) — độ tin cậy cao hơn' : ' (chưa có phân kỳ RSI xác nhận thêm — độ tin cậy trung bình, nên vào lệnh nhỏ hơn bình thường)'}. Đây là lệnh NGƯỢC xu hướng đang diễn ra nên rủi ro cao hơn tín hiệu thuận xu hướng — SL đặt sát trên đỉnh nến climax, target chỉ hồi về vùng trung bình (EMA21/50), không kỳ vọng đảo chiều toàn bộ xu hướng lớn.`;
      case 'reversal_long':
        return `Chiến lược ĐẢO CHIỀU (Wyckoff Selling Climax): khối lượng đột biến kèm bấc nến dưới dài sau một nhịp giảm mạnh, RSI quá bán — bên bán đuối sức, có lực bắt đáy${s.divergenceConfirmed ? '. XÁC NHẬN THÊM bởi phân kỳ tăng (giá tạo đáy thấp hơn nhưng RSI tạo đáy cao hơn) — độ tin cậy cao hơn' : ' (chưa có phân kỳ RSI xác nhận thêm — độ tin cậy trung bình, nên vào lệnh nhỏ hơn bình thường)'}. Đây là lệnh NGƯỢC xu hướng đang diễn ra nên rủi ro cao hơn tín hiệu thuận xu hướng — SL đặt sát dưới đáy nến climax, target chỉ hồi về vùng trung bình (EMA21/50), không kỳ vọng đảo chiều toàn bộ xu hướng lớn.`;
      case 'climax_buy':
        return `Buying Climax: khối lượng đột biến kèm bấc nến trên dài sau một nhịp tăng — dấu hiệu bên mua đuối sức, dòng tiền lớn có thể đang chốt lời/phân phối. Nên thận trọng khi mở Long mới, cân nhắc chốt lời một phần vị thế Long đang nắm giữ, tránh mua đuổi (FOMO).`;
      case 'climax_sell':
        return `Selling Climax: khối lượng đột biến kèm bấc nến dưới dài sau một nhịp giảm — dấu hiệu bên bán đuối sức, có thể xuất hiện lực bắt đáy. Nên thận trọng khi mở Short mới, cân nhắc chốt lời một phần vị thế Short đang nắm giữ, tránh bán đuổi theo cảm xúc.`;
      case 'vol_spike':
        return `Chiến lược MOMENTUM ngắn hạn: khối lượng vượt trội xác nhận lực ${s.tone === 'up' ? 'mua' : 'bán'} đang chiếm ưu thế tại vùng giá này. Khác với tín hiệu THUẬN XU HƯỚNG, tín hiệu này CHƯA đòi hỏi các khung lớn hơn đồng thuận nên độ tin cậy thấp hơn — R:R đặt thấp hơn (1:1.3), SL sát hơn để kiểm soát rủi ro. Phù hợp cho lệnh lướt sóng ngắn, không nên vào khối lượng lớn như tín hiệu thuận xu hướng đầy đủ.`;
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
    if(!aiEnabled){ lastAiMarkers = []; applyAllChartMarkers(); aiList.innerHTML='<div class="ai-empty">AI Đang tắt. Bật công tắc để phân tích.</div>'; const sb = document.getElementById('ai-stats-bar'); if (sb) sb.innerHTML=''; return;}
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
    const adx14 = computeADX(candlesData, 14).adx; // đo độ mạnh xu hướng — lọc bớt tín hiệu trong vùng sideway
    const bbLocal = computeBollinger(closes, 20, 2); // BB khung hiện tại — dùng riêng để lọc "climax phải nằm NGOÀI dải BB" (cực trị thống kê thật), không phụ thuộc chỉ báo BB người dùng có bật hiển thị hay không

    const signals = [];
    function addSignal(sig) { signals.push(sig); if (!signalsMap.has(sig.time)) signalsMap.set(sig.time, []); signalsMap.get(sig.time).push(sig); }
    function signalIconName(s) {
      if (s.type === 'trend_long') return 'trendUp';
      if (s.type === 'trend_short') return 'trendDown';
      if (s.type === 'reversal_long') return 'trendUp';
      if (s.type === 'reversal_short') return 'trendDown';
      if (s.type === 'vol_spike') return 'barChart';
      if (s.type === 'climax_buy' || s.type === 'climax_sell') return 'alertTriangle';
      if (s.type === 'fng_block') return 'shield';
      return 'target';
    }
    // Phân loại chú thích: THUẬN XU HƯỚNG (đi theo trend đã xác nhận) vs ĐẢO CHIỀU (bắt đáy/đỉnh kiểu Wyckoff,
    // rủi ro cao hơn, đi ngược xu hướng hiện tại) vs MOMENTUM (bùng nổ volume ngắn hạn, chưa đa khung xác nhận)
    function signalCategoryLabel(s) {
      if (s.type === 'reversal_long' || s.type === 'reversal_short') return 'AI TÍN HIỆU · ĐẢO CHIỀU';
      if (s.type === 'vol_spike') return 'AI TÍN HIỆU · MOMENTUM';
      if (s.type === 'climax_buy' || s.type === 'climax_sell') return 'WYCKOFF';
      return 'AI TÍN HIỆU · THUẬN XU HƯỚNG';
    }
    // ===== Xác nhận xu hướng đa khung THẬT (quét toàn bộ khung LỚN HƠN trong dải 5m-1M) =====
    // Chỉ cần MỘT trong các khung lớn hơn khung đang xem có tín hiệu Long/Short rõ ràng là đủ điều kiện
    // xác nhận xu hướng -> khung NHỎ NHẤT (currentInterval) đang xem luôn được dùng để bắt entry chính xác.
    const bbIndForHtf = indicators.find(ind => ind.type === 'bb');
    const htfBBPeriod = bbIndForHtf ? bbIndForHtf.period : 20;
    const htfBBMult = bbIndForHtf ? bbIndForHtf.mult : 2;
    const higherTFs = getHigherTFs(); // toàn bộ khung lớn hơn khung đang xem, sắp xếp tăng dần (nhỏ -> lớn)
    const htfInfos = higherTFs.map(tf => {
      const candles = htfCandlesMap[tf] || [];
      if (candles.length < Math.max(60, htfBBPeriod + 5)) return null;
      return { tf, candles, ptr: 0, trend: computeHorizonTrend(candles, 21, 50, 10, 100, 3, 3).trend, bb: computeBollinger(candles.map(c => c.close), htfBBPeriod, htfBBMult) };
    }).filter(Boolean);
    // Nếu chưa có khung lớn nào tải xong dữ liệu (vừa mở app/đổi coin), KHÔNG chặn tín hiệu — dùng lại xác nhận nội bộ như cũ.
    // (Điều kiện xác nhận HTF strict — htfConfirmLongStrict/htfConfirmShortStrict — được tính lại mỗi vòng lặp bên dưới.)
    // Dò nến của 1 khung lớn cụ thể gần nhất có thời gian <= time của nến LTF hiện tại (con trỏ tăng dần, dùng lại cho mỗi khung)
    function htfIdxAt(h, time) {
      if (!h.candles.length) return -1;
      while (h.ptr < h.candles.length - 1 && h.candles[h.ptr + 1].time <= time) h.ptr++;
      return h.candles[h.ptr].time <= time ? h.ptr : -1;
    }

    let lastLongIdx = -9999, lastShortIdx = -9999; const cooldownBars = 20; // tăng từ 10 -> 20: giãn cách giữa các tín hiệu, tránh dồn cụm tín hiệu liên tiếp trong cùng 1 đợt sóng
    lsHistoryPtr = 0; // duyệt lại candlesData từ đầu mỗi lần chạy -> con trỏ lịch sử L/S cũng phải về 0
    let lastClimaxBuyIdx = -9999, lastClimaxSellIdx = -9999; const climaxCooldownBars = 8;
    const climaxLookback = 10;
    let lastVolLongIdx = -9999, lastVolShortIdx = -9999; const volCooldownBars = 6;
    let pendingClimax = null; // { idx, dir:'buy'|'sell', high, low, close, divergenceConfirmed } — chờ xác nhận ở NẾN KẾ TIẾP trước khi vào lệnh thật, tránh bẫy climax giả (false exhaustion)
    // Ứng viên cắt EMA21 (LONG/SHORT thuận xu hướng) — chờ xác nhận ở NẾN KẾ TIẾP trước khi chốt tín hiệu thật,
    // tránh bẫy "false breakout" (giá xuyên qua EMA21 rồi rút chân ngược lại ngay, đúng kiểu gây lỗ hay gặp).
    let pendingCrossUp = null, pendingCrossDown = null;
    
    for (let i = 200; i < candlesData.length; i++) {
      const c = candlesData[i]; const prevC = candlesData[i-1]; const v = vols[i]; const currRsi = rsi14[i];
      let isLongEntry = false; let isShortEntry = false; let isClimax = false;

      // ===== XÁC NHẬN CLIMAX Ở NẾN KẾ TIẾP (giảm tín hiệu giả, tăng tỷ lệ thắng) =====
      // Nến climax (i-1) chỉ là ỨNG VIÊN — chỉ chốt thành tín hiệu ĐẢO CHIỀU thật nếu nến NGAY SAU ĐÓ (nến
      // này, i) xác nhận bị từ chối: không phá qua đỉnh/đáy climax VÀ đóng cửa lùi lại theo đúng hướng đảo
      // chiều. Nếu nến sau lại phá tiếp theo hướng cũ -> climax giả (chỉ là nhịp nghỉ giữa xu hướng), hủy bỏ.
      if (pendingClimax && i === pendingClimax.idx + 1) {
        if (pendingClimax.dir === 'buy' && c.high <= pendingClimax.high && c.close < pendingClimax.close && (pendingClimax.idx - lastClimaxBuyIdx) >= climaxCooldownBars) {
          lastClimaxBuyIdx = pendingClimax.idx;
          const revStopLoss = pendingClimax.high + atr14[pendingClimax.idx] * 0.3;
          const revStopDistance = revStopLoss - c.close;
          let revTarget = c.close - revStopDistance * 1.5;
          if (ema21[i] < c.close && (c.close - ema21[i]) > revStopDistance * 0.8) revTarget = ema21[i];
          addSignal({ time: c.time, idx: i, type: 'reversal_short', label: 'BÁN ĐỈNH (ĐẢO CHIỀU)', tone: 'down', price: c.close, entry: c.close, target: revTarget, sl: revStopLoss, divergenceConfirmed: pendingClimax.divergenceConfirmed,
            desc: `Buying Climax ĐÃ ĐƯỢC XÁC NHẬN: nến sau không phá được đỉnh climax và đóng cửa thấp hơn — bên mua thật sự đuối sức. Có phân kỳ giảm xác nhận thêm — độ tin cậy cao.`, color: '#c084fc' });
        } else if (pendingClimax.dir === 'sell' && c.low >= pendingClimax.low && c.close > pendingClimax.close && (pendingClimax.idx - lastClimaxSellIdx) >= climaxCooldownBars) {
          lastClimaxSellIdx = pendingClimax.idx;
          const revStopLoss = pendingClimax.low - atr14[pendingClimax.idx] * 0.3;
          const revStopDistance = c.close - revStopLoss;
          let revTarget = c.close + revStopDistance * 1.5;
          if (ema21[i] > c.close && (ema21[i] - c.close) > revStopDistance * 0.8) revTarget = ema21[i];
          addSignal({ time: c.time, idx: i, type: 'reversal_long', label: 'MUA ĐÁY (ĐẢO CHIỀU)', tone: 'up', price: c.close, entry: c.close, target: revTarget, sl: revStopLoss, divergenceConfirmed: pendingClimax.divergenceConfirmed,
            desc: `Selling Climax ĐÃ ĐƯỢC XÁC NHẬN: nến sau không phá được đáy climax và đóng cửa cao hơn — bên bán thật sự đuối sức. Có phân kỳ tăng xác nhận thêm — độ tin cậy cao.`, color: '#c084fc' });
        }
        pendingClimax = null; // chỉ chờ đúng 1 nến để xác nhận — quá hạn thì hủy ứng viên, không chờ thêm
      }

      // 1. TÍN HIỆU THUẬN XU HƯỚNG — yêu cầu đồng thuận đa khung (EMA9/21, 21/50, 50/200)
      const shortSig = ema9[i] > ema21[i] ? 1 : -1;
      const mediumSig = ema21[i] > ema50[i] ? 1 : -1;
      const longSig = ema50[i] > ema200[i] ? 1 : -1;
      const confluence = shortSig + mediumSig + longSig; // -3..+3, càng lớn càng đồng thuận nhiều khung

      // SIẾT #1: trước đây chỉ cần 2/3 khung EMA đồng thuận (confluence >= 2) — hay gây tín hiệu giả trong
      // vùng giằng co khi các EMA cắt qua lại liên tục. Giờ bắt buộc ĐỒNG THUẬN TOÀN BỘ 3/3 khung.
      const isUptrend = ema50[i] > ema200[i] && c.close > ema200[i] && confluence === 3;
      const isDowntrend = ema50[i] < ema200[i] && c.close < ema200[i] && confluence === -3;

      // SIẾT #2 (v2 — chặt hơn): trước đây chỉ cần 1 khung lớn có trend === 1 là đủ. Giờ nếu có từ 2 khung lớn
      // trở lên, bắt buộc ĐA SỐ (>50%) các khung đó cùng xác nhận thật — 1 khung lẻ loi không còn đủ để bắt entry.
      const htfLongStrictCount = htfInfos.filter(h => h.trend === 1).length;
      const htfShortStrictCount = htfInfos.filter(h => h.trend === -1).length;
      const htfRequiredConfirms = htfInfos.length > 0 ? Math.max(1, Math.ceil((htfInfos.length + 1) / 2)) : 0;
      const htfConfirmLongStrict = htfInfos.length === 0 || htfLongStrictCount >= htfRequiredConfirms;
      const htfConfirmShortStrict = htfInfos.length === 0 || htfShortStrictCount >= htfRequiredConfirms;

      // SIẾT #3 (v2 — chặt hơn): ngưỡng ADX nâng từ 22 lên 26 — chỉ giữ lại các đợt trend thật sự dứt khoát,
      // bỏ hẳn vùng "trend vừa vừa" hay bị đảo ngược giữa chừng.
      const adxOk = adx14[i] >= 26;

      // SIẾT #5 (MỚI): lọc khối lượng — nến xác nhận (nến sau khi cắt EMA21) phải có volume >= trung bình 20
      // nến gần nhất. Nếu giá trườn qua EMA21 với volume yếu ớt (không ai thật sự tham gia đẩy giá), khả năng
      // cao đó chỉ là nhiễu / thanh khoản mỏng, dễ bị đảo ngược ngay sau đó.
      const confirmVolOk = (idx) => volSma[idx] > 0 ? vols[idx] >= volSma[idx] : true;

      const upCrossNow = prevC.close < ema21[i-1] && c.close > ema21[i] && c.close > c.open && currRsi > 50 && currRsi < 75;
      const downCrossNow = prevC.close > ema21[i-1] && c.close < ema21[i] && c.close < c.open && currRsi < 50 && currRsi > 25;

      // SIẾT #4 (MỚI): thay vì vào lệnh NGAY tại nến vừa cắt EMA21 (rất dễ dính false breakout — giá xuyên
      // qua rồi rút chân ngược lại ngay như trong ảnh ví dụ), giờ chỉ đăng ký ỨNG VIÊN tại nến cắt...
      if (isUptrend && htfConfirmLongStrict && adxOk && upCrossNow) pendingCrossUp = { idx: i, level: ema21[i] };
      if (isDowntrend && htfConfirmShortStrict && adxOk && downCrossNow) pendingCrossDown = { idx: i, level: ema21[i] };

      // ...và chỉ CHỐT tín hiệu thật ở NẾN KẾ TIẾP nếu giá vẫn giữ được vị trí trên/dưới EMA21 (không rút
      // chân về ngược lại ngay) VÀ nến xác nhận có volume đủ mạnh — cùng cơ chế xác nhận 1 nến đã áp dụng
      // thành công cho climax Wyckoff ở trên.
      if (pendingCrossUp && i === pendingCrossUp.idx + 1) {
        if (c.close > ema21[i] && c.close >= pendingCrossUp.level && confirmVolOk(i) && (i - lastLongIdx) >= cooldownBars) isLongEntry = true;
        pendingCrossUp = null;
      }
      if (pendingCrossDown && i === pendingCrossDown.idx + 1) {
        if (c.close < ema21[i] && c.close <= pendingCrossDown.level && confirmVolOk(i) && (i - lastShortIdx) >= cooldownBars) isShortEntry = true;
        pendingCrossDown = null;
      }

      // Bỏ qua tín hiệu khi thị trường quá "chết" (biến động thấp hơn 60% trung bình) — tránh entry vô nghĩa trong sideway hẹp
      if (avgAtr[i] > 0 && atr14[i] < avgAtr[i] * 0.6) { isLongEntry = false; isShortEntry = false; }

      let isFilteredBySentiment = false; let filterReason = "";
      const lsAtBar = lsRatioAt(c.time); // tỷ lệ L/S THẬT tại đúng thời điểm nến này (lịch sử) — áp dụng đồng nhất cho cả nến quá khứ lẫn nến hiện tại, để log hiển thị đúng những gì sẽ xảy ra nếu chạy live
      const lsForFilter = lsAtBar !== null ? lsAtBar : (i === candlesData.length - 1 ? binanceLSRatio : null); // dự phòng: nếu chưa tải xong lịch sử L/S thì tạm dùng giá trị realtime CHỈ cho nến hiện tại
      if (lsForFilter !== null) {
        if (isLongEntry && lsForFilter > 2.5) { isLongEntry = false; isFilteredBySentiment = true; filterReason = `HỦY LONG: Đám đông FOMO (L/S: ${lsForFilter.toFixed(2)}).`; }
        if (isShortEntry && lsForFilter < 0.8) { isShortEntry = false; isFilteredBySentiment = true; filterReason = `HỦY SHORT: Đám đông hoảng loạn (L/S: ${lsForFilter.toFixed(2)}).`; }
      }

      // R:R thưởng cho tín hiệu đồng thuận toàn bộ 3 khung (2.2) so với đồng thuận 2/3 khung (1.6)
      const rr = Math.abs(confluence) === 3 ? 2.2 : 1.6;
      const confidenceLabel = Math.abs(confluence) === 3 ? 'Rất mạnh (3/3 khung)' : 'Mạnh (2/3 khung)';
      // Khoảng cách SL dựa trên ATR (biến động thực tế), có sàn tối thiểu 0.4% giá để tránh SL quá sát
      const stopDistance = Math.max(atr14[i] * 1.3, c.close * 0.004);

      // Target ƯU TIÊN = dải BB của khung LỚN nhỏ nhất đang xác nhận đúng chiều — điểm chốt lời an toàn,
      // không quá xa entry ở khung nhỏ nhất (htfInfos đã sắp xếp tăng dần nên khung đầu tiên khớp là gần nhất).
      // Nếu không có khung lớn nào hợp lệ, dùng lại R:R theo ATR làm dự phòng.
      if (isLongEntry) {
        lastLongIdx = i;
        const stopLoss = c.close - stopDistance;
        let targetPrice = c.close + stopDistance * rr;
        let targetDesc = `R:R 1:${rr}.`;
        const confirmingTfs = [];
        for (const h of htfInfos) {
          if (h.trend === 1) confirmingTfs.push(h.tf); // chỉ liệt kê khung có xác nhận THẬT (EMA + cấu trúc), khớp với điều kiện đã gate entry
        }
        for (const h of htfInfos) {
          if (h.trend <= 0) continue;
          const idx = htfIdxAt(h, c.time);
          // SỬA LỖI: trước đây chỉ cần BB-upper nằm TRÊN giá đóng cửa là dùng làm target, không kiểm tra
          // khoảng cách — khi giá đã bám sát dải BB (rất hay xảy ra vì ADX bắt buộc trend mạnh), target ra
          // rất gần entry, có khi còn gần hơn SL (R:R âm). Giờ chỉ dùng target BB nếu nó xa TỐI THIỂU bằng
          // target theo ATR mặc định (không bao giờ tệ hơn phương án dự phòng).
          if (idx >= 0 && h.bb.upper[idx] != null && (h.bb.upper[idx] - c.close) >= stopDistance * rr) {
            targetPrice = h.bb.upper[idx];
            targetDesc = `Target = dải trên BB ${htfBBPeriod},${htfBBMult} khung ${h.tf} (điểm chốt an toàn, không quá xa).`;
            break; // htfInfos tăng dần theo khung -> khung đầu tiên hợp lệ luôn là khung lớn GẦN NHẤT
          }
        }
        const tfNote = confirmingTfs.length ? `Khung lớn xác nhận LONG: ${confirmingTfs.join(', ')}.` : '';
        addSignal({ time: c.time, idx: i, type: 'trend_long', label: 'MUA - LONG', tone: 'up', price: c.close, entry: c.close, target: targetPrice, sl: stopLoss, desc: `Đồng thuận đa khung: ${confidenceLabel}. ${tfNote} ADX14: ${adx14[i].toFixed(1)} (xu hướng mạnh, dứt khoát). Nến xác nhận có volume ≥ TB20 và đã qua 1 nến giữ vững trên EMA21 (chống false breakout). Entry tối ưu tại khung ${currentInterval}. ${targetDesc}`, color: currentUpColor });
      } else if (isShortEntry) {
        lastShortIdx = i;
        const stopLoss = c.close + stopDistance;
        let targetPrice = c.close - stopDistance * rr;
        let targetDesc = `R:R 1:${rr}.`;
        const confirmingTfs = [];
        for (const h of htfInfos) {
          if (h.trend === -1) confirmingTfs.push(h.tf); // chỉ liệt kê khung có xác nhận THẬT (EMA + cấu trúc), khớp với điều kiện đã gate entry
        }
        for (const h of htfInfos) {
          if (h.trend >= 0) continue;
          const idx = htfIdxAt(h, c.time);
          // SỬA LỖI: cùng lý do như bên LONG — chỉ dùng target BB nếu xa TỐI THIỂU bằng target theo ATR mặc định.
          if (idx >= 0 && h.bb.lower[idx] != null && (c.close - h.bb.lower[idx]) >= stopDistance * rr) {
            targetPrice = h.bb.lower[idx];
            targetDesc = `Target = dải dưới BB ${htfBBPeriod},${htfBBMult} khung ${h.tf} (điểm chốt an toàn, không quá xa).`;
            break; // khung đầu tiên hợp lệ luôn là khung lớn GẦN NHẤT
          }
        }
        const tfNote = confirmingTfs.length ? `Khung lớn xác nhận SHORT: ${confirmingTfs.join(', ')}.` : '';
        addSignal({ time: c.time, idx: i, type: 'trend_short', label: 'BÁN - SHORT', tone: 'down', price: c.close, entry: c.close, target: targetPrice, sl: stopLoss, desc: `Đồng thuận đa khung: ${confidenceLabel}. ${tfNote} ADX14: ${adx14[i].toFixed(1)} (xu hướng mạnh, dứt khoát). Nến xác nhận có volume ≥ TB20 và đã qua 1 nến giữ vững dưới EMA21 (chống false breakout). Entry tối ưu tại khung ${currentInterval}. ${targetDesc}`, color: currentDownColor });
      }

      // 2. TÍN HIỆU VOLUME ĐỘT BIẾN / CLIMAX — đã tối ưu: chỉ báo climax THẬT khi có đủ 4 điều kiện
      // (1) volume đột biến, (2) đã có nhịp tăng/giảm rõ rệt trước đó (so ATR), (3) RSI đang quá mua/quá bán,
      // (4) biên độ nến (range) bất thường + bấc áp đảo thân nến. Có cooldown riêng tránh báo dồn dập.
      const avgVol = volSma[i];
      // ===== TỐI ƯU ENTRY SỚM: chuẩn hóa volume theo thời gian đã trôi qua trong nến CUỐI CÙNG đang chạy =====
      // Nến đang chạy (chưa đóng) chỉ có volume TÍCH LŨY từ đầu nến tới giờ. Nếu so trực tiếp v > avgVol*mult,
      // một nến 4h mới trôi qua 10% thời gian gần như không bao giờ đạt ngưỡng dù dòng tiền đang cực mạnh
      // -> tín hiệu luôn bị trễ tới gần cuối nến. Chuẩn hóa v theo elapsedFraction (tốc độ dòng tiền / phút)
      // cho phép phát hiện NGAY khi tốc độ vượt trội, sớm hơn nhiều so với đợi volume tuyệt đối đủ lớn.
      const isLiveLastBar = isLiveSignalPreview && i === candlesData.length - 1;
      let effVol = v; let projectedRatioNote = '';
      if (isLiveLastBar) {
        const isec = intervalSeconds();
        const elapsedFraction = Math.min(1, Math.max(0, (Date.now() / 1000 - c.time) / isec));
        // Bỏ qua vài giây đầu tiên (elapsedFraction quá nhỏ) để tránh chia cho số gần 0 gây tín hiệu nhiễu
        if (elapsedFraction > 0.04) {
          effVol = v / elapsedFraction;
          projectedRatioNote = ' (ước tính theo tốc độ dòng tiền — nến chưa đóng)';
        }
      }
      if (effVol > avgVol * aiVolMult) {
        const body = Math.abs(c.close - c.open);
        const range = Math.max(c.high - c.low, 1e-9);
        const upperWick = c.high - Math.max(c.open, c.close);
        const lowerWick = Math.min(c.open, c.close) - c.low;

        const priorC = candlesData[Math.max(0, i - climaxLookback)];
        const priorMove = c.close - priorC.close;
        const priorMoveStrong = atr14[i] > 0 && Math.abs(priorMove) > atr14[i] * 1.8;
        const priorUptrend = priorMoveStrong && priorMove > 0;
        const priorDowntrend = priorMoveStrong && priorMove < 0;
        const rangeIsWide = avgAtr[i] > 0 ? range > avgAtr[i] * 1.3 : true;

        const isBuyClimaxShape = c.close > c.open && upperWick > body * 1.5 && upperWick > range * 0.35;
        const isSellClimaxShape = c.close < c.open && lowerWick > body * 1.5 && lowerWick > range * 0.35;

        // Buying Climax (kiệt sức bên MUA ở đỉnh xu hướng tăng) -> ỨNG VIÊN cho tín hiệu ĐẢO CHIỀU GIẢM.
        // Thêm 3 bộ lọc SIẾT CHẶT để tăng tỷ lệ thắng (so với bản trước): (a) giá phải đóng cửa NGOÀI dải BB
        // trên (cực trị thống kê thật, không phải chỉ "nến to"); (b) BẮT BUỘC có phân kỳ giảm xác nhận (trước
        // đây chỉ là điểm cộng, giờ là điều kiện cần — ít tín hiệu hơn nhưng chất lượng cao hơn hẳn); (c) KHÔNG
        // đánh ngược nếu TẤT CẢ khung lớn hơn đang đồng thuận tăng rất mạnh (tránh chống lại xu hướng lớn áp đảo).
        const bbBuyExtreme = bbLocal.upper[i] != null && c.close > bbLocal.upper[i];
        const allHtfStronglyBull = htfInfos.length > 0 && htfInfos.every(h => h.trend > 0);
        if (isBuyClimaxShape && priorUptrend && rangeIsWide && currRsi > 65 && bbBuyExtreme && !allHtfStronglyBull && (i - lastClimaxBuyIdx) >= climaxCooldownBars) {
           const divergenceConfirmed = detectBearishDivergence(candlesData, rsi14, i);
           if (divergenceConfirmed) pendingClimax = { idx: i, dir: 'buy', high: c.high, low: c.low, close: c.close, divergenceConfirmed };
        // Selling Climax (kiệt sức bên BÁN ở đáy xu hướng giảm) -> ỨNG VIÊN cho tín hiệu ĐẢO CHIỀU TĂNG.
        } else if (isSellClimaxShape && priorDowntrend && rangeIsWide && currRsi < 35 && (() => { const bbSellExtreme = bbLocal.lower[i] != null && c.close < bbLocal.lower[i]; return bbSellExtreme; })() && !(htfInfos.length > 0 && htfInfos.every(h => h.trend < 0)) && (i - lastClimaxSellIdx) >= climaxCooldownBars) {
           const divergenceConfirmed = detectBullishDivergence(candlesData, rsi14, i);
           if (divergenceConfirmed) pendingClimax = { idx: i, dir: 'sell', high: c.high, low: c.low, close: c.close, divergenceConfirmed };
        } else if (c.close > c.open && !isLongEntry && (i - lastVolLongIdx) >= volCooldownBars) {
           // BÙNG NỔ MUA — nến xanh + volume đột biến nhưng CHƯA đủ đồng thuận đa khung như trend_long,
           // nên coi là tín hiệu MOMENTUM ngắn hạn: R:R thấp hơn, SL sát hơn, độ tin cậy thấp hơn trend/đảo chiều.
           lastVolLongIdx = i;
           const volStopDistance = Math.max(atr14[i] * 1.1, c.close * 0.0035);
           const volStopLoss = c.close - volStopDistance;
           const volTarget = c.close + volStopDistance * 1.3;
           addSignal({ time: c.time, idx: i, type: 'vol_spike', label: 'BÙNG NỔ MUA', tone: 'up', price: c.close, entry: c.close, target: volTarget, sl: volStopLoss,
             desc: `Vol x${(effVol/avgVol).toFixed(1)} lần trung bình${projectedRatioNote}, nến xanh áp đảo — lực mua ngắn hạn, CHƯA có xác nhận đa khung như tín hiệu LONG thuận xu hướng nên độ tin cậy thấp hơn, R:R và khối lượng vào lệnh nên nhỏ hơn.`, color: currentUpColor });
        } else if (c.close < c.open && !isShortEntry && (i - lastVolShortIdx) >= volCooldownBars) {
           // XẢ HÀNG MẠNH — tương tự, momentum giảm ngắn hạn chưa đủ đồng thuận đa khung.
           lastVolShortIdx = i;
           const volStopDistance = Math.max(atr14[i] * 1.1, c.close * 0.0035);
           const volStopLoss = c.close + volStopDistance;
           const volTarget = c.close - volStopDistance * 1.3;
           addSignal({ time: c.time, idx: i, type: 'vol_spike', label: 'XẢ HÀNG MẠNH', tone: 'down', price: c.close, entry: c.close, target: volTarget, sl: volStopLoss,
             desc: `Vol x${(effVol/avgVol).toFixed(1)} lần trung bình${projectedRatioNote}, nến đỏ áp đảo — lực bán ngắn hạn, CHƯA có xác nhận đa khung như tín hiệu SHORT thuận xu hướng nên độ tin cậy thấp hơn, R:R và khối lượng vào lệnh nên nhỏ hơn.`, color: currentDownColor });
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
      else if (s.type === 'reversal_long') markers.push({ time: s.time, position: 'belowBar', color: s.color, shape: 'arrowUp', text: 'MUA ĐÁY' });
      else if (s.type === 'reversal_short') markers.push({ time: s.time, position: 'aboveBar', color: s.color, shape: 'arrowDown', text: 'BÁN ĐỈNH' });
      else if (s.type === 'fng_block') markers.push({ time: s.time, position: 'aboveBar', color: s.color, shape: 'square', text: 'CHẶN' });
      else if (s.type === 'climax_buy') markers.push({ time: s.time, position: 'aboveBar', color: '#ffc93c', shape: 'arrowDown', text: 'B.CLX' });
      else if (s.type === 'climax_sell') markers.push({ time: s.time, position: 'belowBar', color: '#ffc93c', shape: 'arrowUp', text: 'S.CLX' });
      else if (s.type === 'vol_spike') markers.push({ time: s.time, position: (s.tone === 'up' ? 'belowBar' : 'aboveBar'), color: s.color, shape: 'circle', text: (s.tone === 'up' ? 'VOL+' : 'VOL-') });
    });
    markers.sort((a,b) => a.time - b.time);
    lastAiMarkers = markers;
    applyAllChartMarkers();

    // ===== THỐNG KÊ HIỆU SUẤT (backtest đơn giản) — soi lại nến TƯƠNG LAI (tối đa 300 nến, hoặc hết dữ
    // liệu) xem Target hay SL bị chạm trước, để tính tỷ lệ thắng & R trung bình THẬT cho từng loại tín
    // hiệu — giúp tự đánh giá khách quan việc tối ưu có thực sự hiệu quả hơn hay không, thay vì đoán.
    function evaluateSignalOutcome(sig) {
      if (sig.idx == null) return null;
      const isLong = sig.tone === 'up';
      const horizon = Math.min(candlesData.length, sig.idx + 300);
      for (let j = sig.idx + 1; j < horizon; j++) {
        const cc = candlesData[j];
        if (isLong) { if (cc.low <= sig.sl) return 'loss'; if (cc.high >= sig.target) return 'win'; }
        else { if (cc.high >= sig.sl) return 'loss'; if (cc.low <= sig.target) return 'win'; }
      }
      return 'open';
    }
    const statsBuckets = { trend: { label: 'Thuận xu hướng', win: 0, loss: 0, open: 0, rSum: 0 }, reversal: { label: 'Đảo chiều', win: 0, loss: 0, open: 0, rSum: 0 }, momentum: { label: 'Momentum', win: 0, loss: 0, open: 0, rSum: 0 } };
    signals.forEach(s => {
      if (!s.entry || s.idx == null) return;
      const bucket = (s.type === 'reversal_long' || s.type === 'reversal_short') ? statsBuckets.reversal : (s.type === 'trend_long' || s.type === 'trend_short') ? statsBuckets.trend : (s.type === 'vol_spike') ? statsBuckets.momentum : null;
      if (!bucket) return;
      const outcome = evaluateSignalOutcome(s);
      const riskDist = Math.abs(s.entry - s.sl) || 1e-9;
      if (outcome === 'win') { bucket.win++; bucket.rSum += Math.abs(s.target - s.entry) / riskDist; }
      else if (outcome === 'loss') { bucket.loss++; bucket.rSum -= 1; }
      else bucket.open++;
    });
    const statsBar = document.getElementById('ai-stats-bar');
    if (statsBar) {
      const chips = Object.values(statsBuckets).map(b => {
        const closed = b.win + b.loss;
        if (closed === 0) return `<div class="ai-stats-chip"><span class="stat-label">${b.label}:</span>chưa đủ dữ liệu đóng lệnh${b.open ? ` (${b.open} đang mở)` : ''}</div>`;
        const winRate = (b.win / closed * 100).toFixed(0);
        const avgR = (b.rSum / closed).toFixed(2);
        const rColor = b.rSum >= 0 ? 'var(--up)' : 'var(--down)';
        return `<div class="ai-stats-chip"><span class="stat-label">${b.label}:</span><b>${closed}</b> lệnh đã đóng · Thắng <b>${winRate}%</b> · R TB <b style="color:${rColor}">${avgR >= 0 ? '+' : ''}${avgR}R</b>${b.open ? ` · ${b.open} đang mở` : ''}</div>`;
      }).join('');
      statsBar.innerHTML = chips;
    }

    aiList.innerHTML = '';
    if (visibleSignals.length === 0){ aiList.innerHTML = '<div class="ai-empty">Chưa có dữ liệu hoặc đã được dọn sạch sẽ...</div>'; return; }
    
    visibleSignals.slice(-15).reverse().forEach(s => {
      const row = document.createElement('div'); row.className = 'signal-row jumpable'; row.title = 'Nhấp để xem trên biểu đồ';
      const proNoteHtml = `<div class="signal-desc" style="color:#8b93a7; font-size:11px; margin-top:5px; line-height:1.5; display:flex; gap:5px; align-items:flex-start;">${icon('pin', 'ico-inline')}<span>${getProNote(s)}</span></div>`;
      let descHtml = s.entry 
        ? `<div class="signal-desc" style="margin-top:5px; font-family:'JetBrains Mono', monospace; font-size:12px; font-weight:600;"><span style="color:var(--up)">${icon('dot','ico-inline')}Entry: ${fmt(s.entry)}</span> | <span style="color:var(--gold)">${icon('dot','ico-inline')}Target: ${fmt(s.target)}</span> | <span style="color:var(--down)">${icon('dot','ico-inline')}SL: ${fmt(s.sl)}</span></div><div class="signal-desc" style="color:var(--text-dim); font-size:11.5px; margin-top:3px;">${s.desc}</div>${proNoteHtml}` 
        : `<div class="signal-desc" style="color:var(--text-dim); font-size:12.5px; margin-top:5px;">${s.desc}</div>${proNoteHtml}`;

      const cat = signalCategoryLabel(s); const catCls = cat === 'WYCKOFF' ? 'cat-wyckoff' : (cat.indexOf('ĐẢO CHIỀU') >= 0 ? 'cat-reversal' : (cat.indexOf('MOMENTUM') >= 0 ? 'cat-momentum' : ''));
      row.innerHTML = `<div style="display:flex; flex:1; padding-right: 10px;"><div class="signal-badge-wrap"><span class="signal-eyebrow ${catCls}">${cat}</span><div class="signal-badge ${s.tone}">${icon(signalIconName(s))}<span class="lbl">${s.label}</span></div></div><div class="signal-body" style="flex:1;"><div class="signal-meta"><span class="signal-time">${fmtTime(s.time)}</span><span class="signal-price" style="font-weight:700;">${s.entry ? 'Vùng:' : 'Giá:'} ${fmt(s.price)} USDT</span></div>${descHtml}</div></div><div style="display:flex; align-items:center;"><button class="btn-delete-item" onclick="deleteSingleLog(${s.time})" title="Xóa">${icon('x')}</button></div>`;
      // Bấm vào dòng tín hiệu (trừ nút xóa) -> tự dịch chuyển biểu đồ tới đúng cây nến của tín hiệu này + chớp nháy nhận biết
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-item')) return;
        jumpToCandleTime(s.time);
      });
      aiList.appendChild(row);
    });
  }

  // ==========================================
  // 5. MAIN DATA LOOP & NETWORK DISCONNECT
  // ==========================================
  // Khoá 'symbol|interval' hiện tại, dùng để nhận biết nếu người dùng đổi coin/khung trong lúc đang chờ tải lịch sử cũ
  function historyKey() { return currentSymbol + '|' + currentInterval; }

  function loadOlderHistory() {
    if (isLoadingOlderHistory || !candlesData.length) return Promise.resolve(false);
    const key = historyKey();
    if (noMoreHistoryKey === key) return Promise.resolve(false); // đã xác nhận đây là cây nến đầu tiên trong lịch sử của coin, không tải nữa
    isLoadingOlderHistory = true;
    const endTime = Math.round(candlesData[0].time * 1000) - 1; // trước cây nến cũ nhất đang có 1ms
    return fetch(`https://api.binance.com/api/v3/klines?symbol=${currentSymbol}&interval=${currentInterval}&limit=1000&endTime=${endTime}`)
      .then(r => r.json())
      .then(data => {
        isLoadingOlderHistory = false;
        if (key !== historyKey()) return false; // đã đổi coin/khung trong lúc chờ -> bỏ kết quả cũ, khỏi ghép nhầm
        if (!Array.isArray(data) || data.length === 0) { noMoreHistoryKey = key; return false; }
        const older = []; const olderVol = [];
        data.forEach(d => {
          const time = d[0] / 1000;
          if (candlesDataMap.has(time)) return; // an toàn, tránh trùng nến ở ranh giới
          const open = parseFloat(d[1]), high = parseFloat(d[2]), low = parseFloat(d[3]), close = parseFloat(d[4]), volume = parseFloat(d[5]);
          const cData = { time, open, high, low, close };
          const vData = { time, value: volume, color: close >= open ? currentUpColor + '59' : currentDownColor + '59' };
          older.push(cData); olderVol.push(vData);
          candlesDataMap.set(time, cData); volumesDataMap.set(time, vData);
        });
        if (!older.length) { noMoreHistoryKey = key; return false; }
        if (data.length < 1000) noMoreHistoryKey = key; // sàn trả về ít hơn limit -> đã chạm đáy lịch sử, không cần gọi thêm lần sau
        const addedCount = older.length;
        candlesData = older.concat(candlesData);
        volumesData = olderVol.concat(volumesData);
        // Giữ nguyên đúng vị trí đang xem: mảng dài ra thêm addedCount phần tử ở đầu, nên mọi logical index cũ
        // (kể cả của các bản vẽ) bị dịch phải đúng addedCount đơn vị -> dời visible range theo cùng độ dịch đó
        // để chart không bị giật/nhảy lúc vừa nạp thêm lịch sử.
        const savedRange = priceTimeScale.getVisibleLogicalRange();
        candleSeries.setData(candlesData); volumeSeries.setData(volumesData);
        if (savedRange) {
          const shifted = { from: savedRange.from + addedCount, to: savedRange.to + addedCount };
          allTimeScales.forEach(ts => { try { ts.setVisibleLogicalRange(shifted); } catch (e) {} });
        }
        updateAllIndicators();
        return true;
      })
      .catch(err => { isLoadingOlderHistory = false; console.log('Lỗi tải lịch sử cũ:', err); return false; });
  }

  // Tự động kéo đủ lịch sử cũ cho tới khi TOÀN BỘ bản vẽ đã lưu (của symbol hiện tại) nằm trong vùng dữ liệu đã tải,
  // giống cách các sàn lớn làm: mở lại 1 trend-line vẽ trên khung 15 phút thì khung 4H (hay bất kỳ khung nào khác)
  // tự kéo đủ nến để hiện đúng bản vẽ đó ngay, người dùng không cần tự tay cuộn ngược lại tìm.
  function ensureHistoryCoversDrawings(triesLeft) {
    if (triesLeft === undefined) triesLeft = 30; // chặn spam API nếu bản vẽ có mốc thời gian bất thường/quá xa
    if (triesLeft <= 0 || !candlesData.length || !drawings.length) return;
    let oldestNeeded = null;
    drawings.forEach(d => {
      if (!d || !d.points) return;
      d.points.forEach(p => { if (p && p.time != null && (oldestNeeded === null || p.time < oldestNeeded)) oldestNeeded = p.time; });
    });
    if (oldestNeeded === null || oldestNeeded >= candlesData[0].time) return; // dữ liệu hiện có đã đủ, không cần tải thêm
    if (noMoreHistoryKey === historyKey()) return; // đã chạm đáy lịch sử thật -> bản vẽ đó nằm trước cả lúc coin niêm yết
    loadOlderHistory().then(got => { if (got) ensureHistoryCoversDrawings(triesLeft - 1); });
  }

  // Nối nến mới nhất (parsedCandles, đã sắp xếp tăng dần) vào candlesData hiện có, CHỈ thay thế phần đuôi trùng thời
  // gian — không đụng tới phần lịch sử cũ hơn đã được tải thêm qua loadOlderHistory(). Dùng cho đồng bộ định kỳ.
  function mergeRecentCandles(parsedCandles, parsedVolumes) {
    if (!parsedCandles.length) return;
    if (!candlesData.length) { candlesData = parsedCandles; volumesData = parsedVolumes; return; }
    const cutoff = parsedCandles[0].time;
    let lo = 0, hi = candlesData.length; // tìm nhị phân vị trí đầu tiên có time >= cutoff (mảng đã sắp xếp tăng dần)
    while (lo < hi) { const mid = (lo + hi) >> 1; if (candlesData[mid].time < cutoff) lo = mid + 1; else hi = mid; }
    candlesData = candlesData.slice(0, lo).concat(parsedCandles);
    volumesData = volumesData.slice(0, lo).concat(parsedVolumes);
  }

  // isFreshLoad = true: dùng khi đổi coin/khung thời gian — nạp lại từ đầu, đưa view về hiện tại, kéo đủ lịch sử cho bản vẽ.
  // isFreshLoad = false (mặc định): đồng bộ định kỳ mỗi 45s — chỉ cập nhật/nối các nến gần nhất, KHÔNG xoá lịch sử cũ
  // đã tải thêm và KHÔNG di chuyển khung nhìn (để không phá trải nghiệm đang xem giá quá khứ của người dùng).
  function fetchSyncData(isFreshLoad) {
    if (isFreshLoad) noMoreHistoryKey = null; // nến mới nhất được nạp lại từ đầu -> reset cờ "đã hết lịch sử" cho lần cuộn tiếp theo
    fetch(`https://api.binance.com/api/v3/klines?symbol=${currentSymbol}&interval=${currentInterval}&limit=1000`)
      .then(r => r.json())
      .then(data => {
        const parsedCandles = []; const parsedVolumes = [];
        if (isFreshLoad) { candlesDataMap.clear(); volumesDataMap.clear(); }
        data.forEach(d => {
          const time = d[0]/1000; const open = parseFloat(d[1]); const high = parseFloat(d[2]); const low = parseFloat(d[3]); const close = parseFloat(d[4]); const volume = parseFloat(d[5]);
          const cData = { time, open, high, low, close };
          const vData = { time, value: volume, color: close >= open ? currentUpColor+'59' : currentDownColor+'59' };
          parsedCandles.push(cData); parsedVolumes.push(vData); candlesDataMap.set(time, cData); volumesDataMap.set(time, vData);
        });

        if (isFreshLoad) {
          candlesData = parsedCandles; volumesData = parsedVolumes;
        } else {
          mergeRecentCandles(parsedCandles, parsedVolumes); // giữ nguyên phần lịch sử cũ đã tải thêm trước đó
        }
        candleSeries.setData(candlesData); volumeSeries.setData(volumesData); applyDynamicPricePrecision(true); syncPriceScaleWidths();

        if (isFreshLoad) {
          // Ép trục thời gian quay lại đúng vùng "hiện tại" — CHỈ khi đây là lần nạp mới do đổi coin/khung.
          // Nếu không làm việc này, Lightweight Charts sẽ GIỮ NGUYÊN logical range (vùng đang xem theo chỉ số bar)
          // từ khung cũ rồi áp lên bộ nến mới — do các khung khác nhau tải các khoảng lịch sử thực tế rất khác nhau
          // (limit=1000 nến: 1m ~ 16 giờ, 1D ~ gần 3 năm), viewport dễ "nhảy" ra khỏi vùng có bản vẽ hoặc bị ép về
          // một mép của chart. scrollToRealTime() đưa cây nến mới nhất về sát mép phải, khớp với cách các bản vẽ
          // (được lưu theo mốc thời gian thực) được tính lại toạ độ trong xOf()/logicalToTime().
          // Không gọi ở lần đồng bộ định kỳ (45s) để không kéo giật chart khi người dùng đang xem giá quá khứ.
          allTimeScales.forEach(ts => { try { ts.scrollToRealTime(); } catch (e) {} });
          // Sau khi có bộ nến mới nhất, kiểm tra xem các bản vẽ đã lưu của coin này có mốc thời gian nào cũ hơn
          // cây nến sớm nhất vừa tải không -> nếu có thì tự kéo thêm lịch sử để bản vẽ hiện đúng ngay, không cần cuộn tay.
          ensureHistoryCoversDrawings();
        }
        // Ép tính lại RSI/EMA/MACD... NGAY khi vừa đồng bộ lại toàn bộ nến — nếu không, các pane chỉ báo
        // (RSI, MACD...) sẽ giữ dữ liệu cũ cho tới tick websocket kế tiếp mới cập nhật, khiến đường RSI
        // hiển thị "ngắn hơn" / lệch so với Nến và Volume (vốn đã có dữ liệu mới ngay lập tức ở trên).
        updateAllIndicators();
        keepCrosshairAlive(); // setData() ở trên (đồng bộ định kỳ mỗi 45s) cũng làm crosshair bị ẩn -> vẽ lại ngay nếu chuột vẫn đứng yên trong chart
        isLiveSignalPreview = false; runAIAnalysis();
        const upd = document.getElementById('stat-updated'); if (upd) upd.innerText = new Date().toLocaleTimeString('vi-VN');
      }).catch(err => console.log("Lỗi đồng bộ dữ liệu API:", err));
  }

  // Tải nến của TẤT CẢ khung thời gian LỚN HƠN khung đang xem (trong dải 5m-1M) — dùng để AI xác nhận
  // xu hướng đa khung (chỉ cần 1 khung lớn có tín hiệu là đủ) và tính Target theo dải Bollinger Bands
  // của khung lớn gần nhất đang xác nhận (điểm chốt lời an toàn, không quá xa so với entry ở khung nhỏ nhất).
  function fetchHtfData() {
    const higherTFs = getHigherTFs();
    const reqSymbol = currentSymbol, reqInterval = currentInterval;
    if (!higherTFs.length) { htfCandlesMap = {}; if (typeof runAIAnalysis === 'function') runAIAnalysis(); return; }
    Promise.all(higherTFs.map(tf =>
      fetch(`https://api.binance.com/api/v3/klines?symbol=${reqSymbol}&interval=${tf}&limit=300`)
        .then(r => r.json())
        .then(data => ({ tf, candles: Array.isArray(data) ? data.map(d => ({ time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]) })) : [] }))
        .catch(() => ({ tf, candles: [] }))
    )).then(results => {
      if (reqSymbol !== currentSymbol || reqInterval !== currentInterval) return; // đã đổi coin/khung trong lúc chờ -> bỏ kết quả cũ
      const map = {}; results.forEach(r => { map[r.tf] = r.candles; });
      htfCandlesMap = map;
      if (typeof runAIAnalysis === 'function') runAIAnalysis();
    }).catch(err => console.log('Lỗi tải dữ liệu các khung thời gian lớn (HTF):', err));
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
    stopFlashHighlight(); // đổi coin/khung -> hủy vầng sáng đang chớp nháy (nếu có) vì cây nến cũ không còn hợp lệ
    lastAiMarkers = []; candleSeriesMarkers.setMarkers([]); // xóa icon/tín hiệu của coin hoặc khung cũ ngay, tránh hiện sai trong lúc chờ nến mới tải xong

    fetchSyncData(true); fetchHtfData();
    syncInterval = setInterval(() => { fetchSyncData(false); fetchHtfData(); }, 45 * 1000);
    fetchBinanceSentiment(currentSymbol);
    fetchHistoricalLSRatio(currentSymbol);

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
        keepCrosshairAlive(); // update() vừa gọi ở trên làm lightweight-charts tự ẩn crosshair -> vẽ lại ngay nếu chuột vẫn đang ở trong chart
        candlesDataMap.set(time, liveCandle); volumesDataMap.set(time, liveVolume);
        const lastIdx = candlesData.length - 1;
        const isBrandNewBar = !(lastIdx >= 0 && candlesData[lastIdx].time === time);
        if (!isBrandNewBar){ candlesData[lastIdx] = liveCandle; volumesData[lastIdx] = liveVolume; } 
        else { candlesData.push(liveCandle); volumesData.push(liveVolume); }
        // Tính lại chỉ báo tối đa mỗi 400ms khi nến đang chạy (throttle) — nến vừa đóng thì luôn tính đủ ngay lập tức.
        // Trước đây gọi lại TOÀN BỘ chỉ báo trên TOÀN BỘ lịch sử nến mỗi khi có 1 tick giá (nhiều lần/giây) —
        // đây là nguyên nhân chính gây giật/lag, đặc biệt trên điện thoại có CPU yếu hơn máy tính.
        //
        // FIX lệch giờ tooltip vs trục dưới: khi một cây nến MỚI vừa mở (isBrandNewBar), candlesData/candlesDataMap
        // đã có mốc thời gian mới NGAY LẬP TỨC (dùng cho tooltip), nhưng nếu vẫn chờ throttle 400ms thì các pane
        // phụ (RSI/EMA/MACD...) — vốn chỉ nhận dữ liệu mới qua updateAllIndicators() — sẽ tạm thời "chưa có" mốc
        // giờ mới đó. Lúc đó setCrosshairPosition() ở các pane phụ tự snap về cây nến CŨ gần nhất -> trục thời
        // gian bên dưới hiện giờ của nến trước, còn tooltip đã hiện giờ của nến mới -> lệch đúng 1 khung nến.
        // Nên: nến mới mở -> luôn cập nhật chỉ báo NGAY, bỏ qua throttle. Throttle chỉ áp dụng khi vẫn là CÙNG
        // 1 cây nến đang chạy (mốc giờ không đổi, không có gì để pane phụ bị lệch trục thời gian).
        const nowTs = Date.now();
        if (isBrandNewBar || kline.x === true || nowTs - lastIndicatorUpdateTs > 400) {
          lastIndicatorUpdateTs = nowTs;
          updateAllIndicators();
          keepCrosshairAlive(); // updateAllIndicators() gọi setData() trên các đường chỉ báo -> cũng làm crosshair bị ẩn, cần vẽ lại
        }
        const upd = document.getElementById('stat-updated'); if (upd) upd.innerText = new Date().toLocaleTimeString('vi-VN');
        if (kline.x === true) { isLiveSignalPreview = false; runAIAnalysis(); }
        else if (isBrandNewBar) { isLiveSignalPreview = true; runAIAnalysis(); } // nến mới mở -> tính tín hiệu ngay, khỏi chờ throttle 3s
        else { scheduleLiveAIAnalysis(); }
      };
      
      whaleWS = new WebSocket(`wss://stream.binance.com:9443/ws/${currentSymbol.toLowerCase()}@aggTrade`);
      // Cửa sổ trượt 60 giây các lệnh khớp thật (mua/bán) — nguồn cho gauge Long/Short "sống" theo từng nhịp giao dịch
      let liveTradeBuf = []; let lastLiveGaugeTs = 0;
      const LIVE_WINDOW_MS = 60000;
      liveBuyPressureScore = null; // reset khi đổi mã coin
      // ===== CẢNH BÁO SỚM BÙNG NỔ DÒNG LỆNH (aggTrade) =====
      // aggTrade là dữ liệu NHANH NHẤT có thể lấy được (từng lệnh khớp thật), nhanh hơn hẳn kline vì kline
      // volume chỉ được đọc lại mỗi 1.2s (throttle) và vẫn phải chờ tích lũy đủ. Ở đây so sánh TỐC ĐỘ dòng
      // tiền trong cửa sổ ngắn (7s gần nhất) với tốc độ nền của 53s trước đó (phần còn lại của cửa sổ 60s
      // liveTradeBuf sẵn có) — nếu tốc độ vọt lên gấp nhiều lần VÀ lệch hẳn về một phía (mua hoặc bán), bắn
      // cảnh báo "SỚM" ngay lập tức. Đây chỉ là tín hiệu CẢNH BÁO tham khảo để cân nhắc vào sớm hơn bằng tay —
      // KHÔNG thay thế tín hiệu MOMENTUM chính thức (vẫn cần chờ AI xác nhận đủ điều kiện nến/RSI/range).
      let lastBurstWarnTs = 0;
      const BURST_SHORT_WINDOW_MS = 7000;    // cửa sổ "đang diễn ra" để đo tốc độ đột biến
      const BURST_MIN_TRADES = 6;            // tối thiểu vài lệnh mới đủ tin cậy, tránh nhiễu vì 1-2 lệnh lẻ
      const BURST_RATIO = 3.2;               // tốc độ ngắn hạn phải gấp >= 3.2 lần tốc độ nền mới coi là "bùng nổ"
      const BURST_SKEW = 0.66;               // >=66% nghiêng hẳn về mua hoặc bán mới tính là có hướng rõ ràng
      const BURST_COOLDOWN_MS = 45000;       // tránh spam cảnh báo liên tục trong cùng 1 đợt bùng nổ
      whaleWS.onmessage = (event) => {
        const d = JSON.parse(event.data);
        const p = parseFloat(d.p); const q = parseFloat(d.q); const isBuy = !d.m; const usd = p * q;
        const tier = getFishTier(usd, currentSymbol);
        if (tier) showWhaleAlert(isBuy, usd, p, currentSymbol, tier.key);

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

        if (now - lastBurstWarnTs > BURST_COOLDOWN_MS) {
          const shortBuf = liveTradeBuf.filter(tr => now - tr.t <= BURST_SHORT_WINDOW_MS);
          if (shortBuf.length >= BURST_MIN_TRADES) {
            const baselineBuf = liveTradeBuf.filter(tr => now - tr.t > BURST_SHORT_WINDOW_MS);
            const baselineSpanMs = baselineBuf.length ? Math.max(5000, now - baselineBuf[0].t) : 0;
            if (baselineSpanMs > 0) {
              const baselineUsd = baselineBuf.reduce((s, tr) => s + tr.usd, 0);
              const baselineRate = baselineUsd / (baselineSpanMs / 1000);
              const shortUsd = shortBuf.reduce((s, tr) => s + tr.usd, 0);
              const shortRate = shortUsd / (BURST_SHORT_WINDOW_MS / 1000);
              const buyUsd = shortBuf.reduce((s, tr) => s + (tr.isBuy ? tr.usd : 0), 0);
              const buySkew = shortUsd > 0 ? buyUsd / shortUsd : 0.5;
              if (baselineRate > 0 && shortRate > baselineRate * BURST_RATIO && (buySkew >= BURST_SKEW || buySkew <= 1 - BURST_SKEW)) {
                lastBurstWarnTs = now;
                showBurstWarning(buySkew >= BURST_SKEW, shortRate / baselineRate, shortUsd, p);
              }
            }
          }
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

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") fetchSyncData(/* isFreshLoad */ false); }); // quay lại tab -> chỉ đồng bộ nến gần nhất, không kéo giật view

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
  
  (function bindAIRobotToggle() {
    const fab = document.getElementById('ai-robot-fab');
    if (!fab) return;
    const stateLabel = document.getElementById('ai-robot-state-label');
    const toggleAI = () => {
      aiEnabled = !aiEnabled;
      fab.classList.toggle('on', aiEnabled);
      fab.classList.toggle('off', !aiEnabled);
      fab.setAttribute('aria-pressed', String(aiEnabled));
      if (stateLabel) stateLabel.textContent = aiEnabled ? 'Đang bật' : 'Đang tắt';
      localStorage.setItem('ok_ai', aiEnabled);
      if (typeof runAIAnalysis === 'function') runAIAnalysis();
    };
    fab.addEventListener('click', toggleAI);
    fab.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAI(); }
    });
  })();

  // ===================================================================================
  // SECTION: BẢN ĐỒ KINH TẾ TOÀN CẦU — dữ liệu thật lấy trực tiếp từ World Bank (WDI).
  // Hình học bản đồ chỉ dựng 1 lần (đường biên giới các nước); khi đổi chỉ số chỉ tô lại
  // màu (fill) theo dữ liệu mới đã cache sẵn trong bộ nhớ — mượt, không phải vẽ lại từ đầu.
  // ===================================================================================
  (function initEconMap() {
    const svgEl = document.getElementById('econ-map-svg');
    const wrapEl = document.getElementById('econ-map-wrap');
    const statusEl = document.getElementById('econ-map-status');
    const tabsEl = document.getElementById('econ-tabs');
    const titleEl = document.getElementById('econ-title');
    const tooltipEl = document.getElementById('econ-tooltip');
    const legendBarEl = document.getElementById('econ-legend-bar');
    const legendLabelsEl = document.getElementById('econ-legend-labels');
    if (!svgEl || typeof d3 === 'undefined') return;

    // Nguồn hình học: GeoJSON biên giới các nước, id = mã ISO3 (khớp trực tiếp với countryiso3code
    // của World Bank, không cần bảng tra mã số ISO trung gian).
    const GEO_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

    // Bảng màu đơn sắc (tối -> sáng) đồng bộ tông vàng/gold sẵn có của giao diện.
    // Thang màu nhiệt liên tục kiểu TradingView: xanh (tốt) -> vàng -> đỏ (xấu).
    // Hướng "tốt/xấu" phụ thuộc từng chỉ số (goodDirection trong ECON_INDICATORS).
    const GRADIENT_LOW_TO_HIGH = ['#14cc8a', '#8dd66a', '#f0c419', '#ff8a3d', '#ff4757'];
    const NO_DATA_COLOR = '#232938';

    const ECON_INDICATORS = {
      inflation: { code: 'FP.CPI.TOTL.ZG', title: 'Bản đồ lạm phát toàn cầu', tab: 'Lạm phát', unit: '%', breaks: [0, 3, 7, 12, 25], goodDirection: 'low' },
      gdp: { code: 'NY.GDP.MKTP.KD.ZG', title: 'Bản đồ tăng trưởng GDP toàn cầu', tab: 'Tăng trưởng GDP', unit: '%', breaks: [-2, 0, 2, 4, 6], goodDirection: 'high' },
      unemployment: { code: 'SL.UEM.TOTL.ZS', title: 'Bản đồ thất nghiệp toàn cầu', tab: 'Thất nghiệp', unit: '%', breaks: [4, 7, 10, 15, 20], goodDirection: 'low' }
    };

    const state = { current: 'inflation', cache: {}, countries: null, ready: false };

    // --- Trạng thái quả cầu xoay được ---
    let projection, path, oceanSel, graticuleSel, flagLayerSel;
    let flagByIso3 = {};
    let flagFeatures = [];
    let autoRotateTimer = null;
    let autoRotateResumeT = null;
    const FLAG_W = 15, FLAG_H = 11;
    const AUTO_ROTATE_SPEED = 0.025; // độ / khung hình (~60fps -> khoảng 5 phút / vòng)
    const VISIBLE_THRESHOLD = 1.52; // rad (~87°) — chỉ vẽ cờ cho nước đang quay ra phía trước

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
      if (!cfg._scale) {
        cfg._scale = d3.scaleLinear().domain(cfg.breaks).range(gradientColorsFor(cfg)).clamp(true);
      }
      return cfg._scale;
    }

    function colorFor(value, cfg) {
      if (value === undefined || value === null || isNaN(value)) return NO_DATA_COLOR;
      return scaleFor(cfg)(value);
    }

    function percentOnScale(value, cfg) {
      const min = cfg.breaks[0], max = cfg.breaks[cfg.breaks.length - 1];
      return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    }

    function renderLegend(cfg) {
      if (!legendBarEl || !legendLabelsEl) return;
      const colors = gradientColorsFor(cfg);
      const min = cfg.breaks[0], max = cfg.breaks[cfg.breaks.length - 1];
      const stops = cfg.breaks.map((b, i) => colors[i] + ' ' + (((b - min) / (max - min)) * 100).toFixed(2) + '%').join(', ');
      legendBarEl.style.background = 'linear-gradient(to right, ' + stops + ')';
      legendBarEl.innerHTML = '<div class="econ-legend-marker" id="econ-legend-marker"></div>';
      legendLabelsEl.innerHTML = cfg.breaks.map(b => '<span>' + b + cfg.unit + '</span>').join('');
      resetLegendHover();
    }

    // Cập nhật dòng "quốc gia đang hover" bên dưới legend + di chuyển vạch đánh dấu trên thang màu.
    function updateLegendHover(cfg, name, rec) {
      const dotEl = document.getElementById('econ-legend-hover-dot');
      const textEl = document.getElementById('econ-legend-hover-text');
      const markerEl = document.getElementById('econ-legend-marker');
      if (!dotEl || !textEl) return;
      if (rec) {
        dotEl.style.background = colorFor(rec.value, cfg);
        textEl.innerHTML = '<span class="econ-legend-hover-name">' + name + '</span> · '
          + '<span class="econ-legend-hover-val">' + rec.value.toFixed(1) + cfg.unit + '</span> '
          + '<span class="econ-legend-hover-year">(' + rec.year + ')</span>';
        if (markerEl) { markerEl.style.left = percentOnScale(rec.value, cfg) + '%'; markerEl.classList.add('show'); }
      } else {
        dotEl.style.background = NO_DATA_COLOR;
        textEl.innerHTML = '<span class="econ-legend-hover-name">' + name + '</span> · Không có dữ liệu';
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
        // Nguồn trực tiếp bị chặn CORS (thường gặp khi mở file HTML trực tiếp, origin 'null')
        // -> thử lại qua CORS-proxy allorigins.
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        const res2 = await fetch(proxyUrl);
        if (!res2.ok) throw new Error('WB API lỗi ' + res2.status);
        json = await res2.json();
      }
      const map = {};
      const rows = (json && json[1]) || [];
      rows.forEach(row => {
        if (row && row.value !== null && row.value !== undefined && row.countryiso3code) {
          map[row.countryiso3code] = { value: +row.value, year: row.date };
        }
      });
      state.cache[key] = map;
      return map;
    }

    function showTooltip(event, feature, dataMap, cfg) {
      const rec = dataMap[feature.id];
      const name = (feature.properties && feature.properties.name) || feature.id;
      let html = '<div class="econ-tt-name"></div><div class="econ-tt-val"></div>';
      tooltipEl.innerHTML = html;
      tooltipEl.querySelector('.econ-tt-name').textContent = name;
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
      let clientX = event.clientX, clientY = event.clientY;
      if (event.touches && event.touches.length) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; }
      const tw = tooltipEl.offsetWidth || 140;
      tooltipEl.style.left = Math.min(clientX + 14, window.innerWidth - tw - 8) + 'px';
      tooltipEl.style.top = Math.max(clientY - 12, 8) + 'px';
      tooltipEl.classList.add('show');
      clearTimeout(state.tooltipTimer);
      if (event.type === 'touchstart') { state.tooltipTimer = setTimeout(hideTooltip, 2500); }
    }
    function hideTooltip() { tooltipEl.classList.remove('show'); }

    async function switchIndicator(key) {
      const cfg = ECON_INDICATORS[key];
      if (!cfg || !state.ready) return;
      state.current = key;
      titleEl.textContent = cfg.title;
      renderLegend(cfg);
      setStatus('Đang tải dữ liệu ' + cfg.tab.toLowerCase() + '…');
      try {
        const dataMap = await fetchIndicator(key);
        state.countries
          .transition().duration(350)
          .attr('fill', d => colorFor(dataMap[d.id] ? dataMap[d.id].value : null, cfg));
        state.countries
          .on('mousemove touchstart', (event, d) => {
            const name = (d.properties && d.properties.name) || d.id;
            showTooltip(event, d, dataMap, cfg);
            updateLegendHover(cfg, name, dataMap[d.id]);
          })
          .on('mouseleave', () => { hideTooltip(); resetLegendHover(); });
        setStatus('');
      } catch (e) {
        setStatus('Không tải được dữ liệu từ World Bank. Vui lòng thử lại sau.', true);
      }
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

    // Vẽ lại tất cả path (đại dương, lưới kinh vĩ tuyến, quốc gia) + cờ theo góc xoay hiện tại.
    function redraw() {
      if (!path) return;
      if (oceanSel) oceanSel.attr('d', path);
      if (graticuleSel) graticuleSel.attr('d', path);
      if (state.countries) state.countries.attr('d', path);
      updateFlags();
    }

    // Một nước được coi là "quay ra phía trước" nếu tâm địa lý của nó cách tâm khung nhìn < 90°.
    function isFrontFacing(feature) {
      const c = feature._centroid || (feature._centroid = d3.geoCentroid(feature));
      const r = projection.rotate();
      const center = [-r[0], -r[1]];
      return d3.geoDistance(c, center) < VISIBLE_THRESHOLD;
    }

    function updateFlags() {
      if (!flagLayerSel || !flagFeatures.length) return;
      const visible = flagFeatures.filter(isFrontFacing);
      flagLayerSel.selectAll('image.econ-flag')
        .data(visible, f => f.id)
        .join(
          enter => enter.append('image')
            .attr('class', 'econ-flag')
            .attr('href', f => flagByIso3[f.id])
            .attr('width', FLAG_W)
            .attr('height', FLAG_H)
            .style('opacity', 0)
            .call(sel => sel.transition().duration(150).style('opacity', 1)),
          update => update,
          exit => exit.remove()
        )
        .attr('x', f => path.centroid(f)[0] - FLAG_W / 2)
        .attr('y', f => path.centroid(f)[1] - FLAG_H / 2);
    }

    function startAutoRotate() {
      if (autoRotateTimer) return;
      autoRotateTimer = d3.timer(() => {
        const r = projection.rotate();
        projection.rotate([r[0] + AUTO_ROTATE_SPEED, r[1], r[2]]);
        redraw();
      });
    }
    function stopAutoRotate() {
      if (autoRotateTimer) { autoRotateTimer.stop(); autoRotateTimer = null; }
    }
    function scheduleAutoRotateResume() {
      clearTimeout(autoRotateResumeT);
      autoRotateResumeT = setTimeout(startAutoRotate, 2200);
    }

    // Lấy URL cờ (PNG) theo mã ISO3 từ REST Countries, khớp thẳng với id (ISO3) của GeoJSON,
    // sau đó chỉ hiển thị cờ của những nước đang quay ra phía trước quả cầu.
    async function loadCountryFlags(world) {
      const FLAG_API = 'https://restcountries.com/v3.1/all?fields=cca3,flags';
      let list;
      try {
        const res = await fetch(FLAG_API);
        if (!res.ok) throw new Error('flags api ' + res.status);
        list = await res.json();
      } catch (directErr) {
        try {
          const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(FLAG_API);
          const res2 = await fetch(proxyUrl);
          if (!res2.ok) throw new Error('flags api lỗi ' + res2.status);
          list = await res2.json();
        } catch (proxyErr) {
          console.warn('Không tải được cờ quốc gia:', proxyErr);
          return;
        }
      }

      (list || []).forEach(c => {
        if (c && c.cca3 && c.flags && (c.flags.png || c.flags.svg)) {
          flagByIso3[c.cca3] = c.flags.png || c.flags.svg;
        }
      });
      flagFeatures = world.features.filter(f => !!flagByIso3[f.id]);
      flagFeatures.forEach(f => { f._centroid = d3.geoCentroid(f); });
      updateFlags();
    }

    (async function boot() {
      setStatus('Đang tải quả cầu…');
      try {
        const world = await d3.json(GEO_URL);
        const SIZE = 620, PAD = 26;
        projection = d3.geoOrthographic()
          .rotate([-20, -12, 0])
          .clipAngle(90)
          .fitExtent([[PAD, PAD], [SIZE - PAD, SIZE - PAD]], { type: 'Sphere' });
        path = d3.geoPath(projection);

        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        const cx = projection.translate()[0], cy = projection.translate()[1];
        const r = projection.scale();

        const defs = svg.append('defs');

        // Gradient đại dương: mô phỏng ánh sáng chiếu từ góc trên-trái, tối dần ra rìa cho cảm giác hình cầu 3D.
        const oceanGrad = defs.append('radialGradient').attr('id', 'econ-ocean-grad').attr('cx', '32%').attr('cy', '28%').attr('r', '80%');
        oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#5fa8e8');
        oceanGrad.append('stop').attr('offset', '35%').attr('stop-color', '#2f74c4');
        oceanGrad.append('stop').attr('offset', '70%').attr('stop-color', '#164a8a');
        oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0a2647');

        // Vầng khí quyển phát sáng quanh rìa quả cầu.
        const atmoGrad = defs.append('radialGradient').attr('id', 'econ-atmo-grad').attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
        atmoGrad.append('stop').attr('offset', '82%').attr('stop-color', '#5fb4ff').attr('stop-opacity', 0);
        atmoGrad.append('stop').attr('offset', '94%').attr('stop-color', '#5fb4ff').attr('stop-opacity', 0.45);
        atmoGrad.append('stop').attr('offset', '100%').attr('stop-color', '#5fb4ff').attr('stop-opacity', 0);

        // Đổ bóng nhẹ dưới quả cầu để có cảm giác đang lơ lửng, không bị dính phẳng vào nền.
        const shadowFilter = defs.append('filter').attr('id', 'econ-globe-shadow').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
        shadowFilter.append('feDropShadow').attr('dx', 0).attr('dy', 10).attr('stdDeviation', 14).attr('flood-color', '#000').attr('flood-opacity', 0.5);

        svg.append('circle')
          .attr('class', 'econ-globe-atmosphere')
          .attr('cx', cx).attr('cy', cy).attr('r', r * 1.05)
          .style('fill', 'url(#econ-atmo-grad)');

        const bodyGroup = svg.append('g').attr('class', 'econ-globe-body').style('filter', 'url(#econ-globe-shadow)');

        oceanSel = bodyGroup.append('path')
          .datum({ type: 'Sphere' })
          .attr('class', 'econ-globe-ocean')
          .attr('d', path)
          .style('fill', 'url(#econ-ocean-grad)');

        graticuleSel = bodyGroup.append('path')
          .datum(d3.geoGraticule10())
          .attr('class', 'econ-globe-graticule')
          .attr('d', path);

        const g = bodyGroup.append('g');
        state.countries = g.selectAll('path.econ-country')
          .data(world.features)
          .join('path')
          .attr('class', 'econ-country')
          .attr('d', path)
          .on('mouseleave', () => { hideTooltip(); resetLegendHover(); });

        flagLayerSel = svg.append('g').attr('class', 'econ-flag-layer');

        // Kéo chuột/chạm để xoay quả cầu (giống lăn địa cầu)
        const dragBehavior = d3.drag()
          .on('start', () => { stopAutoRotate(); svgEl.classList.add('grabbing'); })
          .on('drag', (event) => {
            const r = projection.rotate();
            const k = 230 / (projection.scale() || 1);
            const nextLambda = r[0] + event.dx * k;
            const nextPhi = Math.max(-90, Math.min(90, r[1] - event.dy * k));
            projection.rotate([nextLambda, nextPhi, r[2]]);
            redraw();
          })
          .on('end', () => { svgEl.classList.remove('grabbing'); scheduleAutoRotateResume(); });
        svg.style('touch-action', 'none').call(dragBehavior);
        svg.on('mouseenter', () => stopAutoRotate()).on('mouseleave', () => scheduleAutoRotateResume());

        state.ready = true;
        await switchIndicator(state.current);
        startAutoRotate();
        loadCountryFlags(world);
      } catch (e) {
        setStatus('Không tải được quả cầu. Kiểm tra kết nối mạng và thử lại.', true);
      }
    })();
  })();
  updateChart();
