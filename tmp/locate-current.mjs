import fs from "node:fs";
const roots = ["backups/latest", "backups/campuscode-repair-20261030-011800", "backups/campuscode-repair-20261030-002400", "backups/how-book-20261030-004441"];
const target = fs.readFileSync("src/components/PageFlipBook.tsx");
const tSig = target.slice(0, 80).replace(/\s+/g, " ");
for (const r of roots) {
  try {
    const f = r + "/PageFlipBook.tsx";
    const c = fs.readFileSync(f);
    const cSig = c.slice(0, 80).replace(/\s+/g, " ");
    const atEnd = c.length === target.length ? c.slice(-200) === target.slice(-200) : false;
    console.log(r, "size", c.length, "headMatch", cSig === tSig, "tailMatch", atEnd);
  } catch {}
}
console.log("working PageFlipBook.tsx head:", tSig);
