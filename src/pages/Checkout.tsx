import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PageContainer } from "@/components/study/primitives";

export default function Checkout() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const returnTo = params.get("return") || "/";
  const returnUrl = `${window.location.origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=success`;

  return (
    <div className="min-h-screen bg-muted">
      <PageContainer>
        <div className="mx-auto w-full max-w-3xl py-8">
          {user && (
            <StripeEmbeddedCheckout
              priceId="pro_lifetime"
              customerEmail={user.email ?? undefined}
              userId={user.id}
              returnUrl={returnUrl}
            />
          )}
        </div>
      </PageContainer>
    </div>
  );
}
