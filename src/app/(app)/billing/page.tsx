"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";
import { PLANS } from "@/lib/types";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (config: { token: string }) => void;
      Checkout: {
        open: (config: {
          items: { priceId: string; quantity: number }[];
          customData: Record<string, string>;
          settings: {
            successUrl: string;
            displayMode: string;
            theme: string;
          };
        }) => void;
      };
    };
  }
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [upgraded, setUpgraded] = useState(false);
  const initialPlanRef = useRef<string | null>(null);

  // Load Paddle.js
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Paddle) {
      setPaddleLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      window.Paddle?.Environment.set(
        process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox"
      );
      window.Paddle?.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
      });
      setPaddleLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Refresh token to ensure it's valid
      const { data: refreshed } = await supabase.auth.refreshSession();
      const accessToken = refreshed.session?.access_token || session.access_token;
      setToken(accessToken);

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        initialPlanRef.current = data.profile.plan;
      }
      setLoading(false);
    };
    init();
  }, []);

  // Poll for profile update after Paddle payment redirect
  useEffect(() => {
    if (searchParams.get("upgraded") !== "1" || !token) return;
    setUpgraded(true);

    const poll = setInterval(async () => {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      // Profile updated by webhook — plan changed from initial
      if (data.profile.plan !== initialPlanRef.current) {
        setProfile(data.profile);
        setUpgraded(false);
        clearInterval(poll);
        window.history.replaceState({}, "", "/billing");
      }
    }, 2000);

    // Stop polling after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(poll);
      setUpgraded(false);
    }, 30000);

    return () => {
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [searchParams, token]);

  const handleSelectPlan = useCallback(
    async (tier: string) => {
      if (!paddleLoaded || !window.Paddle || !token) return;
      setUpgradeLoading(tier);
      try {
        const priceId =
          tier === "single"
            ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_SINGLE
            : tier === "basic"
              ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_BASIC
              : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO;

        window.Paddle!.Checkout.open({
          items: [{ priceId: priceId || "", quantity: 1 }],
          customData: { user_id: profile?.id || "", tier },
          settings: {
            successUrl: `${window.location.origin}/billing?upgraded=1`,
            displayMode: "overlay",
            theme: "dark",
          },
        });
      } finally {
        setUpgradeLoading(null);
      }
    },
    [paddleLoaded, token, profile]
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  if (!profile) return null;

  const currentPlan = PLANS.find((p) => p.tier === profile.plan);
  const cycleEnd = new Date(profile.billing_cycle_start);
  cycleEnd.setDate(cycleEnd.getDate() + 30);

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-sm text-muted">
        Manage your subscription and payment details
      </p>

      {upgraded && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent-light" />
          <p className="text-sm text-accent-light">
            Payment received! Activating your plan...
          </p>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
              Current Plan
            </h2>
            <p className="mt-1.5 text-2xl font-bold">
              {profile.plan === "none"
                ? "No Plan"
                : currentPlan?.name || "Pay Per Use"}
            </p>
            {profile.plan === "none" ? (
              <p className="mt-0.5 text-sm text-muted">
                Choose a plan below to start analyzing recordings
              </p>
            ) : profile.plan !== "single" ? (
              <p className="mt-0.5 text-sm text-muted">
                ${currentPlan?.price}/month — {currentPlan?.analyses} analyses
                included
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-muted">
                $3.99 per analysis — no monthly commitment
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              profile.plan === "pro"
                ? "bg-accent/20 text-accent-light"
                : profile.plan === "basic"
                  ? "bg-success/20 text-success"
                  : "bg-muted/20 text-muted"
            }`}
          >
            {profile.plan === "none"
              ? "No Plan"
              : profile.plan === "single"
                ? "Pay Per Use"
                : profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
          </span>
        </div>

        {profile.plan !== "single" && profile.plan !== "none" && (
          <div className="mt-4 grid gap-3 border-t border-card-border pt-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Billing Cycle Start</p>
              <p className="mt-0.5 font-medium">
                {new Date(profile.billing_cycle_start).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Next Renewal</p>
              <p className="mt-0.5 font-medium">
                {cycleEnd.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Subscription ID</p>
              <p className="mt-0.5 font-mono text-xs font-medium">
                {profile.paddle_subscription_id || "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade / Plan Selection */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">
          {profile.plan === "none"
            ? "Choose a Plan"
            : profile.plan === "single"
              ? "Subscribe & Save"
              : profile.plan === "basic"
                ? "Upgrade to Pro"
                : "Your Plan"}
        </h2>
        {profile.plan !== "pro" && (
          <p className="mt-1 text-sm text-muted">
            {profile.plan === "none"
              ? "Select a plan to start analyzing your recordings"
              : profile.plan === "single"
                ? "Save up to 63% with a monthly subscription"
                : "Unlock 50 analyses per month with Pro"}
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === profile.plan;
            const isDowngrade =
              profile.plan !== "none" &&
              ((profile.plan === "pro" && plan.tier !== "pro") ||
              (profile.plan === "basic" && plan.tier === "single"));
            const canUpgrade = !isCurrent && !isDowngrade;

            return (
              <div
                key={plan.tier}
                className={`flex flex-col rounded-xl border p-5 ${
                  isCurrent
                    ? "border-accent/50 bg-accent/5"
                    : "border-card-border bg-card"
                }`}
              >
                {isCurrent && (
                  <span className="mb-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
                    Current Plan
                  </span>
                )}
                {plan.popular && !isCurrent && (
                  <span className="mb-2 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent-light">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  <span className="text-sm text-muted">
                    {plan.tier === "single" ? " / analysis" : " / month"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {plan.tier === "single"
                    ? "Pay as you go"
                    : `${plan.analyses} analyses (${plan.pricePerAnalysis}/each)`}
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 text-xs text-muted">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <svg
                        className="mt-0.5 h-3 w-3 shrink-0 text-success"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {canUpgrade ? (
                  <button
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={upgradeLoading === plan.tier}
                    className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60"
                  >
                    {upgradeLoading === plan.tier
                      ? "Loading..."
                      : profile.plan === "none"
                        ? `Select ${plan.name}`
                        : `Upgrade to ${plan.name}`}
                  </button>
                ) : isCurrent ? (
                  <div className="mt-4 w-full rounded-lg border border-accent/30 py-2 text-center text-sm font-medium text-accent-light">
                    Active
                  </div>
                ) : (
                  <div className="mt-4 w-full rounded-lg border border-card-border py-2 text-center text-sm font-medium text-muted">
                    Current plan is higher
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Info */}
      <div className="mt-8 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold">Payment Information</h2>
        <p className="mt-2 text-sm text-muted">
          All payments are processed securely by{" "}
          <span className="text-foreground">Paddle</span>, our Merchant of
          Record. Paddle handles billing, tax collection, and invoicing.
        </p>
        <p className="mt-2 text-sm text-muted">
          All payments are final and non-refundable. See our{" "}
          <a href="/refund" className="text-accent-light hover:underline">
            refund policy
          </a>{" "}
          for details.
        </p>
      </div>
    </div>
  );
}
