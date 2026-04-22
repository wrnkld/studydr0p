import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { FirstClickConfig, StudyStatus } from "@/lib/types";
import { ArrowLeft, ImageIcon, Upload } from "lucide-react";

interface Props {
  studyId: string;
  initial: {
    title: string;
    description: string | null;
    status: StudyStatus;
    slug: string | null;
    config: FirstClickConfig;
  };
}

export default function FirstClickBuilder({ studyId, initial }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<StudyStatus>(initial.status);
  const [slug, setSlug] = useState<string | null>(initial.slug);
  const [task, setTask] = useState(initial.config.task ?? "");
  const [imageUrl, setImageUrl] = useState(initial.config.image_url ?? "");

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
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = async (
    overrides: Partial<{ status: StudyStatus; slug: string | null }> = {},
  ) => {
    setSaving(true);
    const config: FirstClickConfig = { task: task.trim(), image_url: imageUrl };
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
    const ok = await save();
    if (ok) toast.success("Saved");
  };

  const handlePublish = async () => {
    if (!task.trim()) {
      toast.error("Add a task prompt");
      return;
    }
    if (!imageUrl) {
      toast.error("Upload an image first");
      return;
    }
    const newSlug = slug ?? generateSlug();
    const ok = await save({ status: "live", slug: newSlug });
    if (ok) {
      setStatus("live");
      setSlug(newSlug);
      toast.success("Published");
    }
  };

  const handleClose = async () => {
    const ok = await save({ status: "closed" });
    if (ok) {
      setStatus("closed");
      toast.success("Study closed");
    }
  };

  const shareUrl = slug ? `${window.location.origin}/s/${slug}` : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-10">
        <Link
          to="/studies"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Edit first-click test</h1>
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
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context shown to participants."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task">Task prompt</Label>
            <Textarea
              id="task"
              rows={3}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Where would you click to add a new project?"
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Image
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Participants click on this image to answer the task.
          </p>

          <div className="mt-4">
            {imageUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={imageUrl}
                    alt="First-click test stimulus"
                    className="mx-auto max-h-[500px] w-auto"
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
                    onClick={() => setImageUrl("")}
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
