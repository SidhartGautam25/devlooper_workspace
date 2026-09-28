"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { ArticlePreview } from "@/components/admin/articles/article-preview";
import { ParagraphEditor } from "@/components/admin/articles/paragraph-editor";
import {
  CODE_LANGUAGES,
  createBlockId,
  DEFAULT_NEW_ARTICLE_BLOCKS,
  type ArticleBlock,
  type HeadingLevel,
} from "@/lib/articles/content";
import {
  uploadArticleImage,
  useArticle,
  useArticles,
  useCreateTechStack,
  useSaveArticle,
  useTechStacks,
} from "@/lib/hooks/use-articles";
import type { Article, ArticleStatus } from "@/lib/api/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

export function ArticleEditor({ articleId }: { articleId?: string }) {
  const { data: existing, isLoading } = useArticle(articleId ?? null);

  if (articleId && isLoading) {
    return <p className="text-sm text-slate-400">Loading article…</p>;
  }

  return (
    <ArticleEditorForm
      key={articleId ?? "new"}
      articleId={articleId}
      existing={existing}
    />
  );
}

function ArticleEditorForm({
  articleId,
  existing,
}: {
  articleId?: string;
  existing?: Article;
}) {
  const router = useRouter();
  const user = useAdminUser();
  const { data: articles = [] } = useArticles();
  const { data: techStacks = [] } = useTechStacks();
  const saveArticle = useSaveArticle();
  const createStack = useCreateTechStack();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [excerpt, setExcerpt] = useState(existing?.excerpt ?? "");
  const [language, setLanguage] = useState(existing?.language ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.heroImageUrl ?? "");
  const [status, setStatus] = useState<ArticleStatus>(existing?.status ?? "DRAFT");
  const [authorName, setAuthorName] = useState(
    existing?.authorName ?? existing?.authors?.[0]?.name ?? user.name ?? "",
  );
  const [techStackIds, setTechStackIds] = useState<string[]>(existing?.techStackIds ?? []);
  const [relatedIds, setRelatedIds] = useState<string[]>(existing?.relatedIds ?? []);
  const [blocks, setBlocks] = useState<ArticleBlock[]>(
    existing?.content.blocks.length
      ? existing.content.blocks
      : DEFAULT_NEW_ARTICLE_BLOCKS.map((block) => ({ ...block })),
  );
  const [error, setError] = useState<string | null>(null);
  const [newStack, setNewStack] = useState("");

  const relatedOptions = useMemo(
    () => articles.filter((article) => article.id !== articleId),
    [articleId, articles],
  );

  function updateBlock(id: string, patch: Partial<ArticleBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? ({ ...block, ...patch } as ArticleBlock) : block)),
    );
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function onSave() {
    setError(null);
    try {
      const saved = await saveArticle.mutateAsync({
        id: articleId,
        payload: {
          title,
          slug,
          excerpt,
          heroImageUrl,
          language,
          content: { blocks },
          status,
          authorName,
          techStackIds,
          relatedIds,
        },
      });
      if (!articleId) {
        router.replace(`/admin/articles/${saved.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save article");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {articleId ? "Edit article" : "New article"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Write in blocks. Images upload to FTP; everything else is stored in the database.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ArticleStatus)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saveArticle.isPending}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {saveArticle.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm text-slate-300">
            Slug
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="auto-from-title"
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-300">
            Excerpt
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-300">
            Language
            <input
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="TypeScript, Python, Go…"
              className={inputClass}
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">Hero image</p>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setHeroImageUrl(await uploadArticleImage(file));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Hero upload failed");
                }
              }}
              className="text-sm text-slate-300"
            />
            {heroImageUrl ? (
              <p className="truncate text-xs text-slate-500">{heroImageUrl}</p>
            ) : null}
          </div>

          <label className="block text-sm text-slate-300">
            Author name
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Displayed byline"
              className={inputClass}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm text-slate-300">Tech stacks</legend>
            {techStacks.map((stack) => (
              <label key={stack.id} className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={techStackIds.includes(stack.id)}
                  onChange={(event) =>
                    setTechStackIds((current) =>
                      event.target.checked
                        ? [...current, stack.id]
                        : current.filter((id) => id !== stack.id),
                    )
                  }
                />
                {stack.name}
              </label>
            ))}
            <div className="flex gap-2">
              <input
                value={newStack}
                onChange={(event) => setNewStack(event.target.value)}
                placeholder="Add stack"
                className={inputClass}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newStack.trim()) return;
                  const created = await createStack.mutateAsync(newStack.trim());
                  setTechStackIds((current) => [...current, created.id]);
                  setNewStack("");
                }}
                className="rounded-lg border border-slate-700 px-3 text-sm"
              >
                Add
              </button>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm text-slate-300">Related articles</legend>
            {relatedOptions.length === 0 ? (
              <p className="text-xs text-slate-500">Save more articles to link them here.</p>
            ) : (
              relatedOptions.map((article) => (
                <label key={article.id} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={relatedIds.includes(article.id)}
                    onChange={(event) =>
                      setRelatedIds((current) =>
                        event.target.checked
                          ? [...current, article.id]
                          : current.filter((id) => id !== article.id),
                      )
                    }
                  />
                  {article.title}
                </label>
              ))
            )}
          </fieldset>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <AddBlockButton
              label="Heading"
              onClick={() =>
                setBlocks((current) => [
                  ...current,
                  { id: createBlockId(), type: "heading", level: 2, text: "", tocLabel: "" },
                ])
              }
            />
            <AddBlockButton
              label="Text"
              onClick={() =>
                setBlocks((current) => [
                  ...current,
                  { id: createBlockId(), type: "paragraph", html: "" },
                ])
              }
            />
            <AddBlockButton
              label="Code"
              onClick={() =>
                setBlocks((current) => [
                  ...current,
                  { id: createBlockId(), type: "code", language: "typescript", code: "" },
                ])
              }
            />
            <AddBlockButton
              label="Image"
              onClick={() =>
                setBlocks((current) => [
                  ...current,
                  { id: createBlockId(), type: "image", url: "", alt: "" },
                ])
              }
            />
          </div>

          {blocks.map((block, index) => (
            <div key={block.id} className="rounded-xl border border-slate-800 bg-[#1E293B] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">{block.type}</p>
                <div className="flex gap-1">
                  <button type="button" className="text-xs text-slate-400" onClick={() => moveBlock(index, -1)}>
                    Up
                  </button>
                  <button type="button" className="text-xs text-slate-400" onClick={() => moveBlock(index, 1)}>
                    Down
                  </button>
                  <button
                    type="button"
                    className="text-xs text-rose-300"
                    onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {block.type === "heading" ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={block.level}
                      onChange={(event) =>
                        updateBlock(block.id, { level: Number(event.target.value) as HeadingLevel })
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm"
                    >
                      <option value={1}>H1</option>
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                      <option value={4}>H4</option>
                    </select>
                    <input
                      value={block.text}
                      onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                      placeholder="Heading in the article"
                      className={inputClass + " mt-0"}
                    />
                  </div>
                  <input
                    value={block.tocLabel ?? ""}
                    onChange={(event) => updateBlock(block.id, { tocLabel: event.target.value })}
                    placeholder="Sidebar label (optional — defaults to heading)"
                    className={inputClass}
                  />
                </div>
              ) : null}

              {block.type === "paragraph" ? (
                <ParagraphEditor
                  html={block.html}
                  onChange={(html) => updateBlock(block.id, { html })}
                />
              ) : null}

              {block.type === "code" ? (
                <div className="space-y-2">
                  <select
                    value={block.language}
                    onChange={(event) => updateBlock(block.id, { language: event.target.value })}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm"
                  >
                    {CODE_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={block.code}
                    onChange={(event) => updateBlock(block.id, { code: event.target.value })}
                    rows={8}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-200"
                    placeholder="// code"
                  />
                </div>
              ) : null}

              {block.type === "image" ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadArticleImage(file);
                        updateBlock(block.id, { url });
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : "Image upload failed",
                        );
                      }
                    }}
                    className="text-sm text-slate-300"
                  />
                  <input
                    value={block.alt}
                    onChange={(event) => updateBlock(block.id, { alt: event.target.value })}
                    placeholder="Alt text"
                    className={inputClass}
                  />
                  <input
                    value={block.caption ?? ""}
                    onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                    placeholder="Caption"
                    className={inputClass}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-white">Live preview</h3>
        <ArticlePreview
          title={title}
          heroImageUrl={heroImageUrl}
          authors={authorName.trim() ? [authorName.trim()] : []}
          language={language}
          techStacks={techStacks.filter((stack) => techStackIds.includes(stack.id)).map((stack) => stack.name)}
          publishedAt={existing?.publishedAt}
          updatedAt={existing?.updatedAt}
          blocks={blocks}
          related={relatedOptions
            .filter((article) => relatedIds.includes(article.id))
            .map((article) => ({ id: article.id, title: article.title }))}
        />
      </div>
    </div>
  );
}

function AddBlockButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
    >
      Add {label}
    </button>
  );
}
