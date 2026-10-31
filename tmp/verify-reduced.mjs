import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu","--no-first-run"], headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = []; page.on("pageerror", e => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-glass-verify/reduced-motion-top.png" });
const info = await page.evaluate(() => {
  const el = document.querySelector(".hero-glass-scene");
  const r = el?.getBoundingClientRect();
  return { canvas: !!el?.querySelector("canvas"), fallback: !!document.querySelector(".hero-glass-fallback"), rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null, primerOpacity: getComputedStyle(document.querySelector(".cine-primer")).opacity, reducedClass: document.querySelector(".cine")?.className, lock: document.documentElement.classList.contains("intro-lock"), scrollY: window.scrollY };
});
console.log("REDUCED-TOP", JSON.stringify(info), "ERRORS", JSON.stringify(errors));
await browser.close();
