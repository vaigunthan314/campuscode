const { spawn } = require("child_process");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
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
  await sleep(4000);
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.value;
  await evaluate(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(1000);
  await evaluate(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(1500);

  // Runtime-only stand-in for the missing asset: does the column layout, mask and fade work?
  const inject = `
    (() => {
      const s = document.querySelector('#mission');
      s.dataset.image = 'ready';
      s.dataset.revealed = '1';
      const art = s.querySelector('.mission-art');
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="#cfd6e6"/><rect x="0" y="300" width="900" height="600" fill="#8e9bbd"/><rect x="150" y="0" width="600" height="300" fill="#6f7d9e"/></svg>';
      const im = document.createElement('img');
      im.className = 'mission-art__image';
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      art.appendChild(im);
      return true;
    })()`;
  await evaluate(inject);
  await sleep(1800);

  const info = await evaluate(`
    (() => {
      const s = document.querySelector('#mission');
      const art = s.querySelector('.mission-art');
      const im = s.querySelector('.mission-art__image');
      const a = art.getBoundingClientRect(); const i = im.getBoundingClientRect();
      const cs = getComputedStyle(im); const csa = getComputedStyle(art);
      return {
        columns: getComputedStyle(s).gridTemplateColumns,
        art: [Math.round(a.width), Math.round(a.height)],
        img: [Math.round(i.width), Math.round(i.height)],
        artOpacity: csa.opacity,
        imgOpacity: cs.opacity,
        objectFit: cs.objectFit,
        objectPosition: cs.objectPosition,
        mask: (cs.maskImage || cs.webkitMaskImage || '').slice(0, 90),
        border: cs.borderTopWidth + ' ' + cs.borderTopStyle,
        radius: cs.borderTopLeftRadius,
        shadow: cs.boxShadow,
        heading: getComputedStyle(s.querySelector('.mission-heading')).fontSize,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
  console.log("DESKTOP:", JSON.stringify(info, null, 1));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-art-desktop.png", Buffer.from(shot.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(800);
  await evaluate(inject);
  await evaluate(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(1500);
  const mob = await evaluate(`(() => { const s=document.querySelector('#mission'); const a=s.querySelector('.mission-art').getBoundingClientRect(); return { art:[Math.round(a.width),Math.round(a.height)], sectionH: Math.round(s.getBoundingClientRect().height), overflowX: document.documentElement.scrollWidth > window.innerWidth }; })()`);
  console.log("MOBILE:", JSON.stringify(mob));
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-art-mobile.png", Buffer.from(shot2.data, "base64"));
  ws.close(); chrome.kill();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
