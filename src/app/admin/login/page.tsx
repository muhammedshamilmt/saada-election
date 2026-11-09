"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Vote,
  RotateCcw,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please check credentials.");
        setLoading(false);
        return;
      }

      // Successful login - redirect to /admin
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("Unable to connect to authentication service. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-zinc-900 font-sans antialiased selection:bg-[#FF5B26]/20 selection:text-[#FF5B26]">
      {/* Top minimal header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200/90 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5B26] text-white flex items-center justify-center font-black border border-[#FF5B26]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-900">
            Saada<span className="text-[#FF5B26]">Admin</span>
          </span>
        </div>

        <Link
          href="/vote"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Vote className="w-3.5 h-3.5 text-[#FF5B26]" />
          <span>Student Voting Booth</span>
        </Link>
      </header>

      {/* Login Card Arena */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF5B26] border border-orange-200/80 mx-auto flex items-center justify-center shadow-none">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight font-sans">
              Presiding Officer Portal
            </h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Central Student Union Election 2026 Bureau &bull; Secure Administration Access
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Administrator Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@domain.com"
                    className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-zinc-900 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Security Passkey *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-900 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] disabled:opacity-40 text-white text-xs font-bold transition-all border border-[#FF5B26] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Protected Session Notice */}
            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by Server-Side Middleware & Encrypted Session</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400 border-t border-zinc-200/90 bg-white">
        <p>Saada Election Commission &bull; Official Digital EVM Administration</p>
      </footer>
    </div>
  );
}

