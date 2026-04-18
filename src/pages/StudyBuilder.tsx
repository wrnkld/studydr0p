import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { SurveyConfig, SurveyQuestion, SurveyQuestionType, StudyStatus } from "@/lib/types";
import { Trash2, Plus, ArrowLeft } from "lucide-react";

export default function StudyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<StudyStatus>("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [config, setConfig] = useState<SurveyConfig>({ questions: [], layout: "single_page" });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("studies")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Study not found");
        navigate("/dashboard");
        return;
      }
      setTitle(data.title);
      setDescription(data.description ?? "");
      setStatus(data.status);
      setSlug(data.slug);
      const cfg = (data.config as unknown as SurveyConfig) ?? { questions: [], layout: "single_page" };
      setConfig({
        questions: cfg.questions ?? [],
        layout: cfg.layout ?? "single_page",
      });
      setLoading(false);
    })();
  }, [id, navigate]);

  const addQuestion = (type: SurveyQuestionType) => {
    setConfig((c) => ({
      ...c,
      questions: [
        ...c.questions,
        {
          id: crypto.randomUUID(),
          type,
          label: "",
          options: type === "multiple_choice" ? ["Option 1", "Option 2"] : undefined,
        },
      ],
    }));
  };

  const updateQuestion = (qid: string, patch: Partial<SurveyQuestion>) => {
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
    }));
  };

  const removeQuestion = (qid: string) => {
    setConfig((c) => ({ ...c, questions: c.questions.filter((q) => q.id !== qid) }));
  };

  const save = async (overrides: Partial<{ status: StudyStatus; slug: string | null }> = {}) => {
    if (!id) return null;
    setSaving(true);
    const payload = {
      title: title.trim() || "Untitled study",
      description: description.trim() || null,
      config: config as unknown as never,
      status: overrides.status ?? status,
      slug: overrides.slug !== undefined ? overrides.slug : slug,
    };
    const { error } = await supabase.from("studies").update(payload).eq("id", id);
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
    if (config.questions.length === 0) {
      toast.error("Add at least one question first");
      return;
    }
    if (config.questions.some((q) => !q.label.trim())) {
      toast.error("All questions need a label");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const shareUrl = slug ? `${window.location.origin}/s/${slug}` : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-10">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Edit study</h1>
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
              placeholder="Brief context shown to participants."
            />
          </div>
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={config.layout ?? "single_page"}
              onValueChange={(v) => setConfig((c) => ({ ...c, layout: v as SurveyConfig["layout"] }))}
            >
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_page">All on one page</SelectItem>
                <SelectItem value="one_per_page">One per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Questions
            </h2>
          </div>

          <ul className="mt-4 space-y-3">
            {config.questions.map((q, i) => (
              <li key={q.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-2 text-xs text-muted-foreground">{i + 1}.</div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={q.type}
                        onValueChange={(v) => {
                          const next = v as SurveyQuestionType;
                          updateQuestion(q.id, {
                            type: next,
                            options:
                              next === "multiple_choice"
                                ? q.options ?? ["Option 1", "Option 2"]
                                : undefined,
                          });
                        }}
                      >
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                          <SelectItem value="likert">Likert (1-5)</SelectItem>
                          <SelectItem value="open_text">Open text</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Question…"
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                    />
                    {q.type === "multiple_choice" && (
                      <div className="space-y-2">
                        {(q.options ?? []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const opts = [...(q.options ?? [])];
                                opts[oi] = e.target.value;
                                updateQuestion(q.id, { options: opts });
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const opts = (q.options ?? []).filter((_, i) => i !== oi);
                                updateQuestion(q.id, { options: opts });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuestion(q.id, {
                              options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`],
                            })
                          }
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add option
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addQuestion("multiple_choice")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Multiple choice
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("likert")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Likert
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("open_text")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Open text
            </Button>
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
              <a href={`/s/${slug}`} target="_blank" rel="noreferrer">Preview</a>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
