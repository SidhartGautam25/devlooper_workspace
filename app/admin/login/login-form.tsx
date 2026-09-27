"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Ensure form clears any browser-injected credentials on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password: password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email, password, or account is currently inactive.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/admin";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0F1D] px-4 py-12 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient decorative glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-[#131B2E]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Brand header */}
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              DevLooper Studio
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Workspace Console
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with your team credentials to access CRM, tasks, and
              client operations.
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={onSubmit}
            autoComplete="off"
          >
            {/* Decoy fields to prevent browser password managers from auto-populating */}
            <input
              type="text"
              name="fake_user"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="password"
              name="fake_pass"
              tabIndex={-1}
              autoComplete="new-password"
              className="hidden"
              aria-hidden="true"
            />

            {error ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Email input */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Email address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  placeholder="admin@devlooperstudio.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={pending}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 transition group-hover:scale-110" />
              )}
              {pending ? "Authenticating…" : "Sign In to Workspace"}
            </button>
          </form>

          {/* Access policy & signup guidance */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3.5 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-300">
                Employee & Team Access:
              </span>{" "}
              Accounts are provisioned and managed directly by the DevLooper
              Studio Superuser. If you are a new team member or need a password
              reset, please contact your workspace administrator.
            </div>
          </div>
        </div>

        {/* Footer label */}
        <p className="mt-6 text-center text-xs text-slate-500">
          DevLooper Studio Workspace &copy; {new Date().getFullYear()} &bull;
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
