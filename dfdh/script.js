/* ==========================================================
   请别在雨天离开 — 阶段 3 运行脚本
   依赖 data/story.js（window.STORY）
   ========================================================== */

(function () {
  'use strict';

  var STORY = window.STORY || {
    characters: {},
    backgrounds: {},
    notes: {},
    endings: [],
    scenes: {},
    startScene: ''
  };

  var SAVE_AUTO = 'dfdh.save.auto';
  var SAVE_SLOTS = ['dfdh.save.slot1', 'dfdh.save.slot2', 'dfdh.save.slot3'];
  var GLOBAL_KEY = 'dfdh.global';
  var DEFAULT_SETTINGS = { textSpeed: 5, autoDelay: 1400, volume: 55, bgmVolume: 60, ambientVolume: 60 };

  function byId(id) { return document.getElementById(id); }
  var originalTitle = document.title || '请别在雨天离开';
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  var UI = {
    title: byId('screen-title'),
    game: byId('screen-game'),
    stage: byId('stage'),
    stageBg: byId('stage-bg'),
    sceneTint: byId('scene-tint'),
    sceneRain: byId('scene-rain'),
    emotionVeil: byId('emotion-veil'),
    inspectLayer: byId('inspect-layer'),
    inspectFab: byId('inspect-fab'),
    inspectRing: byId('inspect-ring'),
    rippleLayer: byId('ripple-layer'),
    portraitLayer: byId('portrait-layer'),
    portraitImg: byId('portrait-img'),
    portraitLayerB: byId('portrait-layer-b'),
    portraitImgB: byId('portrait-img-b'),
    sceneTag: byId('scene-tag'),
    sceneKicker: byId('scene-kicker'),
    sceneTitle: byId('scene-title'),
    bondHud: byId('bond-hud'),
    bondIcon: byId('bond-icon'),
    bondText: byId('bond-text'),
    bondFloat: byId('bond-float'),
    pressureVeil: byId('pressure-veil'),
    dlg: byId('dialogue-box'),
    speaker: byId('speaker'),
    line: byId('line'),
    next: byId('next-indicator'),
    choice: byId('choice-box'),

    btnAuto: byId('btn-auto'),
    btnSkip: byId('btn-skip'),
    btnHistory: byId('btn-history'),
    btnSaves: byId('btn-saves'),
    btnLoads: byId('btn-loads'),
    btnSettings: byId('btn-settings'),
    btnTitle: byId('btn-title'),
    btnHide: byId('btn-hide'),
    savesTitle: byId('saves-title'),
    confirmText: byId('confirm-text'),
    btnConfirmOk: byId('btn-confirm-ok'),
    btnConfirmCancel: byId('btn-confirm-cancel'),

    phoneFab: byId('phone-fab'),
    phoneBadge: byId('phone-badge'),
    phoneName: byId('phone-name'),
    phoneClock: byId('phone-clock'),
    chatList: byId('chat-list'),
    phoneReplies: byId('phone-replies'),
    phoneHint: byId('phone-hint'),

    observeLayer: byId('observe-layer'),
    hotspot: byId('observe-hotspot'),
    observeHint: byId('observe-hint'),
    noteKicker: byId('note-kicker'),
    noteTitle: byId('note-title'),
    noteText: byId('note-text'),
    btnNoteClose: byId('btn-note-close'),

    debugPanel: byId('debug-panel'),
    dbgTrust: byId('dbg-trust'),
    dbgPressure: byId('dbg-pressure'),
    dbgNotes: byId('dbg-notes'),
    dbgNoteList: byId('dbg-note-list'),
    dbgCursor: byId('dbg-cursor'),

    historyList: byId('history-list'),
    slotList: byId('slot-list'),
    galleryGrid: byId('gallery-grid'),
    galleryCount: byId('gallery-count'),
    toast: byId('toast'),
    endKicker: byId('end-kicker'),
    endTitle: byId('end-title'),
    endText: byId('end-text'),
    endEpilogue: byId('end-epilogue'),
    endGallery: byId('end-gallery'),

    joyBeam: byId('joy-beam'),
    btnShareSnap: byId('btn-share-snap'),
    shareCanvas: byId('share-snapshot'),

    chapterCard: byId('chapter-card'),
    chapterKicker: byId('chapter-kicker'),
    chapterTitle: byId('chapter-title'),
    btnMemory: byId('btn-memory'),
    titleSub: byId('title-sub'),
    titlePortraitImg: byId('title-portrait-img'),
    titleMotes: byId('title-motes'),

    setSpeed: byId('set-speed'),
    setAuto: byId('set-auto'),
    setVolume: byId('set-volume'),
    setBgmVolume: byId('set-bgm-volume'),
    setAmbientVolume: byId('set-ambient-volume'),
    outSpeed: byId('out-speed'),
    outAuto: byId('out-auto'),
    outVolume: byId('out-volume'),
    outBgmVolume: byId('out-bgm-volume'),
    outAmbientVolume: byId('out-ambient-volume')
  };

  /* ------------------------------ 图片预加载 ------------------------------ */
  /* 开始游戏时静默预加载全部背景与立绘，避免切场景时白屏/闪烁 */

  var preloaded = false;
  function preloadImages() {
    if (preloaded) return;
    preloaded = true;
    try {
      var urls = [];
      Object.keys(STORY.backgrounds || {}).forEach(function (id) {
        if (STORY.backgrounds[id] && STORY.backgrounds[id].src) urls.push(STORY.backgrounds[id].src);
      });
      Object.keys(STORY.characters || {}).forEach(function (id) {
        var c = STORY.characters[id];
        if (!c) return;
        if (c.portrait) urls.push(c.portrait);
        Object.keys(c.moods || {}).forEach(function (m) {
          if (c.moods[m]) urls.push(c.moods[m]);
        });
      });
      urls.forEach(function (url) {
        var img = new Image();
        img.src = url;
      });
    } catch (e) { /* 预加载失败不影响游戏 */ }
  }

  /* ------------------------------ 本地存储 ------------------------------ */

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* 忽略 */ }
  }

  function loadGlobal() {
    var base = {
      seenEndings: [],
      read: {},
      notesEver: [],
      settings: {
        textSpeed: DEFAULT_SETTINGS.textSpeed,
        autoDelay: DEFAULT_SETTINGS.autoDelay,
        volume: DEFAULT_SETTINGS.volume,
        bgmVolume: DEFAULT_SETTINGS.bgmVolume,
        ambientVolume: DEFAULT_SETTINGS.ambientVolume
      }
    };
    var raw = safeGet(GLOBAL_KEY);
    if (!raw) return base;
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return base;
      if (Array.isArray(data.seenEndings)) {
        base.seenEndings = data.seenEndings.filter(function (x) { return typeof x === 'string'; });
      }
      if (Array.isArray(data.notesEver)) {
        base.notesEver = data.notesEver.filter(function (x) { return typeof x === 'string'; });
      }
      if (data.read && typeof data.read === 'object') {
        Object.keys(data.read).forEach(function (key) {
          if (typeof key === 'string') base.read[key] = 1;
        });
      }
      if (data.settings && typeof data.settings === 'object') {
        if (typeof data.settings.textSpeed === 'number' && isFinite(data.settings.textSpeed)) {
          base.settings.textSpeed = clamp(Math.round(data.settings.textSpeed), 1, 10);
        }
        if (typeof data.settings.autoDelay === 'number' && isFinite(data.settings.autoDelay)) {
          base.settings.autoDelay = clamp(Math.round(data.settings.autoDelay), 600, 3000);
        }
        if (typeof data.settings.volume === 'number' && isFinite(data.settings.volume)) {
          base.settings.volume = clamp(Math.round(data.settings.volume), 0, 100);
        }
        if (typeof data.settings.bgmVolume === 'number' && isFinite(data.settings.bgmVolume)) {
          base.settings.bgmVolume = clamp(Math.round(data.settings.bgmVolume), 0, 100);
        }
        if (typeof data.settings.ambientVolume === 'number' && isFinite(data.settings.ambientVolume)) {
          base.settings.ambientVolume = clamp(Math.round(data.settings.ambientVolume), 0, 100);
        }
      }
    } catch (e) { /* 损坏数据直接用默认值 */ }
    return base;
  }

  var globalData = loadGlobal();
  var settings = globalData.settings;

  var globalSaveTimer = null;
  function saveGlobal() {
    globalData.settings = settings;
    safeSet(GLOBAL_KEY, JSON.stringify(globalData));
  }
  function scheduleGlobalSave() {
    clearTimeout(globalSaveTimer);
    globalSaveTimer = setTimeout(saveGlobal, 400);
  }

  /* ------------------------------ AudioManager：纯代码合成音频引擎 ------------------------------
     BGM / 环境音 / 音效全部由 Web Audio API 实时合成，不使用任何本地音频文件。
     遵守浏览器自动播放策略：AudioContext 只在玩家点击「开始游戏 / 继续 / 回忆」后创建。
     设备不支持音频时，所有方法静默返回，不报错、不卡死。
     BGM 与环境音切换均带 1.5 秒淡入淡出，不直接切断。 */

  var AudioManager = (function () {
    var ctx = null;
    var bgmBus = null;      /* BGM 总线 */
    var ambBus = null;      /* 环境音总线（可与 BGM 叠加） */
    var sfxBus = null;      /* 一次性音效总线 */
    var bgmVerb = null;     /* BGM 混响发送（多重 Delay 空间感） */
    var noiseBuffer = null; /* 白噪声（雨声 / 高频音效） */
    var brownBuffer = null; /* 布朗噪声（室内 / 医院底噪） */

    var FADE = 1.5;         /* 淡入淡出时长（秒） */

    var bgmInst = null;     /* { name, gain, cleanups[] } */
    var ambInst = null;
    var pendingBgm = null;  /* unlock 前记录的目标音频，解锁后补齐 */
    var pendingAmb = null;
    var rainMood = 1;       /* 0~1：她越敞开心扉，雨声越弱 */

    function sfxScale() { return clamp(settings.volume, 0, 100) / 100; }
    function bgmScale() { return clamp(settings.bgmVolume, 0, 100) / 100; }
    function ambScale() { return clamp(settings.ambientVolume, 0, 100) / 100; }

    /* 雨声增益：情绪越稳定（mood→1）雨越大，敞开心扉后减弱但不消失 */
    function rainGain() { return 0.5 * (0.35 + 0.65 * rainMood); }

    function ramp(param, value, dur) {
      if (!ctx) return;
      try {
        param.setTargetAtTime(value, ctx.currentTime, Math.max(0.01, dur / 3));
      } catch (e) {
        try { param.value = value; } catch (e2) { /* 忽略 */ }
      }
    }

    function makeNoiseBuffers() {
      var len = Math.floor(ctx.sampleRate * 2);
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuffer.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      brownBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      var b = brownBuffer.getChannelData(0);
      var last = 0;
      for (var j = 0; j < len; j++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        b[j] = last * 3.5;
      }
    }

    function filter(type, freq, q) {
      var f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      if (q) f.Q.value = q;
      return f;
    }

    /* 循环噪声源：buffer → 滤波链 → 目标节点 */
    function noiseLoop(buffer, filters, dest) {
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      var node = src;
      for (var i = 0; i < filters.length; i++) {
        node.connect(filters[i]);
        node = filters[i];
      }
      node.connect(dest);
      src.start(0);
      return src;
    }

    /* 单个音符：ADSR 包络（起音/衰减/延音/释放），播放结束立即断开节点 */
    function note(freq, t, dur, peak, type, dest) {
      var osc = ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      var atk = Math.min(0.25, dur * 0.2);      /* attack */
      var rel = Math.min(0.6, dur * 0.4);       /* release */
      var sus = peak * 0.7;                     /* sustain level */
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + atk);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + atk + dur * 0.3);
      g.gain.setValueAtTime(Math.max(0.0001, sus), t + Math.max(atk, dur - rel));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(dest);
      osc.onended = function () {
        try { osc.disconnect(); g.disconnect(); } catch (e) { /* 忽略 */ }
      };
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    /* 和弦：一次触发多个和谐音，共享包络（空间感 + 饱满度） */
    function chord(freqs, t, dur, peak, type, dest) {
      for (var i = 0; i < freqs.length; i++) {
        note(freqs[i], t + (i * 0.02), dur, peak * (1 - i * 0.18), type, dest);
      }
    }

    /* 叹气式音符：快速起音 → 下陷 → 略回升 → 缓慢消散（悲伤 BGM 用） */
    function sigh(freq, t, dur, peak, dest) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.12);
      g.gain.exponentialRampToValueAtTime(peak * 0.4, t + dur * 0.45);
      g.gain.exponentialRampToValueAtTime(peak * 0.62, t + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(dest);
      osc.onended = function () {
        try { osc.disconnect(); g.disconnect(); } catch (e) { /* 忽略 */ }
      };
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    /* ================= BGM 生成器：返回 cleanup 函数数组 ================= */

    /* 日常平静：C 大调三和弦垫底 + 稀疏五声音阶，柔和空灵 */
    function genDaily(gain) {
      var bar = function () {
        var t = ctx.currentTime + 0.05;
        chord([130.81, 164.81, 196.00], t, 5.2, 0.05, 'sine', gain);   /* C3-E3-G3 */
        var penta = [523.25, 587.33, 659.25, 783.99, 880.00];
        for (var i = 0; i < 3; i++) {
          if (Math.random() < 0.75) {
            note(penta[Math.floor(Math.random() * penta.length)], t + 0.6 + i * 1.5, 1.8, 0.06, 'sine', gain);
          }
        }
      };
      bar();
      var timer = setInterval(bar, 4800);
      return [function () { clearInterval(timer); }];
    }

    /* 悲伤低落：A 小调三和弦 + 叹气式旋律 */
    function genSad(gain) {
      var bar = function () {
        var t = ctx.currentTime + 0.05;
        chord([110.00, 130.81, 164.81], t, 6.0, 0.045, 'sine', gain);  /* A2-C3-E3 */
        var minor = [440.00, 493.88, 523.25, 587.33, 659.25];
        for (var i = 0; i < 2; i++) {
          sigh(minor[Math.floor(Math.random() * minor.length)], t + 0.8 + i * 2.6, 2.8, 0.07, gain);
        }
      };
      bar();
      var timer = setInterval(bar, 5600);
      return [function () { clearInterval(timer); }];
    }

    /* 紧张压抑：低频锯齿波 + 小二度不和谐音程（A1/Bb1），偶发高处不和谐音 */
    function genTense(gain) {
      var lp = filter('lowpass', 260, 0.8);
      lp.connect(gain);
      var oscs = [];
      [55.00, 58.27].forEach(function (f, i) {
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = i ? 6 : -6;
        var g = ctx.createGain();
        g.gain.value = 0.05;
        osc.connect(g);
        g.connect(lp);
        osc.start(0);
        oscs.push({ osc: osc, g: g });
      });
      var flip = false;
      var timer = setInterval(function () {
        flip = !flip;
        if (!flip) return;
        var t = ctx.currentTime + 0.05;
        note(1318.51, t, 1.6, 0.028, 'triangle', gain);        /* E6 */
        note(1864.66, t + 0.2, 1.4, 0.02, 'triangle', gain);   /* Bb6，与 E6 构成三全音 */
      }, 3200);
      return [
        function () { clearInterval(timer); },
        function () {
          oscs.forEach(function (o) {
            try { o.osc.stop(); } catch (e) { /* 忽略 */ }
            try { o.osc.disconnect(); o.g.disconnect(); } catch (e) { /* 忽略 */ }
          });
          try { lp.disconnect(); } catch (e) { /* 忽略 */ }
        }
      ];
    }

    /* 希望治愈：大调高音纯净正弦，缓慢上行琶音 */
    function genHope(gain) {
      var seq = [261.63, 329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 1046.50];
      var step = 0;
      var bar = function () {
        var t = ctx.currentTime + 0.05;
        chord([196.00, 246.94, 293.66], t, 5.2, 0.028, 'sine', gain);   /* G3-B3-D4 底垫 */
        for (var i = 0; i < 8; i++) {
          note(seq[(step + i) % seq.length], t + i * 0.6, 1.4, 0.055, 'sine', gain);
        }
        step = (step + 1) % seq.length;
      };
      bar();
      var timer = setInterval(bar, 4800);
      return [function () { clearInterval(timer); }];
    }

    /* ================= 环境音生成器 ================= */

    /* 大雨：白噪声 + 低通/高通 */
    function genRain(gain) {
      var src = noiseLoop(noiseBuffer, [filter('lowpass', 850), filter('highpass', 220)], gain);
      return [function () { try { src.stop(); src.disconnect(); } catch (e) { /* 忽略 */ } }];
    }

    /* 室内安静：极低音量布朗噪声 */
    function genRoom(gain) {
      var src = noiseLoop(brownBuffer, [filter('lowpass', 320)], gain);
      return [function () { try { src.stop(); src.disconnect(); } catch (e) { /* 忽略 */ } }];
    }

    /* 心跳：70 BPM 低频脉冲（lub-dub 双跳） */
    function genHeartbeat(gain) {
      var beat = function () {
        var t = ctx.currentTime + 0.03;
        note(55, t, 0.16, 0.5, 'sine', gain);
        note(48, t + 0.16, 0.14, 0.35, 'sine', gain);
      };
      beat();
      var timer = setInterval(beat, 857);
      return [function () { clearInterval(timer); }];
    }

    /* 医院急诊：极低频底噪 + 每 2 秒一声微弱电子滴 */
    function genHospital(gain) {
      var noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.22;
      noiseGain.connect(gain);
      var src = noiseLoop(brownBuffer, [filter('lowpass', 140)], noiseGain);
      var beep = function () {
        note(880, ctx.currentTime + 0.03, 0.12, 0.1, 'sine', gain);
      };
      beep();
      var timer = setInterval(beep, 2000);
      return [
        function () { clearInterval(timer); },
        function () {
          try { src.stop(); src.disconnect(); } catch (e) { /* 忽略 */ }
          try { noiseGain.disconnect(); } catch (e) { /* 忽略 */ }
        }
      ];
    }

    var BGM_GEN = {
      bgm_daily: { gen: genDaily, level: 1.0 },
      bgm_sad: { gen: genSad, level: 1.0 },
      bgm_tense: { gen: genTense, level: 1.0 },
      bgm_hope: { gen: genHope, level: 1.0 }
    };
    var AMB_GEN = {
      ambient_rain: { gen: genRain, level: rainGain },
      ambient_room: { gen: genRoom, level: 0.12 },
      ambient_heartbeat: { gen: genHeartbeat, level: 0.55 },
      ambient_hospital: { gen: genHospital, level: 0.5 }
    };

    /* 淡出并在结束后彻底销毁实例（清理定时器、断开节点，防止泄漏） */
    function stopInst(inst) {
      if (!inst) return;
      ramp(inst.gain.gain, 0, FADE);
      var cleanups = inst.cleanups;
      var gainNode = inst.gain;
      setTimeout(function () {
        for (var i = 0; i < cleanups.length; i++) {
          try { cleanups[i](); } catch (e) { /* 忽略 */ }
        }
        try { gainNode.disconnect(); } catch (e) { /* 忽略 */ }
      }, FADE * 1000 + 120);
    }

    function startInst(name, table, bus) {
      var def = table[name];
      if (!def || !ctx || !bus) return null;
      var gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(bus);
      var cleanups = [];
      try { cleanups = def.gen(gain) || []; } catch (e) { cleanups = []; }
      var level = typeof def.level === 'function' ? def.level() : def.level;
      ramp(gain.gain, level, FADE);
      return { name: name, gain: gain, cleanups: cleanups };
    }

    function switchLayer(inst, name, table, bus) {
      /* 返回新实例；name 为空或 'stop' 表示停止 */
      if (inst && inst.name === name) return inst;
      stopInst(inst);
      if (!name || name === 'stop') return null;
      return startInst(name, table, bus);
    }

    function resumeIfNeeded() {
      try {
        if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          var p = ctx.resume();
          if (p && typeof p.catch === 'function') p.catch(function () { /* 保持静音 */ });
        }
      } catch (e) { /* 忽略 */ }
    }

    /* ================= SFX ================= */

    /* 噪声脉冲（翻页声） */
    function blipNoise(dur, freq, peak) {
      var t = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      var bp = filter('bandpass', freq, 1.2);
      var g = ctx.createGain();
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(sfxBus);
      src.onended = function () {
        try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) { /* 忽略 */ }
      };
      src.start(t, Math.random() * 1.2, dur + 0.05);
    }

    /* 纯音短音（滴声 / 滴答） */
    function blip(freq, dur, peak, type, when) {
      var t = ctx.currentTime + (when || 0);
      var osc = ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(sfxBus);
      osc.onended = function () {
        try { osc.disconnect(); g.disconnect(); } catch (e) { /* 忽略 */ }
      };
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    var SFX = {
      sfx_page: function () { blipNoise(0.05, 2600, 0.5); },   /* 点击继续：0.05s 极短高频脉冲 */
      sfx_sms: function () {                                    /* 短信提示：两声短促滴声 */
        blip(1318, 0.09, 0.5);
        blip(988, 0.14, 0.45, 'sine', 0.11);
      },
      sfx_tick: function () { blip(220, 0.05, 0.45, 'square'); }, /* 倒计时滴答：低频短促音 */
      sfx_note: function () {                                   /* 收集观察点 */
        blip(1568, 0.12, 0.4);
        blip(2093, 0.18, 0.32, 'sine', 0.09);
      },
      /* 打字机：极轻"嗒"声（标点不响，由调用方过滤） */
      sfx_type: function () { blipNoise(0.012, 5200, 0.05); },
      /* 按钮悬停：微弱水滴 */
      sfx_hover: function () { blip(1180, 0.05, 0.06, 'sine'); },
      /* 按钮点击：短促咔哒 */
      sfx_click: function () { blipNoise(0.03, 3200, 0.2); blip(1600, 0.03, 0.1, 'sine'); },
      /* 雷声：低频隆隆 + 噪声滚 */
      sfx_thunder: function () {
        var t = ctx.currentTime;
        var src = ctx.createBufferSource();
        src.buffer = brownBuffer;
        var lp = filter('lowpass', 180, 0.7);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
        src.connect(lp); lp.connect(g); g.connect(sfxBus);
        src.onended = function () { try { src.disconnect(); lp.disconnect(); g.disconnect(); } catch (e) {} };
        src.start(t); src.stop(t + 1.9);
        blip(58, 1.2, 0.3, 'sine');
      },
      /* 沉重敲门/关门 */
      sfx_door: function () {
        var t = ctx.currentTime;
        for (var i = 0; i < 2; i++) {
          var osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(120, t + i * 0.22);
          osc.frequency.exponentialRampToValueAtTime(48, t + i * 0.22 + 0.18);
          var g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + i * 0.22);
          g.gain.exponentialRampToValueAtTime(0.4, t + i * 0.22 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.2);
          osc.connect(g); g.connect(sfxBus);
          (function (o, gg) { o.onended = function () { try { o.disconnect(); gg.disconnect(); } catch (e) {} }; })(osc, g);
          osc.start(t + i * 0.22); osc.stop(t + i * 0.22 + 0.22);
        }
      },
      /* 手机震动：低频脉冲连震 */
      sfx_vibrate: function () {
        var t = ctx.currentTime;
        for (var i = 0; i < 3; i++) {
          var osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.value = 180;
          var g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + i * 0.14);
          g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.14 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.14 + 0.09);
          osc.connect(g); g.connect(sfxBus);
          (function (o, gg) { o.onended = function () { try { o.disconnect(); gg.disconnect(); } catch (e) {} }; })(osc, g);
          osc.start(t + i * 0.14); osc.stop(t + i * 0.14 + 0.1);
        }
      },
      /* 低频心跳：两连跳 */
      sfx_heartbeat: function () {
        blip(55, 0.14, 0.5, 'sine');
        blip(50, 0.16, 0.4, 'sine', 0.18);
      },
      /* 玻璃碎裂/重物落地 */
      sfx_crash: function () {
        var t = ctx.currentTime;
        var src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        var hp = filter('highpass', 2000, 0.8);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        src.connect(hp); hp.connect(g); g.connect(sfxBus);
        src.onended = function () { try { src.disconnect(); hp.disconnect(); g.disconnect(); } catch (e) {} };
        src.start(t); src.stop(t + 0.75);
        blip(75, 0.4, 0.4, 'sine');
      },
      /* 医院监护仪滴声 */
      sfx_beep: function () {
        blip(880, 0.09, 0.3, 'sine');
      }
    };

    /* 各音效的最小触发间隔（秒）：翻页 45ms，滴答 0.4s（与每秒一拍对齐） */
    var SFX_MIN_GAP = {
      sfx_page: 0.045, sfx_sms: 0.2, sfx_tick: 0.4, sfx_note: 0.15,
      sfx_type: 0.03, sfx_hover: 0.12, sfx_click: 0.06,
      sfx_thunder: 0.6, sfx_door: 0.25, sfx_vibrate: 0.3,
      sfx_heartbeat: 0.5, sfx_crash: 0.4, sfx_beep: 0.5
    };
    var sfxLast = {};

    /* 初始化：只在用户手势（开始游戏 / 继续 / 回忆）后调用 */
    function unlock() {
      if (ctx) { resumeIfNeeded(); return true; }
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return false;
        ctx = new Ctx();
        makeNoiseBuffers();

        bgmBus = ctx.createGain();
        bgmBus.gain.value = bgmScale() * 0.15;   /* 默认压低到 0.15 */
        bgmBus.connect(ctx.destination);

        /* 多重 Delay 混响总线：双线延迟反馈，营造空间感 */
        bgmVerb = ctx.createGain();
        bgmVerb.gain.value = 0.35;
        var d1 = ctx.createDelay(1.0); d1.delayTime.value = 0.32;
        var d2 = ctx.createDelay(1.0); d2.delayTime.value = 0.51;
        var fb1 = ctx.createGain(); fb1.gain.value = 0.3;
        var fb2 = ctx.createGain(); fb2.gain.value = 0.22;
        var verbLp = filter('lowpass', 2400, 0.6);
        bgmVerb.connect(d1); bgmVerb.connect(d2);
        d1.connect(fb1); fb1.connect(d1); d1.connect(verbLp);
        d2.connect(fb2); fb2.connect(d2); d2.connect(verbLp);
        verbLp.connect(ctx.destination);
        bgmBus.connect(bgmVerb);

        ambBus = ctx.createGain();
        ambBus.gain.value = ambScale();
        ambBus.connect(ctx.destination);

        sfxBus = ctx.createGain();
        sfxBus.gain.value = sfxScale() * 0.5;
        sfxBus.connect(ctx.destination);

        resumeIfNeeded();

        /* 补播 unlock 之前记录的目标音频 */
        var b = pendingBgm, a = pendingAmb;
        pendingBgm = null;
        pendingAmb = null;
        if (b && b !== 'stop') bgmInst = switchLayer(null, b, BGM_GEN, bgmBus);
        if (a && a !== 'stop') ambInst = switchLayer(null, a, AMB_GEN, ambBus);
        return true;
      } catch (e) {
        ctx = null;
        bgmBus = ambBus = sfxBus = bgmVerb = null;
        return false;
      }
    }

    return {
      unlock: unlock,

      /* 页面从后台切回 / iOS 挂起后恢复播放 */
      resume: resumeIfNeeded,

      /* 切换 BGM：1.5s 淡出旧的、淡入新的；同名不重启；'stop' 停止 */
      switchBGM: function (name) {
        name = name || 'stop';
        pendingBgm = name;
        if (!ctx) return;
        bgmInst = switchLayer(bgmInst, name, BGM_GEN, bgmBus);
      },

      /* 切换环境音：独立于 BGM，可叠加 */
      switchAmbient: function (name) {
        name = name || 'stop';
        pendingAmb = name;
        if (!ctx) return;
        ambInst = switchLayer(ambInst, name, AMB_GEN, ambBus);
      },

      /* 播放一次性音效（带节流：同一音效在最小间隔内的重复触发直接丢弃，
         防止疯狂连点瞬间堆叠大量振荡器导致爆音） */
      playSFX: function (name) {
        if (!ctx || !sfxBus) return;
        var fn = SFX[name];
        if (!fn) return;
        var now = ctx.currentTime;
        var gap = SFX_MIN_GAP[name] || 0.05;
        if (sfxLast[name] !== undefined && now - sfxLast[name] < gap) return;
        sfxLast[name] = now;
        resumeIfNeeded();
        try { fn(); } catch (e) { /* 静音兜底 */ }
      },

      /* 设置面板音量（0~100）实时生效 */
      setVolumes: function () {
        if (!ctx) return;
        if (bgmBus) ramp(bgmBus.gain, bgmScale() * 0.15, 0.1);
        if (ambBus) ramp(ambBus.gain, ambScale(), 0.1);
        if (sfxBus) ramp(sfxBus.gain, sfxScale() * 0.5, 0.1);
      },

      /* 动态雨声：她敞开心扉后雨声渐弱（仅作用于 ambient_rain） */
      setRainMood: function (mood) {
        rainMood = clamp(typeof mood === 'number' && isFinite(mood) ? mood : 1, 0, 1);
        if (ctx && ambInst && ambInst.name === 'ambient_rain') {
          ramp(ambInst.gain.gain, rainGain(), 0.8);
        }
      },

      /* 返回标题：淡出并销毁全部音频 */
      stopAll: function () {
        pendingBgm = 'stop';
        pendingAmb = 'stop';
        if (!ctx) return;
        bgmInst = switchLayer(bgmInst, 'stop', BGM_GEN, bgmBus);
        ambInst = switchLayer(ambInst, 'stop', AMB_GEN, ambBus);
      },

      /* 把三类音量同时渐隐到 0（坏结局寂静 / 真结局切换前过渡） */
      fadeMaster: function (toSilence) {
        if (!ctx) return;
        var target = toSilence ? 0 : 1;
        if (bgmBus) ramp(bgmBus.gain, bgmScale() * 0.15 * target, 2.4);
        if (ambBus) ramp(ambBus.gain, ambScale() * target, 2.4);
        if (sfxBus) ramp(sfxBus.gain, sfxScale() * 0.5 * target, 2.4);
      },

      /* 真结局 BGM 渐强至预设音量（用 ramp 覆盖默认淡入速度） */
      swellBGM: function () {
        if (!ctx || !bgmBus) return;
        ramp(bgmBus.gain, bgmScale() * 0.22, 4.5);
      },

      /* 调试 / 测试用状态 */
      state: function () {
        return {
          unlocked: !!ctx,
          bgm: bgmInst ? bgmInst.name : null,
          ambient: ambInst ? ambInst.name : null,
          pendingBgm: pendingBgm,
          pendingAmbient: pendingAmb
        };
      }
    };
  })();
  window.AudioManager = AudioManager;

  /* ------------------------------ 运行时状态 ------------------------------ */

  var state = null;
  var runtime = {
    mode: 'idle',       // idle | typing | waiting | choice | timed | observe | note | phone | ended
    fullText: '',
    units: [],          // 打字机单元：[{ch, slow, shake, kw}] 或 {pause:ms}
    pos: 0,
    curSpan: null,
    curSig: '',
    lineKey: '',
    lineWasRead: false,
    extra: false,       // 回忆片段模式：不写自动存档
    lastChapter: '',
    sceneMoods: {},     // 当前场景的角色默认表情（scene.moods）
    lastLine: '',       // 最后一句已显示的台词（供存档显示"回忆碎片"）
    playStart: 0,       // 本局开始时间戳（计算游玩时长）
    typeTimer: null,
    autoTimer: null,
    skipTimer: null,
    autoPlay: false,
    skipping: false,
    ctrlSkip: false,
    loading: false,

    countdownTimer: null,
    timerDeadline: 0,
    timerTotal: 0,
    timerOptions: null,
    countdownFill: null,
    countdownNum: null,
    lastTickSecond: -1,

    observeNoteId: ''
  };

  var toastTimer = null;
  var debugTimer = null;
  var uiHidden = false;

  /* ------------------------------ 全局错误捕获 ------------------------------ */
  /* 运行出错时在屏幕上给出友好提示，而不是直接崩溃/白屏 */
  function showFatal(msg) {
    try {
      var box = byId('fatal-error');
      if (!box) {
        box = document.createElement('div');
        box.id = 'fatal-error';
        box.className = 'fatal-error';
        box.setAttribute('role', 'alert');
        document.body.appendChild(box);
      }
      box.textContent = '页面出了点小问题：' + (msg || '未知错误') + '。可以尝试刷新页面，游戏进度已自动保存。';
      box.hidden = false;
    } catch (e) { /* 提示本身失败则静默 */ }
  }

  window.addEventListener('error', function (e) {
    showFatal(e && e.message ? e.message : '脚本错误');
  });
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e && e.reason;
    showFatal('异步错误：' + (reason && reason.message ? reason.message : String(reason || '未知')));
  });

  function newState() {
    return {
      version: 2,
      cursor: { scene: STORY.startScene, step: 0 },
      bg: '',
      stats: { trust: 4, pressure: 2 },
      flags: {},
      notes: [],
      history: [],
      phone: { threads: {}, unread: 0, pending: null }
    };
  }

  function messageFrom(value) {
    if (value === 'me') return 'me';
    if (value === 'system') return 'system';
    return 'lin';
  }

  function normalizeState(st) {
    if (!st || typeof st !== 'object') return null;
    if (!st.stats || typeof st.stats !== 'object') st.stats = {};

    if (typeof st.stats.trust !== 'number' || !isFinite(st.stats.trust)) st.stats.trust = 0;
    if (typeof st.stats.pressure !== 'number') {
      st.stats.pressure = typeof st.stats.stress === 'number' ? st.stats.stress : 0;
    }
    delete st.stats.stress;
    st.stats.trust = clamp(Math.round(st.stats.trust), 0, 12);
    st.stats.pressure = clamp(Math.round(st.stats.pressure), 0, 12);

    if (!st.flags || typeof st.flags !== 'object') st.flags = {};

    if (!Array.isArray(st.notes)) st.notes = [];
    st.notes = st.notes.filter(function (id) { return typeof id === 'string'; });

    if (!Array.isArray(st.history)) st.history = [];
    st.history = st.history.filter(function (item) {
      return item && typeof item.text === 'string' && typeof item.key === 'string';
    }).slice(-200);

    if (!st.phone || typeof st.phone !== 'object') {
      st.phone = { threads: {}, unread: 0, pending: null };
    }
    if (!st.phone.threads || typeof st.phone.threads !== 'object') st.phone.threads = {};

    Object.keys(st.phone.threads).forEach(function (threadId) {
      var thread = st.phone.threads[threadId];
      if (!thread || typeof thread !== 'object') {
        st.phone.threads[threadId] = { messages: [] };
        return;
      }
      if (!Array.isArray(thread.messages)) thread.messages = [];
      thread.messages = thread.messages.filter(function (m) {
        return m && typeof m.text === 'string';
      }).map(function (m) {
        return {
          from: messageFrom(m.from),
          text: m.text,
          time: typeof m.time === 'string' ? m.time : ''
        };
      });
    });

    if (typeof st.phone.unread !== 'number' || !isFinite(st.phone.unread)) st.phone.unread = 0;
    st.phone.unread = clamp(Math.floor(st.phone.unread), 0, 99);

    if (!st.phone.pending || typeof st.phone.pending !== 'object' ||
        !Array.isArray(st.phone.pending.replies)) {
      st.phone.pending = null;
    } else {
      var pendingThread = typeof st.phone.pending.thread === 'string' ? st.phone.pending.thread : 'lin';
      st.phone.pending.thread = pendingThread;
      if (!st.phone.threads[pendingThread]) st.phone.threads[pendingThread] = { messages: [] };
      st.phone.pending.replies = st.phone.pending.replies.filter(function (r) {
        return r && typeof r.text === 'string';
      });
    }

    if (typeof st.bg !== 'string') st.bg = '';
    if (!st.cursor || typeof st.cursor !== 'object') return null;
    if (typeof st.cursor.step !== 'number' || st.cursor.step < 0) st.cursor.step = 0;

    st.version = 2;
    return st;
  }

  /* ------------------------------ 存档数据 ------------------------------ */

  function currentSceneTitle() {
    if (!state) return '';
    var scene = STORY.scenes[state.cursor.scene];
    return (scene && scene.title) || state.cursor.scene || '';
  }

  function makeSave() {
    var playDurationSec = runtime.playStart ? Math.round((Date.now() - runtime.playStart) / 1000) : 0;
    return {
      version: 2,
      savedAt: Date.now(),
      sceneTitle: currentSceneTitle(),
      lastLine: runtime.lastLine || '',
      playDuration: playDurationSec,
      state: JSON.parse(JSON.stringify(state))
    };
  }

  function autoSave() {
    if (!state || runtime.loading || runtime.extra) return;
    safeSet(SAVE_AUTO, JSON.stringify(makeSave()));
  }

  function readSave(key) {
    var raw = safeGet(key);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (!data || !data.state || typeof data.state !== 'object') return null;
      if (data.state.version !== 1 && data.state.version !== 2) return null;
      var st = normalizeState(data.state);
      if (!st || !st.cursor || !STORY.scenes[st.cursor.scene]) return null;
      if (typeof data.savedAt !== 'number') data.savedAt = 0;
      if (typeof data.sceneTitle !== 'string') data.sceneTitle = '';
      return data;
    } catch (e) {
      return null;
    }
  }

  function formatTime(ts) {
    if (!ts) return '未知时间';
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function formatClock(ts) {
    var d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /* ------------------------------ 界面基础 ------------------------------ */

  function showScreen(name) {
    UI.title.classList.toggle('active', name === 'title');
    UI.game.classList.toggle('active', name === 'game');
    uiHidden = false;
    UI.game.classList.remove('ui-hidden');
  }

  /* 一键隐藏 UI：只看立绘与背景（H 键 / 鼠标右键 / 快捷栏按钮） */
  function setUiHidden(hidden) {
    if (!UI.game.classList.contains('active')) return;
    if (hidden && anyOverlayOpen()) return;
    uiHidden = !!hidden;
    UI.game.classList.toggle('ui-hidden', uiHidden);
    if (uiHidden) toast('界面已隐藏 · 点击画面或按 H 恢复');
  }

  function openOverlay(id) {
    var node = byId(id);
    if (!node) return;
    node.hidden = false;
    clearTimeout(runtime.autoTimer);
    /* 倒计时抉择期间打开任何面板：暂停倒计时，避免滴答声残留在面板后、超时选项在面板后触发 */
    if (runtime.mode === 'timed' && runtime.countdownTimer) {
      clearInterval(runtime.countdownTimer);
      runtime.countdownTimer = null;
      runtime.timerPausedLeft = Math.max(0, runtime.timerDeadline - Date.now());
    }
    syncStageDim();
  }

  function closeOverlay(node) {
    if (!node) return;
    node.hidden = true;
    syncStageDim();

    /* 无需回复的短信：看完关闭即继续剧情 */
    if (node.id === 'overlay-phone' && state && state.phone && state.phone.pending &&
        (!state.phone.pending.replies || state.phone.pending.replies.length === 0)) {
      state.phone.pending = null;
      state.phone.unread = 0;
      autoSave();
      updatePhoneUI();
      if (runtime.mode === 'phone') {
        runtime.mode = 'idle';
        UI.dlg.hidden = false;
        processNext();
      }
      return;
    }

    if (runtime.autoPlay && runtime.mode === 'waiting' && !anyOverlayOpen()) scheduleAuto();

    /* 面板全部关闭后：恢复暂停的倒计时 */
    if (runtime.mode === 'timed' && !runtime.countdownTimer &&
        runtime.timerPausedLeft != null && !anyOverlayOpen()) {
      runtime.timerDeadline = Date.now() + runtime.timerPausedLeft;
      runtime.timerPausedLeft = null;
      updateCountdown();
      runtime.countdownTimer = setInterval(updateCountdown, 100);
    }
  }

  function closeAllOverlays() {
    var list = document.querySelectorAll('.overlay');
    for (var i = 0; i < list.length; i++) list[i].hidden = true;
    syncStageDim();
  }

  function anyOverlayOpen() {
    return !!document.querySelector('.overlay:not([hidden])');
  }

  function toast(message) {
    if (!UI.toast) return;
    UI.toast.textContent = message;
    UI.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { UI.toast.hidden = true; }, 1800);
  }

  function clearTimers() {
    clearTimeout(runtime.typeTimer);
    runtime.typeTimer = null;
    clearTimeout(runtime.autoTimer);
    runtime.autoTimer = null;
    clearTimeout(runtime.skipTimer);
    runtime.skipTimer = null;
    clearInterval(runtime.countdownTimer);
    runtime.countdownTimer = null;
    runtime.timerPausedLeft = null;
  }

  function updateAutoButton() {
    if (!UI.btnAuto) return;
    UI.btnAuto.classList.toggle('on', runtime.autoPlay);
    UI.btnAuto.setAttribute('aria-pressed', runtime.autoPlay ? 'true' : 'false');
  }

  function updateSkipButton() {
    if (!UI.btnSkip) return;
    UI.btnSkip.classList.toggle('on', runtime.skipping);
    UI.btnSkip.setAttribute('aria-pressed', runtime.skipping ? 'true' : 'false');
  }

  /* ------------------------------ 背景与场景 ------------------------------ */

  /* 场景色调：按背景 id 推断场景氛围 */
  function toneOfBg(bgId) {
    if (!bgId) return 'room';
    if (/hospital/.test(bgId)) return 'hospital';
    if (/apartment|gate_rain|old_school_rain|street_rain/.test(bgId)) return 'rain';
    if (/gym|corridor|classroom/.test(bgId)) return 'warm';
    return 'room';
  }
  function isOutdoorBg(bgId) {
    return !!(bgId && /gate_rain|old_school_rain|street_rain|hospital$/.test(bgId));
  }

  var bgSwapTimer = null;
  function applyBackground(bgId) {
    var cfg = bgId ? STORY.backgrounds[bgId] : null;
    var layer = UI.stageBg || UI.stage;
    if (state) state.bg = bgId || '';

    /* 场景色调遮罩 + 雨幕切换 */
    if (UI.sceneTint) UI.sceneTint.dataset.tone = toneOfBg(bgId);
    var outdoor = isOutdoorBg(bgId);
    SceneRain.setIndoor(!outdoor);
    if (outdoor) SceneRain.start(); else SceneRain.stop();

    var newUrl = (cfg && cfg.src) ? 'url("' + String(cfg.src).replace(/"/g, '%22') + '")' : '';
    var curUrl = layer.style.backgroundImage;
    if (newUrl === curUrl) { layer.classList.toggle('has-image', !!newUrl); return; }

    /* 交叉淡入淡出：旧图淡出 → 换图 → 新图淡入 */
    clearTimeout(bgSwapTimer);
    layer.classList.add('crossfade');
    bgSwapTimer = setTimeout(function () {
      layer.style.backgroundImage = '';
      layer.classList.remove('has-image');
      if (newUrl) {
        layer.classList.add('has-image');
        layer.style.backgroundImage = newUrl;
        var probe = new Image();
        probe.onerror = function () {
          layer.style.backgroundImage = '';
          layer.classList.remove('has-image');
        };
        probe.src = cfg.src;
      }
      /* 强制 reflow 后去掉 crossfade，触发淡入 */
      void layer.offsetWidth;
      layer.classList.remove('crossfade');
    }, 220);
  }

  /* 章节英文代号：用于场景 HUD 的眉标 */
  var CHAPTER_EN = {
    '序章': 'PROLOGUE',
    '第一章': 'CHAPTER I',
    '第二章': 'CHAPTER II',
    '第三章': 'CHAPTER III',
    '终章': 'EPILOGUE',
    '回忆': 'MEMORY'
  };

  /* 场景标签拆成两行：英文眉标 + 中文小标题 */
  function setSceneTag(scene) {
    if (!UI.sceneTag) return;
    var full = (scene && scene.title) || '';
    var idx = full.indexOf('·');
    var kicker = idx > -1 ? full.slice(0, idx).trim() : '';
    var sub = idx > -1 ? full.slice(idx + 1).trim() : full;
    if (UI.sceneKicker) UI.sceneKicker.textContent = CHAPTER_EN[kicker] || kicker || 'SCENE';
    if (UI.sceneTitle) UI.sceneTitle.textContent = sub;
    UI.sceneTag.setAttribute('title', full);
  }

  function applySceneChrome(scene) {
    setSceneTag(scene);
    applyBackground(scene.bg);
    /* 情绪红晕：压抑场景开启 */
    if (UI.emotionVeil) UI.emotionVeil.classList.toggle('on', !!scene.veil);
    /* 场景自带音频配置：未配置则保持当前声音不变 */
    if (scene.bgm !== undefined) AudioManager.switchBGM(scene.bgm);
    if (scene.ambient !== undefined) AudioManager.switchAmbient(scene.ambient);
  }

  var currentPortrait = ''; /* 已废弃，保留避免旧引用报错 */
  var portraitSwapTimer = null; /* 已废弃 */

  /* 兜底剪影：在线立绘加载失败时使用（柔和光影，控制台不报错） */
  var FALLBACK_PORTRAIT = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000">' +
    '<defs><radialGradient id="g" cx="50%" cy="42%" r="55%">' +
    '<stop offset="0%" stop-color="#5a7a9c" stop-opacity="0.55"/>' +
    '<stop offset="55%" stop-color="#3a4f6a" stop-opacity="0.35"/>' +
    '<stop offset="100%" stop-color="#10151d" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="300" cy="520" rx="230" ry="430" fill="url(#g)"/>' +
    '<ellipse cx="300" cy="180" rx="88" ry="100" fill="#2a3648" opacity="0.7"/>' +
    '<path d="M210 320 q90 -60 180 0 l20 380 q-110 40 -220 0 Z" fill="#232f42" opacity="0.75"/>' +
    '</svg>'
  );
  function setPortraitSrc(url) {
    UI.portraitImg.onerror = function () {
      UI.portraitImg.onerror = null;
      if (UI.portraitImg.src !== FALLBACK_PORTRAIT) UI.portraitImg.src = FALLBACK_PORTRAIT;
    };
    UI.portraitImg.src = url;
  }
  function setPortraitSrcB(url) {
    UI.portraitImgB.onerror = function () {
      UI.portraitImgB.onerror = null;
      if (UI.portraitImgB.src !== FALLBACK_PORTRAIT) UI.portraitImgB.src = FALLBACK_PORTRAIT;
    };
    UI.portraitImgB.src = url;
  }

  /* ============ 双立绘槽位系统：右槽(默认/居中) + 左槽 ============ */
  /* 规则：说话者全亮、另一人变暗；换图先预加载再交叉淡入，杜绝闪烁 */
  var slots = [
    { layer: function () { return UI.portraitLayer; }, setSrc: setPortraitSrc, who: null, url: '' },
    { layer: function () { return UI.portraitLayerB; }, setSrc: setPortraitSrcB, who: null, url: '' }
  ];

  function portraitUrlFor(who, mood) {
    var cfg = STORY.characters[who];
    if (!cfg) return '';
    if (mood && cfg.moods && cfg.moods[mood]) return cfg.moods[mood];
    return cfg.portrait || '';
  }

  function slotOf(who) {
    for (var i = 0; i < slots.length; i++) if (slots[i].who === who) return slots[i];
    return null;
  }

  /* 双人同台时右侧槽位移到 73%，单人回居中 */
  function updateSlotLayout() {
    var dual = !!(slots[0].who && slots[1].who);
    var l0 = slots[0].layer();
    if (l0) l0.classList.toggle('slot-right', dual);
  }

  function swapSlotImage(slot, url) {
    var layer = slot.layer();
    if (!layer) return;
    if (slot.url === url) { layer.classList.add('show'); return; }
    var wasShown = layer.classList.contains('show');
    slot.url = url;
    layer.classList.remove('show');
    var apply = function () {
      if (slot.url !== url) return; /* 期间又被换了 */
      slot.setSrc(url);
      layer.classList.add('show');
    };
    /* 预加载完成后再换 src，避免白闪/硬切 */
    var pre = new Image();
    pre.onload = function () { setTimeout(apply, wasShown ? 220 : 0); };
    pre.onerror = function () { setTimeout(apply, wasShown ? 220 : 0); };
    pre.src = url;
  }

  /* 角色说话：分配槽位、说话者全亮、另一人变暗、按情绪选立绘 */
  function showPortrait(who, mood) {
    var url = portraitUrlFor(who, mood);
    if (!url || !UI.portraitLayer) return;
    var slot = slotOf(who);
    if (!slot) {
      slot = !slots[0].who ? slots[0] : (!slots[1].who ? slots[1] : slots[1]);
      slot.who = who;
      slot.url = '';
    }
    updateSlotLayout();
    for (var i = 0; i < slots.length; i++) {
      if (slots[i] !== slot && slots[i].who) slots[i].layer().classList.add('dim');
    }
    slot.layer().classList.remove('dim');
    /* 情绪滤镜：同一底图下用饱和度/亮度区分隐忍(sad)与崩溃(cry) */
    var moodLayer = slot.layer();
    moodLayer.classList.remove('mood-sad', 'mood-cry', 'mood-hope', 'mood-anxious', 'mood-default');
    if (mood) moodLayer.classList.add('mood-' + mood); else moodLayer.classList.add('mood-default');
    if (UI.stage) UI.stage.classList.add('has-portrait');
    swapSlotImage(slot, url);
  }

  /* 旁白：两位在场角色都降为陪衬 */
  function dimPortrait() {
    for (var i = 0; i < slots.length; i++) {
      var l = slots[i].layer();
      if (l && slots[i].who) l.classList.add('dim');
    }
  }

  function hidePortrait() {
    for (var i = 0; i < slots.length; i++) {
      var l = slots[i].layer();
      slots[i].who = null;
      slots[i].url = '';
      if (l) l.classList.remove('show', 'dim', 'slot-right');
    }
    if (UI.stage) UI.stage.classList.remove('has-portrait');
  }

  /* 模态聚焦：选项、短信、设置等打开时虚化压暗背景与立绘 */
  function syncStageDim() {
    if (!UI.stage) return;
    var dim = anyOverlayOpen() || !UI.choice.hidden;
    UI.stage.classList.toggle('modal-open', dim);
  }

  /* 章节名：scene.title 形如「第一章 · 前后桌」，取「·」前部分 */
  function chapterOf(scene) {
    var t = (scene && scene.title) || '';
    var idx = t.indexOf('·');
    var head = idx === -1 ? t : t.slice(0, idx);
    return head.replace(/\s/g, '');
  }

  var chapterCardTimers = [];

  /* 黑场过渡：渐暗 → 显示章节标题约 2 秒 → 渐亮 */
  function showChapterCard(scene, done) {
    if (!UI.chapterCard) { done(); return; }

    var chapter = chapterOf(scene);
    var title = (scene && scene.title) || '';
    var idx = title.indexOf('·');
    UI.chapterKicker.textContent = chapter || '';
    UI.chapterTitle.textContent = idx === -1 ? title : title.slice(idx + 1).replace(/^\s+/, '');

    runtime.mode = 'card';
    UI.chapterCard.hidden = false;
    /* 黑屏转场：淡出全部声音，新场景音频在全黑切换背景时再淡入 */
    AudioManager.switchBGM('stop');
    AudioManager.switchAmbient('stop');
    /* 强制 reflow 后再加 class，保证渐暗过渡生效 */
    void UI.chapterCard.offsetWidth;
    UI.chapterCard.classList.add('on');

    chapterCardTimers.push(setTimeout(function () {
      /* 全黑时切换背景与立绘 */
      applySceneChrome(scene);
      hidePortrait();
    }, 580));

    chapterCardTimers.push(setTimeout(function () {
      UI.chapterCard.classList.remove('on');
    }, 580 + 2000));

    chapterCardTimers.push(setTimeout(function () {
      UI.chapterCard.hidden = true;
      runtime.mode = 'idle';
      done();
    }, 580 + 2000 + 580));
  }

  function cancelChapterCard() {
    for (var i = 0; i < chapterCardTimers.length; i++) clearTimeout(chapterCardTimers[i]);
    chapterCardTimers = [];
    if (UI.chapterCard) {
      UI.chapterCard.classList.remove('on');
      UI.chapterCard.hidden = true;
    }
    if (runtime.mode === 'card') runtime.mode = 'idle';
  }

  function enterScene(sceneId) {
    var scene = STORY.scenes[sceneId];
    if (!scene) {
      showEnd('剧情节点缺失：' + sceneId);
      return;
    }
    clearTimers();
    cancelChapterCard();
    state.cursor = { scene: sceneId, step: 0 };
    runtime.sceneMoods = scene.moods || {};
    hideChoices();
    autoSave();

    var chapter = chapterOf(scene);
    var chapterChanged = chapter !== runtime.lastChapter;
    runtime.lastChapter = chapter;

    if (chapterChanged) {
      showChapterCard(scene, processNext);
      return;
    }

    applySceneChrome(scene);
    hidePortrait();
    processNext();
  }

  /* ------------------------------ 剧情解释器 ------------------------------ */

  function processNext() {
    if (!state) return;

    if (state.phone && state.phone.pending) {
      showPhonePrompt();
      return;
    }

    var guard = 0;

    while (guard++ < 1000) {
      var scene = STORY.scenes[state.cursor.scene];
      if (!scene) { showEnd('剧情节点缺失。'); return; }

      var steps = scene.steps || [];
      if (state.cursor.step >= steps.length) {
        showEnd('试玩结束。');
        return;
      }

      var step = steps[state.cursor.step];
      if (!step || typeof step.t !== 'string') {
        state.cursor.step += 1;
        continue;
      }

      /* 剧情事件音效：sfx 字段即触发，不影响流程 */
      if (step.sfx) AudioManager.playSFX(step.sfx);

      if (step.t === 'bg') {
        applyBackground(step.id);
        state.cursor.step += 1;
        continue;
      }
      if (step.t === 'goto') {
        enterScene(step.scene);
        return;
      }
      if (step.t === 'end') {
        if (runtime.extra) {
          showEnd(step.text || '—— 回忆 · 完 ——', {
            kicker: 'EXTRA · 回忆',
            title: '那个雨天之前'
          });
        } else {
          showEnd(step.text || '试玩结束。');
        }
        return;
      }
      if (step.t === 'ending') {
        resolveEnding();
        return;
      }
      if (step.t === 'say' || step.t === 'narrate') {
        showLine(step, state.cursor.step);
        return;
      }
      if (step.t === 'choice') {
        showChoices(step);
        return;
      }
      if (step.t === 'timedChoice') {
        showTimedChoice(step);
        return;
      }
      if (step.t === 'observe') {
        if (step.note && state.notes.indexOf(step.note) !== -1) {
          state.cursor.step += 1;
          continue;
        }
        showObservation(step);
        return;
      }
      if (step.t === 'inspect') {
        showInspect(step);
        return;
      }
      if (step.t === 'qte') {
        showQTE(step);
        return;
      }
      if (step.t === 'phone') {
        deliverPhone(step);
        return;
      }

      state.cursor.step += 1;
    }

    showEnd('剧情指令出现循环，已停止。');
  }

  /* ------------------------------ 台词与阅读记录 ------------------------------ */

  /* 台词演出标签：
     [停顿]      —— 打字停顿约 0.5 秒，不显示
     [慢]…[/慢]  —— 之间的文字以约 3 倍间隔缓慢打出
     [抖]…[/抖]  —— 之间的文字带轻微左右抖动（情绪激动/崩溃时）
     关键词高亮：下列词汇自动着色，无需手动标注 */
  var KEYWORDS = [
    { w: '药有点苦', cls: 'hl-warm' },
    { w: '对不起', cls: 'hl-warm' },
    { w: '没事', cls: 'hl-warm' },
    { w: '别走', cls: 'hl-cold' },
    { w: '我在', cls: 'hl-cold' },
    { w: '谢谢', cls: 'hl-cold' }
  ];

  var PUNCT_SHORT = { '，': 1, '、': 1, '；': 1, '：': 1, ',': 1, ';': 1 };
  var PUNCT_LONG = { '。': 1, '…': 1, '？': 1, '！': 1, '—': 1, '.': 1, '?': 1, '!': 1 };

  function stripTags(text) {
    return String(text).replace(/\[停顿\]|\[慢\]|\[\/慢\]|\[抖\]|\[\/抖\]/g, '');
  }

  /* 把带标签的台词解析成逐字单元 */
  function parseLineUnits(text) {
    var units = [];
    var slow = false;
    var shake = false;
    var i = 0;
    while (i < text.length) {
      if (text.indexOf('[停顿]', i) === i) { units.push({ pause: 520 }); i += 4; continue; }
      if (text.indexOf('[/慢]', i) === i) { slow = false; i += 4; continue; }
      if (text.indexOf('[慢]', i) === i) { slow = true; i += 3; continue; }
      if (text.indexOf('[/抖]', i) === i) { shake = false; i += 4; continue; }
      if (text.indexOf('[抖]', i) === i) { shake = true; i += 3; continue; }

      var hit = null;
      for (var k = 0; k < KEYWORDS.length; k++) {
        if (text.indexOf(KEYWORDS[k].w, i) === i) { hit = KEYWORDS[k]; break; }
      }
      if (hit) {
        for (var j = 0; j < hit.w.length; j++) {
          units.push({ ch: hit.w.charAt(j), slow: slow, shake: shake, kw: hit.cls });
        }
        i += hit.w.length;
        continue;
      }
      units.push({ ch: text.charAt(i), slow: slow, shake: shake, kw: '' });
      i += 1;
    }
    return units;
  }

  function unitSig(u) {
    return (u.shake ? 'S' : '') + (u.kw || '');
  }

  function makeUnitSpan(sig) {
    var span = document.createElement('span');
    var cls = [];
    if (sig.indexOf('S') !== -1) cls.push('fx-shake');
    var kw = sig.replace('S', '');
    if (kw) cls.push(kw);
    if (cls.length) span.className = cls.join(' ');
    return span;
  }

  /* 一次性渲染整行（跳过时 / 补完打字时） */
  function renderUnitsAll() {
    UI.line.textContent = '';
    var frag = document.createDocumentFragment();
    var span = null;
    var sig = null;
    for (var i = 0; i < runtime.units.length; i++) {
      var u = runtime.units[i];
      if (u.pause) continue;
      var s = unitSig(u);
      if (!span || s !== sig) {
        span = makeUnitSpan(s);
        sig = s;
        frag.appendChild(span);
      }
      span.textContent += u.ch;
    }
    UI.line.appendChild(frag);
  }

  /* 给纯文本节点加关键词高亮（短信气泡用） */
  function appendHighlighted(el, text) {
    var i = 0;
    while (i < text.length) {
      var hit = null;
      for (var k = 0; k < KEYWORDS.length; k++) {
        if (text.indexOf(KEYWORDS[k].w, i) === i) { hit = KEYWORDS[k]; break; }
      }
      if (hit) {
        var span = document.createElement('span');
        span.className = hit.cls;
        span.textContent = hit.w;
        el.appendChild(span);
        i += hit.w.length;
      } else {
        el.appendChild(document.createTextNode(text.charAt(i)));
        i += 1;
      }
    }
  }

  function pushHistory(step, index) {
    if (!state) return;
    var key = state.cursor.scene + '#' + index;
    var last = state.history.length ? state.history[state.history.length - 1] : null;
    if (last && last.key === key) return;

    var character = step.who ? STORY.characters[step.who] : null;
    state.history.push({
      key: key,
      who: character ? (character.name || '') : '旁白',
      text: stripTags(step.text == null ? '' : step.text)
    });

    if (state.history.length > 200) state.history.shift();
  }

  function markRead(key) {
    if (!key || !globalData.read) return;
    if (globalData.read[key]) return;
    globalData.read[key] = 1;
    scheduleGlobalSave();
  }

  function showLine(step, index) {
    var hasSpeaker = !!(step.who && STORY.characters[step.who]);
    var isNarration = step.t === 'narrate' || !hasSpeaker;

    if (hasSpeaker) showPortrait(step.who, step.mood || (runtime.sceneMoods && runtime.sceneMoods[step.who]));
    else dimPortrait();

    UI.dlg.hidden = false;
    UI.choice.hidden = true;
    UI.choice.innerHTML = '';
    UI.choice.classList.remove('timed');
    UI.game.classList.remove('timing');
    syncStageDim();

    UI.dlg.classList.toggle('narration', isNarration);
    if (!isNarration) {
      var ch = STORY.characters[step.who];
      UI.speaker.textContent = ch.name || '';
      UI.speaker.style.color = ch.color || '';
      /* 名牌左侧竖条与发光跟随角色色 */
      if (UI.speaker.style.setProperty) UI.speaker.style.setProperty('--sp-color', ch.color || '#dca7b4');
      UI.speaker.hidden = false;
    } else {
      UI.speaker.textContent = '';
      UI.speaker.hidden = true;
    }

    UI.dlg.scrollTop = 0;
    /* 文本抖动：shake:true 触发 */
    UI.dlg.classList.remove('fx-shake');
    if (step.shake) {
      void UI.dlg.offsetWidth;
      UI.dlg.classList.add('fx-shake');
    }
    runtime.lineKey = state.cursor.scene + '#' + index;
    runtime.lineWasRead = !!(globalData.read && globalData.read[runtime.lineKey]);
    runtime.fullText = String(step.text == null ? '' : step.text);
    runtime.units = parseLineUnits(runtime.fullText);

    /* 记录到存档显示的"回忆碎片"（旁白只保留前 20 字，对白加说话者） */
    var chLabel = hasSpeaker ? (STORY.characters[step.who] && STORY.characters[step.who].name ? STORY.characters[step.who].name + '：' : '') : '';
    var lineForSave = chLabel + runtime.fullText;
    if (lineForSave.length > 60) lineForSave = lineForSave.slice(0, 58) + '……';
    runtime.lastLine = lineForSave;
    runtime.mode = 'typing';
    UI.next.hidden = true;
    UI.line.textContent = '';
    /* 已读台词略微变暗，未读保持高亮 */
    UI.line.classList.toggle('read', runtime.lineWasRead);

    pushHistory(step, index);

    if (runtime.skipping) {
      if (runtime.lineWasRead) {
        renderUnitsAll();
        finishTyping();
        scheduleSkipAdvance();
        autoSave();
        return;
      }
      stopSkip(true);
      toast('遇到未读内容，快进已停止');
    }

    typewrite();
    autoSave();
  }

  function baseTypeDelay() {
    return Math.max(6, Math.round(72 - (settings.textSpeed - 1) * 7));
  }

  function typewrite() {
    clearTimeout(runtime.typeTimer);
    runtime.typeTimer = null;
    UI.line.textContent = '';
    runtime.pos = 0;
    runtime.curSpan = null;
    runtime.curSig = null;

    if (!runtime.units.length) { finishTyping(); return; }
    typeStep();
  }

  function typeStep() {
    if (runtime.mode !== 'typing') return;
    if (runtime.pos >= runtime.units.length) { finishTyping(); return; }

    var u = runtime.units[runtime.pos];
    runtime.pos += 1;

    if (u.pause) {
      runtime.typeTimer = setTimeout(typeStep, u.pause);
      return;
    }

    var sig = unitSig(u);
    if (!runtime.curSpan || sig !== runtime.curSig) {
      runtime.curSpan = makeUnitSpan(sig);
      runtime.curSig = sig;
      UI.line.appendChild(runtime.curSpan);
    }
    runtime.curSpan.textContent += u.ch;

    /* 打字机极轻"嗒"声：标点与空白不响 */
    if (!/[\s，。、！？…—；：「」『』""''（）《》]/.test(u.ch)) AudioManager.playSFX('sfx_type');

    var d = baseTypeDelay();
    if (u.slow) d = Math.round(d * 3.2);
    if (PUNCT_LONG[u.ch]) d += 300;
    else if (PUNCT_SHORT[u.ch]) d += 140;
    runtime.typeTimer = setTimeout(typeStep, d);
  }

  function finishTyping() {
    clearTimeout(runtime.typeTimer);
    runtime.typeTimer = null;
    renderUnitsAll();
    runtime.mode = 'waiting';
    UI.next.hidden = false;
    markRead(runtime.lineKey);
    scheduleAuto();
  }

  function scheduleAuto() {
    clearTimeout(runtime.autoTimer);
    if (!runtime.autoPlay || runtime.mode !== 'waiting') return;
    if (anyOverlayOpen()) return;
    runtime.autoTimer = setTimeout(function () {
      advance();
    }, settings.autoDelay);
  }

  function advance() {
    if (!state) return;
    if (anyOverlayOpen()) return;
    if (state.phone && state.phone.pending) {
      showPhonePrompt();
      return;
    }
    if (runtime.mode === 'typing') { finishTyping(); return; }
    if (runtime.mode !== 'waiting') return;

    clearTimeout(runtime.autoTimer);
    state.cursor.step += 1;
    processNext();
  }

  /* 手动推进防抖：300ms 内的重复点击/按键直接忽略，防止疯狂连点跳过台词或选项 */
  var lastManualAdvance = 0;
  function manualAdvance() {
    var now = Date.now();
    if (now - lastManualAdvance < 300) return;
    lastManualAdvance = now;
    if (runtime.mode === 'waiting' || runtime.mode === 'typing') AudioManager.playSFX('sfx_page');
    advance();
  }

  /* ------------------------------ 快进已读 ------------------------------ */

  function scheduleSkipAdvance() {
    clearTimeout(runtime.skipTimer);
    if (!runtime.skipping) return;
    runtime.skipTimer = setTimeout(function () {
      if (!runtime.skipping || runtime.mode !== 'waiting') return;
      advance();
    }, 70);
  }

  function stopSkip(silent) {
    if (!runtime.skipping) return;
    runtime.skipping = false;
    runtime.ctrlSkip = false;
    clearTimeout(runtime.skipTimer);
    runtime.skipTimer = null;
    updateSkipButton();
    if (!silent) toast('快进已停止');
  }

  function toggleSkip() {
    if (!state) return;
    if (runtime.mode !== 'waiting' && runtime.mode !== 'typing') {
      toast('当前不能快进');
      return;
    }

    if (runtime.skipping) {
      stopSkip(false);
      return;
    }

    if (runtime.mode === 'typing') finishTyping();

    if (!runtime.lineWasRead) {
      toast('未读内容不会快进');
      return;
    }

    runtime.skipping = true;
    runtime.autoPlay = false;
    updateAutoButton();
    updateSkipButton();
    scheduleSkipAdvance();
  }

  /* 按住 Ctrl：仅跳过已读文本，松开即停 */
  function startCtrlSkip() {
    if (!state || runtime.skipping) return;
    if (runtime.mode !== 'waiting' && runtime.mode !== 'typing') return;
    if (anyOverlayOpen()) return;
    if (runtime.mode === 'typing') finishTyping();
    if (!runtime.lineWasRead) return;
    runtime.skipping = true;
    runtime.ctrlSkip = true;
    runtime.autoPlay = false;
    updateAutoButton();
    updateSkipButton();
    scheduleSkipAdvance();
  }

  function stopCtrlSkip() {
    if (!runtime.ctrlSkip) return;
    runtime.ctrlSkip = false;
    if (runtime.skipping) stopSkip(false);
  }

  /* ------------------------------ 心境 HUD ------------------------------ */

  var bondFloatTimer = null;

  function bondMoodText() {
    var t = state.stats.trust, p = state.stats.pressure;
    if (p >= 8) return '她的心紧绷着，像要断了';
    if (t >= 9) return '她的防备放下了，伞倾向了你';
    if (t >= 6) return '她对你多了一点信任';
    if (t <= 3) return '她仍把自己关在伞下';
    return '雨还在下，你们隔着一把伞';
  }

  function renderBondHud() {
    if (!UI.bondHud || !state) return;
    var t = state.stats.trust, p = state.stats.pressure;
    var mood = t >= 9 ? 'high' : (t >= 5 ? 'mid' : 'low');
    UI.bondHud.dataset.mood = mood;
    UI.bondHud.dataset.strain = p >= 8 ? '1' : '0';
    if (UI.bondText) UI.bondText.textContent = bondMoodText();
    if (UI.pressureVeil) UI.pressureVeil.classList.toggle('on', p >= 8);
    if (UI.portraitLayer) {
      var pm = p >= 10 ? 'defensive' : (t >= 9 ? 'relaxed' : '');
      if (pm) UI.portraitLayer.dataset.mood = pm; else delete UI.portraitLayer.dataset.mood;
    }
  }

  function floatBond(label, positive) {
    if (!UI.bondFloat) return;
    clearTimeout(bondFloatTimer);
    UI.bondFloat.textContent = label;
    UI.bondFloat.className = 'bond-float ' + (positive ? 'show-up' : 'show-down');
    bondFloatTimer = setTimeout(function () { UI.bondFloat.className = 'bond-float'; }, 1600);
  }

  /* ------------------------------ 选项与倒计时 ------------------------------ */

  function applyEffects(effects) {
    if (!effects || !state) return;
    var trustDelta = 0, pressureDelta = 0;
    if (typeof effects.trust === 'number') {
      trustDelta = effects.trust;
      state.stats.trust = clamp(state.stats.trust + effects.trust, 0, 12);
    }
    if (typeof effects.pressure === 'number') {
      pressureDelta = effects.pressure;
      state.stats.pressure = clamp(state.stats.pressure + effects.pressure, 0, 12);
    } else if (typeof effects.stress === 'number') {
      pressureDelta = effects.stress;
      state.stats.pressure = clamp(state.stats.pressure + effects.stress, 0, 12);
    }
    /* 数值飘字：信任用暖色，压力用冷红 */
    if (trustDelta !== 0) floatBond((trustDelta > 0 ? '信任 +' : '信任 ') + trustDelta, trustDelta > 0);
    else if (pressureDelta !== 0) floatBond((pressureDelta > 0 ? '压力 +' : '压力 ') + pressureDelta, false);
    renderBondHud();
    /* 信任越高，雨声越弱——她稍微敞开心扉时，世界安静一点 */
    AudioManager.setRainMood(1 - state.stats.trust / 12);
  }

  function applyFlags(set) {
    if (!set || typeof set !== 'object' || !state) return;
    Object.keys(set).forEach(function (key) {
      state.flags[key] = set[key];
    });
  }

  function showChoices(step) {
    stopSkip(true);
    runtime.mode = 'choice';
    clearTimers();
    runtime.autoPlay = false;
    updateAutoButton();

    UI.dlg.hidden = true;
    UI.next.hidden = true;
    UI.choice.innerHTML = '';
    UI.choice.classList.remove('timed');

    var prompt = document.createElement('p');
    prompt.className = 'choice-title';
    prompt.textContent = step.prompt || '你要怎么做？';
    UI.choice.appendChild(prompt);

    var options = step.options || [];
    for (var i = 0; i < options.length; i++) {
      (function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.textContent = opt.text || '……';
        btn.addEventListener('click', function () { choose(opt, false); });
        UI.choice.appendChild(btn);
      })(options[i]);
    }

    UI.choice.hidden = false;
    autoSave();
    syncStageDim();
  }

  function showTimedChoice(step) {
    stopSkip(true);
    clearTimers();
    runtime.mode = 'timed';
    runtime.autoPlay = false;
    updateAutoButton();
    UI.game.classList.add('timing');

    UI.dlg.hidden = true;
    UI.next.hidden = true;
    UI.choice.innerHTML = '';
    UI.choice.classList.add('timed');

    var prompt = document.createElement('p');
    prompt.className = 'choice-title';
    prompt.textContent = step.prompt || '快一点。';
    UI.choice.appendChild(prompt);

    var timerRow = document.createElement('div');
    timerRow.className = 'timer-row';

    var timerNum = document.createElement('span');
    timerNum.className = 'timer-num';
    timerNum.textContent = '5.0s';

    var timerTrack = document.createElement('div');
    timerTrack.className = 'timer-track';

    var timerFill = document.createElement('div');
    timerFill.className = 'timer-fill';

    timerTrack.appendChild(timerFill);
    timerRow.appendChild(timerNum);
    timerRow.appendChild(timerTrack);
    UI.choice.appendChild(timerRow);

    var options = step.options || [];
    for (var i = 0; i < options.length; i++) {
      (function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.textContent = opt.text || '……';

        if (opt.default) {
          var badge = document.createElement('span');
          badge.className = 'choice-default';
          badge.textContent = '默认';
          btn.appendChild(badge);
        }

        btn.addEventListener('click', function () { choose(opt, false); });
        UI.choice.appendChild(btn);
      })(options[i]);
    }

    UI.choice.hidden = false;
    syncStageDim();

    var seconds = clamp(Number(step.seconds) || 5, 1, 30);
    runtime.timerTotal = seconds * 1000;
    runtime.timerDeadline = Date.now() + runtime.timerTotal;
    runtime.timerOptions = options;
    runtime.countdownFill = timerFill;
    runtime.countdownNum = timerNum;
    runtime.lastTickSecond = -1;

    /* 倒计时抉择：强制切换心跳环境音，BGM（bgm_tense）保持不变 */
    AudioManager.switchAmbient('ambient_heartbeat');

    updateCountdown();
    runtime.countdownTimer = setInterval(updateCountdown, 100);
    autoSave();
  }

  function updateCountdown() {
    if (runtime.mode !== 'timed') return;

    var left = runtime.timerDeadline - Date.now();
    if (left < 0) left = 0;

    var ratio = runtime.timerTotal ? left / runtime.timerTotal : 0;
    if (runtime.countdownFill) {
      runtime.countdownFill.style.width = (ratio * 100) + '%';
      runtime.countdownFill.classList.toggle('low', left <= 2000);
    }
    if (runtime.countdownNum) {
      runtime.countdownNum.textContent = (left / 1000).toFixed(1) + 's';
    }

    /* 滴答声：每秒一声；心跳由 ambient_heartbeat 环境音承担 */
    var wholeSecond = Math.ceil(left / 1000);
    if (wholeSecond !== runtime.lastTickSecond) {
      runtime.lastTickSecond = wholeSecond;
      if (left > 0) AudioManager.playSFX('sfx_tick');
    }

    if (left <= 0) {
      clearInterval(runtime.countdownTimer);
      runtime.countdownTimer = null;

      var options = runtime.timerOptions || [];
      var fallback = null;
      for (var i = 0; i < options.length; i++) {
        if (options[i] && options[i].default) { fallback = options[i]; break; }
      }
      if (!fallback) fallback = options[0];
      if (fallback) choose(fallback, true);
    }
  }

  function hideChoices() {
    UI.choice.hidden = true;
    UI.choice.innerHTML = '';
    UI.choice.classList.remove('timed', 'qte');
    UI.game.classList.remove('timing');
    UI.dlg.hidden = false;
    UI.next.hidden = true;
    runtime.countdownFill = null;
    runtime.countdownNum = null;
    if (runtime.isQTE) {
      runtime.isQTE = false;
      if (UI.emotionVeil) UI.emotionVeil.classList.remove('on');
    }
    syncStageDim();
  }

  function choose(opt, byTimeout) {
    if (!state) return;
    if (runtime.mode !== 'choice' && runtime.mode !== 'timed') return;
    if (!opt) return;

    clearInterval(runtime.countdownTimer);
    runtime.countdownTimer = null;

    applyEffects(opt.effects);
    applyFlags(opt.set);

    hideChoices();
    runtime.mode = 'idle';
    autoSave();

    if (byTimeout) toast('时间到，已按默认选项继续');

    if (opt.goto) {
      enterScene(opt.goto);
    } else {
      state.cursor.step += 1;
      processNext();
    }
  }

  /* ------------------------------ 观察模式 ------------------------------ */

  function showObservation(step) {
    stopSkip(true);
    clearTimers();
    runtime.autoPlay = false;
    updateAutoButton();
    runtime.mode = 'observe';
    runtime.observeNoteId = step.note || '';

    var hs = step.hotspot || {};
    var x = clamp(Number(hs.x) || 48, 0, 100);
    var y = clamp(Number(hs.y) || 44, 0, 100);
    var w = clamp(Number(hs.w) || 24, 10, 60);
    var h = clamp(Number(hs.h) || 20, 10, 60);
    x = clamp(x, 0, 100 - w);
    y = clamp(y, 0, 100 - h);

    UI.hotspot.style.left = x + '%';
    UI.hotspot.style.top = y + '%';
    UI.hotspot.style.width = w + '%';
    UI.hotspot.style.height = h + '%';

    var note = STORY.notes && STORY.notes[step.note];
    UI.observeHint.textContent = step.hint || (note && note.title) || '点击画面里微微发亮的地方';

    hideChoices();
    UI.dlg.hidden = true;
    UI.observeLayer.hidden = false;
    UI.game.classList.add('observing');
    autoSave();
  }

  function collectObservation() {
    if (!state || runtime.mode !== 'observe') return;

    var noteId = runtime.observeNoteId;
    if (noteId && state.notes.indexOf(noteId) === -1) {
      state.notes.push(noteId);
    }
    mergeNotesEver(state.notes);
    AudioManager.playSFX('sfx_note');

    state.cursor.step += 1;
    runtime.mode = 'note';

    UI.observeLayer.hidden = true;
    UI.game.classList.remove('observing');
    autoSave();

    var note = (STORY.notes && STORY.notes[noteId]) || {
      title: '笔记',
      text: '记下了一处细节。'
    };

    UI.noteKicker.textContent = 'NOTE · ' + state.notes.length;
    UI.noteTitle.textContent = note.title || '笔记';
    UI.noteText.textContent = note.text || '';
    openOverlay('overlay-note');
    updateDebug();
  }

  function closeNote() {
    var overlay = byId('overlay-note');
    closeOverlay(overlay);
    if (!state || runtime.mode !== 'note') return;
    runtime.mode = 'idle';
    UI.dlg.hidden = false;
    processNext();
  }

  /* ------------------------------ inspect 情绪观察 ------------------------------ */
  var currentInspectStep = null;

  function showInspect(step) {
    stopSkip(true);
    clearTimers();
    runtime.autoPlay = false;
    updateAutoButton();
    runtime.mode = 'inspect';
    currentInspectStep = step;

    UI.inspectLayer.hidden = true;
    if (UI.inspectRing) UI.inspectRing.hidden = true;
    UI.inspectFab.hidden = false;
    UI.choice.hidden = true;
    UI.observeLayer.hidden = true;

    UI.dlg.hidden = false;
    UI.dlg.classList.add('narration');
    UI.speaker.hidden = true;
    UI.next.hidden = true;

    /* 直接显示提示文字：不走打字机，避免 typeStep 的 mode 检查与 inspect 模式冲突 */
    var hint = step.text || '你注意到了一处值得细看的细节。';
    UI.line.textContent = hint;
    UI.line.classList.remove('read');
    syncStageDim();
    autoSave();
  }

  function startInspectObserve() {
    if ((runtime.mode !== 'inspect' && !currentInspectStep) || !currentInspectStep) return;
    runtime.mode = 'inspect';
    var sp = currentInspectStep.inspect || {};
    var x = clamp(Number(sp.hotspotX) || 50, 0, 100);
    var y = clamp(Number(sp.hotspotY) || 50, 0, 100);
    var r = 54;

    UI.inspectFab.hidden = true;
    UI.inspectLayer.hidden = false;
    UI.inspectRing.style.left = x + '%';
    UI.inspectRing.style.top = y + '%';
    UI.inspectRing.hidden = false;

    AudioManager.playSFX('sfx_note');
  }

  function collectInspect() {
    if (!currentInspectStep) return;
    runtime.mode = 'inspect';

    var sp = currentInspectStep.inspect || {};
    currentInspectStep = null; /* 观察完成，解除点击拦截 */
    var noteId = 'insp_' + (sp.id || ('inspect_' + Math.round(sp.hotspotX) + '_' + Math.round(sp.hotspotY)));
    if (state.notes.indexOf(noteId) === -1) state.notes.push(noteId);
    mergeNotesEver(state.notes);

    UI.inspectLayer.hidden = true;
    UI.inspectFab.hidden = true;
    AudioManager.playSFX('sfx_note');

    runtime.mode = 'note';
    state.cursor.step += 1;
    autoSave();

    var note = { title: '情绪观察', text: sp.result || sp.text || '你注意到了一处细节。' };
    UI.noteKicker.textContent = 'NOTE · ' + state.notes.length;
    UI.noteTitle.textContent = note.title;
    UI.noteText.textContent = note.text;
    openOverlay('overlay-note');
    updateDebug();
  }

  /* ------------------------------ QTE 心跳抉择 ------------------------------ */

  function showQTE(step) {
    stopSkip(true);
    clearTimers();
    runtime.mode = 'timed';        /* 复用 timed 模式的 choose/hideChoices 等处理 */
    runtime.isQTE = true;
    runtime.autoPlay = false;
    updateAutoButton();
    UI.game.classList.add('timing');
    if (UI.emotionVeil) UI.emotionVeil.classList.add('on');

    UI.dlg.hidden = true;
    UI.next.hidden = true;
    UI.choice.innerHTML = '';
    UI.choice.classList.add('timed', 'qte');

    var prompt = document.createElement('p');
    prompt.className = 'choice-title';
    prompt.textContent = step.prompt || '来不及了。';
    UI.choice.appendChild(prompt);

    var timerRow = document.createElement('div');
    timerRow.className = 'timer-row';
    var timerNum = document.createElement('span');
    timerNum.className = 'timer-num';
    timerNum.textContent = '5.0s';
    var timerTrack = document.createElement('div');
    timerTrack.className = 'timer-track';
    var timerFill = document.createElement('div');
    timerFill.className = 'timer-fill';
    timerTrack.appendChild(timerFill);
    timerRow.appendChild(timerNum);
    timerRow.appendChild(timerTrack);
    UI.choice.appendChild(timerRow);

    var options = step.qte && step.qte.options ? step.qte.options : (step.options || []);
    var seconds = clamp(Number(step.qte && step.qte.time) || Number(step.seconds) || 5, 1, 30);
    /* QTE 默认选项 = 超时最坏选项（没有 default 时自动取最后一个作兜底） */
    var hasDefault = options.some(function (o) { return o && o.default; });
    if (!hasDefault && options.length > 0) options[options.length - 1].default = true;

    for (var i = 0; i < options.length; i++) {
      (function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.textContent = opt.text || '……';
        if (opt.default) {
          var badge = document.createElement('span');
          badge.className = 'choice-default';
          badge.textContent = '超时';
          btn.appendChild(badge);
        }
        btn.addEventListener('click', function () { choose(opt, false); });
        UI.choice.appendChild(btn);
      })(options[i]);
    }

    UI.choice.hidden = false;
    syncStageDim();

    runtime.timerTotal = seconds * 1000;
    runtime.timerDeadline = Date.now() + runtime.timerTotal;
    runtime.timerOptions = options;
    runtime.countdownFill = timerFill;
    runtime.countdownNum = timerNum;
    runtime.lastTickSecond = -1;

    AudioManager.switchAmbient('ambient_heartbeat');
    updateCountdown();
    runtime.countdownTimer = setInterval(updateCountdown, 100);
    autoSave();
  }

  /* ------------------------------ 手机短信 ------------------------------ */

  function activeThreadId() {
    if (!state || !state.phone) return null;
    if (state.phone.pending) return state.phone.pending.thread;

    var threads = state.phone.threads || {};
    var keys = Object.keys(threads);
    for (var i = 0; i < keys.length; i++) {
      var thread = threads[keys[i]];
      if (thread && thread.messages && thread.messages.length) return keys[i];
    }
    return null;
  }

  function updatePhoneUI() {
    if (!state) {
      UI.phoneFab.hidden = true;
      UI.phoneBadge.hidden = true;
      return;
    }

    var threadId = activeThreadId();
    var visible = !!threadId && runtime.mode !== 'ended';
    UI.phoneFab.hidden = !visible;
    UI.phoneFab.classList.toggle('pending', !!state.phone.pending);

    var unread = state.phone.unread || 0;
    if (unread > 0) {
      UI.phoneBadge.hidden = false;
      UI.phoneBadge.textContent = unread > 9 ? '9+' : String(unread);
    } else {
      UI.phoneBadge.hidden = true;
    }
  }

  function showPhonePrompt() {
    if (!state) return;
    clearTimers();
    stopSkip(true);
    runtime.mode = 'phone';
    runtime.autoPlay = false;
    updateAutoButton();

    UI.choice.hidden = true;
    UI.choice.innerHTML = '';
    UI.choice.classList.remove('timed');
    UI.game.classList.remove('timing');

    UI.dlg.hidden = false;
    UI.dlg.classList.add('narration');
    UI.speaker.textContent = '';
    UI.speaker.hidden = true;
    UI.line.textContent = (state.phone.pending && state.phone.pending.replies &&
      state.phone.pending.replies.length)
      ? '（手机震了一下。点开短信，回她一句。）'
      : '（手机震了一下。点开短信看看。）';
    UI.next.hidden = true;
    updatePhoneUI();
  }

  function deliverPhone(step) {
    stopSkip(true);
    clearTimers();
    runtime.autoPlay = false;
    updateAutoButton();

    var threadId = String(step.thread || 'lin');
    var thread = state.phone.threads[threadId] || { messages: [] };
    if (!Array.isArray(thread.messages)) thread.messages = [];

    var messages = step.messages || [];
    var incoming = 0;
    for (var i = 0; i < messages.length; i++) {
      var from = messageFrom(messages[i].from);
      thread.messages.push({
        from: from,
        text: String(messages[i].text || ''),
        time: formatClock(Date.now())
      });
      if (from === 'lin') incoming += 1;
    }

    state.phone.threads[threadId] = thread;

    var replies = [];
    var sourceReplies = step.replies || [];
    for (var r = 0; r < sourceReplies.length; r++) {
      replies.push({
        text: String(sourceReplies[r].text || ''),
        effects: sourceReplies[r].effects || null,
        set: sourceReplies[r].set || null
      });
    }

    state.phone.pending = { thread: threadId, replies: replies };
    state.phone.unread = (state.phone.unread || 0) + incoming;
    state.cursor.step += 1;

    autoSave();
    showPhonePrompt();
    updatePhoneUI();
    AudioManager.playSFX('sfx_sms');
    AudioManager.playSFX('sfx_vibrate');

    var character = STORY.characters[threadId];
    toast((character ? character.name : '对方') + '发来了消息');
  }

  function openPhone() {
    if (!state) return;
    var threadId = activeThreadId();
    if (!threadId) {
      toast('暂时没有短信');
      return;
    }

    if (UI.phoneClock) UI.phoneClock.textContent = formatClock(Date.now());
    renderPhone(threadId);
    openOverlay('overlay-phone');

    if (state.phone.pending && state.phone.unread > 0) {
      state.phone.unread = 0;
      autoSave();
      updatePhoneUI();
    }
  }

  function renderPhone(threadId) {
    var character = STORY.characters[threadId];
    UI.phoneName.textContent = character ? character.name : '短信';

    var thread = state.phone.threads[threadId] || { messages: [] };
    UI.chatList.innerHTML = '';
    UI.phoneReplies.innerHTML = '';

    var messages = thread.messages || [];
    for (var i = 0; i < messages.length; i++) {
      var bubble = document.createElement('div');

      if (messages[i].from === 'system') {
        bubble.className = 'msg system';
        bubble.textContent = messages[i].text;
        UI.chatList.appendChild(bubble);
        continue;
      }

      bubble.className = 'msg ' + (messages[i].from === 'me' ? 'me' : 'lin');
      appendHighlighted(bubble, messages[i].text);

      if (messages[i].time) {
        var time = document.createElement('span');
        time.className = 'msg-time';
        time.textContent = messages[i].time;
        bubble.appendChild(time);
      }

      UI.chatList.appendChild(bubble);
    }

    var pending = state.phone.pending && state.phone.pending.thread === threadId
      ? state.phone.pending
      : null;

    if (pending && pending.replies && pending.replies.length) {
      UI.phoneHint.textContent = '选择一条回复：';

      for (var r = 0; r < pending.replies.length; r++) {
        (function (reply) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'phone-reply-btn';
          btn.textContent = reply.text || '……';
          btn.addEventListener('click', function () { choosePhoneReply(reply); });
          UI.phoneReplies.appendChild(btn);
        })(pending.replies[r]);
      }
    } else {
      UI.phoneHint.textContent = messages.length ? '没有待回复的消息。' : '还没有消息。';
    }

    setTimeout(function () {
      UI.chatList.scrollTop = UI.chatList.scrollHeight;
    }, 0);
  }

  function choosePhoneReply(reply) {
    if (!state || !state.phone.pending || !reply) return;

    var pending = state.phone.pending;
    var thread = state.phone.threads[pending.thread] || { messages: [] };
    if (!Array.isArray(thread.messages)) thread.messages = [];

    applyEffects(reply.effects);
    applyFlags(reply.set);

    thread.messages.push({
      from: 'me',
      text: String(reply.text || ''),
      time: formatClock(Date.now())
    });

    state.phone.threads[pending.thread] = thread;
    state.phone.pending = null;
    state.phone.unread = 0;

    autoSave();
    closeOverlay(byId('overlay-phone'));
    updatePhoneUI();
    toast('已回复');

    runtime.mode = 'idle';
    setTimeout(function () {
      if (state && runtime.mode === 'idle' && !state.phone.pending) processNext();
    }, 350);
  }

  /* ------------------------------ 历史记录 ------------------------------ */

  function openHistory() {
    if (!state) return;
    renderHistory();
    openOverlay('overlay-history');
  }

  function renderHistory() {
    UI.historyList.innerHTML = '';

    if (!state || !state.history.length) {
      var empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = '还没有可回看的台词。';
      UI.historyList.appendChild(empty);
      return;
    }

    for (var i = 0; i < state.history.length; i++) {
      (function (item) {
        var row = document.createElement('div');
        row.className = 'history-item' + (item.who === '旁白' ? ' narr' : '');

        var who = document.createElement('div');
        who.className = 'history-who';
        who.textContent = item.who || '旁白';

        var text = document.createElement('p');
        text.className = 'history-text';
        text.textContent = item.text;

        row.appendChild(who);
        row.appendChild(text);
        UI.historyList.appendChild(row);
      })(state.history[i]);
    }

    setTimeout(function () {
      UI.historyList.scrollTop = UI.historyList.scrollHeight;
    }, 0);
  }

  /* ------------------------------ 结束 / 开始 / 读档 ------------------------------ */

  var currentEndingId = null;
  function showEnd(text, meta) {
    clearTimers();
    cancelChapterCard();
    stopSkip(true);
    hidePortrait();
    runtime.mode = 'ended';
    runtime.autoPlay = false;
    updateAutoButton();
    updateSkipButton();
    UI.observeLayer.hidden = true;
    UI.game.classList.remove('observing', 'timing', 'joy');
    UI.choice.hidden = true;
    UI.phoneFab.hidden = true;
    /* 回忆片段不清自动存档，避免玩家回标题后丢失进度 */
    if (!runtime.extra) safeRemove(SAVE_AUTO);

    currentEndingId = meta && meta.endingId ? meta.endingId : null;
    if (UI.endKicker) UI.endKicker.textContent = (meta && meta.kicker) || 'DEMO END';
    if (UI.endTitle) UI.endTitle.textContent = (meta && meta.title) || '试玩结束';
    if (UI.endText) UI.endText.textContent = text || '试玩结束。';
    if (UI.endEpilogue) {
      if (meta && meta.epilogue) {
        UI.endEpilogue.textContent = meta.epilogue;
        UI.endEpilogue.hidden = false;
      } else {
        UI.endEpilogue.textContent = '';
        UI.endEpilogue.hidden = true;
      }
    }
    if (UI.endGallery) {
      if (meta && meta.gallery) {
        UI.endGallery.textContent = meta.gallery;
        UI.endGallery.hidden = false;
      } else {
        UI.endGallery.textContent = '';
        UI.endGallery.hidden = true;
      }
    }
    openOverlay('overlay-end');
  }

  /* 结局判定：坏结局优先，其次真结局，其余为疏远结局 */
  function resolveEnding() {
    if (!state) return;
    var trust = state.stats.trust;
    var pressure = state.stats.pressure;
    var notes = state.notes.length;
    var flags = state.flags || {};

    if (pressure >= 10 || flags.f_ch3_wrong) {
      preludeBadEnd(showEnding.bind(null, 'end_bad'));
      return;
    }
    if (trust >= 10 && pressure <= 6 && notes >= 3 &&
        flags.f_ch3_hospital && flags.f_end_stay) {
      preludeTrueEnd();
      showEnding('end_true');
      return;
    }
    showEnding('end_distant');
  }

  /* ============ 结局演出 ============ */
  function preludeTrueEnd() {
    if (UI.stage) { UI.stage.classList.add('joy'); }
    if (UI.joyBeam) {
      UI.joyBeam.classList.add('on');
    }
    SceneRain.stop();
    AudioManager.switchAmbient('stop');
    AudioManager.switchBGM('bgm_hope');
    setTimeout(function () { AudioManager.swellBGM(); }, 800);
  }
  function preludeBadEnd(done) {
    if (UI.stage) { UI.stage.classList.add('end-bad'); }
    if (document.body) document.body.classList.add('end-bad');
    SceneRain.stop();
    /* 先渐静所有声音，留白 3s 再出结局文字 */
    AudioManager.fadeMaster(true);
    setTimeout(done, 3200);
  }

  function cleanupEndingFX() {
    if (UI.stage) { UI.stage.classList.remove('joy', 'end-bad'); }
    if (document.body) document.body.classList.remove('end-bad');
    if (UI.joyBeam) UI.joyBeam.classList.remove('on');
    AudioManager.fadeMaster(false);
  }

  function showEnding(endingId) {
    var list = STORY.endings || [];
    var ending = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === endingId) { ending = list[i]; break; }
    }
    if (!ending) {
      ending = { id: endingId, name: endingId, title: endingId, kicker: 'END', hint: '', text: '' };
    }

    var seen = globalData.seenEndings || (globalData.seenEndings = []);
    var isNew = seen.indexOf(ending.id) === -1;
    if (isNew) {
      seen.push(ending.id);
    }

    /* 本局收集的观察点并入历史最好成绩（图鉴百分比用） */
    mergeNotesEver(state ? state.notes : []);
    saveGlobal();
    refreshTitleExtra();

    var total = list.length || 1;
    renderGallery();

    showEnd(ending.text || '', {
      kicker: ending.kicker || 'END',
      title: ending.title || ending.name || '结局',
      gallery: '已收录至结局图鉴 · ' + seen.length + ' / ' + total + (isNew ? ' · NEW' : ''),
      epilogue: ending.epilogue || '',
      endingId: endingId
    });
  }

  function startGame() {
    clearTimers();
    cancelChapterCard();
    stopSkip(true);
    preloadImages();
    state = newState();
    runtime.mode = 'idle';
    runtime.autoPlay = false;
    runtime.skipping = false;
    runtime.loading = false;
    runtime.extra = false;
    runtime.lastChapter = '';
    runtime.lastLine = '';
    runtime.playStart = Date.now();

    UI.debugPanel.hidden = true;
    clearInterval(debugTimer);
    debugTimer = null;

    updateAutoButton();
    updateSkipButton();
    closeAllOverlays();
    UI.observeLayer.hidden = true;
    UI.inspectLayer.hidden = true;
    UI.inspectFab.hidden = true;
    if (UI.inspectRing) UI.inspectRing.hidden = true;
    currentInspectStep = null;
    runtime.isQTE = false;
    runtime.mode = 'idle';
    UI.game.classList.remove('observing', 'timing');
    if (UI.emotionVeil) UI.emotionVeil.classList.remove('on');
    showScreen('game');
    AudioManager.unlock();
    AudioManager.setRainMood(1 - state.stats.trust / 12);
    renderBondHud();
    updatePhoneUI();
    enterScene(STORY.startScene);
    updateDebug();
  }

  /* 二周目彩蛋：回忆片段（不写自动存档，不影响主线进度） */
  function startMemory() {
    var memoryScene = 'extra_s01_memory';
    if (!STORY.scenes || !STORY.scenes[memoryScene]) {
      toast('回忆尚未解锁');
      return;
    }

    clearTimers();
    cancelChapterCard();
    stopSkip(true);
    preloadImages();
    state = newState();
    runtime.mode = 'idle';
    runtime.autoPlay = false;
    runtime.skipping = false;
    runtime.loading = false;
    runtime.extra = true;
    runtime.lastChapter = '';

    UI.debugPanel.hidden = true;
    clearInterval(debugTimer);
    debugTimer = null;

    updateAutoButton();
    updateSkipButton();
    closeAllOverlays();
    UI.observeLayer.hidden = true;
    UI.inspectLayer.hidden = true;
    UI.inspectFab.hidden = true;
    if (UI.inspectRing) UI.inspectRing.hidden = true;
    currentInspectStep = null;
    runtime.isQTE = false;
    runtime.mode = 'idle';
    UI.game.classList.remove('observing', 'timing');
    if (UI.emotionVeil) UI.emotionVeil.classList.remove('on');
    showScreen('game');
    AudioManager.unlock();
    AudioManager.setRainMood(0.4);
    updatePhoneUI();
    enterScene(memoryScene);
    updateDebug();
  }

  function applyLoadedState(data) {
    var st = normalizeState(data && data.state);
    if (!st || !st.cursor || !STORY.scenes[st.cursor.scene]) {
      toast('存档数据无效');
      return;
    }

    clearTimers();
    cancelChapterCard();
    runtime.loading = true;
    runtime.skipping = false;
    runtime.extra = false;

    state = st;

    closeAllOverlays();
    UI.observeLayer.hidden = true;
    UI.game.classList.remove('observing', 'timing');
    UI.debugPanel.hidden = true;
    clearInterval(debugTimer);
    debugTimer = null;

    showScreen('game');

    var scene = STORY.scenes[state.cursor.scene];
    runtime.lastChapter = chapterOf(scene);
    setSceneTag(scene);
    applyBackground(state.bg || scene.bg);
    /* 读档不播黑场，直接应用存档场景的音频配置 */
    if (scene.bgm !== undefined) AudioManager.switchBGM(scene.bgm);
    if (scene.ambient !== undefined) AudioManager.switchAmbient(scene.ambient);
    hidePortrait();
    hideChoices();

    runtime.mode = 'idle';
    runtime.autoPlay = false;
    updateAutoButton();
    updateSkipButton();
    runtime.loading = false;

    preloadImages();
    AudioManager.unlock();
    AudioManager.setRainMood(1 - state.stats.trust / 12);
    renderBondHud();
    updatePhoneUI();
    processNext();
    updateDebug();
    toast('已读取：' + (data.sceneTitle || '存档'));
  }

  function continueGame() {
    var auto = readSave(SAVE_AUTO);
    if (auto) {
      applyLoadedState(auto);
      return;
    }

    for (var i = 0; i < SAVE_SLOTS.length; i++) {
      if (readSave(SAVE_SLOTS[i])) {
        openSaves('load');
        return;
      }
    }
    toast('暂无存档，请先开始游戏');
  }

  function returnToTitle() {
    clearTimers();
    cancelChapterCard();
    stopSkip(true);
    cleanupEndingFX();
    state = null;
    runtime.mode = 'idle';
    runtime.autoPlay = false;
    runtime.skipping = false;
    runtime.extra = false;

    updateAutoButton();
    updateSkipButton();
    updatePhoneUI();
    closeAllOverlays();
    UI.observeLayer.hidden = true;
    UI.game.classList.remove('observing', 'timing');
    UI.debugPanel.hidden = true;
    clearInterval(debugTimer);
    debugTimer = null;
    hidePortrait();

    refreshTitleExtra();
    showScreen('title');
    AudioManager.stopAll();
  }

  /* ------------------------------ 确认框 ------------------------------ */

  var confirmAction = null;

  function openConfirm(text, onOk) {
    if (UI.confirmText) UI.confirmText.textContent = text;
    confirmAction = typeof onOk === 'function' ? onOk : null;
    openOverlay('overlay-confirm');
  }

  /* ------------------------------ 存档面板 ------------------------------ */

  var savesMode = 'save';

  function openSaves(mode) {
    savesMode = mode === 'load' ? 'load' : 'save';
    renderSlots();
    openOverlay('overlay-saves');
  }

  function renderSlots() {
    UI.slotList.innerHTML = '';
    if (UI.savesTitle) UI.savesTitle.textContent = savesMode === 'load' ? '读档 · 回忆碎片' : '存档 / 读档';

    var rows = [{ key: SAVE_AUTO, name: '自动存档', auto: true }];
    for (var i = 0; i < SAVE_SLOTS.length; i++) {
      rows.push({ key: SAVE_SLOTS[i], name: '存档 ' + (i + 1), auto: false });
    }

    for (var r = 0; r < rows.length; r++) {
      (function (row) {
        var data = readSave(row.key);

        var wrap = document.createElement('div');
        wrap.className = 'slot-row' + (data ? '' : ' empty');

        var info = document.createElement('div');
        info.className = 'slot-info';

        var head = document.createElement('div');
        head.className = 'slot-head';

        var name = document.createElement('span');
        name.className = 'slot-name';
        name.textContent = row.name;

        var chapter = document.createElement('span');
        chapter.className = 'slot-chapter';
        chapter.textContent = data
          ? (data.sceneTitle || '未命名进度')
          : '空存档';

        head.appendChild(name);
        head.appendChild(chapter);
        info.appendChild(head);

        var quote = document.createElement('div');
        quote.className = 'slot-quote';
        quote.textContent = data && data.lastLine ? data.lastLine : '';
        info.appendChild(quote);

        var meta = document.createElement('span');
        meta.className = 'slot-meta';
        if (data) {
          var t = data.playDuration ? ' · 游玩 ' + formatPlayDuration(data.playDuration) : '';
          meta.textContent = formatTime(data.savedAt) + t;
        } else {
          meta.textContent = '';
        }
        info.appendChild(meta);

        var actions = document.createElement('div');
        actions.className = 'slot-actions';

        if (!row.auto && state && savesMode !== 'load') {
          var saveBtn = document.createElement('button');
          saveBtn.type = 'button';
          saveBtn.className = 'mini-btn';
          saveBtn.textContent = '存档';
          saveBtn.addEventListener('click', function () { saveToSlot(row.key, row.name); });
          actions.appendChild(saveBtn);
        }

        var loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'mini-btn';
        loadBtn.textContent = '读档';
        loadBtn.disabled = !data;
        loadBtn.addEventListener('click', function () { loadFromKey(row.key); });
        actions.appendChild(loadBtn);

        wrap.appendChild(info);
        wrap.appendChild(actions);
        UI.slotList.appendChild(wrap);
      })(rows[r]);
    }
  }

  function formatPlayDuration(sec) {
    if (!sec || sec < 60) return sec + ' 秒';
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + ' 时 ' + m + ' 分';
    return m + ' 分';
  }

  function saveToSlot(key, label) {
    if (!state) return;
    var ok = safeSet(key, JSON.stringify(makeSave()));
    if (ok) {
      toast('已保存到' + label);
      renderSlots();
    } else {
      toast('保存失败：浏览器存储不可用');
    }
  }

  function loadFromKey(key) {
    var data = readSave(key);
    if (!data) {
      toast('该存档为空');
      return;
    }
    applyLoadedState(data);
  }

  /* ------------------------------ 设置 ------------------------------ */

  function updateSettingOutputs() {
    UI.outSpeed.textContent = String(settings.textSpeed);
    UI.outAuto.textContent = (settings.autoDelay / 1000).toFixed(1) + ' 秒';
    UI.outVolume.textContent = String(settings.volume);
    if (UI.outBgmVolume) UI.outBgmVolume.textContent = String(settings.bgmVolume);
    if (UI.outAmbientVolume) UI.outAmbientVolume.textContent = String(settings.ambientVolume);
  }

  function openSettings() {
    UI.setSpeed.value = String(settings.textSpeed);
    UI.setAuto.value = String(settings.autoDelay);
    UI.setVolume.value = String(settings.volume);
    if (UI.setBgmVolume) UI.setBgmVolume.value = String(settings.bgmVolume);
    if (UI.setAmbientVolume) UI.setAmbientVolume.value = String(settings.ambientVolume);
    updateSettingOutputs();
    openOverlay('overlay-settings');
  }

  UI.setSpeed.addEventListener('input', function () {
    var v = parseInt(UI.setSpeed.value, 10);
    settings.textSpeed = isNaN(v) ? 5 : clamp(v, 1, 10);
    updateSettingOutputs();
    saveGlobal();
  });

  UI.setAuto.addEventListener('input', function () {
    var v = parseInt(UI.setAuto.value, 10);
    settings.autoDelay = isNaN(v) ? 1400 : clamp(v, 600, 3000);
    updateSettingOutputs();
    saveGlobal();
  });

  UI.setVolume.addEventListener('input', function () {
    var v = parseInt(UI.setVolume.value, 10);
    settings.volume = isNaN(v) ? 0 : clamp(v, 0, 100);
    updateSettingOutputs();
    saveGlobal();
    AudioManager.setVolumes();
  });

  /* BGM 音量滑块 */
  if (UI.setBgmVolume) UI.setBgmVolume.addEventListener('input', function () {
    var v = parseInt(UI.setBgmVolume.value, 10);
    settings.bgmVolume = isNaN(v) ? 60 : clamp(v, 0, 100);
    updateSettingOutputs();
    saveGlobal();
    AudioManager.setVolumes();
  });

  /* 环境音音量滑块 */
  if (UI.setAmbientVolume) UI.setAmbientVolume.addEventListener('input', function () {
    var v = parseInt(UI.setAmbientVolume.value, 10);
    settings.ambientVolume = isNaN(v) ? 0 : clamp(v, 0, 100);
    updateSettingOutputs();
    saveGlobal();
    AudioManager.setVolumes();
  });

  /* ------------------------------ 结局图鉴 ------------------------------ */

  /* 二周目彩蛋：通关过任一结局后，标题页放晴并解锁回忆片段 */
  function refreshTitleExtra() {
    var cleared = (globalData.seenEndings || []).length > 0;
    UI.title.classList.toggle('cleared', cleared);
    if (UI.btnMemory) UI.btnMemory.hidden = !cleared;
    if (UI.titleSub) UI.titleSub.textContent = cleared ? '雨停了，天亮了' : '雨停之前，先别走';
    /* 封面立绘：通关后换成释怀的表情 */
    if (UI.titlePortraitImg) {
      UI.titlePortraitImg.src = cleared ? 'assets/char/lin_hope.png' : 'assets/char/lin.png';
    }
    if (cleared) TitleRain.stop(); else TitleRain.start();
  }

  /* 观察点历史最好成绩：跨周目累计去重 */
  function mergeNotesEver(ids) {
    var ever = globalData.notesEver || (globalData.notesEver = []);
    var changed = false;
    for (var i = 0; i < ids.length; i++) {
      if (ever.indexOf(ids[i]) === -1) {
        ever.push(ids[i]);
        changed = true;
      }
    }
    if (changed) scheduleGlobalSave();
  }

  function notesEverPercent() {
    var total = Object.keys(STORY.notes || {}).length;
    if (!total) return 100;
    var ever = (globalData.notesEver || []).filter(function (id) { return STORY.notes[id]; });
    return Math.round(ever.length / total * 100);
  }

  function openGallery() {
    renderGallery();
    openOverlay('overlay-gallery');
  }

  function renderGallery() {
    UI.galleryGrid.innerHTML = '';
    var endings = STORY.endings || [];
    var seen = globalData.seenEndings || [];

    for (var i = 0; i < endings.length; i++) {
      (function (ending) {
        var unlocked = seen.indexOf(ending.id) !== -1;

        var card = document.createElement('div');
        card.className = 'gallery-card' + (unlocked ? '' : ' locked');

        var name = document.createElement('div');
        name.className = 'g-name';
        name.textContent = unlocked ? (ending.name || '未命名结局') : '？？？';

        var desc = document.createElement('p');
        desc.className = 'g-hint';
        desc.textContent = unlocked ? (ending.hint || '') : '尚未解锁';

        /* 结语：解锁时显示 */
        var epi = document.createElement('p');
        epi.className = 'g-epilogue';
        epi.textContent = unlocked ? (ending.epilogue || '') : '';

        /* 达成条件提示：未解锁时也显示，给下一周目指路 */
        var cond = document.createElement('p');
        cond.className = 'g-cond';
        cond.textContent = '达成条件 · ' + (ending.cond || '随剧情自然到达');

        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(epi);
        card.appendChild(cond);
        UI.galleryGrid.appendChild(card);
      })(endings[i]);
    }

    UI.galleryCount.textContent = '已解锁 ' + seen.length + ' / ' + endings.length +
      ' · 观察点收集 ' + notesEverPercent() + '%';
  }

  /* ------------------------------ 标题页 · Canvas 雨幕引擎 ------------------------------ */

  var TitleRain = (function () {
    var canvas, ctx, W = 0, H = 0, dpr = 1;
    var drops = [], splashes = [], ripples = [];
    var rafId = null, running = false;
    var WIND = -1;                          /* 风：向左吹 */
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    /* 三层景深：0 远（细/淡/慢） 1 中 2 近（粗/亮/快） */
    function makeDrop() {
      var depth = Math.random();
      var z = depth < 0.45 ? 0 : (depth < 0.82 ? 1 : 2);
      var cfg = [
        { w: 0.6, a: [0.05, 0.12], sp: [3.5, 5.5], len: [8, 14] },
        { w: 1.0, a: [0.12, 0.22], sp: [6, 9],    len: [13, 20] },
        { w: 1.6, a: [0.22, 0.36], sp: [10, 14],  len: [18, 28] }
      ][z];
      return {
        x: Math.random() * (W + 120) - 60,
        y: Math.random() * -H,
        z: z,
        w: cfg.w,
        a: cfg.a[0] + Math.random() * (cfg.a[1] - cfg.a[0]),
        sp: cfg.sp[0] + Math.random() * (cfg.sp[1] - cfg.sp[0]),
        len: cfg.len[0] + Math.random() * (cfg.len[1] - cfg.len[0])
      };
    }

    function seed() {
      var target = Math.round(Math.min(200, Math.max(100, W * H / 14000)));
      drops = [];
      for (var i = 0; i < target; i++) { var d = makeDrop(); d.y = Math.random() * H; drops.push(d); }
      splashes = []; ripples = [];
    }

    function step() {
      var i, d;
      for (i = 0; i < drops.length; i++) {
        d = drops[i];
        d.y += d.sp;
        d.x += WIND * (0.4 + d.z * 0.35);
        if (d.y > H + d.len) {
          /* 落地：近景雨滴才溅起水花/涟漪，控制粒子总量 */
          if (d.z === 2 && Math.random() < 0.5) {
            splashes.push({ x: d.x, y: H - 2, vx: (Math.random() - 0.5) * 2.2, vy: -(1.5 + Math.random() * 2), life: 1 });
            if (Math.random() < 0.4) ripples.push({ x: d.x, y: H - 3, r: 1, max: 6 + Math.random() * 10, life: 1 });
          }
          drops[i] = makeDrop();
        } else if (d.x < -80) {
          d.x = W + 60;
        }
      }
      for (i = splashes.length - 1; i >= 0; i--) {
        var s = splashes[i];
        s.x += s.vx; s.y += s.vy; s.vy += 0.12; s.life -= 0.05;
        if (s.life <= 0 || s.y > H) splashes.splice(i, 1);
      }
      for (i = ripples.length - 1; i >= 0; i--) {
        var r = ripples[i];
        r.r += 0.6; r.life -= 0.06;
        if (r.life <= 0 || r.r > r.max) ripples.splice(i, 1);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, d;
      /* 雨滴（按景深排序，先画远处） */
      for (i = 0; i < drops.length; i++) {
        d = drops[i];
        var tx = d.x + WIND * (1 + d.z * 0.4), ty = d.y + d.len;
        var grad = ctx.createLinearGradient(d.x, d.y, tx, ty);
        grad.addColorStop(0, 'rgba(185, 210, 235, 0)');
        grad.addColorStop(1, 'rgba(185, 210, 235, ' + d.a + ')');
        ctx.strokeStyle = grad;
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
      /* 溅起的水滴 */
      ctx.fillStyle = 'rgba(200, 222, 245, 0.5)';
      for (i = 0; i < splashes.length; i++) {
        var s = splashes[i];
        ctx.globalAlpha = Math.max(0, s.life * 0.5);
        ctx.fillRect(s.x, s.y, 1.4, 1.4);
      }
      /* 涟漪 */
      for (i = 0; i < ripples.length; i++) {
        var r = ripples[i];
        ctx.globalAlpha = Math.max(0, r.life * 0.28);
        ctx.strokeStyle = 'rgba(190, 215, 240, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!running) return;
      step(); draw();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running || !canvas) return;
      running = true;
      if (reduced) { draw(); return; }   /* 减少动态：画一帧静态雨 */
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (ctx) ctx.clearRect(0, 0, W, H);
    }

    function init(el) {
      canvas = el;
      if (!canvas || !canvas.getContext) return;
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = null; }
        else if (running && !reduced) rafId = requestAnimationFrame(loop);
      });
    }

    return { init: init, start: start, stop: stop };
  })();

  /* ------------------------------ 游戏内场景雨幕引擎 ------------------------------ */

  var SceneRain = (function () {
    var canvas, ctx, W = 0, H = 0, dpr = 1;
    var drops = [];
    var rafId = null, running = false, indoor = false;
    var WIND = -1;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function makeDrop() {
      var depth = Math.random();
      var z = depth < 0.5 ? 0 : (depth < 0.85 ? 1 : 2);
      var cfg = [
        { w: 0.5, a: [0.04, 0.09], sp: [4, 6], len: [7, 12] },
        { w: 0.9, a: [0.09, 0.16], sp: [7, 10], len: [12, 18] },
        { w: 1.4, a: [0.16, 0.26], sp: [11, 15], len: [16, 24] }
      ][z];
      return {
        x: Math.random() * (W + 100) - 50, y: Math.random() * -H, z: z,
        w: cfg.w, a: cfg.a[0] + Math.random() * (cfg.a[1] - cfg.a[0]),
        sp: cfg.sp[0] + Math.random() * (cfg.sp[1] - cfg.sp[0]),
        len: cfg.len[0] + Math.random() * (cfg.len[1] - cfg.len[0])
      };
    }

    function seed() {
      var base = indoor ? 60 : 130;
      var target = Math.round(Math.min(indoor ? 90 : 170, Math.max(indoor ? 50 : 110, W * H / (indoor ? 22000 : 12000))));
      drops = [];
      for (var i = 0; i < target; i++) { var d = makeDrop(); d.y = Math.random() * H; drops.push(d); }
    }

    function step() {
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        d.y += d.sp; d.x += WIND * (0.35 + d.z * 0.3);
        if (d.y > H + d.len) drops[i] = makeDrop();
        else if (d.x < -70) d.x = W + 50;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        var tx = d.x + WIND * (1 + d.z * 0.35), ty = d.y + d.len;
        var grad = ctx.createLinearGradient(d.x, d.y, tx, ty);
        grad.addColorStop(0, 'rgba(185, 210, 235, 0)');
        grad.addColorStop(1, 'rgba(185, 210, 235, ' + d.a + ')');
        ctx.strokeStyle = grad; ctx.lineWidth = d.w;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(tx, ty); ctx.stroke();
      }
    }

    function loop() { if (!running) return; step(); draw(); rafId = requestAnimationFrame(loop); }

    function start() {
      if (running || !canvas) return;
      running = true;
      canvas.classList.add('on');
      canvas.classList.toggle('indoor', indoor);
      if (reduced) { draw(); return; }
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId); rafId = null;
      if (canvas) canvas.classList.remove('on');
      if (ctx) ctx.clearRect(0, 0, W, H);
    }
    function setIndoor(v) {
      indoor = !!v;
      if (canvas) canvas.classList.toggle('indoor', indoor);
      if (canvas) seed();
    }

    function init(el) {
      canvas = el;
      if (!canvas || !canvas.getContext) return;
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = null; }
        else if (running && !reduced) rafId = requestAnimationFrame(loop);
      });
    }

    return { init: init, start: start, stop: stop, setIndoor: setIndoor };
  })();

  /* ------------------------------ 调试模式 ------------------------------ */

  function totalObservationPoints() {
    var total = 0;
    var scenes = STORY.scenes || {};
    Object.keys(scenes).forEach(function (sceneId) {
      var steps = scenes[sceneId].steps || [];
      for (var i = 0; i < steps.length; i++) {
        if (steps[i] && steps[i].t === 'observe') total += 1;
      }
    });
    return total;
  }

  function toggleDebug() {
    if (UI.debugPanel.hidden) {
      UI.debugPanel.hidden = false;
      updateDebug();
      clearInterval(debugTimer);
      debugTimer = setInterval(updateDebug, 300);
    } else {
      UI.debugPanel.hidden = true;
      clearInterval(debugTimer);
      debugTimer = null;
    }
  }

  function updateDebug() {
    if (!UI.debugPanel || UI.debugPanel.hidden) return;

    if (!state) {
      UI.dbgTrust.textContent = '0';
      UI.dbgPressure.textContent = '0';
      UI.dbgNotes.textContent = '0 / ' + totalObservationPoints();
      UI.dbgNoteList.textContent = '（未开始）';
      UI.dbgCursor.textContent = 'scene: —';
      return;
    }

    UI.dbgTrust.textContent = String(state.stats.trust);
    UI.dbgPressure.textContent = String(state.stats.pressure);
    UI.dbgNotes.textContent = state.notes.length + ' / ' + totalObservationPoints();

    if (state.notes.length) {
      UI.dbgNoteList.textContent = state.notes.map(function (id) {
        var note = STORY.notes && STORY.notes[id];
        return note && note.title ? note.title : id;
      }).join('、');
    } else {
      UI.dbgNoteList.textContent = '（未收集）';
    }

    UI.dbgCursor.textContent = state.cursor.scene + ' #' + state.cursor.step;
  }

  /* ------------------------------ 交互绑定 ------------------------------ */

  function handleAction(action) {
    if (action === 'new') startGame();
    else if (action === 'continue') continueGame();
    else if (action === 'memory') startMemory();
    else if (action === 'gallery') openGallery();
    else if (action === 'settings') openSettings();
    else if (action === 'to-title') returnToTitle();
  }

  var actionButtons = document.querySelectorAll('[data-action]');
  for (var a = 0; a < actionButtons.length; a++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        handleAction(btn.getAttribute('data-action'));
      });
    })(actionButtons[a]);
  }

  /* UI 音效：按钮悬停水滴声 + 点击咔哒声（委托，覆盖动态生成的选项按钮） */
  document.addEventListener('mouseover', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.menu-btn, .qbtn, .icon-btn, .choice-btn, .phone-reply-btn, button') : null;
    if (b) AudioManager.playSFX('sfx_hover');
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.menu-btn, .qbtn, .icon-btn, .choice-btn, .phone-reply-btn') : null;
    if (b) AudioManager.playSFX('sfx_click');
  }, true);

  var closeButtons = document.querySelectorAll('[data-close]');
  for (var c = 0; c < closeButtons.length; c++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var overlay = btn.closest ? btn.closest('.overlay') : null;
        closeOverlay(overlay);
      });
    })(closeButtons[c]);
  }

  var overlays = document.querySelectorAll('.overlay');
  for (var o = 0; o < overlays.length; o++) {
    (function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target !== overlay) return;
        if (overlay.id === 'overlay-end' || overlay.id === 'overlay-note') return;
        closeOverlay(overlay);
      });
    })(overlays[o]);
  }

  /* 移动端：点屏幕右侧继续对话，点左侧回看上一句（历史） */
  var lastPointerType = 'mouse';
  UI.game.addEventListener('pointerdown', function (e) {
    lastPointerType = (e && e.pointerType) || 'mouse';
  });

  UI.game.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('button')) return;
    if (uiHidden) { setUiHidden(false); return; }
    if (anyOverlayOpen()) return;

    /* inspect 模式：空白处不推进对话，只能靠🔍按钮或脉冲光圈 */
    if (currentInspectStep) return;

    if (lastPointerType === 'touch') {
      var third = window.innerWidth / 3;
      if (e.clientX < third) {
        /* 左侧：回看上一句 */
        if (state && state.history.length) openHistory();
        return;
      }
    }

    manualAdvance();
    /* 点击波纹 */
    spawnRipple(e.clientX, e.clientY);
  });

  /* 波纹工厂 */
  function spawnRipple(cx, cy) {
    if (!UI.rippleLayer) return;
    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = cx + 'px';
    r.style.top = cy + 'px';
    UI.rippleLayer.appendChild(r);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 750);
  }

  /* inspect 观察按钮 + 脉冲光圈 */
  if (UI.inspectFab) {
    UI.inspectFab.addEventListener('click', startInspectObserve);
  }
  if (UI.inspectRing) {
    UI.inspectRing.addEventListener('click', function (e) {
      e.stopPropagation();
      collectInspect();
    });
  }

  /* 鼠标右键：隐藏 / 恢复 UI */
  UI.game.addEventListener('contextmenu', function (e) {
    if (!UI.game.classList.contains('active')) return;
    if (anyOverlayOpen()) return;
    e.preventDefault();
    setUiHidden(!uiHidden);
  });

  UI.btnAuto.addEventListener('click', function () {
    if (!state) return;
    if (runtime.mode !== 'waiting' && runtime.mode !== 'typing') {
      toast('当前不能自动播放');
      return;
    }

    runtime.autoPlay = !runtime.autoPlay;
    if (runtime.autoPlay) {
      runtime.skipping = false;
      updateSkipButton();
      if (runtime.mode === 'waiting') scheduleAuto();
    } else {
      clearTimeout(runtime.autoTimer);
    }
    updateAutoButton();
  });

  UI.btnSkip.addEventListener('click', toggleSkip);
  UI.btnHistory.addEventListener('click', openHistory);
  UI.btnSaves.addEventListener('click', function () { openSaves('save'); });
  UI.btnLoads.addEventListener('click', function () { openSaves('load'); });
  UI.btnSettings.addEventListener('click', openSettings);
  UI.btnHide.addEventListener('click', function () { setUiHidden(true); });
  UI.btnTitle.addEventListener('click', function () {
    openConfirm('当前进度已保留在自动存档中。确定要返回标题吗？', returnToTitle);
  });
  UI.btnConfirmOk.addEventListener('click', function () {
    closeOverlay(byId('overlay-confirm'));
    var action = confirmAction;
    confirmAction = null;
    if (action) action();
  });
  UI.btnConfirmCancel.addEventListener('click', function () {
    confirmAction = null;
    closeOverlay(byId('overlay-confirm'));
  });
  UI.phoneFab.addEventListener('click', openPhone);

  UI.hotspot.addEventListener('click', collectObservation);
  UI.btnNoteClose.addEventListener('click', closeNote);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = document.querySelector('.overlay:not([hidden])');
      if (open && open.id !== 'overlay-end' && open.id !== 'overlay-note') {
        closeOverlay(open);
        return;
      }
      if (uiHidden) setUiHidden(false);
      return;
    }

    if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!UI.game.classList.contains('active')) return;
      if (e.repeat) return;
      e.preventDefault();
      toggleDebug();
      return;
    }

    if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!UI.game.classList.contains('active')) return;
      if (e.repeat) return;
      e.preventDefault();
      setUiHidden(!uiHidden);
      return;
    }

    /* 按住 Ctrl：快进已读 */
    if (e.key === 'Control' && !e.repeat) {
      if (!UI.game.classList.contains('active')) return;
      startCtrlSkip();
      return;
    }

    if (e.key !== ' ' && e.key !== 'Spacebar' && e.key !== 'Enter') return;
    if (anyOverlayOpen()) return;
    if (!UI.game.classList.contains('active')) return;

    e.preventDefault();
    if (uiHidden) { setUiHidden(false); return; }
    manualAdvance();
  });

  document.addEventListener('keyup', function (e) {
    if (e.key === 'Control') stopCtrlSkip();
  });
  window.addEventListener('blur', stopCtrlSkip);

  window.addEventListener('pagehide', function () {
    clearTimeout(globalSaveTimer);
    saveGlobal();
  });

  /* 切到后台再切回：浏览器会挂起 AudioContext，页面重新可见时恢复（仅恢复已解锁的 ctx，不会自动新建） */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      AudioManager.resume();
      document.title = originalTitle;
    } else {
      /* 玩家切到别的标签页时，标题变得有存在感 */
      if (state && state.phone && state.phone.pending) {
        document.title = '【未读短信】请别在雨天离开';
      } else if (UI.phoneFab && !UI.phoneFab.hidden && state && state.phone && state.phone.unread > 0) {
        document.title = '【未读短信】请别在雨天离开';
      } else {
        document.title = '《请别在雨天离开……》';
      }
    }
  });
  window.addEventListener('pageshow', function () {
    AudioManager.resume();
  });
  /* iOS Safari 兜底：真实物理点击可直接唤醒被挂起的 AudioContext */
  document.addEventListener('pointerdown', function () {
    AudioManager.resume();
  }, { passive: true });

  /* ------------------------------ 初始化 ------------------------------ */

  updateSettingOutputs();
  AudioManager.setVolumes();
  renderGallery();
  /* ==================== 结局回忆截图卡片 ==================== */
  if (UI.btnShareSnap) {
    UI.btnShareSnap.addEventListener('click', generateShareSnapshot);
  }

  function generateShareSnapshot() {
    if (!UI.shareCanvas || !UI.shareCanvas.getContext) return;
    var canvas = UI.shareCanvas;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;

    var endingId = currentEndingId;
    var ending = null;
    if (endingId) {
      var list = STORY.endings || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === endingId) { ending = list[i]; break; }
    }
    if (!ending) { ending = { title: '未完待续', kicker: 'END', epilogue: '' }; }

    var playSec = runtime.playStart ? Math.round((Date.now() - runtime.playStart) / 1000) : 0;

    /* 1) 背景：深色渐变 + 雨线 + 暖光 */
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0e1822');
    bgGrad.addColorStop(0.5, '#0a1119');
    bgGrad.addColorStop(1, '#060a10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    /* 暖色径向光晕（真结局用金，坏结局暗灰，疏远用中性蓝灰） */
    var haloColor = endingId === 'end_true' ? 'rgba(255,220,160,'
                  : endingId === 'end_bad' ? 'rgba(120,130,140,'
                  : 'rgba(143,182,217,';
    var halo = ctx.createRadialGradient(W / 2, H * 0.22, 20, W / 2, H * 0.22, W * 0.55);
    halo.addColorStop(0, haloColor + '0.35)');
    halo.addColorStop(1, haloColor + '0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    /* 2) 标题（大字） */
    ctx.fillStyle = '#e9eff7';
    ctx.textAlign = 'center';
    ctx.font = 'bold 88px "Songti SC", "SimSun", "Noto Serif SC", serif';
    ctx.shadowColor = 'rgba(143,182,217,0.45)';
    ctx.shadowBlur = 22;
    ctx.fillText(STORY.title || '请别在雨天离开', W / 2, H * 0.13);
    ctx.shadowBlur = 0;

    /* 英文副标题 */
    ctx.fillStyle = 'rgba(143,182,217,0.55)';
    ctx.font = '28px Consolas, monospace';
    ctx.letterSpacing = '6px';
    ctx.fillText("DON'T LEAVE ON A RAINY DAY", W / 2, H * 0.13 + 54);
    ctx.letterSpacing = '0px';

    /* 3) 分隔线 */
    ctx.strokeStyle = 'rgba(143,182,217,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, H * 0.13 + 90);
    ctx.lineTo(W * 0.82, H * 0.13 + 90);
    ctx.stroke();

    /* 4) 结局章节 */
    ctx.fillStyle = endingId === 'end_true' ? '#ffd89a'
                  : endingId === 'end_bad' ? '#a8b4c0'
                  : '#c2d4e6';
    ctx.font = 'bold 70px "Songti SC", "SimSun", serif';
    ctx.fillText(ending.title || '结局', W / 2, H * 0.32);

    ctx.fillStyle = 'rgba(159,180,194,0.55)';
    ctx.font = '26px Consolas, monospace';
    ctx.fillText(ending.kicker || 'END', W / 2, H * 0.32 + 48);

    /* 5) 结语（支持换行） */
    var epi = ending.epilogue || ending.hint || '';
    if (epi) {
      ctx.fillStyle = endingId === 'end_bad' ? '#b0a8a0' : '#dca7b4';
      ctx.font = 'italic 34px "Kaiti SC", "STKaiti", "LXGW WenKai", serif';
      var lines = wrapText(ctx, epi, W * 0.7, W / 2, H * 0.43, 52);
      for (var li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li].text, W / 2, lines[li].y);
      }
    }

    /* 6) 游玩时长 + 日期 */
    ctx.fillStyle = 'rgba(143,182,217,0.5)';
    ctx.font = '24px Consolas, monospace';
    var durationLabel = playSec > 0 ? '本次游玩 ' + formatPlayDuration(playSec) : '——';
    ctx.fillText(durationLabel, W / 2, H * 0.82);

    var d = new Date();
    ctx.fillStyle = 'rgba(143,182,217,0.35)';
    ctx.font = '20px Consolas, monospace';
    var dateStr = (d.getFullYear()) + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
    ctx.fillText(dateStr + '  ·  dfdh.rain', W / 2, H * 0.82 + 34);

    /* 7) 底部装饰雨线 */
    ctx.strokeStyle = 'rgba(143,182,217,0.08)';
    ctx.lineWidth = 1;
    for (var r = 0; r < 40; r++) {
      var rx = (Math.sin(r * 0.9) * 0.5 + 0.5) * W;
      var ry = H * 0.88 + ((r * 17) % 140);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 12, ry + 42);
      ctx.stroke();
    }

    /* 下载 */
    try {
      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = 'dfdh_' + (endingId || 'snapshot') + '_' +
                   (d.getMonth() + 1) + (d.getDate()) + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast('回忆截图已生成');
    } catch (e) {
      toast('截图生成失败（可能浏览器禁用画布导出）');
    }
  }

  /* 简易中文支持的文字换行（按字符宽度估算：中文 = font * 0.95, 英文数字 = font * 0.55） */
  function wrapText(ctx, text, maxWidth, centerX, startY, lineHeight) {
    var chars = String(text).split('');
    var line = '';
    var lines = [];
    var y = startY;
    var bold = ctx.font.indexOf('bold') !== -1;
    var pxMatch = /(\d+)px/.exec(ctx.font);
    var fontSize = pxMatch ? parseInt(pxMatch[1], 10) : 20;
    var estCharW = fontSize * (bold ? 0.55 : 0.5);

    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];
      var w = /[\u4e00-\u9fa5]/.test(c) ? fontSize * 0.95 : estCharW;
      if (ctx.measureText(line + c).width > maxWidth && line) {
        lines.push({ text: line, y: y });
        y += lineHeight;
        line = c;
      } else {
        line += c;
      }
      void w;
    }
    if (line) lines.push({ text: line, y: y });
    return lines;
  }

  /* 封面光尘：随机漂浮的水滴微光，营造雨中观感的纵深 */
  function buildTitleMotes() {
    if (!UI.titleMotes) return;
    for (var i = 0; i < 26; i++) {
      var s = document.createElement('span');
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.bottom = (Math.random() * 34 - 6).toFixed(2) + 'vh';
      s.style.animationDuration = (11 + Math.random() * 13).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 20).toFixed(1) + 's';
      s.style.setProperty('--dx', Math.round(Math.random() * 70 - 35) + 'px');
      if (Math.random() > 0.72) {
        s.style.width = '2px';
        s.style.height = '2px';
      }
      UI.titleMotes.appendChild(s);
    }
  }

  /* 封面立绘加载失败时优雅隐藏，不留破图 */
  if (UI.titlePortraitImg) {
    UI.titlePortraitImg.onerror = function () {
      UI.titlePortraitImg.onerror = null;
      var wrap = UI.titlePortraitImg.parentNode;
      if (wrap) wrap.style.display = 'none';
    };
  }

  buildTitleMotes();
  TitleRain.init(document.getElementById('title-rain'));
  SceneRain.init(document.getElementById('scene-rain'));
  refreshTitleExtra();
  updateAutoButton();
  updateSkipButton();
  updatePhoneUI();
  showScreen('title');
})();
