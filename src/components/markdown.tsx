"use client";

/**
 * Tiny markdown renderer — headings, bold, italic, code, links, lists, hr.
 * No deps. Safe for trusted Claude output.
 */
import React from "react";

function renderInline(text: string, key = 0): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const parts = text.split(/(`[^`]+`)/g);
  parts.forEach((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code key={`c-${key}-${i}`} className="rounded bg-muted px-1 py-0.5 text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
      return;
    }
    let html = part
      .replace(/\*\*([^*]+)\*\*/g, "§B§$1§/B§")
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1§I§$2§/I§")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "§A§$2§|§$1§/A§");
    const tokens = html.split(/(§[A-Z]§|§\/[A-Z]§|§\|§)/g);
    let mode: "B" | "I" | "A" | null = null;
    let buf = "";
    let linkHref = "";
    tokens.forEach((tok, j) => {
      if (tok === "§B§") { mode = "B"; buf = ""; return; }
      if (tok === "§/B§") { nodes.push(<strong key={`b-${key}-${i}-${j}`}>{buf}</strong>); mode = null; return; }
      if (tok === "§I§") { mode = "I"; buf = ""; return; }
      if (tok === "§/I§") { nodes.push(<em key={`i-${key}-${i}-${j}`}>{buf}</em>); mode = null; return; }
      if (tok === "§A§") { mode = "A"; buf = ""; linkHref = ""; return; }
      if (tok === "§|§") { linkHref = buf; buf = ""; return; }
      if (tok === "§/A§") {
        nodes.push(
          <a key={`a-${key}-${i}-${j}`} href={linkHref} target="_blank" rel="noreferrer" className="underline">
            {buf}
          </a>
        );
        mode = null;
        return;
      }
      if (mode) { buf += tok; return; }
      if (tok) nodes.push(tok);
    });
  });
  return <>{nodes}</>;
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  let ul: string[] | null = null;
  let ol: string[] | null = null;

  const flushUl = (k: number) => {
    if (!ul) return;
    out.push(
      <ul key={`ul-${k}`} className="my-1.5 list-disc pl-5 space-y-0.5 text-sm">
        {ul.map((li, i) => (
          <li key={i}>{renderInline(li, i)}</li>
        ))}
      </ul>
    );
    ul = null;
  };
  const flushOl = (k: number) => {
    if (!ol) return;
    out.push(
      <ol key={`ol-${k}`} className="my-1.5 list-decimal pl-5 space-y-0.5 text-sm">
        {ol.map((li, i) => (
          <li key={i}>{renderInline(li, i)}</li>
        ))}
      </ol>
    );
    ol = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushUl(idx);
      flushOl(idx);
      return;
    }
    if (/^---+$/.test(line)) {
      flushUl(idx);
      flushOl(idx);
      out.push(<hr key={`hr-${idx}`} className="my-3 border-border" />);
      return;
    }
    let m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      flushUl(idx);
      flushOl(idx);
      const level = m[1].length;
      const text = m[2];
      const cls =
        level === 1 ? "mt-4 mb-2 text-lg font-bold"
        : level === 2 ? "mt-3 mb-1.5 text-base font-semibold"
        : level === 3 ? "mt-2 mb-1 text-sm font-semibold"
        : "mt-2 mb-1 text-xs font-semibold uppercase tracking-wider";
      const Tag = `h${Math.min(level, 4)}` as "h1" | "h2" | "h3" | "h4";
      out.push(<Tag key={`h-${idx}`} className={cls}>{renderInline(text, idx)}</Tag>);
      return;
    }
    m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m) {
      flushOl(idx);
      ul ??= [];
      ul.push(m[1]);
      return;
    }
    m = line.match(/^\s*\d+\.\s+(.*)$/);
    if (m) {
      flushUl(idx);
      ol ??= [];
      ol.push(m[1]);
      return;
    }
    flushUl(idx);
    flushOl(idx);
    out.push(<p key={`p-${idx}`} className="my-1.5 text-sm leading-relaxed">{renderInline(line, idx)}</p>);
  });
  flushUl(9999);
  flushOl(9999);

  return <div className={className}>{out}</div>;
}
