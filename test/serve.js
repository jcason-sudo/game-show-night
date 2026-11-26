/* Local relay + static server, for tests only. */
var http = require('http'), fs = require('fs'), path = require('path');
var aedes = require('aedes')();
var ws = require('websocket-stream');
var relay = http.createServer();
ws.createServer({ server: relay }, aedes.handle);
relay.listen(8888, function () { console.log('relay on 8888'); });
http.createServer(function (req, res) {
  var m = /^\/img\/zoom\/([a-z_]+\.jpg)/.exec(req.url);
  if (m) {
    var f = path.join(__dirname, '../img/zoom', m[1]);
    if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); return res.end(fs.readFileSync(f)); }
    res.writeHead(404); return res.end();
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(path.join(__dirname, '../index.html')));
}).listen(8080, function () { console.log('page on 8080'); });
