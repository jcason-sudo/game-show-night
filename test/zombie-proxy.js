/* Test tool: a relay proxy on 8889 that can turn its current connections into "zombies":
   the phone still thinks it is connected, but nothing gets through. This is what a phone's
   connections look like after the browser was in the background or the Wi-Fi hiccuped. */
var net = require('net'), http = require('http');
var conns = [];
net.createServer(function (a) {
  var b = net.connect(8888, '127.0.0.1'), c = { dead: false };
  conns.push(c);
  a.on('data', function (d) { if (!c.dead) { b.write(d); } });
  b.on('data', function (d) { if (!c.dead) { a.write(d); } });
  a.on('error', function () { }); b.on('error', function () { });
  a.on('close', function () { b.destroy(); }); b.on('close', function () { if (!c.dead) { a.destroy(); } });
}).listen(8889);
http.createServer(function (req, res) {
  if (req.url === '/zombie') { conns.forEach(function (c) { c.dead = true; }); }
  res.end('ok ' + conns.length);
}).listen(8890);
console.log('zombie proxy on 8889, control on 8890');
