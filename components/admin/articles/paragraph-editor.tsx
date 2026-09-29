"use client";

import { useEffect, useRef, type MouseEvent } from "react";

const TEXT_SIZES = [
  { label: "S", value: "12px" },
  { label: "M", value: "16px" },
  { label: "L", value: "20px" },
  { label: "XL", value: "24px" },
  { label: "2XL", value: "32px" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#facc15" },
  { label: "Green", value: "#4ade80" },
  { label: "Blue", value: "#38bdf8" },
  { label: "Pink", value: "#f472b6" },
  { label: "Orange", value: "#fb923c" },
  { label: "Purple", value: "#c084fc" },
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

  function wrapSelection(tag: "span" | "mark", styles: Record<string, string>) {
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

  function clearFormatting() {
    ref.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      document.execCommand("removeFormat", false);
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
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-700 p-2">
        <span className="mr-1 text-[10px] uppercase tracking-wider text-slate-500">
          Size
        </span>
        {TEXT_SIZES.map((size) => (
          <ToolbarButton
            key={size.value}
            label={size.label}
            onMouseDown={(event) => {
              event.preventDefault();
              wrapSelection("span", { fontSize: size.value });
            }}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-slate-600" />
        <span className="mr-1 text-[10px] uppercase tracking-wider text-slate-500">
          Highlight
        </span>
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.label}
            aria-label={`Highlight ${color.label}`}
            onMouseDown={(event) => {
              event.preventDefault();
              wrapSelection("mark", {
                backgroundColor: color.value,
                color: "#0f172a",
                borderRadius: "2px",
                padding: "0 2px",
              });
            }}
            className="h-5 w-5 rounded-sm border border-slate-600"
            style={{ backgroundColor: color.value }}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-slate-600" />
        <ToolbarButton
          label="Underline"
          className="underline"
          onMouseDown={(event) => {
            event.preventDefault();
            command("underline");
          }}
        />
        <ToolbarButton
          label="Bold"
          className="font-bold"
          onMouseDown={(event) => {
            event.preventDefault();
            command("bold");
          }}
        />
        <ToolbarButton
          label="Italic"
          className="italic"
          onMouseDown={(event) => {
            event.preventDefault();
            command("italic");
          }}
        />
        <ToolbarButton
          label="Clear format"
          title="Clear all styling (bold, color, size, highlights) from selected text"
          className="text-amber-300 hover:text-amber-200"
          onMouseDown={(event) => {
            event.preventDefault();
            clearFormatting();
          }}
        />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-24 px-3 py-2 text-base text-slate-100 outline-none whitespace-pre-wrap break-words leading-relaxed [&_mark]:rounded-sm [&_mark]:px-0.5"
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <div className="border-t border-slate-700/60 px-3 py-1 text-[11px] text-slate-400">
        Tip: Press{" "}
        <kbd className="rounded bg-slate-700 px-1 py-0.5 text-[10px] text-slate-300">
          Enter
        </kbd>{" "}
        for a new line, or press it multiple times for custom spacing between
        lines.
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
      className={`rounded-md px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 ${className ?? ""}`}
    >
      {label}
    </button>
  );
}
