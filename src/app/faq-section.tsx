"use client";

import { useState } from "react";

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
    a: "Yes! We offer a full refund within 14 days of any purchase, no questions asked. All refunds are handled by Paddle, our payment processor. Use the link in your Paddle receipt email or visit paddle.com/help to request a refund. See our refund policy for full details.",
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

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
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
  );
}
