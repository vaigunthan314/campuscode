const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.focus('a.skip-link'); await p.keyboard.press('Enter'); await p.waitForTimeout(2000);
  const state = await p.evaluate(() => ({
    hero: !!document.querySelector('.hero-window'),
    heroText: (document.querySelector('h1')?.innerText || '').slice(0, 40).replace(/\s+/g, ' '),
    primer: !!document.querySelector('.cine-primer-shell'),
    sections: [...document.querySelectorAll('section[id]')].map((s) => s.id),
    canvases: document.querySelectorAll('canvas').length,
  }));
  await p.screenshot({ path: '/tmp/final-hero.png' });
  console.log('STATE', JSON.stringify(state));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
