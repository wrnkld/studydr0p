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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StudyResultsView from "@/components/StudyResultsView";
import { PageContainer } from "@/components/study/primitives";

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
    <PageContainer>
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Link to={`/studies/${id}`} className="text-sm underline">
            ← Back to builder
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {title || "Untitled"} · Results
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </header>

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
    </PageContainer>
  );
}
