"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Tag,
  Trash2,
  UserCheck,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { Badge } from "@/components/admin/badge";
import { Modal } from "@/components/admin/modal";
import {
  useBusinessTypes,
  useCreateBusinessType,
  useDeleteBusinessType,
} from "@/lib/hooks/use-business-types";
import { useEmployees } from "@/lib/hooks/use-employees";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-tasks";
import type {
  Task,
  TaskPriority,
  TaskResult,
  TaskStatus,
} from "@/lib/api/client";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-800/90 px-3 py-2 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

const statuses: Array<TaskStatus | "ALL"> = [
  "ALL",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
];
const priorities: Array<TaskPriority | "ALL"> = [
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];
const results: Array<TaskResult | "PENDING" | "ALL"> = [
  "ALL",
  "PASS",
  "FAIL",
  "PENDING",
];
const allStatuses: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
];

export function TasksView() {
  const user = useAdminUser();
  const isSuperuser = user.role === "SUPERUSER";

  const { data: tasks = [], isLoading } = useTasks();
  const { data: employees = [] } = useEmployees(isSuperuser);
  const { data: businessTypes = [] } = useBusinessTypes();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const createBusinessType = useCreateBusinessType();
  const deleteBusinessType = useDeleteBusinessType();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<(typeof priorities)[number]>("ALL");
  const [resultFilter, setResultFilter] =
    useState<(typeof results)[number]>("ALL");
  const [bTypeFilter, setBTypeFilter] = useState<string>("ALL");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [manageBTypesOpen, setManageBTypesOpen] = useState(false);
  const [logCallTask, setLogCallTask] = useState<Task | null>(null);
  const [reassignTask, setReassignTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newBTypeName, setNewBTypeName] = useState("");

  const activeEmployees = employees.filter((employee) => employee.isActive);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchStatus =
        statusFilter === "ALL" || task.status === statusFilter;
      const matchPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;
      const matchBType =
        bTypeFilter === "ALL" || task.businessTypeId === bTypeFilter;

      let matchResult = true;
      if (resultFilter === "PENDING") {
        matchResult = task.result === null;
      } else if (resultFilter !== "ALL") {
        matchResult = task.result === resultFilter;
      }

      const query = search.trim().toLowerCase();
      const matchSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.businessName &&
          task.businessName.toLowerCase().includes(query)) ||
        (task.contactPhone &&
          task.contactPhone.toLowerCase().includes(query)) ||
        (task.contactEmail &&
          task.contactEmail.toLowerCase().includes(query)) ||
        (task.businessType &&
          task.businessType.name.toLowerCase().includes(query)) ||
        (task.assignedTo && task.assignedTo.name.toLowerCase().includes(query));

      return (
        matchStatus && matchPriority && matchBType && matchResult && matchSearch
      );
    });
  }, [bTypeFilter, priorityFilter, resultFilter, search, statusFilter, tasks]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isSuperuser ? "Tasks & Operations" : "My Assigned Tasks"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isSuperuser
              ? "Assign leads and client tasks, track call duration, and monitor outcomes."
              : "Execute your assigned tasks, record call details, and log outcomes."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperuser ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setManageBTypesOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/80 transition"
              >
                <Tag className="h-4 w-4 text-indigo-400" />
                Manage Business Types
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid gap-3 rounded-2xl border border-slate-800/80 bg-[#131B2E]/80 p-4 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, business, phone..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-indigo-400"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-indigo-400"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              Status: {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value as typeof priorityFilter)
          }
          className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-indigo-400"
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              Priority: {priority}
            </option>
          ))}
        </select>

        {/* Business Type Filter */}
        <select
          value={bTypeFilter}
          onChange={(e) => setBTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-indigo-400"
        >
          <option value="ALL">All Business Types</option>
          {businessTypes.map((bt) => (
            <option key={bt.id} value={bt.id}>
              {bt.name}
            </option>
          ))}
        </select>

        {/* Call Result Filter */}
        <select
          value={resultFilter}
          onChange={(e) =>
            setResultFilter(e.target.value as typeof resultFilter)
          }
          className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-indigo-400"
        >
          <option value="ALL">All Results</option>
          <option value="PENDING">Result: Pending</option>
          <option value="PASS">Result: PASS</option>
          <option value="FAIL">Result: FAIL</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#131B2E]/90 shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Task & Business</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Assignee</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5">Priority & Due</th>
                <th className="px-4 py-3.5">Call & Result</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {isLoading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400"
                    colSpan={8}
                  >
                    Loading tasks…
                  </td>
                </tr>
              ) : null}

              {filtered.map((task) => {
                const canLogCall = isSuperuser || task.assignedToId === user.id;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-800/30 transition"
                  >
                    {/* Task & Business */}
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-semibold text-white">{task.title}</p>
                      {task.businessName || task.businessType ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-indigo-300">
                          <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{task.businessName || "Business"}</span>
                          {task.businessType ? (
                            <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
                              {task.businessType.name}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {task.description ? (
                        <p className="mt-1.5 max-w-xs text-xs text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      ) : null}
                    </td>

                    {/* Contact Details */}
                    <td className="px-4 py-3.5 align-top text-xs text-slate-300 space-y-1">
                      {task.contactPhone ? (
                        <a
                          href={`tel:${task.contactPhone}`}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 transition"
                        >
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{task.contactPhone}</span>
                        </a>
                      ) : null}
                      {task.contactEmail ? (
                        <a
                          href={`mailto:${task.contactEmail}`}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 transition"
                        >
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{task.contactEmail}</span>
                        </a>
                      ) : null}
                      {task.contactDetail ? (
                        <p className="text-[11px] text-slate-400 italic max-w-[180px] truncate">
                          {task.contactDetail}
                        </p>
                      ) : null}
                      {!task.contactPhone &&
                      !task.contactEmail &&
                      !task.contactDetail ? (
                        <span className="text-slate-500">—</span>
                      ) : null}
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3.5 align-top">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-white text-xs">
                              {task.assignedTo.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {task.assignedTo.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Badge value="UNASSIGNED" />
                      )}
                      {isSuperuser ? (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setReassignTask(task);
                          }}
                          className="mt-1 block text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        >
                          {task.assignedTo ? "Reassign" : "Assign now"}
                        </button>
                      ) : null}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 align-top text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {new Date(task.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Priority & Due */}
                    <td className="px-4 py-3.5 align-top space-y-1">
                      <div>
                        <Badge value={task.priority} />
                      </div>
                      {task.dueDate ? (
                        <p className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3 text-slate-500" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      ) : null}
                    </td>

                    {/* Call & Result */}
                    <td className="px-4 py-3.5 align-top space-y-1">
                      {task.result ? (
                        <Badge value={task.result} />
                      ) : (
                        <Badge value="PENDING" />
                      )}

                      {task.callDuration ? (
                        <p className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          Duration: {task.callDuration}
                        </p>
                      ) : null}

                      {task.callDetail ? (
                        <button
                          type="button"
                          onClick={() => setDetailTask(task)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 underline block"
                        >
                          View Call Notes
                        </button>
                      ) : null}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-top">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateStatus.mutate({
                            id: task.id,
                            status: e.target.value as TaskStatus,
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-800/90 px-2 py-1 text-xs text-white outline-none focus:border-indigo-400"
                      >
                        {allStatuses.map((st) => (
                          <option key={st} value={st}>
                            {st.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 align-top text-right space-y-1.5 whitespace-nowrap">
                      {canLogCall ? (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setLogCallTask(task);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition border border-indigo-500/30"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          Log Call
                        </button>
                      ) : null}

                      {isSuperuser ? (
                        <button
                          type="button"
                          onClick={() => deleteTask.mutate(task.id)}
                          className="ml-2 inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-slate-400"
                    colSpan={8}
                  >
                    No tasks match the selected criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Create Task (Superuser) */}
      {createOpen ? (
        <Modal title="Create New Task" onClose={() => setCreateOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setError(null);

              try {
                await createTask.mutateAsync({
                  title: String(form.get("title") ?? ""),
                  description: String(form.get("description") ?? ""),
                  businessName: String(form.get("businessName") ?? ""),
                  businessTypeId:
                    String(form.get("businessTypeId") ?? "") || null,
                  contactPhone: String(form.get("contactPhone") ?? ""),
                  contactEmail: String(form.get("contactEmail") ?? ""),
                  contactDetail: String(form.get("contactDetail") ?? ""),
                  assignedToId: String(form.get("assignedToId") ?? "") || null,
                  priority: String(
                    form.get("priority") ?? "MEDIUM",
                  ) as TaskPriority,
                  dueDate: String(form.get("dueDate") ?? "") || null,
                });
                setCreateOpen(false);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Unable to create task",
                );
              }
            }}
          >
            {/* Title */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Task Title *
              </label>
              <input
                name="title"
                required
                placeholder="e.g. Inbound Qualification Call"
                className={inputClass}
              />
            </div>

            {/* Business Info Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Business Name
                </label>
                <input
                  name="businessName"
                  placeholder="e.g. Acme Corporation"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Business Type
                </label>
                <select name="businessTypeId" className={inputClass}>
                  <option value="">-- Select Business Type --</option>
                  {businessTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>
                      {bt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Contact Phone
                </label>
                <input
                  name="contactPhone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Contact Email
                </label>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="contact@business.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Contact Notes */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Contact Address / Detail
              </label>
              <input
                name="contactDetail"
                placeholder="Key contact person, address, or phone extensions"
                className={inputClass}
              />
            </div>

            {/* Assignment & Priority Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Assign To (Optional)
                </label>
                <select name="assignedToId" className={inputClass}>
                  <option value="">-- Leave Unassigned --</option>
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  You can assign or reassign this task anytime.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="MEDIUM"
                  className={inputClass}
                >
                  {priorities
                    .filter((p) => p !== "ALL")
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Due Date & Description */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Due Date
              </label>
              <input name="dueDate" type="date" className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Instructions / Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Specific guidance for the assigned employee..."
                className={inputClass}
              />
            </div>

            {/* Call result notice */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Call Details & Result:
              </span>{" "}
              These fields are initialized as null and will be submitted by the
              employee after conducting the call.
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={createTask.isPending}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition"
            >
              {createTask.isPending ? "Creating task…" : "Create Task"}
            </button>
          </form>
        </Modal>
      ) : null}

      {/* 2. Modal: Manage Business Types (Superuser) */}
      {manageBTypesOpen ? (
        <Modal
          title="Manage Business Types"
          onClose={() => setManageBTypesOpen(false)}
        >
          <div className="space-y-5">
            {/* Create new business type */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!newBTypeName.trim()) return;

                try {
                  await createBusinessType.mutateAsync({
                    name: newBTypeName.trim(),
                  });
                  setNewBTypeName("");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to create business type",
                  );
                }
              }}
              className="space-y-2"
            >
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Add New Business Type
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBTypeName}
                  onChange={(e) => setNewBTypeName(e.target.value)}
                  placeholder="e.g. Healthcare, Fintech, Real Estate"
                  className={inputClass}
                  required
                />
                <button
                  type="submit"
                  disabled={createBusinessType.isPending}
                  className="shrink-0 self-end rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition"
                >
                  {createBusinessType.isPending ? "Adding…" : "Add"}
                </button>
              </div>
            </form>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            {/* List existing */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Available Business Types ({businessTypes.length})
              </p>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/60">
                {businessTypes.map((bt) => (
                  <div
                    key={bt.id}
                    className="flex items-center justify-between px-3.5 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-medium text-white">{bt.name}</span>
                      {bt._count?.tasks ? (
                        <span className="ml-2 text-xs text-slate-400">
                          ({bt._count.tasks}{" "}
                          {bt._count.tasks === 1 ? "task" : "tasks"})
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteBusinessType.mutateAsync(bt.id);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Failed to delete business type",
                          );
                        }
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {businessTypes.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">
                    No business types created yet. Add one above.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* 3. Modal: Log Call & Update Result (Assigned Employee / Superuser) */}
      {logCallTask ? (
        <Modal
          title={`Log Call: ${logCallTask.title}`}
          onClose={() => setLogCallTask(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setError(null);

              try {
                await updateTask.mutateAsync({
                  id: logCallTask.id,
                  callDuration: String(form.get("callDuration") ?? ""),
                  callDetail: String(form.get("callDetail") ?? ""),
                  result: (form.get("result") as TaskResult) || null,
                  status:
                    (form.get("status") as TaskStatus) || logCallTask.status,
                });
                setLogCallTask(null);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Failed to update call details",
                );
              }
            }}
          >
            {/* Task summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">
                {logCallTask.businessName || logCallTask.title}
              </p>
              {logCallTask.contactPhone ? (
                <p>Phone: {logCallTask.contactPhone}</p>
              ) : null}
              {logCallTask.contactEmail ? (
                <p>Email: {logCallTask.contactEmail}</p>
              ) : null}
            </div>

            {/* Call Duration */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Call Duration
              </label>
              <input
                name="callDuration"
                defaultValue={logCallTask.callDuration ?? ""}
                placeholder="e.g. 15 mins, 00:12:45"
                className={inputClass}
                required
              />
            </div>

            {/* Call Details */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Call Details & Discussion Notes
              </label>
              <textarea
                name="callDetail"
                defaultValue={logCallTask.callDetail ?? ""}
                rows={4}
                placeholder="Summarize client feedback, objections, interest level, next steps..."
                className={inputClass}
                required
              />
            </div>

            {/* Result (PASS / FAIL) */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Call Outcome (Result) *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-300 cursor-pointer hover:bg-emerald-500/20 transition">
                  <input
                    type="radio"
                    name="result"
                    value="PASS"
                    defaultChecked={logCallTask.result === "PASS"}
                    required
                    className="accent-emerald-500"
                  />
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>PASS</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-medium text-rose-300 cursor-pointer hover:bg-rose-500/20 transition">
                  <input
                    type="radio"
                    name="result"
                    value="FAIL"
                    defaultChecked={logCallTask.result === "FAIL"}
                    required
                    className="accent-rose-500"
                  />
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <span>FAIL</span>
                </label>
              </div>
            </div>

            {/* Task Status */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Update Task Status
              </label>
              <select
                name="status"
                defaultValue={
                  logCallTask.status === "TODO"
                    ? "IN_PROGRESS"
                    : logCallTask.status
                }
                className={inputClass}
              >
                {allStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={updateTask.isPending}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition"
            >
              {updateTask.isPending
                ? "Saving call details…"
                : "Save Call Details"}
            </button>
          </form>
        </Modal>
      ) : null}

      {/* 4. Modal: Assign / Reassign (Superuser) */}
      {reassignTask && isSuperuser ? (
        <Modal
          title={`Assign Task: ${reassignTask.title}`}
          onClose={() => setReassignTask(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setError(null);

              try {
                await updateTask.mutateAsync({
                  id: reassignTask.id,
                  assignedToId: String(form.get("assignedToId") ?? "") || null,
                });
                setReassignTask(null);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Failed to reassign task",
                );
              }
            }}
          >
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Select Assignee
              </label>
              <select
                name="assignedToId"
                defaultValue={reassignTask.assignedToId ?? ""}
                className={inputClass}
              >
                <option value="">-- Unassigned --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                {reassignTask.assignedTo
                  ? `Currently assigned to ${reassignTask.assignedTo.name}.`
                  : "Currently unassigned."}
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={updateTask.isPending}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition"
            >
              {updateTask.isPending
                ? "Updating assignment…"
                : "Save Assignment"}
            </button>
          </form>
        </Modal>
      ) : null}

      {/* 5. Modal: View Call Notes */}
      {detailTask ? (
        <Modal
          title={`Call Details: ${detailTask.title}`}
          onClose={() => setDetailTask(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Outcome Result
                </span>
                <div className="mt-1">
                  {detailTask.result ? (
                    <Badge value={detailTask.result} />
                  ) : (
                    <Badge value="PENDING" />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Call Duration
                </span>
                <span className="text-sm font-medium text-white mt-1 block">
                  {detailTask.callDuration || "Not recorded"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1.5">
                Discussion Notes
              </span>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {detailTask.callDetail || "No call notes available."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDetailTask(null)}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
