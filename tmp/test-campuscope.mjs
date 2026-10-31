import pc from "/Users/vaigunthansl/Desktop/Rebuild /node_modules/playwright-core/index.mjs";
import fs from "fs";

const CHROMIUM = await pc.chromium.executablePath();
const browser = await pc.chromium.launch({
  executablePath: CHROMIUM,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--no-first-run"],
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(e.message));

const shot = async (name) => {
  await page.screenshot({ path: `/Users/vaigunthansl/Desktop/Rebuild /tmp/${name}.png` });
};

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);

// Jump past the pinned cinematic intro.
await page.evaluate(() => {
  const el = document.getElementById("howitworks");
  const y = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, y);
});
await page.waitForTimeout(1600);
await shot("fix-how-closed");

const sectionInfo = await page.evaluate(() => {
  const section = document.getElementById("howitworks");
  const book = document.querySelector(".book-stage");
  const overlay = document.querySelector(".book-overlay");
  const caption = document.querySelector(".book-caption");
  const hint = document.querySelector(".book-hint");
  const count = document.querySelector(".book-count");
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };
  return {
    sectionClasses: section?.className,
    sectionRect: r(section),
    bookRect: r(book),
    overlayRect: r(overlay),
    caption: caption?.textContent,
    hint: hint?.textContent,
    count: count?.textContent,
    scrollY: window.scrollY,
    docScrollHeight: document.documentElement.scrollHeight,
  };
});
console.log("HOW_CLOSED", JSON.stringify(sectionInfo));

// Click the closed cover.
let b = await page.locator(".book-stage").boundingBox();
await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
await page.waitForTimeout(1400);
console.log(
  "AFTER_OPEN",
  JSON.stringify(
    await page.evaluate(() => ({
      caption: document.querySelector(".book-caption")?.textContent,
      hint: document.querySelector(".book-hint")?.textContent,
      count: document.querySelector(".book-count")?.textContent,
      sectionClasses: document.getElementById("howitworks")?.className,
    })),
  ),
);
await shot("fix-how-open");

// Right page -> next spread.
b = await page.locator(".book-stage").boundingBox();
await page.mouse.click(b.x + b.width * 0.82, b.y + b.height * 0.5);
await page.waitForTimeout(1200);
console.log("AFTER_NEXT", await page.locator(".book-count").textContent());
await shot("fix-how-page2");

// Wheel must not turn the page or block scrolling.
const wheelBefore = await page.evaluate(() => ({
  count: document.querySelector(".book-count")?.textContent,
  y: window.scrollY,
}));
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.wheel(0, 140);
await page.waitForTimeout(700);
const wheelAfter = await page.evaluate(() => ({
  count: document.querySelector(".book-count")?.textContent,
  y: window.scrollY,
}));
console.log("WHEEL", JSON.stringify({ before: wheelBefore, after: wheelAfter }));

// Left page back.
b = await page.locator(".book-stage").boundingBox();
await page.mouse.click(b.x + b.width * 0.18, b.y + b.height * 0.5);
await page.waitForTimeout(1200);
console.log("AFTER_BACK", await page.locator(".book-count").textContent());

// Walk to Ship (04) then back with the left page.
for (let i = 0; i < 4; i += 1) {
  b = await page.locator(".book-stage").boundingBox();
  await page.mouse.click(b.x + b.width * 0.85, b.y + b.height * 0.5);
  await page.waitForTimeout(1000);
}
console.log("AT_END", await page.locator(".book-count").textContent());
await shot("fix-how-ship");
b = await page.locator(".book-stage").boundingBox();
await page.mouse.click(b.x + b.width * 0.15, b.y + b.height * 0.5);
await page.waitForTimeout(1100);
console.log("SHIP_BACK", await page.locator(".book-count").textContent());

// Arena.
await page.evaluate(() => {
  const el = document.getElementById("hackathons");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
});
await page.waitForTimeout(1700);
await shot("fix-arena-stack");
const arenaInfo = await page.evaluate(() => {
  const sec = document.getElementById("hackathons");
  const cards = [...document.querySelectorAll(".arena-card")].map((c) => {
    const b = c.getBoundingClientRect();
    return { title: c.querySelector(".arena-card-title")?.textContent, pressed: c.getAttribute("aria-pressed"), x: Math.round(b.x), y: Math.round(b.y) };
  });
  return { classes: sec?.className, expanded: sec?.getAttribute("data-expanded"), cards };
});
console.log("ARENA_STACK", JSON.stringify(arenaInfo));

await page.locator(".arena-card").first().click({ position: { x: 40, y: 40 } });
await page.waitForTimeout(1300);
const arenaExpanded = await page.evaluate(() => {
  const sec = document.getElementById("hackathons");
  const cards = [...document.querySelectorAll(".arena-card")].map((c) => ({
    title: c.querySelector(".arena-card-title")?.textContent,
    pressed: c.getAttribute("aria-pressed"),
    active: c.classList.contains("is-active"),
    z: getComputedStyle(c.parentElement).zIndex,
  }));
  const smoke = document.querySelector(".arena-smoke");
  return { expanded: sec?.getAttribute("data-expanded"), cards, smokeCanvas: smoke ? `${smoke.width}x${smoke.height}` : null };
});
console.log("ARENA_EXPANDED", JSON.stringify(arenaExpanded));
await shot("fix-arena-open");

// Select another card (behind) and collapse.
await page.locator(".arena-card").nth(2).click({ force: true, position: { x: 30, y: 30 } });
await page.waitForTimeout(1100);
console.log("ARENA_SELECT_3", await page.locator("#hackathons").getAttribute("data-expanded"), await page.locator(".arena-card").nth(2).getAttribute("aria-pressed"));
await shot("fix-arena-card3");
await page.locator(".arena-card").nth(2).click({ force: true, position: { x: 30, y: 30 } });
await page.waitForTimeout(900);
console.log("ARENA_COLLAPSE", await page.locator("#hackathons").getAttribute("data-expanded"));

console.log("CONSOLE", JSON.stringify(logs.slice(0, 20)));
console.log("PAGE_ERRORS", JSON.stringify(errors));
await browser.close();
