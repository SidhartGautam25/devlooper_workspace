"use client";

import { useMemo, useState } from "react";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { Badge } from "@/components/admin/badge";
import { Modal } from "@/components/admin/modal";
import { useEmployees } from "@/lib/hooks/use-employees";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-tasks";
import type { TaskPriority, TaskStatus } from "@/lib/api/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

const statuses: Array<TaskStatus | "ALL"> = [
  "ALL",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
];
const priorities: Array<TaskPriority | "ALL"> = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];
const allStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

export function TasksView() {
  const user = useAdminUser();
  const isSuperuser = user.role === "SUPERUSER";
  const { data: tasks = [], isLoading } = useTasks();
  const { data: employees = [] } = useEmployees(isSuperuser);
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorities)[number]>("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const statusOk = statusFilter === "ALL" || task.status === statusFilter;
        const priorityOk = priorityFilter === "ALL" || task.priority === priorityFilter;
        return statusOk && priorityOk;
      }),
    [priorityFilter, statusFilter, tasks],
  );

  const activeEmployees = employees.filter((employee) => employee.isActive);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {isSuperuser ? "Tasks" : "My tasks"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Filter by status and priority, then update progress in place.
          </p>
        </div>
        {isSuperuser ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Add task
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              Status: {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as typeof priorityFilter)
          }
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              Priority: {priority}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#1E293B]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {isSuperuser ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  Loading tasks…
                </td>
              </tr>
            ) : null}
            {filtered.map((task) => (
              <tr key={task.id} className="border-b border-slate-800/80">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{task.title}</p>
                  {task.description ? (
                    <p className="mt-1 max-w-md text-xs text-slate-400">{task.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-300">{task.assignedTo.name}</td>
                <td className="px-4 py-3">
                  <Badge value={task.priority} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.status}
                    onChange={(event) =>
                      updateStatus.mutate({
                        id: task.id,
                        status: event.target.value as TaskStatus,
                      })
                    }
                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs"
                  >
                    {allStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                {isSuperuser ? (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteTask.mutate(task.id)}
                      className="rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  No tasks match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {createOpen ? (
        <Modal title="Create task" onClose={() => setCreateOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                await createTask.mutateAsync({
                  title: String(form.get("title") ?? ""),
                  description: String(form.get("description") ?? ""),
                  assignedToId: String(form.get("assignedToId") ?? ""),
                  priority: String(form.get("priority") ?? "MEDIUM") as TaskPriority,
                  dueDate: String(form.get("dueDate") ?? "") || null,
                });
                setCreateOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to create task");
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              Title
              <input name="title" required className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Description
              <textarea name="description" rows={3} className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Assign to
              <select name="assignedToId" required className={inputClass}>
                <option value="">Select employee</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Priority
              <select name="priority" defaultValue="MEDIUM" className={inputClass}>
                {priorities
                  .filter((priority) => priority !== "ALL")
                  .map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Due date
              <input name="dueDate" type="date" className={inputClass} />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={createTask.isPending}
              className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {createTask.isPending ? "Creating…" : "Create task"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
