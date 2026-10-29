import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Page data                                                          */
/* ------------------------------------------------------------------ */

const PURPLE = "#7455ff";
const INK = "#111111";
const GREY = "#6e6e69";
const SOFT = "#9a9a94";
const HAIR = "#e6e6e1";

type PageDef = {
  short: string;
  headline: string;
  body: string;
  note: string;
  caption: string;
};

const PAGES: PageDef[] = [
  {
    short: "01",
    headline: "DISCOVER",
    body: "Find a challenge that makes you want to build.",
    note: "A good brief does not ask for more features. It asks for a clearer point of view.",
    caption: "OPEN CALLS  ·  SPRING 2026",
  },
  {
    short: "02",
    headline: "TEAM UP",
    body: "Find people who share your ambition.",
    note: "The strongest teams are rarely the largest. They are the ones that argue well.",
    caption: "TEAM SIZE  ·  2 TO 4",
  },
  {
    short: "03",
    headline: "BUILD",
    body: "Turn your idea into something people can use.",
    note: "Ship the smallest complete thing. Then make it honest, fast and readable.",
    caption: "BUILD WINDOW  ·  36 HOURS",
  },
  {
    short: "04",
    headline: "SHIP",
    body: "Submit your work and take it to the arena.",
    note: "A finished idea you can demonstrate beats a perfect one you cannot.",
    caption: "SUBMISSION  ·  ONE LINK",
  },
];

const LABELS = ["CLOSED", "01 — DISCOVER", "02 — TEAM UP", "03 — BUILD", "04 — SHIP"];
const LAST = LABELS.length - 1;

/* ------------------------------------------------------------------ */
/*  Book dimensions                                                    */
/* ------------------------------------------------------------------ */

const PW = 1.5; // page width
const PH = 2.05; // page height (depth in the scene)
const T = 0.015; // one sheet
const SHEETS = 5; // front cover + 4 leaves
const THICK = SHEETS * T;
const TURN_MS = 950;
const GESTURE_GAP = 620;

/* ------------------------------------------------------------------ */
/*  Canvas textures                                                    */
/* ------------------------------------------------------------------ */

const TEX_W = 1024;
const TEX_H = 1400;

type PageTexture = {
  tex: THREE.CanvasTexture;
  mirrored: THREE.CanvasTexture;
  redraw: () => void;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  tracking: number,
) {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + tracking;
  total -= tracking;
  let x = centerX - total / 2;
  ctx.textAlign = "left";
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + tracking;
  }
}

function pageFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gutter: "left" | "right",
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#eeeee9";
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  const band = w * 0.18;
  const gutterGradient =
    gutter === "left"
      ? ctx.createLinearGradient(0, 0, band, 0)
      : ctx.createLinearGradient(w, 0, w - band, 0);
  gutterGradient.addColorStop(0, "rgba(17,17,17,0.11)");
  gutterGradient.addColorStop(0.35, "rgba(17,17,17,0.03)");
  gutterGradient.addColorStop(1, "rgba(17,17,17,0)");
  ctx.fillStyle = gutterGradient;
  ctx.fillRect(0, 0, w, h);

  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, "rgba(17,17,17,0.035)");
  edge.addColorStop(0.08, "rgba(17,17,17,0)");
  edge.addColorStop(0.92, "rgba(17,17,17,0)");
  edge.addColorStop(1, "rgba(17,17,17,0.055)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
}

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = "#f6f6f3";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = "#e4e4de";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
) {
  ctx.font = "500 16px 'DM Mono', monospace";
  const w = ctx.measureText(label).width + 30;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, 30, 5);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + 16);
  ctx.textBaseline = "top";
  return w;
}

function drawDiscover(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const gap = 22;
  const cw = (w - gap - 44) / 2;
  const cards = [
    { tag: "AI", title: "AI Innovation", meta: "MAR 15—17  ·  248 BUILDERS" },
    { tag: "WEB", title: "Future Web", meta: "APR 05—07  ·  186 BUILDERS" },
  ];
  cards.forEach((card, i) => {
    const cx = x + 22 + i * (cw + gap);
    const cy = y + 22;
    const ch = h - 44;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, cx, cy, cw, ch, 8);
    ctx.fill();
    ctx.strokeStyle = "#e4e4de";
    ctx.lineWidth = 2;
    roundRect(ctx, cx, cy, cw, ch, 8);
    ctx.stroke();

    pill(ctx, cx + 20, cy + 20, card.tag, PURPLE);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = INK;
    ctx.font = "800 38px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(card.title, cx + 20, cy + 72);

    ctx.fillStyle = SOFT;
    ctx.font = "19px 'DM Mono', monospace";
    ctx.fillText(card.meta, cx + 20, cy + 124);

    ctx.fillStyle = "#ececE6";
    for (let l = 0; l < 4; l++) {
      ctx.fillRect(cx + 20, cy + 176 + l * 24, cw - 40 - (l === 3 ? 90 : 0), 8);
    }

    ctx.fillStyle = PURPLE;
    ctx.fillRect(cx + 20, cy + ch - 74, 42, 5);
    ctx.fillStyle = GREY;
    ctx.font = "19px 'DM Mono', monospace";
    ctx.fillText("OPEN", cx + 72, cy + ch - 84);
  });
}

function drawTeamUp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const people = [
    { initials: "PS", name: "Priya S.", role: "FULL STACK", accent: true },
    { initials: "MK", name: "Marcus K.", role: "AI / ML", accent: false },
    { initials: "AR", name: "Ayesha R.", role: "DESIGN", accent: false },
  ];
  const size = 82;
  people.forEach((person, i) => {
    const cx = x + 26 + i * (size + 76);
    const cy = y + 34;
    ctx.fillStyle = person.accent ? PURPLE : "#111111";
    ctx.beginPath();
    ctx.arc(cx + size / 2, cy + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 26px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(person.initials, cx + size / 2, cy + size / 2 + 1);

    ctx.fillStyle = INK;
    ctx.font = "600 20px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(person.name, cx + size / 2, cy + size + 14);
    ctx.fillStyle = SOFT;
    ctx.font = "16px 'DM Mono', monospace";
    ctx.fillText(person.role, cx + size / 2, cy + size + 42);
  });

  const cardX = x + 26;
  const cardY = y + 210;
  const cardW = w - 52;
  const cardH = h - 236;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 8);
  ctx.fill();
  ctx.strokeStyle = "#e4e4de";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 8);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = INK;
  ctx.font = "700 24px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("Team workspace", cardX + 24, cardY + 22);
  ctx.fillStyle = SOFT;
  ctx.font = "17px 'DM Mono', monospace";
  ctx.fillText("3 MEMBERS ACTIVE  ·  INVITE OPEN", cardX + 24, cardY + 58);

  const repos = ["campus-app", "ml-engine", "design-ui"];
  repos.forEach((repo, i) => {
    const ry = cardY + 104 + i * 34;
    ctx.fillStyle = PURPLE;
    ctx.fillRect(cardX + 24, ry + 4, 8, 8);
    ctx.fillStyle = GREY;
    ctx.font = "19px 'DM Mono', monospace";
    ctx.fillText(repo, cardX + 46, ry);
  });
}

function drawBuild(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const editorW = w * 0.54;
  const editorH = h - 44;
  const ex = x + 22;
  const ey = y + 22;

  ctx.fillStyle = "#141414";
  roundRect(ctx, ex, ey, editorW, editorH, 8);
  ctx.fill();

  ["#e6e6e1", "#8a8a84", "#4b4b46"].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ex + 22 + i * 18, ey + 24, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const code = [
    "import { arena } from '@campuscode'",
    "",
    "const project = arena.create({",
    '  track: "ai-innovation",',
    '  team: "dev-team-01",',
    "})",
    "",
    "project.deploy()",
  ];
  ctx.fillStyle = "#b8b8b2";
  ctx.font = "17px 'DM Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  code.forEach((line, i) => ctx.fillText(line, ex + 22, ey + 58 + i * 26));

  ctx.fillStyle = PURPLE;
  roundRect(ctx, ex + editorW - 128, ey + 46, 106, 30, 5);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 14px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AI ASSIST", ex + editorW - 75, ey + 62);

  const px = ex + editorW + 22;
  const pw = w - (px - x) - 22;
  const ph = editorH;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, px, ey, pw, ph, 8);
  ctx.fill();
  ctx.strokeStyle = "#e4e4de";
  ctx.lineWidth = 2;
  roundRect(ctx, px, ey, pw, ph, 8);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = INK;
  ctx.font = "700 22px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("CampusCode App", px + 20, ey + 24);

  ctx.fillStyle = "#f0f0ea";
  ctx.fillRect(px + 20, ey + 66, pw - 40, 6);

  ctx.fillStyle = INK;
  roundRect(ctx, px + 20, ey + 92, pw - 40, 34, 5);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 14px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUILD PROJECT", px + pw / 2, ey + 110);

  const stats = [
    { value: "12", label: "ISSUES" },
    { value: "08", label: "SOLVED" },
    { value: "04", label: "TESTS" },
  ];
  const sw = (pw - 40) / 3;
  stats.forEach((stat, i) => {
    const sx = px + 20 + i * sw;
    ctx.fillStyle = "#f4f4ef";
    ctx.fillRect(sx, ey + 148, sw - 8, 82);
    ctx.fillStyle = INK;
    ctx.font = "800 30px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(stat.value, sx + 12, ey + 162);
    ctx.fillStyle = SOFT;
    ctx.font = "13px 'DM Mono', monospace";
    ctx.fillText(stat.label, sx + 12, ey + 202);
  });

  ctx.fillStyle = PURPLE;
  ctx.fillRect(px + 20, ey + 262, 56, 5);
  ctx.fillStyle = GREY;
  ctx.font = "16px 'DM Mono', monospace";
  ctx.fillText("ASSISTANT READY", px + 90, ey + 256);
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cardX = x + 22;
  const cardY = y + 22;
  const cardW = w - 44;
  const cardH = h - 44;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 8);
  ctx.fill();
  ctx.strokeStyle = "#e4e4de";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 8);
  ctx.stroke();

  const cx = cardX + cardW / 2;

  // medal
  ctx.fillStyle = PURPLE;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cardY + 40);
  ctx.lineTo(cx + 26, cardY + 40);
  ctx.lineTo(cx + 17, cardY + 74);
  ctx.lineTo(cx, cardY + 92);
  ctx.lineTo(cx - 17, cardY + 74);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2605", cx, cardY + 60);

  ctx.fillStyle = INK;
  ctx.font = "800 36px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Ready to ship", cx, cardY + 112);

  ctx.fillStyle = GREY;
  ctx.font = "19px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  const lines = wrapLines(ctx, "Your project is complete and ready for the arena.", cardW - 80);
  lines.forEach((line, i) => ctx.fillText(line, cx, cardY + 164 + i * 28));

  ctx.fillStyle = INK;
  roundRect(ctx, cx - 150, cardY + 238, 300, 44, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 16px 'DM Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2192  SUBMIT TO ARENA", cx, cardY + 260);

  const checks = ["BUILD", "TESTS", "REVIEW"];
  const stepW = (cardW - 80) / 3;
  checks.forEach((label, i) => {
    const sx = cardX + 40 + i * stepW + stepW / 2;
    const sy = cardY + cardH - 90;
    ctx.fillStyle = i < 2 ? PURPLE : "#dededa";
    ctx.beginPath();
    ctx.arc(sx, sy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i < 2 ? "#ffffff" : "#8a8a84";
    ctx.font = "700 15px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(i < 2 ? "\u2713" : "\u2026", sx, sy + 1);
    ctx.fillStyle = SOFT;
    ctx.font = "14px 'DM Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(label, sx, sy + 26);
  });
}

function drawPageFront(ctx: CanvasRenderingContext2D, w: number, h: number, index: number) {
  const page = PAGES[index];
  pageFrame(ctx, w, h, "left");
  const pad = 76;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#9a9a94";
  ctx.font = "24px 'DM Mono', monospace";
  ctx.fillText("CAMPUSCODE  ·  HOW IT WORKS", pad, 70);

  ctx.textAlign = "right";
  ctx.fillStyle = PURPLE;
  ctx.fillText(page.short, w - pad, 70);

  ctx.fillStyle = HAIR;
  ctx.fillRect(pad, 128, w - pad * 2, 2);

  ctx.fillStyle = PURPLE;
  ctx.fillRect(pad, 174, 128, 6);

  ctx.textAlign = "left";
  ctx.fillStyle = PURPLE;
  ctx.font = "600 30px 'DM Mono', monospace";
  ctx.fillText(page.short, pad, 214);

  ctx.fillStyle = INK;
  ctx.font = "900 102px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(page.headline, pad - 5, 258);

  ctx.fillStyle = "#585853";
  ctx.font = "500 35px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  const lines = wrapLines(ctx, page.body, w - pad * 2 - 60);
  lines.forEach((line, i) => ctx.fillText(line, pad, 398 + i * 48));

  ctx.fillStyle = HAIR;
  ctx.fillRect(pad, 508, w - pad * 2, 2);

  const ix = pad;
  const iy = 542;
  const iw = w - pad * 2;
  const ih = 556;
  panel(ctx, ix, iy, iw, ih);
  if (index === 0) drawDiscover(ctx, ix, iy, iw, ih);
  else if (index === 1) drawTeamUp(ctx, ix, iy, iw, ih);
  else if (index === 2) drawBuild(ctx, ix, iy, iw, ih);
  else drawShip(ctx, ix, iy, iw, ih);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#adada6";
  ctx.font = "22px 'DM Mono', monospace";
  ctx.fillText("CAMPUSCODE  ·  2026", pad, h - 96);

  ctx.textAlign = "right";
  ctx.fillStyle = PURPLE;
  ctx.fillText(page.short, w - pad, h - 96);
}

function drawPageBack(ctx: CanvasRenderingContext2D, w: number, h: number, index: number) {
  const page = PAGES[index];
  pageFrame(ctx, w, h, "right");
  const pad = 76;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#9a9a94";
  ctx.font = "24px 'DM Mono', monospace";
  ctx.fillText("NOTES", pad, 70);

  ctx.textAlign = "right";
  ctx.fillStyle = PURPLE;
  ctx.fillText(page.short, w - pad, 70);

  ctx.fillStyle = HAIR;
  ctx.fillRect(pad, 128, w - pad * 2, 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#f1f1ec";
  ctx.font = "900 330px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(page.short, pad - 20, 150);

  ctx.fillStyle = PURPLE;
  ctx.fillRect(pad, 520, 150, 6);

  ctx.fillStyle = INK;
  ctx.font = "600 44px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  const lines = wrapLines(ctx, page.note, w - pad * 2 - 40);
  lines.forEach((line, i) => ctx.fillText(line, pad, 566 + i * 62));

  ctx.fillStyle = HAIR;
  ctx.fillRect(pad, 830, w - pad * 2, 2);

  ctx.fillStyle = SOFT;
  ctx.font = "20px 'DM Mono', monospace";
  ctx.fillText(page.caption, pad, 866);
  ctx.fillText("CAMPUSCODE  ·  HOW IT WORKS", pad, 902);

  ctx.textAlign = "left";
  ctx.fillStyle = "#adada6";
  ctx.font = "22px 'DM Mono', monospace";
  ctx.fillText("CAMPUSCODE  ·  2026", pad, h - 96);
}

function drawCoverFront(ctx: CanvasRenderingContext2D, w: number, h: number) {
  pageFrame(ctx, w, h, "left");

  ctx.textBaseline = "top";
  ctx.fillStyle = "#8f8f89";
  ctx.font = "600 30px 'DM Mono', monospace";
  tracked(ctx, "CAMPUSCODE", w / 2, 96, 14);

  ctx.fillStyle = PURPLE;
  ctx.fillRect(w / 2 - 54, 168, 108, 4);

  ctx.fillStyle = INK;
  ctx.font = "900 148px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HOW IT", w / 2, 268);
  ctx.fillText("WORKS", w / 2, 418);

  ctx.fillStyle = "#c9c9c2";
  ctx.font = "22px 'DM Mono', monospace";
  tracked(ctx, "BUILD  ·  COMPETE  ·  SHIP", w / 2, 620, 8);

  ctx.strokeStyle = "#e6e6e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 210, 736);
  ctx.lineTo(w / 2 + 210, 736);
  ctx.stroke();

  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(w / 2, 900, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 62px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CC", w / 2, 904);

  ctx.fillStyle = "#8f8f89";
  ctx.font = "600 24px 'DM Mono', monospace";
  ctx.textBaseline = "top";
  tracked(ctx, "STUDENT HACKATHON ARENA", w / 2, 1042, 6);

  ctx.textAlign = "left";
  ctx.fillStyle = "#adada6";
  ctx.font = "22px 'DM Mono', monospace";
  ctx.fillText("FOLIO 03", 76, h - 96);
  ctx.textAlign = "right";
  ctx.fillStyle = PURPLE;
  ctx.fillText("2026", w - 76, h - 96);
}

function drawCoverInside(ctx: CanvasRenderingContext2D, w: number, h: number) {
  pageFrame(ctx, w, h, "right");
  const pad = 76;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#9a9a94";
  ctx.font = "24px 'DM Mono', monospace";
  ctx.fillText("CAMPUSCODE", pad, 70);

  ctx.fillStyle = HAIR;
  ctx.fillRect(pad, 128, w - pad * 2, 2);

  ctx.fillStyle = INK;
  ctx.font = "900 96px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("THE", pad, 216);
  ctx.fillText("FOLIO", pad, 320);

  ctx.fillStyle = PURPLE;
  ctx.fillRect(pad, 452, 128, 6);

  ctx.fillStyle = "#585853";
  ctx.font = "500 32px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  const body = wrapLines(
    ctx,
    "Four pages, one loop: find the brief, find the people, build the thing, take it to the arena.",
    w - pad * 2 - 40,
  );
  body.forEach((line, i) => ctx.fillText(line, pad, 496 + i * 46));

  ctx.fillStyle = HAIR;
  ctx.fillRect(pad, 700, w - pad * 2, 2);

  const steps = ["DISCOVER", "TEAM UP", "BUILD", "SHIP"];
  steps.forEach((step, i) => {
    const y = 742 + i * 62;
    ctx.fillStyle = PURPLE;
    ctx.font = "600 20px 'DM Mono', monospace";
    ctx.fillText(`0${i + 1}`, pad, y);
    ctx.fillStyle = INK;
    ctx.font = "600 30px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(step, pad + 82, y - 4);
    ctx.fillStyle = HAIR;
    ctx.fillRect(pad, y + 42, w - pad * 2, 2);
  });

  ctx.fillStyle = "#adada6";
  ctx.font = "22px 'DM Mono', monospace";
  ctx.fillText("CAMPUSCODE  ·  2026", pad, h - 96);
}

function createPageTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): PageTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const mirrored = tex.clone();
  mirrored.wrapS = THREE.RepeatWrapping;
  mirrored.repeat.x = -1;
  mirrored.offset.x = 1;
  mirrored.needsUpdate = true;

  const redraw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    draw(ctx, TEX_W, TEX_H);
    tex.needsUpdate = true;
    mirrored.needsUpdate = true;
  };

  redraw();
  return { tex, mirrored, redraw };
}

const coverFront = createPageTexture(drawCoverFront);
const coverInside = createPageTexture(drawCoverInside);
const pageFront = PAGES.map((_, i) => createPageTexture((ctx, w, h) => drawPageFront(ctx, w, h, i)));
const pageBack = PAGES.map((_, i) => createPageTexture((ctx, w, h) => drawPageBack(ctx, w, h, i)));

const ALL_TEXTURES = [coverFront, coverInside, ...pageFront, ...pageBack];

function edgesTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fbfbf9";
  ctx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "#e8e8e2" : "#f2f2ec";
    ctx.fillRect(0, y, 64, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 10);
  return tex;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PageFlipBook() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);

  const [state, setStateReact] = useState(0);
  const [turning, setTurningReact] = useState(false);
  const [reduced, setReduced] = useState(false);

  const reducedRef = useRef(false);
  const apiRef = useRef<{ next: () => boolean; prev: () => boolean } | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = query.matches;
      setReduced(query.matches);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const holder = holderRef.current;
    const stage = stageRef.current;
    if (!holder || !stage) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    holder.appendChild(renderer.domElement);

    /* ---- lighting ---- */
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(2.6, 5.4, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 18;
    key.shadow.camera.left = -3.2;
    key.shadow.camera.right = 3.2;
    key.shadow.camera.top = 3.2;
    key.shadow.camera.bottom = -3.2;
    key.shadow.bias = -0.0007;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 5;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(-3.4, 2.2, -1.6);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0xffffff, 0.58));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 0.3));

    /* ---- book ---- */
    const book = new THREE.Group();
    book.position.y = THICK / 2;
    scene.add(book);

    const edgeMap = edgesTexture();
    const edgeMat = new THREE.MeshStandardMaterial({
      map: edgeMap,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
    });
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e2,
      roughness: 0.95,
      metalness: 0,
    });

    const rightTopMat = new THREE.MeshStandardMaterial({
      map: coverFront.tex,
      roughness: 0.55,
      metalness: 0,
    });
    const leftTopMat = new THREE.MeshStandardMaterial({
      map: coverInside.tex,
      roughness: 0.55,
      metalness: 0,
    });

    const stackGeo = new THREE.BoxGeometry(PW, 1, PH);
    const rightStack = new THREE.Mesh(stackGeo, [
      edgeMat,
      edgeMat,
      bottomMat,
      bottomMat,
      edgeMat,
      edgeMat,
    ]);
    rightStack.position.set(PW / 2, -THICK / 2, 0);
    rightStack.scale.y = THICK;
    rightStack.castShadow = true;
    rightStack.receiveShadow = true;
    book.add(rightStack);

    const leftStack = new THREE.Mesh(stackGeo, [
      edgeMat,
      edgeMat,
      bottomMat,
      bottomMat,
      edgeMat,
      edgeMat,
    ]);
    leftStack.position.set(-PW / 2, -T / 2, 0);
    leftStack.scale.y = T;
    leftStack.castShadow = true;
    leftStack.receiveShadow = true;
    leftStack.visible = false;
    book.add(leftStack);

    const topGeo = new THREE.PlaneGeometry(PW, PH);
    topGeo.rotateX(-Math.PI / 2);

    const rightPage = new THREE.Mesh(topGeo, rightTopMat);
    rightPage.position.set(PW / 2, 0.0025, 0);
    rightPage.receiveShadow = true;
    book.add(rightPage);

    const leftPage = new THREE.Mesh(topGeo, leftTopMat);
    leftPage.position.set(-PW / 2, 0.0025, 0);
    leftPage.receiveShadow = true;
    book.add(leftPage);

    // spine
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, THICK, PH),
      new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.85, metalness: 0 }),
    );
    spine.position.set(0, -THICK / 2, 0);
    spine.castShadow = true;
    spine.receiveShadow = true;
    book.add(spine);

    /* ---- turning leaf ---- */
    const SEG_X = 44;
    const SEG_Z = 16;
    const leafGeo = new THREE.BufferGeometry();
    const vertCount = (SEG_X + 1) * (SEG_Z + 1);
    const baseX = new Float32Array(vertCount);
    const baseZ = new Float32Array(vertCount);
    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = new Uint16Array(SEG_X * SEG_Z * 6);

    let v = 0;
    for (let j = 0; j <= SEG_Z; j++) {
      for (let i = 0; i <= SEG_X; i++) {
        const x = (i / SEG_X) * PW;
        const z = -PH / 2 + (j / SEG_Z) * PH;
        baseX[v] = x;
        baseZ[v] = z;
        positions[v * 3] = x;
        positions[v * 3 + 1] = 0;
        positions[v * 3 + 2] = z;
        uvs[v * 2] = i / SEG_X;
        uvs[v * 2 + 1] = (PH / 2 - z) / PH;
        v++;
      }
    }
    let k = 0;
    for (let j = 0; j < SEG_Z; j++) {
      for (let i = 0; i < SEG_X; i++) {
        const a = j * (SEG_X + 1) + i;
        const b = a + 1;
        const c = a + (SEG_X + 1);
        const d = c + 1;
        indices[k++] = a;
        indices[k++] = c;
        indices[k++] = b;
        indices[k++] = b;
        indices[k++] = c;
        indices[k++] = d;
      }
    }
    leafGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    leafGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    leafGeo.setIndex(new THREE.BufferAttribute(indices, 1));
    leafGeo.computeVertexNormals();

    const leafFrontMat = new THREE.MeshStandardMaterial({
      map: coverFront.tex,
      roughness: 0.55,
      metalness: 0,
      side: THREE.FrontSide,
    });
    const leafBackMat = new THREE.MeshStandardMaterial({
      map: coverInside.mirrored,
      roughness: 0.55,
      metalness: 0,
      side: THREE.BackSide,
    });

    const leafGroup = new THREE.Group();
    leafGroup.position.y = 0.005;
    leafGroup.visible = false;
    book.add(leafGroup);

    const leafFront = new THREE.Mesh(leafGeo, leafFrontMat);
    leafFront.castShadow = true;
    leafFront.receiveShadow = true;
    leafGroup.add(leafFront);

    const leafBack = new THREE.Mesh(leafGeo, leafBackMat);
    leafBack.castShadow = false;
    leafBack.receiveShadow = true;
    leafGroup.add(leafBack);

    // soft contact shadow catcher
    const catcher = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 11),
      new THREE.ShadowMaterial({ color: 0x111111, opacity: 0.16 }),
    );
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.y = -THICK - 0.06;
    catcher.receiveShadow = true;
    scene.add(catcher);

    /* ---- state ---- */
    let currentState = 0;
    let turn: { dir: 1 | -1; from: number; t0: number } | null = null;
    let lastGesture = 0;
    let frameValue = 0;

    const rightTextureFor = (s: number) => (s === 0 ? coverFront.tex : pageFront[s - 1].tex);
    const leftTextureFor = (s: number) =>
      s === 1 ? coverInside.tex : pageBack[Math.max(0, s - 2)].tex;

    const applySpread = (s: number) => {
      rightTopMat.map = rightTextureFor(s);
      rightTopMat.needsUpdate = true;

      const rightSheets = SHEETS - s;
      const rightH = Math.max(rightSheets * T, 0.0001);
      rightStack.scale.y = rightH;
      rightStack.position.y = -rightH / 2;

      leftStack.visible = s > 0;
      leftPage.visible = s > 0;
      const leftH = Math.max(s * T, 0.0001);
      leftStack.scale.y = leftH;
      leftStack.position.y = -leftH / 2;

      if (s > 0) {
        leftTopMat.map = leftTextureFor(s);
        leftTopMat.needsUpdate = true;
      }
    };
    applySpread(0);

    const setLeafTextures = (base: number) => {
      if (base === 0) {
        leafFrontMat.map = coverFront.tex;
        leafBackMat.map = coverInside.mirrored;
      } else {
        leafFrontMat.map = pageFront[base - 1].tex;
        leafBackMat.map = pageBack[base - 1].mirrored;
      }
      leafFrontMat.needsUpdate = true;
      leafBackMat.needsUpdate = true;
    };

    const deformLeaf = (theta: number) => {
      const attr = leafGeo.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      // The page lifts into an arc; peak curl at the halfway point of the turn.
      const bend = 0.5 * Math.sin(theta);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      for (let i = 0; i < vertCount; i++) {
        const x = baseX[i];
        const z = baseZ[i];
        const curvature = bend * (1 + 0.22 * (z / PH));
        let px: number;
        let py: number;
        if (Math.abs(curvature) < 1e-4) {
          px = x;
          py = 0;
        } else {
          const phi = x * curvature;
          px = Math.sin(phi) / curvature;
          py = (1 - Math.cos(phi)) / curvature;
        }
        arr[i * 3] = px * cosT - py * sinT;
        arr[i * 3 + 1] = px * sinT + py * cosT;
        arr[i * 3 + 2] = z;
      }
      attr.needsUpdate = true;
      leafGeo.computeVertexNormals();
      leafGeo.computeBoundingSphere();
    };

    const commit = (next: number) => {
      currentState = next;
      applySpread(next);
      leafGroup.visible = false;
      turn = null;
      lastGesture = performance.now();
      setStateReact(next);
      setTurningReact(false);
    };

    const requestTurn = (dir: 1 | -1): boolean => {
      if (turn) return false;
      const from = currentState;
      const to = from + dir;
      if (to < 0 || to > LAST) return false;

      lastGesture = performance.now();

      if (reducedRef.current) {
        commit(to);
        return true;
      }

      const base = dir > 0 ? from : from - 1;
      setLeafTextures(base);

      // The destination top page is revealed underneath the leaf.
      const destination = to;
      rightTopMat.map = rightTextureFor(destination);
      rightTopMat.needsUpdate = true;

      deformLeaf(dir > 0 ? 0 : Math.PI);
      leafGroup.visible = true;
      turn = { dir, from, t0: performance.now() };
      setTurningReact(true);
      return true;
    };

    apiRef.current = {
      next: () => requestTurn(1),
      prev: () => requestTurn(-1),
    };

    /* ---- sizing ---- */
    const resize = () => {
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(holder);

    /* ---- camera ---- */
    const viewDir = new THREE.Vector3(0.16, 0.84, 0.52).normalize();
    const forward = viewDir.clone().negate();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    const corners: THREE.Vector3[] = [];
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sy = -1; sy <= 1; sy += 2) {
        for (let sz = -1; sz <= 1; sz += 2) {
          corners.push(new THREE.Vector3(sx, sy, sz));
        }
      }
    }
    const probe = new THREE.Vector3();

    // Frame the actual box of the book rather than a bounding sphere, so the
    // book stays large and centered at every stage of the opening.
    const fitCamera = (progress: number) => {
      // The group offset keeps the visible book centred on the world origin at
      // every stage, so the camera always frames (0, 0, 0).
      const halfW = (PW / 2) * (1 + progress);
      book.position.x = -(PW / 2) * (1 - progress);

      const tanV = Math.tan((camera.fov * Math.PI) / 360);
      const tanH = tanV * (camera.aspect || 1.6);

      const fits = (distance: number) => {
        const posX = viewDir.x * distance;
        const posY = viewDir.y * distance;
        const posZ = viewDir.z * distance;
        for (const corner of corners) {
          probe.set(
            corner.x * halfW - posX,
            corner.y * (THICK / 2 + 0.01) - posY,
            corner.z * (PH / 2) - posZ,
          );
          const depth = probe.dot(forward);
          if (depth <= 0.05) return false;
          if (Math.abs(probe.dot(right) / (depth * tanH)) > 0.94) return false;
          if (Math.abs(probe.dot(up) / (depth * tanV)) > 0.94) return false;
        }
        return true;
      };

      let lo = 1.2;
      let hi = 26;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) hi = mid;
        else lo = mid;
      }
      camera.position.set(viewDir.x * hi, viewDir.y * hi, viewDir.z * hi);
      camera.lookAt(0, 0, 0);
    };

    /* ---- arrival gate ---- */
    // The book only takes over the wheel once the visitor has actually arrived
    // at the section and the page has been still for a beat, so the closed book
    // is always the first thing they see.
    let lastScrollAt = 0;
    let parkedAt = 0;

    const onPageScroll = () => {
      lastScrollAt = performance.now();
    };
    window.addEventListener("scroll", onPageScroll, { passive: true });

    const bookIsParked = () => {
      const rect = stage.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (rect.top > vh * 0.5) return false;
      if (rect.bottom < vh * 0.45) return false;
      return performance.now() - lastScrollAt > 240;
    };

    /* ---- loop ---- */
    const clock = new THREE.Clock();
    let raf = 0;

    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const now = performance.now();

      if (bookIsParked()) {
        if (!parkedAt) parkedAt = now;
      } else {
        parkedAt = 0;
      }

      const target = currentState === 0 ? 0 : 1;
      frameValue += (target - frameValue) * (1 - Math.exp(-dt * 4.5));
      fitCamera(frameValue);

      if (turn) {
        const p = Math.min(1, (now - turn.t0) / TURN_MS);
        const eased = ease(p);
        const theta = turn.dir > 0 ? eased * Math.PI : (1 - eased) * Math.PI;
        deformLeaf(theta);
        if (p >= 1) {
          commit(currentState + turn.dir);
        }
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    /* ---- input ---- */
    const onWheel = (event: WheelEvent) => {
      if (reducedRef.current) return;
      if (event.deltaY === 0) return;
      if (turn) {
        event.preventDefault();
        return;
      }
      const down = event.deltaY > 0;
      if (down && currentState >= LAST) return;
      if (!down && currentState <= 0) return;
      if (Math.abs(event.deltaY) < 4) return;
      if (!parkedAt || performance.now() - parkedAt < 420) return;
      if (performance.now() - lastGesture < GESTURE_GAP) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      requestTurn(down ? 1 : -1);
    };

    let downX = 0;
    let downY = 0;

    const onPointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (reducedRef.current || turn) return;
      const dx = event.clientX - downX;
      const dy = event.clientY - downY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        requestTurn(dx < 0 ? 1 : -1);
        return;
      }
      if (Math.hypot(dx, dy) > 10) return;
      const rect = holder.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      requestTurn(ratio > 0.5 ? 1 : -1);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    holder.addEventListener("pointerdown", onPointerDown);
    holder.addEventListener("pointerup", onPointerUp);

    /* ---- late font metrics ---- */
    let disposed = false;
    const redrawAll = () => {
      if (disposed) return;
      ALL_TEXTURES.forEach((entry) => entry.redraw());
    };
    if (document.fonts) {
      document.fonts.ready.then(redrawAll).catch(() => {});
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      stage.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onPageScroll);
      holder.removeEventListener("pointerdown", onPointerDown);
      holder.removeEventListener("pointerup", onPointerUp);
      apiRef.current = null;

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else if (material) material.dispose();
      });
      edgeMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === holder) {
        holder.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hint =
    state === 0
      ? "SCROLL TO OPEN"
      : state >= LAST
        ? "SCROLL TO CONTINUE"
        : "SCROLL TO TURN THE PAGE";

  return (
    <div className="book-scene" ref={stageRef}>
      <div
        className="book-canvas"
        ref={holderRef}
        role="img"
        aria-label={`CampusCode how it works book, showing ${
          LABELS[state].toLowerCase()
        }`}
      />
      <div className="book-hud">
        <div className="book-hud__left">
          <span className="book-hud__label">{turning ? "TURNING" : LABELS[state]}</span>
          <span className="book-hud__hint">{hint}</span>
        </div>
        {reduced && (
          <div className="book-hud__controls">
            <button type="button" onClick={() => apiRef.current?.prev()} disabled={state === 0}>
              PREV
            </button>
            <button type="button" onClick={() => apiRef.current?.next()} disabled={state === LAST}>
              NEXT
            </button>
          </div>
        )}
        <div className="book-hud__dots" aria-hidden="true">
          {LABELS.map((label, index) => (
            <span
              key={label}
              className={`book-dot${index === state ? " is-active" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PageFlipBook;
