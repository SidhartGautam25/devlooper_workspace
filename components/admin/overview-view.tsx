"use client";

import { useMemo } from "react";
import { Briefcase, CheckCircle2, Users, UsersRound } from "lucide-react";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { useStats } from "@/lib/hooks/use-stats";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useLeads } from "@/lib/hooks/use-leads";
import { Badge } from "@/components/admin/badge";

export function OverviewView() {
  const user = useAdminUser();
  const { data: stats, isLoading } = useStats();
  const { data: tasks = [] } = useTasks();
  const { data: leads = [] } = useLeads();
  const isSuperuser = user.role === "SUPERUSER";

  const cards = useMemo(
    () => [
      {
        label: isSuperuser ? "Total leads" : "My leads",
        value: stats?.totalLeads ?? 0,
        icon: UsersRound,
      },
      {
        label: isSuperuser ? "Total tasks" : "My tasks",
        value: stats?.totalTasks ?? 0,
        icon: Briefcase,
      },
      {
        label: "Completed tasks",
        value: stats?.completedTasks ?? 0,
        icon: CheckCircle2,
      },
      ...(isSuperuser
        ? [
            {
              label: "Employees",
              value: stats?.employeeCount ?? 0,
              icon: Users,
            },
          ]
        : []),
    ],
    [isSuperuser, stats],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="mt-1 text-sm text-slate-400">
          {isSuperuser
            ? "Workspace-wide delivery and pipeline at a glance."
            : "Your assigned work and pipeline."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{card.label}</p>
                <Icon className="h-4 w-4 text-indigo-300" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">
                {isLoading ? "—" : card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5">
          <h3 className="text-sm font-semibold text-white">Recent tasks</h3>
          <ul className="mt-4 space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm text-slate-100">{task.title}</p>
                  <p className="text-xs text-slate-400">
                    {task.assignedTo.name}
                  </p>
                </div>
                <Badge value={task.status} />
              </li>
            ))}
            {tasks.length === 0 ? (
              <li className="text-sm text-slate-400">No tasks yet.</li>
            ) : null}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5">
          <h3 className="text-sm font-semibold text-white">Recent leads</h3>
          <ul className="mt-4 space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <li
                key={lead.id}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm text-slate-100">{lead.name}</p>
                  <p className="text-xs text-slate-400">
                    {lead.service ?? lead.source ?? "—"}
                  </p>
                </div>
                <Badge value={lead.status} />
              </li>
            ))}
            {leads.length === 0 ? (
              <li className="text-sm text-slate-400">No leads yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
