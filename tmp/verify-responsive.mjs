import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu","--no-first-run"], headless: true });
for (const [name, width, height] of [["mobile", 390, 844], ["mobile-small", 360, 640], ["tablet", 820, 1180], ["tablet-land", 1024, 768]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(6500);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, window.innerHeight * 5 * 0.46); });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-glass-verify/${name}.png` });
  const info = await page.evaluate(() => { const el = document.querySelector(".hero-glass-scene"); const r = el?.getBoundingClientRect(); return r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) } : null; });
  console.log(name, JSON.stringify(info), "ERRORS", JSON.stringify(errors));
  await context.close();
}
await browser.close();
