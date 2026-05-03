import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { CardSortConfig, CardRow, CategoryRow, StudyStatus } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { useRegisterStudyActions } from "@/components/StudyToolbarContext";

interface Props {
  studyId: string;
  onMetaChange?: (meta: { title: string; description: string }) => void;
  initial: {
    title: string;
    description: string | null;
    status: StudyStatus;
    slug: string | null;
    config: CardSortConfig;
  };
}

interface DraftCard {
  id: string;
  label: string;
  description: string;
  position: number;
  // tracks if this row already exists in DB
  persisted: boolean;
}
interface DraftCategory {
  id: string;
  label: string;
  position: number;
  persisted: boolean;
}

export default function CardSortBuilder({ studyId, initial, onMetaChange }: Props) {
  const navigate = useNavigate();
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitleState] = useState(initial.title);
  const [description, setDescriptionState] = useState(initial.description ?? "");
  const setTitle = (v: string) => {
    setTitleState(v);
    onMetaChange?.({ title: v, description });
  };
  const setDescription = (v: string) => {
    setDescriptionState(v);
    onMetaChange?.({ title, description: v });
  };
  const [status, setStatus] = useState<StudyStatus>(initial.status);
  const [slug, setSlug] = useState<string | null>(initial.slug);
  const [sortType, setSortType] = useState<"open" | "closed">(
    initial.config.sort_type ?? "open",
  );
  const [cards, setCards] = useState<DraftCard[]>([]);
  const [categories, setCategories] = useState<DraftCategory[]>([]);

  useEffect(() => {
    (async () => {
      const [cardsRes, catsRes] = await Promise.all([
        supabase
          .from("cards")
          .select("id, label, description, position")
          .eq("study_id", studyId)
          .order("position"),
        supabase
          .from("categories")
          .select("id, label, position")
          .eq("study_id", studyId)
          .order("position"),
      ]);
      setCards(
        (cardsRes.data ?? []).map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description ?? "",
          position: c.position,
          persisted: true,
        })),
      );
      setCategories(
        (catsRes.data ?? []).map((c) => ({
          id: c.id,
          label: c.label,
          position: c.position,
          persisted: true,
        })),
      );
      setLoadingChildren(false);
    })();
  }, [studyId]);

  const addCard = () => {
    setCards((cs) => [
      ...cs,
      {
        id: crypto.randomUUID(),
        label: "",
        description: "",
        position: cs.length,
        persisted: false,
      },
    ]);
  };
  const updateCard = (id: string, patch: Partial<DraftCard>) => {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  const removeCard = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    setCards((cs) => cs.filter((c) => c.id !== id));
    if (card?.persisted) {
      await supabase.from("cards").delete().eq("id", id);
    }
  };

  const addCategory = () => {
    setCategories((cs) => [
      ...cs,
      {
        id: crypto.randomUUID(),
        label: "",
        position: cs.length,
        persisted: false,
      },
    ]);
  };
  const updateCategory = (id: string, patch: Partial<DraftCategory>) => {
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  const removeCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    setCategories((cs) => cs.filter((c) => c.id !== id));
    if (cat?.persisted) {
      await supabase.from("categories").delete().eq("id", id);
    }
  };

  const persistChildren = async () => {
    // Upsert cards
    const cardRows = cards.map((c, i) => ({
      id: c.id,
      study_id: studyId,
      label: c.label.trim() || "Untitled card",
      description: c.description.trim() || null,
      position: i,
    }));
    if (cardRows.length) {
      const { error } = await supabase.from("cards").upsert(cardRows);
      if (error) {
        console.error("[CardSortBuilder] cards upsert failed", error);
        throw new Error(`Couldn't save cards: ${error.message}`);
      }
    }

    if (sortType === "closed") {
      const catRows = categories.map((c, i) => ({
        id: c.id,
        study_id: studyId,
        label: c.label.trim() || "Untitled category",
        position: i,
      }));
      if (catRows.length) {
        const { error } = await supabase.from("categories").upsert(catRows);
        if (error) {
          console.error("[CardSortBuilder] categories upsert failed", error);
          throw new Error(`Couldn't save categories: ${error.message}`);
        }
      }
    } else {
      // open sort: drop any leftover categories
      if (categories.some((c) => c.persisted)) {
        await supabase.from("categories").delete().eq("study_id", studyId);
      }
    }

    // mark all as persisted
    setCards((cs) => cs.map((c, i) => ({ ...c, persisted: true, position: i })));
    setCategories((cs) =>
      cs.map((c, i) => ({ ...c, persisted: true, position: i })),
    );
  };

  const save = async (
    overrides: Partial<{ status: StudyStatus; slug: string | null }> = {},
  ) => {
    setSaving(true);
    try {
      // Verify the study still exists and is owned by this researcher.
      // Without this we'd silently update 0 rows or hit confusing RLS errors
      // on the child tables.
      const { data: existing, error: checkErr } = await supabase
        .from("studies")
        .select("id")
        .eq("id", studyId)
        .maybeSingle();
      if (checkErr) {
        console.error("[CardSortBuilder] study lookup failed", checkErr);
        throw new Error(checkErr.message);
      }
      if (!existing) {
        toast.error("This study no longer exists. Redirecting…");
        navigate("/");
        return null;
      }

      const payload = {
        title: title.trim() || "Untitled study",
        description: description.trim() || null,
        config: { sort_type: sortType } as unknown as never,
        status: overrides.status ?? status,
        slug: overrides.slug !== undefined ? overrides.slug : slug,
      };
      const { error: updateErr } = await supabase
        .from("studies")
        .update(payload)
        .eq("id", studyId);
      if (updateErr) {
        console.error("[CardSortBuilder] study update failed", updateErr);
        throw new Error(`Couldn't save study: ${updateErr.message}`);
      }

      // Save cards/categories AFTER the study exists & is updated
      await persistChildren();

      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong while saving";
      toast.error(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (cards.length < 2) {
      toast.error("Add at least 2 cards");
      return;
    }
    if (cards.some((c) => !c.label.trim())) {
      toast.error("All cards need a label");
      return;
    }
    if (sortType === "closed") {
      if (categories.length < 2) {
        toast.error("Closed sort needs at least 2 categories");
        return;
      }
      if (categories.some((c) => !c.label.trim())) {
        toast.error("All categories need a label");
        return;
      }
    }
    const newSlug = slug ?? generateSlug();
    const ok = await save({ status: "live", slug: newSlug });
    if (ok) {
      setStatus("live");
      setSlug(newSlug);
      toast.success("Saved");
    }
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

  

  if (loadingChildren) {
    return <p className="py-6 text-sm text-muted-foreground">Loading…</p>;
  }

  const shareUrl = slug ? `${window.location.origin}/s/${slug}` : null;

  return (
    <div className="space-y-6">

      <section className="space-y-4">
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
          <Label>Sort type</Label>
          <RadioGroup
            value={sortType}
            onValueChange={(v) => setSortType(v as "open" | "closed")}
            className="gap-2"
          >
            <label className="flex cursor-pointer items-start gap-2 text-sm font-normal">
              <RadioGroupItem value="open" id="sort-open" className="mt-0.5" />
              <span className="flex flex-col">
                <span className="font-medium">Open</span>
                <span className="text-sm text-muted-foreground">Participants name categories</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm font-normal">
              <RadioGroupItem value="closed" id="sort-closed" className="mt-0.5" />
              <span className="flex flex-col">
                <span className="font-medium">Closed</span>
                <span className="text-sm text-muted-foreground">You define categories</span>
              </span>
            </label>
          </RadioGroup>
        </div>
      </section>

      <section className="space-y-2">
        <div><Label>Cards</Label></div>
        {cards.length > 0 && (
          <ul className="space-y-3">
            {cards.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2">
                <div className="w-6 text-sm text-muted-foreground">{i + 1}.</div>
                <Input
                  placeholder="Card label"
                  value={c.label}
                  onChange={(e) => updateCard(c.id, { label: e.target.value })}
                />
                <Button variant="ghost" size="icon" onClick={() => removeCard(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" onClick={addCard} className="self-start">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add card
        </Button>
      </section>

      {sortType === "closed" && (
        <section className="space-y-2">
          <div><Label>Categories</Label></div>
          {categories.length > 0 && (
            <ul className="space-y-2">
              {categories.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2">
                  <div className="w-6 text-sm text-muted-foreground">{i + 1}.</div>
                  <Input
                    placeholder="Category label"
                    value={c.label}
                    onChange={(e) => updateCategory(c.id, { label: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCategory(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" onClick={addCategory} className="self-start">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add category
          </Button>
        </section>
      )}
    </div>
  );
}

