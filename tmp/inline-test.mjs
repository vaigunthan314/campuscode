const { execSync } = require("node:child_process");
const cwd = ".";
const env = Object.assign({}, process.env, { CI: "1" });
try {
  console.log("=== typecheck ===");
  execSync("npx tsc -b --pretty false", { cwd, env, maxBuffer: 200 * 1024 * 1024, stdio: "inherit" });
  console.log("typecheck_exit=0");
} catch (e) {
  console.log("typecheck_exit=" + (e.status || 1));
}
try {
  console.log("=== build ===");
  execSync("npx vite build", { cwd, env, maxBuffer: 200 * 1024 * 1024, stdio: "inherit" });
  console.log("build_exit=0");
} catch (e) {
  console.log("build_exit=" + (e.status || 1));
}
