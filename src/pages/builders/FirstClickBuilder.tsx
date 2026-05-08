import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { FirstClickConfig, FirstClickZone, StudyStatus } from "@/lib/types";
import { ImageIcon, Upload } from "lucide-react";
import { useRegisterStudyActions } from "@/components/StudyToolbarContext";

interface Props {
  studyId: string;
  onMetaChange?: (meta: { title: string; description: string }) => void;
  initial: {
    title: string;
    description: string | null;
    status: StudyStatus;
    slug: string | null;
    config: FirstClickConfig;
  };
}

export default function FirstClickBuilder({ studyId, initial, onMetaChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [titleS, setTitleS] = useState(initial.title);
  const [descriptionS, setDescriptionS] = useState(initial.description ?? "");
  const setTitle = (v: string) => {
    setTitleS(v);
    onMetaChange?.({ title: v, description: descriptionS });
  };
  const setDescription = (v: string) => {
    setDescriptionS(v);
    onMetaChange?.({ title: titleS, description: v });
  };
  const [status, setStatus] = useState<StudyStatus>(initial.status);
  const [slug, setSlug] = useState<string | null>(initial.slug);
  const [task, setTask] = useState(initial.config.task ?? "");
  const [imageUrl, setImageUrl] = useState(initial.config.image_url ?? "");
  const [zone, setZone] = useState<FirstClickZone | null>(
    initial.config.correct_zone ?? null,
  );

  // Drawing state
  const [drawing, setDrawing] = useState<null | {
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  }>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${studyId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("study-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("study-assets").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setZone(null);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const pctFromEvent = (e: React.PointerEvent) => {
    const el = imgWrapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!imageUrl) return;
    const p = pctFromEvent(e);
    if (!p) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrawing({ startX: p.x, startY: p.y, curX: p.x, curY: p.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const p = pctFromEvent(e);
    if (!p) return;
    setDrawing({ ...drawing, curX: p.x, curY: p.y });
  };

  const onPointerUp = () => {
    if (!drawing) return;
    const x = Math.min(drawing.startX, drawing.curX);
    const y = Math.min(drawing.startY, drawing.curY);
    const w = Math.abs(drawing.curX - drawing.startX);
    const h = Math.abs(drawing.curY - drawing.startY);
    setDrawing(null);
    if (w < 1 || h < 1) return; // ignore tiny clicks
    setZone({ x, y, w, h });
  };

  const previewZone = drawing
    ? {
        x: Math.min(drawing.startX, drawing.curX),
        y: Math.min(drawing.startY, drawing.curY),
        w: Math.abs(drawing.curX - drawing.startX),
        h: Math.abs(drawing.curY - drawing.startY),
      }
    : zone;

  const save = async (
    overrides: Partial<{ status: StudyStatus; slug: string | null }> = {},
  ) => {
    setSaving(true);
    try {
      const config: FirstClickConfig = {
        task: task.trim(),
        image_url: imageUrl,
        correct_zone: zone,
      };
      const payload = {
        title: titleS.trim() || "Untitled study",
        description: descriptionS.trim() || null,
        config: config as unknown as never,
        status: overrides.status ?? status,
        slug: overrides.slug !== undefined ? overrides.slug : slug,
      };
      const { error } = await supabase
        .from("studies")
        .update(payload)
        .eq("id", studyId);
      if (error) {
        toast.error(error.message);
        return null;
      }
      return payload;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!task.trim()) {
      toast.error("Add a task prompt");
      return false;
    }
    if (!imageUrl) {
      toast.error("Upload an image first");
      return false;
    }
    if (!zone) {
      toast.error("Draw a correct click zone on the image");
      return false;
    }
    const newSlug = slug ?? generateSlug();
    const ok = await save({ status: "live", slug: newSlug });
    if (ok) {
      setStatus("live");
      setSlug(newSlug);
      return true;
    }
    return false;
  };

  const handleDelete = useCallback(async () => {
    const { error } = await supabase.from("studies").delete().eq("id", studyId);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Study deleted");
  }, [studyId]);

  useRegisterStudyActions({
    studyId,
    onSave: handleSave,
    onDelete: handleDelete,
    saving,
  });

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={titleS} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            value={descriptionS}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief context shown to participants."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task">Task prompt</Label>
          <Textarea
            id="task"
            rows={2}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Where would you click to reorder your last meal?"
          />
        </div>
      </section>

      <section className="space-y-2">
        <Label>Image</Label>
        {imageUrl ? (
          <div className="space-y-3">
            <div
              ref={imgWrapRef}
              className="relative overflow-hidden rounded-lg border border-border bg-muted select-none touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ cursor: "crosshair" }}
            >
              <img
                src={imageUrl}
                alt="First-click stimulus"
                draggable={false}
                className="block w-full"
              />
              {previewZone && previewZone.w > 0 && previewZone.h > 0 && (
                <div
                  className="pointer-events-none absolute border-2 border-emerald-500 bg-emerald-500/15"
                  style={{
                    left: `${previewZone.x}%`,
                    top: `${previewZone.y}%`,
                    width: `${previewZone.w}%`,
                    height: `${previewZone.h}%`,
                  }}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Click and drag on the image to mark the correct click zone.
              {zone ? " Drag again to redraw." : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Replace image"}
              </Button>
              {zone && (
                <Button variant="ghost" size="sm" onClick={() => setZone(null)}>
                  Clear zone
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageUrl("");
                  setZone(null);
                }}
              >
                Remove image
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
          >
            <ImageIcon className="h-8 w-8" />
            <span>{uploading ? "Uploading…" : "Click to upload an image"}</span>
            <span className="text-xs">PNG or JPG, up to 10 MB</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </section>
    </div>
  );
}
