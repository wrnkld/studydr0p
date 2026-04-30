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

export interface StudyMeta {
  title: string;
  status: "draft" | "live" | "closed" | string;
  shareUrl: string | null;
}

interface Ctx {
  actions: StudyActions | null;
  setActions: (a: StudyActions | null) => void;
  /** If set, TopBar's Delete button calls this instead of actions.onDelete. */
  requestDelete: (() => void) | null;
  setRequestDelete: (fn: (() => void) | null) => void;
  /** If set, TopBar shows an Export option that calls this. */
  exportCsv: (() => void) | null;
  setExportCsv: (fn: (() => void) | null) => void;
  meta: StudyMeta | null;
  setMeta: (m: StudyMeta | null) => void;
  /** Optional tabs rendered centered in the TopBar. */
  headerTabs: ReactNode | null;
  setHeaderTabs: (n: ReactNode | null) => void;
}

const StudyToolbarCtx = createContext<Ctx | null>(null);

export function StudyToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<StudyActions | null>(null);
  const [requestDelete, setRequestDelete] = useState<(() => void) | null>(null);
  const [exportCsv, setExportCsv] = useState<(() => void) | null>(null);
  const [meta, setMeta] = useState<StudyMeta | null>(null);
  const [headerTabs, setHeaderTabsState] = useState<ReactNode | null>(null);
  const setHeaderTabs = useCallback(
    (n: ReactNode | null) => setHeaderTabsState(n),
    [],
  );
  const value = useMemo(
    () => ({
      actions,
      setActions,
      requestDelete,
      setRequestDelete,
      exportCsv,
      setExportCsv,
      meta,
      setMeta,
      headerTabs,
      setHeaderTabs,
    }),
    [actions, requestDelete, exportCsv, meta, headerTabs, setHeaderTabs],
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
