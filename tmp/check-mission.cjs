const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failed = [];
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector("#mission")?.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.waitForTimeout(1600);
  const info = await page.evaluate(() => {
    const s = document.querySelector("#mission");
    const copy = document.querySelector(".mission-copy");
    const art = document.querySelector(".mission-art");
    const h = document.querySelector(".mission-heading");
    const r = s.getBoundingClientRect();
    return {
      section: [Math.round(r.width), Math.round(r.height), r.top],
      display: getComputedStyle(s).display,
      columns: getComputedStyle(s).gridTemplateColumns,
      copyWidth: Math.round(copy.getBoundingClientRect().width),
      artWidth: art ? Math.round(art.getBoundingClientRect().width) : null,
      headingSize: getComputedStyle(h).fontSize,
      headingOpacity: getComputedStyle(h).opacity,
      revealed: s.dataset.revealed,
      canvasesInside: s.querySelectorAll("canvas").length,
      hasImg: !!document.querySelector(".mission-art__image"),
      stats: [...document.querySelectorAll(".mission-stats li")].map((li) => li.textContent.trim()),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  console.log(JSON.stringify(info, null, 1));
  console.log("FAILED REQUESTS:", failed.length ? failed : "none");
  await page.screenshot({ path: "/tmp/mission-image-section.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.querySelector("#mission")?.scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const s = document.querySelector("#mission");
    const r = s.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), overflow: document.documentElement.scrollWidth > window.innerWidth };
  });
  console.log("MOBILE:", JSON.stringify(m));
  await page.screenshot({ path: "/tmp/mission-image-mobile.png" });
  await browser.close();
})();
