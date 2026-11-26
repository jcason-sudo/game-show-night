"""Full browser run: one TV screen + phones against a local relay. Saves screenshots per phase.
   usage: python3 test/e2e.py [2|3|4|5|solo]   (number of teams, or every player for themselves)"""
import asyncio, random, sys, json
from playwright.async_api import async_playwright

BASE = 'http://localhost:8080/'
RELAY = 'relay=localhost:8888'
MODE = sys.argv[1] if len(sys.argv) > 1 else '2'
SOLO = MODE == 'solo'
NT = 2 if SOLO else int(MODE)
# Leo scans first on purpose: the first one in must NOT become the host. James holds the host code.
NAMES = ['Leo', 'James', 'Grandma Rose', 'Dad', 'Mia', 'Aunt Bea', 'Carmen', 'Billy'][:(8 if NT >= 4 else 6)]
HOST = 1
random.seed(7)
TAG = 'solo_' if SOLO else ('t%d_' % NT)

async def main():
    errors = []
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        tvctx = await br.new_context(viewport={'width': 1280, 'height': 720})
        tv = await tvctx.new_page()
        tv.on('pageerror', lambda e: errors.append('TV: ' + str(e)))
        tv.on('console', lambda m: errors.append('TV console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await tv.goto(BASE + '?' + RELAY)
        await tv.screenshot(path='test/shots/' + TAG + '00_home.png')
        await tv.click('[data-a=tv]')
        await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.screenshot(path='test/shots/' + TAG + '01_tv_overlay.png')
        await tv.keyboard.press('Enter')
        await tv.wait_for_selector('.hoststep')
        await tv.screenshot(path='test/shots/' + TAG + '01b_tv_host_step.png')
        hostkey = (await tv.inner_text('.lobby .qr .url b')).strip()
        phones = []
        for i, name in enumerate(NAMES):
            ctx = await br.new_context(viewport={'width': 390, 'height': 780}, has_touch=True, is_mobile=True)
            p = await ctx.new_page()
            p.on('pageerror', lambda e, n=name: errors.append(n + ': ' + str(e)))
            await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=bot' + str(i) + ('&h=' + hostkey if i == HOST else ''))
            await p.wait_for_selector('#nm')
            team = i % NT
            if i == 0: await p.screenshot(path='test/shots/' + TAG + '02_phone_join.png')
            if i == 2: await p.screenshot(path='test/shots/' + TAG + '02b_phone_join_teams.png')
            await p.fill('#nm', name)
            tb = await p.query_selector('[data-a=team][data-v="%d"]' % team)     # team buttons only show once the host has set teams up
            if tb: await tb.click()
            await p.click('[data-a=join]')
            phones.append(p)
            await asyncio.sleep(0.5)
            if i == 0:
                boss = await tv.evaluate("window.RCS && window.RCS.boss")
                assert boss is None, 'the first player in must not be the host'
            if i == HOST:
                await asyncio.sleep(0.6)
                boss = await tv.evaluate("window.RCS && window.RCS.boss")
                assert boss == 'bot%d' % HOST, 'the phone with the host code must be the host, got %r' % boss
                st0 = await tv.evaluate("window.RCS.solo")
                assert st0 is True, 'a new night starts with no teams'
                if not SOLO:
                    await p.click('[data-a=c_nteams][data-v="%d"]' % NT)
                await asyncio.sleep(0.8)
        await asyncio.sleep(2)
        await tv.screenshot(path='test/shots/' + TAG + '04_tv_lobby.png')
        await phones[HOST].screenshot(path='test/shots/' + TAG + '05_phone_boss_lobby.png', full_page=True)
        await phones[0].screenshot(path='test/shots/' + TAG + '05c_phone_player_lobby.png')
        await phones[HOST].click('[data-a=c_short]')
        await asyncio.sleep(0.6)
        todo = ['vote', 'likely', 'fam', 'board', 'tf', 'zoom', 'num', 'phrase', 'decade', 'scramble', 'crillion', 'feud']
        await phones[HOST].click('[data-a=c_play][data-v=%s]' % todo.pop(0))
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
                await tv.screenshot(path='test/shots/' + TAG + ('tv_%02d_%s.png' % (len(shot), ph)))
            if ph == 'final' and same >= 6: break
            if ph == 'menu' and same >= 3:
                if 'menu_phone' not in pshot:
                    pshot['menu_phone'] = 1
                    await phones[HOST].screenshot(path='test/shots/' + TAG + '06_phone_boss_menu.png', full_page=True)
                    await phones[0].screenshot(path='test/shots/' + TAG + '06b_phone_player_menu.png')
                if todo:
                    if len(todo) == 5:   # pick one game from the TV itself, the rest from the phone
                        await tv.click('[data-a=s_game][data-v=%s]' % todo.pop(0))
                    else:
                        await phones[HOST].click('[data-a=c_play][data-v=%s]' % todo.pop(0))
                else:
                    await phones[HOST].click('#pbody [data-a=c_end]')
                await asyncio.sleep(0.8); continue
            # showrunner moves the show along on passive screens
            if ph in ('intro', 'vote_reveal', 'board_reveal', 'zoom_reveal', 'phrase_reveal', 'feud_reveal', 'round_end', 'ml_reveal', 'num_reveal', 'scr_reveal', 'cr_reveal', 'fam_rv') and same >= 6:
                b = await phones[HOST].query_selector('[data-a=c_next]')
                if b: await b.click()
                await asyncio.sleep(0.3); continue
            order = list(range(len(phones))); random.shuffle(order)
            for i in order:
                p = phones[i]
                key = ph + ('_mine' if (S.get('turn') == 'bot%d' % i or S.get('solver') == 'bot%d' % i) else '')
                btns = await p.query_selector_all('#pbody [data-a]:not([disabled])')
                acts = []
                for b in btns: acts.append(await b.get_attribute('data-a'))
                if key not in pshot and btns and any(a in ('vote','tile','buzz','ans','letter','solve','fpick','mlv','num','word','cr','c_crj','fam','famv') for a in acts):
                    pshot[key] = 1
                    await p.screenshot(path='test/shots/' + TAG + ('ph_%02d_%s.png' % (len(pshot), key)))
                if not btns: continue
                a = acts[0]
                try:
                    if 'vote' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'vote']).click()
                    elif 'famv' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'famv']).click()
                    elif 'fam' in acts:
                        await p.fill('#famin', random.choice(['i lived in eight countries', 'I play football and im a famous soccer player', 'My dog once ate my passport', 'I can play the ukulele', 'i have never eaten a tomato', 'I am scared of clowns', 'I once met the pope', 'I worked as a clown for one summer']))
                        await random.choice([b for b, x in zip(btns, acts) if x == 'fam']).click()
                    elif 'mlv' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'mlv']).click()
                    elif 'cr' in acts:
                        ans = await tv.evaluate("(function(){var L=RC.content.crillion;for(var i=0;i<L.length;i++){if(L[i].q===RCS.cr.text){var a=L[i].a,n=L[i].no||[];return [a[a.length-1][0],a[0][0],a[Math.floor(a.length/2)][0],n.length?n[0][0]:'Atlantis'];}}return ['x','x','x','x'];})()")
                        await p.fill('#crin', random.choice(ans + ['Atlantis', 'Zorblax Nine']))
                        await p.click('[data-a=cr]')
                    elif 'c_crj' in acts:
                        await random.choice([b for b, x in zip(btns, acts) if x == 'c_crj']).click()
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
                        elif 'isopen' not in cls and i == 0 and random.random() < 0.15:
                            await b.tap()   # Leo cannot wait: an early tap, which should cost him
                except Exception as e:
                    pass
            await asyncio.sleep(0.25)
        S = await tv.evaluate("window.RCS")
        await asyncio.sleep(1)
        await tv.screenshot(path='test/shots/' + TAG + 'tv_99_final.png')
        await phones[1].screenshot(path='test/shots/' + TAG + 'ph_99_final.png')
        print('final phase:', S['phase'], 'solo:', S.get('solo'), 'scores:', S['teams'], 'players:', [(S['players'][k]['n'], S['players'][k]['pts']) for k in S['order']], 'steps:', steps)
        print('tv phases captured:', sorted(shot.keys()))
        print('phone views captured:', sorted(pshot.keys()))
        # reload the TV mid-state and make sure it resumes
        await tv.reload(); await asyncio.sleep(1.5)
        S2 = await tv.evaluate("window.RCS")
        print('after TV reload phase:', S2['phase'], 'scores kept:', S2['teams'] == S['teams'], 'host kept:', S2['boss'] == 'bot%d' % HOST)
        print('errors:', errors[:10])
        await br.close()
        ok = S['phase'] == 'final' and not errors and S2['phase'] == 'final'
        sys.exit(0 if ok else 1)

asyncio.run(main())
