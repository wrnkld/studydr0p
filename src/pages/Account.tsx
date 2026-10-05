import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageContainer, PageHeader } from "@/components/study/primitives";
import { useAuth } from "@/hooks/useAuth";
import { usePaid } from "@/hooks/usePaid";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PRO_PRICE_LABEL, PRO_CTA, REFUND_NOTE } from "@/lib/limits";
import {
  BillingInvoice,
  BillingSubscription,
  fetchBillingData,
  formatDate,
  formatMoney,
  openBillingPortal,
} from "@/lib/billing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-base font-medium text-muted-foreground"
    >
      {children}
    </p>
  );
}

export type AccountSection = "billing" | "account";

export default function Account({ section }: { section?: AccountSection }) {
  useDocumentTitle("Account · StudyDrop");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPaid, loading: paidLoading } = usePaid();

  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBillingData();
        if (cancelled) return;
        setSubscription(data.subscription);
        setInvoices(data.invoices.filter((i) => i.status === "paid" && i.amount_paid > 0));
      } catch (e) {
        if (!cancelled) setBillingError((e as Error).message);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) return;
    setUpgrading(true);
    try {
      await (await import("@/lib/startCheckout")).startCheckout({
        userId: user.id,
        email: user.email ?? undefined,
        returnTo: "/account",
      });
    } catch (e) {
      setUpgrading(false);
      toast.error((e as Error).message);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal("/account");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error) {
        toast.error(error.message || "Could not delete account. Try again.");
        setDeleting(false);
        return;
      }
      await signOut();
      toast.success("Your account has been deleted");
      navigate("/");
    } catch {
      toast.error("Could not delete account. Try again.");
      setDeleting(false);
    }
  };

  const renews = subscription?.current_period_end
    ? formatDate(subscription.current_period_end)
    : null;

  return (
    <PageContainer width="wide" space="md">
      {!section && <PageHeader title="Your account" />}


      {(!section || section === "billing") && <section className="border-b border-border py-4">
        <Kicker>Billing</Kicker>
        {paidLoading ? (
          <p className="mt-3 text-base text-muted-foreground">Checking payment status…</p>
        ) : isPaid ? (
          <>
            <p className="mt-3 text-base text-foreground">
              You've paid for StudyDrop Pro — unlimited studies and unlimited responses.
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              {subscription?.cancel_at_period_end
                ? `Cancels on ${renews ?? "the end of this period"}.`
                : renews
                  ? `Renews on ${renews}.`
                  : PRO_PRICE_LABEL}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 gap-1.5 text-base"
              disabled={portalLoading}
              onClick={handlePortal}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              )}
              Manage billing
            </Button>
            <p className="mt-2 text-base text-muted-foreground">
              Opens in a new tab, where you can change your card or cancel.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-base text-foreground">
              You haven't paid anything yet.
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              Pro is {PRO_PRICE_LABEL} and lifts every limit on studies and responses.
            </p>
            <Button size="sm" className="mt-5 text-base" disabled={upgrading} onClick={handleUpgrade}>
              {upgrading ? "Loading…" : PRO_CTA}
            </Button>
            <p className="mt-2 text-base text-muted-foreground">{REFUND_NOTE}</p>
          </>
        )}
        <div className="mt-6">
        <Kicker>Payment history</Kicker>
        {billingLoading ? (
          <p className="mt-3 text-base text-muted-foreground">Loading payments…</p>
        ) : billingError ? (
          <p className="mt-3 text-base text-muted-foreground">
            We couldn't load your payments right now.
          </p>
        ) : invoices.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-base text-foreground">
                    {formatMoney(inv.amount_paid, inv.currency)}
                  </p>
                  <p className="text-base text-muted-foreground">{formatDate(inv.created)}</p>
                </div>
                {inv.pdf_url || inv.hosted_invoice_url ? (
                  <a
                    href={(inv.pdf_url ?? inv.hosted_invoice_url) as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-base underline underline-offset-4 hover:opacity-80"
                  >
                    Receipt
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>}

      {/* Account actions */}
      {(!section || section === "account") && <section className="py-4">
        <Kicker>This account</Kicker>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-base"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            Sign out
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-base text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </section>}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all of your studies, and every response.
              You cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-start gap-2">
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} /> : null}
              Delete account
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
