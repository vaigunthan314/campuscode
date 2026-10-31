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
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2800);

  const read = () => page.evaluate(() => {
    const s = document.getElementById('mission');
    const sr = s.getBoundingClientRect();
    const frame = s.querySelector('.mission-frame');
    const fr = frame.getBoundingClientRect();
    const c = s.querySelector('canvas');
    const cr = c.getBoundingClientRect();
    const cs = getComputedStyle(frame);
    const op = (sel) => Number(getComputedStyle(s.querySelector(sel)).opacity).toFixed(2);
    return {
      section: `${Math.round(sr.width)}x${Math.round(sr.height)}`,
      frame: `${Math.round(fr.width)}x${Math.round(fr.height)}`,
      canvas: `${Math.round(cr.width)}x${Math.round(cr.height)}`,
      insideSection: cr.top >= sr.top - 1 && cr.bottom <= sr.bottom + 1 && cr.left >= sr.left - 1 && cr.right <= sr.right + 1,
      border: cs.borderTopWidth + ' ' + cs.borderTopStyle,
      background: cs.backgroundColor,
      filter: cs.filter,
      opacity: { label: op('.mission-label'), title: op('.mission-title'), statement: op('.mission-statement'), tagline: op('.mission-tagline') },
      videos: document.querySelectorAll('video').length,
      iframes: document.querySelectorAll('iframe').length,
      meta: !!s.querySelector('.mission-visual__meta'),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      sections: [...document.querySelectorAll('section[id]')].map((x) => x.id),
    };
  });

  const inView = await read();
  console.log('DESKTOP_IN_VIEW', JSON.stringify(inView));

  const box = await page.evaluate(() => {
    const r = document.getElementById('mission').getBoundingClientRect();
    return { x: 0, y: Math.max(0, Math.round(r.top)), width: 1440, height: Math.min(Math.round(r.height), 900 - Math.max(0, Math.round(r.top))) };
  });
  await page.screenshot({ path: '/tmp/sculpt-desktop.png', clip: box });

  await page.mouse.wheel(0, -3400);
  await page.waitForTimeout(1200);
  const out = await read();
  console.log('DESKTOP_OUT', JSON.stringify({ opacity: out.opacity, filter: out.filter }));

  await page.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2200);
  const back = await read();
  console.log('DESKTOP_REENTER', JSON.stringify({ opacity: back.opacity, filter: back.filter }));

  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mob.on('pageerror', (e) => problems.push('MOBILE_PAGEERROR: ' + e.message));
  await mob.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await mob.waitForTimeout(1200);
  await mob.focus('a.skip-link');
  await mob.keyboard.press('Enter');
  await mob.waitForTimeout(1600);
  await mob.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'start' }));
  await mob.waitForTimeout(2400);
  const minfo = await mob.evaluate(() => {
    const s = document.getElementById('mission');
    const sr = s.getBoundingClientRect();
    const c = s.querySelector('canvas').getBoundingClientRect();
    return {
      sectionH: Math.round(sr.height),
      canvas: `${Math.round(c.width)}x${Math.round(c.height)}`,
      inside: c.left >= sr.left - 1 && c.right <= sr.right + 1,
      videos: document.querySelectorAll('video').length,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      opacity: Number(getComputedStyle(s.querySelector('.mission-title')).opacity).toFixed(2),
    };
  });
  console.log('MOBILE', JSON.stringify(minfo));
  await mob.screenshot({ path: '/tmp/sculpt-mobile.png' });

  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 8)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
