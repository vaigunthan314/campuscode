import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu"], headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const el = document.getElementById("howitworks"); scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/mobile-how-closed.png" });
console.log("MOBILE_HOW", await page.evaluate(() => {
  const stage = document.querySelector(".book-stage").getBoundingClientRect();
  const overlay = document.querySelector(".book-overlay").getBoundingClientRect();
  const wrap = document.querySelector(".book-scene-wrapper");
  return {
    stage: { x: Math.round(stage.x), y: Math.round(stage.y), w: Math.round(stage.width), h: Math.round(stage.height), bottom: Math.round(stage.bottom) },
    overlay: { top: Math.round(overlay.top), bottom: Math.round(overlay.bottom) },
    caption: document.querySelector(".book-caption")?.textContent,
    count: document.querySelector(".book-count")?.textContent,
    touchAction: getComputedStyle(wrap).touchAction,
    viewport: { w: innerWidth, h: innerHeight },
  };
}));

let b = await page.locator(".book-stage").boundingBox();
await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
await page.waitForTimeout(1400);
console.log("MOBILE_OPEN", await page.locator(".book-count").textContent());
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/mobile-how-open.png" });

// Tap right edge then left edge.
b = await page.locator(".book-stage").boundingBox();
await page.touchscreen.tap(b.x + b.width * 0.85, b.y + b.height * 0.5);
await page.waitForTimeout(1200);
console.log("MOBILE_RIGHT", await page.locator(".book-count").textContent());
b = await page.locator(".book-stage").boundingBox();
await page.touchscreen.tap(b.x + b.width * 0.15, b.y + b.height * 0.5);
await page.waitForTimeout(1200);
console.log("MOBILE_LEFT", await page.locator(".book-count").textContent());
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/mobile-how-back.png" });

// Arena mobile.
await page.evaluate(() => { const el = document.getElementById("hackathons"); scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await page.waitForTimeout(1800);
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/mobile-arena-stack.png" });
await page.locator(".arena-card").first().tap();
await page.waitForTimeout(1300);
console.log("MOBILE_ARENA", await page.locator("#hackathons").getAttribute("data-expanded"));
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/mobile-arena-open.png" });
console.log("ERRORS", JSON.stringify(errors));
await browser.close();
