"""Full browser run: one TV screen + 5 phones against a local relay. Saves screenshots per phase."""
import asyncio, random, sys, json
from playwright.async_api import async_playwright

BASE = 'http://localhost:8080/'
RELAY = 'relay=localhost:8888'
NAMES = [('Grandma Rose', 1), ('Leo', 0), ('Dad', 1), ('Mia', 0), ('Aunt Bea', 1)]
random.seed(7)

async def main():
    errors = []
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        tvctx = await br.new_context(viewport={'width': 1280, 'height': 720})
        tv = await tvctx.new_page()
        tv.on('pageerror', lambda e: errors.append('TV: ' + str(e)))
        tv.on('console', lambda m: errors.append('TV console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await tv.goto(BASE + '?' + RELAY)
        await tv.screenshot(path='test/shots/00_home.png')
        await tv.click('[data-a=tv]')
        await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.screenshot(path='test/shots/01_tv_overlay.png')
        await tv.keyboard.press('Enter')
        phones = []
        for i, (name, team) in enumerate(NAMES):
            ctx = await br.new_context(viewport={'width': 390, 'height': 780}, has_touch=True, is_mobile=True)
            p = await ctx.new_page()
            p.on('pageerror', lambda e, n=name: errors.append(n + ': ' + str(e)))
            await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=bot' + str(i))
            await p.wait_for_selector('#nm')
            if i == 0: await p.screenshot(path='test/shots/02_phone_join.png')
            await p.fill('#nm', name)
            await p.click('[data-a=team][data-v="%d"]' % team)
            await p.click('[data-a=join]')
            phones.append(p)
            await asyncio.sleep(0.4)
        # surveys
        for i, p in enumerate(phones):
            for step in range(3):
                await p.wait_for_selector('[data-a=sv]')
                if i == 0 and step == 0: await p.screenshot(path='test/shots/03_phone_survey.png')
                for v in random.sample(range(10), 2): await p.click('[data-a=sv][data-v="%d"]' % v)
                await p.click('[data-a=svnext]')
                await asyncio.sleep(0.15)
        await asyncio.sleep(2)
        await tv.screenshot(path='test/shots/04_tv_lobby.png')
        await phones[0].screenshot(path='test/shots/05_phone_boss_lobby.png', full_page=True)
        await phones[0].click('[data-a=c_set][data-v=all]')
        await asyncio.sleep(0.6)
        await phones[0].click('[data-a=c_short]')
        await asyncio.sleep(0.6)
        await phones[0].screenshot(path='test/shots/05b_phone_boss_games.png', full_page=True)
        await tv.screenshot(path='test/shots/04b_tv_lobby_lineup.png')
        await phones[0].click('[data-a=c_preset]')
        await asyncio.sleep(0.6)
        await phones[0].click('[data-a=c_start]')
        shot = {}; pshot = {}
        steps = 0
        last_phase = None; same = 0
        while steps < 6000:
            steps += 1
            S = await tv.evaluate("window.RCS ? JSON.parse(JSON.stringify(window.RCS)) : null")
            if not S: await asyncio.sleep(0.2); continue
            ph = S['phase']
            if ph != last_phase: last_phase = ph; same = 0
            else: same += 1
            if ph not in shot and same >= 1:
                shot[ph] = 1
                await tv.screenshot(path='test/shots/tv_%02d_%s.png' % (len(shot), ph))
            if ph == 'final' and same >= 6: break
            # showrunner moves the show along on passive screens
            if ph in ('intro', 'vote_reveal', 'board_reveal', 'zoom_reveal', 'phrase_reveal', 'feud_reveal', 'round_end', 'ml_reveal', 'num_reveal', 'scr_reveal') and same >= 6:
                b = await phones[0].query_selector('[data-a=c_next]')
                if b: await b.click()
                await asyncio.sleep(0.3); continue
            order = list(range(len(phones))); random.shuffle(order)
            for i in order:
                p = phones[i]
                key = ph + ('_mine' if (S.get('turn') == 'bot%d' % i or S.get('solver') == 'bot%d' % i) else '')
                btns = await p.query_selector_all('#pbody [data-a]:not([disabled])')
                acts = []
                for b in btns: acts.append(await b.get_attribute('data-a'))
                if key not in pshot and btns and any(a in ('vote','tile','buzz','ans','letter','solve','fpick','mlv','num','word') for a in acts):
                    pshot[key] = 1
                    await p.screenshot(path='test/shots/ph_%02d_%s.png' % (len(pshot), key))
                if not btns: continue
                a = acts[0]
                try:
                    if 'vote' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'vote']).click()
                    elif 'mlv' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'mlv']).click()
                    elif 'num' in acts:
                        await p.fill('#numin', str(random.choice([3, 50, 88, 1900, 2000, 5000])))
                        await p.click('[data-a=num]')
                    elif 'word' in acts:
                        if random.random() < 0.6:
                            ans = await tv.evaluate("(function(){var m=RCS.ws.mix.split('').sort().join('');var L=RC.content.words;for(var i=0;i<L.length;i++){if(L[i].w.split('').sort().join('')===m)return L[i].w;}return 'x';})()")
                            await p.fill('#wordin', ans.lower() if random.random() < 0.7 else 'banana')
                            await p.click('[data-a=word]')
                    elif 'tile' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'tile']).click()
                    elif 'ans' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'ans']).click()
                    elif 'fpick' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'fpick']).click()
                    elif 'solve' in acts:
                        ans = await tv.evaluate("(function(){var m=RCS.ph.mask.join('');var L=RC.content.phrases;for(var i=0;i<L.length;i++){var t=L[i].t;if(t.length!==m.length)continue;var ok=true;for(var j=0;j<t.length;j++){if(m[j]!=='_'&&m[j]!==t[j])ok=false;}if(ok)return t;}return 'no idea';})()")
                        await p.fill('#solve', ans.lower() if random.random() < 0.7 else 'banana split')
                        await p.click('[data-a=solve]')
                    elif 'letter' in acts and random.random() < 0.8:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'letter']).click()
                    elif 'buzz' in acts:
                        b = [b for b, x in zip(btns, acts) if x == 'buzz'][0]
                        cls = await b.get_attribute('class')
                        if ph == 'phrase_turn':
                            hidden = S['ph']['mask'].count('_')
                            if hidden <= 6 and random.random() < 0.3: await b.click()
                        elif 'isopen' in cls and random.random() < 0.5:
                            await b.tap()
                except Exception as e:
                    pass
            await asyncio.sleep(0.25)
        S = await tv.evaluate("window.RCS")
        await asyncio.sleep(1)
        await tv.screenshot(path='test/shots/tv_99_final.png')
        await phones[1].screenshot(path='test/shots/ph_99_final.png')
        print('final phase:', S['phase'], 'scores:', S['teams'], 'steps:', steps)
        print('tv phases captured:', sorted(shot.keys()))
        print('phone views captured:', sorted(pshot.keys()))
        # reload the TV mid-state and make sure it resumes
        await tv.reload(); await asyncio.sleep(1.5)
        S2 = await tv.evaluate("window.RCS")
        print('after TV reload phase:', S2['phase'], 'scores kept:', S2['teams'] == S['teams'])
        print('errors:', errors[:10])
        await br.close()
        ok = S['phase'] == 'final' and not errors and S2['phase'] == 'final'
        sys.exit(0 if ok else 1)

asyncio.run(main())
