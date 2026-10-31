import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const OUT = "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-restored";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu","--no-first-run"], headless: true });

async function load(page) {
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(6500);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
}

// Desktop: natural transition to About, mission 3D.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await load(page);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5 * 0.62));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/about-reveal.png` });
  const about = await page.evaluate(() => {
    const el = document.querySelector(".landing-about");
    const r = el?.getBoundingClientRect();
    return { id: el?.id, class: el?.className, rect: r ? { top: Math.round(r.top), h: Math.round(r.height) } : null, headline: el?.querySelector(".about-headline")?.textContent?.replace(/\s+/g," ").trim(), scrollY: Math.round(window.scrollY) };
  });
  const missionTop = await page.evaluate(() => { const el = document.querySelector("#mission"); return el.getBoundingClientRect().top + window.scrollY; });
  await page.evaluate((top) => window.scrollTo(0, top + window.innerHeight * 0.55), missionTop);
  await page.waitForTimeout(2800);
  await page.screenshot({ path: `${OUT}/mission-3d.png` });
  const mission = await page.evaluate(() => {
    const el = document.querySelector("#mission");
    const canvases = [...document.querySelectorAll(".mission-scene canvas")].map(c => ({ w: c.width, h: c.height, cssW: Math.round(c.getBoundingClientRect().width), cssH: Math.round(c.getBoundingClientRect().height) }));
    return { scenePresent: !!document.querySelector(".mission-scene"), canvases, stage: document.querySelector(".mission-scene")?.textContent?.slice(0,60).replace(/\s+/g," ").trim() };
  });
  console.log("DESKTOP", JSON.stringify({ about, mission, errors }));
  await page.close();
}

// Mobile.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await load(page);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5 * 0.38));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/mobile-hero.png` });
  const info = await page.evaluate(() => ({ title: document.querySelector(".hero-content h1")?.getAttribute("aria-label"), canvas: !!document.querySelector(".hero-object canvas"), glass: !!document.querySelector(".hero-glass-scene") }));
  console.log("MOBILE", JSON.stringify(info), "ERRORS", JSON.stringify(errors));
  await page.close();
}

// Reduced motion.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(7000);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/reduced-hero.png` });
  const info = await page.evaluate(() => ({ title: document.querySelector(".hero-content h1")?.getAttribute("aria-label"), canvas: !!document.querySelector(".hero-object canvas"), reduced: matchMedia("(prefers-reduced-motion: reduce)").matches }));
  console.log("REDUCED", JSON.stringify(info), "ERRORS", JSON.stringify(errors));
  await context.close();
}

await browser.close();
