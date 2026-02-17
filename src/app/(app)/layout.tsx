"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
      />
    ),
  },
  {
    label: "Usage",
    href: "/usage",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    label: "Billing",
    href: "/billing",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
      />
    ),
  },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        // Clear stale session and redirect
        supabase.auth.signOut();
        router.push("/login");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-card-border border-t-accent-light" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-0 px-4 py-6 sm:gap-6 sm:px-6">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 sm:block">
        <div className="sticky top-20 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/15 text-accent-light"
                    : "text-muted hover:bg-card hover:text-foreground"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0"
                >
                  {item.icon}
                </svg>
                {item.label}
              </a>
            );
          })}

          <div className="my-3 h-px bg-card-border" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="mb-4 flex w-full gap-1 overflow-x-auto border-b border-card-border pb-3 sm:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent-light"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {item.icon}
              </svg>
              {item.label}
            </a>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          Sign Out
        </button>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
