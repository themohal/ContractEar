import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - ContractEar",
  description:
    "Refund Policy for ContractEar. All digital payments are final and non-refundable.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: February 2026</p>

      <div className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4">
        <p className="text-sm font-medium text-warning">
          All payments are final and non-refundable. This includes per-analysis
          payments, monthly subscription fees, and all other charges. By
          completing a purchase, you acknowledge and agree to this policy.
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No Refund Policy
          </h2>
          <p>
            ContractEar provides digital AI-powered analysis services that are
            delivered electronically and instantly upon processing. Due to the
            nature of digital delivery and the immediate, irreversible
            consumption of AI processing resources (transcription and analysis),{" "}
            <strong className="text-foreground">
              all sales are final and no refunds will be issued under any
              circumstances
            </strong>
            . This applies to:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Per-analysis payments ($3.99):</strong> Once payment is
              submitted, processing begins immediately and resources are consumed
              regardless of outcome.
            </li>
            <li>
              <strong>Basic plan subscriptions ($29/month):</strong> Monthly
              subscription fees are charged in advance and are non-refundable,
              including partial month usage.
            </li>
            <li>
              <strong>Pro plan subscriptions ($79/month):</strong> Monthly
              subscription fees are charged in advance and are non-refundable,
              including partial month usage.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Situations Where Refunds Will Not Be Issued
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Analysis was delivered but you are unsatisfied with the quality or
              accuracy of results
            </li>
            <li>Poor audio quality leading to less accurate transcription</li>
            <li>You uploaded the wrong file</li>
            <li>Change of mind after purchase</li>
            <li>
              Processing failure or technical error — we will attempt
              re-processing but will not issue monetary refunds
            </li>
            <li>Duplicate charges — contact Paddle directly for dispute resolution</li>
            <li>Unused analyses on subscription plans</li>
            <li>Cancellation of subscription mid-cycle</li>
            <li>Account termination or suspension</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Subscription Cancellation
          </h2>
          <p>
            You may cancel your subscription at any time. Upon cancellation,
            your plan will remain active until the end of the current billing
            cycle. No pro-rated refunds are provided for the remaining days of
            the billing period. After cancellation, your account will revert to
            the Pay Per Use tier.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Processing Failures
          </h2>
          <p>
            If our system fails to produce an analysis due to a technical error,
            we will make reasonable efforts to re-process your audio file at no
            additional cost. However, this does not entitle you to a monetary
            refund. Contact support with your analysis ID for re-processing
            requests.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Merchant of Record
          </h2>
          <p>
            All payments are processed by Paddle.com Market Limited
            (&quot;Paddle&quot;), our Merchant of Record. Paddle handles all
            payment processing, tax collection, and billing. Any billing
            disputes should be directed to Paddle. By making a purchase, you
            agree to both our no-refund policy and Paddle&apos;s terms of
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p>
            For billing questions or re-processing requests, contact us at{" "}
            <a
              href="mailto:support@contractear.com"
              className="text-accent-light hover:underline"
            >
              support@contractear.com
            </a>
            . Please include your analysis ID or account email.
          </p>
        </section>
      </div>
    </div>
  );
}
