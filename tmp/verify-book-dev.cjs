const { chromium } = require("playwright-core");
const http = require("node:http");
const fs = require("node:fs");
const devPort = 5174;

const devServer = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost/");
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  const candidates = path === "/index.html"
    ? ["index.html", "src/index.html", "public/index.html"]
    : [path, "src" + path, "src" + path.slice(4), "public" + path];
  let served = false;
  for (const file of candidates) {
    try {
      fs.accessSync(file, fs.constants.R_OK);
      const ext = (file.split("/").pop().split("#")[0].split("?")[0].match(/\.([^.]+)$/) || [])[1] || "";
      const safe = file.replace(/[^a-zA-Z0-9._/-]/g, "?");
      const type = ext === "html" ? "text/html" : ext === "js" || ext === "mjs" || ext === "tsx" || ext === "ts" || ext === "jsx" || ext === "cjs" || ext === "mts" || ext === "cts" ? "application/javascript" : ext === "css" ? "text/css" : ext === "svg" || ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "webp" ? "image/" + ext : ext === "json" ? "application/json" : ext === "woff2" ? "font/woff2" : ext === "woff" ? "font/woff" : ext === "ttf" ? "font/ttf" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
      served = true;
      break;
    } catch (err) {}
  }
  if (!served) {
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
      const navigation = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
      console.log("DEV navigation status=" + navigation.status() + " url=" + navigation.url());
      await page.waitForTimeout(3000);
      const lateErrors = [];
      const jsErrors = [];
      page.on("console", m => { if (m.type() === "error") lateErrors.push("[console.error] " + m.text()); });
      page.on("pageerror", e => jsErrors.push("[pageerror] " + e.message));
      await page.waitForTimeout(4000);
      const errors = [...lateErrors];
      const title = await page.title();
      const text = await page.evaluate(() => document.documentElement.innerText);
      const hasBook = await page.evaluate(() => !!document.querySelector(".book-scene-wrapper"));
      console.log("DEV JS errors=" + (jsErrors.length ? jsErrors.slice(0, 5).join(" | ") : "none"));
      console.log("DEV title=" + title);
      console.log("DEV texts=" + (text.includes("DISCOVER") && text.includes("TEAM UP") && text.includes("BUILD") && text.includes("SHIP") ? "ok" : "missing") + " | SCROLL_TO_OPEN=" + text.includes("SCROLL TO OPEN"));
      console.log("DEV book-wrapper=" + hasBook);
      console.log("DEV errors=" + (errors.length ? errors.slice(0, 5).join("\n") : "none"));
      if (!text.includes("DISCOVER") || !text.includes("TEAM UP") || !text.includes("BUILD") || !text.includes("SHIP")) exit = 1;
      if (errors.length || jsErrors.length) exit = 1;
      await page.screenshot({ path: "tmp/verify-book-dev.png", fullPage: false });
    } finally {
      await browser.close();
    }
    console.log("exit=" + exit);
    devServer.close(() => process.exit(exit));
  })();
});
