import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FirstClickConfig } from "@/lib/types";
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
  onDone: () => void;
}

export default function FirstClickParticipant({
  study,
  sessionId,
  startedAt,
  onDone,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (submitting) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const xPct = (xPx / rect.width) * 100;
    const yPct = (yPx / rect.height) * 100;
    const elapsed = Date.now() - startedAt;

    setSubmitting(true);
    const data = {
      task: study.config.task,
      image_url: study.config.image_url,
      x_pct: xPct,
      y_pct: yPct,
      time_to_click_ms: elapsed,
      clicked_at: new Date().toISOString(),
      natural_width: img.naturalWidth,
      natural_height: img.naturalHeight,
    };
    const { error: respErr } = await supabase.from("responses").insert({
      study_id: study.id,
      session_id: sessionId,
      data: data as unknown as never,
    });
    if (respErr) {
      setSubmitting(false);
      toast.error(respErr.message);
      return;
    }
    await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        metadata: { duration_ms: elapsed },
      })
      .eq("id", sessionId);
    onDone();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-3xl py-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          First-click test
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{study.title}</h1>

        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-5">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your task
          </div>
          <p className="mt-2 whitespace-pre-wrap text-base">{study.config.task}</p>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Click the spot in the image where you'd go first.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <img
            ref={imgRef}
            src={study.config.image_url}
            alt="Click target"
            onClick={handleClick}
            draggable={false}
            className="block w-full cursor-crosshair select-none"
          />
        </div>
      </main>
    </div>
  );
}
