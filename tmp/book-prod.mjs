const { chromium } = await import('playwright-core');
const indexHtml = await import('fs').then(f => f.promises.readFile('dist/index.html', 'utf8'));
const base = new URL('./dist/', `file://${process.cwd()}/`).href;
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-swiftshader']
});
let exit = 0;
try {
  const page = await (await browser.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()); });
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const title = await page.title();
  const text = await page.evaluate(() => document.documentElement.innerText);
  const hasBook = await page.evaluate(() => !!document.querySelector('.book-scene-wrapper'));
  console.log('PROD base=' + base);
  console.log('PROD title=' + title);
  console.log('PROD texts=' + (text.includes('DISCOVER') && text.includes('TEAM UP') && text.includes('BUILD') && text.includes('SHIP') ? 'ok' : 'missing') + ' | SCROLL_TO_OPEN=' + text.includes('SCROLL TO OPEN'));
  console.log('PROD book-wrapper=' + hasBook);
  console.log('PROD errors=' + (errors.length ? errors.slice(0,5).join('\n') : 'none'));
  if (!text.includes('DISCOVER') || !text.includes('TEAM UP') || !text.includes('BUILD') || !text.includes('SHIP')) exit = 1;
  if (errors.length) exit = 1;
  await page.screenshot({ path: 'tmp/verify-book-prod.png', fullPage: false });
} finally {
  await browser.close();
}
console.log('exit=' + exit);
process.exit(exit);
