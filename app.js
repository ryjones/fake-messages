'use strict';

// Fake Messages: draws a mock phone conversation onto a canvas.
// No dependencies, no network calls; state lives in localStorage.

(() => {
  let W = 390;            // logical screen width, in points (wider for the terminal)
  const MIN_H = 844;      // the screen grows past this to fit the conversation
  const INPUT_H = 86;
  let H = MIN_H;
  let INPUT_TOP = H - INPUT_H;
  let SCALE = 3;          // canvas pixels per point
  const STORE_KEY = 'fake-messages:v1';
  const FONT = 'system-ui, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';

  const DEFAULTS = {
    name: 'Olena',
    me: 'you',
    type: 'imessage',
    theme: 'light',
    receipt: 'delivered',
    receiptTime: '9:41',
    carrier: 'Kyivstar',
    time: '9:41',
    conn: 'LTE',
    signal: 4,
    battery: 82,
    charging: false,
    avatar: null,
    messages: [
      { kind: 'time', text: 'Today 9:38' },
      { kind: 'received', text: 'Are you still coming tonight?' },
      { kind: 'sent', text: 'Yes! Leaving in ten minutes.' },
      { kind: 'sent', text: 'Want me to bring anything?' },
      { kind: 'received', text: 'Just yourself 🙂' },
      { kind: 'sent', text: 'Deal.' },
    ],
  };

  const THEMES = {
    light: {
      bg: '#ffffff', bar: '#f6f6f6', hairline: '#d1d1d6', text: '#000000',
      muted: '#8e8e93', received: '#e9e9eb', receivedText: '#000000',
      blue: '#007aff', green: '#34c759', red: '#ff3b30',
      field: '#c7c7cc', placeholder: '#c4c4c7', plusBg: '#e9e9eb', plusFg: '#7c7c80',
      avatarA: '#a5abb8', avatarB: '#858994',
    },
    dark: {
      bg: '#000000', bar: '#161617', hairline: '#2c2c2e', text: '#ffffff',
      muted: '#8e8e93', received: '#262629', receivedText: '#ffffff',
      blue: '#0a84ff', green: '#30d158', red: '#ff453a',
      field: '#3a3a3c', placeholder: '#5a5a5e', plusBg: '#262629', plusFg: '#9c9ca2',
      avatarA: '#a5abb8', avatarB: '#858994',
    },
  };

  // Other chat apps: one bubble geometry and two palettes each.
  const CHAT = {
    whatsapp: {
      header: 96, font: 16, line: 21, padX: 10, padY: 6, r: 9, max: 300, side: 14,
      gapSame: 2, gapOther: 9, meta: 'inside', nameIn: true, tail: 'corner',
      avatar: 'bottom', avatarAlways: false, avatarR: 14, indent: 34, placeholder: '',
      light: {
        bg: '#efeae2', bar: '#f6f6f6', hairline: '#d1d1d6', text: '#000000', muted: '#667781',
        sent: '#d9fdd3', sentText: '#111b21', recv: '#ffffff', recvText: '#111b21',
        meta: '#667781', metaSent: '#667781', tickRead: '#53bdeb',
        pill: 'rgba(255,255,255,0.95)', pillText: '#54656f', nameMuted: '#667781',
        inputBg: '#f6f6f6', field: '#ffffff', fieldStroke: '#d1d1d6', placeholder: '#8696a0',
        icon: '#000000', green: '#34c759', red: '#ff3b30',
      },
      dark: {
        bg: '#0b141a', bar: '#161717', hairline: '#2a2a2a', text: '#ffffff', muted: '#8696a0',
        sent: '#144d37', sentText: '#ffffff', recv: '#242626', recvText: '#ffffff',
        meta: '#a5acb0', metaSent: '#a8c7b9', tickRead: '#53bdeb',
        pill: 'rgba(36,38,38,0.95)', pillText: '#a5acb0', nameMuted: '#8696a0',
        inputBg: '#161717', field: '#242626', fieldStroke: null, placeholder: '#8696a0',
        icon: '#ffffff', green: '#30d158', red: '#ff453a',
      },
    },
    signal: {
      header: 96, font: 17, line: 22, padX: 12, padY: 7, r: 18, max: 290, side: 14,
      gapSame: 2, gapOther: 10, meta: 'inside', nameIn: true, tail: null,
      avatar: 'bottom', avatarAlways: false, avatarR: 14, indent: 36, placeholder: 'Message',
      light: {
        bg: '#ffffff', bar: '#ffffff', hairline: null, text: '#000000', muted: '#5e5e5e',
        sent: '#2c6bed', sentText: '#ffffff', recv: '#e9e9e9', recvText: '#000000',
        meta: '#5e5e5e', metaSent: 'rgba(255,255,255,0.85)', tickRead: null,
        pill: null, pillText: '#5e5e5e', nameMuted: '#5e5e5e',
        inputBg: '#ffffff', field: '#e9e9e9', fieldStroke: null, placeholder: '#848484',
        icon: '#000000', green: '#34c759', red: '#ff3b30',
      },
      dark: {
        bg: '#000000', bar: '#000000', hairline: null, text: '#ffffff', muted: '#b9b9b9',
        sent: '#2c6bed', sentText: '#ffffff', recv: '#3b3b3b', recvText: '#ffffff',
        meta: '#b9b9b9', metaSent: 'rgba(255,255,255,0.85)', tickRead: null,
        pill: null, pillText: '#b9b9b9', nameMuted: '#b9b9b9',
        inputBg: '#000000', field: '#2e2e2e', fieldStroke: null, placeholder: '#8a8a8a',
        icon: '#ffffff', green: '#30d158', red: '#ff453a',
      },
    },
    line: {
      header: 92, font: 15, line: 20, padX: 12, padY: 8, r: 17, max: 270, side: 12,
      gapSame: 5, gapOther: 11, meta: 'beside', nameIn: false, tail: 'nub',
      avatar: 'top', avatarAlways: true, avatarR: 17, indent: 42, placeholder: 'Aa',
      light: {
        bg: '#8cabd9', bar: '#8cabd9', hairline: null, text: '#111111', muted: '#40516b',
        sent: '#8de055', sentText: '#111111', recv: '#ffffff', recvText: '#111111',
        meta: '#40516b', metaSent: '#40516b', tickRead: null,
        pill: 'rgba(0,0,0,0.18)', pillText: '#ffffff', nameMuted: '#2f3d52',
        inputBg: '#ffffff', field: '#f2f3f5', fieldStroke: null, placeholder: '#b0b3b9',
        icon: '#111111', inputIcon: '#4a4d52', green: '#34c759', red: '#ff3b30',
      },
      dark: {
        bg: '#111111', bar: '#111111', hairline: null, text: '#ffffff', muted: '#8e8e93',
        sent: '#8de055', sentText: '#111111', recv: '#2c2c2e', recvText: '#ffffff',
        meta: '#8e8e93', metaSent: '#8e8e93', tickRead: null,
        pill: 'rgba(255,255,255,0.12)', pillText: '#d0d0d4', nameMuted: '#b0b0b5',
        inputBg: '#1c1c1e', field: '#2c2c2e', fieldStroke: null, placeholder: '#6c6c70',
        icon: '#ffffff', inputIcon: '#b0b0b5', green: '#30d158', red: '#ff453a',
      },
    },
  };

  // irssi: an 80-ish column terminal instead of a phone.
  const TERM_W = 600;
  const TERM_SCALE = 2;
  const TERM_FONT = 'ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace';
  const TERM_SIZE = 12;
  const TERM_LINE = 15;
  const TERM_ROWS = 24;
  const TERM = {
    dark: { bg: '#000000', fg: '#bbbbbb', bold: '#ffffff', dim: '#555555', blue: '#5555ff',
      bar: '#0000aa', barFg: '#bbbbbb', barBr: '#00aaaa' },
    light: { bg: '#ffffff', fg: '#222222', bold: '#000000', dim: '#888888', blue: '#0000aa',
      bar: '#0000aa', barFg: '#dddddd', barBr: '#55ffff' },
  };

  const TIME_RE = /\b\d{1,2}[:.]\d{2}(?:\s*[AP]\.?M\.?)?/i;

  // Layout constants (points).
  const STATUS_H = 44;
  const HEADER_BOTTOM = 142;
  const BUBBLE_FONT = 17;
  const BUBBLE_LINE = 22;
  const BUBBLE_PAD_X = 13;
  const BUBBLE_PAD_Y = 7;
  const BUBBLE_R = 18;
  const BUBBLE_MAX = 272;
  const SIDE = 16;
  const GROUP_INDENT = 34; // room for the sender's avatar in a group chat

  // Avatar gradients for group chat senders, picked by a hash of the name.
  const SENDER_COLORS = [
    ['#ff9f7a', '#f2603c'], ['#ffd66b', '#f0a81c'], ['#8fe08a', '#3fb24a'],
    ['#7fd6f5', '#2a9fd8'], ['#a9a6ff', '#6a5fe6'], ['#f5a3d3', '#e0559f'],
    ['#c7a889', '#9a7653'], ['#8ee0d2', '#2fa896'],
  ];

  const $ = (id) => document.getElementById(id);
  const canvas = $('phone');
  const ctx = canvas.getContext('2d');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;

  let state = load();
  let avatarImg = null;

  // ---------- state ----------

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && Array.isArray(saved.messages)) {
        return Object.assign(structuredCloneSafe(DEFAULTS), saved);
      }
    } catch (e) { /* fall through to defaults */ }
    return structuredCloneSafe(DEFAULTS);
  }

  function structuredCloneSafe(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      setStatus('Could not save (storage full or blocked).');
    }
  }

  function changed() {
    save();
    render();
  }

  // ---------- drawing helpers ----------

  function font(size, weight) {
    ctx.font = `${weight || 400} ${size}px ${FONT}`;
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Greedy word wrap; words wider than the line are broken by grapheme.
  function wrap(text, maxWidth) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(/(\s+)/)) {
        if (!word) continue;
        if (ctx.measureText(line + word).width <= maxWidth) {
          line += word;
          continue;
        }
        if (/^\s+$/.test(word)) continue; // drop whitespace at a break
        if (line.trim()) {
          lines.push(line.trimEnd());
          line = '';
        }
        if (ctx.measureText(word).width <= maxWidth) {
          line = word;
          continue;
        }
        for (const ch of Array.from(word)) {
          if (line && ctx.measureText(line + ch).width > maxWidth) {
            lines.push(line);
            line = '';
          }
          line += ch;
        }
      }
      lines.push(line.trimEnd());
    }
    return lines;
  }

  // ---------- layout ----------

  // A conversation is a group chat as soon as any received message names its sender.
  function isGroup() {
    return state.messages.some((m) => m.kind === 'received' && (m.sender || '').trim());
  }

  function groupSenders() {
    const seen = [];
    for (const m of state.messages) {
      const s = m.kind === 'received' ? (m.sender || '').trim() : '';
      if (s && !seen.includes(s)) seen.push(s);
    }
    return seen;
  }

  function senderColors(name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return SENDER_COLORS[h % SENDER_COLORS.length];
  }

  function layout() {
    const msgs = state.messages;
    let lastSent = -1;
    msgs.forEach((m, i) => { if (m.kind === 'sent') lastSent = i; });

    const group = isGroup();
    const senderOf = (m) => (m && m.kind === 'received' ? (m.sender || '').trim() : '');
    // Consecutive bubbles from the same person form a run.
    const sameRun = (a, b) => !!a && !!b && a.kind === b.kind && a.kind !== 'time' &&
      (a.kind === 'sent' || !group || senderOf(a) === senderOf(b));

    const items = [];
    let y = 0;
    let prevKind = null;

    msgs.forEach((m, i) => {
      if (m.kind === 'time') {
        font(11, 400);
        const lines = String(m.text).split('\n');
        y += prevKind ? 14 : 4;
        items.push({ type: 'time', y, lines });
        y += lines.length * 14 + 6;
        prevKind = 'time';
        return;
      }
      const sent = m.kind === 'sent';
      const indent = group && !sent ? GROUP_INDENT : 0;
      const prev = msgs[i - 1];
      const sender = senderOf(m);
      if (prevKind && prevKind !== 'time') y += sameRun(prev, m) ? 2 : 9;
      if (group && sender && !sameRun(prev, m)) {
        items.push({ type: 'sender', y, x: SIDE + indent + BUBBLE_PAD_X, text: sender });
        y += 16;
      }
      font(BUBBLE_FONT, 400);
      const lines = wrap(m.text || ' ', BUBBLE_MAX - indent - 2 * BUBBLE_PAD_X);
      const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 8);
      const w = Math.ceil(textW) + 2 * BUBBLE_PAD_X;
      const h = lines.length * BUBBLE_LINE + 2 * BUBBLE_PAD_Y;
      const receipt = i === lastSent && state.receipt !== 'none';
      const tail = !sameRun(m, msgs[i + 1]) || receipt;
      items.push({
        type: 'bubble', sent, y, w, h, lines, tail,
        x: sent ? W - SIDE - w : SIDE + indent,
        avatar: group && !sent && tail ? sender : null,
      });
      y += h;
      if (receipt) {
        items.push({ type: 'receipt', y: y + 3 });
        y += 19;
      }
      prevKind = m.kind;
    });
    return { items, height: y };
  }

  // The time shown on each message: its own, else the last one stated above it
  // (on a message or in a timestamp row), else the status bar clock.
  function messageTimes() {
    let cur = state.time;
    return state.messages.map((m) => {
      const own = (m.time || '').trim();
      if (own) cur = own;
      else if (m.kind === 'time') {
        const found = TIME_RE.exec(String(m.text));
        if (found) cur = found[0];
      }
      return cur;
    });
  }

  function fit(text, maxWidth) {
    let s = String(text).trim();
    if (ctx.measureText(s).width <= maxWidth) return s;
    while (s && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1).trimEnd();
    return s + '…';
  }

  function layoutChat(s) {
    const msgs = state.messages;
    const times = messageTimes();
    const group = isGroup();
    let lastSent = -1;
    msgs.forEach((m, i) => { if (m.kind === 'sent') lastSent = i; });
    const senderOf = (m) => (m && m.kind === 'received' ? (m.sender || '').trim() : '');
    const sameRun = (a, b) => !!a && !!b && a.kind === b.kind && a.kind !== 'time' &&
      (a.kind === 'sent' || !group || senderOf(a) === senderOf(b));

    const items = [];
    let y = 0;
    let prevKind = null;

    msgs.forEach((m, i) => {
      if (m.kind === 'time') {
        // These apps show the day in a pill and the time on each message.
        const raw = String(m.text).replace(/\s+/g, ' ').trim();
        const text = raw.replace(TIME_RE, '').replace(/[\s,]+$/, '').trim() || raw;
        y += prevKind ? 12 : 4;
        items.push({ type: 'pill', y, text });
        y += 26;
        prevKind = 'time';
        return;
      }
      const sent = m.kind === 'sent';
      const first = !sameRun(msgs[i - 1], m);
      const last = !sameRun(m, msgs[i + 1]);
      const hasAvatar = !sent && (group || s.avatarAlways);
      const indent = hasAvatar ? s.indent : 0;
      const sender = senderOf(m);
      if (prevKind && prevKind !== 'time') y += first ? s.gapOther : s.gapSame;
      const showName = group && !sent && !!sender && first;
      if (showName && !s.nameIn) {
        items.push({ type: 'sender', y, x: s.side + indent + 4, text: sender });
        y += 16;
      }

      font(s.font, 400);
      const maxText = s.max - indent - 2 * s.padX;
      const lines = wrap(m.text || ' ', maxText);
      const widths = lines.map((l) => ctx.measureText(l).width);
      let innerW = Math.max(...widths, 8);
      let h = lines.length * s.line + 2 * s.padY;
      let tick = null;
      if (sent) {
        if (state.receipt === 'failed' && i === lastSent) tick = 'failed';
        else if (state.receipt === 'none') tick = 'sent';
        else tick = state.receipt === 'read' ? 'read' : 'delivered';
      }
      if (s.meta === 'inside') {
        // Time and ticks share the last line when they fit beside the text.
        font(11, 400);
        const metaW = ctx.measureText(times[i]).width + (sent ? 20 : 0);
        const lastW = widths[widths.length - 1];
        if (lastW + 10 + metaW <= maxText) innerW = Math.max(innerW, lastW + 10 + metaW);
        else {
          innerW = Math.max(innerW, metaW);
          h += 14;
        }
      }
      let textTop = 0;
      if (showName && s.nameIn) {
        font(13, 600);
        innerW = Math.max(innerW, Math.min(ctx.measureText(sender).width, maxText));
        textTop = 18;
        h += 18;
      }
      const w = Math.ceil(innerW) + 2 * s.padX;
      items.push({
        type: 'bubble', sent, y, w, h, lines, textTop, first, tick, time: times[i],
        name: showName && s.nameIn ? sender : null,
        x: sent ? W - s.side - w : s.side + indent,
        avatar: hasAvatar && (s.avatar === 'top' ? first : last) ? sender : null,
      });
      y += h;
      prevKind = m.kind;
    });
    return { items, height: y };
  }

  // ---------- painters ----------

  function drawStatusBar(t) {
    const cy = 24;
    ctx.fillStyle = t.text;
    ctx.textBaseline = 'middle';

    // Signal bars, then carrier, then connection.
    let x = 14;
    for (let i = 0; i < 4; i++) {
      const bh = 4 + i * 2.4;
      ctx.globalAlpha = i < state.signal ? 1 : 0.25;
      roundRect(x, cy + 5.5 - bh, 3, bh, 1);
      ctx.fill();
      x += 5;
    }
    ctx.globalAlpha = 1;
    x += 3;

    font(13, 500);
    ctx.textAlign = 'left';
    const carrier = state.carrier.trim();
    if (carrier) {
      ctx.fillText(carrier, x, cy + 0.5);
      x += ctx.measureText(carrier).width + 5;
    }
    if (state.conn === 'wifi') {
      drawWifi(x + 8, cy + 5.5, t.text);
    } else if (state.conn) {
      font(13, 600);
      ctx.fillText(state.conn, x, cy + 0.5);
    }

    // Clock, centred.
    font(14, 600);
    ctx.textAlign = 'center';
    ctx.fillText(state.time, W / 2, cy + 0.5);

    // Battery, right aligned, with percentage.
    const bw = 25, bh = 12;
    const bx = W - 14 - bw - 2.5;
    const by = cy - bh / 2;
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = t.text;
    ctx.lineWidth = 1;
    roundRect(bx + 0.5, by + 0.5, bw - 1, bh - 1, 3.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx + bw + 0.6, cy, 2.1, -Math.PI / 2.6, Math.PI / 2.6);
    ctx.fill();
    ctx.globalAlpha = 1;

    const level = Math.max(1, Math.min(100, state.battery)) / 100;
    ctx.fillStyle = state.charging ? t.green : (state.battery <= 20 ? t.red : t.text);
    roundRect(bx + 2, by + 2, Math.max(2.5, (bw - 4) * level), bh - 4, 2);
    ctx.fill();

    ctx.fillStyle = t.text;
    let px = bx - 4;
    if (state.charging) {
      drawBolt(px - 4, cy, t.text);
      px -= 10;
    }
    font(13, 500);
    ctx.textAlign = 'right';
    ctx.fillText(`${state.battery}%`, px, cy + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  function drawWifi(cx, bottom, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const a0 = -Math.PI * 0.75, a1 = -Math.PI * 0.25;
    for (const r of [5.5, 9.5]) {
      ctx.beginPath();
      ctx.arc(cx, bottom, r, a0, a1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, bottom - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBolt(cx, cy, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx + 1.5, cy - 6);
    ctx.lineTo(cx - 3, cy + 1);
    ctx.lineTo(cx - 0.3, cy + 1);
    ctx.lineTo(cx - 1.5, cy + 6);
    ctx.lineTo(cx + 3, cy - 1);
    ctx.lineTo(cx + 0.3, cy - 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    const first = Array.from(parts[0])[0];
    const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
    return (first + last).toUpperCase();
  }

  // Round avatar with initials, or a generic silhouette when there is no name.
  function drawPerson(cx, cy, r, name, colors) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    ctx.fillStyle = '#ffffff';
    const ini = initials(name);
    if (ini) {
      font(Math.round(r * 0.88), 500);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ini, cx, cy + r * 0.04);
      ctx.textBaseline = 'alphabetic';
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.24, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.88, r * 0.72, r * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // The contact: the chosen photo, else initials on grey.
  function drawContact(cx, cy, r) {
    if (!avatarImg) {
      drawPerson(cx, cy, r, state.name, [THEMES.light.avatarA, THEMES.light.avatarB]);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const s = Math.min(avatarImg.width, avatarImg.height);
    ctx.drawImage(avatarImg, (avatarImg.width - s) / 2, (avatarImg.height - s) / 2, s, s,
      cx - r, cy - r, 2 * r, 2 * r);
    ctx.restore();
  }

  // ---------- glyphs (centred on cx, cy) ----------

  function glyph(color, width) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function drawMic(cx, cy, color) {
    glyph(color, 1.5);
    roundRect(cx - 3, cy - 8, 6, 12, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - 0.5, 6.5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, cy + 9.5);
    ctx.stroke();
  }

  function drawChevron(x, cy, color) {
    glyph(color, 2.6);
    ctx.beginPath();
    ctx.moveTo(x + 9, cy - 9);
    ctx.lineTo(x, cy);
    ctx.lineTo(x + 9, cy + 9);
    ctx.stroke();
  }

  function drawVideo(cx, cy, color) {
    glyph(color, 1.8);
    roundRect(cx - 12, cy - 7.5, 17, 15, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy - 2);
    ctx.lineTo(cx + 13, cy - 6);
    ctx.lineTo(cx + 13, cy + 6);
    ctx.lineTo(cx + 7, cy + 2);
    ctx.stroke();
  }

  function drawPhone(cx, cy, color) {
    glyph(color, 2);
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 5);
    ctx.quadraticCurveTo(cx - 4, cy + 4, cx + 5, cy + 6);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 6.5, cy - 7);
    ctx.lineTo(cx - 5, cy - 4);
    ctx.moveTo(cx + 4, cy + 5);
    ctx.lineTo(cx + 7, cy + 6.5);
    ctx.stroke();
  }

  function drawSearch(cx, cy, color) {
    glyph(color, 1.8);
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 6.5, 0, Math.PI * 2);
    ctx.moveTo(cx + 3, cy + 3);
    ctx.lineTo(cx + 8, cy + 8);
    ctx.stroke();
  }

  function drawMenu(cx, cy, color) {
    glyph(color, 1.8);
    ctx.beginPath();
    for (const dy of [-6, 0, 6]) {
      ctx.moveTo(cx - 8, cy + dy);
      ctx.lineTo(cx + 8, cy + dy);
    }
    ctx.stroke();
  }

  function drawPlus(cx, cy, color) {
    glyph(color, 1.8);
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  }

  function drawCamera(cx, cy, color) {
    glyph(color, 1.6);
    roundRect(cx - 11, cy - 6, 22, 15, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 6);
    ctx.lineTo(cx - 2.5, cy - 9);
    ctx.lineTo(cx + 2.5, cy - 9);
    ctx.lineTo(cx + 4, cy - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, 3.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPicture(cx, cy, color) {
    glyph(color, 1.6);
    roundRect(cx - 10, cy - 9, 20, 18, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 5);
    ctx.lineTo(cx - 3, cy - 1);
    ctx.lineTo(cx + 1, cy + 3);
    ctx.lineTo(cx + 4, cy);
    ctx.lineTo(cx + 8, cy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 4.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delivery ticks in a 16 x 10 box whose top left is x, y.
  function drawTicks(app, tick, x, y, color, t, bubbleFill) {
    if (tick === 'failed') {
      ctx.fillStyle = t.red;
      ctx.beginPath();
      ctx.arc(x + 10.5, y + 5, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      font(9, 700);
      ctx.textAlign = 'center';
      ctx.fillText('!', x + 10.5, y + 8.2);
      return;
    }
    if (app === 'signal') {
      const circle = (cx, filled) => {
        const cy = y + 5;
        if (filled) {
          glyph(bubbleFill, 2.2);
          ctx.beginPath();
          ctx.arc(cx, cy, 4.8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.fill();
        } else {
          glyph(color, 1);
          ctx.beginPath();
          ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = bubbleFill;
          ctx.fill();
          ctx.stroke();
        }
        glyph(filled ? bubbleFill : color, 1.1);
        ctx.beginPath();
        ctx.moveTo(cx - 2.1, cy + 0.2);
        ctx.lineTo(cx - 0.6, cy + 1.8);
        ctx.lineTo(cx + 2.2, cy - 1.7);
        ctx.stroke();
      };
      if (tick !== 'sent') circle(x + 4.5, tick === 'read');
      circle(x + 11, tick === 'read');
      return;
    }
    glyph(tick === 'read' ? t.tickRead : color, 1.4);
    ctx.beginPath();
    if (tick === 'sent') {
      ctx.moveTo(x + 6, y + 5.5);
      ctx.lineTo(x + 9, y + 8.5);
      ctx.lineTo(x + 15, y + 1.5);
    } else {
      ctx.moveTo(x + 1, y + 5.5);
      ctx.lineTo(x + 4, y + 8.5);
      ctx.lineTo(x + 10, y + 1.5);
      ctx.moveTo(x + 7.4, y + 7.3);
      ctx.lineTo(x + 8.6, y + 8.5);
      ctx.lineTo(x + 14.6, y + 1.5);
    }
    ctx.stroke();
  }

  // ---------- WhatsApp, Signal and LINE ----------

  function drawChatHeader(app, s, t) {
    ctx.fillStyle = t.bar;
    ctx.fillRect(0, 0, W, s.header);
    if (t.hairline) {
      ctx.fillStyle = t.hairline;
      ctx.fillRect(0, s.header - 0.5, W, 0.5);
    }
    drawStatusBar(t);

    const cy = STATUS_H + (s.header - STATUS_H) / 2;
    const senders = groupSenders();
    const name = state.name.trim();
    drawChevron(11, cy, t.icon);
    ctx.textAlign = 'left';
    ctx.fillStyle = t.text;

    if (app === 'line') {
      font(17, 700);
      const label = fit(name, 190);
      ctx.fillText(label, 34, cy + 6);
      if (senders.length) {
        const nw = ctx.measureText(label).width;
        font(17, 400);
        ctx.fillText(` (${senders.length + 1})`, 34 + nw, cy + 6);
      }
      drawSearch(W - 104, cy, t.icon);
      drawPhone(W - 66, cy, t.icon);
      drawMenu(W - 28, cy, t.icon);
      return;
    }

    const r = app === 'whatsapp' ? 18 : 16;
    drawContact(32 + r, cy, r);
    const tx = 32 + 2 * r + 10;
    ctx.fillStyle = t.text;
    if (app === 'whatsapp') {
      font(16, 600);
      ctx.fillText(fit(name, 170), tx, cy - 1);
      font(12, 400);
      ctx.fillStyle = t.muted;
      ctx.fillText(senders.length ? fit(senders.concat('You').join(', '), 170) : 'online', tx, cy + 15);
    } else {
      font(17, 600);
      ctx.fillText(fit(name, 180), tx, cy + 6);
    }
    drawVideo(W - 78, cy, t.icon);
    drawPhone(W - 32, cy, t.icon);
  }

  function drawChatBubble(it, top, app, s, t, group) {
    const x = it.x;
    const y = top + it.y;
    if (it.avatar !== null) {
      const r = s.avatarR;
      const acy = s.avatar === 'top' ? y + r : y + it.h - r;
      if (group) drawPerson(8 + r, acy, r, it.avatar, senderColors(it.avatar || '?'));
      else drawContact(8 + r, acy, r);
    }

    const fill = it.sent ? t.sent : t.recv;
    ctx.fillStyle = fill;
    roundRect(x, y, it.w, it.h, s.r);
    ctx.fill();
    if (s.tail && it.first) {
      const dir = it.sent ? 1 : -1;
      const e = it.sent ? x + it.w : x; // outer edge
      ctx.beginPath();
      if (s.tail === 'corner') {
        ctx.moveTo(e - dir * s.r, y);
        ctx.lineTo(e + dir * 7, y);
        ctx.lineTo(e, y + 10);
        ctx.lineTo(e - dir * s.r, y + 10);
      } else {
        ctx.moveTo(e - dir * 8, y + 3);
        ctx.quadraticCurveTo(e + dir * 2, y + 4, e + dir * 6, y + 1);
        ctx.quadraticCurveTo(e + dir * 5, y + 10, e - dir * 2, y + 16);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.textAlign = 'left';
    if (it.name) {
      font(13, 600);
      ctx.fillStyle = senderColors(it.name)[state.theme === 'dark' ? 0 : 1];
      ctx.fillText(fit(it.name, it.w - 2 * s.padX), x + s.padX, y + s.padY + 13);
    }
    ctx.fillStyle = it.sent ? t.sentText : t.recvText;
    font(s.font, 400);
    const base = y + s.padY + it.textTop + (s.line - s.font) / 2 + s.font * 0.82;
    it.lines.forEach((line, i) => ctx.fillText(line, x + s.padX, base + i * s.line));

    const bottom = y + it.h;
    if (s.meta === 'inside') {
      const color = it.sent ? t.metaSent : t.meta;
      let mx = x + it.w - s.padX + 2;
      const my = bottom - s.padY + 1;
      if (it.sent) {
        drawTicks(app, it.tick, mx - 16, my - 9, color, t, fill);
        mx -= 20;
      }
      font(11, 400);
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(it.time, mx, my);
    } else {
      // LINE: time beside the bubble, with "Read" stacked above it.
      font(10, 400);
      ctx.fillStyle = t.meta;
      if (it.sent) {
        ctx.textAlign = 'right';
        ctx.fillText(it.time, x - 6, bottom - 2);
        if (it.tick === 'read') ctx.fillText('Read', x - 6, bottom - 14);
        if (it.tick === 'failed') drawTicks(app, 'failed', x - 23, bottom - 26, t.meta, t, fill);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(it.time, x + it.w + 6, bottom - 2);
      }
    }
    ctx.textAlign = 'left';
  }

  function drawPill(it, top, t) {
    font(12, 500);
    const w = ctx.measureText(it.text).width + 22;
    const y = top + it.y;
    if (t.pill) {
      ctx.fillStyle = t.pill;
      roundRect((W - w) / 2, y, w, 22, 11);
      ctx.fill();
    }
    ctx.fillStyle = t.pillText;
    ctx.textAlign = 'center';
    ctx.fillText(it.text, W / 2, y + 15.5);
  }

  function drawChatInput(app, s, t) {
    ctx.fillStyle = t.inputBg;
    ctx.fillRect(0, INPUT_TOP, W, H - INPUT_TOP);
    if (t.hairline) {
      ctx.fillStyle = t.hairline;
      ctx.fillRect(0, INPUT_TOP, W, 0.5);
    }
    const cy = INPUT_TOP + 25;
    const ic = t.inputIcon || t.icon;
    let x0, x1;
    if (app === 'line') {
      drawPlus(22, cy, ic);
      drawCamera(56, cy, ic);
      drawPicture(90, cy, ic);
      drawMic(W - 24, cy - 1, ic);
      x0 = 110;
      x1 = W - 46;
    } else {
      drawPlus(24, cy, ic);
      drawCamera(W - 64, cy, ic);
      drawMic(W - 26, cy - 1, ic);
      x0 = 46;
      x1 = W - 88;
    }
    ctx.fillStyle = t.field;
    roundRect(x0, cy - 17, x1 - x0, 34, 17);
    ctx.fill();
    if (t.fieldStroke) {
      ctx.strokeStyle = t.fieldStroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    font(16, 400);
    ctx.fillStyle = t.placeholder;
    ctx.textAlign = 'left';
    ctx.fillText(s.placeholder, x0 + 14, cy + 5.5);

    ctx.fillStyle = t.text;
    roundRect((W - 134) / 2, H - 13, 134, 5, 2.5);
    ctx.fill();
  }

  // ---------- irssi ----------

  function nick(s, fallback) {
    return String(s || '').trim().replace(/\s+/g, '_') || fallback;
  }

  // "9:38" becomes "09:38", the way irssi stamps lines.
  function termTime(s) {
    const m = /^(\d{1,2})[:.](\d{2})/.exec(String(s).trim());
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(s).trim();
  }

  function renderIrssi() {
    const p = TERM[state.theme] || TERM.dark;
    const mono = (weight) => { ctx.font = `${weight} ${TERM_SIZE}px ${TERM_FONT}`; };
    mono(400);
    const cw = ctx.measureText('M').width;
    const pad = 4;
    const cols = Math.floor((W - 2 * pad) / cw);

    // A named sender, or a name starting with #, makes the window a channel.
    const group = isGroup();
    let win = nick(state.name, 'query');
    const channel = group || win.startsWith('#');
    if (channel && !win.startsWith('#')) win = '#' + win;
    const me = nick(state.me, 'you');
    const them = win.replace(/^#+/, '') || 'someone';
    const times = messageTimes();

    // Each row is a list of [text, colour, bold] segments.
    const rows = [];
    state.messages.forEach((m, i) => {
      if (m.kind === 'time') {
        const text = String(m.text).replace(/\s+/g, ' ').trim();
        rows.push([['-', p.fg], ['!', p.blue, true], ['- ', p.fg], [text, p.fg]]);
        return;
      }
      const sent = m.kind === 'sent';
      const who = sent ? me : nick(m.sender, them);
      const head = [[termTime(times[i]) + ' ', p.fg], ['<', p.dim]];
      if (channel) head.push([' ', p.fg]);
      head.push([who, sent ? p.bold : p.fg, sent], ['>', p.dim], [' ', p.fg]);
      let indent = head.reduce((n, seg) => n + Array.from(seg[0]).length, 0);
      if (indent > cols / 2) indent = 6;
      const first = cols - head.reduce((n, seg) => n + Array.from(seg[0]).length, 0);
      const room = Math.max(first, cols - indent);
      // Wrap to the narrower first line, then re-wrap the rest to the indent.
      let lines = wrap(m.text || '', Math.max(first, 1) * cw + 0.5);
      if (first < room && lines.length > 1) {
        const rest = String(m.text || '').slice(lines[0].length).trimStart();
        lines = [lines[0]].concat(wrap(rest, room * cw + 0.5));
      }
      lines.forEach((line, k) => {
        rows.push(k === 0 ? head.concat([[line, p.fg]]) : [[' '.repeat(indent) + line, p.fg]]);
      });
    });

    const total = Math.max(TERM_ROWS, rows.length + 3);
    H = total * TERM_LINE;
    if (canvas.height !== H * SCALE) canvas.height = H * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    const put = (row, segs) => {
      let col = 0;
      for (const [text, color, bold] of segs) {
        mono(bold ? 700 : 400);
        ctx.fillStyle = color;
        // Place cell by cell so bold or fallback glyphs cannot drift off the grid.
        for (const ch of Array.from(text)) {
          if (ch !== ' ') ctx.fillText(ch, pad + col * cw, row * TERM_LINE + 11.5);
          col++;
        }
      }
      return col;
    };
    const bar = (row) => {
      ctx.fillStyle = p.bar;
      ctx.fillRect(0, row * TERM_LINE, W, TERM_LINE);
    };

    bar(0);
    put(0, [[' ' + (channel ? `Topic for ${win}` : win), p.barFg]]);
    rows.forEach((segs, i) => put(i + 1, segs));

    bar(total - 2);
    const br = (text) => [['[', p.barBr], [text, p.barFg], ['] ', p.barBr]];
    put(total - 2, [[' ', p.barFg]].concat(
      br(termTime(state.time)), br(`${me}(+i)`), br(`2:${win}${channel ? '(+nt)' : ''}`)));

    const end = put(total - 1, [[`[${win}] `, p.fg]]);
    ctx.fillStyle = p.fg;
    ctx.fillRect(pad + end * cw, (total - 1) * TERM_LINE + 1, cw, TERM_LINE - 2);
  }

  // ---------- Messages (iMessage and SMS) ----------

  function drawHeader(t, accent) {
    ctx.fillStyle = t.bar;
    ctx.fillRect(0, 0, W, HEADER_BOTTOM);
    ctx.fillStyle = t.hairline;
    ctx.fillRect(0, HEADER_BOTTOM - 0.5, W, 0.5);

    drawStatusBar(t);

    // Back chevron.
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(24, 70);
    ctx.lineTo(14, 81);
    ctx.lineTo(24, 92);
    ctx.stroke();

    // Video call glyph (iMessage only).
    if (state.type === 'imessage') {
      ctx.lineWidth = 1.8;
      roundRect(W - 46, 73, 19, 15, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 25, 78.5);
      ctx.lineTo(W - 17, 74.5);
      ctx.lineTo(W - 17, 86.5);
      ctx.lineTo(W - 25, 82.5);
      ctx.stroke();
    }

    // Avatar: the chosen photo, else a cluster of senders for a group, else initials.
    const cx = W / 2, cy = 78, r = 25;
    const senders = avatarImg ? [] : groupSenders();
    if (avatarImg) {
      drawContact(cx, cy, r);
    } else if (senders.length >= 3) {
      drawPerson(cx, cy - 11, 13, senders[0], senderColors(senders[0]));
      drawPerson(cx - 14, cy + 11, 13, senders[1], senderColors(senders[1]));
      drawPerson(cx + 14, cy + 11, 13, senders[2], senderColors(senders[2]));
    } else if (senders.length === 2) {
      drawPerson(cx - 12, cy - 6, 16, senders[0], senderColors(senders[0]));
      drawPerson(cx + 12, cy + 7, 16, senders[1], senderColors(senders[1]));
    } else {
      drawPerson(cx, cy, r, state.name, [t.avatarA, t.avatarB]);
    }

    // Name with a small disclosure chevron.
    font(11, 400);
    ctx.fillStyle = t.text;
    ctx.textAlign = 'center';
    let name = state.name.trim();
    while (name && ctx.measureText(name).width > 220) name = name.slice(0, -2).trimEnd() + '…';
    ctx.fillText(name, cx - 4, 124);
    const nw = ctx.measureText(name).width;
    ctx.strokeStyle = t.muted;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - 4 + nw / 2 + 4, 116.5);
    ctx.lineTo(cx - 4 + nw / 2 + 7, 120);
    ctx.lineTo(cx - 4 + nw / 2 + 4, 123.5);
    ctx.stroke();
  }

  function drawBubble(it, top, t, accent) {
    const x = it.x;
    const y = top + it.y;
    if (it.avatar !== null) {
      drawPerson(SIDE + 12, y + it.h - 14, 14, it.avatar, senderColors(it.avatar));
    }
    const fill = it.sent ? accent : t.received;
    ctx.fillStyle = fill;
    roundRect(x, y, it.w, it.h, BUBBLE_R);
    ctx.fill();

    if (it.tail) {
      const b = y + it.h;
      const dir = it.sent ? 1 : -1;
      const e = it.sent ? x + it.w : x; // outer edge
      ctx.beginPath();
      ctx.moveTo(e - dir * 17, b - 3);
      ctx.quadraticCurveTo(e - dir * 4, b + 0.5, e + dir * 6, b);
      ctx.quadraticCurveTo(e - dir * 0.5, b - 4, e, b - 16);
      ctx.lineTo(e - dir * 17, b - 16);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = it.sent ? '#ffffff' : t.receivedText;
    font(BUBBLE_FONT, 400);
    ctx.textAlign = 'left';
    it.lines.forEach((line, i) => {
      ctx.fillText(line, x + BUBBLE_PAD_X, y + BUBBLE_PAD_Y + 16.5 + i * BUBBLE_LINE);
    });
  }

  // "Today 9:41" gets a semibold lead, like the system does.
  function drawTimeRow(it, top, t) {
    ctx.fillStyle = t.muted;
    it.lines.forEach((line, i) => {
      const y = top + it.y + 11 + i * 14;
      const m = /^(\D+?)(\s*\d.*)$/.exec(line);
      if (!m) {
        font(11, 400);
        ctx.textAlign = 'center';
        ctx.fillText(line, W / 2, y);
        return;
      }
      font(11, 600);
      const w1 = ctx.measureText(m[1]).width;
      font(11, 400);
      const w2 = ctx.measureText(m[2]).width;
      let x = (W - w1 - w2) / 2;
      ctx.textAlign = 'left';
      font(11, 600);
      ctx.fillText(m[1], x, y);
      font(11, 400);
      ctx.fillText(m[2], x + w1, y);
    });
  }

  function drawReceipt(it, top, t) {
    ctx.textAlign = 'right';
    const y = top + it.y + 11;
    const x = W - SIDE - 2;
    if (state.receipt === 'failed') {
      font(11, 600);
      ctx.fillStyle = t.red;
      ctx.fillText('Not Delivered', x, y);
      return;
    }
    ctx.fillStyle = t.muted;
    if (state.receipt === 'read') {
      const time = state.receiptTime.trim();
      font(11, 400);
      const tw = time ? ctx.measureText(' ' + time).width : 0;
      if (time) ctx.fillText(' ' + time, x, y);
      font(11, 600);
      ctx.fillText('Read', x - tw, y);
    } else {
      font(11, 600);
      ctx.fillText('Delivered', x, y);
    }
  }

  function drawInputBar(t) {
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, INPUT_TOP, W, H - INPUT_TOP);

    // Plus button.
    ctx.fillStyle = t.plusBg;
    ctx.beginPath();
    ctx.arc(31, INPUT_TOP + 25, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = t.plusFg;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, INPUT_TOP + 25);
    ctx.lineTo(38, INPUT_TOP + 25);
    ctx.moveTo(31, INPUT_TOP + 18);
    ctx.lineTo(31, INPUT_TOP + 32);
    ctx.stroke();

    // Text field.
    ctx.strokeStyle = t.field;
    ctx.lineWidth = 1;
    roundRect(58.5, INPUT_TOP + 7.5, W - 58 - 15, 35, 17.5);
    ctx.stroke();
    font(17, 400);
    ctx.fillStyle = t.placeholder;
    ctx.textAlign = 'left';
    ctx.fillText(state.type === 'imessage' ? 'iMessage' : 'Text Message', 72, INPUT_TOP + 31);

    drawMic(W - 33, INPUT_TOP + 24, t.muted);

    // Home indicator.
    ctx.fillStyle = t.text;
    roundRect((W - 134) / 2, H - 13, 134, 5, 2.5);
    ctx.fill();
  }

  function render() {
    const term = state.type === 'irssi';
    W = term ? TERM_W : 390;
    SCALE = term ? TERM_SCALE : 3;
    canvas.classList.toggle('term', term);
    if (canvas.width !== W * SCALE) canvas.width = W * SCALE;
    if (term) {
      renderIrssi();
      return;
    }

    const app = state.type;
    const chat = CHAT[app];
    const t = (chat || THEMES)[state.theme] || (chat || THEMES).light;
    const accent = app === 'sms' ? t.green : t.blue;
    const group = isGroup();

    // The screen grows to fit the whole conversation; nothing scrolls out of view.
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    const top = (chat ? chat.header : HEADER_BOTTOM) + 8;
    const { items, height } = chat ? layoutChat(chat) : layout();
    H = Math.max(MIN_H, Math.ceil(top + height + 8 + INPUT_H));
    INPUT_TOP = H - INPUT_H;
    if (canvas.height !== H * SCALE) canvas.height = H * SCALE; // also resets the context

    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    for (const it of items) {
      if (it.type === 'bubble') {
        if (chat) drawChatBubble(it, top, app, chat, t, group);
        else drawBubble(it, top, t, accent);
      } else if (it.type === 'time') drawTimeRow(it, top, t);
      else if (it.type === 'pill') drawPill(it, top, t);
      else if (it.type === 'sender') {
        font(11, 400);
        ctx.fillStyle = t.nameMuted || t.muted;
        ctx.textAlign = 'left';
        ctx.fillText(it.text, it.x, top + it.y + 11);
      } else drawReceipt(it, top, t);
    }

    if (chat) {
      drawChatHeader(app, chat, t);
      drawChatInput(app, chat, t);
    } else {
      drawHeader(t, accent);
      drawInputBar(t);
    }
  }

  // ---------- editor ----------

  const FIELDS = ['name', 'me', 'type', 'theme', 'receipt', 'receiptTime', 'carrier', 'time', 'conn'];

  function syncForm() {
    for (const id of FIELDS) $(id).value = state[id];
    $('signal').value = state.signal;
    $('battery').value = state.battery;
    $('charging').checked = !!state.charging;
    syncDerived();
  }

  function syncDerived() {
    $('signalOut').textContent = `${state.signal}/4`;
    $('batteryOut').textContent = `${state.battery}%`;
    const messages = state.type === 'imessage' || state.type === 'sms';
    const term = state.type === 'irssi';
    $('receipt').disabled = term;
    $('receiptTime').disabled = !messages || state.receipt !== 'read';
    $('me').disabled = !term;
    $('avatarClear').disabled = !state.avatar;
  }

  function el(tag, props, children) {
    const node = Object.assign(document.createElement(tag), props || {});
    for (const c of children || []) node.append(c);
    return node;
  }

  function buildMessages(focusIndex) {
    const list = $('messages');
    list.replaceChildren();
    state.messages.forEach((m, i) => {
      const kind = el('select', { ariaLabel: 'Kind' }, [
        el('option', { value: 'received', textContent: 'Received' }),
        el('option', { value: 'sent', textContent: 'Sent' }),
        el('option', { value: 'time', textContent: 'Timestamp' }),
      ]);
      kind.value = m.kind;
      kind.addEventListener('change', () => { m.kind = kind.value; buildMessages(); changed(); });
      const kindCell = el('div', { className: 'kind-cell' }, [kind]);
      if (m.kind === 'received') {
        const sender = el('input', {
          type: 'text', maxLength: 30, value: m.sender || '',
          placeholder: 'Sender (group)', ariaLabel: 'Sender name',
          title: 'Name shown above the bubble in a group chat',
        });
        sender.addEventListener('input', () => { m.sender = sender.value; changed(); });
        kindCell.append(sender);
      }
      // Only Messages hides per-message times; the other styles print one on every line.
      if (m.kind !== 'time' && state.type !== 'imessage' && state.type !== 'sms') {
        const time = el('input', {
          type: 'text', maxLength: 12, value: m.time || '',
          placeholder: 'Time', ariaLabel: 'Time',
          title: 'Time shown on this message; blank carries on from the one above',
        });
        time.addEventListener('input', () => { m.time = time.value; changed(); });
        kindCell.append(time);
      }

      const text = el('textarea', { rows: 1, value: m.text, ariaLabel: 'Text' });
      text.placeholder = m.kind === 'time' ? 'Today 9:41' : 'Message';
      const grow = () => { text.style.height = 'auto'; text.style.height = text.scrollHeight + 2 + 'px'; };
      text.addEventListener('input', () => { m.text = text.value; grow(); changed(); });

      const move = (delta) => {
        const j = i + delta;
        if (j < 0 || j >= state.messages.length) return;
        [state.messages[i], state.messages[j]] = [state.messages[j], state.messages[i]];
        buildMessages();
        changed();
      };
      const up = el('button', { type: 'button', textContent: '↑', title: 'Move up', disabled: i === 0 });
      const down = el('button', { type: 'button', textContent: '↓', title: 'Move down', disabled: i === state.messages.length - 1 });
      const del = el('button', { type: 'button', textContent: '✕', title: 'Delete', className: 'danger' });
      up.addEventListener('click', () => move(-1));
      down.addEventListener('click', () => move(1));
      del.addEventListener('click', () => { state.messages.splice(i, 1); buildMessages(); changed(); });

      list.append(el('li', {}, [kindCell, text, el('div', { className: 'row-btns' }, [up, down, del])]));
      grow();
      if (i === focusIndex) text.focus();
    });
  }

  function loadAvatar() {
    avatarImg = null;
    if (!state.avatar) return;
    const img = new Image();
    img.onload = () => { avatarImg = img; render(); };
    img.src = state.avatar;
  }

  // Shrink the picked photo so it fits comfortably in localStorage.
  function pickAvatar(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 192;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      state.avatar = c.toDataURL('image/jpeg', 0.85);
      loadAvatar();
      syncDerived();
      changed();
    };
    img.onerror = () => { URL.revokeObjectURL(url); setStatus('That file is not a readable image.'); };
    img.src = url;
  }

  let statusTimer;
  function setStatus(msg) {
    $('status').textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { $('status').textContent = ''; }, 4000);
  }

  function toBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png');
    });
  }

  function wire() {
    for (const id of FIELDS) {
      $(id).addEventListener('input', () => {
        state[id] = $(id).value;
        if (id === 'type') buildMessages(); // the per-message time field comes and goes
        syncDerived();
        changed();
      });
    }
    for (const id of ['signal', 'battery']) {
      $(id).addEventListener('input', () => { state[id] = Number($(id).value); syncDerived(); changed(); });
    }
    $('charging').addEventListener('change', () => { state.charging = $('charging').checked; changed(); });

    $('avatarPick').addEventListener('click', () => $('avatar').click());
    $('avatar').addEventListener('change', () => { pickAvatar($('avatar').files[0]); $('avatar').value = ''; });
    $('avatarClear').addEventListener('click', () => {
      state.avatar = null;
      loadAvatar();
      syncDerived();
      changed();
    });

    document.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.add;
        state.messages.push({ kind, text: kind === 'time' ? `Today ${state.time}` : '' });
        buildMessages(state.messages.length - 1);
        changed();
      });
    });

    $('download').addEventListener('click', async () => {
      try {
        const url = URL.createObjectURL(await toBlob());
        const a = el('a', { href: url, download: 'messages.png' });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        setStatus('Could not export the image.');
      }
    });

    const copy = $('copy');
    if (!(navigator.clipboard && window.ClipboardItem)) {
      copy.hidden = true;
    } else {
      copy.addEventListener('click', async () => {
        try {
          // Pass the promise so Safari keeps the user-gesture permission.
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob() })]);
          setStatus('Copied.');
        } catch (e) {
          setStatus('Copy was blocked by the browser; use Download instead.');
        }
      });
    }

    $('reset').addEventListener('click', () => {
      if (!window.confirm('Discard this conversation and restore the example?')) return;
      state = structuredCloneSafe(DEFAULTS);
      loadAvatar();
      syncForm();
      buildMessages();
      changed();
    });
  }

  syncForm();
  buildMessages();
  wire();
  loadAvatar();
  render();
})();
