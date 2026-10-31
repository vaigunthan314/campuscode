import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', msg => {
  const txt = msg.text();
  if (msg.type() === 'error' || txt.includes('Error') || txt.includes('Failed') || txt.includes('could not') || txt.includes('null') ) {
    console.log('CONSOLE[' + msg.type() + ']:', txt);
  }
});
page.on('pageerror', err => {
  console.log('PAGEERROR:', err.message);
});

await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(6000);

const title = await page.title();
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const htmlBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const innerText = await page.evaluate(() => document.body.innerText);
const visibleElements = await page.evaluate(() => {
  const results = [];
  document.querySelectorAll('*').forEach(el => {
    const style = getComputedStyle(el);
    if (el.offsetWidth > 0 || el.offsetHeight > 0) {
      results.push({
        tag: el.tagName,
        className: style.className || '',
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        width: el.offsetWidth,
        height: el.offsetHeight,
        bg: style.backgroundColor,
      });
    }
  });
  return results;
});

console.log('TITLE:', title);
console.log('BODY_BG:', bodyBg);
console.log('HTML_BG:', htmlBg);
console.log('INNER_TEXT (first 800 chars):', innerText.slice(0, 800));

console.log('\n=== VISIBLE ELEMENTS (first 30) ===');
visibleElements.slice(0, 30).forEach(e => {
  console.log(e.tag, e.className, 'op=' + e.opacity, 'disp=' + e.display, 'vis=' + e.visibility, 'w=' + e.width, 'h=' + e.height, 'bg=' + e.bg);
});

await page.screenshot({ path: '/tmp/blackscreen-debug.png', fullPage: true });
console.log('\nSCREENSHOT SAVED');

await browser.close();
