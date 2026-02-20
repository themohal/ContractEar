import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - ContractEar",
  description:
    "Refund Policy for ContractEar. Refunds are prorated based on usage. Handled by Paddle.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: February 2026</p>

      <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
        <p className="text-sm font-medium text-accent-light">
          All sales are final once analysis results have been delivered. If a
          refund is granted, usage costs are deducted. All refunds are handled
          by Paddle, our Merchant of Record.
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Refund Policy
          </h2>
          <p>
            Because ContractEar delivers digital results immediately upon
            processing,{" "}
            <strong className="text-foreground">
              all sales are final once results have been delivered
            </strong>
            . Each completed analysis is a delivered service and is
            non-refundable.
          </p>
          <p className="mt-3">
            If a refund is approved, the cost of any analyses already delivered
            will be deducted{" "}
            <strong className="text-foreground">as per your plan rate</strong>.
            This applies to all purchase types:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Pay Per Use ($3.99/analysis)</strong> — non-refundable
              once results are delivered.
            </li>
            <li>
              <strong>Basic plan ($29/month)</strong> — refund amount equals the
              subscription fee minus $1.45 for each analysis used during the
              billing period.
            </li>
            <li>
              <strong>Pro plan ($79/month)</strong> — refund amount equals the
              subscription fee minus $1.58 for each analysis used during the
              billing period.
            </li>
            <li>
              <strong>Support contributions ($5 / $10)</strong> — all
              contributions are final and non-refundable.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            How to Request a Refund
          </h2>
          <p>
            All refunds are handled by Paddle.com, our Merchant of Record. To
            request a refund:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Use the receipt email you received from Paddle at the time of
              purchase — it contains a link to manage your order and request a
              refund.
            </li>
            <li>
              Or visit{" "}
              <a
                href="https://www.paddle.com/help"
                className="text-accent-light hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                paddle.com/help
              </a>{" "}
              to contact Paddle&apos;s support team directly.
            </li>
          </ul>
          <p className="mt-3">
            Refund requests are typically processed within 5-10 business days.
            Approved refunds will be returned to the original payment method.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Subscription Cancellation
          </h2>
          <p>
            You may cancel your subscription at any time. Upon cancellation,
            your plan will remain active until the end of the current billing
            cycle. If a refund is requested, the cost of analyses used during
            that billing period will be deducted from the refund amount at your
            plan&apos;s per-analysis rate (Basic: $1.45/analysis, Pro:
            $1.58/analysis). After cancellation, your account will revert to
            no active plan.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Merchant of Record
          </h2>
          <p>
            Our order process is conducted by our online reseller Paddle.com.
            Paddle.com is the Merchant of Record for all our orders. Paddle
            provides all customer service inquiries and handles returns. For any
            refund or billing questions, please contact Paddle directly through
            your receipt email or at{" "}
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
      </div>
    </div>
  );
}
