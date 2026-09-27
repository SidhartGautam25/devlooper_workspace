"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, type TaskGroup, type TaskPriority } from "@/lib/api/client";

export function useTaskGroups() {
  return useQuery({
    queryKey: ["task-groups"],
    queryFn: () => apiFetch<TaskGroup[]>("/api/task-groups"),
  });
}

export function useCreateTaskGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string | null;
      priority?: TaskPriority | null;
      businessName?: string | null;
      businessTypeId?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      assignedToId?: string | null;
    }) =>
      apiFetch<TaskGroup>("/api/task-groups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-groups"] });
    },
  });
}

export function useUpdateTaskGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string | null;
      priority?: TaskPriority | null;
      businessName?: string | null;
      businessTypeId?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      assignedToId?: string | null;
    }) =>
      apiFetch<TaskGroup>(`/api/task-groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-groups"] });
    },
  });
}

export function useDeleteTaskGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string; deleted: boolean }>(`/api/task-groups/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-groups"] });
    },
  });
}
