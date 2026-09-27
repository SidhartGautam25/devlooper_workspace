"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AdminUserProvider,
  useAdminUser,
  type AdminUser,
} from "@/components/admin/admin-user-context";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/tasks", label: "Tasks", icon: Briefcase },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: UsersRound,
    superuserOnly: true,
  },
  {
    href: "/admin/employees",
    label: "Employees",
    icon: Users,
    superuserOnly: true,
  },
];

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  return (
    <AdminUserProvider user={user}>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminUserProvider>
  );
}

function AdminShellInner({ children }: { children: ReactNode }) {
  const user = useAdminUser();
  const pathname = usePathname();
  const isSuperuser = user.role === "SUPERUSER";

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#1E293B] md:flex md:flex-col">
          <div className="border-b border-slate-800 px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              DevLooper Studio
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">
              Workspace Console
            </h1>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav
              .filter((item) => !item.superuserOnly || isSuperuser)
              .map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-indigo-500/20 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-[#1E293B] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              {nav
                .filter((item) => !item.superuserOnly || isSuperuser)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400">
                  {isSuperuser ? (
                    "[Superuser]"
                  ) : (
                    <span
                      className="font-mono text-indigo-400 font-medium select-all"
                      title={user.employeeId || user.id}
                    >
                      ID: {user.employeeId || user.id}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
