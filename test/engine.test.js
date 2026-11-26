/* Plays many full games with random bot players and checks the engine never stalls or throws. */
var path = require('path');
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
  for (var i = 0; i < nPlayers; i++) { pids.push('p' + i); E.handle({ p: 'p' + i, t: 'hello', name: 'Bot<' + i + '>', team: teamSplit(i) }, now); }
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
    for (i = 0; i < nPlayers; i++) { if (rnd() < 0.3) { E.handle({ p: pids[i], t: 'hello', name: 'Bot<' + i + '>', team: teamSplit(i) }, now); } }
    var pid = pids[Math.floor(rnd() * nPlayers)];
    var k = S.k, ph = S.phase;
    var good = rnd() < skill;
    if (ph === 'vote_q') { E.handle({ p: pid, t: 'vote', k: k, a: good ? P.cur.a : Math.floor(rnd() * P.cur.o.length) }, now); }
    else if (ph === 'ml_q') { E.handle({ p: pid, t: 'mlv', k: k, v: S.ml.who[Math.floor(rnd() * S.ml.who.length)].p }, now); }
    else if (ph === 'num_q') { E.handle({ p: pid, t: 'num', k: k, v: good ? P.nq[S.ni].a : Math.round(P.nq[S.ni].a * (0.5 + rnd())) }, now); }
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
    else if ((ph === 'zoom_q' || ph === 'feud_face') && rnd() < 0.25) { E.handle({ p: pid, t: 'buzz', k: k }, now); }
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
  assert.ok(S.teams[0].score >= 0 && S.teams[1].score >= 0);
  assert.strictEqual(S.round, total, 'did not play every picked game');
  if (solo) { assert.strictEqual(S.teams[0].score + S.teams[1].score, 0, 'solo play must not move team scores'); assert.ok(S.fin.solo); }
  return { seen: seen, scores: [S.teams[0].score, S.teams[1].score], minutes: Math.round((now - 1000000) / 60000), fin: S.fin };
}

var phases = {};
var out = [];
for (var seed = 1; seed <= 300; seed++) {
  var n = 1 + (seed % 12);
  var split = seed % 5 === 0 ? function () { return 0; } : function (i) { return i % 2; }; // every 5th game: everyone on one team
  var r = play(seed, n, split, 0.3 + (seed % 7) / 10);
  for (var k in r.seen) { phases[k] = 1; }
  if (seed <= 4) { out.push('seed ' + seed + ' players ' + n + ' scores ' + r.scores.join('-') + ' game minutes ' + r.minutes); }
}
var need = ['intro', 'vote_q', 'vote_reveal', 'board_pick', 'board_q', 'board_reveal', 'zoom_q', 'zoom_ans', 'zoom_reveal', 'phrase_turn', 'phrase_solve', 'phrase_reveal', 'feud_face', 'feud_pick', 'feud_reveal', 'round_end', 'ml_q', 'ml_reveal', 'num_q', 'num_reveal', 'scr_q', 'scr_reveal', 'menu', 'cr_q', 'cr_judge', 'cr_reveal'];
need.forEach(function (p) { assert.ok(phases[p], 'phase never reached: ' + p); });

// content sanity
var C = RC.content;
C.votes.forEach(function (q) { assert.strictEqual(q.o.length, 4, q.q); assert.strictEqual(new Set(q.o).size, 4, q.q); });
C.board.forEach(function (c) { assert.strictEqual(c.levels.length, 4); c.levels.forEach(function (l) { l.forEach(function (q) { assert.strictEqual(q.o.length, 4, q.q); assert.strictEqual(new Set(q.o).size, 4, q.q); }); }); });
C.zoom.forEach(function (z) { assert.strictEqual(z.o.length, 4); });
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
    names.forEach(function (n, i) { E.handle({ p: n, t: 'hello', name: n.toUpperCase(), team: i % 2 }, now); });
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
  assert.strictEqual(S.cr.rows[0].p, 'a'); assert.strictEqual(S.cr.rows[0].pts, 86);
  assert.strictEqual(S.rv.who, 'A');
  assert.strictEqual(S.teams[0].score, Math.round((86 + 0 + 12) / 3), 'team score is the team average');
  assert.strictEqual(S.teams[1].score, Math.round((51 + 0 + 82) / 3));
  // the same answer twice in the room splits the points, so the lone rare answer wins
  r = play({ a: 'Suriname', b: 'suriname', c: 'Paraguay', d: 'Brazil', e: 'Brazil', f: 'brasil' });
  S = r.S; assert.strictEqual(S.phase, 'cr_reveal');
  assert.strictEqual(r.by.a.pts, Math.round(97 / 2)); assert.strictEqual(r.by.a.dup, 2);
  assert.strictEqual(r.by.c.pts, 86); assert.strictEqual(r.by.c.dup, 1);
  assert.strictEqual(r.by.d.pts, 4, 'three people said Brazil');
  assert.strictEqual(S.rv.who, 'C', 'the answer nobody else gave wins');
  // everybody types the same thing
  r = play({ a: 'Brazil', b: 'Brazil', c: 'brazil' });
  assert.ok(r.S.rv.allSame); assert.strictEqual(r.by.a.pts, 4);
  // one ruling covers everyone who typed the same off-sheet answer, and it scores as a rare answer
  r = play({ a: 'Guyana', b: 'guyana ', c: 'Brazil' }, [['a', { p: 'b', ok: true, said: 5 }]]);
  assert.strictEqual(r.S.phase, 'cr_reveal'); assert.strictEqual(r.by.a.st, 'ok'); assert.strictEqual(r.by.b.st, 'ok');
  assert.strictEqual(r.by.a.pts, Math.round(95 / 2));
})();

// The Board: everyone answers, a late or doubled Next cannot skip the question
(function () {
  var E = RC.createEngine(RC.content, { rand: lcg(9) }), now = 7000000, names = ['a', 'b', 'c', 'd'];
  E.init('BORD', now);
  names.forEach(function (n, i) { E.handle({ p: n, t: 'hello', name: n.toUpperCase(), team: i % 2 }, now); });
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

console.log(out.join('\n'));
console.log('OK: 300 simulated games finished (team and solo play; 5-game, 4-game and all-games sessions), all ' + need.length + ' phases reached, content checks passed');
