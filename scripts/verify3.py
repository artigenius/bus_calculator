import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')

        # mobile
        page = await browser.new_page(viewport={'width':390,'height':844})
        await page.goto('http://localhost:8791/calculator.html')
        await page.screenshot(path='shot_mobile_home.png', full_page=True)
        await page.evaluate("selectProduct('championship')")
        await page.wait_for_timeout(150)
        await page.screenshot(path='shot_mobile_calc.png', full_page=True)
        await page.close()

        # advanced toggle
        page2 = await browser.new_page(viewport={'width':1400,'height':1200})
        await page2.goto('http://localhost:8791/calculator.html')
        await page2.evaluate("selectProduct('growth')")
        await page2.wait_for_timeout(150)
        await page2.click("#advToggle")
        await page2.wait_for_timeout(150)
        await page2.screenshot(path='shot_advanced_open.png', full_page=True)
        await browser.close()

asyncio.run(main())
