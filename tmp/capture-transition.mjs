import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const OUT = "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-restored";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu","--no-first-run"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
for (const p of [0.68, 0.74, 0.8]) {
  await page.evaluate(v => window.scrollTo(0, window.innerHeight * 5 * v), p);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/transition-${p}.png` });
}
await browser.close();
