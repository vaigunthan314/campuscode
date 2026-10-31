const { spawn } = require("child_process");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9338", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9338/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.value;
  await ev(`(() => { window.__errs=[]; window.addEventListener('error', e => window.__errs.push(String(e.message))); const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(900);
  await ev(`document.querySelector('#joincampuscode')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(2200);
  const probe = `(() => {
    const j = document.querySelector('#joincampuscode');
    const r = j.getBoundingClientRect();
    const order = [...document.querySelectorAll('main > section, main > div, footer')].map(el => el.id || el.className.split(' ')[0]);
    const cs = getComputedStyle(j);
    const outline = j.querySelector('.join-outline');
    const ocs = getComputedStyle(outline);
    const ring = j.querySelector('.join-ring').getBoundingClientRect();
    const head = j.querySelector('.join-headline').getBoundingClientRect();
    const orbit = j.querySelector('.join-ring__orbit');
    return {
      order,
      id: j.id,
      h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom),
      footerTop: Math.round(document.querySelector('#footer').getBoundingClientRect().top),
      netBottom: Math.round(document.querySelector('#community').getBoundingClientRect().bottom),
      bg: cs.backgroundColor, bgImage: cs.backgroundImage,
      ring: [Math.round(ring.width), Math.round(ring.height)],
      headline: [Math.round(head.width), Math.round(head.height)],
      outlineFamily: ocs.fontFamily, outlineStroke: ocs.webkitTextStrokeWidth,
      orbitAnim: getComputedStyle(orbit).animationName + ' ' + getComputedStyle(orbit).animationDuration,
      cornersVisible: [...j.querySelectorAll('.join-corner')].filter(c => getComputedStyle(c).display !== 'none').length,
      cornerOpacity: getComputedStyle(j.querySelector('.join-corner')).opacity,
      ctaHref: j.querySelector('.join-cta').getAttribute('href'),
      ctaMaxWidth: getComputedStyle(j.querySelector('.join-cta')).width,
      plus: j.querySelectorAll('.join-plus').length,
      squares: j.querySelectorAll('.join-square').length,
      revealed: j.dataset.revealed, active: j.dataset.active,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      scrollW: document.documentElement.scrollWidth, winW: window.innerWidth,
    };
  })()`;
  console.log("DESKTOP:", JSON.stringify(await ev(probe), null, 1));
  let shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/join-desktop.png", Buffer.from(shot.data, "base64"));

  // zoomed crop of the outlined word to inspect the stroke for inner seams
  const clip = await ev(`(() => { const e=document.querySelector('.join-line--two .join-line__inner').getBoundingClientRect(); return { x: Math.max(0,e.x-10), y: Math.max(0,e.y-10), width: Math.min(window.innerWidth, e.width+20), height: e.height+20 }; })()`);
  const zoom = await send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 2 } });
  fs.writeFileSync("tmp/join-outline-zoom.png", Buffer.from(zoom.data, "base64"));

  await ev(`document.querySelector('#footer')?.scrollIntoView({behavior:'instant',block:'end'})`);
  await sleep(1000);
  console.log("OFFSCREEN:", JSON.stringify(await ev(`(() => { const j=document.querySelector('#joincampuscode'); return { active: j.dataset.active, orbit: getComputedStyle(j.querySelector('.join-ring__orbit')).animationPlayState, plus: getComputedStyle(j.querySelector('.join-plus')).animationPlayState }; })()`)));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(700);
  await ev(`document.querySelector('#joincampuscode')?.scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(1600);
  console.log("MOBILE:", JSON.stringify(await ev(`(() => { const j=document.querySelector('#joincampuscode'); const r=j.getBoundingClientRect(); const h=j.querySelector('.join-headline').getBoundingClientRect(); const cta=j.querySelector('.join-cta').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), head: Math.round(h.width), cta: Math.round(cta.width), corners: [...j.querySelectorAll('.join-corner')].filter(c=>getComputedStyle(c).display!=='none').length, overflowX: document.documentElement.scrollWidth > window.innerWidth, scrollW: document.documentElement.scrollWidth }; })()`)));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/join-mobile.png", Buffer.from(shot.data, "base64"));
  console.log("ERRORS:", JSON.stringify(await ev(`window.__errs`)));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
