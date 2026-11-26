/* Plays many full games with random bot players and checks the engine never stalls or throws. */
var path = require('path');
var FACTS = ['i lived in eight countries', 'I play football and im a famous soccer player', 'My dog once ate my passport', 'I can play the ukulele', 'i have never eaten a tomato', 'I WAS ON TV WHEN I WAS SIX', 'I am scared of clowns', 'I broke my leg skiing', 'I worked as a clown for one summer', 'I once met the pope'];
var fs = require('fs');
var src = ['content.js', 'engine.js'].map(function (f) { return fs.readFileSync(path.join(__dirname, '../src', f), 'utf8'); }).join('\n');
var RC = new Function('module', src + '\nreturn RC;')(undefined);
var assert = require('assert');

function lcg(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function play(seed, nPlayers, teamSplit, skill) {
  var rnd = lcg(seed);
  var E = RC.createEngine(RC.content, { rand: rnd });
  var now = 1000000;
  var S = E.init('TEST', now);
  var pids = [];
  var nT = 2 + (seed % 4);   // 2, 3, 4 or 5 teams
  function hi(i) { var m = { p: 'p' + i, t: 'hello', name: 'Bot<' + i + '>', team: teamSplit(i) % nT, ep: 1 }; if (i === 0) { m.h = E.hostKey(); } return m; }
  pids.push('p0'); E.handle(hi(0), now);
  assert.strictEqual(E.state().boss, 'p0', 'the phone with the host key is the host');
  E.handle({ p: 'p0', t: 'ctl', c: 'nteams', a: { n: nT } }, now);
  assert.strictEqual(E.state().teams.length, nT);
  for (var i = 1; i < nPlayers; i++) { pids.push('p' + i); E.handle(hi(i), now); }
  assert.strictEqual(E.state().boss, 'p0');
  var orders = { classic: ['vote', 'board', 'zoom', 'phrase', 'feud'], all: RC.content.order.slice(), quick: ['likely', 'tf', 'zoom', 'feud'] };
  var todo = orders[['classic', 'all', 'quick'][seed % 3]].slice();
  var total = todo.length;
  E.handle({ p: 'p0', t: 'ctl', c: 'short', a: { on: seed % 4 === 0 } }, now);
  var solo = seed % 2 === 0;
  E.handle({ p: 'p0', t: 'ctl', c: 'solo', a: { on: solo } }, now);
  assert.strictEqual(!!E.state().solo, solo);
  E.handle({ p: 'p1', t: 'ctl', c: 'play', a: { key: todo[0] } }, now); // not the showrunner: ignored
  assert.strictEqual(E.state().phase, 'lobby');
  E.handle({ p: 'p0', t: 'ctl', c: 'play', a: { key: 'nonsense' } }, now);
  assert.strictEqual(E.state().phase, 'lobby', 'unknown game must be ignored');
  E.handle({ p: 'p0', t: 'ctl', c: 'play', a: { key: todo.shift() } }, now);
  assert.strictEqual(E.state().phase, 'intro');
  var seen = {}; var steps = 0;
  while (E.state().phase !== 'final' && steps < 200000) {
    steps++; now += 400;
    if (E.state().phase === 'menu') {
      seen.menu = 1;
      if (todo.length) { E.handle({ p: 'p0', t: 'ctl', c: 'play', a: { key: todo.shift() } }, now); }
      else { E.handle({ p: 'p0', t: 'ctl', c: 'end' }, now); }
      continue;
    }
    S = E.state(); var P = E._private();
    seen[S.phase] = (seen[S.phase] || 0) + 1;
    for (i = 0; i < nPlayers; i++) { if (rnd() < 0.3) { E.handle(hi(i), now); } }
    var pid = pids[Math.floor(rnd() * nPlayers)];
    var k = S.k, ph = S.phase;
    var good = rnd() < skill;
    if (ph === 'vote_q') { E.handle({ p: pid, t: 'vote', k: k, a: good ? P.cur.a : Math.floor(rnd() * P.cur.o.length) }, now); }
    else if (ph === 'ml_q') { E.handle({ p: pid, t: 'mlv', k: k, v: S.ml.who[Math.floor(rnd() * S.ml.who.length)].p }, now); }
    else if (ph === 'num_q') { E.handle({ p: pid, t: 'num', k: k, v: good ? P.nq[S.ni].a : Math.round(P.nq[S.ni].a * (0.5 + rnd())) }, now); }
    else if (ph === 'fam_in') { E.handle({ p: pid, t: 'fam', k: k, text: FACTS[Math.floor(rnd() * FACTS.length)], kid: rnd() < 0.3 ? 1 : 0 }, now); }
    else if (ph === 'fam_q') { E.handle({ p: pid, t: 'famv', k: k, a: good ? P.cur.a : Math.floor(rnd() * 4) }, now); }
    else if (ph === 'cr_q') {
      var item = P.cq[S.ci], txt = good ? item.a[Math.floor(rnd() * item.a.length)][0].toLowerCase() : (rnd() < 0.5 ? item.no[0][0] : 'zz unknown ' + Math.floor(rnd() * 9));
      E.handle({ p: pid, t: 'cr', k: k, text: txt }, now);
    }
    else if (ph === 'cr_judge' && rnd() < 0.3) {
      var asks = S.cr.rows.filter(function (r) { return r.st === 'ask'; });
      if (asks.length) { E.handle({ p: 'p0', t: 'ctl', c: 'crj', a: { p: asks[0].p, ok: rnd() < 0.5, said: 9 } }, now); }
    }
    else if (ph === 'scr_q' && rnd() < 0.5) { E.handle({ p: pid, t: 'word', k: k, text: good ? P.word.toLowerCase() : 'zzz' }, now); }
    else if (ph === 'board_pick' && rnd() < 0.5) { E.handle({ p: S.turn, t: 'pick', k: k, c: Math.floor(rnd() * 5), l: Math.floor(rnd() * 4) }, now); }
    else if (ph === 'board_q' && rnd() < 0.5) { E.handle({ p: pid, t: 'ans', k: k, a: good ? P.cur.a : Math.floor(rnd() * 4) }, now); }
    else if ((ph === 'zoom_q' || ph === 'feud_face') && rnd() < 0.35) { if (rnd() < 0.2) { E.handle({ p: pid, t: 'buzz', k: k, early: 1 }, now); } else if (now >= S.openAt) { E.handle({ p: pid, t: 'buzz', k: k, dt: Math.floor(rnd() * 900) }, now); } }
    else if (ph === 'zoom_ans' && rnd() < 0.6) { E.handle({ p: S.turn, t: 'ans', k: k, a: good ? P.cur.a : Math.floor(rnd() * 4) }, now); }
    else if (ph === 'phrase_turn') {
      if (rnd() < 0.08) { E.handle({ p: pid, t: 'buzz', k: k }, now); }
      else if (rnd() < 0.5) { E.handle({ p: S.turn, t: 'letter', k: k, l: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(rnd() * 26)) }, now); }
    }
    else if (ph === 'phrase_solve' && rnd() < 0.4) { E.handle({ p: S.solver, t: 'solve', k: k, text: good ? P.ph.toLowerCase() : 'wrong answer' }, now); }
    else if (ph === 'feud_pick' && rnd() < 0.5) { E.handle({ p: S.turn, t: 'fpick', k: k, o: Math.floor(rnd() * 8) }, now); }
    if (rnd() < 0.01) { E.handle({ p: 'p0', t: 'ctl', c: 'pause' }, now); now += 5000; E.handle({ p: 'p0', t: 'ctl', c: 'pause' }, now); }
    E.tick(now);
    // dump/load must round-trip mid-game (TV page reload)
    if (steps % 97 === 0) { var d = E.dump(); assert.ok(E.load(d)); }
    var pub = JSON.stringify(E.state());
    assert.ok(pub.length < 12000, 'state too big: ' + pub.length);
  }
  S = E.state();
  assert.strictEqual(S.phase, 'final', 'game did not finish, stuck in ' + S.phase);
  assert.strictEqual(S.round, total, 'did not play every picked game');
  var sc = S.teams.map(function (t) { return t.score; });
  if (solo) { assert.strictEqual(sc.reduce(function (a, b) { return a + Math.abs(b); }, 0), 0, 'solo play must not move team scores'); assert.ok(S.fin.solo); }
  return { seen: seen, scores: sc, minutes: Math.round((now - 1000000) / 60000), fin: S.fin };
}

var phases = {};
var out = [];
for (var seed = 1; seed <= 300; seed++) {
  var n = 1 + (seed % 12);
  var split = seed % 5 === 0 ? function () { return 0; } : function (i) { return i; }; // every 5th game: everyone on one team
  var r = play(seed, n, split, 0.3 + (seed % 7) / 10);
  for (var k in r.seen) { phases[k] = 1; }
  if (seed <= 4) { out.push('seed ' + seed + ' players ' + n + ' scores ' + r.scores.join('-') + ' game minutes ' + r.minutes); }
}
var need = ['fam_in', 'fam_q', 'fam_rv', 'intro', 'vote_q', 'vote_reveal', 'board_pick', 'board_q', 'board_reveal', 'zoom_q', 'zoom_ans', 'zoom_reveal', 'phrase_turn', 'phrase_solve', 'phrase_reveal', 'feud_face', 'feud_pick', 'feud_reveal', 'round_end', 'ml_q', 'ml_reveal', 'num_q', 'num_reveal', 'scr_q', 'scr_reveal', 'menu', 'cr_q', 'cr_judge', 'cr_reveal'];
need.forEach(function (p) { assert.ok(phases[p], 'phase never reached: ' + p); });

// content sanity
var C = RC.content;
C.votes.forEach(function (q) { assert.strictEqual(q.o.length, 4, q.q); assert.strictEqual(new Set(q.o).size, 4, q.q); });
C.board.forEach(function (c) { assert.strictEqual(c.levels.length, 4); c.levels.forEach(function (l) { l.forEach(function (q) { assert.strictEqual(q.o.length, 4, q.q); assert.strictEqual(new Set(q.o).size, 4, q.q); }); }); });
C.zoom.forEach(function (z) {
  assert.strictEqual(z.o.length, 4);
  assert.ok(z.w > 500 && z.h > 500 && z.by, 'photo size and credit for ' + z.id);
  assert.ok(z.fx >= 5 && z.fx <= 95 && z.fy >= 5 && z.fy <= 95, 'zoom starting point inside the picture: ' + z.id);
  ['.jpg', '_s.jpg'].forEach(function (e) { assert.ok(require('fs').existsSync(require('path').join(__dirname, '../img/zoom/' + z.id + e)), 'photo file for ' + z.id + e); });
});
assert.ok(C.zoom.length >= 40, 'at least 40 photographs');
C.decades.forEach(function (q) { assert.strictEqual(new Set(q.o).size, 4, q.q); });
C.words.forEach(function (w) { assert.ok(/^[A-Z]+$/.test(w.w), w.w); });
C.numbers.forEach(function (n) { assert.ok(typeof n.a === 'number', n.q); });
C.order.forEach(function (g) { assert.ok(C.rounds.some(function (r) { return r.key === g; }), g); });
C.surveys.forEach(function (s) { assert.strictEqual(s.a.length, 8, s.q); assert.strictEqual(s.a.reduce(function (t, x) { return t + x[1]; }, 0), 1000, s.q); for (var i = 1; i < 8; i++) { assert.ok(s.a[i][1] < s.a[i - 1][1], s.q); } });
assert.ok(C.board.length >= 5 && C.zoom.length >= 5 && C.phrases.length >= 4 && C.surveys.length >= 3);

// Crillion judging, answer by answer
(function () {
  var C2 = JSON.parse(JSON.stringify(RC.content));
  C2.crillion = [{ q: 'Name a country in South America.', a: [['Brazil', 88], ['Argentina', 74], ['Colombia', 49, ['columbia']], ['Uruguay', 18], ['Paraguay', 14], ['Suriname', 3]],
    no: [['French Guiana', 'French Guiana is part of France, not a country.'], ['Mexico', 'Mexico is in North America.']] }];
  function play(ans, rulings) {
    var E = RC.createEngine(C2, { rand: lcg(5) }), now = 5000000, names = Object.keys(ans);
    E.init('CRIL', now);
    names.forEach(function (n, i) { E.handle({ p: n, t: 'hello', name: n.toUpperCase(), team: i % 2, ep: 1, h: i === 0 ? E.hostKey() : '' }, now); });
    E.handle({ p: names[0], t: 'ctl', c: 'play', a: { key: 'crillion' } }, now); now += 2000;
    E.handle({ p: names[0], t: 'ctl', c: 'next' }, now); now += 2000;
    assert.strictEqual(E.state().phase, 'cr_q');
    var k = E.state().k;
    names.forEach(function (n) { E.handle({ p: n, t: 'cr', k: k, text: ans[n] }, now); });
    (rulings || []).forEach(function (r) { E.handle({ p: r[0], t: 'ctl', c: 'crj', a: r[1] }, now); });
    var by = {}; E.state().cr.rows.forEach(function (r) { by[r.p] = r; });
    return { S: E.state(), by: by, E: E, now: now };
  }
  // spelling: close and sound-alike answers count; a known wrong answer is still wrong; an unknown one goes to the judge
  var r = play({ a: 'paragway', b: 'Kolumbeea', c: ' French Guiana ', d: 'Atlantis', e: 'BRASIL', f: 'Urugauy' });
  assert.strictEqual(r.S.phase, 'cr_judge', 'an answer off the sheet must go to the judge');
  assert.strictEqual(r.by.a.name, 'Paraguay', 'sounds the same'); assert.strictEqual(r.by.a.said, 14);
  assert.strictEqual(r.by.b.name, 'Colombia', 'sounds the same');
  assert.strictEqual(r.by.c.st, 'no'); assert.ok(/France/.test(r.by.c.why));
  assert.strictEqual(r.by.d.st, 'ask');
  assert.strictEqual(r.by.e.name, 'Brazil', 'one-letter slip accepted');
  assert.strictEqual(r.by.f.name, 'Uruguay', 'swapped letters go to the nearer country');
  r.E.handle({ p: 'b', t: 'ctl', c: 'crj', a: { p: 'd', ok: false } }, r.now);   // not the showrunner
  assert.strictEqual(r.E.state().phase, 'cr_judge');
  r.E.handle({ p: 'a', t: 'ctl', c: 'crj', a: { p: 'd', ok: false, why: 'Atlantis is a legend.' } }, r.now);
  var S = r.E.state();
  assert.strictEqual(S.phase, 'cr_reveal');
  assert.strictEqual(S.cr.rows[0].p, 'a'); assert.strictEqual(S.cr.rows[0].pts, 60 + 50, 'a rare answer, plus the crown for most obscure'); assert.strictEqual(S.cr.rows[0].tier, 'Rare');
  assert.strictEqual(S.rv.who, 'A');
  assert.strictEqual(S.teams[0].score, Math.round((110 + 0 + 10) / 3), 'team score is the team average');
  assert.strictEqual(S.teams[1].score, Math.round((10 + 0 + 30) / 3));
  // the same answer twice in the room splits the points, so the lone rare answer wins
  r = play({ a: 'Suriname', b: 'suriname', c: 'Paraguay', d: 'Brazil', e: 'Brazil', f: 'brasil' });
  S = r.S; assert.strictEqual(S.phase, 'cr_reveal');
  assert.strictEqual(r.by.a.pts, Math.round(85 / 2)); assert.strictEqual(r.by.a.dup, 2);
  assert.strictEqual(r.by.c.pts, 60 + 50); assert.strictEqual(r.by.c.dup, 1); assert.strictEqual(r.by.c.crown, 1);
  assert.strictEqual(r.by.d.pts, 3, 'three people said Brazil, and everybody says Brazil');
  assert.strictEqual(S.rv.who, 'C', 'the answer nobody else gave wins');
  // everybody types the same thing
  r = play({ a: 'Brazil', b: 'Brazil', c: 'brazil' });
  assert.ok(r.S.rv.allSame); assert.strictEqual(r.by.a.pts, 3); assert.ok(!r.S.rv.crown);
  // one ruling covers everyone who typed the same off-sheet answer, and it scores as a rare answer
  r = play({ a: 'Guyana', b: 'guyana ', c: 'Brazil' }, [['a', { p: 'b', ok: true, said: 5 }]]);
  assert.strictEqual(r.S.phase, 'cr_reveal'); assert.strictEqual(r.by.a.st, 'ok'); assert.strictEqual(r.by.b.st, 'ok');
  assert.strictEqual(r.by.a.pts, Math.round(85 / 2)); assert.strictEqual(r.by.a.tier, 'Deep cut');
})();

// The Board: everyone answers, a late or doubled Next cannot skip the question
(function () {
  var E = RC.createEngine(RC.content, { rand: lcg(9) }), now = 7000000, names = ['a', 'b', 'c', 'd'];
  E.init('BORD', now);
  names.forEach(function (n, i) { E.handle({ p: n, t: 'hello', name: n.toUpperCase(), team: i % 2, ep: 1, h: i === 0 ? E.hostKey() : '' }, now); });
  E.handle({ p: 'a', t: 'ctl', c: 'play', a: { key: 'board' } }, now); now += 2000;
  var kIntro = E.state().k;
  E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: kIntro } }, now);
  assert.strictEqual(E.state().phase, 'board_pick');
  E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: kIntro } }, now + 3000);
  assert.strictEqual(E.state().phase, 'board_pick', 'a Next tapped on the earlier screen is ignored');
  now += 2000;
  E.handle({ p: E.state().turn, t: 'pick', k: E.state().k, c: 0, l: 3 }, now);
  assert.strictEqual(E.state().phase, 'board_q');
  E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: E.state().k } }, now + 300);
  assert.strictEqual(E.state().phase, 'board_q', 'a Next within a blink of the question opening is ignored');
  E.handle({ p: 'b', t: 'buzz', k: E.state().k }, now + 500);
  assert.strictEqual(E.state().phase, 'board_q', 'there is no buzzer on The Board any more');
  var P = E._private(), k = E.state().k, right = P.cur.a, wrong = (right + 1) % 4;
  E.handle({ p: 'c', t: 'ans', k: k, a: right }, now + 4000);
  E.handle({ p: 'a', t: 'ans', k: k, a: right }, now + 6000);
  E.handle({ p: 'a', t: 'ans', k: k, a: wrong }, now + 6500);   // cannot change an answer
  E.handle({ p: 'b', t: 'ans', k: k, a: wrong }, now + 9000);
  assert.strictEqual(E.state().phase, 'board_q', 'the question stays open until everyone has answered');
  E.handle({ p: 'd', t: 'ans', k: k, a: wrong }, now + 12000);
  var S = E.state();
  assert.strictEqual(S.phase, 'board_reveal');
  assert.strictEqual(S.rv.nok, 2); assert.strictEqual(S.rv.fast, 'C');
  assert.strictEqual(S.players.c.pts, 400 + 200); assert.strictEqual(S.players.a.pts, 400); assert.strictEqual(S.players.b.pts, 0);
  assert.strictEqual(S.teams[0].score, 400 + 200, 'both of team 0 were right, and one was fastest');
  assert.strictEqual(S.teams[1].score, 0);
})();

// The host, teams and the buzzer
(function () {
  var E = RC.createEngine(RC.content, { rand: lcg(11) }), now = 9000000, S;
  E.init('HOST', now);
  function hi(p, team, extra) { var m = { p: p, t: 'hello', name: p.toUpperCase(), team: team, ep: E.state().epoch }; for (var k in (extra || {})) { m[k] = extra[k]; } E.handle(m, now); }
  hi('kid', 0); hi('mom', 1);
  assert.strictEqual(E.state().boss, null, 'the first one in is NOT the host');
  E.handle({ p: 'kid', t: 'ctl', c: 'play', a: { key: 'vote' } }, now);
  assert.strictEqual(E.state().phase, 'lobby', 'nobody but the host can start a game');
  hi('james', 0, { h: 'wrongkey' }); assert.strictEqual(E.state().boss, null);
  hi('james', 0, { h: E.hostKey() }); assert.strictEqual(E.state().boss, 'james', 'the phone that scanned the host code is the host');
  hi('dad', 1); hi('ana', 0); hi('leo', 1);
  // teams: 2 to 5
  E.handle({ p: 'james', t: 'ctl', c: 'nteams', a: { n: 4 } }, now);
  S = E.state(); assert.strictEqual(S.teams.length, 4); assert.strictEqual(S.teams[3].name, 'Jacks');
  E.handle({ p: 'james', t: 'ctl', c: 'shuffle' }, now);
  var per = [0, 0, 0, 0]; S.order.forEach(function (id) { per[S.players[id].t]++; });
  assert.ok(Math.max.apply(null, per) - Math.min.apply(null, per) <= 1, 'shuffle deals even teams: ' + per.join(','));
  E.handle({ p: 'james', t: 'ctl', c: 'move', a: { p: 'leo', t: 3 } }, now); assert.strictEqual(E.state().players.leo.t, 3);
  E.handle({ p: 'mom', t: 'ctl', c: 'move', a: { p: 'leo', t: 0 } }, now); assert.strictEqual(E.state().players.leo.t, 3, 'only the host moves players');
  E.handle({ p: 'james', t: 'ctl', c: 'nteams', a: { n: 3 } }, now);
  S = E.state(); assert.strictEqual(S.teams.length, 3); S.order.forEach(function (id) { assert.ok(S.players[id].t < 3, 'nobody is left on a team that no longer exists'); });
  E.handle({ p: 'james', t: 'ctl', c: 'teams', a: { names: ['Red', 'Blue', 'Green'] } }, now); assert.strictEqual(E.state().teams[2].name, 'Green');
  // take a player out, and let them back in
  E.handle({ p: 'james', t: 'ctl', c: 'kick', a: { p: 'leo' } }, now);
  assert.ok(!E.state().players.leo); hi('leo', 1); assert.ok(!E.state().players.leo, 'a removed player cannot walk back in');
  E.handle({ p: 'james', t: 'ctl', c: 'unkick', a: { p: 'leo' } }, now); hi('leo', 1); assert.ok(E.state().players.leo);
  E.handle({ p: 'james', t: 'ctl', c: 'kick', a: { p: 'james' } }, now); assert.ok(E.state().players.james, 'the host cannot remove himself');
  // zoom in: early buzz is punished, the fastest reaction wins
  E.handle({ p: 'james', t: 'ctl', c: 'play', a: { key: 'zoom' } }, now); now += 2000;
  E.handle({ p: 'james', t: 'ctl', c: 'next', a: { k: E.state().k } }, now);
  S = E.state(); assert.strictEqual(S.phase, 'zoom_q'); assert.ok(S.openAt > now + 4000, 'GO comes after a wait nobody can guess');
  var k = S.k;
  E.handle({ p: 'kid', t: 'buzz', k: k, early: 1 }, now + 1000);
  S = E.state(); assert.ok(S.early.kid); assert.strictEqual(S.players.kid.pts, -50, 'an early buzz costs 50'); assert.strictEqual(S.phase, 'zoom_q');
  var go = S.openAt + 100;
  E.handle({ p: 'kid', t: 'buzz', k: k, dt: 5 }, go); assert.strictEqual(E.state().phase, 'zoom_q', 'out means out');
  E.handle({ p: 'mom', t: 'buzz', k: k, dt: 480 }, go + 100);       // arrives first, but reacted slower
  E.handle({ p: 'dad', t: 'buzz', k: k, dt: 310 }, go + 350);       // slower connection, faster finger
  assert.strictEqual(E.state().phase, 'zoom_q'); E.tick(go + 450); assert.strictEqual(E.state().phase, 'zoom_q', 'the half-second window is still open');
  E.handle({ p: 'ana', t: 'buzz', k: k, dt: 900 }, go + 900);       // too late for the window
  E.tick(go + 900);
  S = E.state(); assert.strictEqual(S.phase, 'zoom_ans'); assert.strictEqual(S.turn, 'dad', 'fastest reaction wins, not fastest connection'); assert.strictEqual(S.bzr[0].n, 'DAD');
  var P = E._private(), wrong = (P.cur.a + 1) % 4, before = S.players.dad.pts;
  E.handle({ p: 'dad', t: 'ans', k: S.k, a: wrong }, go + 3000);
  assert.strictEqual(E.state().players.dad.pts, before - 50, 'a wrong answer after buzzing costs 50');
  // restart the game: scores go back to where the game began
  now = go + 10000;
  E.handle({ p: 'james', t: 'ctl', c: 'restart' }, now);
  S = E.state(); assert.strictEqual(S.phase, 'intro'); assert.strictEqual(S.round, 1); assert.strictEqual(S.players.kid.pts, 0); assert.strictEqual(S.players.dad.pts, 0);
  // pick a different game mid-game, pause and resume
  E.handle({ p: 'james', t: 'ctl', c: 'menu' }, now); assert.strictEqual(E.state().phase, 'menu');
  E.handle({ p: 'james', t: 'ctl', c: 'play', a: { key: 'tf' } }, now); now += 2000;
  E.handle({ p: 'james', t: 'ctl', c: 'pause' }, now); assert.ok(E.state().paused); E.handle({ p: 'james', t: 'ctl', c: 'pause' }, now + 5000); assert.ok(!E.state().paused);
  // start the whole night over: everyone has to join again, the host keeps control
  now += 9000; E.handle({ p: 'james', t: 'ctl', c: 'reset' }, now);
  S = E.state(); assert.strictEqual(S.phase, 'lobby'); assert.strictEqual(S.order.length, 0); assert.strictEqual(S.epoch, 2); assert.strictEqual(S.boss, 'james');
  E.handle({ p: 'mom', t: 'hello', name: 'MOM', team: 1, ep: 1 }, now); assert.ok(!E.state().players.mom, 'an old join does not count after a restart');
  hi('mom', 2); assert.strictEqual(E.state().players.mom.t, 2);
  E.handle({ p: 'james', t: 'ctl', c: 'play', a: { key: 'vote' } }, now); assert.strictEqual(E.state().phase, 'intro', 'the host still runs the night');
  // changing the host from the TV
  var oldKey = E.hostKey(); E.cmd('unhost', null, now); assert.strictEqual(E.state().boss, null); assert.notStrictEqual(E.hostKey(), oldKey);
})();

// Questions do not repeat until the pool has been used up
(function () {
  var E = RC.createEngine(RC.content, { rand: lcg(21) }), now = 11000000, seen = {}, games = Math.floor(RC.content.votes.length / 8);
  E.init('RPT', now); E.handle({ p: 'h', t: 'hello', name: 'H', team: 0, ep: 1, h: E.hostKey() }, now);
  for (var g = 0; g < games; g++) {
    E.handle({ p: 'h', t: 'ctl', c: 'play', a: { key: 'vote' } }, now); now += 2000;
    E.handle({ p: 'h', t: 'ctl', c: 'next', a: { k: E.state().k } }, now);
    E._private().vq.forEach(function (q) { assert.ok(!seen[q.q], 'repeated before the pool ran out: ' + q.q); seen[q.q] = 1; });
    E.handle({ p: 'h', t: 'ctl', c: 'menu' }, now);
  }
  assert.strictEqual(Object.keys(seen).length, games * 8);
})();

console.log(out.join('\n'));
console.log('OK: 300 simulated games finished (team and solo play; 5-game, 4-game and all-games sessions), all ' + need.length + ' phases reached, content checks passed');

/* ---------- Know Your Family ---------- */
(function () {
  var E = RC.createEngine(C, { seed: 77 }), now = 1000, k;
  function st() { return E.state(); }
  E.init('FAMX', now);
  ['a', 'b', 'c', 'd'].forEach(function (id, i) { E.handle({ p: id, t: 'hello', name: ['Ana', 'Ben', 'Cy', 'Dee'][i], team: i % 2, h: id === 'a' ? E.hostKey() : '', ep: st().epoch }, now); });
  assert.strictEqual(st().boss, 'a');
  E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: st().k } }, now += 2000);
  E.handle({ p: 'a', t: 'ctl', c: 'play', a: { key: 'fam' } }, now += 2000);
  assert.strictEqual(st().phase, 'intro');
  E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: st().k } }, now += 2000);
  assert.strictEqual(st().phase, 'fam_in');
  k = st().k;
  E.handle({ p: 'a', t: 'fam', k: k, text: 'i lived in eight countries', kid: 0 }, now += 500);
  E.handle({ p: 'b', t: 'fam', k: k, text: 'abc', kid: 1 }, now += 500);                 // too short: refused
  assert.ok(!st().acted.b, 'a three-letter fact is refused');
  E.handle({ p: 'b', t: 'fam', k: k, text: 'I play football and im a famous soccer player', kid: 1 }, now += 500);
  E.handle({ p: 'c', t: 'fam', k: k, text: 'My dog once ate my passport!!', kid: 0 }, now += 500);
  assert.strictEqual(st().phase, 'fam_in', 'still waiting for Dee');
  assert.deepStrictEqual(st().fam.done, ['Ana', 'Ben', 'Cy']);
  assert.ok(JSON.stringify(st()).indexOf('eight countries') < 0, 'facts stay private while people are still typing');
  E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: st().k } }, now += 2000);              // host moves on without Dee
  assert.strictEqual(st().phase, 'fam_q');
  assert.strictEqual(st().fq.of, 3, 'only people who sent a fact are played');
  var seenWho = {};
  for (var r = 0; r < 3; r++) {
    var S = st(), P = E._private(), who = S.fq.who;
    seenWho[who] = 1;
    assert.strictEqual(S.fq.o.length, 4);
    assert.strictEqual(new Set(S.fq.o).size, 4, 'four different facts');
    assert.ok(/^[A-Z]/.test(S.fq.o[P.cur.a]) && /\.$/.test(S.fq.o[P.cur.a]), 'the true fact is tidied: ' + S.fq.o[P.cur.a]);
    assert.ok(S.acted[who], 'nobody waits for the person the facts are about');
    var before = {}; ['a', 'b', 'c', 'd'].forEach(function (id) { before[id] = S.players[id].pts; });
    E.handle({ p: who, t: 'famv', k: S.k, a: P.cur.a }, now += 500);                      // the subject cannot vote
    assert.ok(!P.votes[who], 'the subject cannot vote on their own facts');
    var voters = ['a', 'b', 'c', 'd'].filter(function (id) { return id !== who; });
    E.handle({ p: voters[0], t: 'famv', k: S.k, a: P.cur.a }, now += 500);
    E.handle({ p: voters[1], t: 'famv', k: S.k, a: (P.cur.a + 1) % 4 }, now += 500);
    assert.strictEqual(st().phase, 'fam_q');
    E.handle({ p: voters[2], t: 'famv', k: S.k, a: (P.cur.a + 2) % 4 }, now += 500);
    S = st();
    assert.strictEqual(S.phase, 'fam_rv', 'reveal as soon as everyone else has voted');
    assert.strictEqual(S.rv.nok, 1); assert.strictEqual(S.rv.fooled, 2); assert.strictEqual(S.rv.bonus, 70);
    assert.strictEqual(S.players[voters[0]].pts - before[voters[0]], 100, 'picking the truth pays 100');
    assert.strictEqual(S.players[voters[1]].pts - before[voters[1]], 0);
    assert.strictEqual(S.players[who].pts - before[who], 70, 'the subject scores for the people they fooled');
    E.handle({ p: 'a', t: 'ctl', c: 'next', a: { k: S.k } }, now += 2000);
  }
  assert.strictEqual(Object.keys(seenWho).length, 3);
  assert.strictEqual(st().phase, 'round_end');
  // made-up facts: on topic, right age, never a copy of the truth
  var bank = C.fam.bank, cat = {}, adult = {};
  bank.forEach(function (b) { cat[b[0]] = b[1]; adult[b[0]] = b[2] === 'a'; assert.ok(/^I /.test(b[0]) && /\.$/.test(b[0]) && b[0].length <= 80, b[0]); });
  assert.strictEqual(Object.keys(cat).length, bank.length, 'no made-up fact appears twice');
  assert.ok(bank.length >= 250);
  [['I play football and I am a famous soccer player.', /sport|famous/], ['I lived in eight countries.', /travel/], ['I once ate a scorpion.', /food|animal/], ['I can play the ukulele in a band.', /art|skill/], ['I was bitten by a monkey at the zoo.', /animal|body/], ['I worked as a lawyer for a year.', /job/]].forEach(function (x) {
    var E2 = RC.createEngine(C, { seed: 5 }); E2.init('F', 1);
    var f = E2._famFakes(x[0], 0), on = f.filter(function (y) { return x[1].test(cat[y]); }).length;
    assert.strictEqual(f.length, 3); assert.ok(on === 3, x[0] + ' -> ' + JSON.stringify(f));
    var kf = []; for (var q = 0; q < 12; q++) { kf = kf.concat(E2._famFakes(x[0], 1)); }
    assert.ok(kf.every(function (y) { return !adult[y]; }), 'a kid never gets a grown-up fact');
    assert.strictEqual(new Set(kf).size, kf.length, 'no made-up fact is used twice in one game');
  });
  var E3 = RC.createEngine(C, { seed: 6 }); E3.init('F', 1);
  assert.strictEqual(E3._famTidy('i lived in 8 countries'), 'I lived in 8 countries.');
  assert.strictEqual(E3._famTidy('im afraid of spiders!!'), "I'm afraid of spiders.");
  assert.strictEqual(E3._famTidy('I WAS ON TV WHEN I WAS SIX'), 'I was on tv when I was six.');
  assert.ok(E3._famFakes('I am afraid of balloons.', 0).indexOf('I am afraid of balloons.') < 0, 'a made-up fact is never the same as the truth');
  console.log('OK: Know Your Family rules, scoring and made-up facts');
})();
