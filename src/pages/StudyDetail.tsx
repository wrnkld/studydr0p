import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import StudyResultsView from "@/components/StudyResultsView";

// Researcher results page at /studies/:id/results.
// Pure data view — no edit form. Editing lives back at /studies/:id.
export default function StudyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("studies")
        .select("title")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Study not found");
        navigate("/");
        return;
      }
      setTitle(data.title ?? "Untitled");
    })();
  }, [id, navigate]);

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    const { error } = await supabase.from("studies").delete().eq("id", id);
    setDeleting(false);
    setConfirmOpen(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Study deleted");
    navigate("/", { replace: true });
  };

  if (!id) return null;

  return (
    <main className="container max-w-3xl py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={`/studies/${id}`}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            ← Back to builder
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {title || "Untitled"} · Results
          </h1>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Delete
        </button>
      </div>

      <StudyResultsView studyId={id} />

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
    </main>
  );
}
