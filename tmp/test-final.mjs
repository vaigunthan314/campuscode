import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const el = document.getElementById("howitworks"); scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await page.waitForTimeout(2500);

const order = await page.evaluate(() => [...document.querySelectorAll("main > section, main > div > section, section")].map((s) => s.id || s.className.split(" ").slice(0, 2).join(".")).filter((v, i, a) => a.indexOf(v) === i));
console.log("SECTION_ORDER", JSON.stringify(order));

// Open, then horizontal drag left-to-right from right page (backwards) after going forward.
await page.locator(".book-stage").click({ position: { x: 200, y: 200 } });
await page.waitForTimeout(1300);
console.log("OPEN", await page.locator(".book-count").textContent());

let b = await page.locator(".book-stage").boundingBox();
await page.mouse.move(b.x + b.width * 0.78, b.y + b.height * 0.5);
await page.mouse.down();
await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5, { steps: 6 });
await page.mouse.move(b.x + b.width * 0.32, b.y + b.height * 0.5, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(1200);
console.log("DRAG_FORWARD", await page.locator(".book-count").textContent());

b = await page.locator(".book-stage").boundingBox();
await page.mouse.move(b.x + b.width * 0.22, b.y + b.height * 0.5);
await page.mouse.down();
await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5, { steps: 6 });
await page.mouse.move(b.x + b.width * 0.75, b.y + b.height * 0.5, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(1200);
console.log("DRAG_BACK", await page.locator(".book-count").textContent());
console.log("ERRORS", JSON.stringify(errors));
await browser.close();
