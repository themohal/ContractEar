import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - ContractEar",
  description:
    "Privacy Policy for ContractEar. Learn how we handle your audio data and personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: February 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            1. Information We Collect
          </h2>
          <p>When you use ContractEar, we collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Audio files:</strong> Temporarily stored for processing
              only. Deleted immediately after analysis completes.
            </li>
            <li>
              <strong>Analysis results:</strong> The text-based output of our AI
              analysis, stored to provide you access to your results.
            </li>
            <li>
              <strong>Anonymous visitor ID:</strong> A randomly generated
              identifier stored in your browser&apos;s localStorage, used to
              associate you with your analyses. We do not collect names, emails,
              or other personal identifiers unless you contact support.
            </li>
            <li>
              <strong>Payment data:</strong> Processed entirely by Paddle, our
              Merchant of Record. We do not store credit card information.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            2. Audio File Handling
          </h2>
          <p>
            We take your audio privacy seriously. Here is exactly what happens
            to your audio:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Audio is uploaded to our secure cloud storage</li>
            <li>Audio is sent to OpenAI Whisper for transcription</li>
            <li>The transcription is analyzed by GPT-4o</li>
            <li>
              The audio file is permanently deleted from our storage after
              processing
            </li>
            <li>
              Transcription text is also deleted after analysis — only the
              structured results are kept
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            3. Third-Party Services
          </h2>
          <p>We use the following third-party services:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>OpenAI:</strong> For audio transcription (Whisper) and text
              analysis (GPT-4o). Subject to OpenAI&apos;s usage policies.
            </li>
            <li>
              <strong>Supabase:</strong> For database and temporary file storage.
            </li>
            <li>
              <strong>Paddle:</strong> For payment processing (Merchant of
              Record).
            </li>
            <li>
              <strong>Vercel:</strong> For hosting and serverless functions.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            4. Data Retention
          </h2>
          <p>
            Audio files: Deleted immediately after processing. Analysis results:
            Retained indefinitely to provide you continued access. Visitor IDs:
            Stored in your browser only — clearing your browser data removes the
            association.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            5. Cookies and Tracking
          </h2>
          <p>
            ContractEar does not use cookies for tracking. We use
            localStorage for a randomly generated visitor ID only. We do not use
            analytics, advertising pixels, or tracking scripts.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            6. Your Rights
          </h2>
          <p>
            You have the right to request deletion of your analysis data.
            Contact us at{" "}
            <a
              href="mailto:support@contractear.com"
              className="text-accent-light hover:underline"
            >
              support@contractear.com
            </a>{" "}
            with your analysis ID and we will remove it from our database.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            8. Contact
          </h2>
          <p>
            For privacy questions or data deletion requests, contact us at{" "}
            <a
              href="mailto:support@contractear.com"
              className="text-accent-light hover:underline"
            >
              support@contractear.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
