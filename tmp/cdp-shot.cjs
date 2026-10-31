const { spawn } = require("child_process");
const fs = require("fs");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;

(async () => {
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--hide-scrollbars",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ], { stdio: "ignore" });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === "page");
    } catch {}
  }
  if (!target) { chrome.kill(); throw new Error("no chrome target"); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) =>
    new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(4000);

  const evaluate = async (expression) => {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true });
    return res.result?.value;
  };

  const skip = await evaluate(`(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/skip/i.test(e.textContent||'')); if(b){b.click(); return true;} return false; })()`);
  await sleep(1200);
  await evaluate(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'center'})`);
  await sleep(1800);

  const info = await evaluate(`(() => {
    const s = document.querySelector('#mission');
    if (!s) return { error: 'no #mission' };
    const r = s.getBoundingClientRect();
    const copy = s.querySelector('.mission-copy');
    const art = s.querySelector('.mission-art');
    const h = s.querySelector('.mission-heading');
    const cs = getComputedStyle(s);
    return {
      skipped: ${'true'},
      size: [Math.round(r.width), Math.round(r.height)],
      display: cs.display,
      columns: cs.gridTemplateColumns,
      copyW: copy ? Math.round(copy.getBoundingClientRect().width) : null,
      artW: art ? Math.round(art.getBoundingClientRect().width) : null,
      headingPx: h ? getComputedStyle(h).fontSize : null,
      headingOpacity: h ? getComputedStyle(h).opacity : null,
      revealed: s.dataset.revealed,
      canvases: s.querySelectorAll('canvas').length,
      img: !!s.querySelector('.mission-art__image'),
      stats: [...s.querySelectorAll('.mission-stats li')].map(li=>li.textContent.trim()),
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      bg: cs.backgroundColor,
    };
  })()`);
  console.log("SKIP_CLICKED:", skip);
  console.log("INFO:", JSON.stringify(info, null, 1));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-new.png", Buffer.from(shot.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(600);
  await evaluate(`document.querySelector('#mission')?.scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(1200);
  const mob = await evaluate(`(() => { const s=document.querySelector('#mission'); const r=s.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), artH: Math.round((s.querySelector('.mission-art')||{getBoundingClientRect:()=>({height:0})}).getBoundingClientRect().height), overflowX: document.documentElement.scrollWidth > window.innerWidth }; })()`);
  console.log("MOBILE:", JSON.stringify(mob));
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/mission-new-mobile.png", Buffer.from(shot2.data, "base64"));

  ws.close();
  chrome.kill();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
