"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useAdminUser } from "@/components/admin/admin-user-context";
import { ArticlePreview } from "@/components/admin/articles/article-preview";
import { ParagraphEditor } from "@/components/admin/articles/paragraph-editor";
import {
  CODE_LANGUAGES,
  createBlockId,
  DEFAULT_NEW_ARTICLE_BLOCKS,
  type ArticleBlock,
  type HeadingLevel,
  type ImageSize,
} from "@/lib/articles/content";
import { publicAssetUrl } from "@/lib/articles/asset-url";
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
  const [heroImageUrl, setHeroImageUrl] = useState(
    existing?.heroImageUrl ?? "",
  );
  const [status, setStatus] = useState<ArticleStatus>(
    existing?.status ?? "DRAFT",
  );
  const [authorName, setAuthorName] = useState(
    existing?.authorName ?? existing?.authors?.[0]?.name ?? user.name ?? "",
  );
  const [techStackIds, setTechStackIds] = useState<string[]>(
    existing?.techStackIds ?? [],
  );
  const [relatedIds, setRelatedIds] = useState<string[]>(
    existing?.relatedIds ?? [],
  );
  const [blocks, setBlocks] = useState<ArticleBlock[]>(
    existing?.content.blocks.length
      ? existing.content.blocks
      : DEFAULT_NEW_ARTICLE_BLOCKS.map((block) => ({ ...block })),
  );
  const [error, setError] = useState<string | null>(null);
  const [newStack, setNewStack] = useState("");
  const [saveModal, setSaveModal] = useState<{
    isOpen: boolean;
    status: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const relatedOptions = useMemo(
    () => articles.filter((article) => article.id !== articleId),
    [articleId, articles],
  );

  function updateBlock(id: string, patch: Partial<ArticleBlock>) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? ({ ...block, ...patch } as ArticleBlock) : block,
      ),
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

  function addHeading() {
    setBlocks((current) => [
      ...current,
      {
        id: createBlockId(),
        type: "heading",
        level: 2,
        text: "",
        tocLabel: "",
      },
    ]);
  }

  function addText() {
    setBlocks((current) => [
      ...current,
      { id: createBlockId(), type: "paragraph", html: "" },
    ]);
  }

  function addCode() {
    setBlocks((current) => [
      ...current,
      {
        id: createBlockId(),
        type: "code",
        language: "typescript",
        code: "",
      },
    ]);
  }

  function addImage() {
    setBlocks((current) => [
      ...current,
      {
        id: createBlockId(),
        type: "image",
        url: "",
        alt: "",
        caption: "",
        size: "default",
      },
    ]);
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

      setSaveModal({
        isOpen: true,
        status: "success",
        title: "Article Saved Successfully!",
        message: articleId
          ? "All article changes and content blocks have been saved to the database."
          : "Your new article has been created and saved successfully.",
      });

      if (!articleId) {
        setTimeout(() => {
          router.replace(`/admin/articles/${saved.id}`);
        }, 1200);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unable to save article";
      setError(errorMsg);
      setSaveModal({
        isOpen: true,
        status: "error",
        title: "Failed to Save Article",
        message: errorMsg,
      });
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
            Write in blocks. Images upload to FTP; everything else is stored in
            the database.
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
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
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
                  setError(
                    err instanceof Error ? err.message : "Hero upload failed",
                  );
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
              <label
                key={stack.id}
                className="flex items-center gap-2 text-sm text-slate-300"
              >
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
                  const created = await createStack.mutateAsync(
                    newStack.trim(),
                  );
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
              <p className="text-xs text-slate-500">
                Save more articles to link them here.
              </p>
            ) : (
              relatedOptions.map((article) => (
                <label
                  key={article.id}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
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

        <div className="space-y-4">
          {/* Sticky Toolbar for effortless access without scrolling up and down */}
          <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/80 bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Add Block:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <AddBlockButton label="Heading" onClick={addHeading} />
              <AddBlockButton label="Text" onClick={addText} />
              <AddBlockButton label="Code" onClick={addCode} />
              <AddBlockButton label="Image" onClick={addImage} />
            </div>
          </div>

          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="rounded-xl border border-slate-800 bg-[#1E293B] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {block.type}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-xs text-slate-400"
                    onClick={() => moveBlock(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-400"
                    onClick={() => moveBlock(index, 1)}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="text-xs text-rose-300"
                    onClick={() =>
                      setBlocks((current) =>
                        current.filter((item) => item.id !== block.id),
                      )
                    }
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
                        updateBlock(block.id, {
                          level: Number(event.target.value) as HeadingLevel,
                        })
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
                      onChange={(event) =>
                        updateBlock(block.id, { text: event.target.value })
                      }
                      placeholder="Heading in the article"
                      className={inputClass + " mt-0"}
                    />
                  </div>
                  <input
                    value={block.tocLabel ?? ""}
                    onChange={(event) =>
                      updateBlock(block.id, { tocLabel: event.target.value })
                    }
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
                    onChange={(event) =>
                      updateBlock(block.id, { language: event.target.value })
                    }
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
                    onChange={(event) =>
                      updateBlock(block.id, { code: event.target.value })
                    }
                    rows={8}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-200"
                    placeholder="// code"
                  />
                </div>
              ) : null}

              {block.type === "image" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Upload Image
                    </label>
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
                            err instanceof Error
                              ? err.message
                              : "Image upload failed",
                          );
                        }
                      }}
                      className="text-sm text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Display Size (Always Centered)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(
                        [
                          { value: "default", label: "Default" },
                          { value: "medium", label: "Medium" },
                          { value: "small", label: "Small" },
                          { value: "original", label: "Original size" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            updateBlock(block.id, {
                              size: opt.value as ImageSize,
                            })
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            (block.size || "default") === opt.value
                              ? "border-indigo-500 bg-indigo-600/20 text-indigo-200"
                              : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {block.url ? (
                    <div className="my-2 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={publicAssetUrl(block.url)}
                        alt={block.alt || "Uploaded image"}
                        className={`mx-auto rounded-lg object-contain shadow ${
                          block.size === "small"
                            ? "max-h-36 max-w-xs"
                            : block.size === "medium"
                              ? "max-h-56 max-w-sm"
                              : block.size === "original"
                                ? "max-h-72 max-w-full"
                                : "max-h-64 w-full object-cover"
                        }`}
                      />
                      <span className="mt-1 text-[11px] text-slate-400">
                        Selected size:{" "}
                        <strong className="capitalize">
                          {block.size || "default"}
                        </strong>
                      </span>
                    </div>
                  ) : null}

                  <input
                    value={block.alt}
                    onChange={(event) =>
                      updateBlock(block.id, { alt: event.target.value })
                    }
                    placeholder="Alt text"
                    className={inputClass}
                  />
                  <input
                    value={block.caption ?? ""}
                    onChange={(event) =>
                      updateBlock(block.id, { caption: event.target.value })
                    }
                    placeholder="Caption (optional)"
                    className={inputClass}
                  />
                </div>
              ) : null}
            </div>
          ))}

          {/* Bottom Bar: directly at the end of article blocks */}
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-4 text-center">
            <p className="text-xs font-medium text-slate-400">
              Add next block to the end of your article:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <AddBlockButton label="Heading" onClick={addHeading} />
              <AddBlockButton label="Text" onClick={addText} />
              <AddBlockButton label="Code" onClick={addCode} />
              <AddBlockButton label="Image" onClick={addImage} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-white">Live preview</h3>
        <ArticlePreview
          title={title}
          heroImageUrl={heroImageUrl}
          authors={authorName.trim() ? [authorName.trim()] : []}
          language={language}
          techStacks={techStacks
            .filter((stack) => techStackIds.includes(stack.id))
            .map((stack) => stack.name)}
          publishedAt={existing?.publishedAt}
          updatedAt={existing?.updatedAt}
          blocks={blocks}
          related={relatedOptions
            .filter((article) => relatedIds.includes(article.id))
            .map((article) => ({ id: article.id, title: article.title }))}
        />
      </div>

      {/* Save Status Feedback Popup Modal */}
      {saveModal?.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#0F172A] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSaveModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full border ${
                  saveModal.status === "success"
                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/20 text-rose-400"
                }`}
              >
                {saveModal.status === "success" ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <AlertCircle className="h-8 w-8" />
                )}
              </div>

              <h3 className="text-xl font-semibold text-white">
                {saveModal.title}
              </h3>

              <p className="mt-2 text-sm text-slate-300">{saveModal.message}</p>

              {saveModal.status === "success" ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                  <span>Status:</span>
                  <span
                    className={`font-semibold ${
                      status === "PUBLISHED"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              ) : null}

              <div className="mt-6 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setSaveModal(null)}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition ${
                    saveModal.status === "success"
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-rose-600 text-white hover:bg-rose-500"
                  }`}
                >
                  {saveModal.status === "success" ? "Got it" : "Close & Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddBlockButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
    >
      <span className="font-bold text-indigo-400">+</span>
      Add {label}
    </button>
  );
}
