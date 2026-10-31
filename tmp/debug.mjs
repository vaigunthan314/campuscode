const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-gl=angle","--use-angle=metal","--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector("#howitworks")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(2500);
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
await browser.close();
