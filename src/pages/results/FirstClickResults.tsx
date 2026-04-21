import { useEffect, useMemo, useRef, useState } from "react";
import h337 from "heatmap.js";
import { FirstClickConfig } from "@/lib/types";

interface ResponseRow {
  id: string;
  data: Record<string, unknown>;
}

interface ClickPoint {
  id: string;
  xPct: number;
  yPct: number;
  timeMs: number | null;
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

  const points = useMemo<ClickPoint[]>(() => {
    return responses
      .map((r) => {
        const d = r.data as {
          x_pct?: number;
          y_pct?: number;
          time_to_click_ms?: number;
        };
        if (typeof d.x_pct !== "number" || typeof d.y_pct !== "number") return null;
        return {
          id: r.id,
          xPct: d.x_pct,
          yPct: d.y_pct,
          timeMs: typeof d.time_to_click_ms === "number" ? d.time_to_click_ms : null,
        };
      })
      .filter((p): p is ClickPoint => p !== null);
  }, [responses]);

  const showHeatmap = points.length > 5;

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

  // Initialize / update heatmap when conditions are met.
  useEffect(() => {
    if (!showHeatmap || !size || !heatmapContainerRef.current) return;

    if (!heatmapInstanceRef.current) {
      heatmapInstanceRef.current = h337.create({
        container: heatmapContainerRef.current,
        radius: Math.max(20, Math.round(size.w * 0.05)),
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
  }, [showHeatmap, size, points]);

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

  const avgTime = (() => {
    const times = points.map((p) => p.timeMs).filter((t): t is number => t !== null);
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length / 100) / 10;
  })();

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Click locations
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{points.length} click{points.length === 1 ? "" : "s"} recorded</span>
        {avgTime !== null && <span>Avg time to click: {avgTime}s</span>}
        <span className="text-xs">
          {showHeatmap
            ? "Heatmap visible — needs more than 5 clicks"
            : `Heatmap unlocks at 6 clicks (${points.length}/6)`}
        </span>
      </div>

      <div
        ref={wrapperRef}
        className="relative mt-4 overflow-hidden rounded-lg border border-border bg-card"
      >
        <img
          src={config.image_url}
          alt="Study stimulus"
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          className="block w-full select-none"
        />

        {/* Heatmap overlay — heatmap.js renders into this container. */}
        {showHeatmap && (
          <div
            ref={heatmapContainerRef}
            className="pointer-events-none absolute inset-0"
          />
        )}

        {/* Dot overlay (always visible) */}
        <div className="pointer-events-none absolute inset-0">
          {points.map((p, i) => (
            <span
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
            >
              <span className="block h-3 w-3 rounded-full bg-primary ring-2 ring-background shadow-md" />
              <span className="sr-only">Click {i + 1}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
