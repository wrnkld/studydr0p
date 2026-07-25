import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { PageContainer } from "@/components/study/primitives";
import { Loader2, ShieldCheck } from "lucide-react";

export default function Checkout() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const returnTo = params.get("return") || "/";
  const returnUrl = `${window.location.origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=success`;

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            priceId: "pro_lifetime",
            customerEmail: user.email ?? undefined,
            userId: user.id,
            returnUrl,
            environment: getStripeEnvironment(),
          },
        });
        if (error || !data?.url) throw new Error(error?.message || "Failed to start checkout");
        window.location.href = data.url as string;
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [user, returnUrl]);

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 py-16 text-center">
          {error ? (
            <p className="font-mono text-xs uppercase tracking-wider text-destructive">{error}</p>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Redirecting to secure checkout…</p>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Powered by Stripe
              </p>
            </>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
