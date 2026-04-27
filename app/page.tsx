"use client";

import { FormEvent, Fragment, ReactNode, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ListItem = {
  content: string;
  ordered: boolean;
};

const tableDividerPattern = /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;
const orderedListPattern = /^\s*\d+\.\s+/;
const unorderedListPattern = /^\s*[-*+]\s+/;
const headingPattern = /^(#{1,6})\s+(.*)$/;

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.9em] text-amber-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-sky-300 underline decoration-sky-500/60 underline-offset-2 transition hover:text-sky-200"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

function renderParagraph(text: string, key: string) {
  return (
    <p key={key} className="leading-7 text-slate-100">
      {renderInline(text)}
    </p>
  );
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <div key={`code-${blocks.length}`} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          {language ? (
            <div className="border-b border-slate-800 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              {language}
            </div>
          ) : null}
          <pre className="overflow-x-auto px-4 py-3 text-xs leading-6 text-slate-200">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>,
      );
      continue;
    }

    const headingMatch = line.match(headingPattern);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      const className = level === 1
        ? "text-xl font-semibold text-white"
        : level === 2
          ? "text-lg font-semibold text-white"
          : "text-base font-semibold text-slate-100";

      blocks.push(
        <div key={`heading-${blocks.length}`} className={className}>
          {renderInline(heading)}
        </div>,
      );
      index += 1;
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed.replace(/\s+/g, ""))) {
      blocks.push(<hr key={`hr-${blocks.length}`} className="border-slate-800" />);
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && tableDividerPattern.test(lines[index + 1])) {
      const header = parseTableRow(line);
      index += 2;
      const rows: string[][] = [];

      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push(
        <div key={`table-${blocks.length}`} className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-200">
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex} className="border-b border-slate-800 px-3 py-2 font-medium">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-950/40 text-slate-300">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-800">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (orderedListPattern.test(line) || unorderedListPattern.test(line)) {
      const items: ListItem[] = [];

      while (index < lines.length) {
        const currentLine = lines[index];
        if (orderedListPattern.test(currentLine)) {
          items.push({
            ordered: true,
            content: currentLine.replace(orderedListPattern, "").trim(),
          });
          index += 1;
          continue;
        }

        if (unorderedListPattern.test(currentLine)) {
          items.push({
            ordered: false,
            content: currentLine.replace(unorderedListPattern, "").trim(),
          });
          index += 1;
          continue;
        }

        break;
      }

      const ordered = items[0]?.ordered ?? false;
      const ListTag = ordered ? "ol" : "ul";
      const listClassName = ordered
        ? "ml-5 list-decimal space-y-2 text-slate-100 marker:text-slate-500"
        : "ml-5 list-disc space-y-2 text-slate-100 marker:text-slate-500";

      blocks.push(
        <ListTag key={`list-${blocks.length}`} className={listClassName}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item.content)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];
      const nextTrimmed = nextLine.trim();

      if (
        !nextTrimmed ||
        nextTrimmed.startsWith("```") ||
        headingPattern.test(nextLine) ||
        /^[-*_]{3,}$/.test(nextTrimmed.replace(/\s+/g, "")) ||
        orderedListPattern.test(nextLine) ||
        unorderedListPattern.test(nextLine) ||
        (index + 1 < lines.length && nextLine.includes("|") && tableDividerPattern.test(lines[index + 1]))
      ) {
        break;
      }

      paragraphLines.push(nextTrimmed);
      index += 1;
    }

    blocks.push(renderParagraph(paragraphLines.join(" "), `paragraph-${blocks.length}`));
  }

  return <div className="space-y-4">{blocks}</div>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        const fallback = (() => {
          if (!data || typeof data !== "object") {
            return `Request failed with status ${res.status}.`;
          }

          const error =
            "error" in data && typeof data.error === "string" ? data.error : null;
          const preview =
            "preview" in data && typeof data.preview === "string" ? data.preview : null;

          if (error && preview) {
            return `${error}\n\n${preview}`;
          }

          return error ?? `Request failed with status ${res.status}.`;
        })();

        throw new Error(fallback);
      }

      const assistantContent =
        data && typeof data === "object" && "response" in data && typeof data.response === "string"
          ? data.response
          : "The agent replied, but I could not find a text response in the payload.";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Sorry, I couldn't reach the agent endpoint.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              SysMind MCP
            </h1>
            <p className="text-sm text-slate-400">
              Chat with the agent from a Tailwind-built interface.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Connected
          </span>
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/25">
          <div className="border-b border-slate-800 px-4 py-3 text-sm text-slate-400">
            {hasMessages ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "No messages yet"}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {!hasMessages && (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-400">
                  Ask about system health, agent state, or anything you want to
                  check. Messages will appear here.
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${msg.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "border border-slate-700 bg-slate-950/70 text-slate-100"
                    }`}
                >
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-800 bg-slate-950/70 p-4 backdrop-blur"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about system health..."
                aria-label="Message input"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
