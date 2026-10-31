const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE_ERROR: ' + m.text()); });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(5500);
  for (let i = 1; i <= 26; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      primer: !!document.querySelector('.cine-primer-shell'),
      active: [...document.querySelectorAll('section[id]')]
        .filter((s) => { const r = s.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })
        .map((s) => s.id),
    }));
    if (i >= 4 && i <= 16) await page.screenshot({ path: `/tmp/s${String(i).padStart(2, '0')}.png` });
    console.log('S' + i, JSON.stringify(info));
    if (i === 20) await page.screenshot({ path: '/tmp/s20.png' });
    if (i === 24) await page.screenshot({ path: '/tmp/s24.png' });
  }
  const mission = await page.evaluate(() => {
    const m = document.getElementById('mission');
    const c = m?.querySelector('canvas');
    const r = c?.getBoundingClientRect();
    return { exists: !!m, canvas: c ? `${Math.round(r.width)}x${Math.round(r.height)}` : null, text: (m?.innerText || '').slice(0, 120).replace(/\s+/g, ' ') };
  });
  console.log('MISSION', JSON.stringify(mission));
  console.log('PROBLEMS', JSON.stringify(problems.slice(0, 10)));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAIL', e && e.message); process.exit(1); });
