const { spawn } = require("child_process");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9339", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9339/json/list")).json()).find(t => t.type === "page"); } catch {} }
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
  await sleep(1500);
  console.log("IN VIEW:", JSON.stringify(await ev(`(() => { const j=document.querySelector('#joincampuscode'); return { active: j.dataset.active, orbit: getComputedStyle(j.querySelector('.join-ring__orbit')).animationPlayState }; })()`)));
  await ev(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(1400);
  console.log("SCROLLED AWAY:", JSON.stringify(await ev(`(() => { const j=document.querySelector('#joincampuscode'); return { active: j.dataset.active, orbit: getComputedStyle(j.querySelector('.join-ring__orbit')).animationPlayState, plus: getComputedStyle(j.querySelector('.join-plus')).animationPlayState, float: getComputedStyle(j.querySelector('.join-square')).animationPlayState }; })()`)));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
