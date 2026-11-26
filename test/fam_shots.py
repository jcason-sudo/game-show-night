"""Know Your Family in real browsers: four phones type a fact, then everyone votes. Saves TV and phone screenshots."""
import asyncio
from playwright.async_api import async_playwright
BASE = 'http://localhost:8080/'; RELAY = 'relay=localhost:8888'
fails = []
def ok(c, what):
    print(('PASS ' if c else 'FAIL ') + what)
    if not c: fails.append(what)
FACTS = [('James', 0, 'i lived in eight countries', 0), ('Mia', 1, 'I play football and im a famous soccer player', 1), ('Leo', 0, 'my dog once ate my passport', 1), ('Grandma Rose', 1, 'I sang on the radio when I was nineteen', 0)]
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
        for i, (name, team, fact, kid) in enumerate(FACTS):
            p = await (await br.new_context(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True)).new_page()
            p.on('pageerror', lambda e, n=name: errors.append(n + ': ' + str(e)))
            await p.goto(BASE + '?r=' + room + '&' + RELAY + '&pid=u' + str(i) + ('&h=' + key if i == 0 else ''))
            await p.wait_for_selector('#nm'); await p.fill('#nm', name)
            tb = await p.query_selector('[data-a=team][data-v="%d"]' % team)
            if tb: await tb.click()
            await p.click('[data-a=join]'); await asyncio.sleep(0.6)
            if i == 0: await p.click('[data-a=c_nteams][data-v="2"]'); await asyncio.sleep(0.5)
            phones.append(p)
        james = phones[0]
        await james.click('#pbody [data-a=c_play][data-v=fam]'); await asyncio.sleep(1.5)
        await tv.screenshot(path='test/shots/fam_0_intro.png')
        await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(1.0)
        st = await S(); ok(st['phase'] == 'fam_in', 'everyone is asked for a fact')
        await phones[1].screenshot(path='test/shots/fam_1_phone_type.png')
        for i in (0, 1, 2):
            await phones[i].fill('#famin', FACTS[i][2]); await phones[i].tap('[data-a=fam][data-v="%d"]' % FACTS[i][3]); await asyncio.sleep(0.7)
        await tv.screenshot(path='test/shots/fam_2_tv_waiting.png'); await phones[0].screenshot(path='test/shots/fam_2_phone_sent.png')
        st = await S(); ok(st['phase'] == 'fam_in' and len(st['fam']['done']) == 3, 'three are in, the TV waits for the fourth')
        ok('eight countries' not in str(st), 'no fact is visible in what the phones receive')
        await phones[3].fill('#famin', FACTS[3][2]); await phones[3].tap('[data-a=fam][data-v="0"]'); await asyncio.sleep(1.2)
        st = await S(); ok(st['phase'] == 'fam_q' and st['fq']['of'] == 4, 'voting starts as soon as the last fact is in')
        for rnd in range(4):
            st = await S(); who = int(st['fq']['who'][1:]); name = st['fq']['name']
            truth = [o for o in st['fq']['o'] if o.lower().rstrip('.').replace("i'm", 'im') in [f[2].lower() for f in FACTS]]
            ok(len(truth) == 1, 'round %d (%s): the true fact is one of the four: %s' % (rnd + 1, name, st['fq']['o']))
            await asyncio.sleep(0.8)
            if rnd == 0:
                await tv.screenshot(path='test/shots/fam_3_tv_vote.png'); await phones[who].screenshot(path='test/shots/fam_3_phone_subject.png')
                await phones[(who + 1) % 4].screenshot(path='test/shots/fam_3_phone_vote.png')
            ok(await phones[who].query_selector('#pbody [data-a=famv]') is None, name + ' cannot vote on their own facts')
            voters = [i for i in range(4) if i != who]
            a = st['fq']['o'].index(truth[0]) if truth else 0
            for n, i in enumerate(voters):
                await phones[i].tap('#pbody [data-a=famv][data-v="%d"]' % (a if n == 0 else (a + n) % 4)); await asyncio.sleep(0.5)
            await asyncio.sleep(0.8)
            st = await S(); ok(st['phase'] == 'fam_rv' and st['rv']['nok'] == 1 and st['rv']['fooled'] == 2, 'reveal: one knew it, two were fooled')
            if rnd == 0:
                await tv.screenshot(path='test/shots/fam_4_tv_reveal.png'); await phones[who].screenshot(path='test/shots/fam_4_phone_subject.png'); await phones[voters[0]].screenshot(path='test/shots/fam_4_phone_right.png')
            await james.click('.bossbar [data-a=c_next]'); await asyncio.sleep(1.2)
        st = await S(); ok(st['phase'] == 'round_end', 'the game ends after everyone has had a turn')
        ok(not errors, 'no page errors ' + str(errors))
        await br.close()
    print('FAMILY', 'FAIL' if fails else 'PASS')
asyncio.run(main())
