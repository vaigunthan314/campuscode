import pc from "playwright-core";

const URL = process.argv[2] ?? "http://127.0.0.1:5174/";

const browser = await pc.chromium.launch({
  executablePath: await pc.chromium.executablePath(),
  args: ["--no-sandbox", "--disable-gpu", "--no-first-run"],
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);

const state = await page.evaluate(() => {
  const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
  const nav = document.querySelector(".landing-nav");
  const r = nav?.getBoundingClientRect();
  return {
    ids,
    about: Boolean(document.getElementById("about")),
    aboutStage: Boolean(document.getElementById("about-stage")),
    navBox: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
    navText: nav?.innerText,
    hasCommunity: Boolean(document.getElementById("community")),
    sections: [...document.querySelectorAll("section")].map((s) => `${s.id || s.className}`),
  };
});
console.log(JSON.stringify(state, null, 2));
console.log("ERRORS", JSON.stringify(errors));
await browser.close();
