const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9346", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9346/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errs = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").slice(0,200));
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(900);
  await ev(`document.getElementById('mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(400);
  console.log("EARLY:", JSON.stringify(await ev(`(() => { const s=document.getElementById('mission'); const st=[...s.querySelectorAll('.mission-stats strong')].map(e=>e.textContent); const img=s.querySelector('.mission-art__image'); return { rev: s.dataset.revealed, active: s.dataset.active, stats: st, imgOpacity: getComputedStyle(s.querySelector('.mission-art')).opacity, clip: getComputedStyle(img).clipPath }; })()`)));
  await sleep(2400);
  console.log("SETTLED:", JSON.stringify(await ev(`(() => { const s=document.getElementById('mission'); const img=s.querySelector('.mission-art__image'); const art=s.querySelector('.mission-art').getBoundingClientRect(); const ir=img.getBoundingClientRect(); const h=s.querySelector('.mission-heading'); return { rev: s.dataset.revealed, active: s.dataset.active, stats: [...s.querySelectorAll('.mission-stats strong')].map(e=>e.textContent), labels: getComputedStyle(s.querySelector('.mission-stats span')).opacity, clip: getComputedStyle(img).clipPath, imgTransform: getComputedStyle(img).transform.slice(0,40), art: [Math.round(art.width), Math.round(art.height)], img: [Math.round(ir.width), Math.round(ir.height)], artTransform: s.querySelector('.ms-art')?.style.transform, headingTransform: h.style.transform, lineY: getComputedStyle(s.querySelector('.ms-line__in')).transform, stopScale: getComputedStyle(s.querySelector('.ms-stop')).transform }; })()`)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/ms-desktop.png", Buffer.from(shot.data, "base64"));
  await ev(`document.getElementById('howitworks')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(900);
  console.log("OFFSCREEN:", JSON.stringify(await ev(`(() => { const s=document.getElementById('mission'); const z=s.querySelector('.ms-art__zoom'); const c=s.querySelector('.mission-section__cross'); return { active: s.dataset.active, zoom: getComputedStyle(z).animationPlayState, cross: getComputedStyle(c).animationPlayState, willChange: getComputedStyle(s.querySelector('.ms-art')).willChange }; })()`)));
  await ev(`document.getElementById('mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(700);
  console.log("RETURN:", JSON.stringify(await ev(`(() => { const s=document.getElementById('mission'); return { active: s.dataset.active, rev: s.dataset.revealed, zoom: getComputedStyle(s.querySelector('.ms-art__zoom')).animationPlayState, stats: [...s.querySelectorAll('.mission-stats strong')].map(e=>e.textContent) }; })()`)));
  console.log("OVERFLOW:", JSON.stringify(await ev(`({ x: document.documentElement.scrollWidth > innerWidth, w: document.documentElement.scrollWidth })`)));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(700);
  await ev(`document.getElementById('mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(1500);
  console.log("M390:", JSON.stringify(await ev(`(() => { const s=document.getElementById('mission'); const img=s.querySelector('.mission-art__image'); return { overflow: document.documentElement.scrollWidth > innerWidth, artTransform: s.querySelector('.ms-art')?.style.transform, clip: getComputedStyle(img).clipPath, stats: [...s.querySelectorAll('.mission-stats strong')].map(e=>e.textContent) }; })()`)));
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/ms-mobile.png", Buffer.from(shot2.data, "base64"));
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await sleep(1200);
  console.log("REDUCED:", JSON.stringify(await ev(`(() => { const s=document.getElementById('mission'); const img=s.querySelector('.mission-art__image'); return { stats: [...s.querySelectorAll('.mission-stats strong')].map(e=>e.textContent), clip: getComputedStyle(img).clipPath, anim: getComputedStyle(s.querySelector('.ms-art__zoom')).animationName, lineY: getComputedStyle(s.querySelector('.ms-line__in')).transform }; })()`)));
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
