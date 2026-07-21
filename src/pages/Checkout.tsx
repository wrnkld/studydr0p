import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PageContainer } from "@/components/study/primitives";
import { Lock, ShieldCheck } from "lucide-react";

export default function Checkout() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const returnTo = params.get("return") || "/";
  const returnUrl = `${window.location.origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=success`;

  return (
    <div className="min-h-screen bg-muted">
      <PageContainer>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-8 sm:py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">StudyDrop</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Secure checkout powered by Stripe
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
            {user && (
              <StripeEmbeddedCheckout
                priceId="pro_lifetime"
                customerEmail={user.email ?? undefined}
                userId={user.id}
                returnUrl={returnUrl}
              />
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
