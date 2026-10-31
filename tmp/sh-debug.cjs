const { spawn } = require("child_process");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9344", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://127.0.0.1:9344/json/list")).json()).find(t => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const logs = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Runtime.consoleAPICalled") logs.push("console:" + (m.params.args||[]).map(a => a.value ?? a.description ?? "").join(" ").slice(0,300));
    if (m.method === "Runtime.exceptionThrown") logs.push("EXC:" + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").slice(0,400));
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(5000);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
  console.log("BODY:", JSON.stringify(await ev(`({ html: document.body.innerHTML.length, root: document.getElementById('root')?.children.length, text: (document.body.innerText||'').slice(0,160) })`)));
  console.log("LOG:", JSON.stringify(logs.slice(-8), null, 1));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("tmp/sh-debug.png", Buffer.from(shot.data, "base64"));
  ws.close(); chrome.kill();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
