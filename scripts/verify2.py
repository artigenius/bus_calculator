import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        page = await browser.new_page(viewport={'width':1400,'height':1200})
        await page.goto('http://localhost:8791/calculator.html')

        await page.evaluate("selectProduct('internship')")
        await page.wait_for_timeout(150)
        await page.click("#card_e1 .effect-head")
        await page.wait_for_timeout(150)
        await page.screenshot(path='shot_explain.png', full_page=True)

        # test tooltip
        await page.click(".help[data-tip='specialistSalary']")
        await page.wait_for_timeout(100)

        # change an input and check live recalc
        inp = await page.query_selector("#in_internsPerYear")
        await inp.fill("400")
        await page.wait_for_timeout(150)
        total = await page.eval_on_selector('.result-hero .value', 'el=>el.textContent')
        print("after doubling interns:", total)

        await page.screenshot(path='shot_after_edit.png', full_page=True)

        for pid in ['growth','evp','championship']:
            await page.evaluate(f"selectProduct('{pid}')")
            await page.wait_for_timeout(150)
            await page.screenshot(path=f'shot2_{pid}.png', full_page=True)

        await browser.close()

asyncio.run(main())
