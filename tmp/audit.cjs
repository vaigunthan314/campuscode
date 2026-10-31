const { spawn } = require("child_process");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9349", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9349/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5200);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`document.querySelector('a.skip-link')?.click()`); await sleep(1500);
  console.log(JSON.stringify(await ev(`[...document.querySelectorAll('a,button')].map((el,i)=>{const sec=el.closest('section,header,footer');return {i, t:(el.innerText||el.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,42), tag:el.tagName.toLowerCase(), href:el.getAttribute('href')||'', target:el.getAttribute('target')||'', sec:sec?(sec.id||sec.className.split(' ')[0]):'top'}})`.replace(/\s+/g,' ')), null, 1));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
