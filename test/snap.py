import asyncio
from playwright.async_api import async_playwright
BASE='http://localhost:8080/'; RELAY='relay=localhost:8888'
async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        tv = await (await br.new_context(viewport={'width':1280,'height':720})).new_page()
        await tv.goto(BASE+'?'+RELAY); await tv.click('[data-a=tv]'); await tv.wait_for_selector('#ovb')
        room = await tv.evaluate("location.search.match(/screen=([A-Z]+)/)[1]")
        await tv.keyboard.press('Enter')
        ps=[]
        for i,(n,t) in enumerate([('James',1),('Sofia',0)]):
            p = await (await br.new_context(viewport={'width':390,'height':780},has_touch=True,is_mobile=True)).new_page()
            await p.goto(BASE+'?r='+room+'&'+RELAY+'&pid=s'+str(i)); await p.wait_for_selector('#nm')
            await p.fill('#nm',n); await p.click('[data-a=team][data-v="%d"]'%t); await p.click('[data-a=join]')
            ps.append(p)
        b=ps[0]
        await asyncio.sleep(1.5); await b.click('[data-a=c_play][data-v=vote]'); await asyncio.sleep(1)
        await b.click('[data-a=c_next]'); await asyncio.sleep(1.2)
        await tv.screenshot(path='test/shots/x_tv_vote_q.png')
        await ps[1].click('[data-a=vote][data-v="1"]'); await asyncio.sleep(1.0)
        await tv.screenshot(path='test/shots/x_tv_vote_waiting.png')
        await b.screenshot(path='test/shots/x_ph_boss_vote.png')
        await b.click('[data-a=c_menu]'); await asyncio.sleep(0.5); await b.screenshot(path='test/shots/x_ph_boss_sheet.png', full_page=True)
        await b.click('[data-a=c_tomenu]'); await asyncio.sleep(1.0)
        await tv.screenshot(path='test/shots/x_tv_menu.png')
        await b.click('[data-a=c_play][data-v=board]'); await asyncio.sleep(0.8); await b.click('[data-a=c_next]'); await asyncio.sleep(1.2)
        await tv.screenshot(path='test/shots/x_tv_board_pick.png')
        await br.close()
asyncio.run(main())
