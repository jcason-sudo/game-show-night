/* Local relay + static server, for tests only. */
var http = require('http'), fs = require('fs'), path = require('path');
var aedes = require('aedes')();
var ws = require('websocket-stream');
var relay = http.createServer();
ws.createServer({ server: relay }, aedes.handle);
relay.listen(8888, function () { console.log('relay on 8888'); });
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(path.join(__dirname, '../index.html')));
}).listen(8080, function () { console.log('page on 8080'); });
