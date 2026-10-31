const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9347", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9347/json/list")).json()).find(t => t.type === "page"); } catch {} }
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
  await sleep(5000);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`(() => { const b=[...document.querySelectorAll('a,button')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(1200);
  await ev(`window.scrollTo(0,0)`);
  await sleep(800);
  console.log("NAV:", JSON.stringify(await ev(`(() => { const n=document.querySelector('.nv-bar'); const cs=getComputedStyle(n); const r=n.getBoundingClientRect(); return { h: Math.round(r.height), top: Math.round(r.top), pos: cs.position, bg: cs.backgroundColor, border: cs.borderBottomWidth, links: [...n.querySelectorAll('.nv-link')].map(a=>a.textContent+'->'+a.getAttribute('href')), join: n.querySelector('.nv-join')?.getAttribute('href'), login: n.querySelector('.nv-login')?.textContent, underline: n.querySelector('.nv-underline')?.style.cssText, strip: document.querySelector('.nv-strip')?.innerText.replace(/\\n/g,' | '), burger: getComputedStyle(n.querySelector('.nv-burger')).display }; })()`)));
  console.log("IDS:", JSON.stringify(await ev(`['about','experience','howitworks','hackathons','mission','community','joincampuscode','footer'].map(id=>id+':'+!!document.getElementById(id))`)));
  console.log("DEAD #:", JSON.stringify(await ev(`[...document.querySelectorAll('a[href="#"]')].map(a=>a.textContent.trim()||a.getAttribute('aria-label'))`)));
  console.log("EXPLORE:", await ev(`document.querySelector('.hero-explore')?.getAttribute('href')`));
  // nav link scroll test
  await ev(`[...document.querySelectorAll('.nv-link')].find(a=>a.textContent.includes('HOW IT WORKS')).click()`);
  await sleep(1400);
  console.log("NAVCLICK:", JSON.stringify(await ev(`({ top: Math.round(document.getElementById('howitworks').getBoundingClientRect().top), hash: location.hash })`)));
  await ev(`[...document.querySelectorAll('.nv-link')].find(a=>a.textContent.includes('HACKATHONS')).click()`);
  await sleep(1400);
  console.log("NAVCLICK2:", JSON.stringify(await ev(`({ top: Math.round(document.getElementById('hackathons').getBoundingClientRect().top), active: document.querySelector('.nv-link.is-active')?.textContent })`)));
  console.log("OVERFLOW1440:", JSON.stringify(await ev(`({x: document.documentElement.scrollWidth>innerWidth, w: document.documentElement.scrollWidth})`)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/nav-1440.png", Buffer.from(shot.data, "base64"));
  // mobile
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(800);
  await ev(`window.scrollTo(0,0)`);
  await sleep(700);
  console.log("M:", JSON.stringify(await ev(`(() => { const n=document.querySelector('.nv-bar'); return { burger: getComputedStyle(n.querySelector('.nv-burger')).display, links: getComputedStyle(n.querySelector('.nv-links')).display, overflow: document.documentElement.scrollWidth>innerWidth }; })()`)));
  await ev(`document.querySelector('.nv-burger').click()`);
  await sleep(600);
  console.log("MENU OPEN:", JSON.stringify(await ev(`(() => { const p=document.querySelector('.nv-panel'); return { open: p.classList.contains('is-open'), display: getComputedStyle(p).display, locked: document.documentElement.style.overflow, focused: document.activeElement?.textContent?.trim().slice(0,20) }; })()`)));
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/nav-390.png", Buffer.from(shot2.data, "base64"));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await sleep(600);
  console.log("ESC:", JSON.stringify(await ev(`({ open: document.querySelector('.nv-panel').classList.contains('is-open'), locked: document.documentElement.style.overflow, focus: document.activeElement?.className })`)));
  console.log("OVERFLOW390:", JSON.stringify(await ev(`({x: document.documentElement.scrollWidth>innerWidth, w: document.documentElement.scrollWidth})`)));
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
