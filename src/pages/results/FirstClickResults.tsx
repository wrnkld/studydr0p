import { useEffect, useMemo, useRef, useState } from "react";
import { FirstClickConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";

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
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const heatmapInstanceRef = useRef<ReturnType<typeof h337.create> | null>(null);
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

  // Initialize / update heatmap when in heatmap view
  useEffect(() => {
    if (view !== "heatmap" || !size || !heatmapContainerRef.current) return;

    if (!heatmapInstanceRef.current) {
      heatmapInstanceRef.current = h337.create({
        container: heatmapContainerRef.current,
        radius: Math.max(20, Math.round(size.w * 0.06)),
        maxOpacity: 0.7,
        minOpacity: 0,
        blur: 0.85,
      });
    }

    const data = points.map((p) => ({
      x: Math.round((p.xPct / 100) * size.w),
      y: Math.round((p.yPct / 100) * size.h),
      value: 1,
    }));

    heatmapInstanceRef.current.setData({
      max: Math.max(2, Math.ceil(points.length / 4)),
      min: 0,
      data,
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-2xl font-semibold tracking-tight">
            {points.length}
          </span>
          <span className="ml-1.5 text-muted-foreground">
            {points.length === 1 ? "response" : "responses"}
          </span>
        </div>
        {zone && (
          <div>
            <span className="text-2xl font-semibold tracking-tight text-emerald-600">
              {successRate}%
            </span>
            <span className="ml-1.5 text-muted-foreground">success rate</span>
          </div>
        )}
        {avgTime !== null && (
          <div className="text-muted-foreground">
            Avg time to click: {avgTime}s
          </div>
        )}
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
        {(["heatmap", "dots"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all " +
              (view === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {v === "heatmap" ? "Heatmap" : "Click dots"}
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
          <div
            ref={heatmapContainerRef}
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

      {zone && (
        <p className="text-sm text-muted-foreground">
          {successRate}% clicked in the target area.
        </p>
      )}
    </div>
  );
}
