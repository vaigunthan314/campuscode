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
  (async () => {
    const browser = await chromium.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--use-gl=angle", "--use-angle=metal", "--enable-unsafe-swiftshader"]
    });
    try {
      const page = await (await browser.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
      const logs = [];
      page.on("console", m => logs.push(m.type() + ": " + m.text()));
      page.on("pageerror", e => logs.push("pageerror: " + e.message));
      await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(5000);
      const body = await page.evaluate(() => {
        const children = [...document.body.children].map(el => {
          return {
            tag: el.tagName,
            id: el.id,
            cls: (el.className && (typeof el.className === "string" ? el.className : Array.from(el.classList).join(" "))) || null,
            childCount: el.children.length,
          };
        });
        const scripts = [...document.querySelectorAll("script[src]")].map(s => ({ src: s.getAttribute("src"), integrity: s.getAttribute("integrity") }));
        const title = document.title;
        const __cc = (typeof window.__ccStage !== "undefined") ? "has __ccStage" : "no __ccStage";
        const book = document.querySelector(".book-scene-wrapper") ? "has book-scene-wrapper" : "no book-scene-wrapper";
        return { title, __cc, book, bodyChildren: children, scripts };
      });
      console.log(JSON.stringify(body, null, 1));
      console.log("LOGS:");
      logs.slice(0, 120).forEach(l => console.log(l));
    } finally {
      await browser.close();
    }
    devServer.close(() => process.exit(0));
  })();
});
