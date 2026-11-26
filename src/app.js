/* Rain Check! page logic: relay connection, TV screen, phone controller. */
(function () {
  var qs = {};
  location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) { qs[kv.substring(0, i)] = decodeURIComponent(kv.substring(i + 1)); } });
  function codeOf(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4); }
  var ROOM = codeOf(qs.screen || qs.r);
  var ROLE = (qs.screen && ROOM.length === 4) ? 'screen' : ((qs.r && ROOM.length === 4) ? 'play' : 'home');
  var app = document.getElementById('app');
  var C = RC.content;
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var HERE = location.protocol + '//' + location.host + location.pathname;
  var SHORT = (location.host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, '');

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { } }
  function rid(n) { var s = ''; for (var i = 0; i < n; i++) { s += 'abcdefghjkmnpqrstuvwxyz23456789'.charAt(Math.floor(Math.random() * 31)); } return s; }
  function closest(el, attr) { while (el && el !== document) { if (el.getAttribute && el.getAttribute(attr) != null) { return el; } el = el.parentNode; } return null; }
  var cache = {};
  function put(id, html) { if (cache[id] === html) { return false; } var el = document.getElementById(id); if (!el) { return false; } cache[id] = html; el.innerHTML = html; return true; }

  /* ---------------- relay (public MQTT brokers over secure websockets) ---------------- */
  var BROKERS = [
    { h: 'broker.emqx.io', p: 8084, path: '/mqtt', ssl: true },
    { h: 'mqtt.eclipseprojects.io', p: 443, path: '/mqtt', ssl: true },
    { h: 'broker.hivemq.com', p: 8884, path: '/mqtt', ssl: true },
    { h: 'test.mosquitto.org', p: 8081, path: '/mqtt', ssl: true }
  ];
  if (qs.relay) { var rp = qs.relay.split(':'); BROKERS = [{ h: rp[0], p: parseInt(rp[1], 10) || 80, path: '/', ssl: false }]; }
  var net = { conns: [], up: 0, onUp: null };
  function netStart(room, sub, onMsg) {
    var base = 'raincheck1/' + room + '/';
    net.base = base;
    BROKERS.forEach(function (b, idx) {
      var c = { up: false, client: null, timer: null, open: null };
      net.conns.push(c);
      function retry(ms) { if (c.timer) { return; } c.timer = setTimeout(function () { c.timer = null; open(); }, ms); }
      function open() {
        var cl;
        try { cl = new Paho.Client(b.h, b.p, b.path, 'rc' + rid(10)); } catch (e) { return; }
        c.client = cl;
        cl.onConnectionLost = function () { if (c.client !== cl) { return; } c.up = false; count(); retry(2500); };
        cl.onMessageArrived = function (m) { try { onMsg(m.destinationName.substring(base.length), m.payloadString); } catch (e) { if (window.console) { console.error(e); } } };
        try {
          cl.connect({
            useSSL: b.ssl, timeout: 8, keepAliveInterval: 25, cleanSession: true, mqttVersion: 4,
            onSuccess: function () { c.up = true; try { cl.subscribe(base + sub); } catch (e) { } count(); if (net.onUp) { net.onUp(); } },
            onFailure: function () { if (c.client !== cl) { return; } c.up = false; count(); retry(5000 + idx * 500); }
          });
        } catch (e) { retry(6000); }
      }
      c.open = open;
      open();
    });
    function count() { var n = 0; net.conns.forEach(function (c) { if (c.up) { n++; } }); net.up = n; if (net.onCount) { net.onCount(); } }
    net.count = count;
  }
  /* Drop every relay connection and dial again. Used when a connection looks alive but nothing arrives,
     which is what happens after a phone's browser was in the background. */
  function netKick() {
    net.conns.forEach(function (c) {
      var old = c.client; c.client = null; c.up = false;
      if (c.timer) { clearTimeout(c.timer); c.timer = null; }
      try { if (old) { old.disconnect(); } } catch (e) { }
      if (c.open) { c.open(); }
    });
    if (net.count) { net.count(); }
  }
  function netSend(topic, str, retained) {
    net.conns.forEach(function (c) {
      if (!c.up) { return; }
      try { var m = new Paho.Message(str); m.destinationName = net.base + topic; m.qos = 0; m.retained = !!retained; c.client.send(m); } catch (e) { }
    });
  }
  function dotsHtml() { var s = '<span class="dots">'; net.conns.forEach(function (c) { s += '<i class="' + (c.up ? 'on' : '') + '"></i>'; }); return s + '</span>'; }

  /* ---------------- shared ---------------- */
  var VERSION = 2;         // must match the engine's state version
  var S = null;            // latest public state
  var clockOff = 0;        // my clock minus the TV's clock
  function hnow() { var n = Date.now() - clockOff; if (S && S.paused && S.pat) { return S.pat; } return n; }
  function tname(t) { return S.teams[t] ? S.teams[t].name : ''; }
  function gameTitle(key) { for (var i = 0; i < C.rounds.length; i++) { if (C.rounds[i].key === key) { return C.rounds[i].title; } } return key; }
  function rankList() { var out = []; S.order.forEach(function (id) { var p = S.players[id]; if (p) { out.push({ p: id, n: p.n, pts: p.pts, t: p.t }); } }); out.sort(function (a, b) { return b.pts - a.pts; }); return out; }
  function pname(pid) { return pid && S.players[pid] ? S.players[pid].n : 'Someone'; }
  function pteam(pid) { return pid && S.players[pid] ? S.players[pid].t : 0; }
  function timerHtml(len) { return S.deadline ? '<div class="timer"><i data-dl="' + S.deadline + '" data-len="' + len + '"></i></div>' : ''; }

  function tickUI() {
    if (!S) { return; }
    window.RCS = S;
    var now = hnow(), i, el, els;
    els = document.querySelectorAll('[data-dl]');
    for (i = 0; i < els.length; i++) { el = els[i]; var dl = +el.getAttribute('data-dl'), len = +el.getAttribute('data-len') || 1; el.style.width = Math.max(0, Math.min(100, 100 * (dl - now) / len)) + '%'; }
    els = document.querySelectorAll('[data-open]');
    for (i = 0; i < els.length; i++) {
      el = els[i]; var open = now >= +el.getAttribute('data-open');
      var on = el.getAttribute('data-on'), off = el.getAttribute('data-off');
      if (open && el.className.indexOf('isopen') < 0) { el.className = el.className.replace(' wait', '') + ' isopen' + (el.getAttribute('data-go') ? ' go' : ''); if (on) { el.innerHTML = on; } }
      else if (!open && off && el.innerHTML !== off) { el.innerHTML = off; }
    }
    el = document.getElementById('zimg');
    if (el && S.z) {
      var f = S.zfrozen != null ? S.zfrozen : Math.max(0, Math.min(1, (now - S.zt0) / S.zdur));
      if (S.phase === 'zoom_reveal') { f = 1; }
      if (S.z.mode === 'zoom') {
        var sc = Math.pow(11, 1 - f);
        var tr = 'scale(' + sc.toFixed(3) + ')';
        el.style.webkitTransformOrigin = el.style.transformOrigin = S.z.fx + '% ' + S.z.fy + '%';
        el.style.webkitTransform = el.style.transform = tr;
      } else {
        var total = 40, showN = S.phase === 'zoom_reveal' ? total : Math.floor(f * total * 0.8);
        var tiles = document.querySelectorAll('.zt');
        for (i = 0; i < tiles.length; i++) { tiles[i].style.display = (+tiles[i].getAttribute('data-ord') < showN) ? 'none' : 'block'; }
      }
      var zv = document.getElementById('zval');
      if (zv) { zv.innerHTML = String(S.phase === 'zoom_q' ? Math.max(100, Math.round((500 - 400 * f) / 10) * 10) : (S.zval || '')); }
    }
  }

  /* ================================================================== */
  /* HOME                                                               */
  /* ================================================================== */
  function home() {
    app.innerHTML = '<div class="home"><h1>Rain Check!</h1><p>The family game show for rainy days.</p>' +
      '<button class="big red" data-a="tv" autofocus>This is the TV screen</button>' +
      '<p style="margin-top:26px">Playing on a phone?</p>' +
      '<input class="field" id="code" maxlength="4" placeholder="ROOM CODE" autocapitalize="characters" autocomplete="off">' +
      '<button class="big" data-a="joinhome">Join the game</button>' +
      '<p class="note">Open this page on the TV first. The TV shows a QR code and a 4-letter room code for the phones.</p></div>';
    app.addEventListener('click', function (e) {
      var b = closest(e.target, 'data-a'); if (!b) { return; }
      var a = b.getAttribute('data-a');
      if (a === 'tv') { var code = ''; for (var i = 0; i < 4; i++) { code += 'ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 24)); } location.href = HERE + '?screen=' + code + (qs.relay ? '&relay=' + qs.relay : ''); }
      if (a === 'joinhome') { var c = codeOf(document.getElementById('code').value); if (c.length === 4) { location.href = HERE + '?r=' + c + (qs.relay ? '&relay=' + qs.relay : ''); } }
    });
    try { app.querySelector('[autofocus]').focus(); } catch (e) { }
  }

  /* ================================================================== */
  /* TV SCREEN (also runs the game engine)                              */
  /* ================================================================== */
  function screen() {
    var E = RC.createEngine(C);
    var saved = lsGet('rc_host_' + ROOM);
    if (!(saved && E.load(saved) && E.state().room === ROOM && E.state().v === VERSION)) { E.init(ROOM, Date.now()); } // a room saved by an older version starts fresh
    S = E.state();
    var seen = {}, seenList = [], dirty = true, lastPub = 0, lastSeq = 0, lastIn = Date.now(), lastKick = 0;
    var unlocked = false, soundOn = true, menuOpen = false, lastSay = S.say.id, lastFx = S.fx.id, talkTimer = null, lastX = S.f ? S.f.x : 0;
    var qrSvg = '';
    try { var qr = qrcode(0, 'M'); qr.addData(HERE + '?r=' + ROOM + (qs.relay ? '&relay=' + qs.relay : '')); qr.make(); qrSvg = qr.createSvgTag(6, 12); } catch (e) { }

    var bulbs = '<div class="bulbs">'; for (var bi = 0; bi < 24; bi++) { bulbs += '<i></i>'; } bulbs += '</div>';
    var rays = '<svg class="rays" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none"><path fill="#4A2D1B" d="M640 300L-200 -40H80ZM640 300L300 -200H520ZM640 300L760 -200H980ZM640 300L1200 -40H1480ZM640 300L1500 260V480ZM640 300L1400 800H1120ZM640 300L840 900H560ZM640 300L160 800H-120ZM640 300L-220 480V260Z"/></svg>';
    app.innerHTML = '<div class="scr">' + rays + '<div class="top" id="top"></div><div class="stagewrap"><div class="frame">' + bulbs + '<div class="stage" id="stage"></div>' + bulbs + '</div></div>' +
      '<div class="stripes"><i class="s0"></i><i class="s1"></i><i class="s2"></i></div>' +
      '<div class="foot"><div class="host" id="host">' + RC.art.host + '</div><div class="bubble" id="bubble"></div><div class="joinbox" id="joinbox"></div></div>' +
      '<button class="menubtn" data-a="s_menu">Menu</button><div id="menu"></div><div id="pausel"></div><div id="xl"></div>' +
      '<div class="overlay" id="ov"><h1>Rain Check!</h1><p>The family game show for rainy days</p><button data-a="s_unlock" id="ovb">Press OK to open the show</button></div></div>';
    try { document.getElementById('ovb').focus(); } catch (e) { }

    function publish() {
      dirty = false; lastPub = Date.now();
      S = E.state();
      S.now = Date.now(); lastSeq = Math.max(lastSeq + 1, S.now); S.seq = lastSeq;
      var json = JSON.stringify(S);
      netSend('state', json, true);
      lsSet('rc_host_' + ROOM, E.dump());
      render();
    }
    netStart(ROOM, 'in', function (topic, str) {
      if (topic !== 'in') { return; }
      var m = JSON.parse(str);
      if (!m || !m.i || seen[m.i]) { return; }
      seen[m.i] = 1; seenList.push(m.i); if (seenList.length > 800) { delete seen[seenList.shift()]; }
      lastIn = Date.now();
      E.handle(m, Date.now()); dirty = true;
    });
    net.onUp = function () { dirty = true; };
    net.onCount = function () { cache.joinbox = null; render(); };
    setInterval(function () {
      var now = Date.now();
      if (E.tick(now)) { dirty = true; }
      if (dirty || now - lastPub > 2000) { publish(); }
      // phones say hello every 4 seconds; long silence with players in the room means our own connections went stale
      if (S.order.length && now - lastIn > 15000 && now - lastKick > 15000) { lastKick = now; netKick(); }
      tickUI();
    }, 100);
    /* Optional live judge for Crillion. Off unless content.js sets judgeUrl. The TV asks it about answers that
       are not on the sheet; if it does not answer in time, the showrunner decides on their phone as usual. */
    var judgedK = '';
    function askJudge() {
      if (!C.judgeUrl || S.phase !== 'cr_judge' || judgedK === S.k) { return; }
      judgedK = S.k;
      var k = S.k, asks = [];
      S.cr.rows.forEach(function (r) { if (r.st === 'ask') { asks.push({ p: r.p, text: r.text }); } });
      try {
        var x = new XMLHttpRequest();
        x.open('POST', C.judgeUrl, true); x.timeout = 20000;
        x.setRequestHeader('Content-Type', 'application/json');
        x.onload = function () {
          if (S.k !== k || x.status !== 200) { return; }
          try {
            var res = JSON.parse(x.responseText).results || [];
            res.forEach(function (j) { if (j && S.k === k) { E.cmd('crj', { p: j.p, ok: !!j.ok, said: j.said, why: j.why, by: 'the AI judge' }, Date.now()); } });
            dirty = true;
          } catch (e) { }
        };
        x.send(JSON.stringify({ room: ROOM, question: S.cr.text, answers: asks }));
      } catch (e) { }
    }
    setInterval(askJudge, 500);
    function wake() { if (!document.hidden && Date.now() - lastIn > 6000 && S.order.length) { lastKick = Date.now(); netKick(); } }
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', function () { lastKick = Date.now(); netKick(); });

    /* sound */
    var actx = null, voice = null;
    function tone(freq, start, dur, type, vol) {
      if (!actx || !soundOn) { return; }
      try {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.18;
        o.connect(g); g.connect(actx.destination);
        var t = actx.currentTime + start; o.start(t); g.gain.setValueAtTime(vol || 0.18, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.stop(t + dur + 0.02);
      } catch (e) { }
    }
    function sfx(name) {
      if (name === 'buzz') { tone(190, 0, 0.45, 'square', 0.22); }
      else if (name === 'right') { tone(660, 0, 0.14); tone(880, 0.14, 0.14); tone(1320, 0.28, 0.3); }
      else if (name === 'wrong') { tone(160, 0, 0.6, 'sawtooth', 0.2); }
      else if (name === 'strike') { tone(120, 0, 0.25, 'square', 0.25); tone(100, 0.3, 0.45, 'square', 0.25); }
      else if (name === 'ding') { tone(990, 0, 0.12); tone(1320, 0.1, 0.25); }
      else if (name === 'join') { tone(520, 0, 0.1); tone(780, 0.1, 0.12); }
      else if (name === 'fanfare') { tone(523, 0, 0.16); tone(659, 0.16, 0.16); tone(784, 0.32, 0.16); tone(1047, 0.48, 0.4); }
      else if (name === 'win') { [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * 0.17, 0.3); }); }
    }
    function pickVoice() {
      try {
        var vs = window.speechSynthesis.getVoices(), best = null;
        for (var i = 0; i < vs.length; i++) { if (/^en/i.test(vs[i].lang)) { if (!best) { best = vs[i]; } if (/en[-_]US/i.test(vs[i].lang) && /male|david|daniel|alex|fred|guy|aaron/i.test(vs[i].name)) { best = vs[i]; break; } } }
        voice = best;
      } catch (e) { }
    }
    function speak(text) {
      var host = document.getElementById('host');
      if (host) { host.className = 'host talk'; }
      if (talkTimer) { clearTimeout(talkTimer); }
      talkTimer = setTimeout(function () { if (host) { host.className = 'host'; } }, Math.min(9000, 900 + text.length * 60));
      if (!unlocked || !soundOn || !window.speechSynthesis || !window.SpeechSynthesisUtterance) { return; }
      try {
        window.speechSynthesis.cancel();
        var u = new window.SpeechSynthesisUtterance(text);
        u.rate = 1.05; u.pitch = 1.05; u.lang = 'en-US'; if (voice) { u.voice = voice; }
        window.speechSynthesis.speak(u);
      } catch (e) { }
    }

    /* drawing */
    function topHtml() {
      var sub = S.phase === 'lobby' ? 'Join on your phone' : (S.phase === 'menu' ? 'Pick a game' : (S.phase === 'final' ? 'Final score' : 'Game ' + S.round + ' &middot; ' + esc(S.rt || '')));
      function tm(t) { var ctrl = (S.turn && pteam(S.turn) === t) ? ' ctrl' : ''; return '<div class="tm t' + t + ctrl + '"><div class="tn">' + esc(tname(t)) + '</div><div class="ts">' + S.teams[t].score + '</div></div>'; }
      if (S.solo) { // no teams: the top bar shows who is first and second
        var rk = rankList();
        var sp = function (i, t) { var r = rk[i]; return '<div class="tm t' + t + (r && S.turn === r.p ? ' ctrl' : '') + '"><div class="tn">' + (r ? (i + 1) + '. ' + esc(r.n) : (i ? '2nd place' : '1st place')) + '</div><div class="ts">' + (r ? r.pts : 0) + '</div></div>'; };
        return sp(0, 0) + '<div class="mid"><div class="logo">Rain Check!</div><div class="sub">' + sub + '</div></div>' + sp(1, 1);
      }
      return tm(0) + '<div class="mid"><div class="logo">Rain Check!</div><div class="sub">' + sub + '</div></div>' + tm(1);
    }
    function who(pid) { return '<span class="t' + (S.solo ? 0 : pteam(pid)) + 'c">' + esc(pname(pid)) + '</span>'; }
    function gainsHtml(rv) { // what a round just paid out: per team, or a head count in solo play
      if (S.solo) { return (rv.nok || 0) + (rv.nok === 1 ? ' player scores' : ' players score'); }
      return '<span class="t0c">' + esc(tname(0)) + ' +' + rv.gains[0] + '</span> &nbsp; <span class="t1c">' + esc(tname(1)) + ' +' + rv.gains[1] + '</span>';
    }
    function ranksHtml(max) { // every player's own points, best first
      var rk = rankList(), h = '<div class="ranks">';
      for (var i = 0; i < rk.length && i < max; i++) { h += '<div class="rk"><b>' + (i + 1) + '</b><span class="t' + (S.solo ? (i === 0 ? 0 : 1) : rk[i].t) + 'c">' + esc(rk[i].n) + '</span><i>' + rk[i].pts + '</i></div>'; }
      return h + '</div>';
    }
    function lobbyHtml() {
      var cols = ['', ''], nth = 0;
      S.order.forEach(function (pid) { var p = S.players[pid]; if (!p) { return; } cols[S.solo ? (nth++ % 2) : p.t] += '<div class="chip' + ((Date.now() - p.seen) > 30000 ? ' off' : '') + '">' + esc(p.n) + (pid === S.boss ? ' <small>RUNS THE SHOW</small>' : '') + '</div>'; });
      return '<div class="lobby"><div class="qr">' + qrSvg + '<div class="url">' + esc(SHORT) + '</div><div class="code">' + ROOM + '</div></div>' +
        '<div class="teams"><div class="col t0"><h3>' + (S.solo ? 'Players' : esc(tname(0))) + '</h3>' + cols[0] + '</div><div class="col t1"><h3>' + (S.solo ? 'No teams' : esc(tname(1))) + '</h3>' + cols[1] + '</div></div></div><div class="lineup">' + (S.boss ? '<b>' + esc(pname(S.boss)) + '</b> runs the show. Tap a game on that phone to start.' : 'The first player to join runs the show.') + '</div>';
    }
    function gmenuHtml() {
      var h = '<div class="h2">Pick a game</div><div class="gmenu">';
      for (var i = 0; i < C.order.length; i++) { var k = C.order[i], n = S.played[k] || 0; h += '<button class="gtile' + (n ? ' done' : '') + '" data-a="s_game" data-v="' + k + '">' + esc(gameTitle(k)) + (n ? '<small>played</small>' : '') + '</button>'; }
      return h + '</div><div class="lineup">' + (S.boss ? '<b>' + esc(pname(S.boss)) + '</b> picks on the phone' : 'Pick here') + (S.short ? ' &middot; short rounds' : '') + ' &middot; ' + S.round + ' played so far</div>';
    }
    function waitHtml() { // names of players who are here but have not answered yet
      var miss = [], now = S.now || Date.now();
      for (var i = 0; i < S.order.length; i++) { var p = S.players[S.order[i]]; if (p && now - p.seen < 30000 && !S.acted[S.order[i]]) { miss.push(p.n); } }
      return S.nv + ' answered' + (miss.length && miss.length <= 4 ? '. Waiting for ' + esc(miss.join(', ')) : '');
    }
    function voteHtml() {
      var q = S.q, rv = S.phase === 'vote_reveal' ? S.rv : null, h = '<div class="tag">Question ' + q.n + ' of ' + q.of + '</div><div class="h2">' + esc(q.text) + '</div><div class="opts">';
      for (var i = 0; i < q.o.length; i++) { h += '<div class="opt o' + i + (rv ? (rv.a === i ? ' win' : ' dim') : '') + '"><span class="l">' + 'ABCD'.charAt(i) + '</span>' + esc(q.o[i]) + (rv ? '<span class="n">' + rv.counts[i] + '</span>' : '') + '</div>'; }
      h += '</div>';
      if (rv) { h += '<div class="status">' + gainsHtml(rv) + (rv.fast ? ' &nbsp; Fastest: ' + esc(rv.fast) : '') + '</div>'; }
      else { h += '<div class="status">' + waitHtml() + '</div>' + timerHtml(q.kind === 'tf' ? 16000 : 26000); }
      return h;
    }
    function boardHtml() {
      var h = '<div class="board">';
      for (var c = 0; c < S.board.cats.length; c++) {
        h += '<div class="bcol"><div class="bhead">' + esc(S.board.cats[c]) + '</div>';
        for (var l = 0; l < 4; l++) { h += '<div class="bcell' + (S.board.used[c][l] ? ' used' : '') + '">' + ((l + 1) * 100) + '</div>'; }
        h += '</div>';
      }
      return h + '</div><div class="status">' + who(S.turn) + ' is picking</div>' + timerHtml(20000);
    }
    function clueHtml() {
      var q = S.q, h = '<div class="tag">' + esc(q.cat) + ' &middot; ' + q.val + '</div><div class="clue">' + esc(q.text) + '</div>';
      if (S.phase === 'board_q') {
        var who2 = S.steal ? esc(S.stealWho || 'Anyone else') + ' can steal. BUZZ!' : 'BUZZ NOW!';
        h += '<div class="status wait" data-open="' + S.openAt + '" data-go="1" data-on="' + who2 + '" data-off="Get ready...">Get ready...</div>' + timerHtml(12000);
      } else if (S.phase === 'board_ans') { h += '<div class="status">' + who(S.turn) + ' is answering</div>' + timerHtml(11000); }
      else { h += '<div class="answer">' + esc(S.rv.text) + '</div><div class="status">' + (S.rv.who ? '<span class="t' + S.rv.team + 'c">' + esc(S.rv.who) + '</span> +' + S.rv.val : 'No points') + '</div>'; }
      return h;
    }
    function zoomHtml() {
      var z = S.z, tiles = '';
      if (z.mode === 'tiles') {
        var ord = [], i, s = z.seed || 1;
        for (i = 0; i < 40; i++) { ord.push(i); }
        for (i = 39; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)); var t = ord[i]; ord[i] = ord[j]; ord[j] = t; }
        for (i = 0; i < 40; i++) { var pos = ord[i]; tiles += '<div class="zt" data-ord="' + i + '" style="left:' + (pos % 8) * 12.5 + '%;top:' + Math.floor(pos / 8) * 20 + '%;width:12.5%;height:20%"></div>'; }
      }
      var side;
      if (S.phase === 'zoom_reveal') { side = '<div class="answer">' + esc(S.rv.text) + '</div><div class="status">' + (S.rv.who ? '<span class="t' + S.rv.team + 'c">' + esc(S.rv.who) + '</span> +' + S.rv.val : 'No points') + '</div>'; }
      else if (S.phase === 'zoom_ans') { side = '<div class="tag yel">Worth</div><div class="zval" id="zval"></div><div class="status">' + who(S.turn) + ' is answering</div>'; }
      else { side = '<div class="tag yel">Worth</div><div class="zval" id="zval"></div><div class="status wait" data-open="' + S.openAt + '" data-go="1" data-on="BUZZ when you know!" data-off="Get ready...">Get ready...</div>'; }
      return '<div class="zwrap"><div class="zf" data-img="' + z.img + z.n + '"><div class="zi" id="zimg">' + RC.art[z.img] + '</div>' + tiles + '</div><div class="zside"><div class="tag">Picture ' + z.n + ' of ' + z.of + '</div><br>' + side + '</div></div>';
    }
    function phraseHtml() {
      var m = S.ph.mask, h = '<div class="tag">Puzzle ' + S.ph.n + ' of ' + S.ph.of + ' &middot; Hint: ' + esc(S.ph.hint) + '</div><div class="phrase"><span class="word">';
      for (var i = 0; i < m.length; i++) {
        var ch = m[i];
        if (ch === ' ') { h += '</span> <span class="word">'; }
        else if (ch === '_') { h += '<span class="lt">&nbsp;</span>'; }
        else if (LETTERS.indexOf(ch) < 0) { h += '<span class="lt p">' + esc(ch) + '</span>'; }
        else { h += '<span class="lt' + (S.last && S.last.l === ch && S.phase !== 'phrase_reveal' ? ' new' : '') + '">' + ch + '</span>'; }
      }
      h += '</span></div>';
      if (S.phase === 'phrase_reveal') { return h + '<div class="status">' + (S.rv.how === 'bust' ? 'Five misses. Nobody gets it.' : 'Solved by ' + esc(S.rv.who) + '!') + '</div>'; }
      var miss = '<div class="miss">Misses ';
      for (var k = 0; k < 5; k++) { miss += '<i class="' + (k < S.miss ? 'x' : '') + '">' + (k < S.miss ? 'X' : '') + '</i>'; }
      h += '<div class="used">Used: ' + (S.used ? esc(S.used.split('').join(' ')) : 'none yet') + '</div>' + miss + '</div>';
      if (S.phase === 'phrase_solve') { h += '<div class="status go">' + who(S.solver) + ' is solving...</div>' + timerHtml(25000); }
      else {
        var lastTxt = '';
        if (S.last && S.last.l) { lastTxt = S.last.n ? esc(S.last.who) + ' found ' + S.last.n + ' ' + S.last.l + (S.last.n > 1 ? "'s" : '') + '. ' : 'No ' + S.last.l + '. '; }
        else if (S.last && S.last.who) { lastTxt = esc(S.last.who) + ' guessed wrong. '; }
        h += '<div class="status">' + lastTxt + who(S.turn) + ', pick a letter</div>' + timerHtml(22000);
      }
      return h;
    }
    function feudHtml() {
      var f = S.f, h = '<div class="tag' + (f.mult > 1 ? ' red' : '') + '">Survey ' + f.n + ' of ' + f.of + (f.mult > 1 ? ' &middot; DOUBLE POINTS' : '') + '</div><div class="h2">' + esc(f.q) + '</div><div class="fwrap"><div class="slots">';
      for (var i = 0; i < 5; i++) {
        var s = f.slots[i];
        h += s ? '<div class="slot shown' + (s.hit ? '' : ' missed') + '"><span class="no">' + (i + 1) + '</span>' + esc(s.text) + '<span class="vt">' + s.votes + ' said this</span><span class="pt">' + s.pts + '</span></div>' : '<div class="slot"><span class="no">' + (i + 1) + '</span></div>';
      }
      h += '</div><div class="fside"><div class="strikes">';
      for (var k = 0; k < 3; k++) { h += '<b class="' + (k < f.strikes ? 'x' : '') + '">X</b>'; }
      h += '</div><div class="tag yel">Pot</div><div class="pot">' + f.pot + '</div>';
      if (S.phase === 'feud_face') { h += '<div class="status wait" data-open="' + S.openAt + '" data-go="1" data-on="BUZZ NOW!" data-off="Get ready...">Get ready...</div>'; }
      else if (S.phase === 'feud_pick') { h += '<div class="status">' + (f.mode === 'steal' ? 'STEAL: ' : '') + who(S.turn) + ' is choosing</div>'; }
      else { h += '<div class="status">' + (S.rv.solo ? 'Board finished' : (S.rv.team >= 0 ? '<span class="t' + S.rv.team + 'c">' + esc(tname(S.rv.team)) + '</span> +' + S.rv.pot : 'No points')) + '</div>'; }
      return h + '</div></div>' + (S.phase === 'feud_pick' ? timerHtml(f.mode === 'steal' ? 25000 : (f.mode === 'face' ? 14000 : 18000)) : '');
    }
    function barsHtml() {
      var max = Math.max(1, S.teams[0].score, S.teams[1].score), h = '<div class="bars">';
      for (var t = 0; t < 2; t++) { h += '<div class="bar"><div class="bn t' + t + 'c">' + esc(tname(t)) + '</div><div class="bt"><div class="bf t' + t + '" style="width:' + Math.max(8, Math.round(100 * S.teams[t].score / max)) + '%">' + S.teams[t].score + '</div></div></div>'; }
      return h + '</div>';
    }
    function stageHtml() {
      var ph = S.phase;
      if (ph === 'lobby') { return lobbyHtml(); }
      if (ph === 'menu') { return gmenuHtml(); }
      if (ph === 'intro') { var how = ''; S.intro.how.forEach(function (x) { how += '<div>' + esc(x) + '</div>'; }); return '<div class="tag red">Game ' + S.intro.n + '</div><div class="h1">' + esc(S.intro.title) + '</div><div class="how">' + how + '</div>' + timerHtml(14000); }
      if (ph === 'vote_q' || ph === 'vote_reveal') { return voteHtml(); }
      if (ph === 'ml_q') { return '<div class="tag">Question ' + S.ml.n + ' of ' + S.ml.of + '</div><div class="h2">' + esc(S.ml.text) + '</div><div class="status">Vote on your phone. ' + waitHtml() + '</div>' + timerHtml(26000); }
      if (ph === 'ml_reveal') {
        var tl = ''; S.rv.top.forEach(function (x) { tl += (tl ? ', ' : '') + esc(x.n) + ' ' + x.c; });
        return '<div class="h2">' + esc(S.ml.text) + '</div><div class="answer">' + (S.rv.win.length ? esc(S.rv.win.join(' and ')) : 'No votes') + '</div><div class="tally">' + tl + '</div>' +
          '<div class="status">' + gainsHtml(S.rv) + '</div>';
      }
      if (ph === 'num_q') { return '<div class="tag">Question ' + S.nm.n + ' of ' + S.nm.of + '</div><div class="h2">' + esc(S.nm.text) + '</div><div class="status">Type your best guess. ' + waitHtml() + '</div>' + timerHtml(30000); }
      if (ph === 'num_reveal') {
        var nl = ''; S.rv.list.forEach(function (x) { nl += (nl ? ', ' : '') + '<span class="t' + x.t + 'c">' + esc(x.n) + '</span> ' + esc(x.v); });
        return '<div class="h2">' + esc(S.nm.text) + '</div><div class="answer">' + esc(S.rv.a) + '</div><div class="tally">' + nl + '</div>' +
          '<div class="status">' + (S.rv.who ? (S.rv.exact ? 'Exactly right: ' : 'Closest: ') + '<span class="t' + S.rv.team + 'c">' + esc(S.rv.who) + '</span> +' + S.rv.pts : 'No guesses') + '</div>';
      }
      if (ph === 'scr_q' || ph === 'scr_reveal') {
        var letters = ph === 'scr_q' ? S.ws.mix : S.rv.text, lh = '';
        for (var li = 0; li < letters.length; li++) { lh += '<span class="lt xl' + (ph === 'scr_reveal' ? ' new' : '') + '">' + letters.charAt(li) + '</span>'; }
        var done = S.ws.done.length ? 'Solved: ' + esc(S.ws.done.join(', ')) : 'Type the word on your phone';
        return '<div class="tag">Word ' + S.ws.n + ' of ' + S.ws.of + ' &middot; Hint: ' + esc(S.ws.hint) + '</div><div class="phrase"><span class="word">' + lh + '</span></div><div class="status">' + (ph === 'scr_reveal' && !S.ws.done.length ? 'Nobody got it' : done) + '</div>' + (ph === 'scr_q' ? timerHtml(35000) : '');
      }
      if (ph === 'board_pick') { return boardHtml(); }
      if (ph === 'board_q' || ph === 'board_ans' || ph === 'board_reveal') { return clueHtml(); }
      if (ph === 'zoom_q' || ph === 'zoom_ans' || ph === 'zoom_reveal') { return zoomHtml(); }
      if (ph === 'phrase_turn' || ph === 'phrase_solve' || ph === 'phrase_reveal') { return phraseHtml(); }
      if (ph === 'feud_face' || ph === 'feud_pick' || ph === 'feud_reveal') { return feudHtml(); }
      if (ph === 'cr_q') { return '<div class="tag">Question ' + S.cr.n + ' of ' + S.cr.of + '</div><div class="h2">' + esc(S.cr.text) + '</div><div class="status">Type one answer. Obscure is good. ' + waitHtml() + '</div>' + timerHtml(46000); }
      if (ph === 'cr_judge' || ph === 'cr_reveal') {
        var rows = S.cr.rows, two = rows.length > 6, ch = '<div class="h2">' + esc(S.cr.text) + '</div><div class="crl' + (two ? ' two' : '') + '">';
        for (var ci = 0; ci < rows.length && ci < 12; ci++) {
          var r = rows[ci], right;
          if (r.st === 'ask') { right = '<i class="ask">judge?</i>'; }
          else if (ph === 'cr_judge') { right = '<i class="ask">...</i>'; }
          else if (r.st === 'ok') { right = '<small>' + r.said + ' of 100</small><i>' + r.pts + '</i>'; }
          else { right = '<small>' + esc(r.why || 'not accepted') + '</small><i class="bad">0</i>'; }
          ch += '<div class="crr' + (ph === 'cr_reveal' && r.st !== 'ok' ? ' out' : '') + '"><span class="t' + (S.solo ? 1 : r.t) + 'c">' + esc(r.n) + '</span><b>' + esc(ph === 'cr_reveal' && r.st === 'ok' ? r.name : r.text) + '</b>' + right + '</div>';
        }
        ch += '</div>';
        if (ph === 'cr_judge') { return ch + '<div class="status go">The judge is deciding</div>' + timerHtml(45000); }
        return ch + '<div class="status">' + (S.rv.who ? 'Most obscure: ' + esc(S.rv.who) + '. ' : '') + (S.solo ? '' : '<span class="t0c">' + esc(tname(0)) + ' +' + S.rv.gains[0] + '</span> &nbsp; <span class="t1c">' + esc(tname(1)) + ' +' + S.rv.gains[1] + '</span>') + '</div>';
      }
      if (ph === 'round_end') { return '<div class="tag">Scores after</div><div class="h2">' + esc(S.re.title) + '</div>' + (S.solo ? '' : barsHtml()) + ranksHtml(S.solo ? 12 : 6); }
      if (ph === 'final') {
        var conf = '', cols = ['#C4520F', '#17696B', '#F2B705', '#FBF0D9'];
        for (var i = 0; i < 28; i++) { conf += '<div class="conf" style="left:' + ((i * 37) % 100) + '%;background:' + cols[i % 4] + ';-webkit-animation-delay:' + ((i * 0.23) % 3.4) + 's;animation-delay:' + ((i * 0.23) % 3.4) + 's"></div>'; }
        var f = S.fin;
        if (f.solo) { return conf + '<div class="h1">' + (f.tie ? 'A tie at the top!' : '<span class="t0c">' + esc(f.champ) + '</span> wins!') + '</div>' + ranksHtml(12) + '<div class="status">' + (f.king ? 'Fastest buzzer: ' + esc(f.king) + ' (' + f.kingN + ')' : '') + '</div>'; }
        return conf + '<div class="h1">' + (f.winner < 0 ? 'It is a tie!' : '<span class="t' + f.winner + 'c">' + esc(tname(f.winner)) + '</span> win!') + '</div>' + barsHtml() + ranksHtml(6) +
          '<div class="status">' + (f.king ? 'Fastest buzzer: ' + esc(f.king) + ' (' + f.kingN + ')' : '') + '</div>';
      }
      return '';
    }
    function render() {
      S = E.state();
      put('top', topHtml());
      // zoom keeps one DOM node per picture so the image does not flicker while it zooms
      var st = stageHtml();
      put('stage', st);
      put('bubble', esc(S.phase === 'lobby' || !S.say.text ? 'Scan the code with your phone camera to join. The first player in runs the show.' : S.say.text));
      put('joinbox', 'Join at ' + esc(SHORT) + '<br>Room <b>' + ROOM + '</b><br>Relay ' + dotsHtml() + (net.up ? '' : ' connecting...'));
      put('pausel', S.paused ? '<div class="paused">PAUSED</div>' : '');
      put('menu', menuOpen ? '<div class="menu">' +
        '<button data-a="s_next">' + (S.phase === 'lobby' ? 'Open the game menu' : 'Next') + '</button><button data-a="s_pause">' + (S.paused ? 'Resume' : 'Pause') + '</button>' +
        '<button data-a="s_skip">Back to the game menu</button><button data-a="s_end">Finish the show</button><button data-a="s_sound">Sound: ' + (soundOn ? 'on' : 'off') + '</button><button data-a="s_full">Full screen</button>' +
        '<button data-a="s_again">New show, same players</button><button data-a="s_menu">Close</button></div>' : '');
      if (S.say.id !== lastSay) { lastSay = S.say.id; speak(S.say.text); }
      if (S.fx.id !== lastFx) { lastFx = S.fx.id; sfx(S.fx.name); }
      if (S.f && S.f.x !== lastX) { if (S.f.x > lastX && (S.phase === 'feud_pick' || S.phase === 'feud_reveal')) { cache.xl = null; put('xl', '<div class="bigx">X</div>'); } lastX = S.f.x; }
      tickUI();
    }
    function act(a, v) {
      var now = Date.now();
      if (a === 's_unlock') {
        unlocked = true;
        try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) { actx = new AC(); if (actx.resume) { actx.resume(); } } } catch (e) { }
        try { if (window.speechSynthesis) { pickVoice(); window.speechSynthesis.onvoiceschanged = pickVoice; } } catch (e) { }
        var ov = document.getElementById('ov'); if (ov) { ov.className = 'overlay hide'; }
        sfx('fanfare');
      }
      else if (a === 's_menu') { menuOpen = !menuOpen; }
      else if (a === 's_next') { E.cmd('next', null, now); menuOpen = false; }
      else if (a === 's_pause') { E.cmd('pause', null, now); }
      else if (a === 's_skip') { E.cmd('menu', null, now); menuOpen = false; }
      else if (a === 's_end') { E.cmd('end', null, now); menuOpen = false; }
      else if (a === 's_game') { E.cmd('play', { key: v }, now); menuOpen = false; }
      else if (a === 's_again') { E.cmd('again', null, now); menuOpen = false; }
      else if (a === 's_sound') { soundOn = !soundOn; if (!soundOn) { try { window.speechSynthesis.cancel(); } catch (e) { } } }
      else if (a === 's_full') { try { var d = document.documentElement; (d.requestFullscreen || d.webkitRequestFullscreen).call(d); } catch (e) { } menuOpen = false; }
      dirty = true; render();
    }
    app.addEventListener('click', function (e) { var b = closest(e.target, 'data-a'); if (b) { act(b.getAttribute('data-a'), b.getAttribute('data-v')); } });
    document.addEventListener('keydown', function (e) {
      if (e.target && e.target.tagName === 'BUTTON') { return; }
      var k = e.keyCode;
      if (!unlocked) { if (k === 13 || k === 32) { act('s_unlock'); } return; }
      if (k === 13 || k === 32 || k === 39) { act('s_next'); if (e.preventDefault) { e.preventDefault(); } }
      else if (k === 80) { act('s_pause'); }
      else if (k === 77) { act('s_menu'); }
    });
    render();
  }

  /* ================================================================== */
  /* PHONE                                                              */
  /* ================================================================== */
  function phone() {
    var pid = lsGet('rc_pid'); if (!pid) { pid = rid(8); lsSet('rc_pid', pid); }
    if (qs.pid) { pid = qs.pid; } // for tests: several players in one browser
    var ui = { name: lsGet('rc_name') || '', team: -1, joined: false, menu: false, sent: null, failK: '', rtt: 0, lastE: 0 };
    if (lsGet('rc_room') === ROOM && ui.name && !qs.pid) { ui.joined = true; ui.team = +lsGet('rc_team') || 0; }
    var lastSeq = 0, lastBoot = 0, lastState = 0, pending = null, offCur = null, offPrev = null, offAt = 0, lastKick = Date.now();
    app.innerHTML = '<div class="ph"><div id="pbanner"></div><div id="ptop"></div><div id="pnote"></div><div class="pbody" id="pbody"></div><div id="psheet"></div><div id="pboss"></div></div>';

    function send(m) { m.p = pid; m.i = rid(10); netSend('in', JSON.stringify(m), false); } // a fresh id every time, so a retry is never mistaken for a duplicate
    function hello() { if (ui.joined && ui.name) { send({ t: 'hello', name: ui.name, team: ui.team < 0 ? 0 : ui.team, ts: Date.now(), rtt: ui.rtt }); } }
    function doAct(m, label) { m.k = S.k; m.n = 0; pending = { k: S.k, m: m, tries: 0 }; ui.sent = { k: S.k, label: label }; ui.failK = ''; send(m); render(); }
    function retry() { // keep sending the last tap until the TV shows it arrived
      if (!pending || !S) { return; }
      if (S.k !== pending.k || (S.acted && S.acted[pid])) { pending = null; return; }
      if (pending.tries >= 25) { pending = null; ui.sent = null; ui.failK = S.k; return; }
      pending.tries++; pending.m.n = pending.tries; send(pending.m);
    }
    function wakeLock() { try { if (navigator.wakeLock && navigator.wakeLock.request) { navigator.wakeLock.request('screen').then(function () { }, function () { }); } } catch (e) { } }
    function ctl(c, a) { send({ t: 'ctl', c: c, a: a || null }); }

    netStart(ROOM, 'state', function (topic, str) {
      if (topic !== 'state') { return; }
      var st = JSON.parse(str);
      if (!st || st.room !== ROOM) { return; }
      if (st.boot === lastBoot && st.seq <= lastSeq) { return; }
      lastBoot = st.boot; lastSeq = st.seq; lastState = Date.now();
      var off = Date.now() - st.now;
      if (Date.now() - offAt > 30000) { offPrev = offCur; offCur = null; offAt = Date.now(); }
      if (offCur === null || off < offCur) { offCur = off; }
      clockOff = offPrev === null ? offCur : Math.min(offPrev, offCur);
      S = st;
      var mine = S.players[pid];
      if (mine && mine.e && mine.e !== ui.lastE) { ui.lastE = mine.e; var r = Date.now() - mine.e; if (r >= 0 && r < 30000) { ui.rtt = r; } }
      render();
    });
    net.onUp = function () { hello(); retry(); render(); };
    net.onCount = function () { render(); };
    setInterval(hello, 4000);
    setInterval(function () { retry(); render(); }, 900);
    // watchdog: the TV speaks every 2 seconds. If we hear nothing for 5, our connections are stale: dial again.
    var born = Date.now();
    function kick() { lastKick = Date.now(); netKick(); }
    setInterval(function () { if (ui.joined && Date.now() - (lastState || born) > 5000 && Date.now() - lastKick > 6000) { kick(); } }, 1000);
    function onWake() { if (document.hidden) { return; } if (ui.joined) { wakeLock(); if (Date.now() - (lastState || born) > 3500) { kick(); } hello(); } }
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('pageshow', onWake);
    window.addEventListener('online', function () { if (ui.joined) { kick(); } });
    setInterval(tickUI, 100);

    function me() { return S && S.players[pid]; }
    function sentHere() { return ui.sent && S && ui.sent.k === S.k ? ui.sent : null; }
    function buzzBtn(label, small) {
      var s = sentHere();
      if (s) { return '<button class="buzz sent' + (small ? ' sm' : '') + '" disabled>SENT</button>'; }
      return '<button class="buzz wait' + (small ? ' sm' : '') + '" data-a="buzz" data-open="' + (S.openAt || 0) + '" data-on="' + label + '" data-off="WAIT">WAIT</button>';
    }
    function optBtns(opts, a) { var h = ''; for (var i = 0; i < opts.length; i++) { h += '<button class="pbtn dark" data-a="' + a + '" data-v="' + opts[i].i + '">' + esc(opts[i].text) + '</button>'; } return h; }
    function watch(extra) { return '<div class="watch">Eyes on the TV</div>' + (extra ? '<p>' + extra + '</p>' : ''); }

    function joinHtml() {
      var n0 = S ? tname(0) : 'Thunder', n1 = S ? tname(1) : 'Lightning';
      if (S && S.solo) { // no teams in this show: a name is all we need
        return '<h2>Join Rain Check!</h2><p>Room ' + ROOM + '</p>' +
          '<input class="field" id="nm" maxlength="14" placeholder="Your first name" value="' + esc(ui.name) + '" autocomplete="off">' +
          '<button class="pbtn go" data-a="join">I am in</button>';
      }
      return '<h2>Join Rain Check!</h2><p>Room ' + ROOM + '</p>' +
        '<input class="field" id="nm" maxlength="14" placeholder="Your first name" value="' + esc(ui.name) + '" autocomplete="off">' +
        '<p>Pick your team</p>' +
        '<button class="pbtn c o0' + (ui.team === 0 ? ' sel' : '') + '" data-a="team" data-v="0">' + esc(n0) + '</button>' +
        '<button class="pbtn c o1' + (ui.team === 1 ? ' sel' : '') + '" data-a="team" data-v="1">' + esc(n1) + '</button>' +
        '<button class="pbtn go" data-a="join"' + (ui.team < 0 ? ' disabled' : '') + '>I am in</button>';
    }
    function modeHtml() {
      return '<h3>How do you want to play?</h3><div class="half"><button class="pbtn plain c' + (S.solo ? '' : ' sel') + '" data-a="c_solo" data-v="0">Two teams</button><button class="pbtn plain c' + (S.solo ? ' sel' : '') + '" data-a="c_solo" data-v="1">Every player for themselves</button></div>';
    }
    function myRank() { var rk = rankList(); for (var i = 0; i < rk.length; i++) { if (rk[i].p === pid) { return i + 1; } } return 0; }
    function standing() { // one line of score, for whichever way the show is being played
      if (S.solo) { var rk = rankList(); return '<p>' + (rk.length ? esc(rk[0].n) + ' leads with ' + rk[0].pts + '. ' : '') + 'You are number ' + myRank() + ' with ' + (me() ? me().pts : 0) + '.</p>'; }
      return '<p>' + esc(tname(0)) + ' ' + S.teams[0].score + ' &middot; ' + esc(tname(1)) + ' ' + S.teams[1].score + '</p>';
    }
    function pickerHtml() {
      var h = '<div class="half">';
      for (var i = 0; i < C.order.length; i++) { var k = C.order[i], n = S.played[k] || 0; h += '<button class="pbtn game c' + (n ? ' done' : '') + '" data-a="c_play" data-v="' + k + '">' + esc(gameTitle(k)) + (n ? '<small>played</small>' : '') + '</button>'; }
      h += '</div><button class="pbtn plain c' + (S.short ? ' sel' : '') + '" data-a="c_short">Short rounds: ' + (S.short ? 'on' : 'off') + '</button>';
      h += modeHtml();
      if (S.round > 0) { h += '<button class="pbtn plain c" data-a="c_end">Finish the show and see the winner</button>'; }
      return h;
    }
    function locked(text) { // shared by every "everyone answers" screen
      var s = sentHere();
      if (S.acted && S.acted[pid]) { return '<h2>' + text + (s && s.label ? ': ' + esc(s.label) : '') + '</h2>' + watch('Waiting for the others.'); }
      if (s) { return '<h2>Sending...</h2><p>Hold on a second.</p>'; }
      return '';
    }
    function lobbyHtml() {
      var m = me(), lists = ['', ''];
      S.order.forEach(function (id) { var p = S.players[id]; if (p) { lists[p.t] += esc(p.n) + (id === S.boss ? ' (showrunner)' : '') + '<br>'; } });
      var h = '<h2>You are in, ' + esc(m.n) + '!</h2>' + (S.boss === pid ? '' : '<p>' + esc(pname(S.boss)) + ' will start the show.</p>') +
        (S.solo ? '<div class="plist"><b class="t0c">Players</b>' + lists[0] + lists[1] + '</div>' :
        '<div class="plist"><b class="t0c">' + esc(tname(0)) + '</b>' + (lists[0] || '<span class="small">nobody yet</span>') + '<b class="t1c">' + esc(tname(1)) + '</b>' + (lists[1] || '<span class="small">nobody yet</span>') + '</div>' +
        '<button class="pbtn plain c" data-a="switch">Switch my team</button>');
      if (S.boss === pid) {
        h += '<h2>You run the show</h2><p>When everyone is in, tap a game to start it. After each game you come back here and pick the next one.</p>' + pickerHtml() +
          (S.solo ? '' : '<h3>Team names</h3><input class="field" id="tn0" maxlength="14" value="' + esc(tname(0)) + '" style="font-size:19px;margin:4px 0"><input class="field" id="tn1" maxlength="14" value="' + esc(tname(1)) + '" style="font-size:19px;margin:4px 0">' +
          '<div class="half" style="margin-top:8px"><button class="pbtn plain c" data-a="c_names">Save names</button><button class="pbtn plain c" data-a="c_preset">Kids vs Adults</button></div>');
      }
      return h;
    }
    function bodyHtml() {
      if (!ui.joined) { return joinHtml(); }
      if (!S) { return '<h2>Looking for the TV...</h2><p>Make sure the TV shows room ' + ROOM + '.</p>'; }
      var m = me();
      if (!m) { return '<h2>Joining...</h2><p>Hang on, ' + esc(ui.name) + '.</p>'; }
      var ph = S.phase, mine = S.turn === pid, s = sentHere(), h = '';
      if (ph === 'lobby') { return lobbyHtml(); }
      if (ph === 'menu') {
        var sc = standing();
        if (S.boss === pid) { return '<h2>Pick the next game</h2>' + sc + pickerHtml(); }
        return '<h2>' + esc(pname(S.boss)) + ' is picking the next game</h2>' + sc + watch();
      }
      var lk;
      if (S.paused) { return '<h2>Paused</h2>' + watch(); }
      if (ph === 'intro') { return '<h2>' + esc(S.intro.title) + '</h2>' + watch(); }
      if (ph === 'vote_q') {
        lk = locked('Locked in'); if (lk) { return lk; }
        h = '<div class="q">' + esc(S.q.text) + '</div>';
        for (var i = 0; i < S.q.o.length; i++) { h += '<button class="pbtn o' + i + '" data-a="vote" data-v="' + i + '">' + 'ABCD'.charAt(i) + '. ' + esc(S.q.o[i]) + '</button>'; }
        return h;
      }
      if (ph === 'vote_reveal') { return '<h2>Answer: ' + esc(S.q.o[S.rv.a]) + '</h2>' + watch(); }
      if (ph === 'ml_q') {
        lk = locked('Vote locked in'); if (lk) { return lk; }
        h = '<div class="q">' + esc(S.ml.text) + '</div><div class="half">';
        for (var w = 0; w < S.ml.who.length; w++) { h += '<button class="pbtn plain c" data-a="mlv" data-v="' + esc(S.ml.who[w].p) + '">' + esc(S.ml.who[w].n) + '</button>'; }
        return h + '</div>';
      }
      if (ph === 'ml_reveal') { return '<h2>' + (S.rv.win.length ? esc(S.rv.win.join(' and ')) : 'No votes') + '</h2>' + watch(); }
      if (ph === 'num_q') {
        lk = locked('Guess locked in'); if (lk) { return lk; }
        return '<div class="q">' + esc(S.nm.text) + '</div><input class="field" id="numin" type="number" inputmode="decimal" autocomplete="off" placeholder="Your number"><button class="pbtn go" data-a="num">Lock it in</button>';
      }
      if (ph === 'num_reveal') { return '<h2>Answer: ' + esc(S.rv.a) + '</h2>' + (S.rv.who ? '<p>Closest: ' + esc(S.rv.who) + '</p>' : '') + watch(); }
      if (ph === 'scr_q') {
        if (S.acted && S.acted[pid]) { return '<h2>You got it!</h2>' + watch('Waiting for the others.'); }
        return '<p class="small">Hint: ' + esc(S.ws.hint) + '</p><div class="pmask big2">' + esc(S.ws.mix) + '</div><input class="field" id="wordin" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="The word"><button class="pbtn go" data-a="word">Send</button>';
      }
      if (ph === 'scr_reveal') { return '<h2>' + esc(S.rv.text) + '</h2>' + watch(); }
      if (ph === 'board_pick') {
        if (!mine) { return '<h2>' + esc(pname(S.turn)) + ' is picking</h2>' + watch(); }
        h = '<h2>Your pick, ' + esc(m.n) + '!</h2><div class="tiles">';
        for (var c = 0; c < S.board.cats.length; c++) {
          h += '<div class="tc"><div class="th">' + esc(S.board.cats[c]) + '</div>';
          for (var l = 0; l < 4; l++) { h += '<button data-a="tile" data-v="' + c + ',' + l + '"' + (S.board.used[c][l] ? ' disabled' : '') + '>' + ((l + 1) * 100) + '</button>'; }
          h += '</div>';
        }
        return h + '</div>';
      }
      if (ph === 'board_q' || ph === 'zoom_q') {
        if (S.locked[S.solo ? pid : m.t]) { return '<h2>' + (S.solo ? 'You are locked out' : 'Your team is locked out') + '</h2>' + watch(S.solo ? 'The others get a try.' : 'The other team gets a try.'); }
        return (ph === 'board_q' ? '<div class="q">' + esc(S.q.text) + '</div>' : '<h2>What place is this?</h2>') + buzzBtn('BUZZ') + '<p class="small">Buzz only if you know it. You answer on this phone.</p>';
      }
      if (ph === 'board_ans' || ph === 'zoom_ans') {
        if (!mine) { return '<h2>' + esc(pname(S.turn)) + ' buzzed first</h2>' + watch(); }
        if (s) { return '<h2>' + esc(s.label) + '</h2>' + watch(); }
        return '<h2>You buzzed! Pick fast.</h2>' + (S.q && ph === 'board_ans' ? '<div class="q">' + esc(S.q.text) + '</div>' : '') + optBtns(S.opts, 'ans');
      }
      if (ph === 'board_reveal' || ph === 'zoom_reveal') { return '<h2>' + esc(S.rv.text) + '</h2>' + watch(); }
      if (ph === 'phrase_turn') {
        var mask = '<div class="pmask">' + esc(S.ph.mask.join('')) + '</div>';
        if (mine && !s) {
          h = '<h2>Pick a letter</h2>' + mask + '<div class="keys">';
          for (var k = 0; k < 26; k++) { var L = LETTERS.charAt(k); h += '<button data-a="letter" data-v="' + L + '"' + (S.used.indexOf(L) >= 0 ? ' disabled' : '') + '>' + L + '</button>'; }
          h += '</div>';
        } else { h = '<h2>' + (mine ? 'Sent' : esc(pname(S.turn)) + ' picks a letter') + '</h2>' + mask; }
        if (S.slock[S.solo ? pid : m.t]) { h += '<p class="small">' + (S.solo ? 'You' : 'Your team') + ' guessed wrong. Wait for the next letter to solve.</p>'; }
        else if (!s) { h += '<button class="pbtn go" data-a="buzz">I CAN SOLVE IT</button>'; }
        return h;
      }
      if (ph === 'phrase_solve') {
        if (S.solver !== pid) { return '<h2>' + esc(pname(S.solver)) + ' is solving</h2>' + watch(); }
        if (s) { return '<h2>Sent</h2>' + watch(); }
        return '<h2>Type the whole phrase</h2><div class="pmask">' + esc(S.ph.mask.join('')) + '</div><input class="field" id="solve" autocomplete="off" autocapitalize="characters" placeholder="THE PHRASE" style="font-size:20px"><button class="pbtn go" data-a="solve">Solve</button>';
      }
      if (ph === 'phrase_reveal') { return '<h2>' + esc(S.rv.text) + '</h2>' + watch(); }
      if (ph === 'feud_face') { return '<div class="q">' + esc(S.f.q) + '</div>' + buzzBtn('BUZZ') + '<p class="small">Buzz to give the first answer.</p>'; }
      if (ph === 'feud_pick') {
        if (!mine) { return '<h2>' + esc(pname(S.turn)) + ' is choosing</h2>' + watch(pteam(S.turn) === m.t ? 'Help your teammate. Shout it out!' : ''); }
        if (s) { return '<h2>' + esc(s.label) + '</h2>' + watch(); }
        h = '<h2>' + (S.f.mode === 'steal' ? 'Steal! One guess.' : 'What did most people say?') + '</h2><div class="q">' + esc(S.f.q) + '</div>';
        for (var o = 0; o < S.f.o.length; o++) { if (S.f.tried.indexOf(o) < 0) { h += '<button class="pbtn plain c" data-a="fpick" data-v="' + o + '">' + esc(S.f.o[o]) + '</button>'; } }
        return h;
      }
      if (ph === 'feud_reveal' || ph === 'round_end') { return '<h2>Scores</h2>' + standing() + (S.solo ? '' : '<p>You have ' + m.pts + ' points of your own, number ' + myRank() + ' of ' + S.order.length + '.</p>') + watch(); }
      if (ph === 'cr_q') {
        lk = locked('Answer locked in'); if (lk) { return lk; }
        return '<div class="q">' + esc(S.cr.text) + '</div><p class="small">One answer. The fewer people who would say it, the more you score.</p><input class="field" id="crin" maxlength="40" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Your answer"><button class="pbtn go" data-a="cr">Lock it in</button>';
      }
      if (ph === 'cr_judge') {
        if (S.boss !== pid) { return '<h2>The judge is deciding</h2>' + watch(); }
        h = '<h2>You are the judge</h2><p>These answers are not on the answer sheet. Is each one correct?</p><div class="q">' + esc(S.cr.text) + '</div>';
        S.cr.rows.forEach(function (r) { if (r.st === 'ask') { h += '<p><b>' + esc(r.text) + '</b> <span class="small">from ' + esc(r.n) + '</span></p><div class="half"><button class="pbtn dark" data-a="c_crj" data-v="' + esc(r.p) + ',1">Correct</button><button class="pbtn plain c" data-a="c_crj" data-v="' + esc(r.p) + ',0">Wrong</button></div>'; } });
        return h;
      }
      if (ph === 'cr_reveal') {
        var mineR = null; S.cr.rows.forEach(function (r) { if (r.p === pid) { mineR = r; } });
        if (!mineR) { return '<h2>No answer from you</h2>' + watch(); }
        return '<h2>' + (mineR.st === 'ok' ? mineR.pts + ' points' : '0 points') + '</h2><p>' + (mineR.st === 'ok' ? esc(mineR.name) + ': about ' + mineR.said + ' of 100 people would say it.' : esc(mineR.text) + ': ' + esc(mineR.why || 'not accepted.')) + '</p>' + watch();
      }
      if (ph === 'final') {
        var endBtn = S.boss === pid ? '<button class="pbtn go" data-a="c_again">New show, same players</button>' : '';
        if (S.fin.solo) { return '<h2>' + (S.fin.tie ? 'A tie at the top!' : esc(S.fin.champ) + ' wins!') + '</h2><p>You finished number ' + myRank() + ' with ' + m.pts + ' points.</p>' + endBtn; }
        return '<h2>' + (S.fin.winner < 0 ? 'A tie!' : esc(tname(S.fin.winner)) + ' win!') + '</h2><p>You scored ' + m.pts + ' points. That makes you number ' + myRank() + ' of ' + S.order.length + '.</p>' + endBtn;
      }
      return watch();
    }
    function render() {
      var m = me();
      var stale = S && ui.joined && (Date.now() - lastState > 5000);
      var ban = '';
      if (S && S.v !== VERSION) { ban = '<button class="banner" data-a="reload">This phone has an old copy of the game. Tap here to refresh.</button>'; }
      else if (!net.up) { ban = '<div class="banner">Connecting to the game...</div>'; }
      else if (stale) { ban = '<div class="banner">Reconnecting to the TV...</div>'; }
      else if (ui.rtt > 2500) { ban = '<div class="banner">This phone has a slow connection. Move closer to the Wi-Fi.</div>'; }
      put('pbanner', ban);
      put('ptop', m ? '<div class="ptop t' + (S.solo ? 1 : m.t) + '"><span class="pill">' + esc(m.n) + (S.solo ? '' : ', ' + esc(tname(m.t))) + '</span><span class="sc">' + (S.solo ? m.pts + ' pts' : S.teams[0].score + ' to ' + S.teams[1].score) + '</span></div>' : '<div class="ptop tn"><span class="sc">Rain Check!</span><span>Room ' + ROOM + '</span></div>');
      // do not redraw a screen with a text box while someone is typing in it
      var wr = S && S.phase === 'scr_q' && S.wr ? (S.wr[pid] || 0) : 0;
      put('pnote', S && ui.failK && ui.failK === S.k ? '<div class="pnote bad">That did not reach the TV. Tap again.</div>' : (wr && !(S.acted && S.acted[pid]) ? '<div class="pnote bad">Not it. Try again. (' + wr + (wr === 1 ? ' try' : ' tries') + ')</div>' : ''));
      var ae = document.activeElement, html = bodyHtml();
      if (ae && ae.tagName === 'INPUT' && cache.pbody && cache.pbody.replace(/value="[^"]*"/g, '') === html.replace(/value="[^"]*"/g, '')) { /* keep */ }
      else if (ae && ae.tagName === 'INPUT' && ae.id === 'nm' && !ui.joined) { /* typing a name: wait */ }
      else if (ae && ae.tagName === 'INPUT' && (ae.id === 'tn0' || ae.id === 'tn1') && S && S.phase === 'lobby') { /* typing team names: wait */ }
      else if (ae && ae.tagName === 'INPUT' && (ae.id === 'wordin' || ae.id === 'numin' || ae.id === 'crin') && S && cache.pbodyK === S.k && !(S.acted && S.acted[pid]) && !sentHere()) { /* typing an answer: wait */ }
      else { if (put('pbody', html)) { cache.pbodyK = S ? S.k : ''; } }
      var boss = S && m && S.boss === pid && S.phase !== 'lobby' && S.phase !== 'menu' && S.phase !== 'final';
      var passive = S && /^intro$|_reveal$|^round_end$/.test(S.phase);
      put('pboss', boss ? '<div class="bossbar">' + (passive ? '<button data-a="c_next">NEXT</button>' : '<button class="alt wide" data-a="c_next">Skip this one</button>') + '<button class="alt" data-a="c_pause">' + (S.paused ? 'Go' : 'Pause') + '</button><button class="alt" data-a="c_menu">Menu</button></div>' : '');
      var sheet = '';
      if (boss && ui.menu) {
        var conn = '', tnow = S.now || Date.now();
        S.order.forEach(function (id) { var p = S.players[id]; if (p) { conn += esc(p.n) + ': ' + (tnow - p.seen > 10000 ? 'no signal' : (p.rtt ? (p.rtt < 700 ? 'good' : (p.rtt < 2000 ? 'slow' : 'very slow')) + ' (' + p.rtt + ' ms)' : 'checking')) + (p.late ? ', ' + p.late + ' late taps' : '') + '<br>'; } });
        sheet = '<div class="sheet"><button class="pbtn go" data-a="c_tomenu">Back to the game menu</button>' +
          (S.solo ? '' : '<div class="r2"><button class="pbtn plain c" data-a="c_adj" data-v="0,50">' + esc(tname(0)) + ' +50</button><button class="pbtn plain c" data-a="c_adj" data-v="0,-50">' + esc(tname(0)) + ' -50</button></div>' +
          '<div class="r2"><button class="pbtn plain c" data-a="c_adj" data-v="1,50">' + esc(tname(1)) + ' +50</button><button class="pbtn plain c" data-a="c_adj" data-v="1,-50">' + esc(tname(1)) + ' -50</button></div>') +
          '<h3>Phone connections</h3><div class="plist">' + conn + '</div>' +
          '<button class="pbtn plain c" data-a="c_end">Finish the show and see the winner</button><button class="pbtn dark" data-a="c_menu">Close</button></div>';
      }
      put('psheet', sheet);
      tickUI();
    }
    function onAct(b) {
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), el;
      if (a === 'team') { el = document.getElementById('nm'); if (el) { ui.name = el.value; } ui.team = +v; cache.pbody = null; put('pbody', bodyHtml()); return; }
      if (a === 'join') {
        el = document.getElementById('nm'); var name = (el ? el.value : ui.name).replace(/[<>]/g, '').replace(/^\s+|\s+$/g, '').substring(0, 14);
        if (!name) { if (el) { el.focus(); } return; }
        if (ui.team < 0) { if (S && S.solo) { ui.team = 0; } else { return; } }
        ui.name = name; ui.joined = true; lsSet('rc_name', name); lsSet('rc_room', ROOM); lsSet('rc_team', String(ui.team));
        wakeLock();
        if (el) { el.blur(); }
        hello();
      }
      else if (a === 'switch') { ui.team = 1 - pteam(pid); lsSet('rc_team', String(ui.team)); hello(); }
      else if (a === 'reload') { try { location.reload(true); } catch (e) { location.href = location.href; } return; }
      else if (!S) { return; }
      else if (a === 'vote') { doAct({ t: 'vote', a: +v }, S.q.kind === 'mix' ? 'ABCD'.charAt(+v) : S.q.o[+v]); }
      else if (a === 'mlv') { doAct({ t: 'mlv', v: v }, 'Voted'); }
      else if (a === 'num') { el = document.getElementById('numin'); if (!el || el.value === '' || isNaN(parseFloat(el.value))) { if (el) { el.focus(); } return; } var nval = parseFloat(el.value); el.blur(); doAct({ t: 'num', v: nval }, String(nval)); }
      else if (a === 'word') { el = document.getElementById('wordin'); if (!el || !el.value) { if (el) { el.focus(); } return; } send({ t: 'word', k: S.k, n: 1, text: el.value }); el.value = ''; return; }
      else if (a === 'c_play') { ctl('play', { key: v }); try { window.scrollTo(0, 0); } catch (e) { } }
      else if (a === 'c_short') { ctl('short', { on: !S.short }); }
      else if (a === 'c_solo') { ctl('solo', { on: v === '1' }); }
      else if (a === 'c_crj') { var cj = v.split(','); ctl('crj', { p: cj[0], ok: cj[1] === '1', said: 8, by: 'the showrunner' }); }
      else if (a === 'cr') { el = document.getElementById('crin'); if (!el || !el.value.replace(/\s/g, '')) { if (el) { el.focus(); } return; } var ctxt = el.value; el.blur(); doAct({ t: 'cr', text: ctxt }, ctxt); }
      else if (a === 'c_tomenu') { ctl('menu'); ui.menu = false; }
      else if (a === 'tile') { var cl = v.split(','); doAct({ t: 'pick', c: +cl[0], l: +cl[1] }, 'Picked'); }
      else if (a === 'buzz') { if (S.phase !== 'phrase_turn' && hnow() < (S.openAt || 0) - 150) { return; } if (sentHere()) { return; } try { if (navigator.vibrate) { navigator.vibrate(60); } } catch (e) { } doAct({ t: 'buzz' }, 'Buzzed'); }
      else if (a === 'ans') { doAct({ t: 'ans', a: +v }, 'Answer sent'); }
      else if (a === 'letter') { doAct({ t: 'letter', l: v }, v); }
      else if (a === 'solve') { el = document.getElementById('solve'); if (!el || !el.value) { return; } var txt = el.value; el.blur(); doAct({ t: 'solve', text: txt }, 'Sent'); }
      else if (a === 'fpick') { doAct({ t: 'fpick', o: +v }, 'Answer sent'); }
      else if (a === 'c_next') { ctl('next'); }
      else if (a === 'c_pause') { ctl('pause'); }
      else if (a === 'c_menu') { ui.menu = !ui.menu; }
      else if (a === 'c_end') { ctl('end'); ui.menu = false; }
      else if (a === 'c_again') { ctl('again'); }
      else if (a === 'c_adj') { var ad = v.split(','); ctl('adj', { team: +ad[0], d: +ad[1] }); }
      else if (a === 'c_names') { var a0 = document.getElementById('tn0'), a1 = document.getElementById('tn1'); if (a0 && a1) { a0.blur(); a1.blur(); ctl('teams', { names: [a0.value, a1.value] }); } }
      else if (a === 'c_preset') { ctl('teams', { names: ['Kids', 'Adults'] }); }
      render();
    }
    var lastTouch = 0;
    app.addEventListener('touchstart', function (e) { var b = closest(e.target, 'data-a'); if (b && b.getAttribute('data-a') === 'buzz' && !b.disabled) { lastTouch = Date.now(); onAct(b); } });
    app.addEventListener('click', function (e) {
      var b = closest(e.target, 'data-a'); if (!b || b.disabled) { return; }
      if (b.getAttribute('data-a') === 'buzz' && Date.now() - lastTouch < 700) { return; }
      onAct(b);
    });
    render();
  }

  if (ROLE === 'screen') { screen(); } else if (ROLE === 'play') { phone(); } else { home(); }
})();
