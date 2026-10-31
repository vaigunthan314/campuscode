const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text().slice(0, 120)); });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.focus('a.skip-link');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  const order = [];
  for (let i = 0; i < 22; i += 1) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(450);
    const active = await page.evaluate(() => [...document.querySelectorAll('section[id]')]
      .filter((s) => { const r = s.getBoundingClientRect(); return r.bottom > 100 && r.top < innerHeight - 100; })
      .map((s) => s.id));
    active.forEach((id) => { if (!order.includes(id)) order.push(id); });
  }

  const counts = await page.evaluate(() => {
    const mission = document.getElementById('mission');
    return {
      missionSections: document.querySelectorAll('#mission').length,
      missionCanvases: mission ? mission.querySelectorAll('canvas').length : 0,
      bookButtons: document.querySelectorAll('button[aria-label="Next page"]').length,
      arenaCards: document.querySelectorAll('.arena-card').length,
      smoke: !!document.querySelector('canvas.arena-smoke'),
      hero: !!document.querySelector('.hero-window'),
      howitworks: !!document.getElementById('howitworks'),
      community: !!document.getElementById('community'),
      join: !!document.getElementById('joincampuscode'),
      footer: !!document.getElementById('footer'),
    };
  });

  // Book + arena still interactive.
  await page.evaluate(() => document.getElementById('howitworks')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(900);
  const bookBefore = await page.evaluate(() => document.querySelector('.book-count')?.textContent);
  await page.click('button[aria-label="Next page"]', { timeout: 4000 }).catch((e) => problems.push('BOOK: ' + e.message));
  await page.waitForTimeout(1100);
  const bookAfter = await page.evaluate(() => document.querySelector('.book-count')?.textContent);

  await page.evaluate(() => document.getElementById('hackathons')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelectorAll('.arena-card')[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(900);
  const arena = await page.evaluate(() => ({
    expanded: document.querySelector('.arena')?.getAttribute('data-expanded'),
    pressed: [...document.querySelectorAll('.arena-card')].map((c) => c.getAttribute('aria-pressed')),
  }));

  console.log('ORDER', JSON.stringify(order));
  console.log('COUNTS', JSON.stringify(counts));
  console.log('BOOK', JSON.stringify({ bookBefore, bookAfter }));
  console.log('ARENA', JSON.stringify(arena));
  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 8)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
