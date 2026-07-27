import { useEffect, useMemo, useRef, useState } from "react";
import { FirstClickConfig } from "@/lib/types";
import { Stat, StatGrid } from "@/components/study/primitives";
import { cn } from "@/lib/utils";

interface ResponseRow {
  id: string;
  data: Record<string, unknown>;
}

interface ClickPoint {
  id: string;
  xPct: number;
  yPct: number;
  timeMs: number | null;
  inZone: boolean;
}

export default function FirstClickResults({
  config,
  responses,
}: {
  config: FirstClickConfig;
  responses: ResponseRow[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [view, setView] = useState<"heatmap" | "dots">("heatmap");

  const zone = config.correct_zone ?? null;

  const inZone = (xPct: number, yPct: number) => {
    if (!zone) return false;
    return (
      xPct >= zone.x &&
      xPct <= zone.x + zone.w &&
      yPct >= zone.y &&
      yPct <= zone.y + zone.h
    );
  };

  const points = useMemo<ClickPoint[]>(() => {
    return responses
      .map((r) => {
        const d = r.data as {
          x_pct?: number;
          y_pct?: number;
          time_to_click_ms?: number;
          in_zone?: boolean;
        };
        if (typeof d.x_pct !== "number" || typeof d.y_pct !== "number") return null;
        return {
          id: r.id,
          xPct: d.x_pct,
          yPct: d.y_pct,
          timeMs:
            typeof d.time_to_click_ms === "number" ? d.time_to_click_ms : null,
          inZone:
            typeof d.in_zone === "boolean" ? d.in_zone : inZone(d.x_pct, d.y_pct),
        };
      })
      .filter((p): p is ClickPoint => p !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, zone]);

  // Track rendered image size for accurate point placement.
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imgLoaded]);

  // Render a simple radial-gradient heatmap onto a canvas.
  useEffect(() => {
    if (view !== "heatmap" || !size || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(size.w));
    const h = Math.max(1, Math.round(size.h));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const radius = Math.max(24, Math.round(w * 0.08));
    ctx.globalCompositeOperation = "source-over";
    points.forEach((p) => {
      const x = (p.xPct / 100) * w;
      const y = (p.yPct / 100) * h;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, "rgba(239, 68, 68, 0.55)");
      grad.addColorStop(0.5, "rgba(245, 158, 11, 0.28)");
      grad.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [view, size, points]);

  if (!config.image_url) {
    return (
      <div className="text-sm text-muted-foreground">
        No image configured for this study.
      </div>
    );
  }

  if (responses.length === 0) {
    return <div className="text-sm text-muted-foreground">No clicks yet.</div>;
  }

  const successCount = points.filter((p) => p.inZone).length;
  const successRate = points.length
    ? Math.round((successCount / points.length) * 100)
    : 0;

  const avgTime = (() => {
    const times = points.map((p) => p.timeMs).filter((t): t is number => t !== null);
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length / 100) / 10;
  })();

  return (
    <div className="space-y-6">
      <StatGrid cols={zone ? 3 : 2}>
        <Stat label="Responses" value={points.length} tone="indigo" />
        {zone && (
          <Stat label="Success rate" value={`${successRate}%`} tone="green" />
        )}
        <Stat
          label="Average time"
          value={avgTime !== null ? `${avgTime}s` : "—"}
          tone="amber"
        />
      </StatGrid>

      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
        {(["heatmap", "dots"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all",
              view === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "heatmap" ? "Heatmap" : "Clicks"}
          </button>
        ))}
      </div>

      <div
        ref={wrapperRef}
        className="relative mt-2 overflow-hidden rounded-lg border border-border bg-card"
      >
        <img
          src={config.image_url}
          alt="Study stimulus"
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          className="block w-full select-none"
        />

        {/* Correct zone outline */}
        {zone && (
          <div
            className="pointer-events-none absolute border-2 border-emerald-500/80 bg-emerald-500/5"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
            }}
          />
        )}

        {/* Heatmap overlay */}
        {view === "heatmap" && (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0"
          />
        )}

        {/* Dot overlay */}
        {view === "dots" && (
          <div className="pointer-events-none absolute inset-0">
            {points.map((p, i) => (
              <span
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
              >
                <span
                  className={
                    "block h-3 w-3 rounded-full ring-2 ring-background shadow-md " +
                    (p.inZone ? "bg-emerald-500" : "bg-rose-500")
                  }
                />
                <span className="sr-only">Click {i + 1}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
