import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ================================================================== */
/*  Editorial content                                                  */
/* ================================================================== */

type Spread = {
  no: string;
  title: string;
  body: string;
  kicker: string;
  caption: string;
  meta: ReadonlyArray<readonly [string, string]>;
  rows: ReadonlyArray<readonly [string, string, string]>;
};

const SPREADS: readonly Spread[] = [
  {
    no: "01",
    title: "DISCOVER",
    body: "Find a challenge that makes you want to build.",
    kicker: "THE CHALLENGE BOARD",
    caption: "Live challenge board · autumn 2026",
    meta: [
      ["OPEN BRIEFS", "12"],
      ["TEAMS FORMING", "46"],
      ["TRACKS", "03"],
    ],
    rows: [
      ["01", "Open the briefs", "Three tracks, twelve live challenges"],
      ["02", "Read the judging notes", "Criteria published with every brief"],
      ["03", "Pick a track", "AI innovation, future web, campus tech"],
    ],
  },
  {
    no: "02",
    title: "TEAM UP",
    body: "Find people who share your ambition.",
    kicker: "THE SQUAD",
    caption: "Team workspace · builders by track",
    meta: [
      ["MEMBERS", "2—4"],
      ["SKILLS", "06"],
      ["WORKSPACES", "ONE"],
    ],
    rows: [
      ["01", "Find your people", "Browse builders by track and skill"],
      ["02", "Form a squad", "Two to four students per project"],
      ["03", "Share the work", "One workspace carries the build"],
    ],
  },
  {
    no: "03",
    title: "BUILD",
    body: "Turn your idea into something people can use.",
    kicker: "THE WORKBENCH",
    caption: "Build week · ship something real",
    meta: [
      ["BUILD DAYS", "07"],
      ["REVIEWS", "02"],
      ["PREVIEW", "LIVE"],
    ],
    rows: [
      ["01", "Start from the brief", "Scaffold, fork and ship in days"],
      ["02", "Build in the open", "Push progress, review together"],
      ["03", "Test what ships", "Preview before it reaches the arena"],
    ],
  },
  {
    no: "04",
    title: "SHIP",
    body: "Submit your work and take it to the arena.",
    kicker: "THE ARENA",
    caption: "Submission desk · demo day",
    meta: [
      ["ENTRIES", "ONE"],
      ["WALKTHROUGH", "LIVE"],
      ["DEMO DAY", "ON STAGE"],
    ],
    rows: [
      ["01", "Submit the project", "One entry per team, per track"],
      ["02", "Show it working", "Live link and a short walkthrough"],
      ["03", "Enter the arena", "Results announced on demo day"],
    ],
  },
];

const STEP_MAX = SPREADS.length;

/* ================================================================== */
/*  Canvas art helpers                                                 */
/* ================================================================== */

type Ctx = CanvasRenderingContext2D;

const INK = "#111111";
const INK_SOFT = "#5a5a55";
const GREY = "#8d8d86";
const PURPLE = "#7455ff";
const LIME = "#a5d85e";
const BORDER = "#e6e6e6";
const PANEL = "#fafaf7";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function setFont(
  ctx: Ctx,
  size: number,
  weight: number,
  family: "mono" | "sans",
  color: string,
  align: CanvasTextAlign = "left",
  baseline: CanvasTextBaseline = "alphabetic",
) {
  ctx.font = `${weight} ${size}px ${family === "mono" ? MONO : SANS}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hairline(ctx: Ctx, x1: number, y: number, x2: number, color = BORDER) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
}

function wrapped(ctx: Ctx, value: string, maxW: number): string[] {
  const words = value.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function spaced(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  tracking: number,
  align: "left" | "center" | "right" = "left",
) {
  const widths = [...value].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * Math.max(0, value.length - 1);
  let cursor = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  const previous = ctx.textAlign;
  ctx.textAlign = "left";
  [...value].forEach((ch, i) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[i] + tracking;
  });
  ctx.textAlign = previous;
}

/* ------------------------------------------------------------------ */
/*  Page frames                                                       */
/* ------------------------------------------------------------------ */

function pageBase(ctx: Ctx, w: number, h: number, side: "left" | "right") {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const bottom = ctx.createLinearGradient(0, h * 0.55, 0, h);
  bottom.addColorStop(0, "rgba(246, 246, 242, 0)");
  bottom.addColorStop(1, "rgba(238, 238, 232, 0.4)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, w, h);

  const gutter = 150;
  const shade =
    side === "right"
      ? ctx.createLinearGradient(0, 0, gutter, 0)
      : ctx.createLinearGradient(w, 0, w - gutter, 0);
  shade.addColorStop(0, "rgba(18, 18, 16, 0.10)");
  shade.addColorStop(0.35, "rgba(18, 18, 16, 0.035)");
  shade.addColorStop(1, "rgba(18, 18, 16, 0)");
  ctx.fillStyle = shade;
  ctx.fillRect(side === "right" ? 0 : w - gutter, 0, gutter, h);
}

function pageFurniture(ctx: Ctx, w: number, h: number, side: "left" | "right", folio: string) {
  const pad = 66;
  const inner = 96;
  const outerX = side === "right" ? w - pad : pad;
  const innerX = side === "right" ? inner : w - inner;
  const align: CanvasTextAlign = side === "right" ? "right" : "left";

  setFont(ctx, 13, 400, "mono", "#9c9c94", align, "alphabetic");
  ctx.fillText("CAMPUSCODE · HOW IT WORKS", outerX, 74);
  setFont(ctx, 13, 500, "mono", PURPLE, side === "right" ? "left" : "right", "alphabetic");
  ctx.fillText(folio, innerX, 74);
  hairline(ctx, 66, 96, w - 66);

  hairline(ctx, 66, h - 96, w - 66);
  setFont(ctx, 12, 400, "mono", "#a8a8a0", side === "right" ? "right" : "left", "alphabetic");
  ctx.fillText("CAMPUSCODE · 2026", side === "right" ? w - pad : pad, h - 62);
  setFont(ctx, 12, 500, "mono", PURPLE, side === "right" ? "left" : "right", "alphabetic");
  ctx.fillText(folio, side === "right" ? 66 : w - 66, h - 62);
}

/* ------------------------------------------------------------------ */
/*  Illustration panels                                               */
/* ------------------------------------------------------------------ */

function artPanel(
  ctx: Ctx,
  index: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.fillStyle = PANEL;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = "#ececE6";
  ctx.lineWidth = 1;
  ctx.stroke();

  // corner registration ticks
  ctx.strokeStyle = "rgba(116, 101, 255, 0.4)";
  ctx.lineWidth = 1;
  const t = 10;
  [
    [x + 12, y + 12, 1, 1],
    [x + w - 12, y + 12, -1, 1],
    [x + 12, y + h - 12, 1, -1],
    [x + w - 12, y + h - 12, -1, -1],
  ].forEach(([px, py, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(px, py + sy * t);
    ctx.lineTo(px, py);
    ctx.lineTo(px + sx * t, py);
    ctx.stroke();
  });

  setFont(ctx, 12, 500, "mono", "#b4b4ac", "left", "alphabetic");
  ctx.fillText(`FIG. ${SPREADS[index].no}`, x + 30, y + 38);

  ctx.restore();

  if (index === 0) {
    // challenge cards
    const pad = 30;
    const gap = 18;
    const cw = (w - pad * 2 - gap) / 2;
    const ch = h - pad - 74;
    const cards: ReadonlyArray<readonly [string, string, string, string]> = [
      ["AI", "AI INNOVATION", "MAR 15—17", "248"],
      ["WEB", "FUTURE WEB", "APR 05—07", "186"],
    ];
    cards.forEach(([tag, title, dates, count], i) => {
      const cx = x + pad + i * (cw + gap);
      const cy = y + 58;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, cx, cy, cw, ch, 8);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = i === 0 ? PURPLE : INK;
      roundRect(ctx, cx + 16, cy + 16, 52, 20, 4);
      ctx.fill();
      setFont(ctx, 11, 500, "mono", "#ffffff", "center", "middle");
      ctx.fillText(tag, cx + 42, cy + 26);

      setFont(ctx, 18, 800, "sans", INK, "left", "alphabetic");
      ctx.fillText(title, cx + 16, cy + 74);

      setFont(ctx, 12, 400, "mono", GREY, "left", "alphabetic");
      ctx.fillText(dates, cx + 16, cy + 100);
      ctx.fillText(`${count} BUILDERS`, cx + 16, cy + 122);

      const barY = cy + ch - 40;
      ctx.fillStyle = "#efefea";
      roundRect(ctx, cx + 16, barY, cw - 32, 6, 3);
      ctx.fill();
      ctx.fillStyle = i === 0 ? LIME : PURPLE;
      roundRect(ctx, cx + 16, barY, (cw - 32) * (i === 0 ? 0.68 : 0.42), 6, 3);
      ctx.fill();

      ctx.fillStyle = i === 0 ? LIME : "#d8d8d2";
      ctx.beginPath();
      ctx.arc(cx + cw - 26, cy + 26, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (index === 1) {
    // squad
    const pad = 30;
    const cardX = x + pad + 172;
    const cardW = w - pad * 2 - 172;
    const cardY = y + 58;
    const cardH = h - 96;

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    setFont(ctx, 15, 700, "sans", INK, "left", "alphabetic");
    ctx.fillText("Squad workspace", cardX + 18, cardY + 34);
    setFont(ctx, 11, 400, "mono", GREY, "left", "alphabetic");
    ctx.fillText("3 BUILDERS ACTIVE", cardX + 18, cardY + 56);

    const members: ReadonlyArray<readonly [string, string, string]> = [
      ["PS", "PRIYA S.", "FULL STACK"],
      ["MK", "MARCUS K.", "AI / ML"],
      ["AR", "AYESHA R.", "DESIGN"],
    ];
    members.forEach(([initials, name, role], i) => {
      const rowY = cardY + 84 + i * 54;
      ctx.fillStyle = "#f4f4ef";
      roundRect(ctx, cardX + 18, rowY, cardW - 36, 42, 6);
      ctx.fill();
      ctx.fillStyle = i === 0 ? PURPLE : i === 1 ? LIME : "#111111";
      ctx.beginPath();
      ctx.arc(cardX + 40, rowY + 21, 13, 0, Math.PI * 2);
      ctx.fill();
      setFont(ctx, 11, 700, "sans", "#ffffff", "center", "middle");
      ctx.fillText(initials, cardX + 40, rowY + 22);
      setFont(ctx, 12, 600, "sans", INK, "left", "middle");
      ctx.fillText(name, cardX + 62, rowY + 21);
      setFont(ctx, 10, 400, "mono", GREY, "right", "middle");
      ctx.fillText(role, cardX + cardW - 32, rowY + 21);
    });

    const avatars: ReadonlyArray<readonly [string, string]> = [
      ["PS", PURPLE],
      ["MK", LIME],
      ["AR", INK],
    ];
    avatars.forEach(([initials, color], i) => {
      const ay = y + 96 + i * 96;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + pad + 62, ay, 34, 0, Math.PI * 2);
      ctx.fill();
      setFont(ctx, 20, 700, "sans", "#ffffff", "center", "middle");
      ctx.fillText(initials, x + pad + 62, ay + 1);
      if (i < avatars.length - 1) {
        ctx.strokeStyle = "#e4e4dd";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + pad + 110, ay + 46);
        ctx.lineTo(x + pad + 130, ay + 50);
        ctx.stroke();
      }
    });
  } else if (index === 2) {
    // build week
    const pad = 30;
    const editorW = (w - pad * 2) * 0.54;
    const editorH = h - 96;
    const ex = x + pad;
    const ey = y + 58;

    ctx.fillStyle = "#141412";
    roundRect(ctx, ex, ey, editorW, editorH, 8);
    ctx.fill();

    [["#ff6b6b", 0], ["#ffbd4a", 1], ["#4ecdc4", 2]].forEach(([color, i]) => {
      ctx.fillStyle = String(color);
      ctx.beginPath();
      ctx.arc(ex + 20 + Number(i) * 14, ey + 20, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const code: ReadonlyArray<readonly [string, string]> = [
      ["import", " { CampusCode } "],
      ["const", " app = new CampusCode("],
      ["  project", ": \"campus-app\","],
      ["  team", ": \"squad-01\","],
      [")", ""],
      ["app", ".ship()"],
    ];
    code.forEach(([key, rest], i) => {
      const lineY = ey + 54 + i * 30;
      setFont(ctx, 13, 400, "mono", "#6f6f68", "left", "alphabetic");
      ctx.fillText(String(i + 1).padStart(2, "0"), ex + 18, lineY);
      setFont(ctx, 13, 500, "mono", "#c9c9ff", "left", "alphabetic");
      ctx.fillText(key, ex + 46, lineY);
      setFont(ctx, 13, 400, "mono", "#8e8e86", "left", "alphabetic");
      ctx.fillText(rest, ex + 46 + ctx.measureText(key).width + 4, lineY);
    });

    ctx.fillStyle = PURPLE;
    roundRect(ctx, ex + editorW - 118, ey + editorH - 44, 100, 26, 5);
    ctx.fill();
    setFont(ctx, 11, 600, "mono", "#ffffff", "center", "middle");
    ctx.fillText("RUN BUILD", ex + editorW - 68, ey + editorH - 31);

    const px = ex + editorW + 18;
    const pw = x + w - pad - px;
    const ph = editorH;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, px, ey, pw, ph, 8);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    setFont(ctx, 14, 700, "sans", INK, "left", "alphabetic");
    ctx.fillText("Campus app", px + 18, ey + 34);
    setFont(ctx, 11, 400, "mono", GREY, "left", "alphabetic");
    ctx.fillText("PREVIEW", px + 18, ey + 56);

    ctx.fillStyle = "#f1f1eb";
    roundRect(ctx, px + 18, ey + 74, pw - 36, 34, 6);
    ctx.fill();
    ctx.fillStyle = PURPLE;
    roundRect(ctx, px + 18, ey + 120, pw - 36, 64, 8);
    ctx.fill();
    setFont(ctx, 12, 600, "mono", "#ffffff", "center", "middle");
    ctx.fillText("BUILD PROJECT", px + pw / 2, ey + 152);

    ["12 ISSUES", "8 SOLVED"].forEach((label, i) => {
      setFont(ctx, 10, 400, "mono", GREY, "left", "alphabetic");
      ctx.fillText(label, px + 18, ey + 214 + i * 22);
      ctx.fillStyle = i === 0 ? LIME : PURPLE;
      ctx.beginPath();
      ctx.arc(px + 118, ey + 210 + i * 22, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // ship
    const pad = 30;
    const panelW = w - pad * 2;
    const panelH = h - 96;
    const px = x + pad;
    const py = y + 58;

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, px, py, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = PURPLE;
    roundRect(ctx, px + 20, py + 22, 40, 40, 8);
    ctx.fill();
    setFont(ctx, 20, 700, "sans", "#ffffff", "center", "middle");
    ctx.fillText("↑", px + 40, py + 43);

    setFont(ctx, 18, 800, "sans", INK, "left", "alphabetic");
    ctx.fillText("Ready for the arena", px + 76, py + 44);
    setFont(ctx, 12, 400, "mono", GREY, "left", "alphabetic");
    ctx.fillText("PROJECT COMPLETE", px + 76, py + 64);

    const checks: ReadonlyArray<readonly [string, boolean]> = [
      ["BUILD", true],
      ["TESTS", true],
      ["REVIEW", false],
    ];
    checks.forEach(([label, done], i) => {
      const rowY = py + 104 + i * 40;
      ctx.fillStyle = done ? "rgba(165, 216, 94, 0.18)" : "#f5f5ef";
      roundRect(ctx, px + 20, rowY, panelW - 40, 30, 5);
      ctx.fill();
      ctx.fillStyle = done ? LIME : "#e2e2da";
      ctx.beginPath();
      ctx.arc(px + 38, rowY + 15, 7, 0, Math.PI * 2);
      ctx.fill();
      setFont(ctx, 11, 700, "sans", done ? "#3f5c0d" : "#9a9a92", "center", "middle");
      ctx.fillText(done ? "✓" : "·", px + 38, rowY + 15);
      setFont(ctx, 11, 500, "mono", INK_SOFT, "left", "middle");
      ctx.fillText(label, px + 56, rowY + 15);
      setFont(ctx, 10, 400, "mono", GREY, "right", "middle");
      ctx.fillText(done ? "COMPLETE" : "IN REVIEW", px + panelW - 32, rowY + 15);
    });

    ctx.fillStyle = INK;
    roundRect(ctx, px + 20, py + panelH - 56, panelW - 40, 36, 6);
    ctx.fill();
    setFont(ctx, 12, 600, "mono", "#ffffff", "center", "middle");
    ctx.fillText("→ SUBMIT TO ARENA", px + panelW / 2, py + panelH - 38);
  }
}

/* ------------------------------------------------------------------ */
/*  Pages                                                             */
/* ------------------------------------------------------------------ */

function drawVerso(ctx: Ctx, index: number, texW: number, texH: number) {
  const spread = SPREADS[index];
  pageBase(ctx, texW, texH, "left");
  pageFurniture(ctx, texW, texH, "left", spread.no);

  const pad = 66;

  setFont(ctx, 13, 500, "mono", PURPLE, "left", "alphabetic");
  ctx.fillText(spread.kicker, pad, 158);

  setFont(ctx, 64, 900, "sans", INK, "left", "alphabetic");
  ctx.fillText(`${spread.no}`, pad, 244);
  setFont(ctx, 46, 900, "sans", INK, "left", "alphabetic");
  ctx.fillText(spread.title, pad, 300);

  setFont(ctx, 21, 400, "sans", INK_SOFT, "left", "alphabetic");
  const bodyLines = wrapped(ctx, spread.body, texW - pad * 2 - 40);
  bodyLines.forEach((line, i) => ctx.fillText(line, pad, 356 + i * 32));

  hairline(ctx, pad, 436, texW - pad - 30);

  spread.rows.forEach(([no, label, note], i) => {
    const rowY = 486 + i * 96;
    setFont(ctx, 12, 500, "mono", PURPLE, "left", "alphabetic");
    ctx.fillText(no, pad, rowY);
    setFont(ctx, 20, 600, "sans", INK, "left", "alphabetic");
    ctx.fillText(label, pad + 46, rowY);
    setFont(ctx, 13, 400, "sans", GREY, "left", "alphabetic");
    ctx.fillText(note, pad + 46, rowY + 26);
    hairline(ctx, pad, rowY + 48, texW - pad - 30);
  });

  setFont(ctx, 11, 400, "mono", "#b3b3ab", "left", "alphabetic");
  ctx.fillText("EDITORIAL FOLIO · SET IN INTER & DM MONO", pad, 852);

  ctx.fillStyle = PURPLE;
  ctx.fillRect(pad, 878, 46, 3);
  ctx.fillStyle = LIME;
  ctx.fillRect(pad + 54, 878, 12, 3);
}

function drawRecto(ctx: Ctx, index: number, texW: number, texH: number) {
  const spread = SPREADS[index];
  pageBase(ctx, texW, texH, "right");
  pageFurniture(ctx, texW, texH, "right", spread.no);

  const pad = 66;
  const artX = pad;
  const artY = 136;
  const artW = texW - pad * 2 - 26;
  const artH = 460;

  artPanel(ctx, index, artX, artY, artW, artH);

  setFont(ctx, 12, 400, "mono", GREY, "left", "alphabetic");
  ctx.fillText(spread.caption.toUpperCase(), pad, artY + artH + 36);

  setFont(ctx, 32, 900, "sans", INK, "left", "alphabetic");
  ctx.fillText(spread.title, pad, artY + artH + 86);

  setFont(ctx, 18, 400, "sans", INK_SOFT, "left", "alphabetic");
  const lines = wrapped(ctx, spread.body, artW - 40);
  lines.forEach((line, i) => ctx.fillText(line, pad, artY + artH + 120 + i * 26));

  hairline(ctx, pad, artY + artH + 182, texW - pad - 26);

  const colW = artW / 3;
  spread.meta.forEach(([label, value], i) => {
    const cx = pad + i * colW;
    setFont(ctx, 10, 400, "mono", GREY, "left", "alphabetic");
    ctx.fillText(label, cx, artY + artH + 212);
    setFont(ctx, 22, 700, "sans", INK, "left", "alphabetic");
    ctx.fillText(value, cx, artY + artH + 242);
    if (i > 0) {
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 18, artY + artH + 194);
      ctx.lineTo(cx - 18, artY + artH + 252);
      ctx.stroke();
    }
  });

  ctx.fillStyle = PURPLE;
  ctx.fillRect(pad, 886, 46, 3);
  ctx.fillStyle = LIME;
  ctx.fillRect(pad + 54, 886, 12, 3);
}

/* ------------------------------------------------------------------ */
/*  Cover art                                                         */
/* ------------------------------------------------------------------ */

function drawCover(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.32, w * 0.1, w * 0.5, h * 0.4, h * 0.72);
  glow.addColorStop(0, "rgba(255, 255, 255, 0)");
  glow.addColorStop(1, "rgba(234, 234, 228, 0.32)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // spine-side shade
  const shade = ctx.createLinearGradient(0, 0, w * 0.16, 0);
  shade.addColorStop(0, "rgba(18, 18, 16, 0.10)");
  shade.addColorStop(1, "rgba(18, 18, 16, 0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w * 0.16, h);

  ctx.strokeStyle = "rgba(17, 17, 17, 0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, w - 52, h - 52);
}

function drawCoverDetail(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  setFont(ctx, 17, 500, "mono", "#3b3b36", "center", "alphabetic");
  spaced(ctx, "CAMPUSCODE", w / 2, 150, 7, "center");

  ctx.fillStyle = PURPLE;
  ctx.fillRect(w / 2 - 46, 176, 92, 3);

  setFont(ctx, 250, 900, "sans", INK, "center", "middle");
  ctx.fillText("CC", w / 2, h * 0.44);

  ctx.fillStyle = PURPLE;
  ctx.fillRect(w / 2 - 210, h * 0.44 + 132, 420, 4);

  setFont(ctx, 26, 600, "sans", INK, "center", "alphabetic");
  spaced(ctx, "HACKATHON ARENA", w / 2, h * 0.44 + 198, 4, "center");

  setFont(ctx, 14, 400, "mono", "#8f8f88", "center", "alphabetic");
  spaced(ctx, "STUDENT BUILD FOLIO", w / 2, h * 0.44 + 232, 3, "center");

  setFont(ctx, 14, 500, "mono", "#3b3b36", "left", "alphabetic");
  spaced(ctx, "CAMPUSCODE · 2026", 110, h - 132, 3, "left");

  setFont(ctx, 14, 500, "mono", PURPLE, "right", "alphabetic");
  spaced(ctx, "00", w - 110, h - 132, 3, "right");

  ctx.fillStyle = LIME;
  [
    [110, 110],
    [w - 110, 110],
    [110, h - 168],
    [w - 110, h - 168],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  setFont(ctx, 12, 400, "mono", "#b0b0a8", "center", "alphabetic");
  spaced(ctx, "FOLIO 03 · PRINT 04", w / 2, h - 96, 3, "center");
}

function drawInsideCover(ctx: Ctx, w: number, h: number) {
  pageBase(ctx, w, h, "right");

  const pad = 88;
  setFont(ctx, 13, 500, "mono", PURPLE, "left", "alphabetic");
  spaced(ctx, "CAMPUSCODE", pad, 150, 5, "left");

  hairline(ctx, pad, 176, w - pad);

  setFont(ctx, 16, 400, "sans", INK_SOFT, "left", "alphabetic");
  const lines = wrapped(
    ctx,
    "A working folio for student builders. Four steps from the first brief to the arena floor.",
    w - pad * 2 - 20,
  );
  lines.forEach((line, i) => ctx.fillText(line, pad, 232 + i * 26));

  setFont(ctx, 11, 400, "mono", GREY, "left", "alphabetic");
  spaced(ctx, "HOW IT WORKS", pad, 348, 3, "left");

  ["01 DISCOVER", "02 TEAM UP", "03 BUILD", "04 SHIP"].forEach((label, i) => {
    const y = 400 + i * 44;
    setFont(ctx, 13, 500, "mono", i === 0 ? PURPLE : INK_SOFT, "left", "alphabetic");
    ctx.fillText(label, pad, y);
    hairline(ctx, pad, y + 20, w - pad);
  });

  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(w - pad - 6, 348, 5, 0, Math.PI * 2);
  ctx.fill();

  setFont(ctx, 11, 400, "mono", "#b3b3ab", "left", "alphabetic");
  spaced(ctx, "INSIDE FRONT COVER", pad, h - 150, 3, "left");
}

function drawEdge(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f7f7f3";
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? "rgba(150, 150, 140, 0.35)" : "rgba(190, 190, 180, 0.22)";
    ctx.fillRect(x, 0, 1.2, h);
  }
}

/* ------------------------------------------------------------------ */
/*  Textures                                                          */
/* ------------------------------------------------------------------ */

const TEX_W = 768;
const TEX_H = Math.round((TEX_W * 1354) / 1000);

type BookTextures = {
  cover: THREE.CanvasTexture;
  coverDetail: THREE.CanvasTexture;
  inside: THREE.CanvasTexture;
  edge: THREE.CanvasTexture;
  recto: THREE.CanvasTexture[];
  verso: THREE.CanvasTexture[];
  repaint: () => void;
};

function buildTextures(): BookTextures {
  const jobs: Array<() => void> = [];

  const make = (w: number, h: number, draw: (c: Ctx, cw: number, ch: number) => void) => {
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    jobs.push(() => {
      draw(ctx, w, h);
      tex.needsUpdate = true;
    });
    return tex;
  };

  const cover = make(TEX_W, TEX_H, drawCover);
  const coverDetail = make(TEX_W, TEX_H, drawCoverDetail);
  const inside = make(TEX_W, TEX_H, drawInsideCover);

  const edge = make(64, 256, drawEdge);
  edge.wrapS = THREE.RepeatWrapping;
  edge.wrapT = THREE.RepeatWrapping;
  edge.repeat.set(1, 6);

  const recto = SPREADS.map((_, i) => make(TEX_W, TEX_H, (c, w, h) => drawRecto(c, i, w, h)));
  const verso = SPREADS.map((_, i) => make(TEX_W, TEX_H, (c, w, h) => drawVerso(c, i, w, h)));

  return {
    cover,
    coverDetail,
    inside,
    edge,
    recto,
    verso,
    repaint: () => jobs.forEach((job) => job()),
  };
}

/* ================================================================== */
/*  Three.js scene                                                    */
/* ================================================================== */

const PW = 1;
const PH = 1.354;
const COVER_T = 0.024;
const SHEET = 0.016;
const LEAVES = 4;

function roundedShape(w: number, h: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function roundedSkin(w: number, h: number, r: number): THREE.BufferGeometry {
  const geo = new THREE.ShapeGeometry(roundedShape(w, h, r), 12);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

function roundedBoard(w: number, h: number, r: number, depth: number): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, h, r), {
    depth,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

const LEAF_U = 44;
const LEAF_V = 26;

function buildLeafGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const count = (LEAF_U + 1) * (LEAF_V + 1);
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices: number[] = [];

  for (let j = 0; j <= LEAF_V; j++) {
    for (let i = 0; i <= LEAF_U; i++) {
      const k = j * (LEAF_U + 1) + i;
      positions[k * 3] = (i / LEAF_U) * PW;
      positions[k * 3 + 1] = -PH / 2 + (j / LEAF_V) * PH;
      positions[k * 3 + 2] = 0;
      uvs[k * 2] = i / LEAF_U;
      uvs[k * 2 + 1] = j / LEAF_V;
    }
  }

  for (let j = 0; j < LEAF_V; j++) {
    for (let i = 0; i < LEAF_U; i++) {
      const a = j * (LEAF_U + 1) + i;
      const b = a + 1;
      const c = a + LEAF_U + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

type Stage3D = {
  host: HTMLElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  coverHinge: THREE.Group;
  coverDetailMaterial: THREE.MeshBasicMaterial;
  leafHinge: THREE.Group;
  leafGeometry: THREE.BufferGeometry;
  leafBaseX: Float32Array;
  rightStack: THREE.Mesh;
  leftStack: THREE.Mesh;
  spine: THREE.Mesh;
  rightMaterial: THREE.MeshStandardMaterial;
  leftMaterial: THREE.MeshStandardMaterial;
  leafFrontMaterial: THREE.MeshStandardMaterial;
  leafBackMaterial: THREE.MeshStandardMaterial;
  shadowMaterial: THREE.ShadowMaterial;
  recto: THREE.CanvasTexture[];
  verso: THREE.CanvasTexture[];
  leafFrontTex: THREE.CanvasTexture;
  leafBackTex: THREE.CanvasTexture;
  repaint: () => void;
  frame: () => void;
  resize: () => void;
  dispose: () => void;
};

function createStage(host: HTMLElement): Stage3D {
  const textures = buildTextures();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);

  const root = new THREE.Group();
  root.rotation.x = -0.115;
  scene.add(root);

  /* ---- lights ---- */
  const key = new THREE.DirectionalLight(0xffffff, 1.75);
  key.position.set(-1.9, 3.0, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.near = 0.2;
  key.shadow.camera.far = 14;
  key.shadow.bias = -0.0016;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new THREE.DirectionalLight("#ffffff", 0.6);
  fill.position.set(2.6, 1.1, 2.8);
  scene.add(fill);

  scene.add(new THREE.HemisphereLight("#ffffff", "#ecece7", 0.95));
  scene.add(new THREE.AmbientLight("#ffffff", 0.32));

  /* ---- shadow catcher behind the book ---- */
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.12, transparent: true });
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), shadowMaterial);
  catcher.position.z = -0.2;
  catcher.receiveShadow = true;
  scene.add(catcher);

  /* ---- paper edge material ---- */
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: "#f6f6f2",
    roughness: 0.94,
    metalness: 0,
    map: textures.edge,
  });
  const pageMaterial = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.86, metalness: 0 });

  /* ---- back cover ---- */
  const backBoard = new THREE.Mesh(
    roundedBoard(PW, PH, 0.018, COVER_T),
    new THREE.MeshStandardMaterial({ color: "#f0f0ec", roughness: 0.78, metalness: 0 }),
  );
  backBoard.position.set(PW / 2, 0, COVER_T / 2);
  backBoard.castShadow = true;
  backBoard.receiveShadow = true;
  root.add(backBoard);

  /* ---- page stacks ---- */
  const stackGeometry = new THREE.BoxGeometry(PW, PH, 1);
  const rightMaterial = pageMaterial(textures.recto[0]);
  const leftMaterial = pageMaterial(textures.verso[1]);
  const rightStack = new THREE.Mesh(stackGeometry, [
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    rightMaterial,
    edgeMaterial,
  ]);
  const leftStack = new THREE.Mesh(stackGeometry, [
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    leftMaterial,
    edgeMaterial,
  ]);
  [rightStack, leftStack].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  });
  rightStack.position.x = PW / 2;
  leftStack.position.x = -PW / 2;

  /* ---- spine ---- */
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, PH * 0.995, 1),
    new THREE.MeshStandardMaterial({ color: "#ecece7", roughness: 0.8, metalness: 0 }),
  );
  spine.castShadow = true;
  root.add(spine);

  /* ---- front cover on its hinge ---- */
  const coverHinge = new THREE.Group();
  coverHinge.position.set(0, 0, COVER_T + LEAVES * SHEET + COVER_T / 2);
  root.add(coverHinge);

  const coverAssembly = new THREE.Group();
  coverAssembly.position.x = PW / 2;
  coverHinge.add(coverAssembly);

  const board = new THREE.Mesh(
    roundedBoard(PW, PH, 0.018, COVER_T),
    new THREE.MeshStandardMaterial({ color: "#efefeb", roughness: 0.78, metalness: 0 }),
  );
  board.castShadow = true;
  board.receiveShadow = true;
  coverAssembly.add(board);

  const coverSkin = new THREE.Mesh(
    roundedSkin(PW, PH, 0.018),
    new THREE.MeshStandardMaterial({ map: textures.cover, roughness: 0.7, metalness: 0.02 }),
  );
  coverSkin.position.z = COVER_T / 2 + 0.0035;
  coverAssembly.add(coverSkin);

  const insideSkin = new THREE.Mesh(
    roundedSkin(PW, PH, 0.018),
    new THREE.MeshStandardMaterial({ map: textures.inside, roughness: 0.86, metalness: 0 }),
  );
  insideSkin.position.z = -COVER_T / 2 - 0.0035;
  insideSkin.rotation.y = Math.PI;
  coverAssembly.add(insideSkin);

  const coverDetailMaterial = new THREE.MeshBasicMaterial({
    map: textures.coverDetail,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const coverDetail = new THREE.Mesh(roundedSkin(PW * 0.96, PH * 0.96, 0.017), coverDetailMaterial);
  coverDetail.position.z = COVER_T / 2 + 0.005;
  coverAssembly.add(coverDetail);

  /* ---- turning leaf ---- */
  const leafGeometry = buildLeafGeometry();
  const leafBase = leafGeometry.getAttribute("position");
  const leafBaseX = new Float32Array(leafBase.count);
  for (let i = 0; i < leafBase.count; i++) leafBaseX[i] = leafBase.getX(i);

  const leafFrontTex = new THREE.CanvasTexture(textures.recto[0].image as HTMLCanvasElement);
  leafFrontTex.colorSpace = THREE.SRGBColorSpace;
  leafFrontTex.anisotropy = 4;

  const leafBackTex = new THREE.CanvasTexture(textures.verso[1].image as HTMLCanvasElement);
  leafBackTex.colorSpace = THREE.SRGBColorSpace;
  leafBackTex.anisotropy = 4;
  leafBackTex.wrapS = THREE.RepeatWrapping;
  leafBackTex.repeat.x = -1;
  leafBackTex.offset.x = 1;

  const leafFrontMaterial = new THREE.MeshStandardMaterial({
    map: leafFrontTex,
    roughness: 0.86,
    metalness: 0,
    side: THREE.FrontSide,
  });
  const leafBackMaterial = new THREE.MeshStandardMaterial({
    map: leafBackTex,
    roughness: 0.86,
    metalness: 0,
    side: THREE.BackSide,
  });

  const leafHinge = new THREE.Group();
  const leafFront = new THREE.Mesh(leafGeometry, leafFrontMaterial);
  const leafBack = new THREE.Mesh(leafGeometry, leafBackMaterial);
  leafFront.castShadow = true;
  leafBack.castShadow = true;
  leafHinge.add(leafFront, leafBack);
  leafHinge.visible = false;
  root.add(leafHinge);

  /* ---- camera framing ---- */
  const frameCamera = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    const aspect = w / h;
    const pad = 0.1;
    const vFov = (camera.fov * Math.PI) / 180;
    const fitH = (PH + pad * 2) / (2 * Math.tan(vFov / 2));
    const fitW = (PW * 2 + pad * 2) / (2 * Math.tan(vFov / 2) * aspect);
    const dist = Math.max(fitH, fitW) * 1.01;
    const dir = new THREE.Vector3(0.3, 0.26, 1).normalize().multiplyScalar(dist);
    camera.position.copy(dir);
    camera.lookAt(0, -0.03, 0);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  };

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    frameCamera();
  };

  const repaint = () => {
    textures.repaint();
    [
      textures.cover,
      textures.coverDetail,
      textures.inside,
      textures.edge,
      ...textures.recto,
      ...textures.verso,
    ].forEach((tex) => {
      tex.needsUpdate = true;
    });
    leafFrontTex.needsUpdate = true;
    leafBackTex.needsUpdate = true;
  };

  const frame = () => {
    renderer.render(scene, camera);
  };

  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const material = obj.material;
        const list = Array.isArray(material) ? material : [material];
        list.forEach((m) => m.dispose());
      }
    });
    [...textures.recto, ...textures.verso, textures.cover, textures.coverDetail, textures.inside, textures.edge, leafFrontTex, leafBackTex].forEach(
      (tex) => tex.dispose(),
    );
    renderer.dispose();
    if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
  };

  resize();

  return {
    host,
    renderer,
    scene,
    camera,
    root,
    coverHinge,
    coverDetailMaterial,
    leafHinge,
    leafGeometry,
    leafBaseX,
    rightStack,
    leftStack,
    spine,
    rightMaterial,
    leftMaterial,
    leafFrontMaterial,
    leafBackMaterial,
    shadowMaterial,
    recto: textures.recto,
    verso: textures.verso,
    leafFrontTex,
    leafBackTex,
    repaint,
    frame,
    resize,
    dispose,
  };
}

/* ================================================================== */
/*  Animation helpers                                                 */
/* ================================================================== */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.34;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function deformLeaf(stage: Stage3D, progress: number) {
  const geo = stage.leafGeometry;
  const attr = geo.getAttribute("position") as THREE.BufferAttribute;
  const curl = Math.sin(Math.PI * clamp01(progress));
  const amplitude = 0.19 * curl;

  for (let i = 0; i < attr.count; i++) {
    const x = stage.leafBaseX[i];
    const u = x / PW;
    const bend = Math.pow(u, 1.45) * amplitude;
    // slight lift along the free edge so the page peels instead of rotating rigidly
    const lift = 0.02 * curl * Math.sin(Math.PI * u);
    attr.setZ(i, bend + lift);
  }
  attr.needsUpdate = true;
  geo.computeVertexNormals();
}

function setStackHeights(stage: Stage3D, turned: number, coverOpen: number) {
  const rightH = Math.max(0, (LEAVES - turned) * SHEET);
  const leftH = Math.max(0, turned * SHEET);

  stage.rightStack.visible = rightH > 0.0008;
  stage.rightStack.scale.z = Math.max(0.0001, rightH);
  stage.rightStack.position.z = COVER_T + rightH / 2;

  stage.leftStack.visible = leftH > 0.0008 && coverOpen > 0.35;
  stage.leftStack.scale.z = Math.max(0.0001, leftH);
  stage.leftStack.position.z = COVER_T + leftH / 2;

  const depth = COVER_T + Math.max(rightH, leftH, COVER_T * 0.6);
  stage.spine.scale.z = depth;
  stage.spine.position.z = depth / 2;

  stage.leafHinge.position.z = COVER_T + Math.max(rightH, leftH) + 0.006;
}

function setCover(stage: Stage3D, progress: number) {
  const closedZ = COVER_T + LEAVES * SHEET + COVER_T / 2;
  const openZ = COVER_T / 2;
  stage.coverHinge.rotation.y = -Math.PI * progress;
  stage.coverHinge.position.z = closedZ + (openZ - closedZ) * progress;
  stage.root.position.x = -(PW / 2) * (1 - progress);
}

const CAPTIONS = SPREADS.map((s) => `${s.no} — ${s.title}`);

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

type BookProps = {
  onStepChange?: (step: number) => void;
};

export function PageFlipBook({ onStepChange }: BookProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Stage3D | null>(null);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const stepRef = useRef(0);
  const busyRef = useRef(false);
  const reducedRef = useRef(false);
  const releasedRef = useRef(false);
  const engagedRef = useRef(false);

  const animRef = useRef({
    started: false,
    start: 0,
    cover: 0,
    turned: 0,
    turn: null as null | { from: number; to: number; start: number; dur: number },
  });

  const gestureRef = useRef({ acc: 0, last: 0, open: true, dragging: false, x: 0, y: 0, moved: 0 });

  /* ---- texture bookkeeping helpers ---- */
  const applySpreadTextures = (stage: Stage3D, spread: number) => {
    stage.rightMaterial.map = stage.recto[Math.min(spread, SPREADS.length - 1)];
    stage.leftMaterial.map = stage.verso[Math.max(1, Math.min(spread, SPREADS.length - 1))];
    stage.rightMaterial.needsUpdate = true;
    stage.leftMaterial.needsUpdate = true;
  };

  const setLeafTextures = (stage: Stage3D, index: number) => {
    const front = stage.recto[index];
    const back = stage.verso[index + 1];
    stage.leafFrontTex.image = front.image;
    stage.leafFrontTex.needsUpdate = true;
    stage.leafBackTex.image = back.image;
    stage.leafBackTex.needsUpdate = true;
  };

  /* ---- the state machine ---- */
  const goTo = (target: number) => {
    const stage = stageRef.current;
    if (!stage || busyRef.current) return;
    const from = stepRef.current;
    if (target === from || target < 0 || target > STEP_MAX) return;

    const duration = reducedRef.current ? 160 : from === 0 || target === 0 ? 1000 : 780;
    animRef.current.turn = { from, to: target, start: performance.now(), dur: duration };
    busyRef.current = true;
    setBusy(true);
    releasedRef.current = false;

    if (from >= 1 && target >= 1) {
      const forward = target > from;
      const index = forward ? from - 1 : target - 1;
      setLeafTextures(stage, index);
      stage.leafHinge.visible = true;
      if (forward) {
        stage.rightMaterial.map = stage.recto[Math.min(target - 1, SPREADS.length - 1)];
        stage.rightMaterial.needsUpdate = true;
      } else {
        const spread = target - 1;
        if (spread >= 1) {
          stage.leftMaterial.map = stage.verso[spread];
          stage.leftMaterial.needsUpdate = true;
        }
      }
    }
  };

  const go = (direction: 1 | -1) => goTo(stepRef.current + direction);

  const commit = (target: number) => {
    const stage = stageRef.current;
    stepRef.current = target;
    setStep(target);
    busyRef.current = false;
    setBusy(false);
    animRef.current.turn = null;
    if (!stage) return;

    const spread = Math.max(0, target - 1);
    animRef.current.turned = spread;
    animRef.current.cover = target === 0 ? 0 : 1;

    if (stage) {
      setCover(stage, animRef.current.cover);
      setStackHeights(stage, animRef.current.turned, animRef.current.cover);
      stage.leafHinge.visible = false;
      deformLeaf(stage, 0);
      applySpreadTextures(stage, spread);
      stage.leafHinge.rotation.y = 0;
    }
  };

  /* ---- mount the scene ---- */
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    let stage: Stage3D;
    try {
      stage = createStage(host);
    } catch (error) {
      console.error("CampusCode book: WebGL scene failed to initialise.", error);
      setFailed(true);
      return;
    }

    stageRef.current = stage;
    animRef.current.cover = 0;
    animRef.current.turned = 0;
    applySpreadTextures(stage, 0);
    setCover(stage, 0);
    setStackHeights(stage, 0, 0);
    stage.frame();

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = media.matches;
    const onMedia = (event: MediaQueryListEvent) => {
      reducedRef.current = event.matches;
    };
    media.addEventListener("change", onMedia);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          stageRef.current?.repaint();
        })
        .catch(() => undefined);
    }

    const observer = new ResizeObserver(() => stage.resize());
    observer.observe(host);

    // The rise-and-settle entrance plays when the folio first comes into view,
    // not while the section is still far below the fold.
    const entrance = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (animRef.current.started) return;
        animRef.current.started = true;
        animRef.current.start = performance.now();
      },
      { threshold: 0.25 },
    );
    entrance.observe(host);

    let raf = 0;
    const tick = () => {
      const current = stageRef.current;
      if (current) {
        update(current);
        current.frame();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    setStackHeights(stage, 0, 0);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      entrance.disconnect();
      media.removeEventListener("change", onMedia);
      stage.dispose();
      stageRef.current = null;
    };
  }, []);

  /* ---- per-frame animation ---- */
  const update = (stage: Stage3D) => {
    const now = performance.now();
    const anim = animRef.current;

    const enterP = reducedRef.current ? 1 : anim.started ? clamp01((now - anim.start) / 1050) : 0;
    const rise = reducedRef.current ? 1 : easeOutBack(enterP);
    stage.root.position.y = -0.34 * (1 - rise);
    stage.root.rotation.z = -0.05 * (1 - enterP);
    stage.root.rotation.x = -0.115 + 0.06 * (1 - enterP);
    stage.coverDetailMaterial.opacity = clamp01((enterP - 0.42) / 0.4);

    const turn = anim.turn;
    if (!turn) {
      stage.leafHinge.visible = false;
      return;
    }

    const p = clamp01((now - turn.start) / turn.dur);
    const eased = easeInOut(p);

    if (turn.from === 0) {
      const cover = reducedRef.current ? 1 : eased;
      anim.cover = cover;
      setCover(stage, cover);
      setStackHeights(stage, 0, cover);
    } else if (turn.to === 0) {
      const cover = reducedRef.current ? 0 : 1 - eased;
      anim.cover = cover;
      setCover(stage, cover);
      setStackHeights(stage, 0, cover);
    } else {
      const forward = turn.to > turn.from;
      const leafP = forward ? eased : 1 - eased;
      stage.leafHinge.visible = true;
      stage.leafHinge.rotation.y = -Math.PI * leafP;
      deformLeaf(stage, leafP);

      const targetSpread = forward ? turn.from : turn.to - 1;
      const stackEase = clamp01((eased - 0.25) / 0.75);
      const turned = (turn.from - 1) + (targetSpread - (turn.from - 1)) * stackEase;
      setStackHeights(stage, turned, 1);
    }

    if (p >= 1) commit(turn.to);
  };

  /* ---- scroll / drag / click input ---- */
  useEffect(() => {
    const stage = () => stageRef.current;

    const isEngaged = () => {
      const host = hostRef.current;
      if (!host) return false;
      const rect = host.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      return rect.height > 0 && visible > rect.height * 0.5;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !stage()) return;
      const now = performance.now();
      const gesture = gestureRef.current;
      const engaged = isEngaged();
      engagedRef.current = engaged;
      if (!engaged) {
        releasedRef.current = false;
        gesture.acc = 0;
        return;
      }

      if (now - gesture.last > 160) {
        gesture.acc = 0;
        gesture.open = true;
      }
      gesture.last = now;

      const direction = Math.sign(event.deltaY);
      if (direction === 0) return;

      if (releasedRef.current) {
        if (direction > 0) return;
        releasedRef.current = false;
      }

      const current = stepRef.current;
      const canMove = direction > 0 ? current < STEP_MAX : current > 0;
      if (!canMove) {
        if (direction > 0) releasedRef.current = true;
        gesture.acc = 0;
        return;
      }

      // Hold the page while the book owns this gesture.
      event.preventDefault();

      if (busyRef.current || !gesture.open) return;

      gesture.acc += event.deltaY;
      if (Math.abs(gesture.acc) < 26) return;

      gesture.acc = 0;
      gesture.open = false;
      go(direction > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const down = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".book-controls")) return;
      const gesture = gestureRef.current;
      gesture.dragging = true;
      gesture.x = event.clientX;
      gesture.y = event.clientY;
      gesture.moved = 0;
    };

    const move = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture.dragging) return;
      gesture.moved = Math.max(gesture.moved, Math.abs(event.clientX - gesture.x));
    };

    const up = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".book-controls")) return;
      const gesture = gestureRef.current;
      if (!gesture.dragging) return;
      gesture.dragging = false;
      const dx = event.clientX - gesture.x;
      const rect = host.getBoundingClientRect();

      if (Math.abs(dx) > 46 && gesture.moved > 40) {
        go(dx < 0 ? 1 : -1);
        return;
      }
      if (gesture.moved < 10) {
        const half = rect.left + rect.width / 2;
        go(event.clientX > half ? 1 : -1);
      }
    };

    const cancel = () => {
      gestureRef.current.dragging = false;
    };

    host.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      host.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step, onStepChange]);

  const spread = step > 0 ? SPREADS[step - 1] : null;
  const caption = step === 0 ? "SCROLL TO OPEN" : CAPTIONS[step - 1];
  const hint =
    step === 0
      ? "ONE SCROLL OPENS THE COVER"
      : step === STEP_MAX
        ? "SCROLL TO CONTINUE"
        : "SCROLL FOR THE NEXT PAGE";

  return (
    <div className="book-scene-wrapper" ref={hostRef}>
      {failed ? (
        <div className="book-fallback" aria-hidden="false">
          <article className="book-fallback-page">
            <span className="book-fallback-kicker">{spread ? spread.kicker : "CAMPUSCODE FOLIO"}</span>
            <h3>{spread ? `${spread.no} — ${spread.title}` : "THE CAMPUSCODE FOLIO"}</h3>
            <p>{spread ? spread.body : "Four steps from the first brief to the arena floor."}</p>
            <ul>
              {(spread ? spread.rows : SPREADS[0].rows).map(([no, label, note]) => (
                <li key={no}>
                  <span>{no}</span>
                  <strong>{label}</strong>
                  <em>{note}</em>
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : (
        <div className="book-canvas-host" ref={canvasHostRef} aria-hidden="true" />
      )}

      <div className="book-overlay">
        <span className="book-caption">{caption}</span>
        <span className="book-hint">{hint}</span>
        <div className="book-controls">
          <button type="button" onClick={() => go(-1)} disabled={step === 0 || busy} aria-label="Previous page">
            ‹
          </button>
          <span className="book-count">{step === 0 ? "CLOSED" : `${SPREADS[step - 1].no} / 04`}</span>
          <button type="button" onClick={() => go(1)} disabled={step === STEP_MAX || busy} aria-label="Next page">
            ›
          </button>
        </div>
      </div>

      <p className="book-sr" aria-live="polite">
        {step === 0
          ? "The CampusCode folio is closed. Scroll or use the next page button to open it."
          : `Page ${SPREADS[step - 1].no} of 04: ${SPREADS[step - 1].title}. ${SPREADS[step - 1].body}`}
      </p>
    </div>
  );
}

export default PageFlipBook;
