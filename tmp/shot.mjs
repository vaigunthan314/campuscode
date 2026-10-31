const { chromium } = await import("playwright-core");

const url = process.argv[2] || "http://127.0.0.1:5173/";
const out = process.argv[3] || "tmp/now";
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-gl=angle","--use-angle=metal","--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

await page.evaluate(() => document.querySelector("#howitworks")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(2600);
await page.screenshot({ path: `${out}-closed.png` });
await page.evaluate(() => { const s = document.querySelector("#howitworks"); const r = s.getBoundingClientRect(); window.scrollBy(0, r.top * -1 + 60); });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}-closed-full.png`, fullPage: false });

const sec = await page.$("#howitworks");
if (sec) { await sec.screenshot({ path: `${out}-section.png` }); }

// advance one step via the next button
const next = await page.$(".book-controls button[aria-label='Next page']");
if (next) { await next.click(); await page.waitForTimeout(1500); }
await page.screenshot({ path: `${out}-open.png` });
if (sec) { await sec.screenshot({ path: `${out}-section-open.png` }); }

const box = await page.evaluate(() => {
  const stage = document.querySelector("#howitworks-stage");
  const sec = document.querySelector("#howitworks");
  const canvas = document.querySelector("#howitworks canvas");
  const r = (el) => el ? el.getBoundingClientRect().toJSON() : null;
  return { stage: r(stage), section: r(sec), canvas: r(canvas), inner: [window.innerWidth, window.innerHeight] };
});
console.log(JSON.stringify(box, null, 1));
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
