/* Builds src/spell.js: the word data for the spelling fixer used in Know Your Family.
   Inputs (not kept in the repo):
     en_50k.txt  word-frequency list from film subtitles, github.com/hermitdave/FrequencyWords (content/2018/en)
     es_50k.txt, pt_br_50k.txt  the same lists for Spanish and Brazilian Portuguese (the family uses all three languages;
                 these words are only protected from being "corrected", never suggested)
   Usage: node tools/make_spell.js en_50k.txt es_50k.txt pt_br_50k.txt */
var fs = require('fs'), path = require('path');
var rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').map(function (l) { return l.split(' ')[0]; }).filter(function (w) { return /^[a-z]+$/.test(w); });
// Common slips and missing apostrophes, fixed by rule. Checked before anything else.
var FIX = { dont: "don't", cant: "can't", didnt: "didn't", doesnt: "doesn't", isnt: "isn't", wasnt: "wasn't", werent: "weren't", couldnt: "couldn't", wouldnt: "wouldn't", shouldnt: "shouldn't", havent: "haven't", hasnt: "hasn't", hadnt: "hadn't", arent: "aren't", ive: "I've", im: "I'm", youre: "you're", theyre: "they're", thats: "that's", whats: "what's",
  alot: 'a lot', untill: 'until', wich: 'which', begining: 'beginning', goverment: 'government', tommorow: 'tomorrow', tomorow: 'tomorrow', rember: 'remember', remeber: 'remember', definately: 'definitely', definatly: 'definitely', recieve: 'receive', recieved: 'received', beleive: 'believe', belive: 'believe', freind: 'friend', freinds: 'friends', wierd: 'weird', thier: 'their', becuase: 'because', becasue: 'because', seperate: 'separate', occured: 'occurred', accross: 'across', adress: 'address', basicly: 'basically', calender: 'calendar', comming: 'coming', diffrent: 'different', dissapear: 'disappear', enviroment: 'environment', familar: 'familiar', finaly: 'finally', foriegn: 'foreign', fourty: 'forty', grammer: 'grammar', happend: 'happened', immediatly: 'immediately', independant: 'independent', intresting: 'interesting', knowlege: 'knowledge', libary: 'library', neccessary: 'necessary', necesary: 'necessary', occassion: 'occasion', peice: 'piece', prefered: 'preferred', probly: 'probably', realy: 'really', recomend: 'recommend', restaraunt: 'restaurant', resturant: 'restaurant', shcool: 'school', sucess: 'success', suprise: 'surprise', surprize: 'surprise', tatoo: 'tattoo', tounge: 'tongue', truely: 'truly', vaccum: 'vacuum', writting: 'writing', tomatoe: 'tomato', potatoe: 'potato', soccor: 'soccer', twelth: 'twelfth', eigth: 'eight', nineth: 'ninth', brocoli: 'broccoli', hampster: 'hamster', acheive: 'achieve', agressive: 'aggressive', apparantly: 'apparently', arguement: 'argument', athiest: 'atheist', beautifull: 'beautiful', buisness: 'business', cemetary: 'cemetery', collegue: 'colleague', concious: 'conscious', embarassed: 'embarrassed', excercise: 'exercise', exersize: 'exercise', garantee: 'guarantee', gaurd: 'guard', hieght: 'height', humerous: 'humorous', jewelery: 'jewelry', liason: 'liaison', mispell: 'misspell', mischevious: 'mischievous', noticable: 'noticeable', pasttime: 'pastime', persue: 'pursue', publically: 'publicly', recieving: 'receiving', rythm: 'rhythm', sieze: 'seize', speach: 'speech', strenght: 'strength', succesful: 'successful', tendancy: 'tendency', threshhold: 'threshold', wellcome: 'welcome', wensday: 'Wednesday', febuary: 'February' };
// Names of places, languages and a few short forms that should carry capitals.
var CAP = {};
'Spanish Portuguese English French German Italian Chinese Japanese Korean Russian Arabic American Brazilian Mexican Venezuelan Paraguayan Cuban Colombian Argentine Canadian European African Asian Brazil Mexico Spain Portugal France Italy Germany China Japan Canada America Venezuela Paraguay Argentina Colombia Cuba Peru Chile Ecuador Uruguay Bolivia England Ireland Scotland India Australia Egypt Greece Russia Miami Florida Texas California Hawaii Alaska London Paris Rome Madrid Lisbon Tokyo Europe Africa Asia Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February April June July August September October November December Christmas Easter Halloween Thanksgiving Disney Olympics TV USA NYC DJ NBA NFL FBI CIA'.split(' ').forEach(function (w) { CAP[w.toLowerCase()] = w; });
var NC = 22000;
var cand = rows.slice(0, NC).filter(function (w) { return !FIX[w]; });
var rest = rows.slice(NC).filter(function (w) { return !FIX[w]; });
function plain(w) { return w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
var inCand = {}; cand.forEach(function (w) { inCand[w] = 1; });
[process.argv[3], process.argv[4]].forEach(function (f) {
  if (!f) { return; }
  fs.readFileSync(f, 'utf8').split('\n').slice(0, 20000).forEach(function (l) { var w = plain(l.split(' ')[0] || ''); if (/^[a-z]{3,}$/.test(w) && !inCand[w] && !FIX[w]) { rest.push(w); } });
});
var seen = {}; rest = rest.filter(function (w) { if (seen[w]) { return false; } seen[w] = 1; return true; });
// Words 15,000 to 46,000 are only needed as "this is a real word, leave it alone", so they go in a bit filter.
var M = 655360, K = 7, bytes = new Uint8Array(M / 8);
function h32(s, seed) { var h = seed >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; } return h; }
rest.forEach(function (w) { var a = h32(w, 2166136261), b = h32(w, 3339675911) | 1; for (var i = 0; i < K; i++) { var x = (a + i * b) % M; if (x < 0) { x += M; } x = Math.floor(((a + i * b) >>> 0) % M); bytes[x >> 3] |= (1 << (x & 7)); } });
var out = '/* Word data for the spelling fixer (Know Your Family). Made by tools/make_spell.js. Do not edit by hand. */\n' +
  'var RC = (typeof RC !== \'undefined\') ? RC : {};\n' +
  'RC.spell = {\n  m: ' + M + ', k: ' + K + ',\n  fix: ' + JSON.stringify(FIX) + ',\n  cap: ' + JSON.stringify(CAP) + ',\n  words: \'' + cand.join(',') + '\',\n  bits: \'' + Buffer.from(bytes).toString('base64') + '\'\n};\n' +
  'if (typeof module !== \'undefined\') { module.exports = RC; }\n';
fs.writeFileSync(path.join(__dirname, '../src/spell.js'), out);
console.log('common words', cand.length, 'protected words', rest.length, 'file', Math.round(out.length / 1024) + ' KB');
