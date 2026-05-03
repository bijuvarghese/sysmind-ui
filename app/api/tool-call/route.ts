function parseArguments(prompt: string, toolName: string): Record<string, unknown> {
  const trimmed = prompt.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  if (toolName === "latest_news") {
    return { query: trimmed };
  }

  return {};
}

function readToolText(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const result = (data as Record<string, unknown>).result;
  if (!result || typeof result !== "object") {
    return null;
  }

  const content = (result as Record<string, unknown>).content;
  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const value = (item as Record<string, unknown>).text;
      if (typeof value !== "string") {
        return "";
      }

      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return text || null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  const toolName = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : "";

  if (!prompt.trim()) {
    return Response.json({ error: "Tool arguments are required." }, { status: 400 });
  }

  if (!toolName) {
    return Response.json({ error: "Select an MCP tool before calling it." }, { status: 400 });
  }

  const mcpBaseUrl = process.env.MCP_BACKEND_URL ?? "http://localhost:8080";

  const response = await fetch(`${mcpBaseUrl}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: parseArguments(prompt, toolName),
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return Response.json(
      {
        error: "MCP tools/call request failed.",
        status: response.status,
        data,
      },
      { status: response.status },
    );
  }

  const text = readToolText(data);

  if (!text) {
    return Response.json(
      {
        error: "MCP tool response did not include readable text content.",
        data,
      },
      { status: 502 },
    );
  }

  return Response.json({ response: text });
}
