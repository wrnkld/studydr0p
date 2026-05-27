import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type State =
  | { kind: "loading" }
  | { kind: "valid"; email?: string }
  | { kind: "already" }
  | { kind: "invalid"; message: string }
  | { kind: "success" }
  | { kind: "submitting" };

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Missing token." });
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    fetch(
      `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
      { headers: { apikey: anonKey } },
    )
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body?.valid) {
          setState({ kind: "valid", email: body.email });
        } else if (body?.alreadyUsed) {
          setState({ kind: "already" });
        } else {
          setState({ kind: "invalid", message: body?.error ?? "Invalid link." });
        }
      })
      .catch(() => setState({ kind: "invalid", message: "Something went wrong." }));
  }, [token]);

  const confirm = async () => {
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error || !data?.success) {
      setState({ kind: "invalid", message: error?.message ?? "Could not unsubscribe." });
      return;
    }
    setState({ kind: "success" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="font-serif text-3xl">Unsubscribe</h1>
        {state.kind === "loading" && (
          <p className="text-muted-foreground">Checking your link…</p>
        )}
        {state.kind === "valid" && (
          <>
            <p className="text-muted-foreground">
              {state.email
                ? `Unsubscribe ${state.email} from StudyDrop emails?`
                : "Unsubscribe from StudyDrop emails?"}
            </p>
            <Button onClick={confirm}>Confirm unsubscribe</Button>
          </>
        )}
        {state.kind === "submitting" && (
          <p className="text-muted-foreground">Unsubscribing…</p>
        )}
        {state.kind === "success" && (
          <p className="text-muted-foreground">You've been unsubscribed.</p>
        )}
        {state.kind === "already" && (
          <p className="text-muted-foreground">You're already unsubscribed.</p>
        )}
        {state.kind === "invalid" && (
          <p className="text-muted-foreground">{state.message}</p>
        )}
      </div>
    </main>
  );
}
