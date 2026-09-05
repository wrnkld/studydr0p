import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns whether the current researcher has an active paid plan.
 * `loading` is true until we've fetched the row at least once.
 */
export function usePaid() {
  const { user } = useAuth();
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPaid(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("researchers")
        .select("is_paid")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setIsPaid(!!data?.is_paid);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isPaid, loading };
}
