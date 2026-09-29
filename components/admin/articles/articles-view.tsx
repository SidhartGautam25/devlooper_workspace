"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  FileText,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/admin/badge";
import { useAdminUser } from "@/components/admin/admin-user-context";
import {
  useArticles,
  useHardDeleteArticle,
  useRestoreArticle,
  useSoftDeleteArticle,
} from "@/lib/hooks/use-articles";

export function ArticlesView() {
  const user = useAdminUser();
  const isSuperuser = user.role === "SUPERUSER";
  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");

  const { data: activeArticles = [], isLoading: isLoadingActive } = useArticles(
    {
      trash: false,
    },
  );
  const { data: trashArticles = [], isLoading: isLoadingTrash } = useArticles({
    trash: true,
  });

  const softDeleteArticle = useSoftDeleteArticle();
  const hardDeleteArticle = useHardDeleteArticle();
  const restoreArticle = useRestoreArticle();

  const articles = activeTab === "active" ? activeArticles : trashArticles;
  const isLoading = activeTab === "active" ? isLoadingActive : isLoadingTrash;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Articles & Blog</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create, publish, and manage blog articles. Only superusers can
            manage deletion and trash.
          </p>
        </div>
        {isSuperuser && (
          <Link
            href="/admin/articles/new"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            New article
          </Link>
        )}
      </div>

      {/* Category Tabs: Active vs Trash */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "active"
              ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
              : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <FileText className="h-4 w-4 text-indigo-400" />
          <span>Active Articles</span>
          <span className="ml-1.5 rounded-full bg-slate-700/80 px-2 py-0.5 text-xs text-slate-300">
            {activeArticles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("trash")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "trash"
              ? "bg-rose-950/40 text-rose-300 shadow-sm ring-1 ring-rose-800/60"
              : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <Trash2 className="h-4 w-4 text-rose-400" />
          <span>Trash</span>
          <span
            className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
              trashArticles.length > 0
                ? "bg-rose-900/60 text-rose-200 font-semibold"
                : "bg-slate-700/80 text-slate-400"
            }`}
          >
            {trashArticles.length}
          </span>
        </button>
      </div>

      {/* Category Description Banner */}
      {activeTab === "trash" && (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-200">
          <div className="flex items-start gap-3">
            <Archive className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-100">
                Trash Category (Soft-Deleted)
              </p>
              <p className="mt-0.5 text-xs text-rose-300/90">
                Articles in this category are hidden from public blog readers
                and active lists. Superusers can restore articles back to
                active, or perform a permanent hard deletion (which wipes both
                database content and remote storage images forever).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#1E293B]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Stacks</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">
                {activeTab === "trash" ? "Deleted At" : "Updated"}
              </th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-400"
                  colSpan={6}
                >
                  Loading{" "}
                  {activeTab === "trash" ? "trash articles" : "articles"}…
                </td>
              </tr>
            ) : null}

            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-b border-slate-800/80 transition hover:bg-slate-800/30"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{article.title}</p>
                  <p className="text-xs text-slate-500">{article.slug}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {article.language ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {article.techStacks.map((stack) => stack.name).join(", ") ||
                    "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge value={article.status} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {activeTab === "trash" && article.deletedAt
                    ? new Date(article.deletedAt).toLocaleDateString()
                    : new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {activeTab === "active" ? (
                      <>
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                        {isSuperuser && (
                          <button
                            type="button"
                            title="Soft delete (move to trash category)"
                            disabled={softDeleteArticle.isPending}
                            onClick={() => {
                              if (
                                confirm(
                                  `Move "${article.title}" to Trash?\n\nThis is a soft deletion. The article will be hidden from public and draft views, but can be restored later.`,
                                )
                              ) {
                                softDeleteArticle.mutate(article.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Trash</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {isSuperuser ? (
                          <>
                            <button
                              type="button"
                              title="Restore article back to active list"
                              disabled={restoreArticle.isPending}
                              onClick={() => {
                                restoreArticle.mutate(article.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              title="Hard delete (permanently delete from database and storage)"
                              disabled={hardDeleteArticle.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `⚠️ PERMANENT HARD DELETION:\n\nAre you sure you want to permanently delete "${article.title}"?\n\nThis will permanently delete:\n1. All article data from the database\n2. Hero image and embedded content images from remote FTP storage\n\nThis action CANNOT be undone!`,
                                  )
                                ) {
                                  hardDeleteArticle.mutate(article.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-500/60 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Delete Permanently</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Superuser only
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!isLoading && articles.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-400"
                  colSpan={6}
                >
                  {activeTab === "trash" ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trash2 className="h-6 w-6 text-slate-600" />
                      <p>Trash is empty.</p>
                    </div>
                  ) : (
                    "No active articles found."
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
