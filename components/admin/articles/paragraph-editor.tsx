"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { Link as LinkIcon, Unlink } from "lucide-react";

const TEXT_SIZES = [
  { label: "15px", value: "15px" },
  { label: "17.5px", value: "17.5px" },
  { label: "18px", value: "18px" },
  { label: "18.5px", value: "18.5px" },
  { label: "19px", value: "19px" },
  { label: "20px", value: "20px" },
  { label: "22px", value: "22px" },
  { label: "24px", value: "24px" },
  { label: "25px", value: "25px" },
];

const FONT_WEIGHTS = [
  { label: "Normal (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semibold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Extra Bold (800)", value: "800" },
];

const TEXT_COLORS = [
  { label: "Default Off-White", value: "#d8dee9" },
  { label: "Pure White", value: "#ffffff" },
  { label: "Slate Grey", value: "#94a3b8" },
  { label: "Pink Accent", value: "#ffa7c4" },
  { label: "Amber Yellow", value: "#facc15" },
  { label: "Emerald Green", value: "#4ade80" },
  { label: "Sky Blue", value: "#38bdf8" },
  { label: "Coral Orange", value: "#fb923c" },
  { label: "Violet Purple", value: "#c084fc" },
];

const HIGHLIGHT_COLORS = [
  { label: "Grey", value: "#475569", textColor: "#f8fafc" },
  { label: "Yellow", value: "#facc15", textColor: "#0f172a" },
  { label: "Green", value: "#4ade80", textColor: "#0f172a" },
  { label: "Blue", value: "#38bdf8", textColor: "#0f172a" },
  { label: "Pink", value: "#f472b6", textColor: "#0f172a" },
  { label: "Orange", value: "#fb923c", textColor: "#0f172a" },
  { label: "Purple", value: "#c084fc", textColor: "#0f172a" },
];

export function ParagraphEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = html || "";
    }
    // Initialize once per block mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    onChange(ref.current?.innerHTML ?? "");
  }

  function command(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    emit();
  }

  function wrapSelection(tag: "span" | "mark" | "u", styles: Record<string, string>) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed)
      return;
    const range = selection.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;

    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    try {
      range.surroundContents(el);
    } catch {
      el.appendChild(range.extractContents());
      range.insertNode(el);
    }
    selection.removeAllRanges();
    emit();
  }

  function handleLink() {
    ref.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      alert("Please select the text you want to link first.");
      return;
    }
    const range = selection.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;

    // Check if inside existing anchor
    let existingAnchor: HTMLAnchorElement | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== ref.current) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName === "A"
      ) {
        existingAnchor = node as HTMLAnchorElement;
        break;
      }
      node = node.parentNode;
    }

    const defaultUrl = existingAnchor?.getAttribute("href") || "https://";
    const url = window.prompt("Enter link URL (e.g. https://example.com):", defaultUrl);
    if (url === null) return;

    const trimmed = url.trim();
    if (!trimmed || trimmed === "https://") {
      document.execCommand("unlink", false);
      emit();
      return;
    }

    if (existingAnchor) {
      existingAnchor.setAttribute("href", trimmed);
      existingAnchor.setAttribute("target", "_blank");
      existingAnchor.setAttribute("rel", "noopener noreferrer");
    } else {
      document.execCommand("createLink", false, trimmed);
      const anchors = ref.current?.querySelectorAll("a") || [];
      anchors.forEach((a) => {
        if (a.getAttribute("href") === trimmed) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      });
    }
    emit();
  }

  function handleUnlink() {
    ref.current?.focus();
    document.execCommand("unlink", false);
    emit();
  }

  function clearFormatting() {
    ref.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      document.execCommand("removeFormat", false);
      document.execCommand("unlink", false);
      emit();
      return;
    }
    const range = selection.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;

    // Strip native formatting (bold, italic, underline, links)
    document.execCommand("removeFormat", false);
    document.execCommand("unlink", false);

    // Re-insert plain text to remove custom mark and span tags
    const text = range.toString();
    if (text) {
      document.execCommand("insertText", false, text);
    }
    emit();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      ref.current?.focus();
      document.execCommand("insertLineBreak");
      emit();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;
    const safeHtml = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\r\n|\n|\r/g, "<br>");
    document.execCommand("insertHTML", false, safeHtml);
    emit();
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-850 shadow-md">
      {/* Primary Toolbar Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/80 bg-slate-800/90 px-3 py-2 text-xs">
        {/* Font Size Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Size
          </span>
          <select
            defaultValue="17.5px"
            onChange={(e) => {
              wrapSelection("span", { fontSize: e.target.value });
            }}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none hover:border-slate-600 focus:border-indigo-500"
          >
            {TEXT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Weight Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Weight
          </span>
          <select
            defaultValue="400"
            onChange={(e) => {
              wrapSelection("span", { fontWeight: e.target.value });
            }}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none hover:border-slate-600 focus:border-indigo-500"
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </select>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-700" />

        {/* Quick Style Buttons */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            label="B"
            title="Bold"
            className="font-bold hover:bg-slate-700"
            onMouseDown={(event) => {
              event.preventDefault();
              command("bold");
            }}
          />
          <ToolbarButton
            label="I"
            title="Italic"
            className="italic hover:bg-slate-700"
            onMouseDown={(event) => {
              event.preventDefault();
              command("italic");
            }}
          />
          <ToolbarButton
            label="U"
            title="Underline (with elegant reading gap)"
            className="underline underline-offset-[5px] decoration-1 hover:bg-slate-700"
            onMouseDown={(event) => {
              event.preventDefault();
              command("underline");
            }}
          />
        </div>

        <span className="mx-1 h-4 w-px bg-slate-700" />

        {/* Link / Href Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Add or Edit Link (href)"
            onMouseDown={(event) => {
              event.preventDefault();
              handleLink();
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-300 hover:bg-slate-700 hover:text-indigo-200"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Link</span>
          </button>
          <button
            type="button"
            title="Remove Link"
            onMouseDown={(event) => {
              event.preventDefault();
              handleUnlink();
            }}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-rose-300"
          >
            <Unlink className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-700" />

        <ToolbarButton
          label="Clear format"
          title="Clear all styling (bold, color, size, highlights, links) from selected text"
          className="text-amber-300 hover:bg-slate-700 hover:text-amber-200"
          onMouseDown={(event) => {
            event.preventDefault();
            clearFormatting();
          }}
        />
      </div>

      {/* Secondary Row: Text Colors & Highlight Colors */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 px-3 py-1.5 text-xs border-b border-slate-700/60">
        {/* Text Color Swatches */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Text Color
          </span>
          <div className="flex items-center gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={`Text Color: ${color.label}`}
                aria-label={`Text Color: ${color.label}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  wrapSelection("span", { color: color.value });
                }}
                className="h-4 w-4 rounded-full border border-slate-600 transition hover:scale-110"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        <span className="h-3.5 w-px bg-slate-700" />

        {/* Highlight Swatches */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Highlight
          </span>
          <div className="flex items-center gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={`Highlight: ${color.label}`}
                aria-label={`Highlight ${color.label}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  wrapSelection("mark", {
                    backgroundColor: color.value,
                    color: color.textColor,
                    borderRadius: "3px",
                    padding: "1px 3px",
                  });
                }}
                className="h-4 w-4 rounded-sm border border-slate-600 transition hover:scale-110"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editable Body with Editorial Typography & Underline Gap */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-28 px-4 py-3 font-serif text-[17.5px] leading-[1.8] text-[#d8dee9] tracking-[0.01em] outline-none whitespace-pre-wrap break-words [&_mark]:rounded-sm [&_mark]:px-0.5 [&_em]:italic [&_strong]:font-bold [&_u]:underline [&_u]:underline-offset-[5px] [&_u]:decoration-[1.5px] [&_a]:text-[#ffa7c4] [&_a]:underline [&_a]:underline-offset-[5px] [&_a]:decoration-[1.5px] [&_a]:decoration-[#ffa7c4]/70"
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />

      <div className="border-t border-slate-700/60 px-4 py-1.5 text-[11px] text-slate-400">
        Tip: Press{" "}
        <kbd className="rounded bg-slate-700 px-1 py-0.5 text-[10px] text-slate-300">
          Enter
        </kbd>{" "}
        for a new line, or multiple times for paragraph gaps.
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  className,
  onMouseDown,
}: {
  label: string;
  title?: string;
  className?: string;
  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      title={title || label}
      onMouseDown={onMouseDown}
      className={`rounded-md px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-700 ${className ?? ""}`}
    >
      {label}
    </button>
  );
}
