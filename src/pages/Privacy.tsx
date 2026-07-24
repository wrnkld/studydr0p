import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function Privacy() {
  return (
    <PageContainer space="md">
      <PageHeader title="Privacy" />

      <section className="space-y-3 text-[15px] leading-relaxed text-foreground">
        <p>
          We collect your email, the studies you create, and the responses they
          receive. We use this only to run StudyDrop and show your results.
        </p>
        <p>
          We do not sell data or run ads. We do not store payment cards — Stripe
          handles billing.
        </p>
        <p>
          You can delete your studies and account at any time.
        </p>
      </section>
    </PageContainer>
  );
}
