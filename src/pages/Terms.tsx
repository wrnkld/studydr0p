import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function Terms() {
  return (
    <PageContainer width="narrow" space="md">
      <PageHeader
        title="Terms"
        description="The rules for using StudyDrop."
      />

      <p className="text-sm text-muted-foreground leading-relaxed">
        This page is maintained by StudyDrop and describes the terms that apply
        to using the service. It is app-owned content and may be updated from
        time to time.
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Using StudyDrop
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          StudyDrop lets researchers and designers create unmoderated UX studies
          — such as card sorts, tree tests, first-click tests, and surveys — and
          share them with participants via a link. You are responsible for the
          studies you create, the questions you ask, and how you use the
          responses.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Accounts
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          You need an account to create studies and view results. Keep your
          sign-in details secure. You must be at least 13 years old to use
          StudyDrop. Do not create accounts for others or use false information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Payments
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          StudyDrop offers a one-time $75 lifetime unlock that grants access to
          unlimited studies and responses. Payments are processed by Stripe. We
          do not store your payment card details. All purchases are subject to
          Stripe&apos;s terms and the pricing shown at checkout.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Refunds
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          Because the unlock is a digital purchase, all sales are final. If you
          believe you were charged in error, contact{" "}
          <a
            href="mailto:hello@studydrop.app"
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            hello@studydrop.app
          </a>{" "}
          and we will review your request.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Your content
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          You own the studies, questions, images, and other content you create.
          You also own the responses collected through your study links. We do
          not use your content or responses to train models or for any purpose
          other than operating the service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Prohibited use
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground">
          <li>Do not use StudyDrop for illegal or harmful purposes.</li>
          <li>Do not harass participants or collect sensitive personal data without a lawful basis.</li>
          <li>Do not attempt to disrupt the service or access accounts that are not yours.</li>
          <li>Do not upload malware, abusive content, or copyrighted material you do not have rights to use.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Termination
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We may suspend or terminate your account if you violate these terms or
          misuse the service. You can delete your account at any time from within
          the app.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Disclaimers
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          StudyDrop is provided as-is. We do our best to keep the service
          reliable and secure, but we do not guarantee uninterrupted or
          error-free operation. We are not liable for indirect, incidental, or
          consequential damages arising from your use of the service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Changes to these terms
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We may update these terms as the service changes. The latest version
          will always be available at this URL. Continued use of StudyDrop after
          changes means you accept the updated terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Contact
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          Questions about these terms? Email{" "}
          <a
            href="mailto:hello@studydrop.app"
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            hello@studydrop.app
          </a>
          .
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
      </p>
    </PageContainer>
  );
}
