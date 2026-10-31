const { spawn } = require("child_process");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9337", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9337/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4500);
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.value;
  const errors = [];
  await ev(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); })()`);
  await ev(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b) b.click(); })()`);
  await sleep(800);
  await ev(`document.querySelector('#community')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(2000);
  const probe = `(() => {
    const c = document.querySelector('#community');
    const m = document.querySelector('#mission');
    const j = document.querySelector('#joincampuscode');
    const r = c.getBoundingClientRect();
    const order = [...document.querySelectorAll('main > section, main > div')].map(el => el.id || el.className.split(' ')[0]);
    const tiles = [...c.querySelectorAll('.net-tile')].map(t => Math.round(t.getBoundingClientRect().width));
    const core = c.querySelector('.net-core__tile').getBoundingClientRect();
    const beams = [...c.querySelectorAll('.net-beam')].map(p => p.getAttribute('d').split(' ').slice(0, 2).join(' '));
    return {
      order,
      id: c.id,
      active: c.dataset.active,
      height: Math.round(r.height),
      minH: getComputedStyle(c).minHeight,
      bg: getComputedStyle(c).backgroundColor,
      missionBottom: Math.round(m.getBoundingClientRect().bottom),
      netTop: Math.round(r.top),
      netBottom: Math.round(r.bottom),
      joinTop: Math.round(j.getBoundingClientRect().top),
      tiles, coreTile: Math.round(core.width),
      ratio: +(core.width / tiles[0]).toFixed(2),
      beams: beams.length,
      beamEnds: beams,
      captions: c.querySelectorAll('.net-caption').length,
      labels: [...c.querySelectorAll('.net-tile__label')].map(e => e.textContent),
      stats: [...c.querySelectorAll('.net-stats__item')].map(e => e.textContent),
      exploreHref: c.querySelector('.net-explore').getAttribute('href'),
      svgTags: c.querySelectorAll('svg').length,
      imgTags: document.querySelectorAll('#community img').length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      sectionLeftGap: Math.round(r.left), sectionWidth: Math.round(r.width),
      windowW: window.innerWidth,
      headingOpacity: getComputedStyle(c.querySelector('.net-heading')).opacity,
    };
  })()`;
  console.log("DESKTOP:", JSON.stringify(await ev(probe), null, 1));
  let shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/net-desktop.png", Buffer.from(shot.data, "base64"));

  // off-screen: animations must be paused
  await ev(`document.querySelector('#footer')?.scrollIntoView({behavior:'instant',block:'end'})`);
  await sleep(1200);
  console.log("OFFSCREEN:", JSON.stringify(await ev(`(() => { const c=document.querySelector('#community'); const b=c.querySelector('.net-beam'); return { active: c.dataset.active, playState: getComputedStyle(b).animationPlayState, floatState: getComputedStyle(c.querySelector('.net-float')).animationPlayState }; })()`)));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(700);
  await ev(`document.querySelector('#community')?.scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(1600);
  console.log("MOBILE:", JSON.stringify(await ev(`(() => { const c=document.querySelector('#community'); const r=c.getBoundingClientRect(); const t=c.querySelector('.net-tile').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), tile: Math.round(t.width), overflowX: document.documentElement.scrollWidth > window.innerWidth, beamsDisplay: getComputedStyle(c.querySelector('.net-beams')).display, heading: getComputedStyle(c.querySelector('.net-heading')).fontSize }; })()`)));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/net-mobile.png", Buffer.from(shot.data, "base64"));

  console.log("ERRORS:", JSON.stringify(await ev(`window.__errs`)));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
