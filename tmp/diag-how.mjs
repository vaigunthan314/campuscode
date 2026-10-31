import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox", "--disable-gpu"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const el = document.getElementById("howitworks"); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); });
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const style = (s) => { const el = q(s); if (!el) return null; const c = getComputedStyle(el); const r = el.getBoundingClientRect(); return { display: c.display, opacity: c.opacity, visibility: c.visibility, transform: c.transform, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), color: c.color, z: c.zIndex }; };
  const canvas = q(".book-canvas-host canvas");
  return {
    scrollY: window.scrollY,
    section: style("#howitworks"),
    headline: style(".how-headline"),
    bookStage: style(".book-stage"),
    canvasHost: style(".book-canvas-host"),
    canvas: canvas ? { w: canvas.width, h: canvas.height, rect: canvas.getBoundingClientRect().toJSON() } : null,
    overlay: style(".book-overlay"),
    caption: style(".book-caption"),
    captionText: q(".book-caption")?.textContent,
    stageHTML: q(".book-stage")?.innerHTML.slice(0, 300),
    patterns: [...document.querySelectorAll(".landing-how")].map(e => e.className),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/diag-how.png" });
await browser.close();
