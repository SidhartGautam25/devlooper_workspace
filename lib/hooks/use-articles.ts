"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiFetch,
  type Article,
  type ArticleAuthor,
  type ArticleStatus,
  type TechStack,
} from "@/lib/api/client";
import type { ArticleBlock } from "@/lib/articles/content";

export type ArticlePayload = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  heroImageUrl?: string | null;
  language?: string | null;
  content: { blocks: ArticleBlock[] };
  status: ArticleStatus;
  authorName: string;
  techStackIds: string[];
  relatedIds: string[];
};

export function useArticles(options?: { trash?: boolean }) {
  const isTrash = Boolean(options?.trash);
  return useQuery({
    queryKey: ["articles", { trash: isTrash }],
    queryFn: () =>
      apiFetch<Article[]>(
        isTrash ? "/api/articles?trash=true" : "/api/articles",
      ),
  });
}

export function useArticle(id: string | null) {
  return useQuery({
    queryKey: ["articles", id],
    queryFn: () => apiFetch<Article>(`/api/articles/${id}`),
    enabled: Boolean(id),
  });
}

export function useArticleAuthors() {
  return useQuery({
    queryKey: ["article-authors"],
    queryFn: () => apiFetch<ArticleAuthor[]>("/api/articles/authors"),
  });
}

export function useTechStacks() {
  return useQuery({
    queryKey: ["tech-stacks"],
    queryFn: () => apiFetch<TechStack[]>("/api/tech-stacks"),
  });
}

export function useCreateTechStack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<TechStack>("/api/tech-stacks", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tech-stacks"] });
    },
  });
}

export function useSaveArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string; payload: ArticlePayload }) =>
      apiFetch<Article>(
        data.id ? `/api/articles/${data.id}` : "/api/articles",
        {
          method: data.id ? "PATCH" : "POST",
          body: JSON.stringify(data.payload),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export function useSoftDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/articles/${id}?type=soft`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export function useHardDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/articles/${id}?type=hard`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export function useRestoreArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/articles/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export const useDeleteArticle = useSoftDeleteArticle;

export async function uploadArticleImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const clientFolder =
    process.env.NEXT_PUBLIC_FTP_REMOTE_PATH ||
    process.env.NEXT_PUBLIC_STORAGE_PATH;
  if (clientFolder) {
    form.append("folder", clientFolder);
  }
  const response = await fetch("/api/uploads", { method: "POST", body: form });
  const payload = (await response.json()) as {
    success: boolean;
    data?: { url: string };
    error?: string;
  };
  if (!payload.success || !payload.data?.url) {
    throw new Error(payload.error || "Image upload failed");
  }
  return payload.data.url;
}
