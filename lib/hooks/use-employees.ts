"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, type Employee } from "@/lib/api/client";

export function useEmployees(enabled = true) {
  return useQuery({
    queryKey: ["employees"],
    queryFn: () => apiFetch<Employee[]>("/api/employees"),
    enabled,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      languageId?: string | null;
      regionId?: string | null;
    }) =>
      apiFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: (data: { id: string; password: string }) =>
      apiFetch(`/api/employees/${data.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: data.password }),
      }),
  });
}

export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) =>
      apiFetch(`/api/employees/${data.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: data.isActive }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
