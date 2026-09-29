"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";

// Load syntax highlighters for supported languages
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code: string, language: string): string {
  const langKey = language?.toLowerCase().trim() || "text";

  // Map aliases
  const grammarMap: Record<string, string> = {
    js: "javascript",
    javascript: "javascript",
    ts: "typescript",
    typescript: "typescript",
    py: "python",
    python: "python",
    go: "go",
    golang: "go",
    rust: "rust",
    rs: "rust",
    java: "java",
    sql: "sql",
    bash: "bash",
    sh: "bash",
    shell: "bash",
    json: "json",
    html: "markup",
    xml: "markup",
    css: "css",
    prisma: "typescript", // prisma schema syntax maps well to typescript keywords
  };

  const targetLang = grammarMap[langKey];
  const grammar = targetLang ? Prism.languages[targetLang] : null;

  if (grammar) {
    try {
      return Prism.highlight(code, grammar, targetLang);
    } catch {
      return escapeHtml(code);
    }
  }

  return escapeHtml(code);
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  const highlightedHtml = useMemo(
    () => highlight(code, language),
    [code, language],
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  const displayLanguage = (language || "code").toUpperCase();

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] shadow-2xl">
      {/* IDE Top Window Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#161F30] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* macOS / IDE 3 Window Dots */}
          <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
          <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
          <span className="h-3 w-3 rounded-full bg-[#10B981]" />
          <span className="ml-3 font-mono text-[11px] font-semibold tracking-wider text-slate-400">
            {displayLanguage}
          </span>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with IDE Syntax Highlighting */}
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-slate-200 [tab-size:2]">
        <code
          className="block font-mono leading-relaxed [&_.token.keyword]:font-medium [&_.token.keyword]:text-[#C678DD] [&_.token.string]:text-[#98C379] [&_.token.number]:text-[#D19A66] [&_.token.boolean]:text-[#D19A66] [&_.token.function]:text-[#61AFEF] [&_.token.function-variable]:text-[#61AFEF] [&_.token.property]:text-[#E06C75] [&_.token.literal-property]:text-[#E5C07B] [&_.token.class-name]:text-[#E5C07B] [&_.token.comment]:italic [&_.token.comment]:text-[#6B7280] [&_.token.operator]:text-[#56B6C2] [&_.token.punctuation]:text-[#94A3B8] [&_.token.variable]:text-[#E06C75] [&_.token.attr-name]:text-[#D19A66] [&_.token.attr-value]:text-[#98C379] [&_.token.tag]:text-[#E06C75]"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </div>
  );
}
