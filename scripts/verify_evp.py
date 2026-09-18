import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        page = await browser.new_page(viewport={'width':1400,'height':1100})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto('http://localhost:8791/calculator.html')
        await page.evaluate("selectProduct('evp')")
        await page.wait_for_timeout(150)
        raw = await page.evaluate("currentProduct.compute(values)")
        print("EVP total:", raw['total'], "expected 88677600")
        print("EVP cost:", raw['cost'], "expected 27000000")
        print("EVP roi%:", raw['roi']*100, "expected 228.44")
        assert abs(raw['total']-88677600) < 1
        assert abs(raw['cost']-27000000) < 1
        assert abs(raw['roi']*100-228.4356) < 0.01
        await page.screenshot(path='shot_evp_new.png', full_page=True)
        if errors: print("ERRORS", errors)
        else: print("NO ERRORS")
        await browser.close()

asyncio.run(main())
