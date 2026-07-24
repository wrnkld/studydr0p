import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function Privacy() {
  return (
    <PageContainer width="narrow" space="md">
      <PageHeader
        title="Privacy"
        description="How StudyDrop handles your data."
      />

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
          You can delete your studies and account at any time. Questions? Email{" "}
          <a
            href="mailto:hello@studydrop.app"
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            hello@studydrop.app
          </a>
          .
        </p>
      </section>
    </PageContainer>
  );
}
