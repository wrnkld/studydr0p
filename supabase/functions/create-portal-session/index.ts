import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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
    const { environment, returnUrl } = (await req.json()) ?? {};
    if (environment !== "sandbox" && environment !== "live") {
      return json({ error: "Invalid environment" }, 400);
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const stripe = createStripeClient(environment as StripeEnv);

    const { data: researcher } = await supabase
      .from("researchers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = researcher?.stripe_customer_id ?? null;

    if (!customerId) {
      if (!/^[a-zA-Z0-9_-]+$/.test(user.id)) return json({ error: "Invalid user" }, 400);
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${user.id}'`,
        limit: 1,
      });
      customerId = found.data[0]?.id ?? null;
      if (!customerId && user.email) {
        const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
        customerId = byEmail.data[0]?.id ?? null;
      }
    }

    if (!customerId) return json({ error: "No billing account found" }, 404);

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      ...(returnUrl && { return_url: returnUrl }),
    });

    return json({ url: portal.url });
  } catch (e) {
    console.error("create-portal-session error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
