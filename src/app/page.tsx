"use client";

import { useState, useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import { PLANS } from "@/lib/types";

const FAQ_ITEMS = [
  {
    q: "What types of audio files are supported?",
    a: "We support MP3, WAV, M4A, MP4, WebM, OGG, and FLAC audio files up to 25MB. Most meeting recording formats are compatible.",
  },
  {
    q: "How long does the analysis take?",
    a: "Most analyses complete within 1-3 minutes, depending on the length of the recording. Longer recordings may take up to 5 minutes.",
  },
  {
    q: "Is my audio data stored?",
    a: "Your audio file is processed and immediately deleted after analysis. We do not store your recordings. Only the text-based analysis results are kept for your access.",
  },
  {
    q: "How accurate is the transcription?",
    a: "We use OpenAI's Whisper model, which provides industry-leading transcription accuracy. However, poor audio quality, heavy accents, or multiple overlapping speakers may reduce accuracy.",
  },
  {
    q: "Can I use this as legal evidence?",
    a: "ContractEar provides analytical summaries for informational purposes only. The analysis should not be treated as legal advice or used as formal legal evidence. Consult a licensed attorney for legal matters.",
  },
  {
    q: "Are payments refundable?",
    a: "We offer refunds within 14 days of purchase. If you're not satisfied or experience a technical issue, contact us at paktechknowledge@gmail.com or reach out to Paddle directly through your receipt email. Please review our refund policy for full details.",
  },
  {
    q: "Do you support languages other than English?",
    a: "Whisper supports multiple languages. The transcription will work with most languages, though the analysis prompts are optimized for English content.",
  },
  {
    q: "Can I paste a URL instead of uploading?",
    a: "Yes! You can paste a direct link to a publicly accessible audio file. However, files behind authentication (like private Zoom recordings) will need to be downloaded first and uploaded manually.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
      }
      setAuthChecked(true);
    });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Never lose a verbal agreement{" "}
          <span className="text-accent-light">again</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted sm:text-xl">
          Upload your meeting recordings and let AI extract every commitment,
          deadline, red flag, and action item. Protect yourself from &quot;I
          never said that&quot; disputes.
        </p>

        {!authChecked ? (
          <div className="mx-auto mt-10 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
          </div>
        ) : isLoggedIn ? (
          <div className="mx-auto mt-10 flex flex-col items-center gap-4">
            <a
              href="/dashboard"
              className="rounded-lg bg-accent px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-light"
            >
              Go to Dashboard
            </a>
            <p className="text-sm text-muted">
              Upload and analyze your recordings from the dashboard
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-10 flex flex-col items-center gap-4">
            <a
              href="/signup"
              className="rounded-lg bg-accent px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-light"
            >
              Get Started Free
            </a>
            <p className="text-sm text-muted">
              Create an account to start analyzing your recordings
            </p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="border-t border-card-border py-16 sm:py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          How It Works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Upload Recording",
              desc: "Drop your meeting audio file or paste a URL. We accept all common audio formats.",
              icon: (
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              ),
            },
            {
              step: "2",
              title: "AI Analyzes",
              desc: "Our AI transcribes the audio and identifies every commitment, deadline, and red flag.",
              icon: (
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              ),
            },
            {
              step: "3",
              title: "Get Your Report",
              desc: "Review the structured summary with risk scores, action items, and downloadable PDF.",
              icon: (
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              ),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-xl border border-card-border bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-accent-light"
                >
                  {item.icon}
                </svg>
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
                Step {item.step}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section className="border-t border-card-border py-16 sm:py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          What You Get
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Verbal Commitments",
              desc: "Every promise and agreement extracted with speaker attribution and exact quotes.",
            },
            {
              title: "Deadlines & Timelines",
              desc: "All mentioned dates, timeframes, and delivery promises organized chronologically.",
            },
            {
              title: "Financial Terms",
              desc: "Payment amounts, rates, and financial commitments clearly highlighted.",
            },
            {
              title: "Red Flags",
              desc: "Vague promises, contradictions, pressure tactics, and missing specifics flagged.",
            },
            {
              title: "Risk Score",
              desc: "An overall 1-10 risk assessment with detailed explanation of potential issues.",
            },
            {
              title: "Action Items",
              desc: "Clear next steps extracted from the conversation with assigned parties.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-card-border bg-card p-5"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-t border-card-border py-16 sm:py-20"
      >
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-3 text-center text-muted">
          Pay per analysis or save with a monthly plan. 14-day refund policy on
          all purchases.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`relative flex flex-col rounded-xl border p-6 text-center ${
                plan.popular
                  ? "border-accent/50 bg-card"
                  : "border-card-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted">
                  {plan.tier === "single" ? " / analysis" : " / month"}
                </span>
              </div>
              {plan.tier !== "single" && (
                <p className="mt-1 text-xs text-accent-light">
                  {plan.pricePerAnalysis} per analysis — Save{" "}
                  {Math.round(
                    ((3.99 - plan.price / plan.analyses) / 3.99) * 100
                  )}
                  %
                </p>
              )}
              <ul className="mt-5 flex-1 space-y-2.5 text-left text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className={`mt-6 block w-full rounded-lg py-2.5 font-medium transition-colors ${
                  plan.popular
                    ? "bg-accent text-white hover:bg-accent-light"
                    : "border border-card-border text-foreground hover:bg-card"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-card-border py-16 sm:py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto mt-10 max-w-2xl divide-y divide-card-border">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between text-left font-medium"
              >
                {item.q}
                <svg
                  className={`h-5 w-5 shrink-0 text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openFaq === i && (
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
