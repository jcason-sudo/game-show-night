/* Rain Check! game engine. Pure state machine: no DOM, no network.
   The TV screen runs one engine; phones only send small messages. */
var RC = (typeof RC !== 'undefined') ? RC : {};
RC.createEngine = function (C, opts) {
  opts = opts || {};
  var rnd = opts.rand || Math.random;
  var S = null;   // public state, broadcast to everyone
  var P = null;   // private data (answers), never broadcast
  var kc = 0;
  var PRESENT_MS = 30000;
  var SLOT_PTS = [150, 120, 90, 60, 30];

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) { a.push(i); } return a; }
  function pickOne(a) { return a[Math.floor(rnd() * a.length)]; }
  function line(key) { return pickOne(C.lines[key]); }
  function clean(s, n) { s = String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').replace(/^ | $/g, ''); return s.substring(0, n); }
  function mc(item) { // shuffle options, remember where the right one landed
    var order = shuffle(range(item.o.length));
    var o = []; var a = 0;
    for (var i = 0; i < order.length; i++) { o.push(item.o[order[i]]); if (order[i] === 0) { a = i; } }
    return { q: item.q, o: o, a: a, f: item.f || '' };
  }
  var CAT = {};
  for (var ci = 0; ci < C.rounds.length; ci++) { CAT[C.rounds[ci].key] = C.rounds[ci]; }
  function cnt(full, small) { return S.short ? small : full; }
  function fmt(n, plain) { var t = String(n); if (plain) { return t; } return t.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function readMs(text) { return Math.min(9000, 1800 + String(text).length * 55); }

  function say(text) { S.say = { id: S.say.id + 1, text: text }; }
  function fx(name) { S.fx = { id: S.fx.id + 1, name: name }; }
  function setPhase(phase, now, dur) {
    kc++;
    S.phase = phase; S.k = phase + ':' + kc; S.acted = {};
    S.deadline = dur ? now + dur : 0;
  }
  function pl(pid) { return S.players[pid]; }
  function present(pid, now) { var p = pl(pid); return !!p && (now - p.seen) < PRESENT_MS; }
  function teamList(t, now) { var out = []; for (var i = 0; i < S.order.length; i++) { var p = pl(S.order[i]); if (p && p.t === t && present(S.order[i], now)) { out.push(S.order[i]); } } return out; }
  function teamPresent(t, now) { return teamList(t, now).length > 0; }
  function nextPlayer(t, now) {
    var list = teamList(t, now);
    if (!list.length) { return null; }
    S.rot[t] = (S.rot[t] + 1) % list.length;
    return list[S.rot[t]];
  }
  function nextPlayerAny(t, now) { var p = nextPlayer(t, now); if (p) { return p; } return nextPlayer(1 - t, now); }
  function award(team, pts, pid) {
    if (team !== 0 && team !== 1) { return; }
    S.teams[team].score += pts;
    if (pid && pl(pid)) { pl(pid).pts += pts; }
    S.gain = { id: (S.gain ? S.gain.id : 0) + 1, team: team, pts: pts };
  }
  function nm(pid) { return pid && pl(pid) ? pl(pid).n : 'Nobody'; }
  function trailing() { if (S.teams[0].score === S.teams[1].score) { return rnd() < 0.5 ? 0 : 1; } return S.teams[0].score < S.teams[1].score ? 0 : 1; }
  function activeTeam(t, now) { return teamPresent(t, now) ? t : (teamPresent(1 - t, now) ? 1 - t : t); }

  function init(room, now) {
    kc = 0;
    S = {
      v: 2, room: room, boot: Math.floor(rnd() * 1e9), phase: 'lobby', k: 'lobby:0', paused: false, pleft: 0,
      teams: [{ name: 'Thunder', score: 0 }, { name: 'Lightning', score: 0 }],
      players: {}, order: [], boss: null, round: 0, rot: [-1, -1],
      say: { id: 0, text: '' }, fx: { id: 0, name: '' }, gain: null,
      acted: {}, deadline: 0, turn: null,
      short: false, played: {}, cur: ''
    };
    P = {};
    return S;
  }

  /* ---------- round flow ---------- */
  function goMenu(now) {
    S.turn = null; S.cur = '';
    setPhase('menu', now, 0);
    say(S.round ? 'Showrunner, pick the next game.' : 'Showrunner, pick the first game.');
  }
  function startGame(key, now) {
    var info = CAT[key];
    if (!info) { return; }
    var first = S.round === 0;
    S.round++; S.cur = key; S.played[key] = (S.played[key] || 0) + 1;
    S.intro = { n: S.round, title: info.title, how: info.how };
    S.rt = info.title;
    S.turn = null; S.rv = null;
    setPhase('intro', now, 12000);
    say((first ? line('welcome') + ' ' : '') + info.title + '. ' + info.how.join(' '));
    fx('fanfare');
  }
  function beginRound(now) {
    var key = S.cur;
    if (key === 'vote') { P.vq = shuffle(C.votes).slice(0, cnt(8, 5)); P.vkind = 'mix'; S.vi = -1; nextVote(now); }
    else if (key === 'tf') { P.vq = shuffle(C.tf).slice(0, cnt(10, 6)); P.vkind = 'tf'; S.vi = -1; nextVote(now); }
    else if (key === 'decade') { P.vq = shuffle(C.decades).slice(0, cnt(8, 5)); P.vkind = 'decade'; S.vi = -1; nextVote(now); }
    else if (key === 'likely') { P.mq = shuffle(C.likely).slice(0, cnt(6, 4)); S.mi = -1; nextLikely(now); }
    else if (key === 'num') { P.nq = shuffle(C.numbers).slice(0, cnt(6, 4)); S.ni = -1; nextNum(now); }
    else if (key === 'scramble') { P.wq = shuffle(C.words).slice(0, cnt(6, 4)); S.wi = -1; nextWord(now); }
    else if (key === 'board') { setupBoard(now); boardPick(now); }
    else if (key === 'zoom') { P.zs = shuffle(C.zoom).slice(0, cnt(5, 3)); S.zi = -1; nextZoom(now); }
    else if (key === 'phrase') { P.ps = shuffle(C.phrases).slice(0, cnt(4, 2)); S.pi = -1; S.pteam = trailing(); nextPhrase(now); }
    else if (key === 'feud') { setupFeud(); S.fi = -1; nextFeud(now); }
  }
  function roundEnd(now) {
    S.turn = null;
    S.re = { n: S.round, title: S.rt };
    setPhase('round_end', now, 10000);
    var a = S.teams[0], b = S.teams[1];
    say(a.score === b.score ? 'It is all tied up at ' + a.score + '!' : (a.score > b.score ? a.name : b.name) + ' lead, ' + Math.max(a.score, b.score) + ' to ' + Math.min(a.score, b.score) + '.');
    fx('fanfare');
  }
  function finale(now) {
    var a = S.teams[0].score, b = S.teams[1].score;
    var best = null, king = null;
    for (var i = 0; i < S.order.length; i++) {
      var p = pl(S.order[i]); if (!p) { continue; }
      if (!best || p.pts > best.pts) { best = p; }
      if (!king || p.bz > king.bz) { king = p; }
    }
    S.fin = { winner: a === b ? -1 : (a > b ? 0 : 1), mvp: best ? best.n : '', mvpPts: best ? best.pts : 0, king: king && king.bz ? king.n : '', kingN: king ? king.bz : 0 };
    S.turn = null;
    setPhase('final', now, 0);
    say((S.fin.winner < 0 ? 'It is a tie! ' : S.teams[S.fin.winner].name + ' win! ') + line('final'));
    fx('win');
  }

  /* ---------- round 1: everybody votes ---------- */
  function nextVote(now) {
    S.vi++;
    if (S.vi >= P.vq.length) { return roundEnd(now); }
    var it = P.vq[S.vi];
    if (P.vkind === 'tf') { P.cur = { q: it.q, o: ['True', 'False'], a: it.a ? 0 : 1, f: it.f || '' }; }
    else if (P.vkind === 'decade') { var so = it.o.slice().sort(); P.cur = { q: it.q, o: so, a: so.indexOf(it.o[0]), f: '' }; }
    else { P.cur = mc(it); }
    P.votes = {};
    S.q = { n: S.vi + 1, of: P.vq.length, text: P.cur.q, o: P.cur.o, kind: P.vkind };
    S.nv = 0; S.rv = null;
    setPhase('vote_q', now, readMs(P.cur.q) + (P.vkind === 'tf' ? 12000 : 20000));
    say((P.vkind === 'tf' ? 'True or false? ' : (P.vkind === 'decade' ? 'Which decade? ' : '')) + P.cur.q);
  }
  function endVote(now) {
    var counts = [], ok = [0, 0], den = [0, 0], fast = null, pid, v;
    for (var ci2 = 0; ci2 < P.cur.o.length; ci2++) { counts.push(0); }
    for (var i = 0; i < S.order.length; i++) {
      pid = S.order[i]; v = P.votes[pid];
      var p = pl(pid); if (!p) { continue; }
      if (v || present(pid, now)) { den[p.t]++; }
      if (v) {
        counts[v.a]++;
        if (v.a === P.cur.a) { ok[p.t]++; p.pts += 10; if (!fast || v.at < P.votes[fast].at) { fast = pid; } }
      }
    }
    var gains = [0, 0];
    for (var t = 0; t < 2; t++) { gains[t] = den[t] ? Math.round(100 * ok[t] / den[t]) : 0; }
    if (fast) { gains[pl(fast).t] += 20; }
    S.teams[0].score += gains[0]; S.teams[1].score += gains[1];
    S.rv = { a: P.cur.a, counts: counts, gains: gains, fast: fast ? pl(fast).n : '', fact: P.cur.f };
    setPhase('vote_reveal', now, 9000);
    say('The answer is ' + P.cur.o[P.cur.a] + '. ' + (P.cur.f || ''));
    fx(ok[0] + ok[1] > 0 ? 'right' : 'wrong');
  }

  /* ---------- most likely to ---------- */
  function allActed(now) { for (var i = 0; i < S.order.length; i++) { if (present(S.order[i], now) && !S.acted[S.order[i]]) { return false; } } return true; }
  function nextLikely(now) {
    S.mi++;
    if (S.mi >= P.mq.length) { return roundEnd(now); }
    var who = [];
    for (var i = 0; i < S.order.length && who.length < 16; i++) { if (present(S.order[i], now)) { who.push({ p: S.order[i], n: nm(S.order[i]) }); } }
    S.ml = { n: S.mi + 1, of: P.mq.length, text: 'Who is most likely to ' + P.mq[S.mi] + '?', who: who };
    P.mv = {}; S.nv = 0; S.rv = null;
    setPhase('ml_q', now, readMs(S.ml.text) + 22000);
    say(S.ml.text);
  }
  function endLikely(now) {
    var tally = {}, max = 0, pid, i;
    for (pid in P.mv) { if (P.mv.hasOwnProperty(pid)) { tally[P.mv[pid]] = (tally[P.mv[pid]] || 0) + 1; if (tally[P.mv[pid]] > max) { max = tally[P.mv[pid]]; } } }
    var top = [], win = [];
    for (i = 0; i < S.ml.who.length; i++) { var w = S.ml.who[i]; if (tally[w.p]) { top.push({ n: w.n, c: tally[w.p] }); if (tally[w.p] === max) { win.push(w.n); } } }
    top.sort(function (x, y) { return y.c - x.c; });
    var ok = [0, 0], den = [0, 0], gains = [0, 0];
    for (i = 0; i < S.order.length; i++) {
      pid = S.order[i]; var p = pl(pid); if (!p) { continue; }
      if (P.mv[pid] || present(pid, now)) { den[p.t]++; }
      if (P.mv[pid] && tally[P.mv[pid]] === max) { ok[p.t]++; p.pts += 10; }
    }
    for (var t = 0; t < 2; t++) { gains[t] = den[t] ? Math.round(100 * ok[t] / den[t]) : 0; S.teams[t].score += gains[t]; }
    S.rv = { win: win, top: top.slice(0, 4), gains: gains };
    setPhase('ml_reveal', now, 9000);
    say(win.length ? 'The family says: ' + win.join(' and ') + '!' : 'Nobody voted.');
    fx(win.length ? 'right' : 'wrong');
  }

  /* ---------- closest call ---------- */
  function nextNum(now) {
    S.ni++;
    if (S.ni >= P.nq.length) { return roundEnd(now); }
    var it = P.nq[S.ni];
    S.nm = { n: S.ni + 1, of: P.nq.length, text: it.q };
    P.ng = {}; S.nv = 0; S.rv = null;
    setPhase('num_q', now, readMs(it.q) + 25000);
    say(it.q + ' Type your best guess.');
  }
  function endNum(now) {
    var it = P.nq[S.ni], list = [], pid;
    for (pid in P.ng) { if (P.ng.hasOwnProperty(pid) && pl(pid)) { list.push({ p: pid, v: P.ng[pid].v, d: Math.abs(P.ng[pid].v - it.a), at: P.ng[pid].at }); } }
    list.sort(function (x, y) { return (x.d - y.d) || (x.at - y.at); });
    var best = list[0] || null, show = [];
    for (var i = 0; i < list.length && i < 4; i++) { show.push({ n: nm(list[i].p), v: fmt(list[i].v, it.y), t: pl(list[i].p).t }); }
    var pts = best ? (best.d === 0 ? 200 : 150) : 0;
    if (best) { award(pl(best.p).t, pts, best.p); }
    S.rv = { a: fmt(it.a, it.y), list: show, who: best ? nm(best.p) : '', team: best ? pl(best.p).t : -1, pts: pts, exact: !!best && best.d === 0 };
    setPhase('num_reveal', now, 9000);
    say('The answer is ' + S.rv.a + '. ' + (best ? (S.rv.exact ? 'Exactly right, ' : 'Closest: ') + S.rv.who + '.' : ''));
    fx(best ? 'right' : 'wrong');
  }

  /* ---------- word scramble ---------- */
  function nextWord(now) {
    S.wi++;
    if (S.wi >= P.wq.length) { return roundEnd(now); }
    var it = P.wq[S.wi], mix = it.w, tries = 0;
    while (mix === it.w && tries < 12) { mix = shuffle(it.w.split('')).join(''); tries++; }
    P.word = it.w; P.wd = {};
    S.ws = { n: S.wi + 1, of: P.wq.length, mix: mix, hint: it.h, done: [] };
    S.wr = {}; S.rv = null;
    setPhase('scr_q', now, 35000);
    say('Unscramble the word. The hint is: ' + it.h + '.');
  }
  function endWord(now) {
    S.rv = { text: P.word, who: S.ws.done[0] || '', n: S.ws.done.length };
    setPhase('scr_reveal', now, 7000);
    say('The word was ' + P.word.toLowerCase() + '.' + (S.rv.who ? ' First in: ' + S.rv.who + '.' : ''));
    if (!S.rv.who) { fx('wrong'); }
  }

  /* ---------- round 2: the board ---------- */
  function setupBoard(now) {
    var cats = shuffle(range(C.board.length)).slice(0, cnt(5, 3));
    P.board = []; S.board = { cats: [], used: [] };
    for (var i = 0; i < cats.length; i++) {
      var cat = C.board[cats[i]], row = [];
      for (var l = 0; l < cat.levels.length; l++) { row.push(pickOne(cat.levels[l])); }
      P.board.push(row); S.board.cats.push(cat.name); S.board.used.push([0, 0, 0, 0]);
    }
    S.ctrl = activeTeam(trailing(), now);
  }
  function tilesLeft() { var n = 0; for (var c = 0; c < S.board.used.length; c++) { for (var l = 0; l < 4; l++) { if (!S.board.used[c][l]) { n++; } } } return n; }
  function boardPick(now) {
    if (!tilesLeft()) { return roundEnd(now); }
    S.ctrl = activeTeam(S.ctrl, now);
    S.turn = nextPlayerAny(S.ctrl, now);
    S.q = null; S.rv = null;
    setPhase('board_pick', now, 20000);
    say(nm(S.turn) + ', pick a category.');
  }
  function openTile(c, l, now) {
    S.board.used[c][l] = 1;
    P.cur = mc(P.board[c][l]);
    S.q = { cat: S.board.cats[c], val: (l + 1) * 100, text: P.cur.q };
    S.locked = [false, false]; S.wrong = []; S.steal = false; S.turn = null;
    var r = readMs(P.cur.q);
    S.openAt = now + r;
    setPhase('board_q', now, r + 12000);
    say(S.q.cat + ' for ' + S.q.val + '. ' + P.cur.q);
  }
  function optsLeft() { var out = []; for (var i = 0; i < P.cur.o.length; i++) { if (S.wrong.indexOf(i) < 0) { out.push({ i: i, text: P.cur.o[i] }); } } return out; }
  function boardWrong(team, a, now) {
    S.locked[team] = true;
    if (a >= 0) { S.wrong.push(a); }
    fx('wrong');
    var other = 1 - team;
    if (teamPresent(other, now) && !S.locked[other]) {
      S.steal = true; S.turn = null; S.openAt = now + 1500;
      setPhase('board_q', now, 1500 + 9000);
      say(line('wrong') + ' ' + S.teams[other].name + ', ' + line('steal'));
    } else { boardReveal(null, now); }
  }
  function boardReveal(pid, now) {
    S.rv = { text: P.cur.o[P.cur.a], who: pid ? nm(pid) : '', team: pid ? pl(pid).t : -1, val: S.q.val };
    S.turn = null;
    setPhase('board_reveal', now, 6500);
    if (pid) { say(line('right') + ' ' + S.q.val + ' points for ' + S.teams[pl(pid).t].name + '.'); fx('right'); }
    else { say('The answer was ' + S.rv.text + '.'); }
  }

  /* ---------- round 3: zoom in ---------- */
  function zfrac(now) { if (S.zfrozen != null) { return S.zfrozen; } return Math.max(0, Math.min(1, (now - S.zt0) / S.zdur)); }
  function zvalue(f) { return Math.max(100, Math.round((500 - 400 * f) / 10) * 10); }
  function nextZoom(now) {
    S.zi++;
    if (S.zi >= P.zs.length) { return roundEnd(now); }
    var z = P.zs[S.zi];
    P.cur = mc({ q: '', o: z.o });
    S.z = { n: S.zi + 1, of: P.zs.length, img: z.id, mode: S.zi % 2 ? 'tiles' : 'zoom', fx: z.fx, fy: z.fy, seed: Math.floor(rnd() * 99999) };
    S.zt0 = now + 3000; S.zdur = 30000; S.zfrozen = null; S.openAt = S.zt0;
    S.locked = [false, false]; S.wrong = []; S.rv = null; S.turn = null;
    setPhase('zoom_q', now, 3000 + 30000 + 6000);
    say('Picture ' + S.z.n + '. What famous place is this? Buzz when you know.');
  }
  function zoomReveal(pid, now) {
    S.rv = { text: P.cur.o[P.cur.a], who: pid ? nm(pid) : '', team: pid ? pl(pid).t : -1, val: pid ? S.zval : 0 };
    S.zfrozen = 1; S.turn = null;
    setPhase('zoom_reveal', now, 7500);
    if (pid) { say(line('right') + ' ' + S.rv.text + '. ' + S.zval + ' points.'); fx('right'); }
    else { say('The answer: ' + S.rv.text + '.'); }
  }
  function zoomWrong(team, a, now) {
    S.locked[team] = true;
    if (a >= 0) { S.wrong.push(a); }
    fx('wrong');
    var other = 1 - team;
    if (teamPresent(other, now) && !S.locked[other] && P.zleft > 1500) {
      S.zt0 = now - S.zfrozen * S.zdur; S.zfrozen = null; S.turn = null; S.openAt = now;
      setPhase('zoom_q', now, P.zleft);
      say(line('wrong') + ' ' + S.teams[other].name + ', keep looking.');
    } else { zoomReveal(null, now); }
  }

  /* ---------- round 4: phrase fever ---------- */
  function hiddenCount() { var n = 0; for (var i = 0; i < S.ph.mask.length; i++) { if (S.ph.mask[i] === '_') { n++; } } return n; }
  function nextPhrase(now) {
    S.pi++;
    if (S.pi >= P.ps.length) { return roundEnd(now); }
    var ph = P.ps[S.pi]; P.ph = ph.t.toUpperCase();
    var mask = [];
    for (var i = 0; i < P.ph.length; i++) { var ch = P.ph.charAt(i); mask.push(/[A-Z]/.test(ch) ? '_' : ch); }
    S.ph = { n: S.pi + 1, of: P.ps.length, hint: ph.h, mask: mask };
    S.used = ''; S.miss = 0; S.slock = [false, false]; S.last = null; S.rv = null; S.idle = 0;
    if (S.pi > 0) { S.pteam = 1 - S.pteam; }
    say('Puzzle ' + S.ph.n + '. The hint is: ' + ph.h + '.');
    phraseTurn(now);
  }
  function phraseTurn(now) {
    S.pteam = activeTeam(S.pteam, now);
    S.turn = nextPlayerAny(S.pteam, now); S.solver = null;
    setPhase('phrase_turn', now, 22000);
  }
  function phraseReveal(pid, how, now) {
    for (var i = 0; i < P.ph.length; i++) { S.ph.mask[i] = P.ph.charAt(i); }
    S.rv = { text: P.ph, who: pid ? nm(pid) : '', how: how };
    S.turn = null; S.solver = null;
    setPhase('phrase_reveal', now, 8000);
    if (how === 'bust') { say('Five misses. The phrase was: ' + P.ph.toLowerCase() + '.'); fx('wrong'); }
    else { say(line('right') + ' ' + P.ph.toLowerCase() + '!'); fx('right'); }
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; } for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) { for (j = 1; j <= n; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); } }
    return d[m][n];
  }
  function phraseMatch(text) {
    var a = String(text || '').toUpperCase().replace(/[^A-Z]/g, ''), b = P.ph.replace(/[^A-Z]/g, '');
    if (!a) { return false; }
    return lev(a, b) <= Math.min(2, Math.floor(b.length / 10));
  }
  function phraseMiss(now) {
    S.miss++;
    if (S.miss >= 5) { phraseReveal(null, 'bust', now); return true; }
    return false;
  }

  /* ---------- round 5: survey says ---------- */
  function setupFeud() {
    var pick = shuffle(C.surveys).slice(0, cnt(3, 2));
    P.fq = [];
    for (var s = 0; s < pick.length; s++) {
      var ord = shuffle(range(pick[s].a.length)), o = [], votes = [], top = [], i;
      for (i = 0; i < ord.length; i++) { o.push(pick[s].a[ord[i]][0]); votes.push(pick[s].a[ord[i]][1]); }
      var idx = range(o.length);
      idx.sort(function (x, y) { return votes[y] - votes[x]; });
      top = idx.slice(0, 5);
      P.fq.push({ q: pick[s].q, o: o, votes: votes, top: top });
    }
  }
  function nextFeud(now) {
    S.fi++;
    if (S.fi >= P.fq.length) { return roundEnd(now); }
    var sv = P.fq[S.fi];
    S.f = { n: S.fi + 1, of: P.fq.length, q: sv.q, o: sv.o, mult: S.fi === P.fq.length - 1 ? 2 : 1, tried: [], slots: [null, null, null, null, null], strikes: 0, pot: 0, play: -1, mode: 'face', x: 0 };
    S.rv = null; S.turn = null;
    var r = readMs(sv.q);
    S.openAt = now + r;
    setPhase('feud_face', now, r + 12000);
    say('We asked 1,000 people: ' + sv.q + ' Buzz in!');
  }
  function slotPts(rank) { var sv = P.fq[S.fi]; return Math.round(sv.votes[sv.top[rank]] / 10) * 5 * S.f.mult; }
  function revealSlot(rank, hit) {
    var o = P.fq[S.fi].top[rank];
    S.f.slots[rank] = { text: S.f.o[o], pts: slotPts(rank), votes: P.fq[S.fi].votes[o], hit: hit };
  }
  function slotsOpen() { var n = 0; for (var i = 0; i < 5; i++) { if (!S.f.slots[i]) { n++; } } return n; }
  function feudPlayTurn(now) {
    S.f.mode = 'play';
    S.f.play = activeTeam(S.f.play, now);
    S.turn = nextPlayerAny(S.f.play, now);
    setPhase('feud_pick', now, 18000);
  }
  function feudReveal(team, now) {
    for (var r = 0; r < 5; r++) { if (!S.f.slots[r]) { revealSlot(r, false); } }
    S.rv = { team: team, pot: S.f.pot };
    if (team >= 0) { award(team, S.f.pot, null); }
    S.turn = null;
    setPhase('feud_reveal', now, 10000);
    say(team >= 0 ? S.teams[team].name + ' take ' + S.f.pot + ' points!' : 'No points this time.');
    fx(team >= 0 ? 'right' : 'wrong');
  }
  function feudPick(o, now) { // o = option index, or -1 on timeout
    var f = S.f, team = S.turn && pl(S.turn) ? pl(S.turn).t : f.play;
    var rank = o >= 0 ? P.fq[S.fi].top.indexOf(o) : -1;
    if (o >= 0) { f.tried.push(o); }
    var hit = rank >= 0 && !f.slots[rank];
    if (hit) { revealSlot(rank, true); f.pot += slotPts(rank); if (S.turn && pl(S.turn)) { pl(S.turn).pts += slotPts(rank); } fx('ding'); say(line('survey') + ' ' + f.slots[rank].text + '!'); }
    else { f.x++; fx('strike'); say(line('strike')); }
    if (f.mode === 'face') {
      f.play = hit ? team : activeTeam(1 - team, now);
      if (!slotsOpen()) { return feudReveal(f.play, now); }
      return feudPlayTurn(now);
    }
    if (f.mode === 'play') {
      if (hit) { if (!slotsOpen()) { return feudReveal(f.play, now); } return feudPlayTurn(now); }
      f.strikes++;
      if (f.strikes >= 3) {
        var other = 1 - f.play;
        if (teamPresent(other, now)) {
          f.mode = 'steal'; S.turn = nextPlayer(other, now);
          setPhase('feud_pick', now, 25000);
          say('Three strikes! ' + S.teams[other].name + ' can steal with one answer.');
          return;
        }
        return feudReveal(f.play, now);
      }
      return feudPlayTurn(now);
    }
    // steal
    return feudReveal(hit ? 1 - f.play : f.play, now);
  }

  /* ---------- advance: called on deadline or when the showrunner taps Next ---------- */
  function advance(now, timedOut) {
    var ph = S.phase;
    if (ph === 'lobby') { if (!timedOut) { goMenu(now); } }
    else if (ph === 'intro') { beginRound(now); }
    else if (ph === 'vote_q') { endVote(now); }
    else if (ph === 'vote_reveal') { nextVote(now); }
    else if (ph === 'ml_q') { endLikely(now); }
    else if (ph === 'ml_reveal') { nextLikely(now); }
    else if (ph === 'num_q') { endNum(now); }
    else if (ph === 'num_reveal') { nextNum(now); }
    else if (ph === 'scr_q') { endWord(now); }
    else if (ph === 'scr_reveal') { nextWord(now); }
    else if (ph === 'board_pick') { for (var l = 0; l < 4; l++) { for (var c = 0; c < S.board.used.length; c++) { if (!S.board.used[c][l]) { return openTile(c, l, now); } } } }
    else if (ph === 'board_q') { say(line('nobuzz')); boardReveal(null, now); }
    else if (ph === 'board_ans') { boardWrong(pl(S.turn) ? pl(S.turn).t : 0, -1, now); }
    else if (ph === 'board_reveal') { boardPick(now); }
    else if (ph === 'zoom_q') { zoomReveal(null, now); }
    else if (ph === 'zoom_ans') { zoomWrong(pl(S.turn) ? pl(S.turn).t : 0, -1, now); }
    else if (ph === 'zoom_reveal') { nextZoom(now); }
    else if (ph === 'phrase_turn') { S.idle++; if (S.idle >= 6) { phraseReveal(null, 'bust', now); } else { S.pteam = 1 - S.pteam; phraseTurn(now); } }
    else if (ph === 'phrase_solve') { var st = pl(S.solver) ? pl(S.solver).t : 0; S.slock[st] = true; fx('wrong'); if (!phraseMiss(now)) { phraseTurn(now); } }
    else if (ph === 'phrase_reveal') { nextPhrase(now); }
    else if (ph === 'feud_face') { S.f.play = activeTeam(trailing(), now); feudPlayTurn(now); }
    else if (ph === 'feud_pick') { feudPick(-1, now); }
    else if (ph === 'feud_reveal') { nextFeud(now); }
    else if (ph === 'round_end') { goMenu(now); }
  }
  /* ---------- showrunner commands ---------- */
  function cmd(c, a, now) {
    a = a || {};
    if (c === 'play') { if (S.phase === 'lobby' || S.phase === 'menu' || S.phase === 'round_end') { startGame(clean(a.key, 12), now); } }
    else if (c === 'menu') { if (S.phase !== 'final') { if (S.paused) { cmd('pause', null, now); } goMenu(now); } }
    else if (c === 'next') { if (S.paused) { cmd('pause', null, now); } advance(now, false); }
    else if (c === 'pause') {
      if (!S.paused) { S.paused = true; S.pleft = S.deadline ? Math.max(0, S.deadline - now) : 0; S.pat = now; }
      else {
        S.paused = false; var d = now - S.pat;
        if (S.deadline) { S.deadline = now + S.pleft; }
        if (S.zt0) { S.zt0 += d; } if (S.openAt) { S.openAt += d; }
      }
    }
    else if (c === 'skip') { if (S.phase !== 'lobby' && S.phase !== 'final' && S.phase !== 'round_end') { roundEnd(now); } }
    else if (c === 'adj') { var t = a.team === 1 ? 1 : 0; var d2 = Math.max(-500, Math.min(500, parseInt(a.d, 10) || 0)); S.teams[t].score += d2; }
    else if (c === 'short') { if (S.phase === 'lobby' || S.phase === 'menu') { S.short = !!a.on; } }
    else if (c === 'boss') { if (pl(a.pid)) { S.boss = a.pid; } }
    else if (c === 'teams') { if (a.names && a.names.length === 2) { S.teams[0].name = clean(a.names[0], 14) || 'Thunder'; S.teams[1].name = clean(a.names[1], 14) || 'Lightning'; } }
    else if (c === 'kick') { if (pl(a.pid)) { delete S.players[a.pid]; S.order.splice(S.order.indexOf(a.pid), 1); if (S.boss === a.pid) { S.boss = S.order[0] || null; } } }
    else if (c === 'end') { if (S.round > 0) { if (S.paused) { cmd('pause', null, now); } finale(now); } }
    else if (c === 'again') {
      S.teams[0].score = 0; S.teams[1].score = 0; S.round = 0; S.rot = [-1, -1]; S.played = {}; S.cur = ''; P = {};
      for (var i = 0; i < S.order.length; i++) { var p = pl(S.order[i]); p.pts = 0; p.bz = 0; }
      S.q = null; S.rv = null; S.fin = null; S.turn = null;
      setPhase('lobby', now, 0);
    }
  }

  /* ---------- messages from phones ---------- */
  function handle(m, now) {
    if (!m || typeof m !== 'object') { return; }
    var pid = clean(m.p, 12); if (!pid) { return; }
    var p = pl(pid);
    if (m.t === 'hello') {
      var name = clean(m.name, 14); var team = m.team === 1 ? 1 : 0;
      if (!name) { return; }
      if (!p) {
        if (S.order.length >= 30) { return; }
        S.players[pid] = p = { n: name, t: team, seen: now, pts: 0, bz: 0, e: 0, rtt: 0, late: 0 };
        S.order.push(pid);
        if (!S.boss) { S.boss = pid; }
        fx('join');
      } else { p.n = name; if (S.phase === 'lobby') { p.t = team; } }
      p.seen = now;
      if (m.ts > 0) { p.e = +m.ts; }
      if (m.rtt > 0) { p.rtt = Math.min(9999, Math.round(+m.rtt)); }
      return;
    }
    if (!p) { return; }
    p.seen = now;
    if (m.t === 'ctl') { if (pid === S.boss) { cmd(clean(m.c, 10), m.a, now); } return; }
    if (S.paused || m.k !== S.k) { if (!m.n && m.k !== S.k) { p.late = (p.late || 0) + 1; } return; }
    var ph = S.phase, team2 = p.t, a;
    if (m.t === 'vote' && ph === 'vote_q') {
      a = parseInt(m.a, 10);
      if (P.votes[pid] || !(a >= 0 && a < P.cur.o.length)) { return; }
      P.votes[pid] = { a: a, at: now }; S.acted[pid] = true; S.nv++;
      var all = true;
      for (var i = 0; i < S.order.length; i++) { if (present(S.order[i], now) && !P.votes[S.order[i]]) { all = false; } }
      if (all) { endVote(now); }
    }
    else if (m.t === 'mlv' && ph === 'ml_q') {
      var tgt = clean(m.v, 12), found = false;
      for (var q = 0; q < S.ml.who.length; q++) { if (S.ml.who[q].p === tgt) { found = true; } }
      if (P.mv[pid] || !found) { return; }
      P.mv[pid] = tgt; S.acted[pid] = true; S.nv++;
      if (allActed(now)) { endLikely(now); }
    }
    else if (m.t === 'num' && ph === 'num_q') {
      var nv = parseFloat(m.v);
      if (P.ng[pid] || !isFinite(nv) || Math.abs(nv) > 1e9) { return; }
      P.ng[pid] = { v: Math.round(nv * 10) / 10, at: now }; S.acted[pid] = true; S.nv++;
      if (allActed(now)) { endNum(now); }
    }
    else if (m.t === 'word' && ph === 'scr_q') {
      if (P.wd[pid]) { return; }
      if (String(m.text || '').toUpperCase().replace(/[^A-Z]/g, '') === P.word) {
        P.wd[pid] = 1; S.acted[pid] = true;
        award(team2, S.ws.done.length ? 40 : 150, pid);
        if (!S.ws.done.length) { say(p.n + ' got it first! Ten seconds for everyone else.'); if (S.deadline > now + 10000) { S.deadline = now + 10000; } }
        S.ws.done.push(p.n); fx('ding');
        if (allActed(now)) { endWord(now); }
      } else { S.wr[pid] = (S.wr[pid] || 0) + 1; }
    }
    else if (m.t === 'pick' && ph === 'board_pick') {
      var c = parseInt(m.c, 10), l = parseInt(m.l, 10);
      if ((pid !== S.turn && pid !== S.boss) || !(c >= 0 && c < S.board.used.length) || !(l >= 0 && l < 4) || S.board.used[c][l]) { return; }
      openTile(c, l, now);
    }
    else if (m.t === 'buzz') {
      if (ph === 'board_q' || ph === 'zoom_q' || ph === 'feud_face') {
        if (now < S.openAt - 200) { return; }
        if (ph !== 'feud_face' && S.locked[team2]) { return; }
        S.turn = pid; p.bz++; fx('buzz');
        if (ph === 'board_q') { S.opts = optsLeft(); setPhase('board_ans', now, 11000); say(p.n + '!'); }
        else if (ph === 'zoom_q') { S.zfrozen = zfrac(now); S.zval = zvalue(S.zfrozen); P.zleft = S.deadline - now; S.opts = optsLeft(); setPhase('zoom_ans', now, 10000); say(p.n + '!'); }
        else { S.f.mode = 'face'; setPhase('feud_pick', now, 14000); say(p.n + '! What do you say?'); }
      } else if (ph === 'phrase_turn') {
        if (S.slock[team2]) { return; }
        S.solver = pid; p.bz++; fx('buzz');
        setPhase('phrase_solve', now, 25000);
        say(p.n + ' wants to solve!');
      }
    }
    else if (m.t === 'ans' && (ph === 'board_ans' || ph === 'zoom_ans')) {
      if (pid !== S.turn) { return; }
      a = parseInt(m.a, 10);
      if (!(a >= 0 && a < P.cur.o.length) || S.wrong.indexOf(a) >= 0) { return; }
      if (a === P.cur.a) {
        if (ph === 'board_ans') { award(team2, S.q.val, pid); S.ctrl = team2; boardReveal(pid, now); }
        else { award(team2, S.zval, pid); zoomReveal(pid, now); }
      } else if (ph === 'board_ans') { boardWrong(team2, a, now); } else { zoomWrong(team2, a, now); }
    }
    else if (m.t === 'letter' && ph === 'phrase_turn') {
      var L = String(m.l || '').toUpperCase().charAt(0);
      if (pid !== S.turn || !/[A-Z]/.test(L) || S.used.indexOf(L) >= 0) { return; }
      S.used += L; S.slock = [false, false]; S.idle = 0;
      var n = 0;
      for (var x = 0; x < P.ph.length; x++) { if (P.ph.charAt(x) === L) { S.ph.mask[x] = L; n++; } }
      S.last = { l: L, n: n, who: p.n };
      if (n > 0) {
        award(team2, 20 * n, pid); fx('ding');
        if (!hiddenCount()) { award(team2, 100, pid); return phraseReveal(pid, 'letters', now); }
        phraseTurn(now);
      } else {
        fx('wrong');
        if (!phraseMiss(now)) { S.pteam = 1 - team2; phraseTurn(now); }
      }
    }
    else if (m.t === 'solve' && ph === 'phrase_solve') {
      if (pid !== S.solver) { return; }
      if (phraseMatch(m.text)) { award(team2, 150 + 25 * hiddenCount(), pid); phraseReveal(pid, 'solve', now); }
      else {
        S.slock[team2] = true; S.last = { bad: clean(m.text, 40), who: p.n }; fx('wrong'); say(line('wrong'));
        if (!phraseMiss(now)) { phraseTurn(now); }
      }
    }
    else if (m.t === 'fpick' && ph === 'feud_pick') {
      var o2 = parseInt(m.o, 10);
      if (pid !== S.turn || !(o2 >= 0 && o2 < S.f.o.length) || S.f.tried.indexOf(o2) >= 0) { return; }
      feudPick(o2, now);
    }
  }

  function tick(now) { if (S && !S.paused && S.deadline && now >= S.deadline) { advance(now, true); return true; } return false; }

  return {
    init: init, handle: handle, tick: tick,
    cmd: function (c, a, now) { cmd(c, a, now); },
    state: function () { return S; },
    dump: function () { return JSON.stringify({ S: S, P: P, kc: kc }); },
    load: function (str) { try { var d = JSON.parse(str); if (d && d.S && d.P) { S = d.S; P = d.P; kc = d.kc || 0; return true; } } catch (e) { } return false; },
    _private: function () { return P; }
  };
};
if (typeof module !== 'undefined') { module.exports = RC; }
