import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
import fs from "fs";

const OUT = "/Users/vaigunthansl/Desktop/Rebuild /tmp/hero-glass-verify";
fs.mkdirSync(OUT, { recursive: true });

async function openPage(browser, viewport, reduced = false) {
  const context = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(6500);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  return { context, page, errors };
}

async function scrollProgress(page, p) {
  await page.evaluate((progress) => {
    window.scrollTo(0, window.innerHeight * 5 * progress);
  }, p);
  await page.waitForTimeout(1400);
}

const browser = await pc.chromium.launch({
  executablePath: await pc.chromium.executablePath(),
  args: ["--no-sandbox", "--disable-gpu", "--no-first-run"],
  headless: true,
});

// Desktop: forward, reverse, pointer.
{
  const { context, page, errors } = await openPage(browser, { width: 1440, height: 900 });
  await scrollProgress(page, 0.46);
  await page.screenshot({ path: `${OUT}/desktop-settled.png` });

  await scrollProgress(page, 0.34);
  await page.screenshot({ path: `${OUT}/desktop-reversed.png` });

  await scrollProgress(page, 0.46);
  await page.mouse.move(720, 450);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/desktop-pointer-center.png` });
  await page.mouse.move(1380, 120);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/desktop-pointer-topleft.png` });
  await page.mouse.move(120, 820);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/desktop-pointer-bottomright.png` });

  const state = await page.evaluate(() => ({
    canvas: Boolean(document.querySelector(".hero-glass-scene canvas")),
    fallback: Boolean(document.querySelector(".hero-glass-fallback")),
    engine: document.querySelector(".hero-glass-scene canvas")?.dataset.engine ?? null,
  }));
  console.log("DESKTOP", JSON.stringify(state), "ERRORS", JSON.stringify(errors));
  await context.close();
}

// Reduced motion.
{
  const { context, page, errors } = await openPage(browser, { width: 1440, height: 900 }, true);
  await scrollProgress(page, 0.46);
  await page.screenshot({ path: `${OUT}/reduced-motion.png` });
  const state = await page.evaluate(() => ({
    canvas: Boolean(document.querySelector(".hero-glass-scene canvas")),
    fallback: Boolean(document.querySelector(".hero-glass-fallback")),
    matches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  console.log("REDUCED", JSON.stringify(state), "ERRORS", JSON.stringify(errors));
  await context.close();
}

// Mobile.
{
  const { context, page, errors } = await openPage(browser, { width: 390, height: 844 });
  await scrollProgress(page, 0.46);
  await page.screenshot({ path: `${OUT}/mobile-settled.png` });
  await scrollProgress(page, 0.34);
  await page.screenshot({ path: `${OUT}/mobile-reversed.png` });
  console.log("MOBILE ERRORS", JSON.stringify(errors));
  await context.close();
}

// Tablet.
{
  const { context, page, errors } = await openPage(browser, { width: 820, height: 1180 });
  await scrollProgress(page, 0.46);
  await page.screenshot({ path: `${OUT}/tablet-settled.png` });
  console.log("TABLET ERRORS", JSON.stringify(errors));
  await context.close();
}

await browser.close();
