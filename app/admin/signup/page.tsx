import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert, Sparkles } from "lucide-react";

export default function SignupNoticePage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0F1D] px-4 py-12 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient decorative glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-[#131B2E]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              DevLooper Studio
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Workspace Registration
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Account provisioning and onboarding policy for team members.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Public Sign-up Disabled
                </p>
                <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                  DevLooper Studio Workspace is a private internal console.
                  Self-registration is not available to the general public.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-300 space-y-2">
              <p className="font-medium text-white flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-indigo-400" />
                How to get access:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-300">Superuser Account:</strong>{" "}
                  Configured via workspace environment variables upon
                  deployment.
                </li>
                <li>
                  <strong className="text-slate-300">Employee Accounts:</strong>{" "}
                  Created and managed directly by the Superuser inside the
                  Employees console.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/admin/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Sign In
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          DevLooper Studio Workspace &copy; {new Date().getFullYear()} &bull;
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
