const fs = require("node:fs");
const roots = ["backups/latest", "backups/campuscode-repair-20261030-011800", "backups/campuscode-repair-20261030-002400", "backups/how-book-20261030-004441"];
const target = fs.readFileSync("src/components/PageFlipBook.tsx", "utf8");
const tHead = target.slice(0, 80).replace(/\s+/g, " ");
const tTail = target.slice(-200);
for (const r of roots) {
  try {
    const c = fs.readFileSync(r + "/PageFlipBook.tsx", "utf8");
    const cHead = c.slice(0, 80).replace(/\s+/g, " ");
    const cTail = c.slice(-200);
    console.log(r, "size", c.length, "headMatch", cHead === tHead, "tailMatch", cTail === tTail);
  } catch (e) {
    console.log(r, "missing");
  }
}
console.log("WORKING current PageFlipBook.tsx head:", tHead);
