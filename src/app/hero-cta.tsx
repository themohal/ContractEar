"use client";

import { useState, useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

export default function HeroCta() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true);
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="mx-auto mt-10 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  if (isLoggedIn) {
    return (
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
    );
  }

  return (
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
  );
}
