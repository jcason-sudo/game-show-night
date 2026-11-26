"""Zoom In with photographs: plays two pictures on a 1080p TV page and saves what the room would see.
   Checks that the photo loads, that the zoom is slow and smooth, and that the photo node is never rebuilt."""
import asyncio, sys, time
from playwright.async_api import async_playwright
BASE = 'http://localhost:8080/'; RELAY = 'relay=localhost:8888'
fails = []
def ok(c, what):
    print(('PASS ' if c else 'FAIL ') + what)
    if not c: fails.append(what)
async def main():
    errors = []
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        tv = await (await br.new_context(viewport={'width': 1920, 'height': 1080})).new_page()
        tv.on('pageerror', lambda e: errors.append('TV: ' + str(e)))
        bad = []
        tv.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
        await tv.goto(BASE + '?' + RELAY); await tv.click('[data-a=tv]'); await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.keyboard.press('Enter'); await tv.wait_for_selector('.hoststep')
        key = (await tv.inner_text('.lobby .qr .url b')).strip()
        async def S(): return await tv.evaluate("JSON.parse(JSON.stringify(window.RCS))")
        async def phone(i, name, team, host=False):
            p = await (await br.new_context(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True)).new_page()
            p.on('pageerror', lambda e, n=name: errors.append(n + ': ' + str(e)))
            await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=u' + str(i) + ('&h=' + key if host else ''))
            await p.wait_for_selector('#nm'); await p.fill('#nm', name)
            b = await p.query_selector('[data-a=team][data-v="%d"]' % team)
            if b: await b.click()
            await p.click('[data-a=join]'); await asyncio.sleep(0.6)
            return p
        james = await phone(1, 'James', 0, host=True); mia = await phone(0, 'Mia', 1)
        await james.click('#pbody [data-a=c_play][data-v=zoom]'); await asyncio.sleep(1.5)
        await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(0.8)
        st = await S(); ok(st['phase'] == 'zoom_q', 'Zoom In started'); ok(35000 <= st['zdur'] <= 45000, 'one picture pulls back over about 40 seconds: %d s' % (st['zdur'] / 1000))
        t0 = st['zt0'] / 1000.0
        await tv.evaluate("document.getElementById('zimg').setAttribute('data-keep', '1')")
        prev = None
        for sec in [1, 5, 10, 20, 30, 39.5]:
            wait = t0 + sec - time.time()
            if wait > 0: await asyncio.sleep(wait)
            info = await tv.evaluate("(function(){var e=document.getElementById('zimg'),s=document.getElementById('zsharp');var m=/scale\\(([0-9.]+)\\)/.exec(e.style.transform);return {sc:+m[1],op:+s.style.opacity,ok:s.complete&&s.naturalWidth>0,keep:e.getAttribute('data-keep'),val:document.getElementById('zval')?document.getElementById('zval').innerHTML:''}})()")
            print('  t=%2.0fs scale %.2f sharp %.2f worth %s' % (sec, info['sc'], info['op'], info['val']))
            ok(info['ok'], 'photo loaded at %ds' % int(sec))
            if prev: ok(info['sc'] < prev, 'still pulling back at %ds' % int(sec))
            prev = info['sc']
            await tv.screenshot(path='test/shots/zoom_%02d.png' % int(sec))
            cv = await tv.evaluate("document.getElementById('zcredit').style.visibility"); ok(cv == 'hidden', 'no photo credit on screen while guessing (%ds)' % sec)
        ok(info['keep'] == '1', 'the photo was never rebuilt while it zoomed')
        ok(abs(prev - 1) < 0.2, 'ends on the whole picture')
        # smoothness: scale steps between animation frames stay tiny
        steps = await tv.evaluate("new Promise(function(res){var a=[],n=0;function f(){var m=/scale\\(([0-9.]+)\\)/.exec(document.getElementById('zimg').style.transform);a.push(+m[1]);if(++n<40){requestAnimationFrame(f)}else{res(a)}}requestAnimationFrame(f)})")
        # second picture: Mia buzzes after GO and answers; reveal pulls back smoothly
        await asyncio.sleep(max(0, t0 + 47.5 - time.time()))
        st = await S()
        if st['phase'] == 'zoom_reveal': await tv.screenshot(path='test/shots/zoom_reveal_timeout.png'); await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(1.2)
        st = await S(); ok(st['phase'] == 'zoom_q' and st['z']['n'] == 2, 'on picture 2')
        await asyncio.sleep(8)
        await mia.wait_for_selector('.buzz.isopen', timeout=9000); await mia.tap('.buzz'); await asyncio.sleep(1.5)
        st = await S(); ok(st['phase'] == 'zoom_ans' and st['turn'] == 'u0', 'Mia buzzed after GO and answers')
        await tv.screenshot(path='test/shots/zoom_p2_frozen.png'); await mia.screenshot(path='test/shots/zoom_p2_mia.png')
        name = await tv.evaluate("(function(){var z=RC.content.zoom,i;for(i=0;i<z.length;i++){if(z[i].id===window.RCS.z.img){return z[i].o[0]}}})()")
        await mia.get_by_text(name, exact=True).tap()
        await asyncio.sleep(0.5); await tv.screenshot(path='test/shots/zoom_p2_reveal_a.png')
        await asyncio.sleep(2.6); await tv.screenshot(path='test/shots/zoom_p2_reveal_b.png')
        st = await S(); ok(st['phase'] == 'zoom_reveal', 'reveal after the answer: ' + str(st.get('rv')))
        ok(await tv.evaluate("document.getElementById('zcredit').style.visibility") == 'visible', 'the photo credit shows once the answer is out')
        ok(not errors, 'no page errors ' + str(errors)); ok(not bad, 'no failed downloads ' + str(bad[:3]))
        await br.close()
    print('ZOOM', 'FAIL' if fails else 'PASS')
asyncio.run(main())
