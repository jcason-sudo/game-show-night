"""Avatar host prototype. Part 1: demo mode screenshots (where the avatar stands, how the show flows).
   Part 2: the real connection code run against a stand-in for Azure, to check the order of calls and the fallbacks.
   This does NOT prove it works against Azure; that needs a Speech resource and the token address."""
import asyncio, json
from playwright.async_api import async_playwright
BASE = 'http://localhost:8080/'; RELAY = 'relay=localhost:8888'
fails = []
def ok(c, what):
    print(('PASS ' if c else 'FAIL ') + what)
    if not c: fails.append(what)
FAKE_SDK = """
window.__av = { calls: [], said: [] };
window.SpeechSDK = {
  SpeechConfig: { fromAuthorizationToken: function (t, r) { __av.calls.push('token:' + t + ':' + r); return {}; } },
  AvatarVideoFormat: function () { this.setCropRange = function () { __av.calls.push('crop'); }; },
  Coordinate: function (x, y) { this.x = x; this.y = y; },
  AvatarConfig: function (c, s) { __av.calls.push('avatar:' + c + ':' + s); },
  AvatarSynthesizer: function () {
    this.startAvatarAsync = function (pc) { __av.calls.push('start'); return Promise.resolve(); };
    this.speakTextAsync = function (t) { __av.said.push(t); return new Promise(function (res) { setTimeout(res, 2500); }); };
    this.stopSpeakingAsync = function () { __av.calls.push('stop'); return Promise.resolve(); };
    this.close = function () { __av.calls.push('close'); };
  }
};
"""
async def start_tv(br, extra, routes=None):
    ctx = await br.new_context(viewport={'width': 1920, 'height': 1080})
    tv = await ctx.new_page(); errs = []
    tv.on('pageerror', lambda e: errs.append(str(e)))
    if routes: await routes(tv)
    await tv.goto(BASE + '?' + RELAY + '&' + extra); await tv.click('[data-a=tv]'); await tv.wait_for_selector('#ovb')
    room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
    await tv.keyboard.press('Enter'); await tv.wait_for_selector('.hoststep')
    key = (await tv.inner_text('.lobby .qr .url b')).strip()
    return tv, room, key, errs
async def join(br, room, i, name, key=''):
    p = await (await br.new_context(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True)).new_page()
    await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=u' + str(i) + ('&h=' + key if key else ''))
    await p.wait_for_selector('#nm'); await p.fill('#nm', name); await p.click('[data-a=join]'); await asyncio.sleep(0.6)
    return p
async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        # ---- part 1: demo mode ----
        tv, room, key, errs = await start_tv(br, 'avatar=demo')
        ok(await tv.evaluate("RC.avatar.state()") == 'demo', 'demo mode survives choosing "TV screen"')
        james = await join(br, room, 1, 'James', key); mia = await join(br, room, 2, 'Mia')
        await asyncio.sleep(0.8); await tv.screenshot(path='test/shots/avatar_1_lobby.png')
        await james.click('#pbody [data-a=c_play][data-v=zoom]'); await asyncio.sleep(1.5); await tv.screenshot(path='test/shots/avatar_2_rules.png')
        await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(9); await tv.screenshot(path='test/shots/avatar_3_zoom.png')
        await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(1.5)
        await james.click('.bossbar [data-a=bossmenu]') if await james.query_selector('.bossbar [data-a=bossmenu]') else None
        ok(not errs, 'demo mode: no page errors ' + str(errs))
        await tv.context.close()
        # ---- part 2: the real code path against a stand-in for Azure ----
        async def routes(page):
            async def token(route):
                await route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'},
                                    body=json.dumps({'token': 'TKN', 'region': 'westus2', 'ice': {'urls': 'turn:relay.example:3478', 'username': 'u', 'credential': 'c'}, 'voice': '', 'character': 'lisa', 'style': 'casual-sitting'}))
            await page.route('https://token.example/**', token)
            await page.route('https://aka.ms/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE_SDK))
        tv, room, key, errs = await start_tv(br, 'avatar=https://token.example/avatar-token&ak=pw', routes)
        await asyncio.sleep(2.5)
        st = await tv.evaluate("RC.avatar.state()"); calls = await tv.evaluate("window.__av ? __av.calls : []")
        ok(st == 'live', 'with a token address the avatar goes live (state: %s)' % st)
        ok(calls[:4] == ['token:TKN:westus2', 'crop', 'avatar:lisa:casual-sitting', 'start'], 'calls happen in the order Microsoft documents: ' + str(calls))
        ok('avmode' in await tv.evaluate("document.querySelector('.scr').className"), 'the stage makes room for the avatar')
        james = await join(br, room, 1, 'James', key); await join(br, room, 2, 'Mia')
        await james.click('#pbody [data-a=c_play][data-v=vote]'); await asyncio.sleep(1.5)
        said = await tv.evaluate("__av.said")
        ok(any('Everybody Votes' in s for s in said), 'host lines go to the avatar, not the browser voice: ' + str([s[:40] for s in said]))
        await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(1.0)
        ok('stop' in await tv.evaluate("__av.calls"), 'a new line cuts off the one being spoken')
        await james.click('.bossbar [data-a=c_pause]'); await asyncio.sleep(1.2)
        ok(await tv.evaluate("RC.avatar.state()") == 'down' and 'close' in await tv.evaluate("__av.calls"), 'pausing the show hangs up, so the meter stops')
        ok(not errs, 'no page errors ' + str(errs))
        await tv.context.close()
        # ---- part 3: token address down: the show goes on with the built-in voice ----
        async def bad(page):
            await page.route('https://token.example/**', lambda r: r.fulfill(status=403, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body='{"error":"wrong password"}'))
            await page.route('https://aka.ms/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE_SDK))
        tv, room, key, errs = await start_tv(br, 'avatar=https://token.example/avatar-token&ak=bad', bad)
        await asyncio.sleep(2.0)
        ok(await tv.evaluate("RC.avatar.state()") == 'down', 'a refused token leaves the avatar off')
        ok('avmode' not in await tv.evaluate("document.querySelector('.scr').className"), 'and the normal host layout stays')
        ok(not errs, 'no page errors ' + str(errs))
        await tv.evaluate("localStorage.removeItem('gn_avatar')")
        await br.close()
    print('AVATAR', 'FAIL' if fails else 'PASS')
asyncio.run(main())
