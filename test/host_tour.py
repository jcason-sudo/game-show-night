"""Plays the host: every control on the host's phone is tapped once and its effect is checked on the TV's state.
   Also plays one ordinary player, to see what they see while the host does it."""
import asyncio, sys
from playwright.async_api import async_playwright
BASE = 'http://localhost:8080/'; RELAY = 'relay=localhost:8888'
log = []
def ok(cond, what):
    log.append(('PASS ' if cond else 'FAIL ') + what)
    if not cond: print('FAIL', what)
async def main():
    errors = []
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        tv = await (await br.new_context(viewport={'width': 1280, 'height': 720})).new_page()
        tv.on('pageerror', lambda e: errors.append('TV: ' + str(e)))
        await tv.goto(BASE + '?' + RELAY); await tv.click('[data-a=tv]'); await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.keyboard.press('Enter'); await tv.wait_for_selector('.hoststep')
        key = (await tv.inner_text('.lobby .qr .url b')).strip()
        async def S(): return await tv.evaluate("JSON.parse(JSON.stringify(window.RCS))")
        async def phone(i, name, team, host=False, typed=False):
            p = await (await br.new_context(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True)).new_page()
            p.on('pageerror', lambda e, n=name: errors.append(n + ': ' + str(e)))
            await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=u' + str(i) + ('&h=' + key if host and not typed else ''))
            await p.wait_for_selector('#nm'); await p.fill('#nm', name)
            b = await p.query_selector('[data-a=team][data-v="%d"]' % team)
            if b: await b.click()
            if typed: await p.fill('#hk', key)
            await p.click('[data-a=join]'); await asyncio.sleep(0.6)
            return p
        async def tap(p, sel, twice=False):
            await p.click(sel); await asyncio.sleep(0.35)
            if twice: await p.click(sel); await asyncio.sleep(0.35)
            await asyncio.sleep(0.5)
        async def panel(p, want=True):
            has = await p.query_selector('.sheet')
            if bool(has) != want: await p.click('.bossbar [data-a=c_menu]'); await asyncio.sleep(0.4)

        mia = await phone(0, 'Mia', 0)
        ok((await S())['boss'] is None, 'first player in (Mia) is not the host')
        ok(await mia.query_selector('.bossbar') is None, 'Mia has no host buttons')
        james = await phone(1, 'James', 1, host=True)
        ok((await S())['boss'] == 'u1', 'James scanned the host code and is the host')
        others = [await phone(i, n, i % 2) for i, n in [(2, 'Dad'), (3, 'Leo'), (4, 'Carmen'), (5, 'Billy')]]
        await tv.screenshot(path='test/shots/host_01_tv_lobby.png')
        await james.screenshot(path='test/shots/host_02_james_lobby.png', full_page=True)
        await mia.screenshot(path='test/shots/host_03_mia_lobby.png', full_page=True)

        # ---- before the first game ----
        await panel(james); await james.screenshot(path='test/shots/host_04_panel_lobby.png', full_page=True)
        await tap(james, '.sheet [data-a=c_nteams][data-v="3"]'); ok(len((await S())['teams']) == 3, 'set 3 teams')
        await tap(james, '.sheet [data-a=c_nteams][data-v="5"]'); ok(len((await S())['teams']) == 5, 'set 5 teams')
        await tap(james, '.sheet [data-a=c_nteams][data-v="4"]'); ok(len((await S())['teams']) == 4, 'set 4 teams')
        await tap(james, '.sheet [data-a=c_shuffle]')
        st = await S(); per = [0, 0, 0, 0]
        for k in st['order']: per[st['players'][k]['t']] += 1
        ok(max(per) - min(per) <= 1, 'shuffle into even teams: ' + str(per))
        await tap(james, '.sheet [data-a=c_move][data-v="u3,2"]'); ok((await S())['players']['u3']['t'] == 2, 'moved Leo to team 3')
        await james.fill('#tn0', 'Sharks'); await tap(james, '.sheet [data-a=c_names]'); ok((await S())['teams'][0]['name'] == 'Sharks', 'renamed a team')
        await panel(james); await tap(james, '.sheet [data-a=c_adj][data-v="1,50"]'); ok((await S())['teams'][1]['score'] == 50, 'gave a team 50 points')
        await tap(james, '.sheet [data-a=c_adj][data-v="1,-50"]'); ok((await S())['teams'][1]['score'] == 0, 'took 50 points back')
        await tap(james, '.sheet [data-a=c_kick][data-v="u5"]', twice=True); ok('u5' not in (await S())['players'], 'removed Billy (asks twice)')
        await asyncio.sleep(1.2)
        ok('out of this game' in await others[3].inner_text('#pbody'), "Billy's phone says he is out")
        await james.screenshot(path='test/shots/host_05_panel_removed.png', full_page=True)
        await tap(james, '.sheet [data-a=c_unkick][data-v="u5"]'); await asyncio.sleep(4.5); ok('u5' in (await S())['players'], 'let Billy back in')
        await tap(james, '.sheet [data-a=c_solo][data-v="1"]'); ok((await S())['solo'] is True, 'switched to every player for themselves')
        await tap(james, '.sheet [data-a=c_nteams][data-v="2"]'); st = await S(); ok(st['solo'] is False and len(st['teams']) == 2, 'back to 2 teams')
        await panel(james, False)
        ok(await mia.query_selector('[data-a=c_play]') is None, 'Mia cannot start a game')
        await tap(mia, '[data-a=switch][data-v="1"]'); ok((await S())['players']['u0']['t'] == 1, 'a player can switch her own team in the lobby')

        # ---- during a game ----
        await tap(james, '#pbody [data-a=c_play][data-v=tf]'); ok((await S())['phase'] == 'intro', 'started a game')
        await asyncio.sleep(1.2); await tap(james, '.bossbar [data-a=c_next]'); ok((await S())['phase'] == 'vote_q', 'NEXT moved past the rules screen')
        await mia.screenshot(path='test/shots/host_06_mia_question.png')
        await panel(james); await james.screenshot(path='test/shots/host_07_panel_ingame.png', full_page=True)
        await tap(james, '.sheet [data-a=c_pause]'); ok((await S())['paused'] is True, 'paused the game')
        await asyncio.sleep(1.0); ok('Paused' in await mia.inner_text('#pbody'), "Mia's phone shows Paused")
        await tap(james, '.sheet [data-a=c_pause]'); ok((await S())['paused'] is False, 'resumed the game')
        q1 = (await S())['q']['text']
        await asyncio.sleep(1.0); await tap(james, '.sheet [data-a=c_skipq]'); await asyncio.sleep(1.2); await panel(james, False)
        ok((await S())['phase'] == 'vote_reveal', 'skipped the question (straight to the answer)')
        await tap(james, '.bossbar [data-a=c_next]'); await asyncio.sleep(1.0)
        st = await S(); ok(st['phase'] == 'vote_q' and st['q']['n'] == 2, 'on question 2')
        await tap(mia, '#pbody [data-a=vote][data-v="0"]'); await asyncio.sleep(0.5)
        await tap(james, '.bossbar [data-a=c_pause]'); await tap(james, '.bossbar [data-a=c_pause]')
        await panel(james); await tap(james, '.sheet [data-a=c_restart]', twice=True)
        st = await S(); ok(st['phase'] == 'intro' and st['round'] == 1 and all(st['players'][k]['pts'] == 0 for k in st['order']), 'restarted the game from the top, scores back')
        await asyncio.sleep(1.0); await panel(james); await tap(james, '.sheet [data-a=c_move][data-v="u2,0"]'); ok((await S())['players']['u2']['t'] == 0, 'moved Dad to the other team mid-game')
        await tap(james, '.sheet [data-a=c_tomenu]'); ok((await S())['phase'] == 'menu', 'left the game to pick a different one')
        await tv.screenshot(path='test/shots/host_08_tv_menu.png')
        await tap(james, '#pbody [data-a=c_play][data-v=zoom]'); await asyncio.sleep(1.2); await tap(james, '.bossbar [data-a=c_next]')
        ok((await S())['phase'] == 'zoom_q', 'started a second game (Zoom In)')
        # the buzzer: Leo taps on WAIT, Mia waits for GO
        await others[1].tap('.buzz'); await asyncio.sleep(1.0)
        st = await S(); ok(st['early'].get('u3') == 1 and st['players']['u3']['pts'] == -50, 'Leo tapped before GO: out and minus 50')
        await others[1].screenshot(path='test/shots/host_09_leo_early.png'); await tv.screenshot(path='test/shots/host_10_tv_early.png')
        await mia.wait_for_selector('.buzz.isopen', timeout=9000); await mia.screenshot(path='test/shots/host_11_mia_go.png'); await mia.tap('.buzz'); await asyncio.sleep(1.4)
        st = await S(); ok(st['phase'] == 'zoom_ans' and st['turn'] == 'u0', 'Mia waited for GO and gets to answer')
        await tv.screenshot(path='test/shots/host_12_tv_fastest.png')
        await panel(james); await tap(james, '.sheet [data-a=c_end]'); ok((await S())['phase'] == 'final', 'finished the night: winner screen')
        await tv.screenshot(path='test/shots/host_13_tv_final.png')
        # ---- after ----
        await panel(james); await tap(james, '.sheet [data-a=c_again]', twice=True)
        st = await S(); ok(st['phase'] == 'lobby' and len(st['order']) == 6 and st['round'] == 0, 'new night: same players and teams, scores zero')
        await panel(james); await tap(james, '.sheet [data-a=c_reset]', twice=True)
        st = await S(); ok(st['phase'] == 'lobby' and len(st['order']) == 0 and st['boss'] == 'u1', 'start over: everyone must join again, James is still host')
        await asyncio.sleep(1.5)
        ok(await mia.query_selector('#nm') is not None, "Mia's phone is back at the join screen")
        await mia.screenshot(path='test/shots/host_14_mia_rejoin.png')
        await james.click('[data-a=team][data-v="0"]'); await james.click('[data-a=join]'); await asyncio.sleep(1.0)
        ok(await james.query_selector('[data-a=c_play]') is not None, 'James rejoins and still picks the games')
        # a host who cannot scan types the host code instead
        await tv.click('[data-a=s_menu]'); await tv.click('[data-a=s_unhost]'); await asyncio.sleep(0.8)
        ok((await S())['boss'] is None and await tv.query_selector('.hoststep') is not None, 'TV menu: change the host shows a new host code')
        key2 = (await tv.inner_text('.lobby .qr .url b')).strip(); ok(key2 != key, 'the old host code no longer works')
        key = key2
        dad2 = await phone(9, 'Abuela', 0, host=True, typed=True)
        ok((await S())['boss'] == 'u9', 'typing the host code on the join screen also makes you the host')
        print('\n'.join(log)); print('errors:', errors)
        await br.close()
        sys.exit(0 if not errors and not any(l.startswith('FAIL') for l in log) else 1)
asyncio.run(main())
