const { spawn } = require('child_process');
const fs = require('fs');
const logPath = '/tmp/campus-vite-launch-cjs.log';
const log = fs.openSync(logPath, 'a');
function logLine(l){ fs.writeSync(log, l + '\n'); console.log(l); }
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5174'], {
  cwd: '/Users/vaigunthansl/Desktop/Rebuild ',
  stdio: ['ignore', log, log],
  shell: false,
  env: { ...process.env, npm_config_yes: 'true' }
});
vite.on('spawn', () => logLine('SPAWNED pid=' + vite.pid));
vite.on('error', e => logLine('SPAWN ERROR ' + JSON.stringify(e)));
vite.on('exit', (code, sig) => logLine('EXITED code=' + code + ' sig=' + sig));
setInterval(() => {
  logLine('--- heartbeat ---');
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').slice(-6).join('\n');
  logLine('RECENT LOG:\n' + lines);
}, 3000);
