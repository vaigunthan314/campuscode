const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text().slice(0, 140)); });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.focus('a.skip-link');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2200);

  const goto = async (id) => {
    await page.evaluate((target) => {
      const a = document.querySelector(`a[href="#${target}"]`);
      if (a) a.click(); else location.hash = target;
    }, id);
    await page.waitForTimeout(1800);
  };

  // --- HOW IT WORKS (book) ---
  await goto('howitworks');
  const bookBefore = await page.evaluate(() => ({
    count: document.querySelector('.book-count')?.textContent ?? null,
    nextDisabled: document.querySelector('button[aria-label="Next page"]')?.disabled ?? null,
  }));
  await page.click('button[aria-label="Next page"]', { timeout: 4000 }).catch((e) => problems.push('BOOK_CLICK: ' + e.message));
  await page.waitForTimeout(1400);
  const bookAfter = await page.evaluate(() => ({
    count: document.querySelector('.book-count')?.textContent ?? null,
    prevDisabled: document.querySelector('button[aria-label="Previous page"]')?.disabled ?? null,
  }));
  console.log('BOOK', JSON.stringify({ before: bookBefore, after: bookAfter }));
  await page.screenshot({ path: '/tmp/f-book.png' });

  // --- ARENA (three cards + smoke) ---
  await goto('hackathons');
  const arena = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.arena-card')];
    const smoke = document.querySelector('canvas.arena-smoke');
    return {
      cards: cards.length,
      visible: cards.filter((c) => { const r = c.getBoundingClientRect(); return r.width > 40 && r.height > 40; }).length,
      smoke: smoke ? `${Math.round(smoke.getBoundingClientRect().width)}x${Math.round(smoke.getBoundingClientRect().height)}` : null,
      expanded: document.querySelector('.arena')?.getAttribute('data-expanded'),
    };
  });
  await page.evaluate(() => document.querySelectorAll('.arena-card')[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(1200);
  const arenaAfter = await page.evaluate(() => ({
    expanded: document.querySelector('.arena')?.getAttribute('data-expanded'),
    pressed: [...document.querySelectorAll('.arena-card')].map((c) => c.getAttribute('aria-pressed')),
  }));
  console.log('ARENA', JSON.stringify({ arena, after: arenaAfter }));
  await page.screenshot({ path: '/tmp/f-arena.png' });

  // --- MISSION (gateway canvas + overlay check) ---
  await goto('mission');
  const mission = await page.evaluate(() => {
    const m = document.getElementById('mission');
    const canvas = m?.querySelector('canvas');
    const r = canvas?.getBoundingClientRect();
    const topElements = [[720, 80], [720, 450], [200, 450], [1200, 780]].map(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el ? (el.className || el.tagName).toString().slice(0, 40) : 'none';
    });
    const fixed = [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.position === 'fixed' && Number(cs.opacity) > 0.05 && el.getBoundingClientRect().width > innerWidth * 0.9;
    }).map((el) => (el.className || el.tagName).toString().slice(0, 40));
    return { canvas: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : null, topElements, fixedOverlays: fixed.slice(0, 5), missionTop: Math.round(m.getBoundingClientRect().top) };
  });
  console.log('MISSION', JSON.stringify(mission));
  await page.screenshot({ path: '/tmp/f-mission.png' });

  // --- MOBILE ---
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mob.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await mob.waitForTimeout(1200);
  await mob.focus('a.skip-link');
  await mob.keyboard.press('Enter');
  await mob.waitForTimeout(2500);
  const mobile = await mob.evaluate(() => ({
    y: Math.round(scrollY),
    primerGone: !document.querySelector('.cine-primer-shell'),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    visibleText: (document.body.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
  }));
  console.log('MOBILE', JSON.stringify(mobile));
  await mob.screenshot({ path: '/tmp/f-mobile.png' });

  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 10)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
