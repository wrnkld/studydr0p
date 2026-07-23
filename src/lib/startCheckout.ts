import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export async function startCheckout(opts: {
  userId: string;
  email?: string;
  returnTo: string;
}): Promise<void> {
  const returnUrl = `${window.location.origin}${opts.returnTo}${opts.returnTo.includes("?") ? "&" : "?"}checkout=success`;
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      priceId: "pro_lifetime",
      customerEmail: opts.email,
      userId: opts.userId,
      returnUrl,
      environment: getStripeEnvironment(),
    },
  });
  if (error || !data?.url) throw new Error(error?.message || "Failed to start checkout");
  window.location.href = data.url as string;
}
