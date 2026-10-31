const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-gl=angle","--use-angle=metal","--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
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
console.log("stage?", await page.evaluate(() => !!window.__ccStage));
await page.screenshot({ path: "tmp/dbg-base.png" });
await page.evaluate(() => {
  window.__ccStage.scene.traverse((o) => { if (o.isMesh && o.material && o.material.type === "ShadowMaterial") o.visible = false; });
});
await page.waitForTimeout(400);
await page.screenshot({ path: "tmp/dbg-noshadow.png", clip: { x: 180, y: 240, width: 1080, height: 640 } });
await page.evaluate(() => {
  window.__ccStage.scene.traverse((o) => { if (o.isMesh) o.visible = o.material && o.material.type === "ShadowMaterial"; });
});
await page.waitForTimeout(400);
await page.screenshot({ path: "tmp/dbg-onlyshadow.png", clip: { x: 180, y: 240, width: 1080, height: 640 } });
await browser.close();
