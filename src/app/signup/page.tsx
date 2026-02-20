"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const supabase = getBrowserSupabase();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Supabase returns success with empty identities when email already exists
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Please sign in instead.");
        return;
      }

      // Sign out immediately so user cannot access app before confirming email
      if (data.session) {
        await supabase.auth.signOut();
      }

      setEmailSent(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <svg
              className="h-8 w-8 text-success"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-muted">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="mt-3 text-sm text-muted">
            Click the link in the email to verify your account. If you
            don&apos;t see it, check your spam or junk folder.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Go to Sign In
          </a>
          <p className="mt-4 text-xs text-muted">
            Didn&apos;t receive the email? Check your spam folder or try signing
            up again with a different email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold">Create your account</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Get started with ContractEar
        </p>

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
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent-light focus:outline-none"
              placeholder="Confirm your password"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          By signing up, you agree to our{" "}
          <a href="/terms" className="text-accent-light hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-accent-light hover:underline">
            Privacy Policy
          </a>
          . If a refund is granted, the cost of any analyses delivered will be
          deducted as per your plan rate.
        </p>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <a href="/login" className="text-accent-light hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
