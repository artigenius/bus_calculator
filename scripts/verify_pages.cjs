// Run with Node.js and Playwright installed (or available through NODE_PATH).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const expected = {
  internship: [389731200, 25664000],
  growth: [63978034.28571429, 8946285.714285715],
  evp: [95013000, 22000000],
  certification: [1005312000, 2348000],
};

async function main() {
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname.slice(1);
    if (![...Object.keys(expected), 'calculator', 'championship'].some(id => name === `${id}.html`)) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {});
    for (const protocol of ['file', 'http']) {
      for (const [id, [total, cost]] of Object.entries(expected)) {
        const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const externalRequests = [];
        page.on('request', request => {
          if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:')) {
            externalRequests.push(request.url());
          }
        });
        const url = protocol === 'file'
          ? pathToFileURL(path.join(root, `${id}.html`)).href
          : `http://127.0.0.1:${server.address().port}/${id}.html`;
        await page.goto(url);
        await page.locator('.result-hero .value').waitFor();
        assert.deepEqual(await page.evaluate(() => Object.keys(PRODUCTS)), [id]);
        assert.equal(await page.locator('#backBtn, #screenHome, .product-grid').count(), 0);
        const result = await page.evaluate(() => currentProduct.compute(values));
        assert.ok(Math.abs(result.total - total) < 0.01, `${id}: total ${result.total}`);
        if (cost !== null) {
          assert.ok(Math.abs(result.cost - cost) < 0.01);
          assert.ok(Math.abs(result.roi - (total - cost) / cost) < 0.000001);
        } else {
          assert.equal(await page.locator('.kpi-row').count(), 0);
        }
        const original = await page.locator('.result-hero .value').innerText();
        const input = page.locator('#mainFields input').first();
        const field = await input.getAttribute('data-id');
        const value = await page.evaluate(id => values[id], field);
        await input.fill(String(value * 2));
        assert.equal(await page.evaluate(id => values[id], field), value * 2);
        assert.notEqual(await page.locator('.result-hero .value').innerText(), original);
        const hasAdvanced = await page.locator('#advToggle').count();
        if (hasAdvanced) {
          await page.locator('#advToggle').click();
          assert.ok(await page.locator('#advFields').isVisible());
        }
        await page.locator('.effect-head').first().click();
        assert.ok(await page.locator('.effect-body').first().isVisible());
        for (const bad of ['', '-1', 'abc', '12abc', '1e999']) {
          await input.fill(bad);
          assert.equal(await page.locator('[role="alert"]').count(), 1, `${id}: invalid ${bad}`);
          assert.equal(await page.locator('.result-hero').count(), 0);
        }
        await input.fill('1 234,5');
        assert.equal(await page.evaluate(id => values[id], field), 1234.5);
        assert.equal(await page.locator('[role="alert"]').count(), 0);
        await page.locator('.reset-btn').click();
        assert.equal(await page.locator('.result-hero .value').innerText(), original);
        if (hasAdvanced) {
          await page.locator('#advToggle').click();
          assert.ok(await page.locator('#advFields').isVisible());
        }
        await page.reload();
        assert.equal(await page.locator('h1').count(), 1);
        assert.ok(await page.locator('.source a').count()>0);
        const percentField = await page.evaluate(() => currentProduct.inputs.find(f=>f.percent)?.id);
        if (percentField) {
          const percentInput = page.locator(`#in_${percentField}`);
          if (!(await percentInput.isVisible())) await page.locator('#advToggle').click();
          await percentInput.fill('101');
          assert.equal(await page.locator('[role="alert"]').count(), 1);
          await page.locator('.reset-btn').click();
        }
        if (id === 'evp' || id === 'certification') {
          await page.locator('#in_programCost').fill('0');
          if (id === 'certification') await page.locator('#advToggle').click();
          await page.locator(id === 'evp' ? '#in_activationCost' : '#in_internalCost').fill('0');
          assert.equal(await page.locator('.roi .value').innerText(), '—');
          await page.locator('.reset-btn').click();
        }
        for (const width of [390, 320]) {
          await page.setViewportSize({ width, height: 844 });
          await page.evaluate(() => {
            document.querySelectorAll('.effect-card').forEach(card=>card.classList.add('open'));
            document.getElementById('advFields')?.classList.add('show');
          });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: overflow at ${width}`);
        }
        if (protocol === 'file') {
          await page.setViewportSize({ width: 390, height: 844 });
          await page.screenshot({ path: path.join(root, 'screenshots', `standalone-${id}.png`), fullPage: true });
        }
        assert.deepEqual(errors, []);
        assert.deepEqual(externalRequests, []);
        await page.close();
        console.log(`PASS ${protocol}: ${id} (direct open, model, edit/reset, disclosures, reload, mobile)`);
      }
    }
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(root, 'calculator.html')).href);
    await page.waitForURL('**/internship.html');
    console.log('PASS legacy calculator.html redirect');
    for (const url of [pathToFileURL(path.join(root, 'championship.html')).href,
      `http://127.0.0.1:${server.address().port}/championship.html`]) {
      await page.goto(url);
      await page.waitForURL('**/certification.html');
    }
    console.log('PASS former championship.html redirects to certification');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
