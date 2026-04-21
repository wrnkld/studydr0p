import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StudyStatus, StudyType } from "@/lib/types";

interface StudyRow {
  id: string;
  title: string;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
}

// Study detail page per wireframe: title, Share/Edit/Delete buttons, and
// a grid of placeholder visualization blocks. Share only appears when the
// study is live and has a shareable slug.
export default function StudyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState<StudyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("studies")
        .select("id, title, type, status, slug")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Study not found");
        navigate("/dashboard");
        return;
      }
      setStudy(data as StudyRow);
      setLoading(false);
    })();
  }, [id, navigate]);

  const share = async () => {
    if (!study?.slug) return;
    const url = `${window.location.origin}/s/${study.slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  };

  const remove = async () => {
    if (!study) return;
    setDeleting(true);
    const { error } = await supabase.from("studies").delete().eq("id", study.id);
    setDeleting(false);
    setConfirmOpen(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Study deleted");
    navigate("/dashboard", { replace: true });
  };

  if (loading || !study) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  const canShare = study.status === "live" && !!study.slug;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl py-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <h1 className="text-5xl font-semibold tracking-tight">
            {study.title || "Untitled"}
          </h1>

          <div className="flex flex-wrap gap-3">
            {canShare && (
              <Button size="lg" className="rounded-full" onClick={share}>
                Share
              </Button>
            )}
            <Button asChild size="lg" className="rounded-full">
              <Link to={`/dashboard/studies/${study.id}/edit`}>Edit</Link>
            </Button>
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Placeholder visualization blocks */}
        <section className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="aspect-[16/9] rounded-2xl border border-dashed border-border bg-card/50"
            />
          ))}
        </section>

        <div className="mt-12">
          <Link
            to={`/dashboard/studies/${study.id}/results`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View detailed results →
          </Link>
        </div>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the study and all of its responses. This
              action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
