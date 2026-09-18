import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        page = await browser.new_page(viewport={'width':1400,'height':1000})
        await page.goto('http://localhost:8791/calculator.html')
        await page.screenshot(path='shot_home_evp_update.png', full_page=True)
        await browser.close()
asyncio.run(main())
