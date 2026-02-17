"use client";

import { useState, useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";

interface DailyPoint {
  date: string;
  count: number;
}

interface MonthlyPoint {
  month: string;
  count: number;
}

interface UsageStats {
  daily: DailyPoint[];
  monthly: MonthlyPoint[];
  total: number;
}

function BarChart({
  data,
  labelKey,
  valueKey,
  formatLabel,
}: {
  data: { [key: string]: string | number }[];
  labelKey: string;
  valueKey: string;
  formatLabel: (val: string) => string;
}) {
  const maxValue = Math.max(...data.map((d) => d[valueKey] as number), 1);

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 flex h-48 flex-col justify-between text-[10px] text-muted">
        <span>{maxValue}</span>
        <span>{Math.round(maxValue / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-8">
        {/* Grid lines */}
        <div className="relative h-48 border-b border-l border-card-border">
          <div className="absolute left-0 top-0 h-px w-full bg-card-border/50" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-card-border/30" />

          {/* Bars */}
          <div className="flex h-full items-end justify-between gap-px px-1">
            {data.map((d, i) => {
              const value = d[valueKey] as number;
              const heightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                >
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-8 z-10 hidden rounded bg-card px-2 py-1 text-[10px] font-medium shadow-lg group-hover:block">
                    {value} {value === 1 ? "analysis" : "analyses"}
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${
                      value > 0
                        ? "bg-accent-light group-hover:bg-accent"
                        : "bg-card-border/30"
                    }`}
                    style={{
                      height: `${Math.max(heightPct, value > 0 ? 4 : 1)}%`,
                      minHeight: value > 0 ? "4px" : "1px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="mt-1 flex justify-between text-[9px] text-muted">
          {data.length <= 12
            ? data.map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {formatLabel(d[labelKey] as string)}
                </span>
              ))
            : data.map((d, i) => (
                <span
                  key={i}
                  className="flex-1 text-center"
                  style={{
                    visibility:
                      i % 5 === 0 || i === data.length - 1
                        ? "visible"
                        : "hidden",
                  }}
                >
                  {formatLabel(d[labelKey] as string)}
                </span>
              ))}
        </div>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    const init = async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/usage-stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  if (!profile || !stats) return null;

  const dailyTotal = stats.daily.reduce((s, d) => s + d.count, 0);
  const todayCount = stats.daily[stats.daily.length - 1]?.count || 0;
  const currentMonthCount =
    stats.monthly[stats.monthly.length - 1]?.count || 0;

  const formatDayLabel = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatMonthLabel = (month: string) => {
    const [, m] = month.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[parseInt(m) - 1];
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Usage</h1>
      <p className="mt-1 text-sm text-muted">
        Track your analysis usage over time
      </p>

      {/* Stats Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Today
          </p>
          <p className="mt-1 text-2xl font-bold">{todayCount}</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Last 30 Days
          </p>
          <p className="mt-1 text-2xl font-bold">{dailyTotal}</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            This Month
          </p>
          <p className="mt-1 text-2xl font-bold">{currentMonthCount}</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            All Time
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </div>
      </div>

      {/* Plan Usage */}
      {profile.plan !== "single" && profile.plan !== "none" && (
        <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Monthly Allowance</h2>
              <p className="mt-0.5 text-xs text-muted">
                {profile.analyses_used} of {profile.analyses_limit} analyses
                used this billing cycle
              </p>
            </div>
            <span className="text-2xl font-bold">
              {Math.round(
                (profile.analyses_used / profile.analyses_limit) * 100
              )}
              <span className="text-sm font-normal text-muted">%</span>
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full transition-all ${
                profile.analyses_used / profile.analyses_limit >= 0.9
                  ? "bg-danger"
                  : profile.analyses_used / profile.analyses_limit >= 0.7
                    ? "bg-warning"
                    : "bg-accent-light"
              }`}
              style={{
                width: `${Math.min(
                  (profile.analyses_used / profile.analyses_limit) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Cycle resets on{" "}
            {new Date(
              new Date(profile.billing_cycle_start).getTime() +
                30 * 24 * 60 * 60 * 1000
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Analysis Activity</h2>
          <div className="flex rounded-lg border border-card-border">
            <button
              onClick={() => setView("daily")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "daily"
                  ? "bg-accent/15 text-accent-light"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "monthly"
                  ? "bg-accent/15 text-accent-light"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="mt-4">
          {view === "daily" ? (
            <BarChart
              data={stats.daily}
              labelKey="date"
              valueKey="count"
              formatLabel={formatDayLabel}
            />
          ) : (
            <BarChart
              data={stats.monthly}
              labelKey="month"
              valueKey="count"
              formatLabel={formatMonthLabel}
            />
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-muted">
          {view === "daily" ? "Last 30 days" : "Last 12 months"}
        </p>
      </div>
    </div>
  );
}
