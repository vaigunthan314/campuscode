import { execSync } from "node:child_process";
import { chromium } from "playwright-core";

function run(cmd) {
  console.log("RUNNING:", cmd.split(/\s+/)[0], "...");
  try {
    const out = execSync(cmd, { stdio: "inherit", timeout: 120_000 });
    console.log("OK:", cmd.split(/\s+/)[0]);
    return true;
  } catch (e) {
    console.error("FAIL:", cmd.split(/\s+/)[0]);
    return false;
  }
}

const typecheck = run("npm run typecheck");
const build = run("npm run build");
if (!typecheck || !build) {
  console.error("Aborting verification: build/typecheck did not succeed.");
  process.exit(1);
}

const root = process.cwd();
const preview = execSync("npx vite preview --port 4174 --strictPort", { stdio: "pipe" });
console.log("preview pid:", typeof preview === "string" ? preview.trim() : "started");

// give preview a moment to bind
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-gl=angle", "--use-angle=metal", "--enable-unsafe-swiftshader"],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const skip = await page.$("text=SKIP INTRO");
if (skip) { try { await skip.click(); } catch {} }
await page.waitForTimeout(600);

if (!(await page.evaluate(() => !!window.__ccStage))) {
  await page.evaluate(() => document.querySelector("#howitworks")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1500);
}
await page.evaluate(() => { const s = document.querySelector("#howitworks"); const r = s.getBoundingClientRect(); window.scrollBy(0, r.top - 60); });
await page.waitForTimeout(2200);

const info = await page.evaluate(() => {
  const st = window.__ccStage;
  if (!st) return "no stage";
  const out = [];
  st.scene.traverse((o) => {
    if (o.isMesh) {
      const p = o.getWorldPosition(new (o.position.constructor)());
      out.push({ name: o.name || o.geometry.type, visible: o.visible, pos: [p.x.toFixed(2), p.y.toFixed(2), p.z.toFixed(2)], mat: Array.isArray(o.material) ? "multi" : o.material.type });
    }
  });
  return out;
});
console.log(JSON.stringify(info, null, 1));

await page.screenshot({ path: "tmp/book-verify.png" });
await browser.close();
console.log("saved tmp/book-verify.png");
