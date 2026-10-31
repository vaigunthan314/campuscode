const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9340", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9340/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(800);
  await ev(`document.querySelector('#joincampuscode')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(2500);
  const clip = await ev(`(() => { const e=document.querySelector('.join-line--two .join-line__inner').getBoundingClientRect(); return { x: Math.round(e.x), y: Math.round(e.y), width: Math.round(e.width), height: Math.round(e.height) }; })()`);
  console.log("CLIP:", JSON.stringify(clip));
  const zoom = await send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 2 } });
  fs.writeFileSync("tmp/join-zoom.png", Buffer.from(zoom.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(700);
  await ev(`document.querySelector('#joincampuscode')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(1500);
  console.log("MOBILE FIT:", JSON.stringify(await ev(`(() => {
    const inner=document.querySelector('.join-line--two .join-line__inner');
    const r=inner.getBoundingClientRect();
    const j=document.querySelector('#joincampuscode').getBoundingClientRect();
    return { scrollW: inner.scrollWidth, clientW: inner.clientWidth, rect: [Math.round(r.left), Math.round(r.right)], section: [Math.round(j.left), Math.round(j.right)], fontSize: getComputedStyle(inner).fontSize, viewport: window.innerWidth };
  })()`)));
  const clip2 = await ev(`(() => { const e=document.querySelector('.join-line--two .join-line__inner').getBoundingClientRect(); return { x: 0, y: Math.max(0,Math.round(e.y)-6), width: 390, height: Math.round(e.height)+12 }; })()`);
  const zoom2 = await send("Page.captureScreenshot", { format: "png", clip: { ...clip2, scale: 2 } });
  fs.writeFileSync("tmp/join-zoom-mobile.png", Buffer.from(zoom2.data, "base64"));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
