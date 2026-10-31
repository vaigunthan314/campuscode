const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text()); });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const first = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    primer: !!document.querySelector('.cine-primer-shell'),
    tag: document.querySelector('.cine-primer-tag')?.textContent || null,
    rootChildren: document.getElementById('root')?.childElementCount ?? 0,
  }));
  console.log('BOOT', JSON.stringify(first));

  await page.waitForTimeout(6000);
  await page.screenshot({ path: '/tmp/v01-boot.png' });
  const afterLoad = await page.evaluate(() => ({
    primer: !!document.querySelector('.cine-primer-shell'),
    tag: document.querySelector('.cine-primer-tag')?.textContent || null,
    blackoutOpacity: (() => { const e = document.querySelector('.cine-blackout'); return e ? getComputedStyle(e).opacity : null; })(),
    bodyText: (document.body.innerText || '').slice(0, 160).replace(/\s+/g, ' '),
  }));
  console.log('AFTER_LOAD', JSON.stringify(afterLoad));

  const steps = [400, 400, 400, 400, 500, 500, 500, 600, 600, 600, 600, 600];
  let i = 0;
  for (const dy of steps) {
    i += 1;
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(900);
    if ([1, 2, 3, 5, 8, 10, 12].includes(i)) {
      await page.screenshot({ path: `/tmp/v${String(i).padStart(2, '0')}-step.png` });
      const info = await page.evaluate(() => ({
        scrollY: Math.round(window.scrollY),
        primerGone: !document.querySelector('.cine-primer-shell'),
        active: [...document.querySelectorAll('section[id]')]
          .filter((s) => { const r = s.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })
          .map((s) => s.id),
        canvasSizes: [...document.querySelectorAll('canvas')].map((c) => `${c.clientWidth}x${c.clientHeight}`),
      }));
      console.log('STEP' + i, JSON.stringify(info));
    }
  }

  // Skip-intro path: reload and use the skip link.
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('a.skip-link')?.click());
  await page.waitForTimeout(1500);
  const skip = await page.evaluate(() => ({ scrollY: Math.round(window.scrollY), primerGone: !document.querySelector('.cine-primer-shell') }));
  console.log('SKIP_LINK', JSON.stringify(skip));
  await page.screenshot({ path: '/tmp/vskip.png' });

  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 12)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
