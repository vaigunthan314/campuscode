const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9354", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9354/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errs = [];
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails?.exception?.description || "").slice(0, 160)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send("Page.enable"); await send("Runtime.enable");
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
  const shot = async (f) => { const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(f, Buffer.from(s.data, "base64")); };
  const fill = `(el,v)=>{const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}`;

  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5200);
  await ev(`document.querySelector('a.skip-link')?.click()`); await sleep(1500);
  console.log("HOME:", JSON.stringify(await ev(`({ title: document.title, navLogin: document.querySelector('.nv-login')?.getAttribute('href'), navJoin: document.querySelector('.nv-join')?.getAttribute('href'), joinCta: document.querySelector('.join-cta')?.getAttribute('href'), about: !!document.getElementById('about') })`)));
  await ev(`document.querySelector('.nv-login').click()`); await sleep(1200);
  console.log("LOGIN ROUTE:", JSON.stringify(await ev(`({ path: location.pathname, title: document.title, page: !!document.querySelector('.auth-page'), heading: document.querySelector('.auth-card__title')?.textContent, breadcrumb: document.querySelector('.auth-breadcrumb')?.textContent.trim() })`)));
  await shot("tmp/auth-login.png");
  // empty submit
  await ev(`document.querySelector('.auth-submit').click()`); await sleep(600);
  console.log("EMPTY SUBMIT:", JSON.stringify(await ev(`({ errors: [...document.querySelectorAll('.auth-error')].map(e=>e.textContent), focus: document.activeElement?.id, invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map(e=>e.id) })`)));
  // wrong captcha
  await ev(`(() => { const f=${fill}; f(document.getElementById('email'),'student@campus.edu'); f(document.getElementById('password'),'hunter2pass'); f(document.getElementById('captcha'),'00000'); })()`); await sleep(300);
  await ev(`document.querySelector('.auth-submit').click()`); await sleep(700);
  console.log("WRONG CAPTCHA:", JSON.stringify(await ev(`({ captchaErr: document.getElementById('captcha-error')?.textContent, notice: !!document.querySelector('.auth-notice'), state: document.querySelector('.auth-ready')?.dataset.state })`)));
  // correct captcha
  await ev(`(() => { const f=${fill}; const code=[...document.querySelectorAll('.auth-captcha__digit')].map(t=>t.textContent).join(''); f(document.getElementById('captcha'), code); })()`); await sleep(300);
  await ev(`document.querySelector('.auth-submit').click()`); await sleep(900);
  console.log("VALID SUBMIT:", JSON.stringify(await ev(`({ notice: document.querySelector('.auth-notice')?.textContent, emptyPw: !!document.querySelector('.auth-error') })`)));
  // register
  await ev(`document.querySelector('.auth-switch .auth-link').click()`); await sleep(1200);
  console.log("REGISTER ROUTE:", JSON.stringify(await ev(`({ path: location.pathname, title: document.title, card: document.querySelector('.auth-card__title')?.textContent, types: [...document.querySelectorAll('#accountType option')].map(o=>o.value), note: !!document.querySelector('.auth-note a[href^="mailto:"]') })`)));
  await ev(`(() => { const f=${fill}; f(document.getElementById('password'),'abc12345'); })()`); await sleep(400);
  console.log("STRENGTH:", JSON.stringify(await ev(`({ on: document.querySelectorAll('.auth-strength i.is-on').length })`)));
  await shot("tmp/auth-register.png");
  await ev(`document.querySelector('.auth-submit').click()`); await sleep(700);
  console.log("REG ERRORS:", JSON.stringify(await ev(`([...document.querySelectorAll('.auth-error')].map(e=>e.textContent))`)));
  // back / forward
  await ev(`history.back()`); await sleep(1200);
  console.log("BACK:", JSON.stringify(await ev(`({ path: location.pathname, title: document.title, page: !!document.querySelector('.auth-page') })`)));
  await ev(`history.forward()`); await sleep(1200);
  console.log("FORWARD:", JSON.stringify(await ev(`({ path: location.pathname, card: document.querySelector('.auth-card__title')?.textContent })`)));
  // logo back home
  await ev(`document.querySelector('.auth-logo').click()`); await sleep(5600);
  await ev(`document.querySelector('a.skip-link')?.click()`); await sleep(1400);
  console.log("HOME AGAIN:", JSON.stringify(await ev(`({ path: location.pathname, title: document.title, about: !!document.getElementById('about'), nav: !!document.querySelector('.nv-bar') })`)));
  await ev(`[...document.querySelectorAll('.nv-link')].find(a=>a.textContent.includes('HOW IT WORKS')).click()`); await sleep(1500);
  console.log("ANCHOR:", JSON.stringify(await ev(`Math.round(document.getElementById('howitworks').getBoundingClientRect().top)`)));
  // direct load /login (refresh case)
  await send("Page.navigate", { url: "http://127.0.0.1:5173/login" });
  await sleep(3000);
  console.log("DIRECT /login:", JSON.stringify(await ev(`({ path: location.pathname, page: !!document.querySelector('.auth-page'), title: document.title })`)));
  // mobile
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: "http://127.0.0.1:5173/register" });
  await sleep(3000);
  console.log("M390 register:", JSON.stringify(await ev(`({ overflow: document.documentElement.scrollWidth > innerWidth, sw: document.documentElement.scrollWidth, cardFirst: (()=>{const c=document.querySelector('.auth-card').getBoundingClientRect(); const t=document.querySelector('.auth-title').getBoundingClientRect(); return c.top < t.top;})() })`)));
  await shot("tmp/auth-register-390.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://127.0.0.1:5173/login" });
  await sleep(2500);
  console.log("M1024:", JSON.stringify(await ev(`({ overflow: document.documentElement.scrollWidth > innerWidth })`)));
  console.log("ERRS:", JSON.stringify(errs));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
