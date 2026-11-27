/* Game Show Night page logic: relay connection, TV screen, phone controller. */
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
  var VERSION = 5;         // must match the engine's state version
  var S = null;            // latest public state
  var clockOff = 0;        // my clock minus the TV's clock
  function hnow() { var n = Date.now() - clockOff; if (S && S.paused && S.pat) { return S.pat; } return n; }
  function tname(t) { return S.teams[t] ? S.teams[t].name : ''; }
  function gameTitle(key) { for (var i = 0; i < C.rounds.length; i++) { if (C.rounds[i].key === key) { return C.rounds[i].title; } } return key; }
  function rankList() { var out = []; S.order.forEach(function (id) { var p = S.players[id]; if (p) { out.push({ p: id, n: p.n, pts: p.pts, t: p.t }); } }); out.sort(function (a, b) { return b.pts - a.pts; }); return out; }
  function pname(pid) { return pid && S.players[pid] ? S.players[pid].n : 'Someone'; }
  function pteam(pid) { return pid && S.players[pid] ? S.players[pid].t : 0; }
  function NT() { return S.teams.length; }
  function nth(n) { return n + (n === 1 ? 'st' : (n === 2 ? 'nd' : (n === 3 ? 'rd' : 'th'))); }
  function teamRank(t) { var r = 1; for (var i = 0; i < S.teams.length; i++) { if (S.teams[i].score > S.teams[t].score) { r++; } } return r; }
  function secs(ms) { return (Math.max(0, ms) / 1000).toFixed(2) + ' s'; }
  function timerHtml(len) { return S.deadline ? '<div class="timer"><i data-dl="' + S.deadline + '" data-len="' + len + '"></i></div>' : ''; }

  /* Zoom In: a real photograph that starts close up and soft, then pulls back very slowly and comes into focus.
     Two layers move together: a small soft copy underneath and the sharp photo fading in on top, so only
     transform and opacity change from frame to frame (smooth even on a slow TV browser). */
  var zrev = { key: '', t0: 0 };
  function zoomF(now) {
    var t = S.paused && S.pat ? S.pat : now;
    return S.zfrozen != null ? S.zfrozen : Math.max(0, Math.min(1, (t - S.zt0) / S.zdur));
  }
  function zoomDraw() {
    var el = document.getElementById('zimg');
    if (!el || !S || !S.z) { return; }
    var now = Date.now(), z = S.z, f = zoomF(now), fr = el.parentNode;
    if (S.phase === 'zoom_reveal') {
      // pull back to the whole picture over two seconds instead of jumping
      var from = S.zfrom != null ? S.zfrom : 1;
      if (zrev.key !== S.k) { zrev.key = S.k; zrev.t0 = now; }
      var u = Math.min(1, (now - zrev.t0) / 2000); u = 1 - (1 - u) * (1 - u) * (1 - u);
      f = from + (1 - from) * u;
    }
    var FW = fr.clientWidth, FH = fr.clientHeight;
    if (!FW || !FH) { return; }
    var a = z.w / z.h, F = FW / FH, Z = 6 * Math.max(F / a, a / F);
    var sc = Math.pow(Z, 1 - f), g = (sc - 1) / (Z - 1);
    var tx = (FW / 2 - (el.offsetLeft + el.offsetWidth * z.fx / 100)) * g, ty = (FH / 2 - (el.offsetTop + el.offsetHeight * z.fy / 100)) * g;
    var tr = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + sc.toFixed(4) + ')';
    el.style.webkitTransformOrigin = el.style.transformOrigin = z.fx + '% ' + z.fy + '%';
    el.style.webkitTransform = el.style.transform = tr;
    var sh = document.getElementById('zsharp');
    if (sh) {
      var o = Math.max(0, Math.min(1, 0.15 + f / 0.4)); o = o * o * (3 - 2 * o);
      if (!(sh.complete && sh.naturalWidth > 0)) { o = 0; }
      sh.style.opacity = o.toFixed(3);
      var zc = document.getElementById('zcredit'); if (zc) { zc.style.visibility = S.phase === 'zoom_reveal' ? 'visible' : 'hidden'; }
      var ld = document.getElementById('zload');
      if (ld) { ld.style.display = (sh.complete && sh.naturalWidth === 0) ? '' : 'none'; }
    }
  }
  function zoomPreload(list) {
    var i; RC._zpre = RC._zpre || {};
    for (i = 0; i < list.length; i++) {
      if (!RC._zpre[list[i].id]) { var a = new Image(), b = new Image(); a.src = 'img/zoom/' + list[i].id + '_s.jpg'; b.src = 'img/zoom/' + list[i].id + '.jpg'; RC._zpre[list[i].id] = [a, b]; }
    }
  }
  (function zoomLoop() {
    try { zoomDraw(); } catch (e) {}
    if (window.requestAnimationFrame) { window.requestAnimationFrame(zoomLoop); } else { setTimeout(zoomLoop, 40); }
  })();
  /* Little emoji bursts: on the TV when something good or bad happens, on a phone when that player scores */
  var BURST = { right: ['🎉', '⭐', '👏', '✨', '🎊', '💥'], ding: ['✨', '⭐', '👍'], win: ['🏆', '🎉', '🎊', '🥳', '⭐', '👑'], wrong: ['😬', '🙈', '💨'], strike: ['❌', '😬'], buzz: ['🔔'], fanfare: ['🎺', '✨'], join: ['👋'] };
  function burst(kind, label) {
    try {
      var set = BURST[kind]; if (!set) { return; }
      var n = kind === 'win' ? 26 : (kind === 'right' ? 16 : (kind === 'wrong' || kind === 'strike' ? 5 : 6)), box = document.createElement('div'), i;
      box.className = 'burst';
      for (i = 0; i < n; i++) {
        var s = document.createElement('span');
        s.innerHTML = set[Math.floor(Math.random() * set.length)];
        s.style.left = (6 + Math.random() * 88) + '%';
        s.style.fontSize = (4 + Math.random() * 5) + 'vh';
        s.style.webkitAnimationDelay = s.style.animationDelay = (Math.random() * 0.5) + 's';
        box.appendChild(s);
      }
      if (label) { var b = document.createElement('b'); b.innerHTML = label; box.appendChild(b); }
      document.body.appendChild(box);
      setTimeout(function () { try { document.body.removeChild(box); } catch (e) { } }, 2600);
    } catch (e2) { }
  }
  /* Ace's face: a base mood set by what just happened, and a moving mouth while he talks */
  var aceMood = 'happy', aceUntil = 0;
  function setMood(m, ms) { aceMood = m; aceUntil = Date.now() + (ms || 3500); }
  function drawMood() {
    var now = Date.now(), h = document.getElementById('host'), b = document.getElementById('avbox'), m = now < aceUntil ? aceMood : 'happy';
    var talking = (h && h.className.indexOf('talk') >= 0) || (b && b.className.indexOf('talk') >= 0);
    if (talking && m !== 'shocked' && m !== 'ko') { m = Math.floor(now / 230) % 2 ? 'excited' : (m === 'sad' ? 'sad' : 'happy'); }
    if (h && h.getAttribute('data-mood') !== m) { h.setAttribute('data-mood', m); }
    if (b && b.getAttribute('data-mood') !== m) { b.setAttribute('data-mood', m); }
  }
  function tickUI() {
    if (!S) { return; }
    window.RCS = S;
    try { drawMood(); } catch (e8) { }
    try { if (RC.avatar) { RC.avatar.tick(S); } } catch (e) { }
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
    zoomDraw();
    if (S.z) {
      var zf = zoomF(now), zv = document.getElementById('zval');
      if (zv) { zv.innerHTML = String(S.phase === 'zoom_q' ? Math.max(100, Math.round((500 - 400 * zf) / 10) * 10) : (S.zval || '')); }
    }
  }

  /* ================================================================== */
  /* HOME                                                               */
  /* ================================================================== */
  function home() {
    app.innerHTML = '<div class="home"><h1>Game Show Night</h1><p>Game shows for the whole family. The TV is the stage, every phone is a controller.</p>' +
      '<button class="big red" data-a="tv" autofocus>This is the TV screen</button>' +
      '<p style="margin-top:26px">Playing on a phone?</p>' +
      '<input class="field" id="code" maxlength="4" placeholder="ROOM CODE" autocapitalize="characters" autocomplete="off">' +
      '<button class="big" data-a="joinhome">Join the game</button>' +
      '<p class="note">Open this page on the TV first. The TV shows one code for the host, then a code and a 4-letter room for everyone else.</p></div>';
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
    var usedSaved = null; try { usedSaved = JSON.parse(lsGet('gn_used') || 'null'); } catch (e) { }
    var E = RC.createEngine(C, { used: usedSaved || {} });   // remembers which questions this TV has already shown
    var saved = lsGet('rc_host_' + ROOM);
    if (!(saved && E.load(saved) && E.state().room === ROOM && E.state().v === VERSION)) { E.init(ROOM, Date.now()); } // a room saved by an older version starts fresh
    S = E.state();
    var seen = {}, seenList = [], dirty = true, lastPub = 0, lastSeq = 0, lastIn = Date.now(), lastKick = 0;
    var unlocked = false, soundOn = true, menuOpen = false, lastSay = S.say.id, lastFx = S.fx.id, talkTimer = null, lastX = S.f ? S.f.x : 0;
    var qrMade = {};
    function qrFor(url) { if (!qrMade[url]) { try { var qr = qrcode(0, 'M'); qr.addData(url); qr.make(); qrMade[url] = qr.createSvgTag(6, 12); } catch (e) { qrMade[url] = ''; } } return qrMade[url]; }
    var JOINURL = HERE + '?r=' + ROOM + (qs.relay ? '&relay=' + qs.relay : '');
    var lastFs = S.fs ? S.fs.id : 0;

    var bulbs = '<div class="bulbs">'; for (var bi = 0; bi < 24; bi++) { bulbs += '<i></i>'; } bulbs += '</div>';
    var rays = '<svg class="rays" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none"><path fill="#4A2D1B" d="M640 300L-200 -40H80ZM640 300L300 -200H520ZM640 300L760 -200H980ZM640 300L1200 -40H1480ZM640 300L1500 260V480ZM640 300L1400 800H1120ZM640 300L840 900H560ZM640 300L160 800H-120ZM640 300L-220 480V260Z"/></svg>';
    app.innerHTML = '<div class="scr">' + rays + '<div class="top" id="top"></div><div class="stagewrap"><div class="frame">' + bulbs + '<div class="stage" id="stage"></div>' + bulbs + '</div></div>' +
      '<div class="stripes"><i class="s0"></i><i class="s1"></i><i class="s2"></i></div>' +
      '<div class="foot"><div class="host" id="host">' + RC.art.host + '</div><div class="bubble" id="bubble"></div><div class="joinbox" id="joinbox"></div></div>' +
      '<div class="avbox off" id="avbox"><video id="avvideo" autoplay playsinline muted></video><audio id="avaudio" autoplay></audio><div class="avdemo">' + RC.art.host + '</div><div class="avtag" id="avtag"></div></div>' +
      '<button class="menubtn" data-a="s_menu">Menu</button><div id="menu"></div><div id="pausel"></div><div id="xl"></div><div id="toast"></div>' +
      '<div class="overlay" id="ov"><h1>Game Show Night</h1><p>Pick a game. Grab your phone. Play.</p><button data-a="s_unlock" id="ovb">Press OK to start</button></div></div>';
    try { document.getElementById('ovb').focus(); } catch (e) { }

    function publish() {
      dirty = false; lastPub = Date.now();
      S = E.state();
      S.now = Date.now(); lastSeq = Math.max(lastSeq + 1, S.now); S.seq = lastSeq;
      var json = JSON.stringify(S);
      netSend('state', json, true);
      lsSet('rc_host_' + ROOM, E.dump());
      if (S.phase === 'intro' && cache.usedK !== S.k) { cache.usedK = S.k; lsSet('gn_used', JSON.stringify(E.used())); }
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
       are not on the sheet; if it does not answer in time, the host decides on their phone as usual. */
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
    var actx = null, voice = null, speakTimer = null, voiceState = 'wait';   // wait | ok | fail
    function soundLine() { // one plain line on the TV about whether this browser can make sound
      if (!unlocked) { return ''; }
      if (!soundOn) { return 'Sound is off (Menu)'; }
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { return 'No voice in this browser'; }
      if (voiceState === 'fail') { return 'Voice is not working here'; }
      return voiceState === 'ok' ? 'Voice on' : 'Checking voice...';
    }
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
      burst(name);
      if (name === 'right' || name === 'ding') { setMood('blissful', 3000); } else if (name === 'win' || name === 'fanfare') { setMood('excited', 6000); } else if (name === 'wrong') { setMood('shocked', 1600); setTimeout(function () { setMood('sad', 2600); }, 1600); } else if (name === 'strike' || name === 'buzz') { setMood('shocked', 2200); }
      var hr = document.getElementById('host');   // Ace reacts: a hop for good news, a wobble for bad
      if (hr && (name === 'right' || name === 'win' || name === 'wrong' || name === 'strike')) { var good = name === 'right' || name === 'win'; hr.className = 'host ' + (good ? 'yay' : 'oops'); setTimeout(function () { if (hr.className.indexOf(good ? 'yay' : 'oops') >= 0) { hr.className = 'host'; } }, 1300); }
    }
    var voiceList = [], voiceIdx = -1;
    function voiceScore(v) { // British first, and the natural-sounding ones before the robotic ones
      var n = v.name || '', s = 0;
      if (/en[-_]GB/i.test(v.lang)) { s += 100; } else if (/^en/i.test(v.lang)) { s += 10; } else { return -1; }
      if (/natural|neural|online|premium|enhanced/i.test(n)) { s += 50; }
      if (/google uk english male|ryan|thomas|daniel|oliver|arthur/i.test(n)) { s += 20; }
      if (/google/i.test(n)) { s += 8; }
      if (/compact|espeak|robot/i.test(n)) { s -= 30; }
      return s;
    }
    function pickVoice() {
      try {
        var vs = window.speechSynthesis.getVoices(), saved = '';
        try { saved = localStorage.getItem('gn_voice') || ''; } catch (e1) { }
        voiceList = []; for (var i = 0; i < vs.length; i++) { if (voiceScore(vs[i]) >= 0) { voiceList.push(vs[i]); } }
        voiceList.sort(function (x, y) { return voiceScore(y) - voiceScore(x); });
        voiceIdx = voiceList.length ? 0 : -1;
        for (i = 0; i < voiceList.length; i++) { if (saved && voiceList[i].name === saved) { voiceIdx = i; } }
        voice = voiceIdx >= 0 ? voiceList[voiceIdx] : null;
      } catch (e) { }
    }
    function speak(text) {
      var host = document.getElementById('host');
      if (host) { host.className = 'host talk'; }
      if (talkTimer) { clearTimeout(talkTimer); }
      talkTimer = setTimeout(function () { if (host) { host.className = 'host'; } }, Math.min(9000, 900 + text.length * 60));
      // with a live avatar the avatar says the line; otherwise the browser's own voice does
      if (unlocked && soundOn && RC.avatar && RC.avatar.speak(text)) { try { if (window.speechSynthesis) { window.speechSynthesis.cancel(); } } catch (e0) { } return; }
      if (!unlocked || !soundOn || !window.speechSynthesis || !window.SpeechSynthesisUtterance) { return; }
      try {
        var syn = window.speechSynthesis;
        if (syn.speaking || syn.pending) { syn.cancel(); }
        if (speakTimer) { clearTimeout(speakTimer); }
        // some browsers drop a line that is queued in the same instant as a cancel, so wait a moment
        speakTimer = setTimeout(function () {
          try {
            var u = new window.SpeechSynthesisUtterance(text);
            u.rate = 1.0; u.pitch = 1.0; u.lang = voice ? voice.lang : 'en-GB'; u.volume = 1; if (voice) { u.voice = voice; }
            u.onstart = function () { voiceState = 'ok'; };
            u.onerror = function (ev) { if (voiceState !== 'ok' && ev && ev.error !== 'interrupted' && ev.error !== 'canceled') { voiceState = 'fail'; } };
            if (syn.resume) { syn.resume(); }
            syn.speak(u);
            if (voiceState === 'wait') { setTimeout(function () { if (voiceState === 'wait') { voiceState = 'fail'; render(); } }, 4000); }
          } catch (e2) { voiceState = 'fail'; }
        }, 80);
      } catch (e) { voiceState = 'fail'; }
    }

    /* drawing */
    function topHtml() {
      var sub = S.phase === 'lobby' ? 'Join on your phone' : (S.phase === 'menu' ? 'Pick a game' : (S.phase === 'final' ? 'Final score' : 'Game ' + S.round + ' &middot; ' + esc(S.rt || '')));
      var mid = '<div class="logo">Game Show Night</div><div class="sub">' + sub + '</div>';
      function tm(t, small) { var ctrl = (S.turn && pteam(S.turn) === t) ? ' ctrl' : ''; return '<div class="tm t' + t + ctrl + (small ? ' sm' : '') + '"' + (small ? ' style="width:' + small + 'vw"' : '') + '><div class="tn">' + esc(tname(t)) + '</div><div class="ts">' + S.teams[t].score + '</div></div>'; }
      if (S.solo) { // no teams: the top bar shows who is first and second
        var rk = rankList();
        var sp = function (i, t) { var r = rk[i]; return '<div class="tm t' + t + (r && S.turn === r.p ? ' ctrl' : '') + '"><div class="tn">' + (r ? (i + 1) + '. ' + esc(r.n) : (i ? '2nd place' : '1st place')) + '</div><div class="ts">' + (r ? r.pts : 0) + '</div></div>'; };
        return sp(0, 0) + '<div class="mid">' + mid + '</div>' + sp(1, 1);
      }
      if (NT() === 2) { return tm(0) + '<div class="mid">' + mid + '</div>' + tm(1); }
      var h = '<div class="mid msm">' + mid + '</div>', w = NT() === 3 ? 22 : (NT() === 4 ? 17.5 : 14.2);
      for (var t = 0; t < NT(); t++) { h += tm(t, w); }
      return h;
    }
    function who(pid) { return '<span class="t' + (S.solo ? 0 : pteam(pid)) + 'c">' + esc(pname(pid)) + '</span>'; }
    function gainsHtml(rv) { // what a round just paid out: per team, or a head count in solo play
      if (S.solo) { return (rv.nok || 0) + (rv.nok === 1 ? ' player scores' : ' players score'); }
      var h = '';
      for (var t = 0; t < NT(); t++) { h += (t ? ' &nbsp; ' : '') + '<span class="t' + t + 'c">' + esc(tname(t)) + ' +' + (rv.gains[t] || 0) + '</span>'; }
      return h;
    }
    function ranksHtml(max) { // every player's own points, best first
      var rk = rankList(), h = '<div class="ranks">';
      for (var i = 0; i < rk.length && i < max; i++) { h += '<div class="rk"><b>' + (i + 1) + '</b><span class="t' + (S.solo ? (i === 0 ? 0 : 1) : rk[i].t) + 'c">' + esc(rk[i].n) + '</span><i>' + rk[i].pts + '</i></div>'; }
      return h + '</div>';
    }
    function hostStepHtml() { // nobody runs the night yet: only the host code is shown
        return '<div class="lobby"><div class="qr">' + qrFor(JOINURL + '&h=' + E.hostKey()) + '<div class="url">Host code: <b>' + esc(E.hostKey()) + '</b></div></div>' +
          '<div class="hoststep"><div class="h2">Step 1: the host scans this code</div><p>Only the person running game night scans it. That phone picks the games, starts and stops them, and manages players and teams.</p>' +
          '<p>Everyone else: wait. Your code comes next.</p>' + (S.order.length ? '<p>' + S.order.length + ' already in the room.</p>' : '') + '</div></div>';
    }
    function lobbyHtml() {
      var cols = [], nth2 = 0, n = S.solo ? 2 : NT(), t;
      for (t = 0; t < n; t++) { cols.push(''); }
      S.order.forEach(function (pid) { var p = S.players[pid]; if (!p) { return; } cols[S.solo ? (nth2++ % 2) : (p.t < n ? p.t : 0)] += '<div class="chip' + ((Date.now() - p.seen) > 30000 ? ' off' : '') + '">' + esc(p.n) + (pid === S.boss ? ' <small>HOST</small>' : '') + '</div>'; });
      var h = '<div class="lobby"><div class="qr">' + qrFor(JOINURL) + '<div class="url">' + esc(SHORT) + '</div><div class="code">' + ROOM + '</div></div><div class="teams">';
      for (t = 0; t < n; t++) { h += '<div class="col t' + t + '"><h3>' + (S.solo ? (t ? 'No teams' : 'Players') : esc(tname(t))) + '</h3>' + cols[t] + '</div>'; }
      return h + '</div></div><div class="lineup"><b>' + esc(pname(S.boss)) + '</b> is the host and starts the first game.</div>';
    }
    function gmenuHtml() {
      var h = '<div class="h2">Pick a game</div><div class="gmenu">';
      for (var i = 0; i < C.order.length; i++) { var k = C.order[i], n = S.played[k] || 0; h += '<button class="gtile' + (n ? ' done' : '') + '" data-a="s_game" data-v="' + k + '">' + esc(gameTitle(k)) + (n ? '<small>played</small>' : '') + '</button>'; }
      return h + '</div><div class="lineup">' + (S.boss ? '<b>' + esc(pname(S.boss)) + '</b> (the host) picks the game' : 'Pick here') + (S.short ? ' &middot; short games' : '') + ' &middot; ' + S.round + ' played so far</div>';
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
      var why = S.pickWhy === 'fast' ? 'Fastest on the last question, so you pick.' : (S.pickWhy === 'first' ? 'You start us off.' : 'Your turn to pick.');
      return h + '</div><div class="status go">' + esc(pname(S.turn)).toUpperCase() + ', IT IS YOUR TURN</div><div class="pickwhy">' + why + ' Pick a category and points on your phone.</div>' + timerHtml(25000);
    }
    function clueHtml() {
      var q = S.q, rv = S.phase === 'board_reveal' ? S.rv : null, h = '<div class="tag">' + esc(q.cat) + ' &middot; ' + q.val + '</div><div class="h2">' + esc(q.text) + '</div><div class="opts">';
      for (var i = 0; i < q.o.length; i++) { h += '<div class="opt o' + i + (rv ? (rv.a === i ? ' win' : ' dim') : '') + '"><span class="l">' + 'ABCD'.charAt(i) + '</span>' + esc(q.o[i]) + (rv ? '<span class="n">' + rv.counts[i] + '</span>' : '') + '</div>'; }
      h += '</div>';
      if (rv) { h += '<div class="status">' + (rv.nok ? gainsHtml(rv) + ' &nbsp; Fastest: ' + esc(rv.fast) + ' +' + rv.bonus : 'Nobody got it') + '</div>'; }
      else { h += '<div class="status">Everyone answers on their phone. ' + waitHtml() + '</div>' + timerHtml(26000); }
      return h;
    }
    function zoomSide() {
      var z = S.z, side;
      if (S.phase === 'zoom_reveal') { side = '<div class="answer">' + esc(S.rv.text) + '</div><div class="status">' + (S.rv.who ? '<span class="t' + S.rv.team + 'c">' + esc(S.rv.who) + '</span> +' + S.rv.val : 'No points') + '</div>'; }
      else if (S.phase === 'zoom_ans') { side = '<div class="tag yel">Worth</div><div class="zval" id="zval"></div><div class="status">' + who(S.turn) + ' is answering' + (S.bzr && S.bzr.length ? '<br><small>fastest finger: ' + secs(S.bzr[0].dt) + '</small>' : '') + '</div>'; }
      else if (S.bzw) { side = '<div class="tag yel">Worth</div><div class="zval" id="zval"></div><div class="status go">BUZZ!</div>'; }
      else { side = '<div class="tag yel">Worth</div><div class="zval" id="zval"></div><div class="status wait" data-open="' + S.openAt + '" data-go="1" data-on="GO! Buzz when you know it" data-off="WAIT for GO...">WAIT for GO...</div><div class="pickwhy">Early buzz: lose 50</div>'; }
      return '<div class="tag">Picture ' + z.n + ' of ' + z.of + '</div><br>' + side;
    }
    function zoomPic() {
      var z = S.z, F = 1.6, a = z.w / z.h, wp = a >= F ? 100 : 100 * a / F, hp = a >= F ? 100 * F / a : 100;
      var base = 'img/zoom/' + z.img;
      var box = 'left:' + ((100 - wp) / 2).toFixed(3) + '%;top:' + ((100 - hp) / 2).toFixed(3) + '%;width:' + wp.toFixed(3) + '%;height:' + hp.toFixed(3) + '%';
      return '<div class="zf"><div class="zbg" style="background-image:url(' + base + '_s.jpg)"></div>' +
        '<div class="zi" id="zimg" style="' + box + '"><img class="zphoto" src="' + base + '_s.jpg" alt=""><img class="zphoto zsharp" id="zsharp" src="' + base + '.jpg" alt="" style="opacity:0"></div>' +
        '<div class="zload" id="zload" style="display:none">The picture did not load. Host: tap Skip.</div></div>' +
        '<div class="zcredit" id="zcredit" style="visibility:hidden">Photo: ' + esc(z.by) + (z.lic ? ', ' + esc(z.lic) : '') + ', via Wikimedia Commons</div>';
    }
    // the shell stays the same for the whole picture, so the photo is never rebuilt while it zooms
    function zoomHtml() { return '<div class="zwrap" data-img="' + S.z.img + S.z.n + '"><div class="zcol" id="zpic"></div><div class="zside" id="zsidebox"></div></div>'; }
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
        h += '<div class="status">' + lastTxt + (S.solo ? who(S.turn) + ', pick a letter' : '<span class="t' + S.pteam + 'c">' + esc(tname(S.pteam)) + '</span>: anyone on the team, tap a letter') + '<br><small>Anyone in the room can hit SOLVE at any time</small></div>' + timerHtml(14000);
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
      if (S.phase === 'feud_face') { h += S.bzw ? '<div class="status go">BUZZ!</div>' : '<div class="status wait" data-open="' + S.openAt + '" data-go="1" data-on="GO! BUZZ NOW!" data-off="WAIT for GO...">WAIT for GO...</div><div class="pickwhy">Early buzz: lose 50</div>'; }
      else if (S.phase === 'feud_pick') { h += '<div class="status">' + who(S.turn) + ', pick an answer on your phone' + (f.mode !== 'face' && f.nx ? '<br><small>Next up if that is right: ' + esc(f.nx) + '. A miss passes to the next team.</small>' : '') + (f.mode === 'face' && S.bzr && S.bzr.length ? '<br><small>fastest finger: ' + secs(S.bzr[0].dt) + '</small>' : '') + '</div>'; }
      else { h += '<div class="status">' + (S.rv.solo ? 'Board finished' : 'Board finished. Points were scored as each answer was found.') + '</div>'; }
      return h + '</div></div>' + (S.phase === 'feud_pick' ? timerHtml(f.mode === 'steal' ? 25000 : (f.mode === 'face' ? 14000 : 18000)) : '');
    }
    function barsHtml() {
      var max = 1, t, h = '<div class="bars' + (NT() > 3 ? ' many' : '') + '">';
      for (t = 0; t < NT(); t++) { if (S.teams[t].score > max) { max = S.teams[t].score; } }
      for (t = 0; t < NT(); t++) { h += '<div class="bar"><div class="bn t' + t + 'c">' + esc(tname(t)) + '</div><div class="bt"><div class="bf t' + t + '" style="width:' + Math.max(8, Math.round(100 * Math.max(0, S.teams[t].score) / max)) + '%">' + S.teams[t].score + '</div></div></div>'; }
      return h + '</div>';
    }
    function stageHtml() {
      var ph = S.phase;
      if (!S.boss && (ph === 'lobby' || ph === 'menu')) { return hostStepHtml(); }
      if (ph === 'lobby') { return lobbyHtml(); }
      if (ph === 'menu') { return gmenuHtml(); }
      if (ph === 'intro') { var how = ''; S.intro.how.forEach(function (x) { how += '<div>' + esc(x) + '</div>'; }); return '<div class="tag red">Game ' + S.intro.n + '</div><div class="h1">' + esc(S.intro.title) + '</div><div class="how">' + how + '</div>' + timerHtml(20000); }
      if (ph === 'vote_q' || ph === 'vote_reveal') { return voteHtml(); }
      if (ph === 'ml_q') { return '<div class="tag">Question ' + S.ml.n + ' of ' + S.ml.of + '</div><div class="h2">' + esc(S.ml.text) + '</div><div class="status">Vote on your phone. ' + waitHtml() + '</div>' + timerHtml(26000); }
      if (ph === 'ml_reveal') {
        var tl = ''; S.rv.top.forEach(function (x) { tl += (tl ? ', ' : '') + esc(x.n) + ' ' + x.c; });
        return '<div class="h2">' + esc(S.ml.text) + '</div><div class="answer">' + (S.rv.win.length ? esc(S.rv.win.join(' and ')) : 'No votes') + '</div><div class="tally">' + tl + '</div>' +
          '<div class="status">' + gainsHtml(S.rv) + '</div>';
      }
      if (ph === 'fam_in') {
        var fd = S.fam && S.fam.done ? S.fam.done : [], fdh = '';
        for (var fi = 0; fi < fd.length; fi++) { fdh += '<span class="famin">' + esc(fd[fi]) + '</span>'; }
        return '<div class="tag">Know Your Family</div><div class="h2">Type one true thing about yourself<br>that most people here do not know</div><div class="famlist">' + (fdh || '<span class="famwait">Nobody yet</span>') + '</div><div class="status">' + waitHtml().replace('answered', 'sent in') + '</div>' + timerHtml(150000);
      }
      if ((ph === 'fam_q' || ph === 'fam_rv') && S.fq) {
        var fq = S.fq, frv = ph === 'fam_rv' ? S.rv : null;
        var fh = '<div class="tag">Person ' + fq.n + ' of ' + fq.of + '</div><div class="h2">Which one is true about <span class="t' + (S.solo ? 1 : fq.t) + 'c">' + esc(fq.name) + '</span>?</div><div class="opts fam">';
        for (var fo = 0; fo < fq.o.length; fo++) { fh += '<div class="opt o' + fo + (frv ? (frv.a === fo ? ' win' : ' dim') : '') + '"><span class="l">' + 'ABCD'.charAt(fo) + '</span><span class="ft">' + esc(fq.o[fo]) + '</span>' + (frv ? '<span class="n">' + frv.counts[fo] + '</span>' : '') + '</div>'; }
        fh += '</div>';
        if (frv) { fh += '<div class="status">' + (frv.voters ? frv.nok + ' of ' + frv.voters + ' knew it' + (frv.bonus ? ' &nbsp;&middot;&nbsp; ' + esc(fq.name) + ' fooled ' + frv.fooled + ': +' + frv.bonus : '') + (S.solo ? '' : '<br>' + gainsHtml(frv)) : 'Nobody voted') + '</div>'; }
        else { fh += '<div class="status">' + esc(fq.name) + ' does not vote. ' + waitHtml() + '</div>' + timerHtml(44000); }
        return fh;
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
      if (ph === 'board_q' || ph === 'board_reveal') { return clueHtml(); }
      if (ph === 'zoom_q' || ph === 'zoom_ans' || ph === 'zoom_reveal') { return zoomHtml(); }
      if (ph === 'phrase_turn' || ph === 'phrase_solve' || ph === 'phrase_reveal') { return phraseHtml(); }
      if (ph === 'feud_face' || ph === 'feud_pick' || ph === 'feud_reveal') { return feudHtml(); }
      if (ph === 'cr_q') { return '<div class="tag">Question ' + S.cr.n + ' of ' + S.cr.of + '</div><div class="h2">' + esc(S.cr.text) + '</div><div class="status">Type the most obscure right answer you can. ' + waitHtml() + '</div>' + timerHtml(46000); }
      if (ph === 'cr_judge' || ph === 'cr_reveal') {
        var rows = S.cr.rows, two = rows.length > 6, ch = '<div class="h2">' + esc(S.cr.text) + '</div><div class="crl' + (two ? ' two' : '') + '">';
        for (var ci = 0; ci < rows.length && ci < 12; ci++) {
          var r = rows[ci], right;
          if (r.st === 'ask') { right = '<i class="ask">judge?</i>'; }
          else if (ph === 'cr_judge') { right = '<i class="ask">...</i>'; }
          else if (r.st === 'ok') { right = '<small>' + esc(r.tier) + (r.dup > 1 ? ', split ' + r.dup + ' ways' : '') + (r.crown ? ' +50 crown' : '') + '</small><i>' + r.pts + '</i>'; }
          else { right = '<small>' + esc(r.why || 'not accepted') + '</small><i class="bad">0</i>'; }
          ch += '<div class="crr' + (ph === 'cr_reveal' && r.st !== 'ok' ? ' out' : '') + '"><span class="t' + (S.solo ? 1 : r.t) + 'c">' + esc(r.n) + '</span><b>' + esc(r.text) + (ph === 'cr_reveal' && r.st === 'ok' && r.name.toLowerCase() !== String(r.text).toLowerCase().replace(/^\s+|\s+$/g, '') ? ' <em>= ' + esc(r.name) + '</em>' : '') + '</b>' + right + '</div>';
        }
        ch += '</div>';
        if (ph === 'cr_judge') { return ch + '<div class="status go">The judge is deciding</div>' + timerHtml(75000); }
        return ch + '<div class="status">' + (S.rv.allSame ? 'Everybody said the same thing. ' : (S.rv.who ? 'Most obscure: ' + esc(S.rv.who) + '. ' : '')) + (S.solo ? '' : gainsHtml(S.rv)) + '</div>';
      }
      if (ph === 'round_end') { return '<div class="tag">Scores after</div><div class="h2">' + esc(S.re.title) + '</div>' + (S.solo ? '' : barsHtml()) + ranksHtml(S.solo ? 12 : (NT() > 3 ? 3 : 6)); }
      if (ph === 'final') {
        var conf = '', cols = ['#F0643A', '#5BC0EB', '#F9D648', '#7BD389'];
        for (var i = 0; i < 28; i++) { conf += '<div class="conf" style="left:' + ((i * 37) % 100) + '%;background:' + cols[i % 4] + ';-webkit-animation-delay:' + ((i * 0.23) % 3.4) + 's;animation-delay:' + ((i * 0.23) % 3.4) + 's"></div>'; }
        var f = S.fin;
        if (f.solo) { return conf + '<div class="h1">' + (f.tie ? 'A tie at the top!' : '<span class="t0c">' + esc(f.champ) + '</span> wins!') + '</div>' + ranksHtml(12) + '<div class="status">' + (f.king ? 'Fastest buzzer: ' + esc(f.king) + ' (' + f.kingN + ')' : '') + '</div>'; }
        return conf + '<div class="h1">' + (f.winner < 0 ? 'It is a tie!' : '<span class="t' + f.winner + 'c">' + esc(tname(f.winner)) + '</span> win!') + '</div>' + barsHtml() + ranksHtml(NT() > 3 ? 3 : 6) +
          '<div class="status">' + (f.king ? 'Fastest buzzer: ' + esc(f.king) + ' (' + f.kingN + ')' : '') + '</div>';
      }
      return '';
    }
    function render() {
      S = E.state();
      put('top', topHtml());
      // zoom keeps one DOM node per picture so the image does not flicker while it zooms
      var st = stageHtml();
      if (put('stage', st)) { cache.zpic = null; cache.zsidebox = null; }
      if (S.z && (S.phase === 'zoom_q' || S.phase === 'zoom_ans' || S.phase === 'zoom_reveal')) {
        if (E._private && E._private().zs) { zoomPreload(E._private().zs); }
        put('zpic', zoomPic()); put('zsidebox', zoomSide());
      }
      put('bubble', esc(S.phase === 'lobby' || !S.say.text ? (S.boss ? 'Scan the code with your phone camera to join. ' + pname(S.boss) + ' is the host.' : 'Host, scan the code with your phone camera to take control.') : S.say.text));
      if (S.fs && S.fs.id !== lastFs) { lastFs = S.fs.id; cache.toast = null; put('toast', '<div class="toast">' + esc(S.fs.n) + ' buzzed before GO. Minus 50.</div>'); }
      put('joinbox', 'Join at ' + esc(SHORT) + '<br>Room <b>' + ROOM + '</b><br>Relay ' + dotsHtml() + (net.up ? '' : ' connecting...') + (soundLine() ? '<br><span class="sline' + (voiceState === 'ok' && soundOn ? '' : ' bad') + '">' + soundLine() + '</span>' : ''));
      put('pausel', S.paused ? '<div class="paused">PAUSED</div>' : '');
      put('menu', menuOpen ? '<div class="menu">' +
        '<button data-a="s_next">' + (S.phase === 'lobby' ? 'Open the game menu' : 'Next') + '</button><button data-a="s_pause">' + (S.paused ? 'Resume' : 'Pause') + '</button>' +
        '<button data-a="s_skip">Pick a different game</button><button data-a="s_end">Finish and show the winner</button><button data-a="s_sound">Sound: ' + (soundOn ? 'on' : 'off') + '</button><button data-a="s_test">Test the sound</button><button data-a="s_voice">Voice: ' + (voice ? esc(voice.name.replace(/Microsoft |Google | - English.*| Online \(Natural\)/g, '')) + ' (' + (voiceIdx + 1) + ' of ' + voiceList.length + ') - change' : 'none in this browser') + '</button><button data-a="s_full">Full screen</button>' +
        '<button data-a="s_restart">Restart this game</button><button data-a="s_again">New night, same players</button><button data-a="s_reset">Start over: everyone joins again</button>' +
        '<button data-a="s_unhost">Change the host (new host code)</button><button data-a="s_menu">Close</button></div>' : '');
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
        try { if (RC.avatar) { RC.avatar.start(); } } catch (e4) { }
        setTimeout(function () { speak('Sound check. I am Ace, your host. If you can hear me, we are good to go.'); }, 900);
      }
      else if (a === 's_menu') { menuOpen = !menuOpen; }
      else if (a === 's_next') { E.cmd('next', null, now); menuOpen = false; }
      else if (a === 's_pause') { E.cmd('pause', null, now); }
      else if (a === 's_skip') { E.cmd('menu', null, now); menuOpen = false; }
      else if (a === 's_end') { E.cmd('end', null, now); menuOpen = false; }
      else if (a === 's_game') { E.cmd('play', { key: v }, now); menuOpen = false; }
      else if (a === 's_again') { E.cmd('again', null, now); menuOpen = false; }
      else if (a === 's_restart') { E.cmd('restart', null, now); menuOpen = false; }
      else if (a === 's_reset') { E.cmd('reset', null, now); menuOpen = false; }
      else if (a === 's_unhost') { E.cmd('unhost', null, now); if (S.phase !== 'lobby') { E.cmd('menu', null, now); } menuOpen = false; }
      else if (a === 's_voice') {
        if (voiceList.length) { voiceIdx = (voiceIdx + 1) % voiceList.length; voice = voiceList[voiceIdx]; try { localStorage.setItem('gn_voice', voice.name); } catch (e5) { } speak('Hello! This is how I sound now. Rather lovely, do you not think?'); }
      }
      else if (a === 's_test') {
        try { if (actx && actx.resume) { actx.resume(); } } catch (e3) { }
        voiceState = voiceState === 'ok' ? 'ok' : 'wait'; sfx('win');
        setTimeout(function () { speak('This is a sound test. If you can hear me, the sound works.'); }, 1400);
      }
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
    var ui = { name: lsGet('rc_name') || '', team: -1, joined: false, menu: false, sent: null, failK: '', rtt: 0, lastE: 0, ep: 0, h: '', confirm: '' };
    if (qs.h) { lsSet('gn_h_' + ROOM, qs.h); }
    ui.h = qs.h || lsGet('gn_h_' + ROOM) || '';   // the host key, if this phone scanned the host code
    if (lsGet('rc_room') === ROOM && ui.name && !qs.pid) { ui.joined = true; ui.team = +lsGet('rc_team') || 0; ui.ep = +lsGet('gn_ep') || 0; }
    var lastSeq = 0, lastBoot = 0, lastState = 0, pending = null, offCur = null, offPrev = null, offAt = 0, lastKick = Date.now();
    app.innerHTML = '<div class="ph"><div id="pbanner"></div><div id="ptop"></div><div id="pnote"></div><div class="pbody" id="pbody"></div><div id="psheet"></div><div id="pboss"></div></div>';

    function send(m) { m.p = pid; m.i = rid(10); netSend('in', JSON.stringify(m), false); } // a fresh id every time, so a retry is never mistaken for a duplicate
    function hello() { if (ui.joined && ui.name) { var hm = { t: 'hello', name: ui.name, team: ui.team, ep: ui.ep, ts: Date.now(), rtt: ui.rtt }; if (ui.h) { hm.h = ui.h; } send(hm); } }
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
      // optional: the host's phone speaks Ace's lines (for TVs whose browser has no voice, such as Samsung's)
      if (ui.pvoice && S.say && S.say.id !== ui.lastSay) { ui.lastSay = S.say.id; phoneSpeak(S.say.text); }
      var mine = S.players[pid];
      // The host started the night over: this phone has to join again and pick a team.
      if (ui.joined && !mine && ui.ep !== S.epoch && !(S.out && S.out[pid])) { ui.joined = false; ui.team = -1; ui.menu = false; lsSet('rc_room', ''); }
      if (mine && !S.solo) { ui.team = mine.t; }
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
    function buzzBtn() {
      var s = sentHere();
      if (s) { return '<button class="buzz sent" disabled>BUZZED</button>'; }
      if (ui.earlyUntil && Date.now() < ui.earlyUntil) { return '<button class="buzz sent" disabled>TOO EARLY<br>-50</button><p class="small">Wait for GO. You can buzz again in a moment.</p>'; }
      return '<button class="buzz wait" data-a="buzz" data-open="' + (S.openAt || 0) + '" data-on="GO!" data-off="WAIT">WAIT</button><p class="small">Tap only after it turns green and says GO. Every early tap costs 50 points.</p>';
    }
    function earlyHtml() { return '<h2>Too early!</h2><p>You tapped before GO and lose 50 points.</p>' + watch(); }
    function teamBtns(action, cur) {
      var h = '';
      for (var t = 0; t < NT(); t++) { h += '<button class="pbtn c tb' + t + (cur === t ? ' sel' : '') + '" data-a="' + action + '" data-v="' + t + '">' + esc(tname(t)) + '</button>'; }
      return h;
    }
    function optBtns(opts, a) { var h = ''; for (var i = 0; i < opts.length; i++) { h += '<button class="pbtn dark" data-a="' + a + '" data-v="' + opts[i].i + '">' + esc(opts[i].text) + '</button>'; } return h; }
    function watch(extra) { return '<div class="watch">Eyes on the TV</div>' + (extra ? '<p>' + extra + '</p>' : ''); }

    function joinHtml() {
      var top = '<h2>Join Game Show Night</h2><p>Room ' + ROOM + (ui.h ? ' &middot; you are the host' : '') + '</p>' +
        '<input class="field" id="nm" maxlength="14" placeholder="Your first name" value="' + esc(ui.name) + '" autocomplete="off">';
      var hk = (!S.boss && !ui.h) ? '<input class="field sm" id="hk" maxlength="8" placeholder="Host code (host only)" autocomplete="off" autocapitalize="none" autocorrect="off">' : '';
      if (S.solo) { return top + hk + '<button class="pbtn go" data-a="join">I am in</button>'; }   // no teams tonight: a name is all we need
      return top + '<p>Pick your team</p>' + teamBtns('team', ui.team) + hk + '<button class="pbtn go" data-a="join"' + (ui.team < 0 ? ' disabled' : '') + '>I am in</button>';
    }
    function modeHtml() {
      var h = '<h3 class="big3">Teams tonight</h3><div class="half modes">';
      h += '<button class="pbtn plain c wide' + (S.solo ? ' sel' : '') + '" data-a="c_solo" data-v="1">No teams</button>';
      for (var n = 2; n <= 5; n++) { h += '<button class="pbtn plain c' + (!S.solo && NT() === n ? ' sel' : '') + '" data-a="c_nteams" data-v="' + n + '">' + n + ' teams</button>'; }
      return h + (S.solo ? '' : '<button class="pbtn plain c wide" data-a="c_shuffle">Shuffle everyone into even teams</button>') + '</div>';
    }
    function teamSetupHtml() { // the host decides: no teams, or 2 to 5 teams with names, and who goes where
      var h = modeHtml(), t;
      if (S.solo) { return h + '<p class="small">Everyone plays for themselves. Tap a number of teams to split the room up; you can do it after everybody has joined.</p>'; }
      h += '<h3>Team names</h3>';
      for (t = 0; t < NT(); t++) { h += '<div class="trow"><span class="tdot tb' + t + ' on">' + (t + 1) + '</span><input class="field sm" data-hold="1" id="ln' + t + '" maxlength="14" value="' + esc(tname(t)) + '"></div>'; }
      h += '<div class="half"><button class="pbtn plain c" data-a="c_lnames">Save team names</button>' + (NT() === 2 ? '<button class="pbtn plain c" data-a="c_preset">Kids vs Adults</button>' : '') + '</div>';
      h += '<h3>Who is on which team</h3><p class="small">Tap a team next to a name to move that person. People can also tap their own team on their phone before the first game.</p>';
      S.order.forEach(function (id) {
        var p = S.players[id]; if (!p) { return; }
        h += '<div class="prow"><div class="pn"><b>' + esc(p.n) + '</b></div><div class="pt">';
        for (t = 0; t < NT(); t++) { h += '<button class="tdot tb' + t + (p.t === t ? ' on' : '') + '" data-a="c_move" data-v="' + esc(id) + ',' + t + '">' + esc(tname(t).substring(0, 8)) + '</button>'; }
        h += '</div></div>';
      });
      return h;
    }
    function phoneSpeak(text) {
      try {
        var syn = window.speechSynthesis; if (!syn || !window.SpeechSynthesisUtterance) { return; }
        var vs = syn.getVoices(), best = null, bs = -1, i, sc;
        for (i = 0; i < vs.length; i++) { sc = /en[-_]GB/i.test(vs[i].lang) ? 100 : (/^en/i.test(vs[i].lang) ? 10 : -1); if (/natural|neural|online|enhanced|premium/i.test(vs[i].name)) { sc += 50; } if (sc > bs) { bs = sc; best = vs[i]; } }
        if (syn.speaking || syn.pending) { syn.cancel(); }
        setTimeout(function () { try { var u = new window.SpeechSynthesisUtterance(text); u.lang = best ? best.lang : 'en-GB'; if (best) { u.voice = best; } u.rate = 1; syn.speak(u); } catch (e) { } }, 80);
      } catch (e2) { }
    }
    function myRank() { var rk = rankList(); for (var i = 0; i < rk.length; i++) { if (rk[i].p === pid) { return i + 1; } } return 0; }
    function standing() { // one line of score, for whichever way the show is being played
      if (S.solo) { var rk = rankList(); return '<p>' + (rk.length ? esc(rk[0].n) + ' leads with ' + rk[0].pts + '. ' : '') + 'You are number ' + myRank() + ' with ' + (me() ? me().pts : 0) + '.</p>'; }
      var h = '<p>';
      for (var t = 0; t < NT(); t++) { h += (t ? ' &middot; ' : '') + esc(tname(t)) + ' ' + S.teams[t].score; }
      return h + '</p>';
    }
    function pickerHtml() {
      var h = '<h3 class="big3">Tap a game to start it</h3><div class="glist">';
      for (var i = 0; i < C.order.length; i++) { var k = C.order[i], n = S.played[k] || 0; h += '<button class="pbtn gbig' + (n ? ' done' : '') + '" data-a="c_play" data-v="' + k + '"><span>' + esc(gameTitle(k)) + '</span>' + (n ? '<small>played</small>' : '') + '</button>'; }
      h += '</div><button class="pbtn plain c' + (S.short ? ' sel' : '') + '" data-a="c_short">Short games: ' + (S.short ? 'on' : 'off') + '</button>';
      h = S.phase === 'lobby' ? teamSetupHtml() + h : h + teamSetupHtml();   // before the first game, teams come first
      if (S.round > 0) { h += '<button class="pbtn plain c" data-a="c_end">Finish the night and show the winner</button>'; }
      return h + '<p class="small">More controls are under the Host button at the bottom: move or remove players, team names, restart.</p>';
    }
    function locked(text) { // shared by every "everyone answers" screen
      var s = sentHere();
      if (S.acted && S.acted[pid]) { return '<h2>' + text + (s && s.label ? ': ' + esc(s.label) : '') + '</h2>' + watch('Waiting for the others.'); }
      if (s) { return '<h2>Sending...</h2><p>Hold on a second.</p>'; }
      return '';
    }
    function lobbyHtml() {
      var m = me(), lists = [], t, isBoss = S.boss === pid;
      for (t = 0; t < NT(); t++) { lists.push(''); }
      S.order.forEach(function (id) { var p = S.players[id]; if (p) { lists[S.solo ? 0 : (p.t < NT() ? p.t : 0)] += esc(p.n) + (id === S.boss ? ' (host)' : '') + '<br>'; } });
      var h = '<h2>You are in, ' + esc(m.n) + '!</h2>' + (isBoss ? '' : '<p>' + (S.boss ? esc(pname(S.boss)) + ' is the host and will start the first game.' : 'Waiting for the host.') + '</p>');
      if (S.solo) { h += '<div class="plist"><b class="t0c">Players</b>' + lists[0] + '</div>'; }
      else {
        h += '<div class="plist">';
        for (t = 0; t < NT(); t++) { h += '<b class="t' + t + 'c">' + esc(tname(t)) + '</b>' + (lists[t] || '<span class="small">nobody yet</span>'); }
        h += '</div><p class="small">Want a different team? Tap it.</p>' + teamBtns('switch', m.t);
      }
      if (isBoss) { h += '<h2>You are the host</h2><p>When everyone is in, set up teams if you want them, then tap a game. After each game you come back to this list.</p>' + pickerHtml(); }
      return h;
    }
    function bodyHtml() {
      if (!S) { return '<h2>Looking for the TV...</h2><p>Make sure the TV shows room ' + ROOM + '.</p>'; }
      if (S.out && S.out[pid]) { return '<h2>You are out of this game</h2><p>The host took you out. Ask the host to let you back in.</p>'; }
      if (!ui.joined) { return joinHtml(); }
      var m = me();
      if (!m) { return '<h2>Joining...</h2><p>Hang on, ' + esc(ui.name) + '.</p>'; }
      var ph = S.phase, mine = S.turn === pid, s = sentHere(), h = '';
      if (ph === 'lobby') { return lobbyHtml(); }
      if (ph === 'menu') {
        var sc = standing();
        if (S.boss === pid) { return '<h2>Pick the next game</h2>' + sc + pickerHtml(); }
        return '<h2>' + (S.boss ? esc(pname(S.boss)) : 'The host') + ' is picking the next game</h2>' + sc + watch();
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
        for (var w = 0; w < S.ml.who.length; w++) { h += '<button class="pbtn plain c who" data-a="mlv" data-v="' + esc(S.ml.who[w].p) + '">' + esc(S.ml.who[w].n) + '</button>'; }
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
        return '<p class="small">Hint: ' + esc(S.ws.hint) + '</p><div class="pmask big2">' + esc(S.ws.mix) + '</div><input class="field" id="wordin" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="The word"><button class="pbtn go" data-a="word">Send</button><p class="small">Close spelling counts.</p>';
      }
      if (ph === 'scr_reveal') { return '<h2>' + esc(S.rv.text) + '</h2>' + watch(); }
      if (ph === 'board_pick') {
        var whyP = S.pickWhy === 'fast' ? ' was fastest on the last question, so ' : ' ';
        if (!mine) { return '<h2>' + esc(pname(S.turn)) + ' is picking</h2><p>' + esc(pname(S.turn)) + whyP + 'picks the next question. Then everyone answers.</p>' + watch(); }
        h = '<h2 class="turn">YOUR TURN, ' + esc(m.n) + '!</h2><p>' + (S.pickWhy === 'fast' ? 'You were fastest on the last question. ' : '') + 'Pick a category and a point value.</p><div class="tiles">';
        for (var c = 0; c < S.board.cats.length; c++) {
          h += '<div class="tc"><div class="th">' + esc(S.board.cats[c]) + '</div>';
          for (var l = 0; l < 4; l++) { h += '<button data-a="tile" data-v="' + c + ',' + l + '"' + (S.board.used[c][l] ? ' disabled' : '') + '>' + ((l + 1) * 100) + '</button>'; }
          h += '</div>';
        }
        return h + '</div>';
      }
      if (ph === 'board_q') {
        lk = locked('Locked in'); if (lk) { return lk; }
        var bo = []; for (var bi = 0; bi < S.q.o.length; bi++) { bo.push({ i: bi, text: S.q.o[bi] }); }
        return '<p class="small">' + esc(S.q.cat) + ' for ' + S.q.val + '. Everyone answers. Take your time.</p><div class="q">' + esc(S.q.text) + '</div>' + optBtns(bo, 'ans');
      }
      if (ph === 'zoom_q') {
        if (S.locked[S.solo ? pid : m.t]) { return '<h2>' + (S.solo ? 'You are locked out' : 'Your team is locked out') + '</h2>' + watch(S.solo ? 'The others get a try.' : 'The other team gets a try.'); }
        if (S.early && S.early[pid]) { return earlyHtml(); }
        return '<h2>What place is this?</h2>' + buzzBtn();
      }
      if (ph === 'zoom_ans') {
        if (!mine) { return '<h2>' + esc(pname(S.turn)) + ' was fastest</h2>' + watch(); }
        if (s) { return '<h2>' + esc(s.label) + '</h2>' + watch(); }
        return '<h2>You were fastest! Now pick.</h2><p class="small">A wrong answer costs 50 points.</p><div class="gap"></div>' + optBtns(S.opts, 'ans');
      }
      if (ph === 'board_reveal') {
        var mineB = S.rv.fast === m.n;
        return '<h2>' + esc(S.rv.text) + '</h2>' + (S.rv.nok ? '<p>' + S.rv.nok + (S.rv.nok === 1 ? ' player' : ' players') + ' got it.' + (mineB ? ' You were fastest!' : '') + '</p>' : '<p>Nobody got it.</p>') + watch();
      }
      if (ph === 'zoom_reveal') { return '<h2>' + esc(S.rv.text) + '</h2>' + watch(); }
      if (ph === 'phrase_turn') {
        var mask = '<div class="pmask">' + esc(S.ph.mask.join('')) + '</div>';
        var myGo = S.solo ? mine : m.t === S.pteam;
        if (myGo && !s) {
          h = '<h2>' + (S.solo ? 'Pick a letter' : 'Your team picks: tap a letter') + '</h2>' + mask + '<div class="keys">';
          for (var k = 0; k < 26; k++) { var L = LETTERS.charAt(k); h += '<button data-a="letter" data-v="' + L + '"' + (S.used.indexOf(L) >= 0 ? ' disabled' : '') + '>' + L + '</button>'; }
          h += '</div>';
        } else { h = '<h2>' + (myGo ? 'Sent' : (S.solo ? esc(pname(S.turn)) : esc(tname(S.pteam))) + ' picks a letter') + '</h2><p class="small">You can still solve it.</p>' + mask; }
        if (S.slock[S.solo ? pid : m.t]) { h += '<p class="small">' + (S.solo ? 'You' : 'Your team') + ' guessed wrong. Wait for the next letter to solve.</p>'; }
        else if (!s) { h += '<button class="pbtn go" data-a="buzz">I CAN SOLVE IT</button>'; }
        return h;
      }
      if (ph === 'phrase_solve') {
        if (S.solver !== pid) { return '<h2>' + esc(pname(S.solver)) + ' is solving</h2>' + watch(); }
        if (s) { return '<h2>Sent</h2>' + watch(); }
        return '<h2>Type the whole phrase</h2><div class="pmask">' + esc(S.ph.mask.join('')) + '</div><input class="field" id="solve" autocomplete="off" autocapitalize="characters" placeholder="THE PHRASE" style="font-size:20px"><button class="pbtn go" data-a="solve">Solve</button><p class="small">Close spelling counts.</p>';
      }
      if (ph === 'phrase_reveal') { return '<h2>' + esc(S.rv.text) + '</h2>' + watch(); }
      if (ph === 'feud_face') { if (S.early && S.early[pid]) { return earlyHtml(); } return '<div class="q">' + esc(S.f.q) + '</div>' + buzzBtn(); }
      if (ph === 'feud_pick') {
        if (!mine) { return '<h2>' + esc(pname(S.turn)) + ' is choosing</h2>' + watch(pteam(S.turn) === m.t ? 'Help your teammate. Shout it out!' : ''); }
        if (s) { return '<h2>' + esc(s.label) + '</h2>' + watch(); }
        h = '<h2>' + (S.f.mode === 'steal' ? 'Steal! One guess.' : 'What did most people say?') + '</h2><div class="q">' + esc(S.f.q) + '</div>';
        for (var o = 0; o < S.f.o.length; o++) { if (S.f.tried.indexOf(o) < 0) { h += '<button class="pbtn plain c" data-a="fpick" data-v="' + o + '">' + esc(S.f.o[o]) + '</button>'; } }
        return h;
      }
      if (ph === 'feud_reveal' || ph === 'round_end') { return '<h2>Scores</h2>' + standing() + (S.solo ? '' : '<p>You have ' + m.pts + ' points of your own, number ' + myRank() + ' of ' + S.order.length + '.</p>') + watch(); }
      if (ph === 'fam_in') {
        lk = locked('Got it. Your secret is safe'); if (lk) { return lk; }
        return '<div class="q">One true thing about you that most people here do not know</div><p class="small">One short sentence that starts with "I". Example: I once lived on a boat. The game will hide it among three made-up ones, so do not tell anyone.</p><input class="field fact" id="famin" maxlength="100" autocomplete="off" placeholder="I ..."><div class="half"><button class="pbtn go" data-a="fam" data-v="1">Send<br><small>I am a kid</small></button><button class="pbtn go" data-a="fam" data-v="0">Send<br><small>I am a grown-up</small></button></div>';
      }
      if (ph === 'fam_q' && S.fq) {
        if (S.fq.who === pid) { return '<h2>This one is about you</h2><p>Keep a straight face. You score for every person you fool.</p>' + watch(); }
        lk = locked('Vote locked in'); if (lk) { return lk; }
        h = '<div class="q">Which one is true about ' + esc(S.fq.name) + '?</div>';
        for (var fo2 = 0; fo2 < S.fq.o.length; fo2++) { h += '<button class="pbtn o' + fo2 + ' fact" data-a="famv" data-v="' + fo2 + '">' + 'ABCD'.charAt(fo2) + '. ' + esc(S.fq.o[fo2]) + '</button>'; }
        return h;
      }
      if (ph === 'fam_rv' && S.fq) {
        if (S.fq.who === pid) { return '<h2>You fooled ' + S.rv.fooled + ' of ' + S.rv.voters + '</h2><p>' + (S.rv.bonus ? 'That is worth ' + S.rv.bonus + ' points.' : 'They know you too well.') + '</p>' + watch(); }
        return '<h2>' + (S.rv.okp && S.rv.okp[pid] ? 'You knew it! +100' : 'Fooled you') + '</h2><p>True: ' + esc(S.fq.o[S.rv.a]) + '</p>' + watch();
      }
      if (ph === 'cr_q') {
        lk = locked('Answer locked in'); if (lk) { return lk; }
        return '<div class="q">' + esc(S.cr.text) + '</div><p class="small">One answer. The most obscure right answer wins. Spelling does not matter. If someone else types the same thing, you split the points.</p><input class="field" id="crin" maxlength="40" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Your answer"><button class="pbtn go" data-a="cr">Lock it in</button>';
      }
      if (ph === 'cr_judge') {
        if (S.boss !== pid) { return '<h2>The judge is deciding</h2>' + watch(); }
        h = '<h2>You are the judge</h2><p>These answers are not on the answer sheet. Is each one correct? Spelling does not matter.</p><div class="q">' + esc(S.cr.text) + '</div>';
        var askSeen = {};
        S.cr.rows.forEach(function (r) {
          var key = String(r.text).toLowerCase().replace(/[^a-z0-9]/g, '');
          if (r.st !== 'ask' || askSeen[key]) { return; }
          askSeen[key] = 1;
          var names = []; S.cr.rows.forEach(function (o) { if (o.st === 'ask' && String(o.text).toLowerCase().replace(/[^a-z0-9]/g, '') === key) { names.push(o.n); } });
          h += '<p><b>' + esc(r.text) + '</b> <span class="small">from ' + esc(names.join(', ')) + '</span></p><div class="half"><button class="pbtn dark" data-a="c_crj" data-v="' + esc(r.p) + ',1">Correct</button><button class="pbtn plain c" data-a="c_crj" data-v="' + esc(r.p) + ',0">Wrong</button></div>';
        });
        return h;
      }
      if (ph === 'cr_reveal') {
        var mineR = null; S.cr.rows.forEach(function (r) { if (r.p === pid) { mineR = r; } });
        if (!mineR) { return '<h2>No answer from you</h2>' + watch(); }
        return '<h2>' + (mineR.st === 'ok' ? mineR.pts + ' points' : '0 points') + '</h2><p>' + (mineR.st === 'ok' ? esc(mineR.name) + ': ' + esc(mineR.tier) + ', worth ' + mineR.base + '.' + (mineR.dup > 1 ? ' ' + mineR.dup + ' of you typed it, so the points are split.' : ' Nobody else in the room typed it.') + (mineR.crown ? ' Most obscure answer in the room: 50 extra!' : '') : esc(mineR.text) + ': ' + esc(mineR.why || 'not accepted.')) + '</p>' + watch();
      }
      if (ph === 'final') {
        var endBtn = S.boss === pid ? '<button class="pbtn go" data-a="c_again">New night, same players</button>' : '';
        if (S.fin.solo) { return '<h2>' + (S.fin.tie ? 'A tie at the top!' : esc(S.fin.champ) + ' wins!') + '</h2><p>You finished number ' + myRank() + ' with ' + m.pts + ' points.</p>' + endBtn; }
        return '<h2>' + (S.fin.winner < 0 ? 'A tie!' : esc(tname(S.fin.winner)) + ' win!') + '</h2><p>You scored ' + m.pts + ' points. That makes you number ' + myRank() + ' of ' + S.order.length + '.</p>' + endBtn;
      }
      return watch();
    }
    function render() {
      var m = me();
      if (m) { if (ui.pts0 != null && m.pts > ui.pts0) { burst('right', '+' + (m.pts - ui.pts0)); try { if (navigator.vibrate) { navigator.vibrate([40, 40, 40]); } } catch (e9) { } } ui.pts0 = m.pts; }
      var stale = S && ui.joined && (Date.now() - lastState > 5000);
      var ban = '';
      if (S && S.v !== VERSION) { ban = '<button class="banner" data-a="reload">This phone has an old copy of the game. Tap here to refresh.</button>'; }
      else if (!net.up) { ban = '<div class="banner">Connecting to the game...</div>'; }
      else if (stale) { ban = '<div class="banner">Reconnecting to the TV...</div>'; }
      else if (ui.rtt > 2500) { ban = '<div class="banner">This phone has a slow connection. Move closer to the Wi-Fi.</div>'; }
      put('pbanner', ban);
      put('ptop', m ? '<div class="ptop t' + (S.solo ? 1 : m.t) + '"><span class="pill">' + esc(m.n) + (S.solo ? '' : ', ' + esc(tname(m.t))) + '</span><span class="sc">' + (S.solo ? m.pts + ' pts' : (NT() === 2 ? S.teams[0].score + ' to ' + S.teams[1].score : S.teams[m.t].score + ' &middot; ' + nth(teamRank(m.t)))) + '</span></div>' : '<div class="ptop tn"><span class="sc">Game Show Night</span><span>Room ' + ROOM + '</span></div>');
      // do not redraw a screen with a text box while someone is typing in it
      var wr = S && S.phase === 'scr_q' && S.wr ? (S.wr[pid] || 0) : 0;
      put('pnote', S && ui.failK && ui.failK === S.k ? '<div class="pnote bad">That did not reach the TV. Tap again.</div>' : (wr && !(S.acted && S.acted[pid]) ? '<div class="pnote bad">Not it. Try again. (' + wr + (wr === 1 ? ' try' : ' tries') + ')</div>' : ''));
      var ae = document.activeElement, html = bodyHtml();
      if (ae && ae.tagName === 'INPUT' && cache.pbody && (ae.getAttribute('data-hold') || cache.pbody.replace(/value="[^"]*"/g, '') === html.replace(/value="[^"]*"/g, ''))) { /* keep: someone is typing */ }
      else if (ae && ae.tagName === 'INPUT' && (ae.id === 'nm' || ae.id === 'hk') && !ui.joined && cache.pbody) { /* typing a name: wait */ }
      else if (ae && ae.tagName === 'INPUT' && (ae.id === 'wordin' || ae.id === 'numin' || ae.id === 'crin') && S && cache.pbodyK === S.k && !(S.acted && S.acted[pid]) && !sentHere()) { /* typing an answer: wait */ }
      else { var oldK = cache.pbodyK; if (put('pbody', html)) { cache.pbodyK = S ? S.k : ''; if (cache.pbodyK !== oldK) { cache.pbodyAt = Date.now(); } } }
      var isBoss = S && S.boss === pid && !!m;
      var inGame = S && S.phase !== 'lobby' && S.phase !== 'menu' && S.phase !== 'final';
      var passive = S && /^intro$|_reveal$|^round_end$/.test(S.phase);
      put('pboss', isBoss ? '<div class="bossbar">' + (inGame ? (passive ? '<button data-a="c_next">NEXT</button>' : '<button class="alt wide" data-a="c_next">Skip this one</button>') + '<button class="alt" data-a="c_pause">' + (S.paused ? 'Go' : 'Pause') + '</button>' : '') +
        '<button class="alt' + (inGame ? '' : ' wide') + '" data-a="c_menu">' + (ui.menu ? 'Close' : (inGame ? 'Host' : 'Host controls: players, teams, restart')) + '</button></div>' : '');
      var sheet = '';
      if (isBoss && ui.menu) {
        var tnow = S.now || Date.now(), between = S.phase === 'lobby' || S.phase === 'menu', t;
        var cf = function (a, label) { return '<button class="pbtn plain c' + (ui.confirm === a ? ' warn' : '') + '" data-a="' + a + '">' + (ui.confirm === a ? 'Tap again to confirm' : label) + '</button>'; };
        sheet = '<div class="sheet"><h3>The game</h3>';
        if (inGame) {
          sheet += '<div class="half"><button class="pbtn plain c" data-a="c_pause">' + (S.paused ? 'Resume the game' : 'Pause the game') + '</button><button class="pbtn plain c" data-a="c_skipq">Skip this question</button>' +
            cf('c_restart', 'Restart this game') + '<button class="pbtn plain c" data-a="c_tomenu">Pick a different game</button></div>';
        } else { sheet += '<p class="small">' + (S.phase === 'final' ? 'The night is over. Start a new one below.' : 'Tap a game on the main screen to start it. While a game runs, this is where you pause, skip, restart or switch games.') + '</p>'; }
        if (S.round > 0 && S.phase !== 'final') { sheet += '<button class="pbtn plain c" data-a="c_end">Finish the night and show the winner</button>'; }
        sheet += cf('c_again', 'New night: same players and teams, scores back to zero') + cf('c_reset', 'Start over: everyone joins and picks a team again');
        sheet += '<h3>Players (' + S.order.length + ')</h3>';
        S.order.forEach(function (id) {
          var p = S.players[id]; if (!p) { return; }
          var sig = tnow - p.seen > 10000 ? 'no signal' : (p.rtt ? (p.rtt < 700 ? 'good signal' : (p.rtt < 2000 ? 'slow' : 'very slow')) : 'checking');
          sheet += '<div class="prow"><div class="pn"><b>' + esc(p.n) + '</b>' + (id === pid ? ' (you)' : '') + ' <small>' + p.pts + ' pts &middot; ' + sig + '</small></div><div class="pt">';
          if (!S.solo) { for (t = 0; t < NT(); t++) { sheet += '<button class="tdot tb' + t + (p.t === t ? ' on' : '') + '" data-a="c_move" data-v="' + esc(id) + ',' + t + '">' + esc(tname(t).substring(0, 6)) + '</button>'; } }
          sheet += (id === pid ? '' : '<button class="tdot rm' + (ui.confirm === 'k' + id ? ' on' : '') + '" data-a="c_kick" data-v="' + esc(id) + '">' + (ui.confirm === 'k' + id ? 'Sure?' : 'Remove') + '</button>') + '</div></div>';
        });
        if (S.out) { for (var oid in S.out) { if (S.out.hasOwnProperty(oid)) { sheet += '<div class="prow"><div class="pn"><b>' + esc(S.out[oid]) + '</b> <small>removed</small></div><div class="pt"><button class="tdot" data-a="c_unkick" data-v="' + esc(oid) + '">Let back in</button></div></div>'; } } }
        sheet += between ? modeHtml() : '<h3>Teams</h3><p class="small">The number of teams can change between games. Moving a player works any time.</p>';
        if (!S.solo) {
          sheet += '<h3>Team names and scores</h3>';
          for (t = 0; t < NT(); t++) { sheet += '<div class="trow"><input class="field sm" id="tn' + t + '" maxlength="14" value="' + esc(tname(t)) + '"><button class="tdot" data-a="c_adj" data-v="' + t + ',-50">-50</button><b>' + S.teams[t].score + '</b><button class="tdot" data-a="c_adj" data-v="' + t + ',50">+50</button></div>'; }
          sheet += '<div class="half"><button class="pbtn plain c" data-a="c_names">Save team names</button>' + (NT() === 2 ? '<button class="pbtn plain c" data-a="c_preset">Kids vs Adults</button>' : '') + '</div>';
        }
        sheet += '<button class="pbtn plain c' + (ui.pvoice ? ' sel' : '') + '" data-a="p_voice">Ace speaks from this phone: ' + (ui.pvoice ? 'on' : 'off') + '</button><p class="small">Turn this on if the TV has no voice (many TV browsers do not). Connect this phone to a speaker for the room.</p>';
        sheet += '<button class="pbtn plain c' + (S.short ? ' sel' : '') + '" data-a="c_short">Short games: ' + (S.short ? 'on' : 'off') + '</button>' + (between ? '' : '<p class="small">Short games take effect from the next game.</p>');
        sheet += '<button class="pbtn dark" data-a="c_menu">Close</button></div>';
      }
      var ae2 = document.activeElement;
      if (ae2 && ae2.tagName === 'INPUT' && /^tn\d$/.test(ae2.id) && sheet) { /* typing a team name: do not redraw */ } else {
      put('psheet', sheet); }
      tickUI();
    }
    var GUARD = { ans: 1, vote: 1, mlv: 1, fpick: 1, tile: 1, c_next: 1, c_crj: 1, famv: 1 };
    var CONFIRM = { c_restart: 1, c_again: 1, c_reset: 1, c_kick: 1 };
    function onAct(b) {
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), el;
      if (CONFIRM[a]) { var ck = a === 'c_kick' ? 'k' + v : a; if (ui.confirm !== ck) { ui.confirm = ck; render(); return; } }
      ui.confirm = '';
      // A choice that shows up under a finger that was already tapping does not count: half a second of grace.
      if (GUARD[a] && Date.now() - (cache.pbodyAt || 0) < 550) { return; }
      if (a === 'team') { el = document.getElementById('nm'); if (el) { ui.name = el.value; } ui.team = +v; cache.pbody = null; put('pbody', bodyHtml()); return; }
      if (a === 'join') {
        el = document.getElementById('nm'); var name = (el ? el.value : ui.name).replace(/[<>]/g, '').replace(/^\s+|\s+$/g, '').substring(0, 14);
        if (!name) { if (el) { el.focus(); } return; }
        if (!S) { return; }
        var hkEl = document.getElementById('hk'); if (hkEl && hkEl.value) { ui.h = hkEl.value.toLowerCase().replace(/[^a-z0-9]/g, ''); lsSet('gn_h_' + ROOM, ui.h); }
        if (ui.team < 0 || ui.team >= NT()) { if (S.solo) { ui.team = 0; } else { return; } }
        ui.name = name; ui.joined = true; ui.ep = S.epoch; lsSet('rc_name', name); lsSet('rc_room', ROOM); lsSet('rc_team', String(ui.team)); lsSet('gn_ep', String(ui.ep));
        wakeLock();
        if (el) { el.blur(); }
        hello();
      }
      else if (a === 'switch') { ui.team = +v; lsSet('rc_team', String(ui.team)); send({ t: 'team', team: ui.team }); }
      else if (a === 'reload') { try { location.reload(true); } catch (e) { location.href = location.href; } return; }
      else if (!S) { return; }
      else if (a === 'vote') { doAct({ t: 'vote', a: +v }, S.q.kind === 'mix' ? 'ABCD'.charAt(+v) : S.q.o[+v]); }
      else if (a === 'mlv') { doAct({ t: 'mlv', v: v }, 'Voted'); }
      else if (a === 'num') { el = document.getElementById('numin'); if (!el || el.value === '' || isNaN(parseFloat(el.value))) { if (el) { el.focus(); } return; } var nval = parseFloat(el.value); el.blur(); doAct({ t: 'num', v: nval }, String(nval)); }
      else if (a === 'word') { el = document.getElementById('wordin'); if (!el || !el.value) { if (el) { el.focus(); } return; } send({ t: 'word', k: S.k, n: 1, text: el.value }); el.value = ''; return; }
      else if (a === 'c_play') { ctl('play', { key: v }); try { window.scrollTo(0, 0); } catch (e) { } }
      else if (a === 'c_short') { ctl('short', { on: !S.short }); }
      else if (a === 'p_voice') {
        ui.pvoice = !ui.pvoice; ui.lastSay = S.say ? S.say.id : 0;
        if (ui.pvoice) { phoneSpeak('Hello! Ace here. I shall be speaking from this phone. Do turn me up.'); } else { try { window.speechSynthesis.cancel(); } catch (e7) { } }
        render();
      }
      else if (a === 'c_solo') { ctl('solo', { on: v === '1' }); }
      else if (a === 'c_nteams') { ctl('nteams', { n: +v }); }
      else if (a === 'c_shuffle') { ctl('shuffle'); }
      else if (a === 'c_move') { var mv = v.split(','); ctl('move', { p: mv[0], t: +mv[1] }); }
      else if (a === 'c_kick') { ctl('kick', { p: v }); }
      else if (a === 'c_unkick') { ctl('unkick', { p: v }); }
      else if (a === 'c_restart') { ctl('restart'); ui.menu = false; }
      else if (a === 'c_reset') { ctl('reset'); ui.menu = false; }
      else if (a === 'c_skipq') { ctl('next', { k: S.k }); ui.menu = false; }
      else if (a === 'c_crj') { var cj = v.split(','); ctl('crj', { p: cj[0], ok: cj[1] === '1', said: 5, by: 'the host' }); }
      else if (a === 'fam') { el = document.getElementById('famin'); if (!el || el.value.replace(/[^A-Za-z0-9]/g, '').length < 6) { if (el) { el.focus(); } return; } var ftxt = el.value; el.blur(); doAct({ t: 'fam', text: ftxt, kid: v === '1' ? 1 : 0 }, ''); }
      else if (a === 'famv') { doAct({ t: 'famv', a: +v }, 'ABCD'.charAt(+v)); }
      else if (a === 'cr') { el = document.getElementById('crin'); if (!el || !el.value.replace(/\s/g, '')) { if (el) { el.focus(); } return; } var ctxt = el.value; el.blur(); doAct({ t: 'cr', text: ctxt }, ctxt); }
      else if (a === 'c_tomenu') { ctl('menu'); ui.menu = false; }
      else if (a === 'tile') { var cl = v.split(','); doAct({ t: 'pick', c: +cl[0], l: +cl[1] }, 'Picked'); }
      else if (a === 'buzz') {
        if (sentHere()) { return; }
        try { if (navigator.vibrate) { navigator.vibrate(60); } } catch (e) { }
        if (S.phase === 'phrase_turn') { doAct({ t: 'buzz' }, 'Buzzed'); }
        else { var bdt = hnow() - (S.openAt || 0); if (bdt < 0) { if (ui.earlyUntil && Date.now() < ui.earlyUntil) { return; } ui.earlyUntil = Date.now() + 2500; send({ t: 'buzz', early: 1, k: S.k, n: 0 }); render(); setTimeout(render, 2600); } else { doAct({ t: 'buzz', dt: Math.round(bdt) }, 'Buzzed'); } }   // a tap before GO is sent too: it costs points
      }
      else if (a === 'ans') { doAct({ t: 'ans', a: +v }, S.phase === 'board_q' && S.q && S.q.o ? S.q.o[+v] : 'Answer sent'); }
      else if (a === 'letter') { doAct({ t: 'letter', l: v }, v); }
      else if (a === 'solve') { el = document.getElementById('solve'); if (!el || !el.value) { return; } var txt = el.value; el.blur(); doAct({ t: 'solve', text: txt }, 'Sent'); }
      else if (a === 'fpick') { doAct({ t: 'fpick', o: +v }, 'Answer sent'); }
      else if (a === 'c_next') { ctl('next', { k: S.k }); }
      else if (a === 'c_pause') { ctl('pause'); }
      else if (a === 'c_menu') { ui.menu = !ui.menu; }
      else if (a === 'c_end') { ctl('end'); ui.menu = false; }
      else if (a === 'c_again') { ctl('again'); ui.menu = false; }
      else if (a === 'c_adj') { var ad = v.split(','); ctl('adj', { team: +ad[0], d: +ad[1] }); }
      else if (a === 'c_names') { var nms = []; for (var ti = 0; ti < NT(); ti++) { var te = document.getElementById('tn' + ti); if (te) { te.blur(); nms.push(te.value); } else { nms.push(tname(ti)); } } ctl('teams', { names: nms }); }
      else if (a === 'c_lnames') { var lnm = []; for (var li2 = 0; li2 < NT(); li2++) { var le = document.getElementById('ln' + li2); if (le) { le.blur(); lnm.push(le.value); } else { lnm.push(tname(li2)); } } ctl('teams', { names: lnm }); }
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
