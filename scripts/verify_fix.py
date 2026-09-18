import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        page = await browser.new_page(viewport={'width':1400,'height':1100})
        await page.goto('http://localhost:8791/calculator.html')
        await page.evaluate("selectProduct('internship')")
        await page.wait_for_timeout(150)
        await page.screenshot(path='shot_fix_internship.png', full_page=True)

        await page.evaluate("selectProduct('growth')")
        await page.wait_for_timeout(150)
        await page.screenshot(path='shot_fix_growth.png', full_page=True)
        await browser.close()

asyncio.run(main())
