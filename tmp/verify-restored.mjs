import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const OUT = "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-restored";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu","--no-first-run"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on("pageerror", e => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, window.innerHeight * 5 * 0.38); });
await page.waitForTimeout(2000);

// Hero to About transition via nav.
await page.click('.landing-links button:has-text("ABOUT")');
await page.waitForTimeout(2600);
await page.screenshot({ path: `${OUT}/transition-about.png` });
const aboutState = await page.evaluate(() => {
  const el = document.querySelector("#about");
  const r = el?.getBoundingClientRect();
  return { rect: r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) } : null, text: el?.textContent?.slice(0, 60).replace(/\s+/g," ").trim() ?? null, scrollY: Math.round(window.scrollY) };
});

// How it works book.
await page.click('.landing-links button:has-text("HOW IT WORKS")');
await page.waitForTimeout(2600);
const howBefore = await page.evaluate(() => ({ top: Math.round(document.querySelector("#howitworks").getBoundingClientRect().top), count: document.querySelector(".book-count")?.textContent }));
await page.click('button[aria-label="Next page"]');
await page.waitForTimeout(1700);
const howAfter = await page.evaluate(() => ({ count: document.querySelector(".book-count")?.textContent, sr: document.querySelector(".book-sr")?.textContent?.slice(0,80) }));
await page.screenshot({ path: `${OUT}/book-turned.png` });
await page.click('button[aria-label="Previous page"]');
await page.waitForTimeout(1600);
const howBack = await page.evaluate(() => ({ count: document.querySelector(".book-count")?.textContent }));

// Arena.
await page.click('.landing-links button:has-text("HACKATHONS")');
await page.waitForTimeout(2800);
const arenaBefore = await page.evaluate(() => ({ top: Math.round(document.querySelector("#hackathons").getBoundingClientRect().top), expanded: document.querySelector("#hackathons").dataset.expanded, pressed: [...document.querySelectorAll(".arena-card")].map(b=>b.getAttribute("aria-pressed")) }));
await page.click('.arena-card');
await page.waitForTimeout(1500);
const arenaAfter = await page.evaluate(() => ({ expanded: document.querySelector("#hackathons").dataset.expanded, pressed: [...document.querySelectorAll(".arena-card")].map(b=>b.getAttribute("aria-pressed")), sr: document.querySelector(".arena-sr")?.textContent }));
await page.screenshot({ path: `${OUT}/arena-open.png` });
await page.click('.arena-card');
await page.waitForTimeout(1200);
const arenaClose = await page.evaluate(() => ({ expanded: document.querySelector("#hackathons").dataset.expanded }));

// Mission + footer.
await page.evaluate(() => { const el = document.querySelector("#mission"); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); });
await page.waitForTimeout(2200);
const mission = await page.evaluate(() => {
  const el = document.querySelector("#mission");
  const canvases = [...el.querySelectorAll("canvas")].map(c => ({ w: c.width, h: c.height, cssW: Math.round(c.getBoundingClientRect().width) }));
  return { top: Math.round(el.getBoundingClientRect().top), canvases };
});
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/footer.png` });
const footer = await page.evaluate(() => ({ footerText: document.querySelector("footer")?.textContent?.slice(0,80).replace(/\s+/g," ").trim() ?? null }));

console.log(JSON.stringify({ aboutState, howBefore, howAfter, howBack, arenaBefore, arenaAfter, arenaClose, mission, footer, errors }, null, 2));
await browser.close();
