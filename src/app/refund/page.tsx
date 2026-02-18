import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - ContractEar",
  description:
    "Refund Policy for ContractEar. Full refunds available within 14 days, handled by Paddle.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: February 2026</p>

      <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
        <p className="text-sm font-medium text-accent-light">
          We offer a full refund within 14 days of any purchase — no questions
          asked. All refunds are handled by Paddle, our Merchant of Record.
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            14-Day Refund Policy
          </h2>
          <p>
            If you are not satisfied with your purchase for any reason, you are
            entitled to a full refund within{" "}
            <strong className="text-foreground">14 days</strong> of the
            original purchase date. This applies to all purchases, including:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Per-analysis payments ($3.99)</strong>
            </li>
            <li>
              <strong>Basic plan subscriptions ($29/month)</strong>
            </li>
            <li>
              <strong>Pro plan subscriptions ($79/month)</strong>
            </li>
            <li>
              <strong>Support contributions ($5 / $10)</strong>
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
            cycle. You may request a refund within 14 days of any charge
            through Paddle. After cancellation, your account will revert to the
            Pay Per Use tier.
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
