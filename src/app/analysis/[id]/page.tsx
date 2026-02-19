"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import type { AnalysisResult } from "@/lib/types";
import { generatePDF } from "@/lib/generate-pdf";


const PROGRESS_MESSAGES = [
  "Uploading audio to our servers...",
  "Transcribing your recording with AI...",
  "Identifying speakers and commitments...",
  "Analyzing deadlines and financial terms...",
  "Checking for red flags and ambiguities...",
  "Generating your agreement summary...",
  "Almost done — finalizing your report...",
];

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [status, setStatus] = useState<string>("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [token, setToken] = useState<string>("");
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const prevStatusRef = useRef<string>("loading");
  const autoDownloadDone = useRef(false);
  const confirmTriggered = useRef(false);

  // Get auth token
  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
      }
    });
  }, []);

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

  // Check if paid via query param and trigger confirm
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("paid") === "1") {
      setAwaitingPayment(true);
      window.history.replaceState({}, "", `/analysis/${id}`);
    }
  }, [id]);

  // Retry confirm-payment until webhook has updated status
  useEffect(() => {
    if (!awaitingPayment || !token) return;
    let cancelled = false;
    let attempts = 0;

    const tryConfirm = async () => {
      while (!cancelled && attempts < 15) {
        attempts++;
        try {
          const res = await fetch("/api/confirm-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ analysisId: id }),
          });
          if (res.ok) {
            // Payment confirmed and processing started
            setAwaitingPayment(false);
            return;
          }
          if (res.status !== 402) {
            // Non-payment error, stop retrying
            setAwaitingPayment(false);
            return;
          }
        } catch {
          // Network error, keep retrying
        }
        // Wait 2 seconds before retrying (webhook may still be in-flight)
        await new Promise((r) => setTimeout(r, 2000));
      }
      // Exhausted retries — stop waiting
      setAwaitingPayment(false);
    };

    tryConfirm();
    return () => { cancelled = true; };
  }, [awaitingPayment, token, id]);

  // Poll for status — keeps running until completed/error so webhook updates are picked up
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let confirmTried = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/analysis?id=${id}`);
        if (!res.ok) {
          setStatus("error");
          setError("Analysis not found");
          clearInterval(interval);
          return;
        }
        const data = await res.json();
        setStatus(data.status);
        setFileName(data.fileName || "");
        if (data.result) setResult(data.result);
        if (data.error) setError(data.error);
        if (data.status === "completed" || data.status === "error") {
          clearInterval(interval);
          return;
        }
        // When pending, try confirm-payment once (handles paid-but-webhook-delayed)
        // Keep polling regardless so webhook status changes are picked up
        if (data.status === "pending" && !awaitingPayment && !confirmTried && token) {
          confirmTried = true;
          try {
            await fetch("/api/confirm-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ analysisId: id }),
            });
          } catch {}
        }
      } catch {
        // Keep polling on network errors
      }
    };

    poll();
    interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [id, awaitingPayment, token]);

  // Auto-trigger processing when status is "paid" but not yet processing
  useEffect(() => {
    if (status !== "paid" || !token || confirmTriggered.current) return;
    confirmTriggered.current = true;

    fetch("/api/confirm-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ analysisId: id }),
    }).catch(() => {});
  }, [status, token, id]);

  // Progress message rotation
  useEffect(() => {
    if (status !== "processing" && status !== "paid") return;
    const timer = setInterval(() => {
      setProgressIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [status]);

  // Auto-download PDF when analysis completes (watched transition or fresh page load)
  useEffect(() => {
    const wasProcessing =
      prevStatusRef.current === "processing" || prevStatusRef.current === "paid";
    if (
      wasProcessing &&
      status === "completed" &&
      result &&
      !autoDownloadDone.current
    ) {
      autoDownloadDone.current = true;
      setTimeout(() => generatePDF(result, fileName), 500);
    }
    prevStatusRef.current = status;
  }, [status, result, fileName]);

  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysisId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout");
        return;
      }

      if (paddleLoaded && window.Paddle && data.transactionId) {
        window.Paddle.Checkout.open({
          transactionId: data.transactionId,
          settings: {
            successUrl: `${window.location.origin}/analysis/${id}?paid=1`,
            displayMode: "overlay",
            theme: "dark",
          },
        });
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [id, paddleLoaded, token]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-muted">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/20">
            <svg
              className="h-8 w-8 text-danger"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold">Analysis Failed</h2>
          <p className="mt-2 text-sm text-muted">
            {error || "An unexpected error occurred during analysis."}
          </p>
          <p className="mt-4 text-sm text-muted">
            Need help?{" "}
            <a
              href="mailto:support@contractear.com"
              className="text-accent-light hover:underline"
            >
              Contact support
            </a>
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Try Another Recording
          </a>
        </div>
      </div>
    );
  }

  // Processing state (also shown when awaiting webhook after payment)
  if (status === "processing" || status === "paid" || awaitingPayment) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner />
          <h2 className="mt-4 text-xl font-semibold">
            Analyzing your recording...
          </h2>
          <p className="mt-2 text-sm text-muted">
            {PROGRESS_MESSAGES[progressIndex]}
          </p>
          <p className="mt-4 text-xs text-muted">
            This usually takes 1-3 minutes
          </p>
        </div>
      </div>
    );
  }

  // Pending (not paid) — Payment wall for single plan users
  if (status === "pending") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
            <svg
              className="h-8 w-8 text-accent-light"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold">
            Your recording is ready for analysis
          </h2>
          {fileName && (
            <p className="mt-1 text-sm text-muted">
              File:{" "}
              {fileName.length > 50
                ? fileName.substring(0, 50) + "..."
                : fileName}
            </p>
          )}
          <p className="mt-3 text-sm text-muted">
            Our AI will transcribe your audio and extract all verbal
            commitments, deadlines, red flags, and action items.
          </p>
          <div className="mt-6 rounded-xl border border-card-border bg-card p-6">
            <div className="text-3xl font-bold">$3.99</div>
            <p className="mt-1 text-sm text-muted">
              One-time payment — Non-refundable
            </p>
            <ul className="mt-4 space-y-2 text-left text-sm">
              {[
                "Full AI transcription & analysis",
                "Commitments, deadlines & red flags",
                "Risk score & action items",
                "PDF download",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-success"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || !paddleLoaded}
              className="mt-6 w-full rounded-lg bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60"
            >
              {checkoutLoading ? "Loading..." : "Analyze Now — $3.99"}
            </button>
            <p className="mt-3 text-xs text-muted">
              Or{" "}
              <a
                href="/dashboard"
                className="text-accent-light hover:underline"
              >
                subscribe to a plan
              </a>{" "}
              and save up to 63%
            </p>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </div>
    );
  }

  // Completed — Results
  if (status === "completed" && result) {
    return <ResultsView result={result} fileName={fileName} onDownloadPDF={() => generatePDF(result, fileName)} />;
  }

  return null;
}

function Spinner() {
  return (
    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
  );
}

function ResultsView({
  result,
  fileName,
  onDownloadPDF,
}: {
  result: AnalysisResult;
  fileName: string;
  onDownloadPDF: () => void;
}) {
  const riskColor =
    result.riskScore <= 3
      ? "text-success"
      : result.riskScore <= 6
        ? "text-warning"
        : "text-danger";
  const riskBg =
    result.riskScore <= 3
      ? "bg-success/20"
      : result.riskScore <= 6
        ? "bg-warning/20"
        : "bg-danger/20";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold">Agreement Analysis</h1>
        {fileName && (
          <p className="mt-1 text-sm text-muted">
            {fileName.length > 60
              ? fileName.substring(0, 60) + "..."
              : fileName}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-xl border border-card-border bg-card p-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${riskBg}`}
        >
          <span className={`text-2xl font-bold ${riskColor}`}>
            {result.riskScore}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Risk Score</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskBg} ${riskColor}`}
            >
              {result.riskScore <= 3
                ? "Low Risk"
                : result.riskScore <= 6
                  ? "Medium Risk"
                  : "High Risk"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{result.riskExplanation}</p>
        </div>
      </div>

      <Section title="Summary">
        <p className="text-sm leading-relaxed text-muted">{result.summary}</p>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          {result.duration && <span>Duration: {result.duration}</span>}
          {result.wordCount > 0 && (
            <span>{result.wordCount.toLocaleString()} words</span>
          )}
        </div>
      </Section>

      {result.parties.length > 0 && (
        <Section title="Parties Identified">
          <div className="flex flex-wrap gap-2">
            {result.parties.map((p, i) => (
              <span
                key={i}
                className="rounded-full border border-card-border bg-card px-3 py-1 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                {p.role && <span className="text-muted"> — {p.role}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}

      {result.commitments.length > 0 && (
        <Section title="Verbal Commitments">
          <div className="space-y-3">
            {result.commitments.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-card-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{c.commitment}</p>
                  {c.timestamp && (
                    <span className="shrink-0 text-xs text-muted">
                      {c.timestamp}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Speaker: {c.speaker}
                </p>
                {c.quote && (
                  <p className="mt-2 border-l-2 border-accent/30 pl-3 text-xs italic text-muted">
                    &quot;{c.quote}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.deadlines.length > 0 && (
        <Section title="Deadlines & Timelines">
          <div className="space-y-2">
            {result.deadlines.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-card-border bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
                  <svg
                    className="h-5 w-5 text-warning"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">{d.description}</p>
                  <p className="text-xs text-muted">
                    {d.date} — {d.speaker}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.financialTerms.length > 0 && (
        <Section title="Financial Terms">
          <div className="space-y-2">
            {result.financialTerms.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-card-border bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20">
                  <span className="text-sm font-bold text-success">$</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{f.description}</p>
                  <p className="text-xs text-muted">
                    {f.amount && <span>{f.amount} — </span>}
                    {f.speaker}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.liabilityStatements.length > 0 && (
        <Section title="Liability Statements">
          <div className="space-y-3">
            {result.liabilityStatements.map((l, i) => (
              <div
                key={i}
                className="rounded-lg border border-card-border bg-card p-4"
              >
                <p className="text-sm font-medium">{l.statement}</p>
                <p className="mt-1 text-xs text-muted">
                  Speaker: {l.speaker}
                </p>
                {l.quote && (
                  <p className="mt-2 border-l-2 border-accent/30 pl-3 text-xs italic text-muted">
                    &quot;{l.quote}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.redFlags.length > 0 && (
        <Section title="Red Flags">
          <div className="space-y-2">
            {result.redFlags.map((r, i) => (
              <div
                key={i}
                className="rounded-lg border border-card-border bg-card p-4"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.severity === "high"
                        ? "bg-danger/20 text-danger"
                        : r.severity === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted/20 text-muted"
                    }`}
                  >
                    {r.severity}
                  </span>
                  <p className="text-sm">{r.issue}</p>
                </div>
                {r.quote && (
                  <p className="mt-2 border-l-2 border-danger/30 pl-3 text-xs italic text-muted">
                    &quot;{r.quote}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.ambiguousTerms.length > 0 && (
        <Section title="Ambiguous Terms">
          <div className="space-y-3">
            {result.ambiguousTerms.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border border-card-border bg-card p-4"
              >
                <p className="text-sm font-medium">&quot;{a.term}&quot;</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded bg-background p-2 text-xs">
                    <span className="font-medium">Interpretation 1:</span>{" "}
                    <span className="text-muted">{a.interpretation1}</span>
                  </div>
                  <div className="rounded bg-background p-2 text-xs">
                    <span className="font-medium">Interpretation 2:</span>{" "}
                    <span className="text-muted">{a.interpretation2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.actionItems.length > 0 && (
        <Section title="Action Items">
          <div className="space-y-2">
            {result.actionItems.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-card-border bg-card p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-card-border">
                  <span className="text-xs text-muted">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm">{a.action}</p>
                  <p className="text-xs text-muted">
                    Assigned to: {a.assignedTo}
                    {a.deadline && <span> — Due: {a.deadline}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="no-print mt-8 flex items-center justify-between border-t border-card-border pt-6">
        <a href="/dashboard" className="text-sm text-accent-light hover:underline">
          Analyze another recording
        </a>
        <button
          onClick={onDownloadPDF}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
        >
          Download PDF
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        This analysis is for informational purposes only and does not constitute
        legal advice. Consult a licensed attorney for legal matters.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
