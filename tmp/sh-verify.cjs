const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9343", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9343/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  await ev(`(() => { window.__errs=[]; window.addEventListener('error', e=>window.__errs.push(String(e.message))); const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(1000);
  // walk the page so every header's observer fires
  const sections = ["about","experience","howitworks","hackathons","mission","community","joincampuscode"];
  for (const s of sections) { await ev(`document.getElementById('${s}')?.scrollIntoView({behavior:'instant',block:'center'})`); await sleep(700); }
  console.log("EYEBROWS:", JSON.stringify(await ev(`[...document.querySelectorAll('.sh-eyebrow__label')].map(e => e.textContent.trim())`)));
  console.log("H1:", JSON.stringify(await ev(`[...document.querySelectorAll('h1')].map(e => (e.textContent||'').trim().slice(0,40))`)));
  console.log("H2COUNT:", await ev(`document.querySelectorAll('h2').length`));
  console.log("HEADERS:", JSON.stringify(await ev(`[...document.querySelectorAll('.sh-header')].map(h => ({ v: h.className.includes('--eyebrow') ? 'eyebrow' : 'full', vis: h.classList.contains('is-visible'), title: (h.querySelector('.sh-title')?.textContent||'').trim(), sub: (h.querySelector('.sh-subtitle')?.textContent||'').trim(), left: Math.round(h.getBoundingClientRect().left) }))`)));
  console.log("OVERFLOW: ", JSON.stringify(await ev(`({ x: document.documentElement.scrollWidth > window.innerWidth, w: document.documentElement.scrollWidth })`)));
  for (const [id, name] of [["experience","experience"],["howitworks","how"],["hackathons","arena"]]) {
    await ev(`document.getElementById('${id}')?.scrollIntoView({behavior:'instant',block:'start'})`);
    await sleep(900);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`tmp/sh-${name}.png`, Buffer.from(shot.data, "base64"));
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(700);
  await ev(`document.getElementById('experience')?.scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(1000);
  console.log("M390:", JSON.stringify(await ev(`({ overflow: document.documentElement.scrollWidth > window.innerWidth, w: document.documentElement.scrollWidth, rows: [...document.querySelectorAll('.sh-eyebrow__label')].map(e => Math.round(e.getBoundingClientRect().width)) })`)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/sh-mobile.png", Buffer.from(shot.data, "base64"));
  console.log("ERRORS:", JSON.stringify(await ev(`window.__errs`)));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
