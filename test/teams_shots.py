"""Team setup by the host: everyone joins with only a name, then the host makes teams, names them and moves people."""
import asyncio
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
        await tv.goto(BASE + '?' + RELAY); await tv.click('[data-a=tv]'); await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.keyboard.press('Enter'); await tv.wait_for_selector('.hoststep')
        key = (await tv.inner_text('.lobby .qr .url b')).strip()
        async def S(): return await tv.evaluate("JSON.parse(JSON.stringify(window.RCS))")
        phones = []
        for i, name in enumerate(['James', 'Casey', 'Bruno', 'William', 'Mia', 'Leo']):
            p = await (await br.new_context(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True)).new_page()
            p.on('pageerror', lambda e, n=name: errors.append(n + ': ' + str(e)))
            await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=u' + str(i) + ('&h=' + key if i == 0 else ''))
            await p.wait_for_selector('#nm'); await p.fill('#nm', name)
            ok(await p.query_selector('[data-a=team]') is None, name + ' joins with only a name, no team to pick')
            await p.click('[data-a=join]'); await asyncio.sleep(0.5); phones.append(p)
        james = phones[0]
        st = await S(); ok(st['solo'] is True and len(st['order']) == 6, 'six people in, no teams yet')
        await james.screenshot(path='test/shots/teams_1_host_no_teams.png', full_page=True)
        await tv.screenshot(path='test/shots/teams_1_tv.png')
        await james.click('[data-a=c_nteams][data-v="3"]'); await asyncio.sleep(0.8)
        st = await S(); ok(st['solo'] is False and len(st['teams']) == 3, 'the host made three teams')
        for t, n in enumerate(['Family Casey', 'Family Bruno', 'Family Will']):
            await james.fill('#ln%d' % t, n)
        phones[4].on  # no-op
        await james.click('[data-a=c_lnames]'); await asyncio.sleep(0.8)
        st = await S(); ok([x['name'] for x in st['teams']] == ['Family Casey', 'Family Bruno', 'Family Will'], 'the host named the teams')
        await james.click('[data-a=c_move][data-v="u4,2"]'); await asyncio.sleep(0.6)
        st = await S(); ok(st['players']['u4']['t'] == 2, 'the host moved Mia to Family Will')
        await phones[5].tap('[data-a=switch][data-v="1"]'); await asyncio.sleep(0.6)
        st = await S(); ok(st['players']['u5']['t'] == 1, 'Leo picked his own team on his phone')
        await james.screenshot(path='test/shots/teams_2_host_teams.png', full_page=True)
        await tv.screenshot(path='test/shots/teams_2_tv.png'); await phones[5].screenshot(path='test/shots/teams_2_player.png')
        await james.click('#pbody [data-a=c_play][data-v=vote]'); await asyncio.sleep(1.2)
        st = await S(); ok(st['phase'] == 'intro', 'the host started a game from the big list')
        await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(1.0); await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(0.5)
        ok(not errors, 'no page errors ' + str(errors))
        await br.close()
    print('TEAMS', 'FAIL' if fails else 'PASS')
asyncio.run(main())
