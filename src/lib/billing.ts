import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export interface BillingSubscription {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  created: string | null;
}

export interface BillingInvoice {
  id: string;
  status: string | null;
  amount_paid: number;
  currency: string;
  created: string | null;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
}

export interface BillingData {
  subscription: BillingSubscription | null;
  invoices: BillingInvoice[];
}

/** Reads plan + payment history straight from Stripe for the signed-in user. */
export async function fetchBillingData(): Promise<BillingData> {
  const { data, error } = await supabase.functions.invoke("get-billing-data", {
    body: { environment: getStripeEnvironment() },
  });
  if (error) throw new Error(error.message || "Could not load billing details");
  return {
    subscription: (data?.subscription ?? null) as BillingSubscription | null,
    invoices: (data?.invoices ?? []) as BillingInvoice[],
  };
}

/** Opens the Stripe-hosted billing portal (must be a new tab — Stripe blocks framing). */
export async function openBillingPortal(returnTo = "/account"): Promise<void> {
  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: {
      environment: getStripeEnvironment(),
      returnUrl: `${window.location.origin}${returnTo}`,
    },
  });
  if (error || !data?.url) throw new Error(error?.message || "Could not open billing");
  window.open(data.url as string, "_blank", "noopener");
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount} ${currency.toUpperCase()}`;
  }
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
