/* Builds dist/index.html: one self-contained file (styles, libraries, game) */
var fs = require('fs'), path = require('path');
function r(f) { return fs.readFileSync(path.join(__dirname, f), 'utf8'); }
var libs = r('node_modules/paho-mqtt/paho-mqtt-min.js') + '\n' + r('node_modules/qrcode-generator/qrcode.js');
var game = ['src/content.js', 'src/spell.js', 'src/art.js', 'src/engine.js', 'src/app.js'].map(r).join('\n');
function safe(js) { return js.replace(/<\/script/gi, '<\\/script'); }
var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">\n' +
  '<meta name="robots" content="noindex">\n<title>Game Show Night</title>\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@500;600;700&display=swap" rel="stylesheet">\n' +
  '<style>\n' + r('src/style.css') + '</style>\n</head>\n<body>\n<div id="app"></div>\n' +
  '<script>\n' + safe(libs) + '\n</script>\n<script>\n' + safe(game) + '\n</script>\n</body>\n</html>\n';

fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', Math.round(html.length / 1024) + ' KB');
