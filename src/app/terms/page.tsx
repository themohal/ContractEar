import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - ContractEar",
  description:
    "Terms of Service for ContractEar, the AI audio agreement analyzer.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: February 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using ContractEar, operated by Kraken AI
            (&quot;Kraken AI&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). ContractEar (&quot;the Service&quot;) is a
            product of Kraken AI. If you do not agree to these Terms, do not use
            the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p>
            ContractEar is an AI-powered audio analysis tool that transcribes
            audio recordings and extracts verbal commitments, deadlines,
            financial terms, red flags, and other relevant information. The
            Service provides analytical summaries for informational purposes
            only.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            3. Not Legal Advice
          </h2>
          <p>
            The analysis provided by ContractEar does not constitute legal
            advice, legal opinion, or legal representation. The Service is not a
            substitute for professional legal counsel. You should consult with a
            licensed attorney before making any legal decisions based on the
            information provided by the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            4. Payment and Billing
          </h2>
          <p>
            Kraken AI, through ContractEar, charges a one-time fee per audio
            analysis or a recurring subscription fee. Our order process is
            conducted by our online reseller Paddle.com. Paddle.com is the
            Merchant of Record for all our orders. Paddle provides all customer
            service inquiries and handles returns. By making a purchase, you
            also agree to Paddle&apos;s terms of service. All prices are in USD
            unless otherwise stated. We offer a full refund within 14 days of
            any purchase — see our{" "}
            <a
              href="/refund"
              className="text-accent-light hover:underline"
            >
              Refund Policy
            </a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            5. User Content and Data
          </h2>
          <p>
            You retain ownership of all audio files you upload. By uploading
            content, you grant ContractEar a temporary, limited license to
            process the audio for the purpose of providing the analysis. Audio
            files are deleted from our servers immediately after processing is
            complete (whether successful or failed). Only the text-based analysis
            results are retained.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            6. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Upload content that you do not have the right to share</li>
            <li>
              Upload content that violates wiretapping or recording consent laws
            </li>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to reverse-engineer or exploit the Service</li>
            <li>
              Resell or redistribute analysis results commercially without
              permission
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            7. Accuracy and Limitations
          </h2>
          <p>
            While we strive for accuracy, AI-generated transcriptions and
            analyses may contain errors. Factors such as audio quality, speaker
            accents, background noise, and overlapping speakers can affect
            results. ContractEar does not guarantee the accuracy, completeness,
            or reliability of any analysis.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            8. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, Kraken AI and its
            affiliates, officers, employees, agents, and licensors shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits or revenues, whether
            incurred directly or indirectly, or any loss of data, use, goodwill,
            or other intangible losses resulting from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            9. Donations
          </h2>
          <p>
            ContractEar accepts voluntary one-time support contributions to
            help cover the cost of running processing, hosting, and
            infrastructure services. These contributions are processed as
            one-time purchases by Paddle.com, our Merchant of Record, and are
            subject to the same terms as all other purchases. Contributions do
            not entitle the buyer to any additional product, feature, or service
            beyond what is already available. A full refund is available within
            14 days of any purchase.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            10. Changes to Terms
          </h2>
          <p>
            Kraken AI reserves the right to modify these Terms at any time.
            Continued use of the Service after changes constitutes acceptance of
            the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            11. Contact
          </h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a
              href="mailto:paktechknowledge@gmail.com"
              className="text-accent-light hover:underline"
            >
              paktechknowledge@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
