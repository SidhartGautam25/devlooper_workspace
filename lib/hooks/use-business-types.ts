"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, type BusinessType } from "@/lib/api/client";

export function useBusinessTypes() {
  return useQuery({
    queryKey: ["business-types"],
    queryFn: () => apiFetch<BusinessType[]>("/api/business-types"),
  });
}

export function useCreateBusinessType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiFetch<BusinessType>("/api/business-types", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-types"] });
    },
  });
}

export function useDeleteBusinessType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string; deleted: boolean }>(`/api/business-types/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-types"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
