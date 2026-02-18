"use client";

import { useState, useEffect, useCallback } from "react";

const DONATION_OPTIONS = [
  {
    amount: 5,
    label: "$5",
    priceEnvKey: "NEXT_PUBLIC_PADDLE_PRICE_ID_DONATE_5",
    description: "Helps cover server and processing costs for several analyses.",
    icon: (
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    ),
  },
  {
    amount: 10,
    label: "$10",
    priceEnvKey: "NEXT_PUBLIC_PADDLE_PRICE_ID_DONATE_10",
    description: "Helps keep ContractEar running and supports future improvements.",
    icon: (
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    ),
  },
];

const PRICE_IDS: Record<number, string> = {
  5: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_DONATE_5 || "",
  10: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_DONATE_10 || "",
};

export default function DonatePage() {
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    if (window.Paddle) {
      setPaddleLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Environment.set(
          process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox"
        );
        window.Paddle.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
        });
        setPaddleLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  const handleDonate = useCallback(
    (amount: number) => {
      if (!window.Paddle || !paddleLoaded) return;
      const priceId = PRICE_IDS[amount];
      if (!priceId) {
        alert("Donation is not available at this time. Please try again later.");
        return;
      }
      setLoading(amount);
      try {
        window.Paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customData: { type: "donation" },
          settings: {
            displayMode: "overlay",
            theme: "dark",
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/donate?success=1`,
          },
        });
      } finally {
        setLoading(null);
      }
    },
    [paddleLoaded]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Support ContractEar</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          ContractEar relies on third-party services that cost money to run.
          Your support goes directly towards covering the cost of
          transcription, analysis, hosting, and infrastructure so we can keep
          the service available for everyone.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {DONATION_OPTIONS.map((option) => (
          <div
            key={option.amount}
            className="flex flex-col items-center rounded-xl border border-card-border bg-card p-8 text-center transition-colors hover:border-accent/50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-accent-light"
              >
                {option.icon}
              </svg>
            </div>
            <div className="mt-4 text-4xl font-bold">{option.label}</div>
            <p className="mt-2 text-sm text-muted">{option.description}</p>
            <button
              onClick={() => handleDonate(option.amount)}
              disabled={!paddleLoaded || loading === option.amount}
              className="mt-6 w-full rounded-lg bg-accent px-6 py-2.5 font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
            >
              {loading === option.amount
                ? "Loading..."
                : `Support with ${option.label}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-center text-sm font-semibold text-foreground">
          Where does my contribution go?
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {["Processing", "Hosting", "Infrastructure"].map((label) => (
            <div key={label} className="text-center">
              <p className="text-sm font-medium text-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        All payments are processed securely by our order reseller{" "}
        <a
          href="https://www.paddle.com"
          className="text-accent-light hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Paddle.com
        </a>
        . Paddle.com is the Merchant of Record for all our orders. Paddle
        provides all customer service inquiries and handles returns.
        Contributions are one-time payments to help cover the cost of services.
        A full refund is available within 14 days of any purchase.
      </p>
    </div>
  );
}
