import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
import fs from "fs";
const OUT = "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-restored";
fs.mkdirSync(OUT, { recursive: true });
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu","--no-first-run"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on("pageerror", e => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, window.innerHeight * 5 * 0.38); });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/hero.png` });
for (const [name, sel] of [["about","#about"],["how","#howitworks"],["arena","#hackathons"],["mission","#mission"],["community","#community"]]) {
  await page.evaluate(s => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); }, sel);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}
const info = await page.evaluate(() => ({
  heroTitle: document.querySelector(".hero-content h1")?.getAttribute("aria-label") ?? null,
  glassCanvas: !!document.querySelector(".hero-glass-scene canvas"),
  cubeCanvas: !!document.querySelector(".hero-object canvas"),
  fallback: !!document.querySelector(".hero-glass-fallback"),
  nav: [...document.querySelectorAll(".landing-links button")].map(b => b.textContent),
  order: [...document.querySelectorAll("section")].map(s => s.id || s.className.split(" ").slice(0,2).join(".")).filter((v,i,a)=>a.indexOf(v)===i),
}));
console.log("INFO", JSON.stringify(info));
console.log("ERRORS", JSON.stringify(errors));
await browser.close();
