/* Original flat drawings for the Zoom In round and the host. All drawn in code. */
var RC = (typeof RC !== 'undefined') ? RC : {};
(function () {
  function svg(inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">' + inner + '</svg>';
  }
  function rep(n, fn) { var s = ''; for (var i = 0; i < n; i++) { s += fn(i); } return s; }
  var art = {};

  art.eiffel = svg(
    '<rect width="800" height="500" fill="#BFE3F2"/>' +
    '<circle cx="660" cy="90" r="46" fill="#FBE9A6"/>' +
    '<ellipse cx="170" cy="110" rx="90" ry="26" fill="#FFFFFF"/><ellipse cx="230" cy="92" rx="60" ry="22" fill="#FFFFFF"/>' +
    '<rect y="430" width="800" height="70" fill="#7DB36B"/>' +
    '<polygon points="400,30 393,196 374,326 296,470 344,470 384,368 416,368 456,470 504,470 426,326 407,196" fill="#6E5B4A"/>' +
    '<path d="M344,470 Q400,372 456,470 L440,470 Q400,400 360,470 Z" fill="#5A4A3C"/>' +
    '<rect x="358" y="318" width="84" height="14" fill="#4E3F33"/>' +
    '<rect x="378" y="190" width="44" height="11" fill="#4E3F33"/>' +
    '<rect x="397" y="6" width="6" height="30" fill="#4E3F33"/>' +
    rep(7, function (i) { var y = 215 + i * 15; var w = 10 + i * 2.4; return '<path d="M' + (400 - w) + ',' + y + ' L' + (400 + w) + ',' + (y + 13) + ' M' + (400 + w) + ',' + y + ' L' + (400 - w) + ',' + (y + 13) + '" stroke="#C9B8A3" stroke-width="2" fill="none"/>'; }) +
    rep(6, function (i) { var y = 340 + i * 21; var o = 34 + i * 12; return '<path d="M' + (400 - o) + ',' + y + ' l-12,20 M' + (400 - o - 12) + ',' + y + ' l12,20 M' + (400 + o) + ',' + y + ' l12,20 M' + (400 + o + 12) + ',' + y + ' l-12,20" stroke="#C9B8A3" stroke-width="2" fill="none"/>'; }) +
    rep(9, function (i) { var x = 40 + i * 92; if (x > 270 && x < 530) { return ''; } return '<rect x="' + (x + 9) + '" y="418" width="6" height="22" fill="#6B4F3A"/><circle cx="' + (x + 12) + '" cy="408" r="20" fill="#4F8F4A"/>'; })
  );

  art.pyramids = svg(
    '<rect width="800" height="500" fill="#F6D7A1"/>' +
    '<circle cx="640" cy="120" r="54" fill="#F2A541"/>' +
    '<rect y="360" width="800" height="140" fill="#E0B565"/>' +
    '<polygon points="120,362 300,110 480,362" fill="#D9A651"/><polygon points="300,110 480,362 370,362" fill="#B98738"/>' +
    '<polygon points="390,362 540,170 690,362" fill="#DDAE5C"/><polygon points="540,170 690,362 600,362" fill="#BC8C3E"/>' +
    '<polygon points="610,362 700,250 790,362" fill="#D9A651"/><polygon points="700,250 790,362 738,362" fill="#B98738"/>' +
    rep(9, function (i) { var y = 150 + i * 24; var half = (y - 110) * (180 / 252); return '<line x1="' + (300 - half) + '" y1="' + y + '" x2="' + (300 + half * 0.39) + '" y2="' + y + '" stroke="#C4933F" stroke-width="2"/>'; }) +
    '<path d="M0,420 Q200,380 420,430 T800,410 L800,500 L0,500 Z" fill="#D2A452"/>' +
    '<rect x="72" y="330" width="8" height="90" fill="#7A5A33"/>' +
    '<path d="M76,330 q-50,-18 -64,14 M76,330 q-30,-40 -62,-20 M76,330 q46,-26 66,8 M76,330 q28,-42 60,-26 M76,330 q0,-44 26,-48" stroke="#4E8C4A" stroke-width="9" fill="none" stroke-linecap="round"/>'
  );

  art.goldengate = svg(
    '<rect width="800" height="500" fill="#CFE8F5"/>' +
    '<rect y="350" width="800" height="150" fill="#3F7FA8"/>' +
    '<path d="M0,350 Q60,250 150,300 L150,350 Z" fill="#6E8F5B"/><path d="M800,350 Q740,270 650,310 L650,350 Z" fill="#6E8F5B"/>' +
    '<path d="M-10,250 Q230,60 230,60 Q400,300 570,60 Q570,60 810,250" stroke="#B5392A" stroke-width="7" fill="none"/>' +
    rep(27, function (i) { var x = 20 + i * 29; var y; if (x < 230) { var t = (230 - x) / 240; y = 60 + 190 * t * t; } else if (x <= 570) { var u = (x - 400) / 170; y = 268 - 208 * u * u; } else { var w = (x - 570) / 240; y = 60 + 190 * w * w; } if (y > 284) { return ''; } return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="290" stroke="#B5392A" stroke-width="2"/>'; }) +
    '<rect x="-10" y="286" width="820" height="14" fill="#C0392B"/><rect x="-10" y="300" width="820" height="5" fill="#8E2A1E"/>' +
    rep(2, function (i) { var x = i === 0 ? 212 : 552; return '<rect x="' + x + '" y="44" width="13" height="336" fill="#C0392B"/><rect x="' + (x + 23) + '" y="44" width="13" height="336" fill="#C0392B"/>' +
      '<rect x="' + x + '" y="70" width="36" height="12" fill="#A93226"/><rect x="' + x + '" y="130" width="36" height="12" fill="#A93226"/><rect x="' + x + '" y="196" width="36" height="12" fill="#A93226"/><rect x="' + x + '" y="330" width="36" height="12" fill="#A93226"/>' +
      '<rect x="' + (x - 8) + '" y="372" width="52" height="16" fill="#8A8F93"/>'; }) +
    '<path d="M0,410 q40,-10 80,0 t80,0 M300,440 q40,-10 80,0 t80,0 M560,405 q40,-10 80,0 t80,0" stroke="#7FB2D1" stroke-width="4" fill="none"/>' +
    '<ellipse cx="120" cy="330" rx="170" ry="20" fill="#FFFFFF" opacity="0.75"/><ellipse cx="700" cy="336" rx="150" ry="16" fill="#FFFFFF" opacity="0.75"/>'
  );

  art.taj = svg(
    '<rect width="800" height="500" fill="#F8DCCB"/>' +
    '<circle cx="130" cy="110" r="40" fill="#F6B58A"/>' +
    '<rect y="380" width="800" height="120" fill="#8DB57A"/>' +
    '<rect x="180" y="360" width="440" height="26" fill="#E8E2D6"/>' +
    rep(4, function (i) { var x = [150, 236, 552, 638][i]; var h = (i === 0 || i === 3) ? 230 : 190; var top = 372 - h; return '<rect x="' + x + '" y="' + top + '" width="14" height="' + h + '" fill="#F4F0E8"/><rect x="' + (x - 3) + '" y="' + (top + h * 0.35) + '" width="20" height="5" fill="#D8D0C2"/><rect x="' + (x - 3) + '" y="' + (top + h * 0.68) + '" width="20" height="5" fill="#D8D0C2"/><path d="M' + (x - 2) + ',' + top + ' q9,-24 18,0 Z" fill="#F4F0E8"/><rect x="' + (x + 6) + '" y="' + (top - 22) + '" width="2" height="10" fill="#B9A36A"/>'; }) +
    '<rect x="282" y="230" width="236" height="132" fill="#FBF8F2"/>' +
    '<rect x="262" y="262" width="40" height="100" fill="#F1ECE2"/><rect x="498" y="262" width="40" height="100" fill="#F1ECE2"/>' +
    '<path d="M330,232 C300,170 350,96 400,74 C450,96 500,170 470,232 Z" fill="#FBF8F2"/>' +
    '<rect x="398" y="46" width="4" height="30" fill="#B9A36A"/><circle cx="400" cy="46" r="5" fill="#B9A36A"/>' +
    '<path d="M286,232 q20,-40 40,0 Z" fill="#F1ECE2"/><path d="M474,232 q20,-40 40,0 Z" fill="#F1ECE2"/>' +
    '<path d="M366,362 L366,292 Q400,236 434,292 L434,362 Z" fill="#CFC6B4"/><path d="M378,362 L378,300 Q400,262 422,300 L422,362 Z" fill="#6F6557"/>' +
    rep(4, function (i) { var x = [296, 326, 452, 482][i]; return '<path d="M' + x + ',300 q11,-22 22,0 l0,22 l-22,0 Z" fill="#CFC6B4"/><path d="M' + x + ',346 q11,-22 22,0 l0,16 l-22,0 Z" fill="#CFC6B4"/>'; }) +
    '<rect x="372" y="386" width="56" height="114" fill="#8CC4DE"/>' +
    rep(6, function (i) { var y = 400 + i * 16; return '<circle cx="' + (350 - i * 2) + '" cy="' + y + '" r="9" fill="#4F8F4A"/><circle cx="' + (450 + i * 2) + '" cy="' + y + '" r="9" fill="#4F8F4A"/>'; })
  );

  art.opera = svg(
    '<rect width="800" height="500" fill="#BFE3F2"/>' +
    '<ellipse cx="620" cy="90" rx="100" ry="24" fill="#FFFFFF"/><ellipse cx="160" cy="130" rx="80" ry="20" fill="#FFFFFF"/>' +
    '<rect y="370" width="800" height="130" fill="#2F7FB0"/>' +
    '<polygon points="90,372 710,372 680,330 120,330" fill="#C9A58A"/><rect x="120" y="322" width="560" height="10" fill="#B58E72"/>' +
    '<path d="M150,326 Q170,150 300,120 Q250,220 262,326 Z" fill="#FBFAF6" stroke="#D9D5CB" stroke-width="3"/>' +
    '<path d="M230,326 Q260,90 420,70 Q340,190 356,326 Z" fill="#FFFFFF" stroke="#D9D5CB" stroke-width="3"/>' +
    '<path d="M330,326 Q372,150 500,128 Q440,220 452,326 Z" fill="#FBFAF6" stroke="#D9D5CB" stroke-width="3"/>' +
    '<path d="M430,326 Q462,196 560,180 Q520,250 530,326 Z" fill="#FFFFFF" stroke="#D9D5CB" stroke-width="3"/>' +
    '<path d="M660,326 Q640,220 560,206 Q592,262 588,326 Z" fill="#FBFAF6" stroke="#D9D5CB" stroke-width="3"/>' +
    '<path d="M262,326 L268,250 L300,326 Z M356,326 L364,236 L400,326 Z" fill="#8FA7B3"/>' +
    '<path d="M40,420 q30,-8 60,0 t60,0 M300,450 q30,-8 60,0 t60,0 M560,430 q30,-8 60,0 t60,0" stroke="#7FB8DA" stroke-width="4" fill="none"/>' +
    '<polygon points="80,440 130,440 122,454 88,454" fill="#FFFFFF"/><polygon points="104,440 104,400 128,436" fill="#F2B134"/>'
  );

  art.pisa = svg(
    '<rect width="800" height="500" fill="#C9E6F4"/>' +
    '<ellipse cx="640" cy="100" rx="90" ry="22" fill="#FFFFFF"/>' +
    '<rect y="410" width="800" height="90" fill="#86B870"/>' +
    '<rect x="60" y="330" width="200" height="84" fill="#EDE7DA"/><polygon points="50,330 270,330 250,300 70,300" fill="#C97B5A"/>' +
    '<g transform="rotate(5.5 400 420)">' +
    rep(7, function (i) { var y = 372 - i * 44; var s = '<rect x="340" y="' + y + '" width="120" height="44" fill="' + (i % 2 ? '#F4F0E6' : '#FBF8F1') + '"/><rect x="334" y="' + y + '" width="132" height="6" fill="#D6CFBF"/>'; s += rep(8, function (j) { var x = 345 + j * 14.4; return '<path d="M' + x + ',' + (y + 44) + ' L' + x + ',' + (y + 20) + ' q5,-12 10,0 L' + (x + 10) + ',' + (y + 44) + ' Z" fill="#B9B09E"/>'; }); return s; }) +
    '<rect x="356" y="68" width="88" height="40" fill="#FBF8F1"/><rect x="350" y="64" width="100" height="6" fill="#D6CFBF"/>' +
    rep(5, function (j) { var x = 362 + j * 16; return '<path d="M' + x + ',108 L' + x + ',86 q5,-12 10,0 L' + (x + 10) + ',108 Z" fill="#B9B09E"/>'; }) +
    '<rect x="398" y="44" width="4" height="22" fill="#8A8F93"/><polygon points="402,44 422,50 402,56" fill="#C74634"/>' +
    '</g>' +
    '<rect x="318" y="412" width="190" height="10" fill="#D6CFBF"/>'
  );

  art.bigben = svg(
    '<rect width="800" height="500" fill="#D5E4EC"/>' +
    '<ellipse cx="180" cy="90" rx="110" ry="26" fill="#FFFFFF"/><ellipse cx="640" cy="140" rx="90" ry="22" fill="#FFFFFF"/>' +
    '<rect y="440" width="800" height="60" fill="#5E8AA6"/>' +
    '<rect x="430" y="330" width="370" height="112" fill="#C8AE7A"/>' +
    rep(12, function (i) { var x = 440 + i * 30; return '<rect x="' + x + '" y="350" width="12" height="70" fill="#8C7647"/><polygon points="' + (x - 3) + ',330 ' + (x + 6) + ',300 ' + (x + 15) + ',330" fill="#A8905C"/>'; }) +
    '<rect x="330" y="150" width="96" height="292" fill="#D3B984"/>' +
    rep(5, function (i) { var x = 340 + i * 18; return '<rect x="' + x + '" y="270" width="6" height="160" fill="#B39A63"/>'; }) +
    '<rect x="322" y="150" width="112" height="112" fill="#C8AE7A"/>' +
    '<circle cx="378" cy="206" r="44" fill="#FBF8EE" stroke="#3B3B3B" stroke-width="5"/>' +
    rep(12, function (i) { var a = i * Math.PI / 6; var x1 = 378 + Math.sin(a) * 34; var y1 = 206 - Math.cos(a) * 34; var x2 = 378 + Math.sin(a) * 40; var y2 = 206 - Math.cos(a) * 40; return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#3B3B3B" stroke-width="3"/>'; }) +
    '<line x1="378" y1="206" x2="378" y2="174" stroke="#3B3B3B" stroke-width="5"/><line x1="378" y1="206" x2="400" y2="218" stroke="#3B3B3B" stroke-width="6"/><circle cx="378" cy="206" r="5" fill="#3B3B3B"/>' +
    '<rect x="316" y="140" width="124" height="12" fill="#A8905C"/><rect x="316" y="260" width="124" height="10" fill="#A8905C"/>' +
    '<polygon points="326,140 430,140 410,96 346,96" fill="#5B6A70"/><rect x="346" y="80" width="64" height="18" fill="#C8AE7A"/>' +
    '<polygon points="346,80 410,80 378,14" fill="#5B6A70"/><rect x="376" y="0" width="4" height="18" fill="#B9A36A"/>' +
    '<rect x="0" y="424" width="330" height="18" fill="#9AA5AA"/>' +
    rep(5, function (i) { return '<path d="M' + (10 + i * 64) + ',442 q28,-30 56,0 Z" fill="#5E8AA6"/>'; })
  );

  art.stonehenge = svg(
    '<rect width="800" height="500" fill="#F3D9B8"/>' +
    '<circle cx="400" cy="300" r="90" fill="#F6B25E"/>' +
    '<rect y="300" width="800" height="200" fill="#7FAE62"/>' +
    '<path d="M0,330 Q400,290 800,330 L800,500 L0,500 Z" fill="#6E9E55"/>' +
    rep(3, function (i) { var x = 130 + i * 200; return '<rect x="' + x + '" y="210" width="42" height="170" fill="#8D9294"/><rect x="' + (x + 98) + '" y="214" width="40" height="166" fill="#84898B"/><rect x="' + (x - 10) + '" y="186" width="160" height="30" fill="#9CA1A3"/><rect x="' + (x + 30) + '" y="230" width="12" height="150" fill="#74797B"/>'; }) +
    '<rect x="60" y="280" width="34" height="110" fill="#84898B"/><rect x="716" y="270" width="36" height="120" fill="#8D9294"/>' +
    '<rect x="270" y="392" width="110" height="26" fill="#8D9294" transform="rotate(-6 325 405)"/><rect x="470" y="400" width="80" height="22" fill="#84898B" transform="rotate(4 510 411)"/>' +
    rep(8, function (i) { return '<path d="M' + (40 + i * 100) + ',470 l6,-16 l6,16" stroke="#4F8F4A" stroke-width="3" fill="none"/>'; })
  );

  /* The host: Ace, a game-show host in a bow tie. */
  art.host = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 220" width="100%" height="100%">' +
    '<g class="hostbob">' +
    '<rect x="42" y="34" width="150" height="100" rx="30" fill="#F2B705" stroke="#3A2214" stroke-width="6"/>' +
    '<ellipse cx="92" cy="88" rx="8" ry="11" fill="#3A2214" class="hosteye"/><ellipse cx="140" cy="88" rx="8" ry="11" fill="#3A2214" class="hosteye"/>' +
    '<path d="M80,70 q12,-10 24,-2 M128,68 q12,-8 24,2" stroke="#3A2214" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path class="hostmouth" d="M96,106 Q116,124 138,106 Z" fill="#3A2214"/>' +
    '<circle cx="72" cy="104" r="8" fill="#F5B7A8"/><circle cx="162" cy="104" r="8" fill="#F5B7A8"/>' +
    '<polygon points="116,138 86,124 86,156" fill="#C4520F"/><polygon points="116,138 146,124 146,156" fill="#C4520F"/><circle cx="116" cy="139" r="8" fill="#9C3F0A"/>' +
    '<path d="M86,150 L72,206 L160,206 L146,150 Z" fill="#17696B"/>' +
    '<path d="M150,160 q40,6 46,-26" stroke="#17696B" stroke-width="10" fill="none" stroke-linecap="round"/>' +
    '<rect x="188" y="96" width="14" height="40" rx="7" fill="#8A8F93"/><circle cx="195" cy="92" r="13" fill="#3A2214"/>' +
    '</g></svg>';

  RC.art = art;
})();
if (typeof module !== 'undefined') { module.exports = RC; }
