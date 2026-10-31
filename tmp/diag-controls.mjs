import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const b = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu"], headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(6500);
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const el = document.getElementById("howitworks"); scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const out = {};
  for (const sel of [".book-controls",".book-caption",".book-hint",".book-count",".book-overlay"]) {
    const el = document.querySelector(sel); const r = el.getBoundingClientRect();
    out[sel] = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
  }
  return out;
}));
await p.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/diag-bottom.png", clip: { x: 400, y: 740, width: 640, height: 160 } });
await b.close();
