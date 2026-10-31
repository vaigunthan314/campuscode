const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text()); });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({ primer: !!document.querySelector('.cine-primer-shell'), locked: document.documentElement.classList.contains('intro-lock'), y: Math.round(scrollY) }));
  await page.focus('a.skip-link');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2600);
  const after = await page.evaluate(() => ({
    primer: !!document.querySelector('.cine-primer-shell'),
    locked: document.documentElement.classList.contains('intro-lock'),
    y: Math.round(scrollY),
    entered: !!document.querySelector('.cine.is-entered'),
    aboutTop: Math.round(document.getElementById('about-stage')?.getBoundingClientRect().top ?? -1),
    bodyText: (document.body.innerText || '').slice(0, 90).replace(/\s+/g, ' '),
  }));
  await page.screenshot({ path: '/tmp/skip-after.png' });
  console.log('BEFORE_SKIP', JSON.stringify(before));
  console.log('AFTER_SKIP', JSON.stringify(after));
  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 8)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
