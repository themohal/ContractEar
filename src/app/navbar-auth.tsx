"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

export default function NavbarAuth() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setLoggedIn(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loggedIn) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-muted">
      <a href="/#pricing" className="hover:text-foreground transition">
        Pricing
      </a>
      <a href="/#faq" className="hover:text-foreground transition">
        FAQ
      </a>
      <a
        href="/login"
        className="rounded-lg bg-accent px-4 py-1.5 text-white transition-colors hover:bg-accent-light"
      >
        Sign In
      </a>
    </div>
  );
}
