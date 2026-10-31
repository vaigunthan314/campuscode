import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
import fs from "fs";

const OUT = "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-glass-after";
fs.mkdirSync(OUT, { recursive: true });

const browser = await pc.chromium.launch({
  executablePath: await pc.chromium.executablePath(),
  args: ["--no-sandbox", "--disable-gpu", "--no-first-run"],
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
});

const points = [
  ["recessed", 0.34],
  ["mid", 0.40],
  ["settled", 0.46],
];
for (const [name, p] of points) {
  await page.evaluate((progress) => {
    window.scrollTo(0, window.innerHeight * 5 * progress);
  }, p);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/hero-${name}.png` });
}

const info = await page.evaluate(() => {
  const host = document.querySelector(".hero-glass-scene");
  const canvas = host?.querySelector("canvas");
  const rect = host?.getBoundingClientRect();
  return {
    host: rect
      ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
      : null,
    canvas: canvas
      ? {
          cssW: Math.round(canvas.getBoundingClientRect().width),
          cssH: Math.round(canvas.getBoundingClientRect().height),
          bufW: canvas.width,
          bufH: canvas.height,
          engine: canvas.dataset.engine,
        }
      : null,
    fallback: Boolean(document.querySelector(".hero-glass-fallback")),
    scrollY: window.scrollY,
  };
});
console.log("INFO", JSON.stringify(info));
console.log("CONSOLE", JSON.stringify(logs.slice(0, 12)));
console.log("ERRORS", JSON.stringify(errors));
await browser.close();
