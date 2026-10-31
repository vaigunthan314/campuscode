const { chromium } = require("playwright-core");
const http = require("node:http");
const fs = require("node:fs");
const devPort = 5174;

const devServer = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost/");
  let path = url.pathname === "/" ? "/index.html" : url.pathname;
  const ext = path.split(".").pop();
  const type = ext === "html" ? "text/html" : ext === "js" ? "application/javascript" : ext === "css" ? "text/css" : "application/octet-stream";
  try {
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream("src" + path).pipe(res);
  } catch (err) {
    res.writeHead(404);
    res.end("not found");
  }
});

devServer.listen(devPort, "127.0.0.1", () => {
  const base = "http://127.0.0.1:" + devPort + "/";
  let exit = 0;
  (async () => {
    const browser = await chromium.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--use-gl=angle", "--use-angle=metal", "--enable-unsafe-swiftshader"]
    });
    try {
      const page = await (await browser.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
      const errors = [];
      page.on("console", m => { if (m.type() === "error") errors.push("[console.error] " + m.text()); });
      page.on("pageerror", e => errors.push("[pageerror] " + e.message));
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      const title = await page.title();
      const text = await page.evaluate(() => document.documentElement.innerText);
      const hasBook = await page.evaluate(() => !!document.querySelector(".book-scene-wrapper"));
      console.log("DEV title=" + title);
      console.log("DEV texts=" + (text.includes("DISCOVER") && text.includes("TEAM UP") && text.includes("BUILD") && text.includes("SHIP") ? "ok" : "missing") + " | SCROLL_TO_OPEN=" + text.includes("SCROLL TO OPEN"));
      console.log("DEV book-wrapper=" + hasBook);
      console.log("DEV errors=" + (errors.length ? errors.slice(0, 5).join("\n") : "none"));
      if (!text.includes("DISCOVER") || !text.includes("TEAM UP") || !text.includes("BUILD") || !text.includes("SHIP")) exit = 1;
      if (errors.length) exit = 1;
      await page.screenshot({ path: "tmp/verify-book-dev.png", fullPage: false });
    } finally {
      await browser.close();
    }
    console.log("exit=" + exit);
    devServer.close(() => process.exit(exit));
  })();
});
