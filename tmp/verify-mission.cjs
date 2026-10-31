const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text().slice(0, 120)); });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.focus('a.skip-link');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  await page.evaluate(() => document.querySelector('a[href="#mission"]')?.click());
  await page.waitForTimeout(1600);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(2200);

  const state = await page.evaluate(() => {
    const section = document.getElementById('mission');
    const frame = section?.querySelector('.mission-frame');
    const canvas = section?.querySelector('canvas');
    const sr = section.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();
    const op = (sel) => {
      const el = section.querySelector(sel);
      return el ? Number(getComputedStyle(el).opacity).toFixed(2) : null;
    };
    return {
      section: { w: Math.round(sr.width), h: Math.round(sr.height), top: Math.round(sr.top) },
      frame: { w: Math.round(fr.width), h: Math.round(fr.height) },
      canvas: { w: Math.round(cr.width), h: Math.round(cr.height) },
      canvasInsideSection: cr.top >= sr.top - 1 && cr.bottom <= sr.bottom + 1 && cr.width <= sr.width + 1,
      frameFilter: getComputedStyle(frame).filter,
      bg: getComputedStyle(section).backgroundColor,
      opacity: { label: op('.mission-label'), title: op('.mission-title'), statement: op('.mission-statement'), tagline: op('.mission-tagline') },
      title: section.querySelector('.mission-title')?.textContent,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      canvases: document.querySelectorAll('canvas').length,
      sections: [...document.querySelectorAll('section[id]')].map((s) => s.id),
    };
  });
  console.log('MISSION_DESKTOP', JSON.stringify(state));
  await page.screenshot({ path: '/tmp/m-desktop.png' });

  // Reverse: scroll up out of the section and confirm the copy fades back out.
  await page.mouse.wheel(0, -2600);
  await page.waitForTimeout(1200);
  const reversed = await page.evaluate(() => {
    const s = document.getElementById('mission');
    const op = (sel) => Number(getComputedStyle(s.querySelector(sel)).opacity).toFixed(2);
    return { label: op('.mission-label'), title: op('.mission-title'), frameFilter: getComputedStyle(s.querySelector('.mission-frame')).filter };
  });
  console.log('REVERSED', JSON.stringify(reversed));

  // Mobile
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mob.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await mob.waitForTimeout(1200);
  await mob.focus('a.skip-link');
  await mob.keyboard.press('Enter');
  await mob.waitForTimeout(1800);
  await mob.evaluate(() => document.getElementById('mission')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  await mob.waitForTimeout(2200);
  const mobile = await mob.evaluate(() => {
    const s = document.getElementById('mission');
    const sr = s.getBoundingClientRect();
    const canvas = s.querySelector('canvas');
    const cr = canvas.getBoundingClientRect();
    const ed = s.querySelector('.mission-editorial').getBoundingClientRect();
    const fr = s.querySelector('.mission-frame').getBoundingClientRect();
    return {
      sectionH: Math.round(sr.height),
      canvas: `${Math.round(cr.width)}x${Math.round(cr.height)}`,
      inside: cr.left >= sr.left - 1 && cr.right <= sr.right + 1,
      stacked: ed.bottom <= fr.top + 1,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      opacity: Number(getComputedStyle(s.querySelector('.mission-title')).opacity).toFixed(2),
    };
  });
  console.log('MISSION_MOBILE', JSON.stringify(mobile));
  await mob.screenshot({ path: '/tmp/m-mobile.png' });

  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 8)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
