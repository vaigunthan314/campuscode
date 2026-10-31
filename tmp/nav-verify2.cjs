const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9348", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9348/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errs = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails?.exception?.description || "").slice(0, 160));
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5200);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`(() => { const b=document.querySelector('a.skip-link'); if(b) b.click(); })()`);
  await sleep(1500);
  await ev(`window.scrollTo(0,0)`); await sleep(900);
  console.log("IDS:", JSON.stringify(await ev(`['about','experience','howitworks','hackathons','mission','community','joincampuscode','footer'].map(i=>i+':'+!!document.getElementById(i))`)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/nav-top.png", Buffer.from(shot.data, "base64"));
  await ev(`[...document.querySelectorAll('.nv-link')].find(a=>a.textContent.includes('ABOUT')).click()`);
  await sleep(1900);
  console.log("ABOUTCLICK:", JSON.stringify(await ev(`({ top: Math.round(document.getElementById('about').getBoundingClientRect().top), active: document.querySelector('.nv-link.is-active')?.textContent })`)));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(800); await ev(`window.scrollTo(0,0)`); await sleep(600);
  console.log("M390:", JSON.stringify(await ev(`({ time: getComputedStyle(document.querySelector('.nv-strip__time')).display, overflow: document.documentElement.scrollWidth>innerWidth })`)));
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
