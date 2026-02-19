"use client";

import { useState, useEffect, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

interface AnalysisItem {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  result: { riskScore: number; summary: string } | null;
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [userPlan, setUserPlan] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async (accessToken: string) => {
    const res = await fetch("/api/user-analyses", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAnalyses(data.analyses || []);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const t = session.access_token;
      setToken(t);
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (profileRes.ok) {
        const d = await profileRes.json();
        if (d.profile?.plan) setUserPlan(d.profile.plan);
      }
      await fetchAnalyses(t);
      setLoading(false);
    };
    init();
  }, [fetchAnalyses]);

  // Auto-refresh when there are processing items
  useEffect(() => {
    if (!token) return;
    const hasProcessing = analyses.some(
      (a) => a.status === "processing" || a.status === "paid"
    );
    if (!hasProcessing) return;
    const interval = setInterval(() => fetchAnalyses(token), 10000);
    return () => clearInterval(interval);
  }, [token, analyses, fetchAnalyses]);

  const handleDelete = useCallback(
    async (analysisId: string) => {
      setDeletingId(analysisId);
      try {
        const res = await fetch("/api/delete-analysis", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ analysisId }),
        });
        if (res.ok) {
          setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
        }
      } catch {}
      setDeletingId(null);
    },
    [token]
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Analyses</h1>
      <p className="mt-1 text-sm text-muted">
        All your audio analysis reports
      </p>

      {analyses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-card-border bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-accent-light"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold">No analyses yet</h2>
          <p className="mt-1 text-sm text-muted">
            Upload a recording from the dashboard to get started
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Go to Dashboard
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {analyses.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-card-border bg-card p-4 transition-colors hover:border-accent-light/30"
            >
              <a
                href={`/analysis/${a.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium">
                  {a.file_name.length > 50
                    ? a.file_name.substring(0, 50) + "..."
                    : a.file_name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </a>
              <div className="ml-4 flex items-center gap-2">
                {a.result && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.result.riskScore <= 3
                        ? "bg-success/20 text-success"
                        : a.result.riskScore <= 6
                          ? "bg-warning/20 text-warning"
                          : "bg-danger/20 text-danger"
                    }`}
                  >
                    Risk: {a.result.riskScore}/10
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === "completed"
                      ? "bg-success/20 text-success"
                      : a.status === "error"
                        ? "bg-danger/20 text-danger"
                        : a.status === "processing"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted/20 text-muted"
                  }`}
                >
                  {a.status}
                </span>
                {a.status === "completed" && userPlan === "pro" && (
                  <a
                    href={`/analysis/${a.id}`}
                    className="rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-card hover:text-foreground"
                    title="View & Download PDF"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="inline-block"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <span className="ml-1">PDF</span>
                  </a>
                )}
                <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(a.id);
                    }}
                    disabled={deletingId === a.id || a.status === "processing"}
                    className="rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === a.id ? "..." : "Delete"}
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
