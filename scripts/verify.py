import asyncio
from playwright.async_api import async_playwright

EXPECTED = {
    'internship': {'total': 141855000, 'cost': 25664000, 'roiPct': 452.7},
    'growth': {'total': 58304508.57, 'cost': 18660571.43, 'roiPct': 212.4},
    'evp': {'total': 88677600},
    'championship': {'total': 9874500},
}

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        page = await browser.new_page(viewport={'width':1400,'height':1000})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(f"[console {m.type}] {m.text}") if m.type=='error' else None)

        await page.goto('http://localhost:8791/calculator.html')
        await page.screenshot(path='shot_home.png', full_page=True)

        for pid, exp in EXPECTED.items():
            await page.evaluate(f"selectProduct('{pid}')")
            await page.wait_for_timeout(150)
            total_text = await page.eval_on_selector('.result-hero .value', 'el=>el.textContent')
            print(pid, "TOTAL displayed:", total_text)
            # get raw computed value via JS
            raw = await page.evaluate("currentProduct.compute(values)")
            print(pid, "raw total:", raw['total'], "expected:", exp['total'])
            assert abs(raw['total'] - exp['total']) < max(1, exp['total']*0.001), f"MISMATCH total {pid}"
            if 'cost' in exp:
                assert abs(raw['cost'] - exp['cost']) < max(1, exp['cost']*0.001), f"MISMATCH cost {pid}"
                roi_pct = raw['roi']*100
                assert abs(roi_pct - exp['roiPct']) < 1, f"MISMATCH roi {pid}: {roi_pct} vs {exp['roiPct']}"
            await page.screenshot(path=f'shot_{pid}.png', full_page=True)

        if errors:
            print("JS ERRORS:", errors)
        else:
            print("NO JS ERRORS")
        await browser.close()

asyncio.run(main())
