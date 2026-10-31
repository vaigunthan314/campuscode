const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9355", "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9355/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errs = [];
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails?.exception?.description || "").slice(0, 140)); if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + (m.params.args?.[0]?.value || m.params.args?.[0]?.description || "").slice(0,120)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send("Page.enable"); await send("Runtime.enable");
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5200);
  await ev(`document.querySelector('a.skip-link')?.click()`); await sleep(1500);
  await ev(`document.getElementById('experience').scrollIntoView()`); await sleep(1200);
  console.log("BEFORE:", JSON.stringify(await ev(`({ y: Math.round(scrollY), muted: document.querySelector('.xv-video')?.muted, src: document.querySelector('.xv-video')?.getAttribute('src'), duration: document.querySelector('.experience-video-meta span')?.textContent, ready: document.querySelector('.xv-video')?.readyState, error: document.querySelector('.xv-video')?.error?.code ?? null })`)));
  const rect = await ev(`(() => { const r=document.querySelector('.xv-surface').getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await sleep(1200);
  console.log("CLICK BOX:", JSON.stringify(await ev(`({ paused: document.querySelector('.xv-video').paused, playingClass: document.querySelector('.xv-surface').classList.contains('is-playing'), controls: !!document.querySelector('.xv-controls'), y: Math.round(scrollY), durationLabel: document.querySelector('.xv-controls__time')?.textContent.trim(), playOpacity: getComputedStyle(document.querySelector('.experience-play')).opacity })`)));
  console.log("SEEK/MUTE:", JSON.stringify(await ev(`(() => { const v=document.querySelector('.xv-video'); const s=document.querySelector('.xv-seek'); const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(s,'2'); s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); const m=[...document.querySelectorAll('.xv-btn')][0]; m.click(); return { currentTime: Math.round(v.currentTime*10)/10, muted: v.muted, label: m.textContent }; })()`)));
  await sleep(500);
  console.log("AFTER SEEK:", JSON.stringify(await ev(`({ currentTime: Math.round(document.querySelector('.xv-video').currentTime*10)/10, y: Math.round(scrollY) })`)));
  // Space toggles
  await ev(`document.querySelector('.xv-surface').focus()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
  await sleep(700);
  console.log("SPACE:", JSON.stringify(await ev(`({ paused: document.querySelector('.xv-video').paused, playVisible: getComputedStyle(document.querySelector('.experience-play')).opacity, y: Math.round(scrollY) })`)));
  // Enter toggles again
  await ev(`document.querySelector('.xv-surface').focus()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await sleep(800);
  console.log("ENTER:", JSON.stringify(await ev(`({ paused: document.querySelector('.xv-video').paused })`)));
  const shot = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync("tmp/xv-playing.png", Buffer.from(shot.data, "base64"));
  // Watch full story link
  await ev(`document.querySelector('.xv-video').pause(); window.scrollTo(0,0)`); await sleep(1200);
  await ev(`document.querySelector('.experience-watch-link').click()`); await sleep(1600);
  console.log("WATCH LINK:", JSON.stringify(await ev(`({ top: Math.round(document.getElementById('experience').getBoundingClientRect().top), paused: document.querySelector('.xv-video').paused })`)));
  // scroll away pauses
  await ev(`window.scrollTo(0, 0)`); await sleep(1500);
  console.log("OFFSCREEN:", JSON.stringify(await ev(`({ paused: document.querySelector('.xv-video').paused })`)));
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
