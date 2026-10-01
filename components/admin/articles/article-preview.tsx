"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildToc,
  type ArticleBlock,
  type ArticleTocItem,
} from "@/lib/articles/content";
import { publicAssetUrl } from "@/lib/articles/asset-url";
import { CodeBlock } from "@/components/admin/articles/code-block";
import { cn } from "@/lib/utils";

export function ArticlePreview({
  title,
  heroImageUrl,
  authors,
  language,
  techStacks,
  publishedAt,
  updatedAt,
  blocks,
  related,
}: {
  title: string;
  heroImageUrl?: string | null;
  authors: string[];
  language?: string | null;
  techStacks: string[];
  publishedAt?: string | null;
  updatedAt?: string | null;
  blocks: ArticleBlock[];
  related: Array<{ id: string; title: string }>;
}) {
  const toc: ArticleTocItem[] = useMemo(() => buildToc(blocks), [blocks]);
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    const headings = toc
      .map((item) => document.getElementById(`preview-${item.id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id.replace(/^preview-/, ""));
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.2, 0.6] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          On this page
        </p>
        <nav className="space-y-1">
          {toc.length === 0 ? (
            <p className="text-xs text-slate-500">
              Add headings to build the topic list.
            </p>
          ) : (
            toc.map((item) => (
              <a
                key={item.id}
                href={`#preview-${item.id}`}
                className={cn(
                  "block rounded-md px-2 py-1 text-xs transition",
                  item.level > 2 ? "pl-4" : "",
                  activeId === item.id
                    ? "bg-indigo-500/20 text-white"
                    : "text-slate-400 hover:text-white",
                )}
              >
                {item.title || "Untitled"}
              </a>
            ))
          )}
        </nav>
      </aside>

      <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220]">
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={publicAssetUrl(heroImageUrl)}
            alt={title}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-32 items-center justify-center bg-slate-800 text-sm text-slate-500">
            Hero image
          </div>
        )}
        <div className="space-y-4 p-6">
          <h1 className="text-3xl font-semibold text-white">
            {title || "Untitled article"}
          </h1>
          <p className="text-xs text-slate-400">
            {authors.join(", ") || "Author"}
            {language ? ` · ${language}` : ""}
            {publishedAt
              ? ` · Written ${new Date(publishedAt).toLocaleDateString()}`
              : ""}
            {updatedAt
              ? ` · Updated ${new Date(updatedAt).toLocaleDateString()}`
              : ""}
          </p>
          {techStacks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {techStacks.map((stack) => (
                <span
                  key={stack}
                  className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-200"
                >
                  {stack}
                </span>
              ))}
            </div>
          ) : null}

          {blocks.map((block) => {
            if (block.type === "heading") {
              const className = `scroll-mt-6 font-semibold text-white ${
                {
                  1: "text-3xl",
                  2: "text-2xl",
                  3: "text-xl",
                  4: "text-lg",
                }[block.level]
              }`;
              if (block.level === 1) {
                return (
                  <h1
                    key={block.id}
                    id={`preview-${block.id}`}
                    className={className}
                  >
                    {block.text}
                  </h1>
                );
              }
              if (block.level === 2) {
                return (
                  <h2
                    key={block.id}
                    id={`preview-${block.id}`}
                    className={className}
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.level === 3) {
                return (
                  <h3
                    key={block.id}
                    id={`preview-${block.id}`}
                    className={className}
                  >
                    {block.text}
                  </h3>
                );
              }
              return (
                <h4
                  key={block.id}
                  id={`preview-${block.id}`}
                  className={className}
                >
                  {block.text}
                </h4>
              );
            }
            if (block.type === "paragraph") {
              return (
                <div
                  key={block.id}
                  className="font-serif text-[17.5px] leading-[1.8] text-[#d8dee9] whitespace-pre-wrap break-words tracking-[0.01em] [&_em]:italic [&_strong]:font-bold [&_u]:underline [&_u]:underline-offset-[5px] [&_u]:decoration-[1.5px] [&_a]:text-[#ffa7c4] [&_a]:underline [&_a]:underline-offset-[5px] [&_a]:decoration-[1.5px] [&_a]:decoration-[#ffa7c4]/70 hover:[&_a]:decoration-[#ffa7c4] hover:[&_a]:text-[#ff80a5] [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:rounded [&_code]:bg-[#1e232a] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#ffa7c4]"
                  dangerouslySetInnerHTML={{ __html: block.html || "" }}
                />
              );
            }
            if (block.type === "code") {
              return (
                <CodeBlock
                  key={block.id}
                  code={block.code}
                  language={block.language}
                />
              );
            }
            const size = block.size || "default";
            const imgSizeClasses =
              size === "small"
                ? "w-auto max-w-sm max-h-56 object-contain"
                : size === "medium"
                  ? "w-auto max-w-xl max-h-96 object-contain"
                  : size === "original"
                    ? "w-auto max-w-full max-h-[700px] object-contain"
                    : "w-full max-w-full object-cover"; // default

            return (
              <figure
                key={block.id}
                className="my-6 flex flex-col items-center justify-center space-y-2 text-center"
              >
                {block.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicAssetUrl(block.url)}
                    alt={block.alt}
                    className={`mx-auto rounded-xl shadow-md ${imgSizeClasses}`}
                  />
                ) : null}
                {block.caption ? (
                  <figcaption className="text-center text-xs text-slate-400">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}

          {related.length > 0 ? (
            <div className="border-t border-slate-800 pt-4">
              <p className="mb-2 text-sm font-semibold text-white">
                Related articles
              </p>
              <ul className="space-y-1 text-sm text-indigo-300">
                {related.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}
