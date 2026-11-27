/* Game Show Night engine. Pure state machine: no DOM, no network.
   The TV screen runs one engine; phones only send small messages. */
var RC = (typeof RC !== 'undefined') ? RC : {};
RC.createEngine = function (C, opts) {
  opts = opts || {};
  var rnd = opts.rand || Math.random;
  var S = null;   // public state, broadcast to everyone
  var P = null;   // private data (answers), never broadcast
  var H = null;   // host-side data that outlives a show: the host key and which questions were already used
  var kc = 0;
  var PRESENT_MS = 30000;
  var TEAM_NAMES = ['Aces', 'Kings', 'Queens', 'Jacks', 'Jokers'];
  var EARLY_COST = 50;   // points lost for buzzing before GO, or for a wrong answer after buzzing
  function newKey() { var k = ''; for (var i = 0; i < 8; i++) { k += 'abcdefghjkmnpqrstuvwxyz23456789'.charAt(Math.floor(rnd() * 31)); } return k; }

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) { a.push(i); } return a; }
  function pickOne(a) { return a[Math.floor(rnd() * a.length)]; }
  function line(key, sub) { // one of the host's lines; {n}, {k}... are filled in from sub
    var t = pickOne(C.lines[key] || ['']);
    if (sub) { for (var k in sub) { if (sub.hasOwnProperty(k)) { t = t.split('{' + k + '}').join(sub[k]); } } }
    return t;
  }
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
    S.phase = phase; S.k = phase + ':' + kc; S.acted = {}; S.t0 = now; S.bzw = 0; S.nag = 0; if (P) { P.bzq = null; }
    S.deadline = dur ? now + dur : 0;
  }
  function pl(pid) { return S.players[pid]; }
  function present(pid, now) { var p = pl(pid); return !!p && (now - p.seen) < PRESENT_MS; }
  function teamList(t, now) { var out = []; for (var i = 0; i < S.order.length; i++) { var p = pl(S.order[i]); if (p && p.t === t && present(S.order[i], now)) { out.push(S.order[i]); } } return out; }
  function teamPresent(t, now) { return teamList(t, now).length > 0; }
  function NT() { return S.teams.length; }
  function zeros() { var a = []; for (var i = 0; i < S.teams.length; i++) { a.push(0); } return a; }
  function nextPlayer(t, now) {
    var list = teamList(t, now);
    if (!list.length) { return null; }
    S.rot[t] = ((S.rot[t] == null ? -1 : S.rot[t]) + 1) % list.length;
    return list[S.rot[t]];
  }
  function nextAll(now) { // every player for themselves: rotate through everyone who is here
    var list = [];
    for (var i = 0; i < S.order.length; i++) { if (present(S.order[i], now)) { list.push(S.order[i]); } }
    if (!list.length) { return null; }
    S.rotA = ((S.rotA || 0) + 1) % list.length;
    return list[S.rotA];
  }
  /* The next team after t that has someone here. With only one team here it is t itself. */
  function nextTeam(t, now) { for (var i = 1; i <= NT(); i++) { var x = (t + i) % NT(); if (teamPresent(x, now)) { return x; } } return t; }
  function nextPlayerAny(t, now) { if (S.solo) { return nextAll(now); } var p = nextPlayer(t, now); if (p) { return p; } return nextPlayer(nextTeam(t, now), now); }
  /* A "side" is whoever shares a lockout: a team in team play, one player in solo play. */
  function side(pid) { var p = pl(pid); if (!p) { return 'x'; } return S.solo ? pid : p.t; }
  function othersLeft(lockMap, now) { for (var i = 0; i < S.order.length; i++) { if (present(S.order[i], now) && !lockMap[side(S.order[i])] && !(S.early && S.early[S.order[i]])) { return true; } } return false; }
  function award(team, pts, pid) {
    if (pid && pl(pid)) { pl(pid).pts += pts; }
    if (S.solo || !(team >= 0 && team < NT())) { return; }
    S.teams[team].score += pts;
    S.gain = { id: (S.gain ? S.gain.id : 0) + 1, team: team, pts: pts };
  }
  function addGains(g) { if (S.solo) { return; } for (var t = 0; t < NT(); t++) { S.teams[t].score += g[t]; } }
  function ranking() { // players, best first
    var out = [];
    for (var i = 0; i < S.order.length; i++) { var p = pl(S.order[i]); if (p) { out.push({ p: S.order[i], n: p.n, pts: p.pts, t: p.t }); } }
    out.sort(function (x, y) { return y.pts - x.pts; });
    return out;
  }
  function nm(pid) { return pid && pl(pid) ? pl(pid).n : 'Nobody'; }
  /* A line about who is winning, for the host to drop in every few questions. */
  function standingLine() {
    S.cc = (S.cc || 0) + 1;
    if (S.cc % 3 !== 0) { return ''; }
    if (S.solo) { var rk = ranking(); if (rk.length < 2 || !rk[0].pts) { return ''; } return rk[0].pts === rk[1].pts ? ' ' + rk[0].n + ' and ' + rk[1].n + ' are tied for first.' : ' ' + rk[0].n + ' is out in front, ' + (rk[0].pts - rk[1].pts) + ' ahead of ' + rk[1].n + '.'; }
    var ld = leader(), second = -Infinity;
    if (ld < 0) { return ' It is tied at the top. Anybody can take this.'; }
    for (var t = 0; t < NT(); t++) { if (t !== ld && S.teams[t].score > second) { second = S.teams[t].score; } }
    var gap = S.teams[ld].score - second;
    return ' ' + S.teams[ld].name + (gap <= 100 ? ' lead by just ' + gap + '. This is close.' : ' are ' + gap + ' in front. Somebody catch them!');
  }
  /* Part way through a screen, the host calls out whoever everyone is waiting on. Once per screen. */
  var WAITING = { vote_q: 1, ml_q: 1, num_q: 1, cr_q: 1, board_q: 1, fam_in: 1, fam_q: 1 }, TURNS = { board_pick: 'pick a category', phrase_turn: 'pick a letter', feud_pick: 'pick an answer', zoom_ans: 'pick your answer' };
  function nagTick(now) {
    if (S.nag || !S.deadline || !S.t0) { return false; }
    var ph = S.phase, part = (now - S.t0) / (S.deadline - S.t0);
    if (WAITING[ph] && part > 0.55) {
      var miss = [];
      for (var i = 0; i < S.order.length; i++) { if (present(S.order[i], now) && !S.acted[S.order[i]]) { miss.push(nm(S.order[i])); } }
      S.nag = 1;
      if (miss.length && miss.length <= 3) { say(line('nagOne', { n: miss.join(' and ') })); return true; }
      if (miss.length > 3) { say(line('nagMany', { k: miss.length })); return true; }
      return false;
    }
    if (TURNS[ph] && S.turn && pl(S.turn) && part > 0.4) { S.nag = 1; say(line('nagTurn', { n: nm(S.turn), 'do': TURNS[ph] })); return true; }
    return false;
  }
  function trailing() { var best = [], min = Infinity; for (var t = 0; t < NT(); t++) { if (S.teams[t].score < min) { min = S.teams[t].score; best = [t]; } else if (S.teams[t].score === min) { best.push(t); } } return pickOne(best); }
  function leader() { var top = -1, max = -Infinity, tie = false; for (var t = 0; t < NT(); t++) { if (S.teams[t].score > max) { max = S.teams[t].score; top = t; tie = false; } else if (S.teams[t].score === max) { tie = true; } } return tie ? -1 : top; }
  function activeTeam(t, now) { if (!(t >= 0 && t < NT())) { t = 0; } return teamPresent(t, now) ? t : nextTeam(t, now); }
  function smallestTeam() { var n = zeros(), best = 0; for (var i = 0; i < S.order.length; i++) { var p = pl(S.order[i]); if (p && n[p.t] != null) { n[p.t]++; } } for (var t = 1; t < NT(); t++) { if (n[t] < n[best]) { best = t; } } return best; }
  /* Take n items from a pool, using ones that have not come up yet before any repeat. */
  function draw(key, list, n) {
    var u = H.used[key] || (H.used[key] = {}), fresh = [], stale = [], i;
    n = Math.min(n, list.length);
    for (i = 0; i < list.length; i++) { (u[i] ? stale : fresh).push(i); }
    if (fresh.length < n) { u = H.used[key] = {}; }   // the pool ran out: start it over, unused ones still first
    var order = shuffle(fresh).concat(shuffle(stale)).slice(0, n), out = [];
    for (i = 0; i < order.length; i++) { u[order[i]] = 1; out.push(list[order[i]]); }
    return out;
  }
  function penalize(pid, n) { var p = pl(pid); if (!p) { return; } p.pts -= n; if (!S.solo && S.teams[p.t]) { S.teams[p.t].score -= n; } }

  function init(room, now) {
    kc = 0;
    S = {
      v: 5, room: room, boot: Math.floor(rnd() * 1e9), phase: 'lobby', k: 'lobby:0', paused: false, pleft: 0,
      teams: [{ name: TEAM_NAMES[0], score: 0 }, { name: TEAM_NAMES[1], score: 0 }],
      players: {}, order: [], boss: null, round: 0, rot: [], epoch: 1, out: {}, early: {}, locked: {},
      say: { id: 0, text: '' }, fx: { id: 0, name: '' }, gain: null,
      acted: {}, deadline: 0, turn: null,
      short: false, solo: true, played: {}, cur: ''
    };
    P = {};
    H = { key: newKey(), used: opts.used || {} };
    return S;
  }

  /* ---------- round flow ---------- */
  function goMenu(now) {
    S.turn = null; S.cur = '';
    setPhase('menu', now, 0);
    say((S.boss && pl(S.boss) ? nm(S.boss) : 'Host') + (S.round ? ', pick the next game.' : ', pick the first game.'));
  }
  function startGame(key, now) {
    var info = CAT[key];
    if (!info) { return; }
    var first = S.round === 0;
    S.round++; S.cur = key; S.played[key] = (S.played[key] || 0) + 1;
    S.intro = { n: S.round, title: info.title, how: info.how };
    S.rt = info.title;
    S.turn = null; S.rv = null;
    // remember the scores, so the host can restart this game from the top
    P.snap = { teams: [], pts: {}, bz: {} };
    for (var st = 0; st < NT(); st++) { P.snap.teams.push(S.teams[st].score); }
    for (var sp = 0; sp < S.order.length; sp++) { if (pl(S.order[sp])) { P.snap.pts[S.order[sp]] = pl(S.order[sp]).pts; P.snap.bz[S.order[sp]] = pl(S.order[sp]).bz; } }
    setPhase('intro', now, 20000);
    say((first ? line('welcome') + ' ' : '') + info.title + '. ' + info.how.join(' '));
    fx('fanfare');
  }
  function beginRound(now) {
    var key = S.cur;
    if (key === 'vote') { P.vq = draw('votes', C.votes, cnt(8, 5)); P.vkind = 'mix'; S.vi = -1; nextVote(now); }
    else if (key === 'tf') { P.vq = draw('tf', C.tf, cnt(10, 6)); P.vkind = 'tf'; S.vi = -1; nextVote(now); }
    else if (key === 'decade') { P.vq = draw('decades', C.decades, cnt(8, 5)); P.vkind = 'decade'; S.vi = -1; nextVote(now); }
    else if (key === 'likely') { P.mq = draw('likely', C.likely, cnt(6, 4)); S.mi = -1; nextLikely(now); }
    else if (key === 'num') { P.nq = draw('numbers', C.numbers, cnt(6, 4)); S.ni = -1; nextNum(now); }
    else if (key === 'scramble') { P.wq = draw('words', C.words, cnt(6, 4)); S.wi = -1; nextWord(now); }
    else if (key === 'board') { setupBoard(now); boardPick(now); }
    else if (key === 'zoom') { P.zs = draw('zoom', C.zoom, cnt(5, 3)); S.zi = -1; nextZoom(now); }
    else if (key === 'phrase') { P.ps = draw('phrases', C.phrases, cnt(4, 2)); S.pi = -1; S.pteam = trailing(); nextPhrase(now); }
    else if (key === 'feud') { setupFeud(); S.fi = -1; nextFeud(now); }
    else if (key === 'crillion') { P.cq = draw('crillion', C.crillion, cnt(5, 3)); S.ci = -1; nextCr(now); }
    else if (key === 'fam') { famStart(now); }
  }
  function roundEnd(now) {
    S.turn = null;
    S.re = { n: S.round, title: S.rt };
    setPhase('round_end', now, 10000);
    var rk = ranking(), ld = leader();
    if (S.solo) { say(rk.length ? rk[0].n + ' is in front with ' + rk[0].pts + ' points.' : 'No points yet.'); }
    else { say(ld < 0 ? line('tied') : line('lead', { t: S.teams[ld].name, p: S.teams[ld].score })); }
    fx('fanfare');
  }
  function finale(now) {
    var best = null, king = null;
    for (var i = 0; i < S.order.length; i++) {
      var p = pl(S.order[i]); if (!p) { continue; }
      if (!best || p.pts > best.pts) { best = p; }
      if (!king || p.bz > king.bz) { king = p; }
    }
    var rk = ranking();
    S.fin = { solo: !!S.solo, winner: leader(), mvp: best ? best.n : '', mvpPts: best ? best.pts : 0, king: king && king.bz ? king.n : '', kingN: king ? king.bz : 0,
      champ: rk.length ? rk[0].n : '', tie: rk.length > 1 && rk[0].pts === rk[1].pts };
    S.turn = null;
    setPhase('final', now, 0);
    S.fin.best = rk.length ? rk[0].n : ''; S.fin.bestPts = rk.length ? rk[0].pts : 0;
    if (S.solo) { say((S.fin.tie ? 'It is a tie at the top! ' : S.fin.champ + ' wins! ') + line('final')); }
    else { say((S.fin.winner < 0 ? 'It is a tie! ' : S.teams[S.fin.winner].name + ' win! ') + line('final')); }
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
    var counts = [], ok = zeros(), den = zeros(), fast = null, pid, v, nok = 0;
    for (var ci2 = 0; ci2 < P.cur.o.length; ci2++) { counts.push(0); }
    for (var i = 0; i < S.order.length; i++) {
      pid = S.order[i]; v = P.votes[pid];
      var p = pl(pid); if (!p) { continue; }
      if (v || present(pid, now)) { den[p.t]++; }
      if (v) {
        counts[v.a]++;
        if (v.a === P.cur.a) { ok[p.t]++; nok++; p.pts += 100; if (!fast || v.at < P.votes[fast].at) { fast = pid; } }
      }
    }
    var gains = zeros();
    for (var t = 0; t < NT(); t++) { gains[t] = den[t] ? Math.round(100 * ok[t] / den[t]) : 0; }
    if (fast) { gains[pl(fast).t] += 20; pl(fast).pts += 20; }
    addGains(gains);
    S.rv = { a: P.cur.a, counts: counts, gains: gains, nok: nok, fast: fast ? pl(fast).n : '', fact: P.cur.f };
    setPhase('vote_reveal', now, 9000);
    say('The answer is ' + P.cur.o[P.cur.a] + '. ' + (P.cur.f || '') + (nok ? (nok > 2 && nok === S.nv ? ' ' + line('praiseAll') : ' ' + nok + ' of you got it.') + (fast ? ' ' + line('praiseFast', { n: nm(fast) }) : '') : ' ' + line('teaseNobody')) + standingLine());
    fx(nok > 0 ? 'right' : 'wrong');
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
    var ok = zeros(), den = zeros(), gains = zeros(), nok = 0;
    for (i = 0; i < S.order.length; i++) {
      pid = S.order[i]; var p = pl(pid); if (!p) { continue; }
      if (P.mv[pid] || present(pid, now)) { den[p.t]++; }
      if (P.mv[pid] && tally[P.mv[pid]] === max) { ok[p.t]++; nok++; p.pts += 100; }
    }
    for (var t = 0; t < NT(); t++) { gains[t] = den[t] ? Math.round(100 * ok[t] / den[t]) : 0; }
    addGains(gains);
    S.rv = { win: win, top: top.slice(0, 4), gains: gains, nok: nok };
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
    say('The answer is ' + S.rv.a + '. ' + (best ? (S.rv.exact ? 'Exactly right, ' : 'Closest: ') + S.rv.who + '.' : '') + standingLine());
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

  /* ---------- crillion: the most obscure correct answer wins ---------- */
  function crNorm(t) { return String(t || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, '').replace(/\b(the|a|an|lake|mount|mt|saint|st)\b/g, ' ').replace(/\s+/g, ' ').replace(/^ | $/g, ''); }
  var crWords = null;
  var crClosedWords = {};
  function crKnown() { // every answer on every Crillion sheet, right or wrong, as typed-exactly keys
    if (crWords) { return crWords; }
    crWords = {}; crClosedWords = {};
    (C.crillion || []).forEach(function (it) {
      it.a.forEach(function (x) { if (it.closed) { crClosedWords[crNorm(x[0]).replace(/ /g, '')] = 1; } crWords[crNorm(x[0]).replace(/ /g, '')] = 1; (x[2] || []).forEach(function (al) { crWords[crNorm(al).replace(/ /g, '')] = 1; }); });
      (it.no || []).forEach(function (x) { crWords[crNorm(x[0]).replace(/ /g, '')] = 1; });
    });
    return crWords;
  }
  function crMatch(item, text) { // returns {st:'ok',name,said} | {st:'no',why} | {st:'ask'}
    var a = crNorm(text).replace(/ /g, ''), i, j, d, best = null, bd = 99, bad = null, nd = 99, tie = false;
    if (!a) { return { st: 'no', why: 'No answer.' }; }
    for (i = 0; i < item.no.length; i++) {
      d = near(a, crNorm(item.no[i][0]).replace(/ /g, ''));
      if (d === 0) { return { st: 'no', why: item.no[i][1] }; }
      if (d > 0 && d < nd) { nd = d; bad = item.no[i]; }
    }
    for (i = 0; i < item.a.length; i++) {
      var names = [item.a[i][0]].concat(item.a[i][2] || []);
      for (j = 0; j < names.length; j++) {
        d = near(a, crNorm(names[j]).replace(/ /g, ''));
        if (d >= 0 && d < bd) { bd = d; best = item.a[i]; tie = false; }
        else if (d >= 0 && d === bd && best !== item.a[i]) { tie = true; }
      }
    }
    if (best && bd === 0) { return { st: 'ok', name: best[0], said: best[1] }; }
    if (best && bd < nd && tie) { return { st: 'ask' }; }   // could be either of two answers
    if (best && bd < nd) {
      // close to a right answer. One guard: a correctly spelled, different answer from another sheet
      // ("Australia" when the sheet says "Austria") is not a typo, so a person decides.
      if (crKnown()[a]) { return item.closed ? { st: 'no', why: 'Not a right answer to this question.' } : { st: 'ask' }; }
      return { st: 'ok', name: best[0], said: best[1] };
    }
    if (bad && nd < bd) { return { st: 'no', why: bad[1] }; }
    // The sheet lists every right answer (countries, states, presidents, teams, elements): anything else is wrong.
    if (item.closed) { return { st: 'no', why: 'Not a right answer to this question.' }; }
    // An open question (fruits, birds...): a right answer to some other question is still wrong here; only the unknown goes to the host.
    if (crKnown()[a] && crClosedWords[a]) { return { st: 'no', why: 'Not a right answer to this question.' }; }
    return { st: 'ask' };
  }
  function nextCr(now) {
    S.ci++;
    if (S.ci >= P.cq.length) { return roundEnd(now); }
    var it = P.cq[S.ci];
    S.cr = { n: S.ci + 1, of: P.cq.length, text: it.q, rows: [] };
    P.crA = {}; S.nv = 0; S.rv = null;
    setPhase('cr_q', now, readMs(it.q) + 40000);
    say(it.q + ' Type one answer. The most obscure right answer wins.');
  }
  function crJudge(now) {
    var it = P.cq[S.ci], rows = [], ask = 0;
    for (var i = 0; i < S.order.length; i++) {
      var pid = S.order[i], a = P.crA[pid];
      if (!a || !pl(pid)) { continue; }
      var r = crMatch(it, a.text);
      if (r.st === 'ask') { ask++; }
      rows.push({ p: pid, n: nm(pid), t: pl(pid).t, text: a.text, st: r.st, name: r.name || '', said: r.said || 0, why: r.why || '', by: '' });
    }
    S.cr.rows = rows;
    if (ask) { setPhase('cr_judge', now, 75000); say('Some answers are not on my sheet. The judge decides.'); }
    else { crReveal(now); }
  }
  function crKey(r) { return crNorm(r.st === 'ok' ? r.name : r.text).replace(/ /g, ''); }
  /* How obscure is an answer? "said" is how many people out of 100 would give it. */
  var TIERS = [[35, 10, 'Everybody says it'], [15, 30, 'Common'], [6, 60, 'Rare'], [3, 85, 'Deep cut'], [0, 100, 'One in a million']];
  function crTier(said) { for (var i = 0; i < TIERS.length; i++) { if (said >= TIERS[i][0]) { return TIERS[i]; } } return TIERS[TIERS.length - 1]; }
  function crReveal(now) {
    var rows = S.cr.rows, sum = zeros(), den = zeros(), i, r, same = {}, top = 0, nOk = 0;
    for (i = 0; i < rows.length; i++) { if (rows[i].st === 'ok') { same[crKey(rows[i])] = (same[crKey(rows[i])] || 0) + 1; nOk++; } }
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      r.dup = r.st === 'ok' ? same[crKey(r)] : 0;
      var tier = crTier(r.said);
      r.tier = r.st === 'ok' ? tier[2] : ''; r.base = r.st === 'ok' ? tier[1] : 0;
      // the rarer the answer the more it is worth; the same answer as someone else in the room splits the points
      r.pts = r.st === 'ok' ? Math.max(1, Math.round(r.base / r.dup)) : 0; r.crown = 0;
      if (r.pts > top) { top = r.pts; }
    }
    var winners = [], wtext = '', wrow = null;
    for (i = 0; i < rows.length; i++) { if (top > 0 && rows[i].pts === top) { winners.push(rows[i].n); wtext = rows[i].name; wrow = rows[i]; } }
    var allSame = nOk > 1 && winners.length === nOk && wrow && same[crKey(wrow)] === nOk;
    var crown = winners.length === 1 && nOk > 1;
    if (crown) { wrow.crown = 1; wrow.pts += 50; top += 50; }   // one clear winner: the most obscure answer in the room
    for (i = 0; i < rows.length; i++) { r = rows[i]; if (pl(r.p)) { pl(r.p).pts += r.pts; sum[pl(r.p).t] += r.pts; } }
    for (i = 0; i < S.order.length; i++) { var p = pl(S.order[i]); if (p && (P.crA[S.order[i]] || present(S.order[i], now))) { den[p.t]++; } }
    var gains = zeros();
    for (var t = 0; t < NT(); t++) { gains[t] = den[t] ? Math.round(sum[t] / den[t]) : 0; }
    addGains(gains);
    rows.sort(function (x, y) { return y.pts - x.pts; });
    var who = winners.length > 3 ? winners.length + ' players' : winners.join(' and ');
    S.rv = { gains: gains, who: who, text: winners.length === 1 || allSame ? wtext : '', pts: top, allSame: allSame, crown: crown };
    setPhase('cr_reveal', now, 14000);
    if (!top) { say(line('teaseNobody')); }
    else if (allSame) { say('Everybody said ' + wtext + '. The points are split ' + nOk + ' ways.'); }
    else if (winners.length === 1) { say('The most obscure answer: ' + who + ' with ' + wtext + '. ' + top + ' points.'); }
    else { say('A tie for most obscure: ' + who + ', with ' + top + ' points each.' + standingLine()); }
    fx(top ? 'right' : 'wrong');
  }

  /* ---------- round 2: the board ---------- */
  function setupBoard(now) {
    var cats = draw('bcat', range(C.board.length), cnt(5, 3));
    P.board = []; S.board = { cats: [], used: [] };
    for (var i = 0; i < cats.length; i++) {
      var cat = C.board[cats[i]], row = [];
      for (var l = 0; l < cat.levels.length; l++) { row.push(draw('b' + cats[i] + '_' + l, cat.levels[l], 1)[0]); }
      P.board.push(row); S.board.cats.push(cat.name); S.board.used.push([0, 0, 0, 0]);
    }
    S.ctrl = activeTeam(trailing(), now); S.ctrlP = null; S.pickN = 0;
  }
  function tilesLeft() { var n = 0; for (var c = 0; c < S.board.used.length; c++) { for (var l = 0; l < 4; l++) { if (!S.board.used[c][l]) { n++; } } } return n; }
  function boardPick(now) {
    if (!tilesLeft()) { return roundEnd(now); }
    var why;
    if (S.ctrlP && present(S.ctrlP, now)) { S.turn = S.ctrlP; why = 'fast'; }       // fastest right answer on the last one picks next
    else { S.ctrl = activeTeam(S.ctrl, now); S.turn = nextPlayerAny(S.ctrl, now); why = S.pickN ? 'next' : 'first'; }
    S.pickWhy = why; S.pickN = (S.pickN || 0) + 1;
    S.q = null; S.rv = null;
    setPhase('board_pick', now, 25000);
    say(why === 'fast' ? nm(S.turn) + ', you were fastest on the last one. It is your turn. Pick a category on your phone.' :
      (why === 'first' ? nm(S.turn) + ', you start. Pick a category on your phone.' : 'Nobody got that one. ' + nm(S.turn) + ', it is your turn. Pick a category on your phone.'));
  }
  function openTile(c, l, now) {
    S.board.used[c][l] = 1;
    P.cur = mc(P.board[c][l]);
    S.q = { cat: S.board.cats[c], val: (l + 1) * 100, text: P.cur.q, o: P.cur.o };
    P.bans = {}; S.nv = 0; S.rv = null; S.turn = null;
    setPhase('board_q', now, readMs(P.cur.q) + 20000);
    say(S.q.cat + ' for ' + S.q.val + '. ' + P.cur.q + ' Everyone, answer on your phone.');
  }
  function optsLeft() { var out = []; for (var i = 0; i < P.cur.o.length; i++) { if (S.wrong.indexOf(i) < 0) { out.push({ i: i, text: P.cur.o[i] }); } } return out; }
  function stealName(pid) { var p = pl(pid); return S.solo || !p ? 'Anyone else' : (NT() === 2 ? S.teams[1 - p.t].name : 'Everyone else'); }
  /* Everyone has answered or the clock ran out. Each right answer scores the tile for that player; a team scores
     the tile times the share of its players who were right; the fastest right answer earns half the tile on top. */
  function boardEnd(now) {
    var counts = [], ok = zeros(), den = zeros(), fast = null, i, pid, v, val = S.q.val, bonus = Math.round(val / 2), nok = 0;
    for (i = 0; i < P.cur.o.length; i++) { counts.push(0); }
    for (i = 0; i < S.order.length; i++) {
      pid = S.order[i]; v = P.bans[pid];
      var p = pl(pid); if (!p) { continue; }
      if (v || present(pid, now)) { den[p.t]++; }
      if (v) {
        counts[v.a]++;
        if (v.a === P.cur.a) { ok[p.t]++; nok++; p.pts += val; if (!fast || v.at < P.bans[fast].at) { fast = pid; } }
      }
    }
    var gains = zeros();
    for (var t = 0; t < NT(); t++) { gains[t] = den[t] ? Math.round(val * ok[t] / den[t]) : 0; }
    if (fast) { gains[pl(fast).t] += bonus; pl(fast).pts += bonus; pl(fast).bz++; S.ctrl = pl(fast).t; S.ctrlP = fast; }
    else { S.ctrl = nextTeam(S.ctrl, now); S.ctrlP = null; }
    addGains(gains);
    S.rv = { text: P.cur.o[P.cur.a], a: P.cur.a, counts: counts, gains: gains, nok: nok, fast: fast ? nm(fast) : '', who: fast ? nm(fast) : '', team: fast ? pl(fast).t : -1, val: val, bonus: bonus };
    S.turn = null;
    setPhase('board_reveal', now, 8000);
    say('The answer is ' + S.rv.text + '. ' + (nok ? nok + (nok === 1 ? ' player' : ' players') + ' got it. ' + line('praiseFast', { n: nm(fast) }) : line('teaseNobody')) + standingLine());
    fx(nok ? 'right' : 'wrong');
  }

  /* ---------- round 3: zoom in ---------- */
  function zfrac(now) { if (S.zfrozen != null) { return S.zfrozen; } return Math.max(0, Math.min(1, (now - S.zt0) / S.zdur)); }
  function zvalue(f) { return Math.max(100, Math.round((500 - 400 * f) / 10) * 10); }
  function nextZoom(now) {
    S.zi++;
    if (S.zi >= P.zs.length) { return roundEnd(now); }
    var z = P.zs[S.zi];
    P.cur = mc({ q: '', o: z.o });
    var zd = C.zoomMs || 40000;
    S.z = { n: S.zi + 1, of: P.zs.length, img: z.id, fx: z.fx, fy: z.fy, w: z.w, h: z.h, by: z.by || '', lic: z.lic || '' };
    S.zt0 = now + 3000; S.zdur = zd; S.zfrozen = null; S.openAt = S.zt0 + 1500 + Math.floor(rnd() * 2500);
    S.locked = {}; S.early = {}; S.bzr = []; S.wrong = []; S.rv = null; S.turn = null;
    setPhase('zoom_q', now, 3000 + zd + 6000);
    say('Picture ' + S.z.n + '. Wait for go, then buzz when you know the place.');
  }
  function zoomReveal(pid, now) {
    S.rv = { text: P.cur.o[P.cur.a], who: pid ? nm(pid) : '', team: pid ? pl(pid).t : -1, val: pid ? S.zval : 0 };
    S.zfrom = zfrac(now); S.zfrozen = 1; S.turn = null;
    setPhase('zoom_reveal', now, 9000);
    if (pid) { say(line('right') + ' ' + S.rv.text + '. ' + S.zval + ' points.'); fx('right'); }
    else { say('The answer: ' + S.rv.text + '.'); }
  }
  function zoomWrong(pid, a, now) {
    S.locked[side(pid)] = true;
    if (a >= 0) { S.wrong.push(a); penalize(pid, EARLY_COST); }
    fx('wrong');
    if (othersLeft(S.locked, now) && P.zleft > 1500 && optsLeft().length > 1) {
      S.zt0 = now - S.zfrozen * S.zdur; S.zfrozen = null; S.turn = null; S.openAt = now + 1200 + Math.floor(rnd() * 2000);
      setPhase('zoom_q', now, P.zleft);
      say((pl(pid) ? line('teaseWrong', { n: nm(pid) }) : line('wrong')) + ' ' + stealName(pid) + ', keep looking.');
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
    S.used = ''; S.miss = 0; S.slock = {}; S.last = null; S.rv = null; S.idle = 0; P.keep = null;
    if (S.pi > 0) { S.pteam = nextTeam(S.pteam, now); }
    say('Puzzle ' + S.ph.n + '. The hint is: ' + ph.h + '.');
    phraseTurn(now);
  }
  function phraseTurn(now) {
    S.pteam = activeTeam(S.pteam, now);
    S.turn = (S.solo && P.keep && present(P.keep, now)) ? P.keep : nextPlayerAny(S.pteam, now); S.solver = null; P.keep = null;
    setPhase('phrase_turn', now, 22000);
  }
  function phraseReveal(pid, how, now) {
    for (var i = 0; i < P.ph.length; i++) { S.ph.mask[i] = P.ph.charAt(i); }
    S.rv = { text: P.ph, who: pid ? nm(pid) : '', how: how };
    S.turn = null; S.solver = null;
    setPhase('phrase_reveal', now, 8000);
    if (how === 'bust') { say('Five misses. Oh dear, oh dear. The phrase was: ' + P.ph.toLowerCase() + '.'); fx('wrong'); }
    else { say(line('right') + ' ' + P.ph.toLowerCase() + '!'); fx('right'); }
  }
  function lev(a, b) { // edit distance; two letters typed in the wrong order count as one slip
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; } for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) { d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); }
      }
    }
    return d[m][n];
  }
  /* How a word sounds, roughly: "Kolumbeea" and "Colombia" give the same key. Spelling does not have to be perfect. */
  function soundKey(t) {
    var s = String(t || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!s) { return ''; }
    s = s.replace(/^kn/, 'n').replace(/^gn/, 'n').replace(/^wr/, 'r').replace(/^ps/, 's').replace(/^wh/, 'w').replace(/^gh/, 'g').replace(/^x/, 's');
    s = s.replace(/x/g, 'ks').replace(/ph/g, 'f').replace(/ght/g, 't').replace(/gh/g, '').replace(/tch/g, 'X').replace(/ch/g, 'X').replace(/sh/g, 'X').replace(/ti(?=[ao])/g, 'X');
    s = s.replace(/ck/g, 'k').replace(/qu/g, 'k').replace(/q/g, 'k').replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k');
    s = s.replace(/dg(?=[eiy])/g, 'j').replace(/g(?=[eiy])/g, 'j').replace(/z/g, 's').replace(/v/g, 'f').replace(/y/g, 'i');
    s = s.replace(/(.)\1+/g, '$1');
    var first = s.charAt(0), rest = s.substring(1).replace(/[aeiouhw]/g, '');
    return (/[aeiou]/.test(first) ? 'a' : first) + rest;
  }
  /* Is what they typed close enough to the answer? Returns how far off it is (0 = exact), or -1 for no.
     Both texts must already be lower case with no spaces. */
  function near(a, b) {
    if (!a || !b) { return -1; }
    if (a === b) { return 0; }
    var L = b.length, d = lev(a, b), ka = soundKey(a), kb = soundKey(b);
    var tol = L <= 4 ? 0 : (L <= 6 ? 1 : (L <= 8 ? 2 : (L <= 12 ? 3 : 4)));   // plain typing slips
    if (d <= tol) { return d; }
    if (L <= 3) { return -1; }                                                // very short words must be exact: "pig" is not "pug"
    if (ka === kb && d <= Math.max(2, Math.ceil(L * 0.5))) { return d; }   // sounds the same
    if (L >= 6 && kb.length >= 3 && ka.charAt(0) === kb.charAt(0) && lev(ka, kb) <= 1 && d <= tol + 1) { return d; }   // sounds nearly the same
    return -1;
  }
  function phraseMatch(text) {
    var a = String(text || '').toUpperCase().replace(/[^A-Z]/g, ''), b = P.ph.replace(/[^A-Z]/g, '');
    if (!a) { return false; }
    return near(a.toLowerCase(), b.toLowerCase()) >= 0;
  }
  function phraseMiss(now) {
    S.miss++;
    if (S.miss >= 5) { phraseReveal(null, 'bust', now); return true; }
    return false;
  }

  /* ---------- round 5: survey says ---------- */
  function setupFeud() {
    var pick = draw('surveys', C.surveys, cnt(3, 2));
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
    S.openAt = now + r + 1500 + Math.floor(rnd() * 2500);
    S.early = {}; S.bzr = [];
    setPhase('feud_face', now, r + 4000 + 12000);
    say('We asked 1,000 people: ' + sv.q + ' Wait for go, then buzz.');
  }
  function slotPts(rank) { var sv = P.fq[S.fi]; return Math.round(sv.votes[sv.top[rank]] / 10) * 5 * S.f.mult; }
  function revealSlot(rank, hit) {
    var o = P.fq[S.fi].top[rank];
    S.f.slots[rank] = { text: S.f.o[o], pts: slotPts(rank), votes: P.fq[S.fi].votes[o], hit: hit };
  }
  function slotsOpen() { var n = 0; for (var i = 0; i < 5; i++) { if (!S.f.slots[i]) { n++; } } return n; }
  function feudPlayTurn(now) {
    S.f.mode = 'play';
    S.f.play = activeTeam(S.f.play < 0 ? 0 : S.f.play, now);
    S.turn = nextPlayerAny(S.f.play, now);
    setPhase('feud_pick', now, 18000);
  }
  function feudReveal(team, now) {
    for (var r = 0; r < 5; r++) { if (!S.f.slots[r]) { revealSlot(r, false); } }
    if (S.solo) { team = -1; }
    S.rv = { team: team, pot: S.f.pot, solo: !!S.solo };
    if (team >= 0) { award(team, S.f.pot, null); }
    S.turn = null;
    setPhase('feud_reveal', now, 10000);
    if (S.solo) { say(S.f.strikes >= 3 ? 'Three strikes. Here is the rest of the board.' : 'The board is cleared!'); }
    else { say(team >= 0 ? S.teams[team].name + ' take ' + S.f.pot + ' points!' : 'No points this time.'); }
    fx(team >= 0 || S.solo ? 'right' : 'wrong');
  }
  function feudPick(o, now) { // o = option index, or -1 on timeout
    var f = S.f, team = S.turn && pl(S.turn) ? pl(S.turn).t : f.play;
    var rank = o >= 0 ? P.fq[S.fi].top.indexOf(o) : -1;
    if (o >= 0) { f.tried.push(o); }
    var hit = rank >= 0 && !f.slots[rank];
    if (hit) { revealSlot(rank, true); f.pot += slotPts(rank); if (S.turn && pl(S.turn)) { pl(S.turn).pts += slotPts(rank); } fx('ding'); say(line('survey') + ' ' + f.slots[rank].text + '!'); }
    else { f.x++; fx('strike'); say(line('strike') + (S.turn && pl(S.turn) && rnd() < 0.5 ? ' ' + line('teaseWrong', { n: nm(S.turn) }) : '')); }
    if (S.solo) { // no teams: every hit scores for the player who found it, three strikes ends the board
      if (!hit && f.mode !== 'face') { f.strikes++; }
      if (!slotsOpen() || f.strikes >= 3) { return feudReveal(-1, now); }
      return feudPlayTurn(now);
    }
    if (f.mode === 'face') {
      f.play = hit ? team : nextTeam(team, now);
      if (!slotsOpen()) { return feudReveal(f.play, now); }
      return feudPlayTurn(now);
    }
    if (f.mode === 'play') {
      if (hit) { if (!slotsOpen()) { return feudReveal(f.play, now); } return feudPlayTurn(now); }
      f.strikes++;
      if (f.strikes >= 3) {
        var other = nextTeam(f.play, now);
        if (other !== f.play) {
          f.mode = 'steal'; f.st = other; S.turn = nextPlayer(other, now);
          setPhase('feud_pick', now, 25000);
          say('Three strikes! ' + S.teams[other].name + ' can steal with one answer.');
          return;
        }
        return feudReveal(f.play, now);
      }
      return feudPlayTurn(now);
    }
    // steal
    return feudReveal(hit ? f.st : f.play, now);
  }

  /* ---------- advance: called on deadline or when the showrunner taps Next ---------- */
  /* Spelling fixer for typed facts, so a typo does not give the true fact away. Works without a server:
     15,000 common words to correct towards, plus a bit filter of 31,000 rarer real words to leave alone. */
  var SP = null, spKeep = { cason: 1 };   // spKeep: names in the room, never "corrected"
  function spInit() {
    if (SP) { return SP; }
    var D = (typeof RC !== 'undefined' && RC.spell) ? RC.spell : null;
    SP = { ok: false, rank: {}, list: [], bits: null, m: 0, k: 0, fix: {}, cap: {} };
    if (!D) { return SP; }
    SP.list = D.words.split(','); for (var i = 0; i < SP.list.length; i++) { SP.rank[SP.list[i]] = i + 1; }
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', map = {}, b = [], buf = 0, n = 0;
    for (i = 0; i < 64; i++) { map[A.charAt(i)] = i; }
    for (i = 0; i < D.bits.length; i++) { var c = map[D.bits.charAt(i)]; if (c == null) { continue; } buf = (buf << 6) | c; n += 6; if (n >= 8) { n -= 8; b.push((buf >> n) & 255); } }
    SP.bits = b; SP.m = D.m; SP.k = D.k; SP.fix = D.fix; SP.cap = D.cap || {}; SP.ok = true;
    return SP;
  }
  function spHash(w, seed) { var h = seed >>> 0; for (var i = 0; i < w.length; i++) { h ^= w.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; } return h; }
  function spReal(w) { // a real word we should leave alone?
    if (SP.rank[w]) { return true; }
    var a = spHash(w, 2166136261), b = spHash(w, 3339675911) | 1;
    for (var i = 0; i < SP.k; i++) { var x = ((a + i * b) >>> 0) % SP.m; if (!(SP.bits[x >> 3] & (1 << (x & 7)))) { return false; } }
    return true;
  }
  function spWord(w) { // returns the corrected lower-case word, or the same word
    var L = w.length, best = null, br = 1e9, i, c, t, AB = 'abcdefghijklmnopqrstuvwxyz';
    if (SP.fix[w]) { return SP.fix[w]; }
    if (L < 3 || spKeep[w] || spReal(w)) { return w; }
    if (L >= 5 && /[^aeiou]ys$/.test(w) && SP.rank[w.substr(0, L - 2) + 'ies']) { return w.substr(0, L - 2) + 'ies'; }   // countrys -> countries
    function tryIt(x) { var r = SP.rank[x]; if (r && r < br) { br = r; best = x; } }
    for (i = 0; i < L - 1; i++) { tryIt(w.substr(0, i) + w.charAt(i + 1) + w.charAt(i) + w.substr(i + 2)); }            // two letters swapped
    if (L >= 4) {
      for (i = 1; i < L; i++) { if (w.charAt(i) === w.charAt(i - 1)) { tryIt(w.substr(0, i) + w.substr(i + 1)); } }           // a letter typed twice (other extra letters are left alone: too easy to wreck a foreign word)
      for (i = 0; i <= L; i++) { for (c = 0; c < 26; c++) { tryIt(w.substr(0, i) + AB.charAt(c) + w.substr(i)); } }       // one letter missing
      for (i = 0; i < L; i++) { for (c = 0; c < 26; c++) { tryIt(w.substr(0, i) + AB.charAt(c) + w.substr(i + 1)); } }    // one wrong letter
    }
    if (best) { return best; }
    if (L >= 7) {   // two slips in a long word: same first letter, about the same length
      var bd = 3;
      for (i = 0; i < SP.list.length; i++) { t = SP.list[i]; if (t.charAt(0) !== w.charAt(0) || Math.abs(t.length - L) > 2) { continue; } var d = lev(w, t); if (d < bd) { bd = d; best = t; if (d === 1) { break; } } }
      if (best && bd <= 2) { return best; }
    }
    return w;
  }
  function spellFix(text) {
    spInit(); if (!SP.ok) { return text; }
    var parts = String(text).split(/([A-Za-z\u00C0-\u024F]+(?:'[A-Za-z\u00C0-\u024F]+)?)/), out = '', first = true;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (i % 2 === 0) { out += p; continue; }
      var cap = /^[A-Z]/.test(p), allCap = p.length > 1 && p === p.toUpperCase();
      // a capital in the middle of a sentence is a name or a place: leave it. Words with an apostrophe are left too.
      if (p.indexOf("'") >= 0 || /[^A-Za-z]/.test(p) || (cap && !first && !allCap)) { out += p; first = false; continue; }   // also leaves accented (Spanish, Portuguese) words alone
      var fixed = spWord(p.toLowerCase());
      if (SP.cap[fixed]) { out += SP.cap[fixed]; first = false; continue; }
      if (fixed === p.toLowerCase()) { out += p; }
      else { out += (cap && !allCap && !/^[A-Z]/.test(fixed)) ? fixed.charAt(0).toUpperCase() + fixed.substr(1) : (allCap ? fixed.toUpperCase() : fixed); }
      first = false;
    }
    return out;
  }
  /* ---------- know your family ---------- */
  var FAM_STOP = { that: 1, this: 1, with: 1, have: 1, once: 1, when: 1, from: 1, been: 1, were: 1, never: 1, about: 1, there: 1, every: 1, whole: 1, time: 1, year: 1, years: 1, first: 1, same: 1, than: 1, more: 1, them: 1, they: 1, into: 1, still: 1, only: 1, just: 1, over: 1, used: 1 };
  function famWords(t) { var w = String(t).toLowerCase().replace(/[^a-z ]/g, ' ').split(' '), out = {}; for (var i = 0; i < w.length; i++) { if (w[i].length >= 4 && !FAM_STOP[w[i]]) { out[w[i].substr(0, 6)] = 1; } } return out; }
  function famTidy(t) { // clean-up, so the true fact does not stand out from the made-up ones by its typing or spelling
    t = clean(t, 110);
    if (t.length > 8 && t === t.toUpperCase()) { t = t.toLowerCase(); }
    t = spellFix(t).replace(/\s+([,.!?])/g, '$1').replace(/,(?=[^ ])/g, ', ').replace(/[\s.!]+$/, '');
    t = t.replace(/\bi\b/g, 'I').replace(/\bI m\b/g, "I'm");
    if (!t) { return ''; }
    t = t.charAt(0).toUpperCase() + t.substr(1);
    return t + (/[?]$/.test(t) ? '' : '.');
  }
  function famFakes(text, kid) { // three made-up facts on the same topic and of about the same length
    var low = text.toLowerCase(), cats = {}, tw = famWords(text), same = [], rest = [], i, k, b;
    for (i = 0; i < C.fam.cats.length; i++) { if (new RegExp(C.fam.cats[i][1]).test(low)) { cats[C.fam.cats[i][0]] = 1; } }
    for (i = 0; i < C.fam.bank.length; i++) {
      b = C.fam.bank[i];
      if (P.famUsed[i] || (kid && b[2] === 'a')) { continue; }
      var bw = famWords(b[0]), share = 0; for (k in bw) { if (tw[k]) { share++; } }
      if (share >= 2 || b[0].toLowerCase() === low) { continue; }       // too close to the truth to be fair
      (cats[b[1]] ? same : rest).push(i);
    }
    function closest(list, n) { var c = shuffle(list).slice(0, 9); c.sort(function (x, y) { return Math.abs(C.fam.bank[x][0].length - text.length) - Math.abs(C.fam.bank[y][0].length - text.length); }); return c.slice(0, n); }
    var take = closest(same, 3);
    if (take.length < 3) { take = take.concat(closest(rest, 3 - take.length)); }
    var out = [];
    for (i = 0; i < take.length; i++) { P.famUsed[take[i]] = 1; out.push(C.fam.bank[take[i]][0]); }
    return out;
  }
  function famStart(now) {
    P.fam = {}; P.famUsed = {}; P.famOrder = []; S.fmi = -1;
    var keepWords = []; for (var ki = 0; ki < S.order.length; ki++) { if (pl(S.order[ki])) { keepWords.push(pl(S.order[ki]).n); } }
    for (ki = 0; ki < S.teams.length; ki++) { keepWords.push(S.teams[ki].name); }
    keepWords = keepWords.join(' ').toLowerCase().split(/[^a-z]+/); for (ki = 0; ki < keepWords.length; ki++) { if (keepWords[ki]) { spKeep[keepWords[ki]] = 1; } }
    S.fam = { done: [] }; S.fq = null; S.nv = 0; S.rv = null;
    setPhase('fam_in', now, 150000);
    say('Everybody, look at your phone. Type one true thing about yourself that most people in this room do not know. Start it with the word I. Keep it short, and keep it secret.');
  }
  function famBegin(now) {
    var ids = [];
    for (var i = 0; i < S.order.length; i++) { if (P.fam[S.order[i]] && pl(S.order[i])) { ids.push(S.order[i]); } }
    if (!ids.length) { say('Nobody sent a fact, so we skip this one.'); return roundEnd(now); }
    P.famOrder = shuffle(ids).slice(0, cnt(20, 6));
    S.fmi = -1;
    famNext(now);
  }
  function famNext(now) {
    S.fmi++;
    while (S.fmi < P.famOrder.length && !pl(P.famOrder[S.fmi])) { S.fmi++; }
    if (S.fmi >= P.famOrder.length) { return roundEnd(now); }
    var pid = P.famOrder[S.fmi], f = P.fam[pid];
    var fakes = famFakes(f.text, f.kid);
    P.cur = mc({ q: '', o: [f.text].concat(fakes) });
    P.votes = {};
    S.fq = { n: S.fmi + 1, of: P.famOrder.length, who: pid, name: nm(pid), t: pl(pid).t, o: P.cur.o };
    S.nv = 0; S.rv = null;
    setPhase('fam_q', now, 14000 + 30000);
    S.acted[pid] = true;                                               // nobody waits on the person the facts are about
    var spoken = ''; for (var i = 0; i < P.cur.o.length; i++) { spoken += ' ' + 'ABCD'.charAt(i) + '. ' + P.cur.o[i]; }
    say('Four things about ' + nm(pid) + '. Only one is true. ' + nm(pid) + ', keep a straight face.' + spoken);
  }
  function famEnd(now) {
    var counts = [], ok = zeros(), den = zeros(), nok = 0, voters = 0, okp = {}, who = S.fq.who, sub = pl(who), i, pid, v, p;
    for (i = 0; i < P.cur.o.length; i++) { counts.push(0); }
    for (i = 0; i < S.order.length; i++) {
      pid = S.order[i]; v = P.votes[pid]; p = pl(pid);
      if (!p || pid === who) { continue; }
      if (v || present(pid, now)) { den[p.t]++; }
      if (v) { voters++; counts[v.a]++; if (v.a === P.cur.a) { ok[p.t]++; nok++; okp[pid] = 1; p.pts += 100; } }
    }
    var gains = zeros(), fooled = voters - nok, bonus = voters ? Math.round(100 * fooled / voters / 10) * 10 : 0;
    for (var t = 0; t < NT(); t++) { gains[t] = den[t] ? Math.round(100 * ok[t] / den[t]) : 0; }
    if (sub && bonus) { sub.pts += bonus; if (gains[sub.t] != null) { gains[sub.t] += bonus; } }
    addGains(gains);
    S.rv = { a: P.cur.a, counts: counts, gains: gains, nok: nok, okp: okp, fooled: fooled, bonus: bonus, voters: voters };
    setPhase('fam_rv', now, 11000);
    say('The true one is ' + 'ABCD'.charAt(P.cur.a) + '. ' + P.cur.o[P.cur.a] + ' ' + (voters ? (nok === 0 ? S.fq.name + ' fooled every single one of you! Do you people even talk to each other?' : (fooled === 0 ? 'Everybody knew it. ' + S.fq.name + ', you are an open book, darling.' : nok + (nok === 1 ? ' person' : ' people') + ' knew it. ' + S.fq.name + ' fooled ' + fooled + '.')) : 'Nobody voted.') + standingLine());
    fx(nok > 0 ? 'right' : 'wrong');
  }

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
    else if (ph === 'board_q') { boardEnd(now); }
    else if (ph === 'board_reveal') { boardPick(now); }
    else if (ph === 'zoom_q') { zoomReveal(null, now); }
    else if (ph === 'zoom_ans') { zoomWrong(S.turn, -1, now); }
    else if (ph === 'zoom_reveal') { nextZoom(now); }
    else if (ph === 'phrase_turn') { S.idle++; if (S.idle >= 6) { phraseReveal(null, 'bust', now); } else { S.pteam = nextTeam(S.pteam, now); phraseTurn(now); } }
    else if (ph === 'phrase_solve') { S.slock[side(S.solver)] = true; fx('wrong'); if (!phraseMiss(now)) { phraseTurn(now); } }
    else if (ph === 'phrase_reveal') { nextPhrase(now); }
    else if (ph === 'feud_face') { S.f.play = activeTeam(trailing(), now); feudPlayTurn(now); }
    else if (ph === 'feud_pick') { feudPick(-1, now); }
    else if (ph === 'feud_reveal') { nextFeud(now); }
    else if (ph === 'cr_q') { crJudge(now); }
    else if (ph === 'cr_judge') { for (var ri = 0; ri < S.cr.rows.length; ri++) { if (S.cr.rows[ri].st === 'ask') { S.cr.rows[ri].st = 'no'; S.cr.rows[ri].why = 'Not accepted.'; } } crReveal(now); }
    else if (ph === 'cr_reveal') { nextCr(now); }
    else if (ph === 'fam_in') { famBegin(now); }
    else if (ph === 'fam_q') { famEnd(now); }
    else if (ph === 'fam_rv') { famNext(now); }
    else if (ph === 'round_end') { goMenu(now); }
  }
  /* ---------- showrunner commands ---------- */
  function cmd(c, a, now) {
    a = a || {};
    if (c === 'play') { if (S.phase === 'lobby' || S.phase === 'menu' || S.phase === 'round_end') { startGame(clean(a.key, 12), now); } }
    else if (c === 'menu') { if (S.phase !== 'final') { if (S.paused) { cmd('pause', null, now); } goMenu(now); } }
    else if (c === 'next') {
      // A Next that was tapped on the screen before this one, or within a blink of this one opening, is ignored.
      // Without this, a double tap on Next skipped the question that had just come up.
      if (a && a.k && a.k !== S.k) { return; }
      if (!S.paused && S.t0 && now - S.t0 < 900) { return; }
      if (S.paused) { cmd('pause', null, now); }
      advance(now, false);
    }
    else if (c === 'pause') {
      if (!S.paused) { S.paused = true; S.pleft = S.deadline ? Math.max(0, S.deadline - now) : 0; S.pat = now; }
      else {
        S.paused = false; var d = now - S.pat;
        if (S.deadline) { S.deadline = now + S.pleft; }
        if (S.zt0) { S.zt0 += d; } if (S.openAt) { S.openAt += d; }
      }
    }
    else if (c === 'skip') { if (S.phase !== 'lobby' && S.phase !== 'final' && S.phase !== 'round_end') { roundEnd(now); } }
    else if (c === 'adj') { var t = parseInt(a.team, 10); var d2 = Math.max(-500, Math.min(500, parseInt(a.d, 10) || 0)); if (t >= 0 && t < NT()) { S.teams[t].score += d2; } }
    else if (c === 'solo') { if (S.phase === 'lobby' || S.phase === 'menu') { S.solo = !!a.on; } }
    else if (c === 'crj') { // the judge rules on an answer that was not on the sheet; one ruling covers everyone who typed the same thing
      if (S.phase === 'cr_judge') {
        var left = 0, jt = null, ji;
        for (ji = 0; ji < S.cr.rows.length; ji++) { if (S.cr.rows[ji].st === 'ask' && S.cr.rows[ji].p === a.p) { jt = crNorm(S.cr.rows[ji].text).replace(/ /g, ''); } }
        for (ji = 0; ji < S.cr.rows.length; ji++) {
          var jr = S.cr.rows[ji];
          if (jt !== null && jr.st === 'ask' && crNorm(jr.text).replace(/ /g, '') === jt) {
            if (a.ok) { jr.st = 'ok'; jr.said = Math.max(3, Math.min(40, parseInt(a.said, 10) || 5)); jr.name = jr.text; jr.by = clean(a.by, 20) || 'the judge'; }
            else { jr.st = 'no'; jr.why = clean(a.why, 90) || 'Not accepted.'; }
          }
          if (jr.st === 'ask') { left++; }
        }
        if (!left) { crReveal(now); }
      }
    }
    else if (c === 'short') { if (S.phase === 'lobby' || S.phase === 'menu') { S.short = !!a.on; } }
    else if (c === 'boss') { if (pl(a.pid)) { S.boss = a.pid; } }
    else if (c === 'unhost') { S.boss = null; H.key = newKey(); }   // from the TV only: show a fresh host code
    else if (c === 'teams') { if (a.names) { for (var ti = 0; ti < NT() && ti < a.names.length; ti++) { S.teams[ti].name = clean(a.names[ti], 14) || TEAM_NAMES[ti]; } } }
    else if (c === 'nteams') { // how many teams, 2 to 5. Between games only.
      if (S.phase === 'lobby' || S.phase === 'menu') {
        var nn = Math.max(2, Math.min(5, parseInt(a.n, 10) || 2)), wasSolo = S.solo;
        S.solo = false;
        while (S.teams.length < nn) { S.teams.push({ name: TEAM_NAMES[S.teams.length], score: 0 }); }
        while (S.teams.length > nn) { S.teams.pop(); }
        S.rot = [];
        for (var ni = 0; ni < S.order.length; ni++) { var np = pl(S.order[ni]); if (np && !(np.t >= 0 && np.t < nn)) { np.t = 0; np.t = smallestTeam(); } }
        if (wasSolo) { for (var nj = 0; nj < S.order.length; nj++) { if (pl(S.order[nj])) { pl(S.order[nj]).t = nj % nn; } } }   // first split: deal people out evenly, the host moves them after
      }
    }
    else if (c === 'shuffle') { // deal everyone into even teams at random
      if (S.phase === 'lobby' || S.phase === 'menu') { var deck = shuffle(S.order); for (var di = 0; di < deck.length; di++) { if (pl(deck[di])) { pl(deck[di]).t = di % NT(); } } S.rot = []; }
    }
    else if (c === 'move') { var mp = pl(a.p), mt = parseInt(a.t, 10); if (mp && mt >= 0 && mt < NT()) { mp.t = mt; } }
    else if (c === 'kick') { // take a player out. Their phone cannot rejoin until the host lets them back in.
      if (pl(a.p) && a.p !== S.boss) {
        S.out[a.p] = pl(a.p).n;
        delete S.players[a.p]; S.order.splice(S.order.indexOf(a.p), 1);
        if ((S.turn === a.p || S.solver === a.p) && S.deadline) { S.deadline = now; }
      }
    }
    else if (c === 'unkick') { delete S.out[clean(a.p, 12)]; }
    else if (c === 'restart') { // play the current game again from the top, with the scores it started with
      if (S.cur && P.snap && S.phase !== 'lobby' && S.phase !== 'menu' && S.phase !== 'final') {
        if (S.paused) { cmd('pause', null, now); }
        for (var ri2 = 0; ri2 < NT() && ri2 < P.snap.teams.length; ri2++) { S.teams[ri2].score = P.snap.teams[ri2]; }
        for (var rp in P.snap.pts) { if (P.snap.pts.hasOwnProperty(rp) && pl(rp)) { pl(rp).pts = P.snap.pts[rp]; pl(rp).bz = P.snap.bz[rp] || 0; } }
        S.round--; S.played[S.cur] = Math.max(0, (S.played[S.cur] || 1) - 1);
        startGame(S.cur, now);
      }
    }
    else if (c === 'reset') { // start the whole night over: everyone types a name and picks a team again
      if (S.paused) { S.paused = false; }
      S.players = {}; S.order = []; S.out = {}; S.epoch++;
      for (var zi = 0; zi < NT(); zi++) { S.teams[zi].score = 0; }
      S.round = 0; S.rot = []; S.rotA = 0; S.played = {}; S.cur = ''; P = {};
      S.q = null; S.rv = null; S.fin = null; S.turn = null;
      setPhase('lobby', now, 0);
    }
    else if (c === 'end') { if (S.round > 0) { if (S.paused) { cmd('pause', null, now); } finale(now); } }
    else if (c === 'again') {
      for (var ai = 0; ai < NT(); ai++) { S.teams[ai].score = 0; }
      S.round = 0; S.rot = []; S.rotA = 0; S.played = {}; S.cur = ''; P = {};
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
    if (m.t === 'ctl') { if (pid === S.boss) { if (p) { p.seen = now; } cmd(clean(m.c, 10), m.a, now); } return; }
    if (m.t === 'hello') {
      if (S.out[pid]) { return; }
      var name = clean(m.name, 14); var team = parseInt(m.team, 10);
      if (!name) { return; }
      if (!p) {
        if (S.order.length >= 30) { return; }
        if (+m.ep !== S.epoch) { return; }   // this phone joined a night that was since started over: it must join again
        if (!(team >= 0 && team < NT())) { team = smallestTeam(); }
        S.players[pid] = p = { n: name, t: team, seen: now, pts: 0, bz: 0, e: 0, rtt: 0, late: 0 };
        S.order.push(pid);
        fx('join'); if (S.phase === 'lobby') { say(line('joined', { n: name })); }
      } else { p.n = name; }
      if (m.h && m.h === H.key) { S.boss = pid; }
      p.seen = now;
      if (m.ts > 0) { p.e = +m.ts; }
      if (m.rtt > 0) { p.rtt = Math.min(9999, Math.round(+m.rtt)); }
      return;
    }
    if (!p) { return; }
    p.seen = now;
    if (m.t === 'team') { var nt2 = parseInt(m.team, 10); if (S.phase === 'lobby' && nt2 >= 0 && nt2 < NT()) { p.t = nt2; } return; }
    if (!p) { return; }
    p.seen = now;
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
      var wt = String(m.text || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (wt && wt !== S.ws.mix.replace(/[^A-Z]/g, '') && near(wt.toLowerCase(), P.word.toLowerCase()) >= 0) {
        P.wd[pid] = 1; S.acted[pid] = true;
        award(team2, S.ws.done.length ? 40 : 150, pid);
        if (!S.ws.done.length) { say(p.n + ' got it first! Ten seconds for everyone else.'); if (S.deadline > now + 10000) { S.deadline = now + 10000; } }
        S.ws.done.push(p.n); fx('ding');
        if (allActed(now)) { endWord(now); }
      } else { S.wr[pid] = (S.wr[pid] || 0) + 1; }
    }
    else if (m.t === 'fam' && ph === 'fam_in') {
      var ft = famTidy(m.text);
      if (P.fam[pid] || ft.replace(/[^A-Za-z0-9]/g, '').length < 6) { return; }
      P.fam[pid] = { text: ft, kid: m.kid ? 1 : 0 }; S.acted[pid] = true; S.nv++; S.fam.done.push(p.n);
      if (allActed(now)) { famBegin(now); }
    }
    else if (m.t === 'famv' && ph === 'fam_q') {
      a = parseInt(m.a, 10);
      if (pid === S.fq.who || P.votes[pid] || !(a >= 0 && a < P.cur.o.length)) { return; }
      P.votes[pid] = { a: a, at: now }; S.acted[pid] = true; S.nv++;
      if (allActed(now)) { famEnd(now); }
    }
    else if (m.t === 'cr' && ph === 'cr_q') {
      var ct = clean(m.text, 40);
      if (P.crA[pid] || !ct) { return; }
      P.crA[pid] = { text: ct, at: now }; S.acted[pid] = true; S.nv++;
      if (allActed(now)) { crJudge(now); }
    }
    else if (m.t === 'pick' && ph === 'board_pick') {
      if (S.t0 && now - S.t0 < 700) { return; }
      var c = parseInt(m.c, 10), l = parseInt(m.l, 10);
      if ((pid !== S.turn && pid !== S.boss) || !(c >= 0 && c < S.board.used.length) || !(l >= 0 && l < 4) || S.board.used[c][l]) { return; }
      openTile(c, l, now);
    }
    else if (m.t === 'buzz') {
      if (ph === 'zoom_q' || ph === 'feud_face') {
        if (S.early[pid] || (ph === 'zoom_q' && S.locked[side(pid)]) || (P.bzq && P.bzq.got[pid])) { return; }
        if (m.early || now < S.openAt - 600) {   // tapped before GO: it costs points, but the player stays in
          P.earlyAt = P.earlyAt || {};
          if (P.earlyAt[pid] && now - P.earlyAt[pid] < 1500) { return; }
          P.earlyAt[pid] = now; penalize(pid, EARLY_COST);
          S.fs = { id: (S.fs ? S.fs.id : 0) + 1, n: p.n }; fx('wrong'); say(line('teaseEarly', { n: p.n }));
          return;
        }
        // Each phone reports how long after its own GO the tap came. Everyone who buzzes within half a second
        // of the first arrival is compared on that reaction time, so a slow connection does not lose the race.
        var dt = parseInt(m.dt, 10); if (!(dt >= 0 && dt < 60000)) { dt = Math.max(0, now - S.openAt); }
        if (!P.bzq) {
          P.bzq = { until: now + 500, list: [], got: {} }; S.bzw = 1;
          if (ph === 'zoom_q') { S.zfrozen = zfrac(now); P.zleft = S.deadline - now; }
        }
        P.bzq.got[pid] = 1; P.bzq.list.push({ p: pid, dt: dt, at: now }); S.acted[pid] = true; fx('buzz');
      } else if (ph === 'phrase_turn') {
        if (S.slock[side(pid)]) { return; }
        S.solver = pid; p.bz++; fx('buzz');
        setPhase('phrase_solve', now, 25000);
        say(p.n + ' wants to solve!');
      }
    }
    else if (m.t === 'ans' && ph === 'board_q') {
      a = parseInt(m.a, 10);
      if (P.bans[pid] || !(a >= 0 && a < P.cur.o.length)) { return; }
      P.bans[pid] = { a: a, at: now }; S.acted[pid] = true; S.nv++;
      if (allActed(now)) { boardEnd(now); }
    }
    else if (m.t === 'ans' && ph === 'zoom_ans') {
      if (pid !== S.turn) { return; }
      a = parseInt(m.a, 10);
      if (!(a >= 0 && a < P.cur.o.length) || S.wrong.indexOf(a) >= 0) { return; }
      if (a === P.cur.a) { award(team2, S.zval, pid); zoomReveal(pid, now); }
      else { zoomWrong(pid, a, now); }
    }
    else if (m.t === 'letter' && ph === 'phrase_turn') {
      var L = String(m.l || '').toUpperCase().charAt(0);
      if (pid !== S.turn || !/[A-Z]/.test(L) || S.used.indexOf(L) >= 0) { return; }
      S.used += L; S.slock = {}; S.idle = 0;
      var n = 0;
      for (var x = 0; x < P.ph.length; x++) { if (P.ph.charAt(x) === L) { S.ph.mask[x] = L; n++; } }
      S.last = { l: L, n: n, who: p.n };
      if (n > 0) {
        award(team2, 20 * n, pid); fx('ding');
        if (!hiddenCount()) { award(team2, 100, pid); return phraseReveal(pid, 'letters', now); }
        P.keep = pid; // solo play: a hit keeps your turn
        phraseTurn(now);
      } else {
        fx('wrong');
        if (!phraseMiss(now)) { S.pteam = nextTeam(team2, now); phraseTurn(now); }
      }
    }
    else if (m.t === 'solve' && ph === 'phrase_solve') {
      if (pid !== S.solver) { return; }
      if (phraseMatch(m.text)) { award(team2, 150 + 25 * hiddenCount(), pid); phraseReveal(pid, 'solve', now); }
      else {
        S.slock[side(pid)] = true; S.last = { bad: clean(m.text, 40), who: p.n }; fx('wrong'); say(line('teaseWrong', { n: p.n }));
        if (!phraseMiss(now)) { phraseTurn(now); }
      }
    }
    else if (m.t === 'fpick' && ph === 'feud_pick') {
      var o2 = parseInt(m.o, 10);
      if (pid !== S.turn || !(o2 >= 0 && o2 < S.f.o.length) || S.f.tried.indexOf(o2) >= 0) { return; }
      feudPick(o2, now);
    }
  }

  function buzzResolve(now) {
    var q = P.bzq, list = [], i; P.bzq = null; S.bzw = 0;
    for (i = 0; i < q.list.length; i++) { if (pl(q.list[i].p)) { list.push(q.list[i]); } }
    if (!list.length) { return; }
    list.sort(function (x, y) { return (x.dt - y.dt) || (x.at - y.at); });
    var win = list[0].p, p = pl(win);
    S.bzr = []; for (i = 0; i < list.length && i < 4; i++) { S.bzr.push({ n: nm(list[i].p), dt: list[i].dt }); }
    S.turn = win; p.bz++;
    if (S.phase === 'zoom_q') { S.zval = zvalue(S.zfrozen); S.opts = optsLeft(); setPhase('zoom_ans', now, 12000); say(p.n + ' was fastest!'); }
    else { S.f.mode = 'face'; setPhase('feud_pick', now, 15000); say(p.n + ' was fastest. What do you say?'); }
  }
  function tick(now) {
    if (!S || S.paused) { return false; }
    if (P.bzq && now >= P.bzq.until) { buzzResolve(now); return true; }
    if (S.deadline && now >= S.deadline) { advance(now, true); return true; }
    return nagTick(now);
  }

  return {
    init: init, handle: handle, tick: tick,
    cmd: function (c, a, now) { cmd(c, a, now); },
    state: function () { return S; },
    dump: function () { return JSON.stringify({ S: S, P: P, kc: kc, H: H }); },
    load: function (str) { try { var d = JSON.parse(str); if (d && d.S && d.P) { S = d.S; P = d.P; kc = d.kc || 0; H = d.H && d.H.key ? d.H : { key: newKey(), used: {} }; return true; } } catch (e) { } return false; },
    hostKey: function () { return H.key; },
    used: function () { return H.used; },
    _private: function () { return P; },
    _near: near, _soundKey: soundKey, _crMatch: crMatch, _famTidy: famTidy, _spellFix: spellFix, _famFakes: function (t, kid) { P.famUsed = P.famUsed || {}; return famFakes(t, kid); }
  };
};
if (typeof module !== 'undefined') { module.exports = RC; }
