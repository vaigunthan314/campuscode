import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
const browser = await pc.chromium.launch({ executablePath: await pc.chromium.executablePath(), args: ["--no-sandbox","--disable-gpu"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const el = document.getElementById("howitworks"); scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await page.waitForTimeout(3200);
await page.screenshot({ path: "/Users/vaigunthansl/Desktop/Rebuild /tmp/final-how-closed.png" });
await browser.close();
