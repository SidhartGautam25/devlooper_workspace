"use client";

import { useState } from "react";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { Badge } from "@/components/admin/badge";
import { Modal } from "@/components/admin/modal";
import { useEmployees } from "@/lib/hooks/use-employees";
import { useCreateLead, useLeads, useUpdateLead } from "@/lib/hooks/use-leads";
import type { Lead, LeadStatus } from "@/lib/api/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

const leadStatuses: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
];

export function LeadsView() {
  const user = useAdminUser();
  const isSuperuser = user.role === "SUPERUSER";
  const { data: leads = [], isLoading } = useLeads();
  const { data: employees = [] } = useEmployees(isSuperuser);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeEmployees = employees.filter((employee) => employee.isActive);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {isSuperuser ? "Leads" : "My assigned leads"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Track pipeline, notes, and assignment from one CRM table.
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
            Add lead
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#1E293B]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  Loading leads…
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-800/80">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{lead.name}</p>
                  <p className="text-xs text-slate-400">
                    {lead.company ?? lead.sourceComponent ?? lead.source ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  <p>{lead.email ?? "—"}</p>
                  <p className="text-xs text-slate-400">{lead.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  <p>{lead.packageName ?? lead.service ?? "—"}</p>
                  {lead.priceInr != null ? (
                    <p className="text-xs text-slate-400">₹{lead.priceInr}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Badge value={lead.status} />
                </td>
                <td className="px-4 py-3">
                  {isSuperuser ? (
                    <select
                      value={lead.assignedToId ?? ""}
                      onChange={(event) =>
                        updateLead.mutate({
                          id: lead.id,
                          assignedToId: event.target.value || null,
                        })
                      }
                      className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {activeEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge value={lead.assignedTo?.name ?? "Unassigned"} />
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setEditing(lead);
                    }}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && leads.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  No leads assigned.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {createOpen ? (
        <Modal title="Create lead" onClose={() => setCreateOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                await createLead.mutateAsync({
                  name: String(form.get("name") ?? ""),
                  email: String(form.get("email") ?? ""),
                  phone: String(form.get("phone") ?? ""),
                  source: String(form.get("source") ?? ""),
                  service: String(form.get("service") ?? ""),
                  budget: String(form.get("budget") ?? ""),
                  notes: String(form.get("notes") ?? ""),
                  assignedToId: String(form.get("assignedToId") ?? "") || null,
                });
                setCreateOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to create lead");
              }
            }}
          >
            <label className="block text-sm text-slate-300">
              Customer name
              <input name="name" required className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Email
              <input name="email" type="email" className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Phone
              <input name="phone" className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Service
              <input name="service" className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Source
              <input name="source" placeholder="Website, Campaign, Referral" className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Budget
              <input name="budget" className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              Assign to
              <select name="assignedToId" className={inputClass}>
                <option value="">Unassigned</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Notes
              <textarea name="notes" rows={3} className={inputClass} />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={createLead.isPending}
              className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {createLead.isPending ? "Creating…" : "Create lead"}
            </button>
          </form>
        </Modal>
      ) : null}

      {editing ? (
        <Modal title={`Update ${editing.name}`} onClose={() => setEditing(null)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError(null);
              try {
                await updateLead.mutateAsync({
                  id: editing.id,
                  status: String(form.get("status")) as LeadStatus,
                  notes: String(form.get("notes") ?? ""),
                });
                setEditing(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to update lead");
              }
            }}
          >
            <p className="text-sm text-slate-400">
              {[editing.email, editing.phone, editing.company].filter(Boolean).join(" · ") || "No contact details"}
            </p>
            {editing.packageName ? (
              <p className="text-sm text-slate-300">
                {editing.packageName}
                {editing.category ? ` · ${editing.category}` : ""}
                {editing.priceInr != null ? ` · ₹${editing.priceInr}` : ""}
              </p>
            ) : null}
            {editing.projectDetails ? (
              <p className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
                {editing.projectDetails}
              </p>
            ) : null}
            <label className="block text-sm text-slate-300">
              Status
              <select name="status" defaultValue={editing.status} className={inputClass}>
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Internal notes
              <textarea
                name="notes"
                rows={4}
                defaultValue={editing.notes ?? ""}
                className={inputClass}
              />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={updateLead.isPending}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {updateLead.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
