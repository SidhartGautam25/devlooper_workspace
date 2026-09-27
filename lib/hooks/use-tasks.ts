"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiFetch,
  type Task,
  type TaskPriority,
  type TaskResult,
  type TaskStatus,
} from "@/lib/api/client";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiFetch<Task[]>("/api/tasks"),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string | null;
      assignedToId?: string | null;
      priority?: TaskPriority;
      dueDate?: string | null;
      businessName?: string | null;
      businessTypeId?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      taskGroupId?: string | null;
      contactDetail?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
    }) =>
      apiFetch<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string | null;
      assignedToId?: string | null;
      priority?: TaskPriority;
      dueDate?: string | null;
      status?: TaskStatus;
      businessName?: string | null;
      businessTypeId?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      taskGroupId?: string | null;
      contactDetail?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      callDuration?: string | null;
      callDetail?: string | null;
      result?: TaskResult | null;
    }) =>
      apiFetch<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status: TaskStatus }) =>
      apiFetch<Task>(`/api/tasks/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string; deleted: boolean }>(`/api/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
