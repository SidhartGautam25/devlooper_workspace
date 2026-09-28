"use client";

import Link from "next/link";
import { Badge } from "@/components/admin/badge";
import { useArticles, useDeleteArticle } from "@/lib/hooks/use-articles";

export function ArticlesView() {
  const { data: articles = [], isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Articles</h2>
          <p className="mt-1 text-sm text-slate-400">
            Superuser writing studio. Images go to FTP; article body lives in the database.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          New article
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#1E293B]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Stacks</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  Loading articles…
                </td>
              </tr>
            ) : null}
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-slate-800/80">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{article.title}</p>
                  <p className="text-xs text-slate-500">{article.slug}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{article.language ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">
                  {article.techStacks.map((stack) => stack.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge value={article.status} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this article?")) {
                          deleteArticle.mutate(article.id);
                        }
                      }}
                      className="rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && articles.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  No articles yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
