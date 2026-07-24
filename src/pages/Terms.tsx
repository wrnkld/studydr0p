import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function Terms() {
  return (
    <PageContainer width="narrow" space="md">
      <PageHeader
        title="Terms"
        description="The rules for using StudyDrop."
      />

      <section className="space-y-3 text-[15px] leading-relaxed text-foreground">
        <p>
          StudyDrop is for creating and sharing unmoderated UX studies. You own
          your studies and responses. You are responsible for what you ask
          participants and how you use their answers.
        </p>
        <p>
          StudyDrop is a one-time $75 lifetime unlock. Payments are final and
          processed by Stripe.
        </p>
        <p>
          Do not use StudyDrop for illegal, harmful, or abusive purposes. We
          may suspend accounts that violate these rules.
        </p>
        <p>
          Questions? Email{" "}
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
