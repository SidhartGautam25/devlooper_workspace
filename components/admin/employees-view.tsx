"use client";

import { useState } from "react";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { Badge } from "@/components/admin/badge";
import { Modal } from "@/components/admin/modal";
import {
  useCreateEmployee,
  useEmployees,
  useResetEmployeePassword,
  useToggleEmployeeStatus,
} from "@/lib/hooks/use-employees";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

export function EmployeesView() {
  const user = useAdminUser();
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const resetPassword = useResetEmployeePassword();
  const toggleStatus = useToggleEmployeeStatus();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (user.role !== "SUPERUSER") {
    return (
      <p className="text-sm text-slate-400">
        Employee management is available to superusers only.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Employees</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create accounts, reset passwords, and toggle access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Add new employee
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#1E293B]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tasks</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  Loading employees…
                </td>
              </tr>
            ) : null}
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-slate-800/80">
                <td className="px-4 py-3 text-white">{employee.name}</td>
                <td className="px-4 py-3 text-slate-300">{employee.email}</td>
                <td className="px-4 py-3 text-slate-300">{employee.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge value={employee.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {employee._count.assignedTasks}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleStatus.mutate({
                          id: employee.id,
                          isActive: !employee.isActive,
                        })
                      }
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                    >
                      {employee.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setResetId(employee.id);
                      }}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                    >
                      Reset password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen ? (
        <Modal title="Add employee" onClose={() => setCreateOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                await createEmployee.mutateAsync({
                  name: String(form.get("name") ?? ""),
                  email: String(form.get("email") ?? ""),
                  phone: String(form.get("phone") ?? ""),
                  password: String(form.get("password") ?? ""),
                });
                setCreateOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to create employee");
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              Name
              <input name="name" required className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Email
              <input name="email" type="email" required className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Phone
              <input name="phone" className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Initial password
              <input name="password" type="password" required minLength={8} className={inputClass} />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={createEmployee.isPending}
              className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {createEmployee.isPending ? "Creating…" : "Create employee"}
            </button>
          </form>
        </Modal>
      ) : null}

      {resetId ? (
        <Modal title="Reset password" onClose={() => setResetId(null)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                await resetPassword.mutateAsync({
                  id: resetId,
                  password: String(form.get("password") ?? ""),
                });
                setResetId(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to reset password");
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              New password
              <input name="password" type="password" required minLength={8} className={inputClass} />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {resetPassword.isPending ? "Saving…" : "Update password"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
