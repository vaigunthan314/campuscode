const { spawn } = require("child_process");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9336", "--hide-scrollbars", "--window-size=390,844", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9336/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.value;
  await ev(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(900);
  await ev(`(() => { const a=document.querySelector('.mission-art'); const r=a.getBoundingClientRect(); window.scrollBy(0, r.top - 120); })()`);
  await sleep(1800);
  console.log("ART:", JSON.stringify(await ev(`(() => { const a=document.querySelector('.mission-art').getBoundingClientRect(); const i=document.querySelector('.mission-art__image').getBoundingClientRect(); return { art:[Math.round(a.width),Math.round(a.height),Math.round(a.top)], img:[Math.round(i.width),Math.round(i.height),Math.round(i.top)], gapRight: Math.round(window.innerWidth - i.right), opacity: getComputedStyle(document.querySelector('.mission-art')).opacity }; })()`)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-mobile-art.png", Buffer.from(shot.data, "base64"));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
