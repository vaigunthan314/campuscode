import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
import fs from 'fs';
const CHROMIUM = await pc.chromium.executablePath();
console.log('Using chromium:', CHROMIUM);
const b = await pc.chromium.launch({
  executablePath: CHROMIUM,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--no-first-run'],
  headless: true
});
const p = await b.newPage();
await p.setViewportSize({ width: 1366, height: 768 });
let consoleMsgs = [];
p.on('console', msg => { consoleMsgs.push(msg.type() + ': ' + msg.text()); });
let pageErrors = [];
p.on('pageerror', err => { pageErrors.push(err.message); });
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle', timeout: 55000 });
await p.waitForTimeout(6000);
const title = await p.title();
const html = await p.content();
const scrolly = await p.evaluate(() => document.documentElement.scrollHeight);
const bodyBg = await p.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
const rootBg = await p.evaluate(() => window.getComputedStyle(document.getElementById('root')).backgroundColor);
const cine = await p.evaluate(() => {
  const r = document.querySelector('.cine');
  if (!r) return 'NO-CINE';
  const cs = window.getComputedStyle(r);
  return { opacity: cs.opacity, vis: cs.visibility, disp: cs.display, bg: cs.backgroundColor, z: cs.zIndex, top: cs.top, left: cs.left, pos: cs.position, overflow: cs.overflow };
});
const loadingPrimer = await p.evaluate(() => {
  const lp = document.querySelector('.cine-primer');
  if (!lp) return 'NONE';
  const cs = window.getComputedStyle(lp);
  return { opacity: cs.opacity, disp: cs.display, bg: cs.backgroundColor, z: cs.zIndex };
});
const introLock = await p.evaluate(() => {
  const h = document.documentElement;
  return { hasLock: h.classList.contains('intro-lock'), scrollRestoration: h.style.scrollBehavior, scrollY: window.scrollY };
});
const nav = await p.evaluate(() => {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return 'NONE';
  const cs = window.getComputedStyle(nav);
  return { opacity: cs.opacity, vis: cs.visibility };
});
const hero = await p.evaluate(() => {
  const h = document.querySelector('.landing-hero');
  if (!h) return 'NONE';
  const cs = window.getComputedStyle(h);
  return { opacity: cs.opacity, bg: cs.backgroundColor, disp: cs.display };
});
const skipLink = await p.evaluate(() => {
  const s = document.querySelector('.skip-link');
  if (!s) return 'NONE';
  const cs = window.getComputedStyle(s);
  return { opacity: cs.opacity, vis: cs.visibility, disp: cs.display };
});
console.log('TITLE: ' + title);
console.log('HTML_LEN: ' + html.length);
console.log('SCROLL_H: ' + scrolly);
console.log('BODY_BG: ' + bodyBg);
console.log('ROOT_BG: ' + rootBg);
console.log('CINE: ' + JSON.stringify(cine));
console.log('LOADING_PRIMER: ' + JSON.stringify(loadingPrimer));
console.log('INTRO_LOCK: ' + JSON.stringify(introLock));
console.log('NAV: ' + JSON.stringify(nav));
console.log('HERO: ' + JSON.stringify(hero));
console.log('SKIP_LINK: ' + JSON.stringify(skipLink));
console.log('CONSOLE_MSGS_COUNT: ' + consoleMsgs.length + (consoleMsgs.length ? ' :: ' + JSON.stringify(consoleMsgs.slice(0,40)) : ''));
console.log('PAGE_ERRORS_COUNT: ' + pageErrors.length + (pageErrors.length ? ' :: ' + JSON.stringify(pageErrors.slice(0,40)) : ''));
const shot = await p.screenshot({ fullPage: false });
fs.writeFileSync('/tmp/campus-shot-final.png', shot);
console.log('SHOT_BYTES: ' + shot.length);
await b.close();
