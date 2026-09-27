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
  useUpdateEmployee,
} from "@/lib/hooks/use-employees";
import { useLanguages } from "@/lib/hooks/use-languages";
import { useRegions } from "@/lib/hooks/use-regions";
import { useRoles, useCreateRole, useDeleteRole } from "@/lib/hooks/use-roles";
import type { Employee } from "@/lib/api/client";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

export function EmployeesView() {
  const user = useAdminUser();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: languages = [] } = useLanguages();
  const { data: regions = [] } = useRegions();
  const { data: roles = [] } = useRoles();

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const resetPassword = useResetEmployeePassword();
  const toggleStatus = useToggleEmployeeStatus();

  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [manageRolesOpen, setManageRolesOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
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
            Create accounts, assign roles, reset passwords, and toggle access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setManageRolesOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition"
          >
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            Manage Roles ({roles.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
          >
            Add new employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#1E293B]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name & ID</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Language & Region</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tasks</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={8}>
                  Loading employees…
                </td>
              </tr>
            ) : null}
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-slate-800/80">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{employee.name}</p>
                  {employee.employeeId ? (
                    <p
                      className="font-mono text-[11px] text-slate-400 select-all"
                      title={employee.employeeId}
                    >
                      ID: {employee.employeeId.slice(0, 8)}...
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs">
                  {employee.employeeRole ? (
                    <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-purple-300 border border-purple-500/20 font-medium">
                      {employee.employeeRole.name}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">{employee.email}</td>
                <td className="px-4 py-3 text-slate-300">
                  {employee.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {employee.language ? (
                      <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-300 border border-sky-500/20">
                        {employee.language.name}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                    {employee.region ? (
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-300 border border-amber-500/20">
                        {employee.region.name}
                      </span>
                    ) : null}
                  </div>
                </td>
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
                      onClick={() => {
                        setError(null);
                        setEditEmployee(employee);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
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

      {/* MODAL: Add New Employee */}
      {createOpen ? (
        <Modal title="Add employee" onClose={() => setCreateOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                const roleVal = form.get("employeeRoleId");
                const langVal = form.get("languageId");
                const regVal = form.get("regionId");
                await createEmployee.mutateAsync({
                  name: String(form.get("name") ?? ""),
                  email: String(form.get("email") ?? ""),
                  phone: String(form.get("phone") ?? ""),
                  password: String(form.get("password") ?? ""),
                  employeeRoleId: roleVal ? String(roleVal) : null,
                  languageId: langVal ? String(langVal) : null,
                  regionId: regVal ? String(regVal) : null,
                });
                setCreateOpen(false);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to create employee",
                );
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              Name
              <input name="name" required className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Email
              <input
                name="email"
                type="email"
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Phone
              <input name="phone" className={inputClass} />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm text-slate-300">
                Role
                <select name="employeeRoleId" className={inputClass}>
                  <option value="">-- None --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Language
                <select name="languageId" className={inputClass}>
                  <option value="">-- None --</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Region
                <select name="regionId" className={inputClass}>
                  <option value="">-- None --</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              Initial password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className={inputClass}
              />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={createEmployee.isPending}
              className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 transition"
            >
              {createEmployee.isPending ? "Creating…" : "Create employee"}
            </button>
          </form>
        </Modal>
      ) : null}

      {/* MODAL: Edit Employee Details & Role */}
      {editEmployee ? (
        <Modal
          title={`Edit Employee: ${editEmployee.name}`}
          onClose={() => setEditEmployee(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                const roleVal = form.get("employeeRoleId");
                const langVal = form.get("languageId");
                const regVal = form.get("regionId");
                await updateEmployee.mutateAsync({
                  id: editEmployee.id,
                  name: String(form.get("name") ?? ""),
                  phone: String(form.get("phone") ?? ""),
                  employeeRoleId: roleVal ? String(roleVal) : null,
                  languageId: langVal ? String(langVal) : null,
                  regionId: regVal ? String(regVal) : null,
                });
                setEditEmployee(null);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to update employee",
                );
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              Name
              <input
                name="name"
                defaultValue={editEmployee.name}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Email
              <input
                disabled
                value={editEmployee.email}
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Phone
              <input
                name="phone"
                defaultValue={editEmployee.phone ?? ""}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm text-slate-300">
                Role
                <select
                  name="employeeRoleId"
                  defaultValue={editEmployee.employeeRoleId ?? ""}
                  className={inputClass}
                >
                  <option value="">-- None --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Language
                <select
                  name="languageId"
                  defaultValue={editEmployee.languageId ?? ""}
                  className={inputClass}
                >
                  <option value="">-- None --</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Region
                <select
                  name="regionId"
                  defaultValue={editEmployee.regionId ?? ""}
                  className={inputClass}
                >
                  <option value="">-- None --</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={updateEmployee.isPending}
              className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 transition"
            >
              {updateEmployee.isPending ? "Saving changes…" : "Save changes"}
            </button>
          </form>
        </Modal>
      ) : null}

      {/* MODAL: Manage Roles (Superuser only) */}
      {manageRolesOpen ? (
        <Modal title="Manage Roles" onClose={() => setManageRolesOpen(false)}>
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Create and manage employee roles. Roles created here can be
              assigned during or after employee creation.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!newRoleName.trim()) return;

                try {
                  await createRole.mutateAsync({
                    name: newRoleName.trim(),
                  });
                  setNewRoleName("");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to create role",
                  );
                }
              }}
              className="space-y-2"
            >
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Add New Role
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Sales Representative, Technical Support"
                  className={inputClass}
                  required
                />
                <button
                  type="submit"
                  disabled={createRole.isPending || !newRoleName.trim()}
                  className="mt-1 flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </form>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Existing Roles ({roles.length})
              </label>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 text-sm hover:bg-slate-800/40 transition"
                  >
                    <div>
                      <span className="font-medium text-white">{r.name}</span>
                      <span className="ml-2 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-500/20">
                        {r._count?.employees ?? 0} employees
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteRole.mutateAsync(r.id);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Failed to delete role",
                          );
                        }
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {roles.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">
                    No roles created yet. Add your first role above.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* MODAL: Reset Password */}
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
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to reset password",
                );
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              New password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className={inputClass}
              />
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
