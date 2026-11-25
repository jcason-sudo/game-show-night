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
  for (i = 0; i < nPlayers; i++) { if (rnd() < 0.8) { E.handle({ p: pids[i], t: 'survey', a: [[Math.floor(rnd() * 10), Math.floor(rnd() * 10)], [1, 2], [Math.floor(rnd() * 10), 3]] }, now); } }
  assert.strictEqual(E.state().boss, 'p0');
  E.handle({ p: 'p1', t: 'ctl', c: 'start' }, now); // not the boss: ignored
  assert.strictEqual(E.state().phase, 'lobby');
  var presets = ['classic', 'all', 'quick'];
  var preset = presets[seed % 3];
  E.handle({ p: 'p0', t: 'ctl', c: 'games', a: { keys: RC.content.presets[preset] } }, now);
  assert.deepStrictEqual(E.state().lineup, RC.content.presets[preset]);
  E.handle({ p: 'p0', t: 'ctl', c: 'games', a: { keys: ['nonsense'] } }, now);
  assert.deepStrictEqual(E.state().lineup, RC.content.presets[preset], 'bad lineup must be ignored');
  E.handle({ p: 'p0', t: 'ctl', c: 'short', a: { on: seed % 4 === 0 } }, now);
  E.handle({ p: 'p0', t: 'ctl', c: 'start' }, now);
  assert.strictEqual(E.state().phase, 'intro');
  var seen = {}; var steps = 0;
  while (E.state().phase !== 'final' && steps < 200000) {
    steps++; now += 400;
    S = E.state(); var P = E._private();
    seen[S.phase] = (seen[S.phase] || 0) + 1;
    for (i = 0; i < nPlayers; i++) { if (rnd() < 0.3) { E.handle({ p: pids[i], t: 'hello', name: 'Bot<' + i + '>', team: teamSplit(i) }, now); } }
    var pid = pids[Math.floor(rnd() * nPlayers)];
    var k = S.k, ph = S.phase;
    var good = rnd() < skill;
    if (ph === 'vote_q') { E.handle({ p: pid, t: 'vote', k: k, a: good ? P.cur.a : Math.floor(rnd() * P.cur.o.length) }, now); }
    else if (ph === 'ml_q') { E.handle({ p: pid, t: 'mlv', k: k, v: S.ml.who[Math.floor(rnd() * S.ml.who.length)].p }, now); }
    else if (ph === 'num_q') { E.handle({ p: pid, t: 'num', k: k, v: good ? P.nq[S.ni].a : Math.round(P.nq[S.ni].a * (0.5 + rnd())) }, now); }
    else if (ph === 'scr_q' && rnd() < 0.5) { E.handle({ p: pid, t: 'word', k: k, text: good ? P.word.toLowerCase() : 'zzz' }, now); }
    else if (ph === 'board_pick' && rnd() < 0.5) { E.handle({ p: S.turn, t: 'pick', k: k, c: Math.floor(rnd() * 5), l: Math.floor(rnd() * 4) }, now); }
    else if ((ph === 'board_q' || ph === 'zoom_q' || ph === 'feud_face') && rnd() < 0.25) { E.handle({ p: pid, t: 'buzz', k: k }, now); }
    else if ((ph === 'board_ans' || ph === 'zoom_ans') && rnd() < 0.6) { E.handle({ p: S.turn, t: 'ans', k: k, a: good ? P.cur.a : Math.floor(rnd() * 4) }, now); }
    else if (ph === 'phrase_turn') {
      if (rnd() < 0.08) { E.handle({ p: pid, t: 'buzz', k: k }, now); }
      else if (rnd() < 0.5) { E.handle({ p: S.turn, t: 'letter', k: k, l: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(rnd() * 26)) }, now); }
    }
    else if (ph === 'phrase_solve' && rnd() < 0.4) { E.handle({ p: S.solver, t: 'solve', k: k, text: good ? P.ph.toLowerCase() : 'wrong answer' }, now); }
    else if (ph === 'feud_pick' && rnd() < 0.5) { E.handle({ p: S.turn, t: 'fpick', k: k, o: Math.floor(rnd() * 10) }, now); }
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
  assert.ok(S.round === S.lineup.length, 'did not play the whole lineup');
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
var need = ['intro', 'vote_q', 'vote_reveal', 'board_pick', 'board_q', 'board_ans', 'board_reveal', 'zoom_q', 'zoom_ans', 'zoom_reveal', 'phrase_turn', 'phrase_solve', 'phrase_reveal', 'feud_face', 'feud_pick', 'feud_reveal', 'round_end', 'ml_q', 'ml_reveal', 'num_q', 'num_reveal', 'scr_q', 'scr_reveal'];
need.forEach(function (p) { assert.ok(phases[p], 'phase never reached: ' + p); });

// content sanity
var C = RC.content;
C.votes.forEach(function (q) { assert.strictEqual(q.o.length, 4, q.q); assert.strictEqual(new Set(q.o).size, 4, q.q); });
C.board.forEach(function (c) { assert.strictEqual(c.levels.length, 4); c.levels.forEach(function (l) { l.forEach(function (q) { assert.strictEqual(q.o.length, 4, q.q); assert.strictEqual(new Set(q.o).size, 4, q.q); }); }); });
C.zoom.forEach(function (z) { assert.strictEqual(z.o.length, 4); });
C.decades.forEach(function (q) { assert.strictEqual(new Set(q.o).size, 4, q.q); });
C.words.forEach(function (w) { assert.ok(/^[A-Z]+$/.test(w.w), w.w); });
C.numbers.forEach(function (n) { assert.ok(typeof n.a === 'number', n.q); });
Object.keys(C.presets).forEach(function (k) { C.presets[k].forEach(function (g) { assert.ok(C.rounds.some(function (r) { return r.key === g; }), g); }); });
C.surveys.forEach(function (s) { assert.strictEqual(s.o.length, 10, s.q); });
assert.ok(C.board.length >= 5 && C.zoom.length >= 5 && C.phrases.length >= 4 && C.surveys.length >= 3);

console.log(out.join('\n'));
console.log('OK: 300 simulated games finished (classic, quick and all-ten lineups), all ' + need.length + ' phases reached, content checks passed');
