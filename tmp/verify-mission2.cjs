const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const problems = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text().slice(0, 120)); });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.focus('a.skip-link');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);

  await page.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'center', behavior: 'auto' }));
  await page.waitForTimeout(2600);

  const read = () => page.evaluate(() => {
    const s = document.getElementById('mission');
    const sr = s.getBoundingClientRect();
    const frame = s.querySelector('.mission-frame');
    const fr = frame.getBoundingClientRect();
    const c = s.querySelector('canvas');
    const cr = c.getBoundingClientRect();
    const op = (sel) => Number(getComputedStyle(s.querySelector(sel)).opacity).toFixed(2);
    return {
      top: Math.round(sr.top),
      sectionH: Math.round(sr.height),
      frame: `${Math.round(fr.width)}x${Math.round(fr.height)}`,
      canvas: `${Math.round(cr.width)}x${Math.round(cr.height)}`,
      insideSection: cr.top >= sr.top - 1 && cr.bottom <= sr.bottom + 1 && cr.left >= sr.left - 1 && cr.right <= sr.right + 1,
      filter: getComputedStyle(frame).filter,
      opacity: { label: op('.mission-label'), title: op('.mission-title'), statement: op('.mission-statement'), tagline: op('.mission-tagline') },
      labelColor: getComputedStyle(s.querySelector('.mission-label')).color,
      statementColor: getComputedStyle(s.querySelector('.mission-statement')).color,
      fontPx: getComputedStyle(s.querySelector('.mission-title')).fontSize,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  const inView = await read();
  console.log('DESKTOP_IN_VIEW', JSON.stringify(inView));

  const box = await page.evaluate(() => {
    const s = document.getElementById('mission');
    const r = s.getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), width: Math.round(r.width), height: Math.min(Math.round(r.height), 900 - Math.max(0, Math.round(r.top))) };
  });
  await page.screenshot({ path: '/tmp/mission-desktop.png', clip: box });

  // Reverse check: scroll up so the section leaves the viewport, then confirm it resets.
  await page.mouse.wheel(0, -3200);
  await page.waitForTimeout(1300);
  const out = await read();
  console.log('DESKTOP_OUT', JSON.stringify({ top: out.top, opacity: out.opacity, filter: out.filter }));

  // Re-enter to confirm it plays again.
  await page.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'center', behavior: 'auto' }));
  await page.waitForTimeout(2200);
  const again = await read();
  console.log('DESKTOP_REENTER', JSON.stringify({ opacity: again.opacity, filter: again.filter }));

  // Mobile capture.
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mob.on('pageerror', (e) => problems.push('MOBILE_PAGEERROR: ' + e.message));
  await mob.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await mob.waitForTimeout(1200);
  await mob.focus('a.skip-link');
  await mob.keyboard.press('Enter');
  await mob.waitForTimeout(1600);
  await mob.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  await mob.waitForTimeout(2400);
  const mbox = await mob.evaluate(() => {
    const s = document.getElementById('mission');
    const r = s.getBoundingClientRect();
    return { x: 0, y: Math.max(0, Math.round(r.top)), width: 390, height: Math.min(Math.round(r.height), 844 - Math.max(0, Math.round(r.top))) };
  });
  await mob.screenshot({ path: '/tmp/mission-mobile.png', clip: mbox });
  console.log('MOBILE_BOX', JSON.stringify(mbox));

  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 8)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
