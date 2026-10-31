import pc from "playwright-core";
import fs from "fs";

const OUT = "tmp/header-verify";
fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] ?? "http://127.0.0.1:5174/";

const browser = await pc.chromium.launch({
  executablePath: await pc.chromium.executablePath(),
  args: ["--no-sandbox", "--disable-gpu", "--no-first-run"],
  headless: true,
});

async function open(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  // Wait for the loading sequence to report ready, then scroll to enter.
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    const ready = await page.evaluate(() =>
      document.querySelector(".cine-primer-cue")?.classList.contains("visible"),
    );
    if (ready) break;
  }
  for (let i = 0; i < 20; i++) {
    const entered = await page.evaluate(() =>
      document.querySelector(".cine")?.classList.contains("is-entered"),
    );
    if (entered) break;
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  const entered = await page.evaluate(() =>
    document.querySelector(".cine")?.classList.contains("is-entered"),
  );
  return { context, page, errors, entered };
}

const { context, page, errors, entered } = await open({ width: 1440, height: 900 });
console.log("ENTERED", entered);

await page.screenshot({ path: `${OUT}/desktop-top.png` });
await page.screenshot({
  path: `${OUT}/desktop-header.png`,
  clip: { x: 0, y: 0, width: 1440, height: 150 },
});

const metrics = await page.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      cy: Math.round(r.y + r.height / 2), color: cs.color, bg: cs.backgroundColor,
      radius: cs.borderRadius, font: `${cs.fontFamily.split(",")[0]} ${cs.fontSize}/${cs.fontWeight} ls=${cs.letterSpacing}`,
    };
  };
  const nav = document.querySelector(".landing-nav");
  const cs = getComputedStyle(nav);
  return {
    header: { top: Math.round(nav.getBoundingClientRect().top), h: Math.round(nav.getBoundingClientRect().height),
      bg: cs.backgroundColor, borderBottom: `${cs.borderBottomWidth} solid ${cs.borderBottomColor}`, pad: cs.paddingLeft },
    mark: [...document.querySelectorAll(".landing-nav .landing-logo-mark span")].map((s) => getComputedStyle(s).backgroundColor),
    wordmark: document.querySelector(".landing-logo strong")?.textContent,
    descriptor: document.querySelector(".landing-logo small")?.textContent,
    logo: box(".landing-logo"),
    links: box(".landing-links"),
    linkBoxes: [...document.querySelectorAll(".landing-links button")].map((b) => {
      const r = b.getBoundingClientRect();
      return `${b.textContent} ${Math.round(r.x)}..${Math.round(r.right)}`;
    }),
    join: box(".landing-join"),
    joinText: document.querySelector(".landing-join")?.innerText.trim(),
    loginGone: !document.querySelector(".landing-login"),
    navCenter: (() => { const r = document.querySelector(".landing-links").getBoundingClientRect(); return Math.round(r.x + r.width / 2); })(),
    vw: window.innerWidth,
  };
});
console.log("METRICS", JSON.stringify(metrics, null, 1));

const map = {
  ABOUT: "about-stage", EXPERIENCE: "experience", "HOW IT WORKS": "howitworks",
  ARENA: "hackathons", MISSION: "mission", NETWORK: "community",
};
const results = [];
const labels = metrics.linkBoxes.map((s) => s.split(" ")[0] + (s.startsWith("HOW IT WORKS") ? " IT WORKS" : ""));
for (const label of Object.keys(map)) {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(3000);
  const info = await page.evaluate((target) => {
    const el = document.getElementById(target);
    const r = el.getBoundingClientRect();
    const visible = r.top < innerHeight && r.bottom > 0;
    // what is actually on screen at the top-centre
    const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return {
      target, top: Math.round(r.top), bottom: Math.round(r.bottom), visible,
      scrollY: Math.round(window.scrollY),
      centreEl: mid ? `${mid.tagName}.${mid.className}`.slice(0, 60) : null,
    };
  }, map[label]);
  results.push({ label, ...info });
  await page.screenshot({ path: `${OUT}/goto-${label.replace(/\s+/g, "-").toLowerCase()}.png` });
}
console.log("NAV", JSON.stringify(results, null, 1));

await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
await page.waitForTimeout(400);
await page.locator(".landing-join").click();
await page.waitForTimeout(3000);
console.log("JOIN", JSON.stringify(await page.evaluate(() => {
  const r = document.getElementById("joincampuscode").getBoundingClientRect();
  return { top: Math.round(r.top), visible: r.top < innerHeight && r.bottom > 0, hash: location.hash };
})));
await page.screenshot({ path: `${OUT}/goto-join.png` });
console.log("DESKTOP ERRORS", JSON.stringify(errors));
await context.close();

// ---------------- mobile ----------------
{
  const m = await open({ width: 390, height: 844 });
  const page = m.page;
  await page.screenshot({ path: `${OUT}/mobile-top.png` });
  await page.screenshot({ path: `${OUT}/mobile-header.png`, clip: { x: 0, y: 0, width: 390, height: 130 } });
  console.log("MOBILE HEADER", JSON.stringify(await page.evaluate(() => {
    const nav = document.querySelector(".landing-nav");
    const r = nav.getBoundingClientRect();
    return {
      top: Math.round(r.top), h: Math.round(r.height), pad: getComputedStyle(nav).paddingLeft,
      links: getComputedStyle(document.querySelector(".landing-links")).display,
      burger: getComputedStyle(document.querySelector(".landing-menu")).display,
      joinHidden: getComputedStyle(document.querySelector(".landing-nav-actions")).display,
      logoCy: Math.round(document.querySelector(".landing-logo").getBoundingClientRect().y
        + document.querySelector(".landing-logo").getBoundingClientRect().height / 2),
    };
  })));
  await page.locator(".landing-menu").click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/mobile-menu.png` });
  console.log("MOBILE MENU", JSON.stringify(await page.evaluate(() => ({
    open: document.querySelector(".mobile-menu").classList.contains("is-open"),
    aria: document.querySelector(".landing-menu").getAttribute("aria-expanded"),
    items: [...document.querySelectorAll(".mobile-menu nav button")].map((b) => b.textContent),
    actions: [...document.querySelectorAll(".mobile-menu-actions a")].map((a) => a.textContent.trim()),
  }))));
  await page.getByRole("button", { name: /MISSION/ }).first().click();
  await page.waitForTimeout(3000);
  console.log("MOBILE->MISSION", JSON.stringify(await page.evaluate(() => {
    const r = document.getElementById("mission").getBoundingClientRect();
    return { top: Math.round(r.top), visible: r.top < innerHeight && r.bottom > 0,
      menuClosed: !document.querySelector(".mobile-menu").classList.contains("is-open") };
  })));
  await page.screenshot({ path: `${OUT}/mobile-mission.png` });
  console.log("MOBILE ERRORS", JSON.stringify(m.errors));
  await m.context.close();
}

// ---------------- breakpoints ----------------
for (const width of [820, 1024, 1180]) {
  const s = await open({ width, height: 900 });
  const info = await s.page.evaluate(() => {
    const links = document.querySelector(".landing-links");
    const lr = links.getBoundingClientRect();
    const logo = document.querySelector(".landing-logo").getBoundingClientRect();
    const join = document.querySelector(".landing-join").getBoundingClientRect();
    return {
      linksDisplay: getComputedStyle(links).display,
      burger: getComputedStyle(document.querySelector(".landing-menu")).display,
      headerH: Math.round(document.querySelector(".landing-nav").getBoundingClientRect().height),
      gapFromLogo: Math.round(lr.x - logo.right),
      gapToJoin: Math.round(join.x - lr.right),
      navCenter: Math.round(lr.x + lr.width / 2), vw: innerWidth,
    };
  });
  console.log(`WIDTH ${width}`, JSON.stringify(info));
  await s.page.screenshot({ path: `${OUT}/w${width}.png`, clip: { x: 0, y: 0, width, height: 140 } });
  await s.context.close();
}

await browser.close();
