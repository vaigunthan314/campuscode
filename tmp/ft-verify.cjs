const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9341", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9341/json/list")).json()).find(t => t.type === "page"); } catch {} }
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
  await sleep(900);
  await ev(`window.scrollTo(0, document.body.scrollHeight)`);
  await sleep(2200);
  const probe = `(() => {
    const f = document.querySelector('#footer');
    const mark = f.querySelector('.ft-mark');
    const word = f.querySelector('.ft-mark__word');
    const bottom = f.querySelector('.ft-bottom');
    const mr = mark.getBoundingClientRect(); const wr = word.getBoundingClientRect(); const br = bottom.getBoundingClientRect();
    const order = [...document.querySelectorAll('main > section, main > div, footer')].map(el => el.id || el.className.split(' ')[0]);
    const links = [...f.querySelectorAll('a')].map(a => (a.textContent || a.getAttribute('aria-label') || '').trim() + ' -> ' + a.getAttribute('href'));
    return {
      order,
      footerLast: f === document.body.lastElementChild.querySelector('footer') || !!f,
      revealed: f.dataset.revealed, active: f.dataset.active,
      footerH: Math.round(f.getBoundingClientRect().height),
      mark: { box: Math.round(mr.width), word: Math.round(wr.width), scrollW: word.scrollWidth, clientW: word.clientWidth, fontSize: getComputedStyle(word).fontSize },
      descenderInside: Math.round(wr.bottom) <= Math.round(mr.bottom),
      markBottomGapToDivider: Math.round(br.top - wr.bottom),
      bottomBar: [Math.round(br.width), Math.round(br.height)],
      time: f.querySelector('.ft-time').textContent,
      links,
      socials: [...f.querySelectorAll('.ft-social')].map(a => a.getAttribute('aria-label')),
      status: f.querySelector('.ft-status__signal').textContent.trim(),
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      scrollW: document.documentElement.scrollWidth, winW: window.innerWidth,
      bg: getComputedStyle(f).backgroundColor,
    };
  })()`;
  console.log("W1440:", JSON.stringify(await ev(probe), null, 1));
  let shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/ft-1440.png", Buffer.from(shot.data, "base64"));
  await ev(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(900);
  console.log("PAUSED:", JSON.stringify(await ev(`(() => { const f=document.querySelector('#footer'); return { active: f.dataset.active, arc: getComputedStyle(f.querySelector('.ft-arc__spin')).animationPlayState, ring: getComputedStyle(f.querySelector('.ft-status__ring')).animationPlayState }; })()`)));

  for (const [w, h, name] of [[1024, 800, "1024"], [390, 844, "390"]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await sleep(600);
    await ev(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(1400);
    console.log("W" + name + ":", JSON.stringify(await ev(`(() => { const f=document.querySelector('#footer'); const mark=f.querySelector('.ft-mark'); const word=f.querySelector('.ft-mark__word'); return { wordW: Math.round(word.getBoundingClientRect().width), markW: Math.round(mark.getBoundingClientRect().width), fontSize: getComputedStyle(word).fontSize, overflowX: document.documentElement.scrollWidth > window.innerWidth, scrollW: document.documentElement.scrollWidth, footerH: Math.round(f.getBoundingClientRect().height), socialsRow: [...f.querySelectorAll('.ft-social')].map(e=>Math.round(e.getBoundingClientRect().top)) }; })()`)));
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`tmp/ft-${name}.png`, Buffer.from(shot.data, "base64"));
  }
  console.log("ERRORS:", JSON.stringify(await ev(`window.__errs`)));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
