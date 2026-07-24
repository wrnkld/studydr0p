import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function Privacy() {
  return (
    <PageContainer width="narrow" space="md">
      <PageHeader
        title="Privacy"
        description="How StudyDrop handles your data."
      />

      <p className="text-sm text-muted-foreground leading-relaxed">
        This page is maintained by StudyDrop to answer common privacy and
        security questions. It describes our current practices and the
        platform capabilities we rely on. It is not an independent
        certification, audit report, or legal opinion.
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          What we collect
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground">
          <li>
            <strong>Account information:</strong> email address and authentication
            details needed to sign in.
          </li>
          <li>
            <strong>Study content:</strong> titles, questions, images, and
            configuration you create for your studies.
          </li>
          <li>
            <strong>Participant responses:</strong> clicks, sort orders, tree
            paths, survey answers, and other responses submitted through your
            study links.
          </li>
          <li>
            <strong>Payment information:</strong> we do not store payment card
            details. Payments are processed by Stripe, which collects payment
            information according to its own privacy policy.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          How we use data
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We use the data we collect to operate StudyDrop, authenticate users,
          display study results, process payments, and send account-related
          emails such as sign-in and welcome messages. We do not sell personal
          data or use it for advertising.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Where data is stored
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          StudyDrop runs on Lovable Cloud, which provides the backend database,
          authentication, and serverless functions. Data is stored in the region
          configured for the project. Lovable Cloud handles infrastructure
          security such as encryption at rest and in transit; the app owner is
          responsible for how study content and responses are used and shared.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Subprocessors and integrations
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We use Stripe to process the $75 lifetime unlock payment. Stripe
          handles card data, billing details, and transaction records under its
          own terms and privacy policy. We do not integrate with analytics or
          advertising services at this time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Cookies
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We use essential cookies and local storage to keep you signed in and
          to remember your session. We do not use tracking or advertising
          cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Retention and deletion
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We keep your account and study data for as long as your account is
          active. If you delete your account, your studies and responses will be
          removed from active systems. Some information may be retained in
          backups or payment records for a limited period as required for
          business or legal purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Your privacy choices
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          You can delete your studies and your account at any time from within
          the app. To request access to, correction of, or deletion of personal
          data, email{" "}
          <a
            href="mailto:hello@studydrop.app"
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            hello@studydrop.app
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Security and reporting
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          If you discover a security issue or vulnerability, please report it to{" "}
          <a
            href="mailto:hello@studydrop.app"
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            hello@studydrop.app
          </a>
          . We will investigate and respond as quickly as we can.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Changes to this page
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground">
          We may update this page as our practices or the platform capabilities
          we use change. The latest version will always be available at this
          URL.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
      </p>
    </PageContainer>
  );
}
