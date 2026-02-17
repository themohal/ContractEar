"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (searchParams.get("confirmed") === "1") {
      setConfirmed(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Sign in to your ContractEar account
        </p>

        {confirmed && (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-3 text-center text-sm text-success">
            Email confirmed! You can now sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent-light focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent-light focus:outline-none"
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-accent-light hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
