/* Talking avatar host (prototype). Off unless the TV page is opened with ?avatar=...
     ?avatar=demo                      shows where the avatar stands and how the show flows; uses the browser's voice
     ?avatar=https://your-server/avatar-token&ak=PASSWORD
                                       connects to Azure Speech "text to speech avatar" through your own token address
     ?avatar=off                       forgets a saved address
   The page never holds an Azure key: the token address (tools/avatar_token_server.py) hands out a short-lived
   token and the relay details. Follows Microsoft's real-time avatar guide (WebRTC + Speech SDK for JavaScript).
   NOT yet tested against Azure; the demo mode and the call order are tested with a stand-in. */
var RC = (typeof RC !== 'undefined') ? RC : {};
RC.avatar = (function () {
  var SDK_URL = 'https://aka.ms/csspeech/jsbrowserpackageraw';
  var MAX_SESSION_MS = 25 * 60 * 1000;   // Azure ends a session at 30 minutes: renew at a quiet moment before that
  var IDLE_CLOSE_MS = 3 * 60 * 1000;     // nothing said for 3 minutes: hang up so the meter stops; reconnect on the next line
  var cfg = null, state = 'off', pc = null, syn = null, startedAt = 0, lastSaid = 0, speaking = false, pendingText = '', note = '', tries = 0, lastTry = 0;

  function param(name) { var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : ''; }
  function readCfg() { // the address bar is read as soon as the page loads, because choosing "TV screen" reloads the page without it
    var a = param('avatar'), saved = null, demo = false;
    try { saved = JSON.parse(localStorage.getItem('gn_avatar') || 'null'); demo = sessionStorage.getItem('gn_avatar_demo') === '1'; } catch (e) { }
    if (a === 'off') { try { localStorage.removeItem('gn_avatar'); sessionStorage.removeItem('gn_avatar_demo'); } catch (e2) { } return null; }
    if (a === 'demo') { try { sessionStorage.setItem('gn_avatar_demo', '1'); } catch (e4) { } return { demo: true }; }
    if (/^https:\/\//.test(a)) { saved = { url: a, pass: param('ak') }; try { localStorage.setItem('gn_avatar', JSON.stringify(saved)); sessionStorage.removeItem('gn_avatar_demo'); } catch (e3) { } return saved; }
    if (demo) { return { demo: true }; }
    return saved && saved.url ? saved : null;
  }
  try { readCfg(); } catch (e0) { }
  function el(id) { return document.getElementById(id); }
  function show() {
    var box = el('avbox'), scr = document.querySelector('.scr'), on = state === 'demo' || state === 'live' || state === 'loading';
    if (!box) { return; }
    box.className = 'avbox ' + state + (speaking ? ' talk' : '');
    if (scr) { scr.className = 'scr' + (on ? ' avmode' : ''); }
    var tag = el('avtag');
    if (tag) { tag.innerHTML = state === 'demo' ? 'Demo: the avatar video plays here' : (state === 'loading' ? 'Avatar connecting...' : (state === 'down' ? note : '')); }
  }
  function loadSdk(done) {
    if (window.SpeechSDK) { return done(true); }
    var s = document.createElement('script'); s.src = (cfg && cfg.sdk) || SDK_URL;
    s.onload = function () { done(!!window.SpeechSDK); }; s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }
  function getToken(done) {
    var x = new XMLHttpRequest();
    x.open('GET', cfg.url + (cfg.url.indexOf('?') < 0 ? '?' : '&') + 'key=' + encodeURIComponent(cfg.pass || ''), true);
    x.timeout = 12000;
    x.onload = function () { var j = null; try { j = JSON.parse(x.responseText); } catch (e) { } done(x.status === 200 && j && j.token ? j : null, j && j.error ? j.error : 'token address answered ' + x.status); };
    x.onerror = x.ontimeout = function () { done(null, 'token address not reachable'); };
    x.send();
  }
  function hangUp(why) {
    try { if (syn) { syn.close(); } } catch (e) { }
    try { if (pc) { pc.close(); } } catch (e2) { }
    syn = null; pc = null; speaking = false;
    if (state !== 'off' && state !== 'demo') { state = 'down'; note = why || ''; }
    show();
  }
  function connect() {
    if (!cfg || cfg.demo || state === 'loading' || state === 'live') { return; }
    if (Date.now() - lastTry < 15000 || tries >= 6) { return; }     // do not hammer the token address
    lastTry = Date.now(); tries++; state = 'loading'; show();
    loadSdk(function (ok) {
      if (!ok) { return hangUp('Speech SDK did not load'); }
      getToken(function (j, err) {
        if (!j) { return hangUp('Avatar off: ' + err); }
        try {
          var SDK = window.SpeechSDK;
          pc = new RTCPeerConnection({ iceServers: [{ urls: [j.ice.urls], username: j.ice.username, credential: j.ice.credential }] });
          pc.ontrack = function (ev) {
            var m = el(ev.track.kind === 'video' ? 'avvideo' : 'avaudio');
            if (m) { m.srcObject = ev.streams[0]; try { var p = m.play(); if (p && p.catch) { p.catch(function () { }); } } catch (e) { } }
          };
          pc.oniceconnectionstatechange = function () { if (pc && /disconnected|failed|closed/.test(pc.iceConnectionState) && state === 'live') { hangUp(''); } };
          pc.addTransceiver('video', { direction: 'sendrecv' });
          pc.addTransceiver('audio', { direction: 'sendrecv' });
          var sc = SDK.SpeechConfig.fromAuthorizationToken(j.token, j.region);
          if (j.voice) { sc.speechSynthesisVoiceName = j.voice; }
          var vf = new SDK.AvatarVideoFormat();
          vf.setCropRange(new SDK.Coordinate(600, 0), new SDK.Coordinate(1320, 1080));   // a tall slice of the 1920 x 1080 picture
          var ac = new SDK.AvatarConfig(j.character || 'lisa', j.style || 'casual-sitting', vf);
          ac.backgroundColor = '#0A2C39FF';
          syn = new SDK.AvatarSynthesizer(sc, ac);
          syn.startAvatarAsync(pc).then(function () {
            state = 'live'; startedAt = lastSaid = Date.now(); tries = 0; show();
            if (pendingText) { var t = pendingText; pendingText = ''; say(t); }
          }).catch(function (e) { hangUp('Avatar did not start: ' + (e && e.message ? e.message : e)); });
        } catch (e) { hangUp('Avatar error: ' + (e && e.message ? e.message : e)); }
      });
    });
  }
  function say(text) {
    if (!syn) { return; }
    lastSaid = Date.now();
    function go() {
      speaking = true; show();
      syn.speakTextAsync(text).then(function () { speaking = false; lastSaid = Date.now(); show(); }).catch(function () { speaking = false; hangUp(''); });
    }
    // a new line replaces the one being spoken, the same way the built-in voice works
    if (speaking && syn.stopSpeakingAsync) { syn.stopSpeakingAsync().then(go).catch(go); } else { go(); }
  }
  return {
    /* called once, when OK is pressed on the TV (browsers only allow sound after a key press) */
    start: function () { cfg = readCfg(); if (!cfg) { state = 'off'; return; } if (cfg.demo) { state = 'demo'; show(); return; } state = 'down'; connect(); },
    /* returns true when the avatar is speaking this line, false when the built-in voice should */
    speak: function (text) {
      if (state === 'live') { say(text); return true; }
      if (state === 'demo') { speaking = true; show(); setTimeout(function () { speaking = false; show(); }, Math.min(9000, 900 + text.length * 60)); return false; }
      if (state === 'down' && cfg) { pendingText = ''; connect(); }
      return false;
    },
    /* called a few times a second with the game state */
    tick: function (S) {
      if (state !== 'live') { return; }
      var now = Date.now();
      if (S && S.paused) { return hangUp(''); }
      if (!speaking && now - lastSaid > IDLE_CLOSE_MS) { return hangUp(''); }
      if (!speaking && now - startedAt > MAX_SESSION_MS && now - lastSaid > 4000) { hangUp(''); tries = 0; lastTry = 0; connect(); }
    },
    stop: function () { hangUp(''); },
    state: function () { return state; }
  };
})();
if (typeof module !== 'undefined') { module.exports = RC; }
