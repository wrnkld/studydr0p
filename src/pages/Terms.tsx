import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function Terms() {
  return (
    <PageContainer width="wide" space="md">
      <PageHeader title="Terms" />

      <section className="space-y-3 text-base leading-relaxed text-foreground">
        <p>
          StudyDrop is for creating and sharing unmoderated UX studies. You own
          your studies and responses. You are responsible for what you ask
          participants and how you use their answers.
        </p>
        <p>
          StudyDrop is a one-time $129 lifetime unlock. Payments are final and
          processed by Stripe.
        </p>
        <p>
          Do not use StudyDrop for illegal, harmful, or abusive purposes. We
          may suspend accounts that violate these rules.
        </p>
      </section>
    </PageContainer>
  );
}
