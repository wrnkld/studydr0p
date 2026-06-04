import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function sendConfirmationEmail(email: string) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        templateName: "pro-unlock",
        recipientEmail: email,
        templateData: {},
      }),
    });
    if (!res.ok) {
      console.error("Confirmation email failed:", await res.text());
    }
  } catch (e) {
    console.error("Confirmation email error:", e);
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.payment_status !== "paid") return;
  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!userId) {
    console.error("checkout.session.completed missing userId metadata");
    return;
  }

  const { error } = await getSupabase()
    .from("researchers")
    .update({ is_paid: true, stripe_customer_id: customerId ?? null })
    .eq("id", userId);
  if (error) {
    console.error("Failed to flip is_paid:", error);
    return;
  }

  // Lookup email & send confirmation
  const { data: research } = await getSupabase()
    .from("researchers")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const email = (research?.email as string | undefined) ?? session.customer_details?.email;
  if (email) await sendConfirmationEmail(email);
}

async function handleRefund(charge: any, _env: StripeEnv) {
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) {
    console.error("refund charge has no customer");
    return;
  }
  const fullyRefunded = charge.refunded === true || (charge.amount_refunded ?? 0) >= (charge.amount ?? 0);
  if (!fullyRefunded) {
    console.log("Partial refund — leaving Pro access in place");
    return;
  }
  const { error } = await getSupabase()
    .from("researchers")
    .update({ is_paid: false })
    .eq("stripe_customer_id", customerId);
  if (error) console.error("Failed to revoke is_paid:", error);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook missing/invalid env query param:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
