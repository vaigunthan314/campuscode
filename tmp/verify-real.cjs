const { spawn } = require("child_process");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9335;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--hide-scrollbars", "--disable-gpu", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  await evaluate(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(1000);
  await evaluate(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(2000);

  const probe = `(() => {
    const s = document.querySelector('#mission');
    const art = s.querySelector('.mission-art');
    const im = s.querySelector('.mission-art__image');
    if (!im) return { missingImg: true, dataImage: s.dataset.image };
    const r = art.getBoundingClientRect(); const ir = im.getBoundingClientRect();
    const cs = getComputedStyle(im);
    return {
      natural: [im.naturalWidth, im.naturalHeight],
      complete: im.complete,
      loaded: im.currentSrc,
      sectionCols: getComputedStyle(s).gridTemplateColumns,
      sectionRect: [Math.round(s.getBoundingClientRect().width), Math.round(s.getBoundingClientRect().height)],
      art: [Math.round(r.width), Math.round(r.height)],
      img: [Math.round(ir.width), Math.round(ir.height)],
      rightEdgeGap: Math.round(window.innerWidth - ir.right),
      artOpacity: getComputedStyle(art).opacity,
      objectFit: cs.objectFit, objectPosition: cs.objectPosition,
      border: cs.borderTopWidth + '/' + cs.borderTopStyle, radius: cs.borderTopLeftRadius, shadow: cs.boxShadow,
      mask: (cs.webkitMaskImage || cs.maskImage).slice(0, 80),
      headingPx: getComputedStyle(s.querySelector('.mission-heading')).fontSize,
      textOpacity: getComputedStyle(s.querySelector('.mission-desc')).opacity,
      canvases: s.querySelectorAll('canvas').length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
    };
  })()`;
  console.log("DESKTOP:", JSON.stringify(await evaluate(probe), null, 1));
  let shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-real-desktop.png", Buffer.from(shot.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(800);
  await evaluate(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(1800);
  console.log("MOBILE:", JSON.stringify(await evaluate(probe), null, 1));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-real-mobile.png", Buffer.from(shot.data, "base64"));

  ws.close(); chrome.kill();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
