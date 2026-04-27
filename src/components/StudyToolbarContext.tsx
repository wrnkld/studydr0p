import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Lets the StudyBuilder page register Save / Delete actions so the global
 * FloatingToolbar can render them. Builders call `useRegisterStudyActions`
 * with their handlers; the toolbar reads them via `useStudyToolbar`.
 */
export interface StudyActions {
  studyId: string;
  onSave: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  saving?: boolean;
}

interface Ctx {
  actions: StudyActions | null;
  setActions: (a: StudyActions | null) => void;
  /** If set, TopBar's Delete button calls this instead of actions.onDelete. */
  requestDelete: (() => void) | null;
  setRequestDelete: (fn: (() => void) | null) => void;
}

const StudyToolbarCtx = createContext<Ctx | null>(null);

export function StudyToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<StudyActions | null>(null);
  const [requestDelete, setRequestDelete] = useState<(() => void) | null>(null);
  const value = useMemo(
    () => ({ actions, setActions, requestDelete, setRequestDelete }),
    [actions, requestDelete],
  );
  return <StudyToolbarCtx.Provider value={value}>{children}</StudyToolbarCtx.Provider>;
}

export function useStudyToolbar() {
  const ctx = useContext(StudyToolbarCtx);
  if (!ctx) throw new Error("useStudyToolbar must be used inside StudyToolbarProvider");
  return ctx;
}

export function useRegisterStudyActions(actions: StudyActions | null) {
  const ctx = useContext(StudyToolbarCtx);
  const stableSet = useCallback(
    (a: StudyActions | null) => ctx?.setActions(a),
    [ctx],
  );
  useEffect(() => {
    stableSet(actions);
    return () => stableSet(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    actions?.studyId,
    actions?.onSave,
    actions?.onDelete,
    actions?.saving,
  ]);
}
