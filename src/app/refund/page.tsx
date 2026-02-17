import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - ContractEar",
  description:
    "Refund Policy for ContractEar. Learn about our refund process for digital analysis services.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: February 2026</p>

      <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
        <p className="text-sm font-medium text-accent-light">
          We want you to be satisfied with ContractEar. If you&apos;re not happy
          with your purchase, you may request a refund within 14 days subject to
          the conditions below.
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Refund Eligibility
          </h2>
          <p>
            ContractEar provides digital AI-powered analysis services delivered
            electronically. You may request a refund within{" "}
            <strong className="text-foreground">
              14 days of your purchase date
            </strong>{" "}
            under the following conditions:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Per-analysis payments ($3.99):</strong> Refund requests
              are accepted if the analysis failed to produce results due to a
              system error, or if the service was significantly not as described.
            </li>
            <li>
              <strong>Basic plan subscriptions ($29/month):</strong> You may
              request a refund within 14 days of your initial subscription or
              any renewal charge.
            </li>
            <li>
              <strong>Pro plan subscriptions ($79/month):</strong> You may
              request a refund within 14 days of your initial subscription or
              any renewal charge.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            How to Request a Refund
          </h2>
          <p>To request a refund, you can:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Email us at{" "}
              <a
                href="mailto:support@contractear.com"
                className="text-accent-light hover:underline"
              >
                support@contractear.com
              </a>{" "}
              with your account email and reason for the refund request.
            </li>
            <li>
              Contact Paddle (our payment processor) directly through the
              receipt email you received at the time of purchase.
            </li>
          </ul>
          <p className="mt-3">
            Refund requests are typically processed within 5-10 business days.
            Approved refunds will be returned to the original payment method.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Situations Where Refunds May Not Be Issued
          </h2>
          <p>
            While we review all refund requests fairly, refunds may not be
            granted in the following situations:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              The analysis was successfully delivered but you are unsatisfied
              with the subjective quality of results
            </li>
            <li>
              Poor audio quality leading to less accurate transcription (the
              service performed as expected given the input)
            </li>
            <li>The refund request is made more than 14 days after purchase</li>
            <li>Evidence of abuse or fraudulent refund requests</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Subscription Cancellation
          </h2>
          <p>
            You may cancel your subscription at any time. Upon cancellation,
            your plan will remain active until the end of the current billing
            cycle. If you cancel within 14 days of a charge, you may also
            request a refund for that charge. After cancellation, your account
            will revert to the Pay Per Use tier.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Processing Failures
          </h2>
          <p>
            If our system fails to produce an analysis due to a technical error,
            we will either re-process your audio file at no additional cost or
            issue a full refund — whichever you prefer. Contact support with
            your analysis ID for assistance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Merchant of Record
          </h2>
          <p>
            All payments are processed by Paddle.com Market Limited
            (&quot;Paddle&quot;), our Merchant of Record. Paddle handles all
            payment processing, tax collection, billing, and refund fulfillment.
            You may also contact Paddle directly to request a refund through the
            receipt email or at{" "}
            <a
              href="https://www.paddle.com/help"
              className="text-accent-light hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              paddle.com/help
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p>
            For refund requests, billing questions, or re-processing requests,
            contact us at{" "}
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
