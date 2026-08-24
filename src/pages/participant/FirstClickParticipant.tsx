import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FirstClickConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/study/primitives";
import { toast } from "sonner";

interface Props {
  study: {
    id: string;
    title: string;
    description: string | null;
    config: FirstClickConfig;
  };
  sessionId: string;
  startedAt: number;
  preview?: boolean;
  inMemory?: boolean;
  onSubmitInMemory?: (data: {
    x_pct: number;
    y_pct: number;
    time_to_click_ms: number;
    in_zone: boolean;
  }) => void;
  onDone: () => void;
}

export default function FirstClickParticipant({
  study,
  sessionId,
  startedAt,
  preview = false,
  inMemory = false,
  onSubmitInMemory,
  onDone,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [click, setClick] = useState<null | { xPct: number; yPct: number; ms: number }>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const cfg = study.config;

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (click || submitting) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setClick({ xPct, yPct, ms: Date.now() - startedAt });
  };

  const inZone = (xPct: number, yPct: number) => {
    const z = cfg.correct_zone;
    if (!z) return false;
    return (
      xPct >= z.x &&
      xPct <= z.x + z.w &&
      yPct >= z.y &&
      yPct <= z.y + z.h
    );
  };

  const confirm = async () => {
    if (!click) return;
    setSubmitting(true);
    const data = {
      task: cfg.task,
      image_url: cfg.image_url,
      x_pct: click.xPct,
      y_pct: click.yPct,
      time_to_click_ms: click.ms,
      in_zone: inZone(click.xPct, click.yPct),
      clicked_at: new Date().toISOString(),
    };

    if (inMemory) {
      onSubmitInMemory?.({
        x_pct: click.xPct,
        y_pct: click.yPct,
        time_to_click_ms: click.ms,
        in_zone: data.in_zone,
      });
      setSubmitting(false);
      onDone();
      return;
    }

    const { error } = await supabase.from("responses").insert({
      study_id: study.id,
      session_id: sessionId,
      data: data as unknown as never,
    });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        metadata: { duration_ms: click.ms },
      })
      .eq("id", sessionId);
    setSubmitting(false);
    if (preview) {
      onDone();
      return;
    }
    onDone();
  };

  if (!cfg.image_url) {
    return (
      <p className="text-sm text-muted-foreground">No image uploaded yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {cfg.task && (
        <div className="space-y-2">
          <Kicker>Task</Kicker>
          <h3 className="text-[17px] font-medium tracking-tight">{cfg.task}</h3>
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <img
          ref={imgRef}
          src={cfg.image_url}
          alt="Click target"
          onClick={handleClick}
          draggable={false}
          className={
            "block w-full select-none " +
            (click ? "cursor-default" : "cursor-crosshair")
          }
        />
        {click && (
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${click.xPct}%`, top: `${click.yPct}%` }}
          >
            <span className="block h-4 w-4 rounded-full bg-primary ring-2 ring-background shadow-md" />
          </span>
        )}
      </div>

      {click && (
        <div className="flex items-center gap-3">
          <Button onClick={confirm} disabled={submitting}>
            {submitting ? "Submitting…" : "Confirm click"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setClick(null)}
            disabled={submitting}
          >
            Click somewhere else
          </Button>
        </div>
      )}
    </div>
  );
}
