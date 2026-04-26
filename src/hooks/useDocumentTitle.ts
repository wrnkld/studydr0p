import { useEffect } from "react";

// Sets `document.title` for the lifetime of the calling component and restores
// the previous title on unmount. Used by the participant view so visitors
// never see the StudyDrop brand in their browser tab.
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
