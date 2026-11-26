/* Spelling does not have to be perfect. This file checks that close and sound-alike answers pass,
   that clearly different words do not, and that every Crillion answer still finds itself. */
var fs = require('fs'), path = require('path'), assert = require('assert');
var src = ['content.js', 'engine.js'].map(function (f) { return fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'); }).join('\n');
var RC = new Function('module', src + '\nreturn RC;')({});
var E = RC.createEngine(RC.content, {}), near = E._near, crMatch = E._crMatch, C = RC.content;
function n(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

var yes = [['kolumbeea', 'colombia'], ['columbia', 'colombia'], ['paragway', 'paraguay'], ['urugway', 'uruguay'], ['venezwela', 'venezuela'], ['equador', 'ecuador'], ['brasil', 'brazil'],
  ['argentena', 'argentina'], ['saxaphone', 'saxophone'], ['violen', 'violin'], ['chello', 'cello'], ['trumpit', 'trumpet'], ['clarinette', 'clarinet'], ['febuary', 'february'], ['wensday', 'wednesday'],
  ['giraf', 'giraffe'], ['elefant', 'elephant'], ['rinoceros', 'rhinoceros'], ['jupitor', 'jupiter'], ['neptoon', 'neptune'], ['filadelfia', 'philadelphia'], ['misisipi', 'mississippi'], ['piza', 'pizza'],
  ['spagetti', 'spaghetti'], ['brocoli', 'broccoli'], ['bananna', 'banana'], ['umbrela', 'umbrella'], ['pengwin', 'penguin'], ['kangaru', 'kangaroo'], ['gwitar', 'guitar'], ['pyano', 'piano'], ['floot', 'flute'],
  ['tooba', 'tuba'], ['massachusets', 'massachusetts'], ['conneticut', 'connecticut'], ['tenesee', 'tennessee'], ['pensilvania', 'pennsylvania'], ['talahasee', 'tallahassee'], ['sacremento', 'sacramento'],
  ['eisenhauer', 'eisenhower'], ['rosevelt', 'roosevelt'], ['linkin', 'lincoln'], ['chiwawa', 'chihuahua'], ['daschund', 'dachshund'], ['rotwiler', 'rottweiler'], ['lamborgini', 'lamborghini'], ['porsh', 'porsche'],
  ['hundai', 'hyundai'], ['volkswagon', 'volkswagen'], ['zuchini', 'zucchini'], ['califlower', 'cauliflower'], ['pomegranite', 'pomegranate'], ['switzerland', 'switzerland'], ['swizerland', 'switzerland'],
  ['luxemburg', 'luxembourg'], ['phillipines', 'philippines'], ['kazakstan', 'kazakhstan'], ['zimbabwae', 'zimbabwe'], ['microscop', 'microscope'], ['resteraunt', 'restaurant'], ['mosqito', 'mosquito'],
  ['theelephantintheroom', 'theelephantintheroom'], ['theelefantintheroom', 'theelephantintheroom'], ['backtothedrawingbord', 'backtothedrawingboard']];
var no = [['iran', 'iraq'], ['china', 'chile'], ['mars', 'march'], ['june', 'july'], ['cat', 'bat'], ['harp', 'horn'], ['drum', 'gum'], ['peru', 'paris'], ['tuba', 'cuba'], ['oboe', 'organ'], ['april', 'august'],
  ['venus', 'uranus'], ['india', 'indonesia'], ['cello', 'piccolo'], ['dog', 'frog'], ['red', 'bed'], ['flute', 'fruit'], ['piano', 'piccolo'], ['trumpet', 'trombone'], ['goat', 'boat'], ['seal', 'whale'],
  ['ecuador', 'salvador'], ['texas', 'kansas'], ['ohio', 'iowa'], ['utah', 'idaho'], ['ford', 'fiat'], ['kia', 'bmw'], ['apple', 'maple'], ['pear', 'peach'], ['lime', 'lemon'], ['kale', 'leek'],
  ['pug', 'pig'], ['pig', 'pug'], ['lab', 'lob'], ['boston', 'austin'], ['salem', 'helena'], ['nixon', 'wilson'], ['ford', 'polk'], ['bears', 'bills'], ['jets', 'nets'], ['rams', 'ram'], ['chad', 'mali'], ['togo', 'congo'],
  ['oman', 'iran'], ['wrong answer', 'theelephantintheroom'], ['banana', 'microscope']];
yes.forEach(function (p) { assert.ok(near(n(p[0]), n(p[1])) >= 0, 'should be accepted: ' + p[0] + ' for ' + p[1]); });
no.forEach(function (p) { assert.ok(near(n(p[0]), n(p[1])) < 0, 'should NOT be accepted: ' + p[0] + ' for ' + p[1]); });

// every answer and every listed spelling on every Crillion sheet must come back as itself, and every known wrong answer as wrong
var count = 0;
C.crillion.forEach(function (it) {
  it.a.forEach(function (x) {
    [x[0]].concat(x[2] || []).forEach(function (name) {
      var r = crMatch(it, name); count++;
      assert.strictEqual(r.st, 'ok', it.q + ' -> ' + name + ' was ' + r.st);
      assert.strictEqual(r.name, x[0], it.q + ' -> ' + name + ' came back as ' + r.name);
    });
  });
  it.no.forEach(function (x) { var r = crMatch(it, x[0]); assert.strictEqual(r.st, 'no', it.q + ' -> ' + x[0] + ' should be wrong, was ' + r.st + ' ' + (r.name || '')); });
});
// an answer that belongs to a different sheet is never quietly turned into a look-alike on this one
var cross = [];
C.crillion.forEach(function (it) {
  C.crillion.forEach(function (other) {
    if (other === it) { return; }
    other.a.forEach(function (x) { var r = crMatch(it, x[0]); if (r.st === 'ok' && n(r.name) !== n(x[0]) && !(it.a.some(function (y) { return [y[0]].concat(y[2] || []).some(function (z) { return n(z) === n(x[0]); }); }))) { cross.push(x[0] + ' -> ' + r.name); } });
  });
});
assert.strictEqual(cross.length, 0, 'look-alike from another sheet accepted: ' + cross.join(', '));
console.log('OK: ' + yes.length + ' misspellings accepted, ' + no.length + ' different words refused, ' + count + ' Crillion answers and spellings checked');
