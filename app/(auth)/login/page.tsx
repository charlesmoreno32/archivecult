"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/">
            <h1 className="text-4xl font-bold tracking-tight cursor-pointer">
              <span className="text-white">ARCHIVE</span>
              <span className="text-red-600">CULT</span>
            </h1>
          </Link>
          <p className="text-zinc-500 text-sm mt-2">Login to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="card p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-600/10 border border-red-600 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-sm">
            <span className="text-zinc-600">Don't have an account? </span>
            <Link href="/signup" className="text-red-600 hover:text-red-500">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
