const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9352", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9352/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errs = [];
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails?.exception?.description || "").slice(0, 140)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5200);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`document.querySelector('a.skip-link')?.click()`); await sleep(1500);
  await ev(`document.getElementById('howitworks').scrollIntoView()`); await sleep(2200);
  console.log("FOLIO:", JSON.stringify(await ev(`(() => { const b=document.querySelector('.bg-layer--folio'); const cs=getComputedStyle(b); const s=document.getElementById('howitworks'); return { pos: cs.position, z: cs.zIndex, pe: cs.pointerEvents, clip: cs.overflow, active: b.dataset.active, nodes: b.querySelectorAll('*').length, secPos: getComputedStyle(s).position, secOverflow: getComputedStyle(s).overflow }; })()`)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/bg-folio.png", Buffer.from(shot.data, "base64"));
  const before = await ev(`document.querySelector('.book-scene-wrapper').dataset.step`);
  await ev(`(() => { const b=document.querySelector('.book-scene-wrapper').getBoundingClientRect(); document.elementFromPoint(b.left+b.width/2, b.top+b.height/2)?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:b.left+b.width/2,clientY:b.top+b.height/2,pointerType:'mouse',button:0})); window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:b.left+b.width/2,clientY:b.top+b.height/2})); })()`);
  await sleep(1600);
  console.log("BOOK:", before, "->", await ev(`document.querySelector('.book-scene-wrapper').dataset.step`));
  await ev(`document.querySelector('.arena-card')?.focus()`); await sleep(200);
  await ev(`document.getElementById('hackathons').scrollIntoView()`); await sleep(2200);
  console.log("ARENA:", JSON.stringify(await ev(`(() => { const b=document.querySelector('.bg-layer--arena'); const s=document.getElementById('hackathons'); return { active: b.dataset.active, nodes: b.querySelectorAll('*').length, floor: !!document.querySelector('.arena-floor'), folioActive: document.querySelector('.bg-layer--folio').dataset.active, word: !!document.querySelector('.bg-word'), exp: s.dataset.expanded }; })()`)));
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/bg-arena.png", Buffer.from(shot2.data, "base64"));
  await ev(`document.querySelectorAll('.arena-card')[1].click()`); await sleep(900);
  console.log("CARD CLICK:", JSON.stringify(await ev(`({ exp: document.getElementById('hackathons').dataset.expanded, active: document.querySelectorAll('.arena-card')[1].className.includes('is-active') })`)));
  for (const w of [1024, 390]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: 844, deviceScaleFactor: 1, mobile: w < 500 });
    await sleep(700);
    await ev(`document.getElementById('hackathons').scrollIntoView()`); await sleep(600);
    console.log(`W${w}:`, JSON.stringify(await ev(`({ overflow: document.documentElement.scrollWidth > innerWidth, sw: document.documentElement.scrollWidth })`)));
    if (w === 390) { const s3 = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync("tmp/bg-390.png", Buffer.from(s3.data, "base64")); }
  }
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
