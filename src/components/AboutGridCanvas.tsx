import { useEffect, useRef } from "react";

const GRID_STEP = 42;

export function AboutGridCanvas() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!rootRef.current?.isConnected) return;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = root.offsetWidth;
      const h = root.offsetHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#f7f6f2";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(20, 20, 20, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += GRID_STEP) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += GRID_STEP) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      const verticalGrad = ctx.createLinearGradient(0, 0, 0, h);
      verticalGrad.addColorStop(0, "rgba(20, 20, 20, 0.04)");
      verticalGrad.addColorStop(0.4, "rgba(20, 20, 20, 0.04)");
      verticalGrad.addColorStop(1, "rgba(20, 20, 20, 0.01)");
      ctx.fillStyle = verticalGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "#deded8";
      ctx.lineWidth = 1;
      const dividerX = 0;
      ctx.beginPath();
      ctx.moveTo(dividerX, 120);
      ctx.lineTo(dividerX, h);
      ctx.stroke();
      ctx.restore();

      const dividerX2 = 0;
      ctx.save();
      ctx.strokeStyle = "#deded8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dividerX2, 120);
      ctx.lineTo(dividerX2, h);
      ctx.stroke();
      ctx.restore();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    return () => {
      rootRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
