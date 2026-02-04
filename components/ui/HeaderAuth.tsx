"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AuthState =
  | { status: "loading" }
  | { status: "loggedOut" }
  | { status: "loggedIn"; username?: string };

export default function HeaderAuth() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        setState({ status: "loggedOut" });
        return;
      }

      const username =
        (data.user.user_metadata?.username as string | undefined) ??
        (data.user.email ? data.user.email.split("@")[0] : undefined);

      setState({ status: "loggedIn", username });
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close on outside click + Escape
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!open) return;
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-zinc-300 dark:bg-zinc-800/60 animate-pulse" />
      </div>
    );
  }

  if (state.status === "loggedOut") {
    return (
      <Link
        href="/login"
        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-500 transition"
      >
        Login
      </Link>
    );
  }

  const initial = (state.username?.[0] || "U").toUpperCase();
  const displayName = (state.username || "User").toUpperCase();

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center font-semibold transition text-black dark:text-white">
          {initial}
        </div>
        <span className="text-sm font-bold text-black dark:text-white">
          {displayName}
        </span>
        <span className="text-zinc-600 dark:text-zinc-600 text-xs">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              Profile
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
