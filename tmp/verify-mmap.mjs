const { chromium } = await import('playwright-core');
const ROOT = '/Users/vaigunthansl/Desktop/Rebuild /';
const out = [];
function log(m) { out.push(m); }
let exit = 0;
async function run() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15' });
  const dev = await ctx.newPage();
  const prod = await ctx.newPage();
  try {
    // Dev
    await dev.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
    await dev.waitForTimeout(100);
    const devReady = await dev.evaluate(() => document.readyState === 'complete');
    log('DEV ready=' + devReady);
    const devTitle = await dev.title();
    log('DEV title=' + devTitle);
    const devText = await dev.evaluate(() => document.documentElement.innerText);
    if (!devText.includes('CampusCode')) { log('DEV missing CampusCode'); exit = 1; }
    if (!devText.includes('How It Works')) { log('DEV missing How It Works'); exit = 1; }
    if (!devText.includes('DISCOVER')) { log('DEV missing DISCOVER'); exit = 1; }
    if (!devText.includes('TEAM UP')) { log('DEV missing TEAM UP'); exit = 1; }
    if (!devText.includes('BUILD')) { log('DEV missing BUILD'); exit = 1; }
    if (!devText.includes('SHIP')) { log('DEV missing SHIP'); exit = 1; }
    if (!devText.includes('SCROLL TO OPEN')) { log('DEV missing SCROLL TO OPEN'); exit = 1; }
    const devHero = await dev.evaluate(() => document.querySelector('.hero-window') ? 'present' : 'missing');
    log('DEV hero-window=' + devHero);
    if (devHero === 'missing') { log('DEV hero-window missing'); exit = 1; }
    dev.setDefaultNavigationTimeout(20000);
    const devPolicies = await dev.evaluate(() => {
      const p = navigator.connection ? navigator.connection.saveData : null;
      return { saveData: p, prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches, fonts: document.fonts.status };
    });
    log('DEV prefs=' + JSON.stringify(devPolicies));
    await dev.screenshot({ path: ROOT + 'tmp/tmp-verify-dev.png', fullPage: false });
    log('DEV screenshot taken');

    // Prod
    await prod.goto('file://' + ROOT + 'dist/index.html', { waitUntil: 'domcontentloaded' });
    await prod.waitForTimeout(100);
    const prodReady = await prod.evaluate(() => document.readyState === 'complete');
    log('PROD ready=' + prodReady);
    const prodTitle = await prod.title();
    log('PROD title=' + prodTitle);
    const prodText = await prod.evaluate(() => document.documentElement.innerText);
    if (!prodText.includes('CampusCode')) { log('PROD missing CampusCode'); exit = 1; }
    if (!prodText.includes('How It Works')) { log('PROD missing How It Works'); exit = 1; }
    if (!prodText.includes('DISCOVER')) { log('PROD missing DISCOVER'); exit = 1; }
    if (!prodText.includes('TEAM UP')) { log('PROD missing TEAM UP'); exit = 1; }
    if (!prodText.includes('BUILD')) { log('PROD missing BUILD'); exit = 1; }
    if (!prodText.includes('SHIP')) { log('PROD missing SHIP'); exit = 1; }
    if (!prodText.includes('SCROLL TO OPEN')) { log('PROD missing SCROLL TO OPEN'); exit = 1; }
    const prodHero = await prod.evaluate(() => document.querySelector('.hero-window') ? 'present' : 'missing');
    log('PROD hero-window=' + prodHero);
    if (prodHero === 'missing') { log('PROD hero-window missing'); exit = 1; }
    prod.setDefaultNavigationTimeout(20000);
    const prodPolicies = await prod.evaluate(() => {
      const p = navigator.connection ? navigator.connection.saveData : null;
      return { saveData: p, prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches, fonts: document.fonts.status };
    });
    log('PROD prefs=' + JSON.stringify(prodPolicies));
    await prod.screenshot({ path: ROOT + 'tmp/tmp-verify-prod.png', fullPage: false });
    log('PROD screenshot taken');
  } finally {
    await browser.close();
  }
  log('---');
  log('exit=' + exit);
  console.log(out.join('\n'));
  process.exit(exit);
}
run().catch(e => { console.error(e); process.exit(2); });
