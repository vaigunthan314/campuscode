const { spawn } = require("child_process");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9351", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9351/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errs = [];
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails?.exception?.description || "").slice(0, 120)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5200);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`document.querySelector('a.skip-link')?.click()`); await sleep(1600);
  // book: arrow key with focus
  await ev(`document.getElementById('howitworks').scrollIntoView()`); await sleep(900);
  await ev(`document.querySelector('.book-scene-wrapper').focus()`); await sleep(200);
  const before = await ev(`document.querySelector('.book-scene-wrapper').dataset.step`);
  await ev(`document.querySelector('.book-scene-wrapper').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))`); await sleep(1500);
  const after = await ev(`document.querySelector('.book-scene-wrapper').dataset.step`);
  console.log("BOOK:", before, "->", after);
  // mission watch story
  await ev(`window.scrollTo(0, document.getElementById('mission').offsetTop + 200)`); await sleep(1200);
  await ev(`document.querySelector('.mission-story').click()`); await sleep(1500);
  console.log("WATCH STORY:", JSON.stringify(await ev(`({ expTop: Math.round(document.getElementById('experience').getBoundingClientRect().top) })`)));
  // mobile menu focus
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(700); await ev(`window.scrollTo(0,0)`); await sleep(700);
  await ev(`document.querySelector('.nv-burger').click()`); await sleep(700);
  console.log("PANEL FOCUS:", JSON.stringify(await ev(`({ focus: document.activeElement?.getAttribute('aria-label')||document.activeElement?.className, locked: document.documentElement.style.overflow })`)));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await sleep(500);
  console.log("ESC:", JSON.stringify(await ev(`({ open: document.querySelector('.nv-panel').classList.contains('is-open'), locked: document.documentElement.style.overflow, focus: document.activeElement?.className })`)));
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
