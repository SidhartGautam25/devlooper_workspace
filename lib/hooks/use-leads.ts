"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, type Lead, type LeadStatus } from "@/lib/api/client";

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: () => apiFetch<Lead[]>("/api/leads"),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      phone: string;
      source?: string;
      service?: string;
      budget?: string;
      notes?: string;
      assignedToId?: string | null;
    }) =>
      apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      assignedToId?: string | null;
      status?: LeadStatus;
      notes?: string | null;
    }) =>
      apiFetch(`/api/leads/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          assignedToId: data.assignedToId,
          status: data.status,
          notes: data.notes,
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
