import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);
const THREE_DECIMAL = new Set(["bhd", "jod", "kwd", "omr", "tnd"]);

function toMajorUnit(amount: number | null | undefined, currency: string): number {
  const value = amount ?? 0;
  const c = (currency ?? "").toLowerCase();
  if (ZERO_DECIMAL.has(c)) return value;
  if (THREE_DECIMAL.has(c)) return value / 1000;
  return value / 100;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function findCustomerIds(
  stripe: ReturnType<typeof createStripeClient>,
  opts: { userId: string; email?: string; knownCustomerId?: string | null },
): Promise<string[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(opts.userId)) throw new Error("Invalid userId");
  const ids = new Set<string>();
  if (opts.knownCustomerId) ids.add(opts.knownCustomerId);

  const subs = await stripe.subscriptions.search({
    query: `metadata['userId']:'${opts.userId}'`,
    limit: 100,
  });
  for (const sub of subs.data) {
    const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customer) ids.add(customer);
  }

  const customers = await stripe.customers.search({
    query: `metadata['userId']:'${opts.userId}'`,
    limit: 100,
  });
  for (const c of customers.data) ids.add(c.id);

  if (ids.size === 0 && opts.email) {
    const byEmail = await stripe.customers.list({ email: opts.email, limit: 100 });
    for (const c of byEmail.data) ids.add(c.id);
  }

  return [...ids];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { environment } = (await req.json()) ?? {};
    if (environment !== "sandbox" && environment !== "live") {
      return json({ error: "Invalid environment" }, 400);
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: researcher } = await supabase
      .from("researchers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = createStripeClient(environment as StripeEnv);
    const customerIds = await findCustomerIds(stripe, {
      userId: user.id,
      email: user.email ?? undefined,
      knownCustomerId: researcher?.stripe_customer_id ?? null,
    });

    if (customerIds.length === 0) {
      return json({ subscription: null, invoices: [] });
    }

    const subscriptions: {
      id: string;
      status: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
      amount: number | null;
      currency: string | null;
      interval: string | null;
      created: string | null;
    }[] = [];
    const invoices: {
      id: string;
      status: string | null;
      amount_paid: number;
      currency: string;
      created: string | null;
      hosted_invoice_url: string | null;
      pdf_url: string | null;
    }[] = [];

    for (const customerId of customerIds) {
      const subList = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      for (const sub of subList.data) {
        const item = sub.items?.data?.[0];
        const periodEnd = item?.current_period_end ?? (sub as { current_period_end?: number }).current_period_end;
        subscriptions.push({
          id: sub.id,
          status: sub.status,
          current_period_end: isoFromUnix(periodEnd),
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          amount: item?.price?.unit_amount != null
            ? toMajorUnit(item.price.unit_amount, item.price.currency ?? "usd")
            : null,
          currency: item?.price?.currency ?? null,
          interval: item?.price?.recurring?.interval ?? null,
          created: isoFromUnix(sub.created),
        });
      }

      const invList = await stripe.invoices.list({ customer: customerId, limit: 100 });
      for (const inv of invList.data) {
        invoices.push({
          id: inv.id ?? "",
          status: inv.status ?? null,
          amount_paid: toMajorUnit(inv.amount_paid, inv.currency),
          currency: inv.currency,
          created: isoFromUnix(inv.created),
          hosted_invoice_url: inv.hosted_invoice_url ?? null,
          pdf_url: inv.invoice_pdf ?? null,
        });
      }
    }

    // Newest first; prefer an active subscription when several exist.
    subscriptions.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
    invoices.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
    const preferred =
      subscriptions.find((s) => ["active", "trialing", "past_due"].includes(s.status)) ??
      subscriptions[0] ??
      null;

    return json({ subscription: preferred, invoices });
  } catch (e) {
    console.error("get-billing-data error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
