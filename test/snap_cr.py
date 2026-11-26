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
        names=['James','Sofia','Grandpa','Mia','Leo','Aunt Bea','Carmen','Billy']
        for i,n in enumerate(names):
            p = await (await br.new_context(viewport={'width':390,'height':780},has_touch=True,is_mobile=True)).new_page()
            await p.goto(BASE+'?r='+room+'&'+RELAY+'&pid=s'+str(i)); await p.wait_for_selector('#nm')
            await p.fill('#nm',n); await p.click('[data-a=team][data-v="%d"]'%(i%2)); await p.click('[data-a=join]')
            ps.append(p); await asyncio.sleep(0.3)
        b=ps[0]
        await asyncio.sleep(1.5); await b.click('[data-a=c_play][data-v=crillion]'); await asyncio.sleep(1)
        await tv.screenshot(path='test/shots/x_tv_cr_intro.png')
        await b.click('[data-a=c_next]'); await asyncio.sleep(1.5)
        await tv.screenshot(path='test/shots/x_tv_cr_q.png')
        ans = await tv.evaluate("(function(){var L=RC.content.crillion;for(var i=0;i<L.length;i++){if(L[i].q===RCS.cr.text){var a=L[i].a,n=L[i].no||[];var o=[];for(var j=0;j<a.length;j++){o.push(a[j][0]);}return [o,n.length?n[0][0]:'Atlantis'];}}return [['x'],'y'];})()")
        good, bad = ans
        picks=[good[-1], good[0], bad, good[len(good)//2], good[0], 'Atlantis', good[1 % len(good)], good[-2]]
        for p,t in zip(ps,picks):
            await p.fill('#crin', t); await p.click('[data-a=cr]'); await asyncio.sleep(0.25)
        await asyncio.sleep(1.5)
        await tv.screenshot(path='test/shots/x_tv_cr_judge8.png')
        j = await b.query_selector('[data-a=c_crj][data-v$=",0"]')
        if j: await j.click()
        await asyncio.sleep(1.5)
        await tv.screenshot(path='test/shots/x_tv_cr_reveal8.png')
        await ps[2].screenshot(path='test/shots/x_ph_cr_wrong.png'); await ps[3].screenshot(path='test/shots/x_ph_cr_ok.png')
        await br.close()
asyncio.run(main())
