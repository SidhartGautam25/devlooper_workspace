"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, type DashboardStats } from "@/lib/api/client";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<DashboardStats>("/api/stats"),
  });
}
