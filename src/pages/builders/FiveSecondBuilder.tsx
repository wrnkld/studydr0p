import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { FiveSecondConfig, StudyStatus, SurveyQuestion } from "@/lib/types";
import { ArrowLeft, ImageIcon, Plus, Trash2, Upload } from "lucide-react";

interface Props {
  studyId: string;
  initial: {
    title: string;
    description: string | null;
    status: StudyStatus;
    slug: string | null;
    config: FiveSecondConfig;
  };
}

const MAX_QUESTIONS = 3;

export default function FiveSecondBuilder({ studyId, initial }: Props) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<StudyStatus>(initial.status);
  const [slug, setSlug] = useState<string | null>(initial.slug);
  const [config, setConfig] = useState<FiveSecondConfig>({
    image_url: initial.config.image_url ?? "",
    duration_ms: initial.config.duration_ms ?? 5000,
    follow_up: initial.config.follow_up ?? [],
  });

  const addQuestion = () => {
    if (config.follow_up.length >= MAX_QUESTIONS) return;
    setConfig((c) => ({
      ...c,
      follow_up: [
        ...c.follow_up,
        { id: crypto.randomUUID(), type: "open_text", label: "" },
      ],
    }));
  };

  const updateQuestion = (qid: string, patch: Partial<SurveyQuestion>) => {
    setConfig((c) => ({
      ...c,
      follow_up: c.follow_up.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
    }));
  };

  const removeQuestion = (qid: string) => {
    setConfig((c) => ({ ...c, follow_up: c.follow_up.filter((q) => q.id !== qid) }));
  };

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
    setConfig((c) => ({ ...c, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = async (
    overrides: Partial<{ status: StudyStatus; slug: string | null }> = {},
  ) => {
    setSaving(true);
    const payload = {
      title: title.trim() || "Untitled study",
      description: description.trim() || null,
      config: config as unknown as never,
      status: overrides.status ?? status,
      slug: overrides.slug !== undefined ? overrides.slug : slug,
    };
    const { error } = await supabase.from("studies").update(payload).eq("id", studyId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return null;
    }
    return payload;
  };

  const handleSave = async () => {
    if (!config.image_url) {
      toast.error("Upload an image first");
      return;
    }
    if (config.follow_up.length === 0) {
      toast.error("Add at least one follow-up question");
      return;
    }
    if (config.follow_up.some((q) => !q.label.trim())) {
      toast.error("All questions need a label");
      return;
    }
    const newSlug = slug ?? generateSlug();
    const ok = await save({ status: "live", slug: newSlug });
    if (ok) {
      setStatus("live");
      setSlug(newSlug);
      toast.success("Saved");
    }
  };

  const shareUrl = slug ? `${window.location.origin}/s/${slug}` : null;

  return (
    <div className="min-h-screen bg-background">

      <main className="container max-w-3xl py-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Studies
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Edit five-second test</h1>
          <span className="text-xs text-muted-foreground">Status: {status}</span>
        </div>

        <section className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context shown to participants before the test."
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Image
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shown to participants for exactly 5 seconds.
          </p>

          <div className="mt-4">
            {config.image_url ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={config.image_url}
                    alt="Five-second test preview"
                    className="mx-auto max-h-[400px] w-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {uploading ? "Uploading…" : "Replace image"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfig((c) => ({ ...c, image_url: "" }))}
                  >
                    Remove
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
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Follow-up questions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Up to {MAX_QUESTIONS} open-text questions shown after the image.
          </p>

          <ul className="mt-4 space-y-3">
            {config.follow_up.map((q, i) => (
              <li key={q.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-2 text-xs text-muted-foreground">{i + 1}.</div>
                  <div className="flex-1">
                    <Input
                      placeholder="What did you see?"
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {config.follow_up.length < MAX_QUESTIONS && (
            <Button variant="outline" size="sm" className="mt-4" onClick={addQuestion}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add question
            </Button>
          )}
        </section>

        {shareUrl && status === "live" && (
          <section className="mt-10 rounded-lg border border-border p-5">
            <div className="text-sm font-medium">Share link</div>
            <div className="mt-2 flex gap-2">
              <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Copied");
                }}
              >
                Copy
              </Button>
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {status !== "live" && (
            <Button onClick={handlePublish} disabled={saving}>
              {status === "closed" ? "Re-publish" : "Publish"}
            </Button>
          )}
          {status === "live" && (
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Close study
            </Button>
          )}
          {status === "live" && slug && (
            <Button asChild variant="ghost">
              <a href={`/s/${slug}`} target="_blank" rel="noreferrer">
                Preview
              </a>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
