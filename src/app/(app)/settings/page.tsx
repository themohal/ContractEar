"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      setEmail(session.user.email || "");

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordNew || passwordNew.length < 6) {
      setPasswordMsg("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg("");

    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({
        password: passwordNew,
      });

      if (error) {
        setPasswordMsg(error.message);
      } else {
        setPasswordMsg("Password updated successfully");
        setPasswordCurrent("");
        setPasswordNew("");
      }
    } catch {
      setPasswordMsg("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Manage your account preferences
      </p>

      {/* Account Info */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold">Account</h2>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Email</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Plan</span>
            <span className="font-medium">
              {profile?.plan === "pro"
                ? "Pro"
                : profile?.plan === "basic"
                  ? "Basic"
                  : "Pay Per Use"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Member since</span>
            <span className="font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Total analyses</span>
            <span className="font-medium">{profile?.analyses_used || 0}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold">Change Password</h2>
        <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-muted">Current Password</label>
            <input
              type="password"
              value={passwordCurrent}
              onChange={(e) => setPasswordCurrent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm focus:border-accent-light focus:outline-none"
              placeholder="Current password"
            />
          </div>
          <div>
            <label className="block text-xs text-muted">New Password</label>
            <input
              type="password"
              value={passwordNew}
              onChange={(e) => setPasswordNew(e.target.value)}
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm focus:border-accent-light focus:outline-none"
              placeholder="New password (min 6 characters)"
            />
          </div>
          {passwordMsg && (
            <p
              className={`text-xs ${
                passwordMsg.includes("successfully")
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {passwordMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordLoading || !passwordNew}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-xl border border-danger/30 bg-card p-5">
        <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
        <p className="mt-2 text-xs text-muted">
          Signing out will end your session. To delete your account and all
          associated data, contact{" "}
          <a
            href="mailto:support@contractear.com"
            className="text-accent-light hover:underline"
          >
            support@contractear.com
          </a>
          .
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="mt-3 rounded-lg border border-danger/30 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            Sign Out of All Devices
          </button>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/80 disabled:opacity-60"
            >
              {deleting ? "Signing out..." : "Confirm Sign Out"}
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
