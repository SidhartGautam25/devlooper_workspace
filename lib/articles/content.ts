export type HeadingLevel = 1 | 2 | 3 | 4;

export type ArticleBlock =
  | {
      id: string;
      type: "heading";
      level: HeadingLevel;
      text: string;
      tocLabel?: string;
    }
  | {
      id: string;
      type: "paragraph";
      html: string;
    }
  | {
      id: string;
      type: "code";
      language: string;
      code: string;
    }
  | {
      id: string;
      type: "image";
      url: string;
      alt: string;
      caption?: string;
    };

export type ArticleTocItem = {
  id: string;
  title: string;
  level: HeadingLevel;
};

export const CODE_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "java",
  "sql",
  "bash",
  "json",
  "html",
  "css",
  "prisma",
  "text",
] as const;

export const DEFAULT_NEW_ARTICLE_BLOCKS: ArticleBlock[] = [
  {
    id: "intro",
    type: "heading",
    level: 2,
    text: "Introduction",
    tocLabel: "",
  },
  { id: "body", type: "paragraph", html: "" },
];

export function createBlockId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "article";
}

export function sanitizeParagraphHtml(html: string) {
  if (!html) return "";
  let clean = html
    .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");

  // Normalize paragraph and div breaks into <br> tags so newlines and gaps are never lost
  clean = clean
    .replace(/<p><br\/?><\/p>/gi, "<br>")
    .replace(/<div><br\/?><\/div>/gi, "<br>")
    .replace(/<\/p>\s*<p>/gi, "<br><br>")
    .replace(/<\/div>\s*<div>/gi, "<br>")
    .replace(/<br\s*\/?>\s*<\/div>/gi, "<br>")
    .replace(/<div>/gi, "<br>")
    .replace(/<p>/gi, "<br>")
    .replace(/<\/p>|<\/div>/gi, "");

  // Allow only safe formatting tags: mark, u, strong, em, b, i, br, span
  clean = clean.replace(/<(?!\/?(mark|u|strong|em|b|i|br|span)\b)[^>]*>/gi, "");

  // Clean initial leading <br> if the content was wrapped in an outer div
  clean = clean.replace(/^<br\s*\/?>+/i, "");

  return clean;
}

export function isArticleBlock(value: unknown): value is ArticleBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  if (typeof block.id !== "string" || typeof block.type !== "string") {
    return false;
  }
  if (block.type === "heading") {
    return (
      (block.level === 1 ||
        block.level === 2 ||
        block.level === 3 ||
        block.level === 4) &&
      typeof block.text === "string"
    );
  }
  if (block.type === "paragraph") {
    return typeof block.html === "string";
  }
  if (block.type === "code") {
    return typeof block.language === "string" && typeof block.code === "string";
  }
  if (block.type === "image") {
    return typeof block.url === "string" && typeof block.alt === "string";
  }
  return false;
}

export function normalizeContent(content: unknown): ArticleBlock[] {
  const blocks = Array.isArray(content)
    ? content
    : content &&
        typeof content === "object" &&
        Array.isArray((content as { blocks?: unknown }).blocks)
      ? (content as { blocks: unknown[] }).blocks
      : [];

  return blocks.filter(isArticleBlock).map((block) => {
    if (block.type === "paragraph") {
      return { ...block, html: sanitizeParagraphHtml(block.html) };
    }
    if (block.type === "heading") {
      const tocLabel =
        typeof block.tocLabel === "string" ? block.tocLabel.trim() : "";
      return { ...block, text: block.text.trim(), tocLabel };
    }
    return block;
  });
}

export function headingTocTitle(
  block: Extract<ArticleBlock, { type: "heading" }>,
) {
  return block.tocLabel?.trim() || block.text.trim();
}

export function buildToc(blocks: ArticleBlock[]): ArticleTocItem[] {
  return blocks
    .filter(
      (block): block is Extract<ArticleBlock, { type: "heading" }> =>
        block.type === "heading" && headingTocTitle(block).length > 0,
    )
    .map((block) => ({
      id: block.id,
      title: headingTocTitle(block),
      level: block.level,
    }));
}

export function collectImageUrls(
  blocks: ArticleBlock[],
  heroImageUrl?: string | null,
) {
  const urls = blocks
    .filter(
      (block): block is Extract<ArticleBlock, { type: "image" }> =>
        block.type === "image",
    )
    .map((block) => block.url);
  if (heroImageUrl) urls.push(heroImageUrl);
  return [...new Set(urls.filter(Boolean))];
}
