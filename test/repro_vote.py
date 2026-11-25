"""Reproduces "I tapped but my vote never counted": one phone's relay connections go silent
(as after the browser was backgrounded), then that player tries to vote."""
import asyncio, sys, time, urllib.request
from playwright.async_api import async_playwright
BASE='http://localhost:8080/'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'old'   # old = survey flow + c_start, new = game menu

async def join(br, room, name, team, pid, relay):
    p = await (await br.new_context(viewport={'width':390,'height':780},has_touch=True,is_mobile=True)).new_page()
    await p.goto(BASE+'?r='+room+'&relay='+relay+'&pid='+pid); await p.wait_for_selector('#nm')
    await p.fill('#nm',name); await p.click('[data-a=team][data-v="%d"]'%team); await p.click('[data-a=join]')
    if MODE == 'old':
        for s in range(3):
            await p.wait_for_selector('[data-a=sv]'); await p.click('[data-a=sv][data-v="%d"]'%s); await p.click('[data-a=svnext]')
    return p

async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        tv = await (await br.new_context(viewport={'width':1280,'height':720})).new_page()
        await tv.goto(BASE+'?relay=localhost:8888'); await tv.click('[data-a=tv]'); await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.keyboard.press('Enter')
        boss = await join(br, room, 'Sofia', 0, 'boss', 'localhost:8888')
        james = await join(br, room, 'James', 1, 'james', 'localhost:8889')   # through the proxy
        await asyncio.sleep(1.5)
        if MODE == 'old':
            await boss.click('[data-a=c_start]')
        else:
            await boss.click('[data-a=c_play][data-v=vote]')
        await asyncio.sleep(1.0)
        urllib.request.urlopen('http://localhost:8890/zombie').read()      # James's connections go silent
        t0 = time.time()
        await asyncio.sleep(1.0)
        await boss.click('[data-a=c_next]')                                 # intro -> first question
        await asyncio.sleep(0.5)
        await boss.click('[data-a=vote][data-v="0"]')                       # the healthy phone votes
        res = {'james_saw_question': False, 'james_tapped_at': None, 'tv_counted_at': None, 'james_screen': ''}
        while time.time() - t0 < 45:
            S = await tv.evaluate("window.RCS ? {phase: RCS.phase, acted: RCS.acted, n: (RCS.rv && RCS.rv.counts) ? RCS.rv.counts.reduce(function(a,b){return a+b;},0) : -1} : null")
            if S and S['phase'] != 'vote_q' and res['tv_counted_at'] is None and time.time() - t0 > 4:
                res['question_closed_at'] = round(time.time() - t0, 1); res['votes_counted_of_2'] = S['n']; break
            if S and S['acted'].get('james') and res['tv_counted_at'] is None:
                res['tv_counted_at'] = round(time.time() - t0, 1); break
            b = await james.query_selector('#pbody [data-a=vote]')
            if b:
                res['james_saw_question'] = True
                if res['james_tapped_at'] is None: res['james_tapped_at'] = round(time.time() - t0, 1)
                await b.click()
            await asyncio.sleep(0.4)
        res['james_screen'] = (await james.inner_text('#pbody'))[:60].replace('\n', ' | ')
        res['james_banner'] = (await james.inner_text('#pbanner'))[:60]
        print(MODE, res)
        await br.close()
asyncio.run(main())
