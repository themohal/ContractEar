"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";
import { PLANS } from "@/lib/types";

interface AnalysisItem {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  result: { riskScore: number; summary: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const fetchAnalyses = useCallback(
    async (accessToken: string) => {
      const res = await fetch("/api/user-analyses", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.analyses || []);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const t = session.access_token;
      setToken(t);

      // Ensure profile exists
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
      });

      // Fetch profile
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      // Fetch analyses
      await fetchAnalyses(t);

      setLoading(false);
    };
    init();
  }, [fetchAnalyses]);

  // Auto-refresh analysis list every 10s when there are processing items
  useEffect(() => {
    if (!token) return;
    const hasProcessing = analyses.some(
      (a) => a.status === "processing" || a.status === "paid"
    );
    if (!hasProcessing) return;
    const interval = setInterval(() => fetchAnalyses(token), 10000);
    return () => clearInterval(interval);
  }, [token, analyses, fetchAnalyses]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploadError("");
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setUploadError(data.error || "Upload failed");
          return;
        }

        if (data.requiresPayment) {
          router.push(`/analysis/${data.id}`);
        } else {
          await fetch("/api/confirm-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ analysisId: data.id }),
          });
          router.push(`/analysis/${data.id}`);
        }
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [router, token]
  );

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;
    setUploadError("");
    setIsUploading(true);

    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "URL processing failed");
        return;
      }

      if (!data.requiresPayment) {
        await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ analysisId: data.id }),
        });
      }
      router.push(`/analysis/${data.id}`);
    } catch {
      setUploadError("Failed to process URL. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [urlInput, router, token]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  if (!profile) return null;

  const usagePercent =
    profile.analyses_limit > 0
      ? Math.min(
          (profile.analyses_used / profile.analyses_limit) * 100,
          100
        )
      : 0;

  const currentPlan = PLANS.find((p) => p.tier === profile.plan);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Overview of your account and recent analyses
      </p>

      {/* Plan & Usage Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Current Plan */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
            Current Plan
          </h2>
          <p className="mt-1.5 text-xl font-bold">
            {profile.plan === "none"
              ? "No Plan"
              : currentPlan?.name || "Pay Per Use"}
          </p>
          {profile.plan === "none" ? (
            <p className="mt-0.5 text-sm text-muted">
              Choose a plan to get started
            </p>
          ) : profile.plan !== "single" ? (
            <p className="mt-0.5 text-sm text-muted">
              ${currentPlan?.price}/month
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted">$3.99 per analysis</p>
          )}
          <a
            href="/billing"
            className="mt-3 inline-block text-xs font-medium text-accent-light hover:underline"
          >
            {profile.plan === "none" ? "Choose a plan →" : "Manage billing →"}
          </a>
        </div>

        {/* Usage */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
            {profile.plan === "single" || profile.plan === "none"
              ? "Total Analyses"
              : "Monthly Usage"}
          </h2>
          {profile.plan === "single" || profile.plan === "none" ? (
            <p className="mt-1.5 text-xl font-bold">
              {profile.analyses_used}
            </p>
          ) : (
            <>
              <p className="mt-1.5 text-xl font-bold">
                {profile.analyses_used}{" "}
                <span className="text-sm font-normal text-muted">
                  / {profile.analyses_limit}
                </span>
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-background">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent >= 90
                      ? "bg-danger"
                      : usagePercent >= 70
                        ? "bg-warning"
                        : "bg-accent-light"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {profile.analyses_limit - profile.analyses_used} remaining
              </p>
            </>
          )}
          <a
            href="/usage"
            className="mt-3 inline-block text-xs font-medium text-accent-light hover:underline"
          >
            View detailed usage →
          </a>
        </div>
      </div>

      {/* Upload Zone or Choose Plan */}
      {profile.plan === "none" ? (
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
          <h2 className="mt-4 text-lg font-semibold">Choose a plan to get started</h2>
          <p className="mt-1 text-sm text-muted">
            Select a plan to start analyzing your audio recordings
          </p>
          <a
            href="/billing"
            className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            View Plans
          </a>
        </div>
      ) : (
      <div className="mt-6">
        <h2 className="text-base font-semibold">Analyze a Recording</h2>
        <p className="mt-1 text-sm text-muted">
          {profile.plan === "single"
            ? "Upload an audio file to analyze"
            : `You have ${profile.analyses_limit - profile.analyses_used} analyses remaining`}
        </p>

        <div
          className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? "border-accent-light bg-accent/10"
              : "border-card-border hover:border-accent-light/50"
          } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center gap-2">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {isUploading ? (
              <p className="text-sm text-muted">Uploading...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drop your audio file here or click to browse
                </p>
                <p className="text-xs text-muted">
                  MP3, WAV, M4A, WebM, OGG, FLAC — up to 25MB
                </p>
              </>
            )}
          </div>
        </div>

        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-card-border" />
          <span className="text-xs text-muted">or paste a URL</span>
          <div className="h-px flex-1 bg-card-border" />
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/recording.mp3"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            disabled={isUploading}
            className="flex-1 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent-light focus:outline-none disabled:opacity-60"
          />
          <button
            onClick={handleUrlSubmit}
            disabled={isUploading || !urlInput.trim()}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            Analyze
          </button>
        </div>

        {uploadError && (
          <p className="mt-2 text-sm text-danger">{uploadError}</p>
        )}
      </div>
      )}

      {/* Analysis History */}
      <div className="mt-6">
        <h2 className="text-base font-semibold">Recent Analyses</h2>
        {analyses.length === 0 ? (
          <div className="mt-3 rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-muted">No analyses yet</p>
            <p className="mt-1 text-sm text-muted">
              Upload a recording to get started
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
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
                  {a.status === "completed" && (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
