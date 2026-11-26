#!/usr/bin/env python3
"""Token address for the Game Show Night avatar host. Run this on your own server (the Azure VM), behind HTTPS.

The game page is public, so it must never hold the Azure key. This small server keeps the key and hands the
TV page two short-lived things: a Speech token (valid about 10 minutes) and the relay details the avatar's
video connection needs. Standard library only.

Settings (environment, or lines in ~/.foundry.env):
  SPEECH_KEY        key of the Speech / Foundry resource (falls back to FOUNDRY_API_KEY)
  SPEECH_REGION     region of that resource, for example westus2. It must be a region that offers avatars.
  AVATAR_PASS       a password you make up. The TV link carries it (&ak=...). Stops strangers using your credit.
  AVATAR_ORIGIN     site allowed to call this (default https://jcason-sudo.github.io)
  AVATAR_DAILY_MAX  most tokens handed out per day (default 60). A spending guard.
  AVATAR_VOICE, AVATAR_CHARACTER, AVATAR_STYLE   optional (defaults: service default voice, lisa, casual-sitting)
  AVATAR_PORT       default 8787 (listens on 127.0.0.1; put Caddy in front for HTTPS)

Run:   python3 tools/avatar_token_server.py
Caddy: avatar.yourdomain.com { reverse_proxy 127.0.0.1:8787 }
TV:    https://jcason-sudo.github.io/game-show-night/?avatar=https://avatar.yourdomain.com/avatar-token&ak=YOUR_PASSWORD

NOT yet run against Azure. Check the first reply by hand before a game night.
"""
import json, os, time, hmac, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs


def load_env():
    cfg = dict(os.environ)
    path = os.path.expanduser('~/.foundry.env')
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                cfg.setdefault(k.strip(), v.strip())
    return cfg


CFG = load_env()
KEY = CFG.get('SPEECH_KEY') or CFG.get('FOUNDRY_API_KEY') or ''
REGION = CFG.get('SPEECH_REGION', '')
PASS = CFG.get('AVATAR_PASS', '')
ORIGIN = CFG.get('AVATAR_ORIGIN', 'https://jcason-sudo.github.io')
DAILY_MAX = int(CFG.get('AVATAR_DAILY_MAX', '60'))
PORT = int(CFG.get('AVATAR_PORT', '8787'))
count = {'day': '', 'n': 0}


def call(method, url):
    req = urllib.request.Request(url, method=method, data=b'' if method == 'POST' else None,
                                 headers={'Ocp-Apim-Subscription-Key': KEY, 'Content-Length': '0'} if method == 'POST' else {'Ocp-Apim-Subscription-Key': KEY})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode('utf8')


class Handler(BaseHTTPRequestHandler):
    def reply(self, code, body):
        data = json.dumps(body).encode('utf8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path != '/avatar-token':
            return self.reply(404, {'error': 'not found'})
        if not (KEY and REGION and PASS):
            return self.reply(500, {'error': 'server is missing SPEECH_KEY, SPEECH_REGION or AVATAR_PASS'})
        given = (parse_qs(u.query).get('key') or [''])[0]
        if not hmac.compare_digest(given, PASS):
            time.sleep(1)
            return self.reply(403, {'error': 'wrong password'})
        today = time.strftime('%Y-%m-%d')
        if count['day'] != today:
            count['day'], count['n'] = today, 0
        if count['n'] >= DAILY_MAX:
            return self.reply(429, {'error': 'daily avatar limit reached'})
        count['n'] += 1
        try:
            token = call('POST', 'https://%s.api.cognitive.microsoft.com/sts/v1.0/issueToken' % REGION)
            relay = json.loads(call('GET', 'https://%s.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1' % REGION))
        except urllib.error.HTTPError as e:
            return self.reply(502, {'error': 'Azure answered %d' % e.code})
        except Exception as e:
            return self.reply(502, {'error': 'Azure not reachable: %s' % type(e).__name__})
        urls = relay.get('Urls') or relay.get('urls') or []
        self.reply(200, {
            'token': token, 'region': REGION,
            'ice': {'urls': urls[0] if urls else '', 'username': relay.get('Username') or relay.get('username'), 'credential': relay.get('Password') or relay.get('credential')},
            'voice': CFG.get('AVATAR_VOICE', ''), 'character': CFG.get('AVATAR_CHARACTER', 'lisa'), 'style': CFG.get('AVATAR_STYLE', 'casual-sitting'),
        })

    def log_message(self, fmt, *args):   # one short line per request, never the password
        print(time.strftime('%H:%M:%S'), self.command, urlparse(self.path).path, args[1] if len(args) > 1 else '')


if __name__ == '__main__':
    print('avatar token address on 127.0.0.1:%d, allowed site %s, daily limit %d' % (PORT, ORIGIN, DAILY_MAX))
    HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
