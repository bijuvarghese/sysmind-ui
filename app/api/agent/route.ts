import { extractAssistantContent, extractUsage, getPayloadPreview } from "@/app/lib/agentResponse";

async function readUpstreamBody(response: Response): Promise<unknown> {
  const body = await response.text();
  return parseUpstreamBody(body);
}

function parseUpstreamBody(body: string): unknown {
  const trimmed = body.trim();
  if (!trimmed) {
    return body;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return body;
    }
  }

  return body;
}

export async function POST(req: Request) {
  const body = await req.json();

  const mcpBaseUrl = process.env.MCP_BACKEND_URL ?? "http://localhost:8080";

  const response = await fetch(`${mcpBaseUrl}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await readUpstreamBody(response);

  if (!response.ok) {
    return Response.json(
      {
        error: "Upstream agent request failed.",
        status: response.status,
        data,
      },
      { status: response.status },
    );
  }

  const content = extractAssistantContent(data);

  if (!content) {
    return Response.json(
      {
        error: "Upstream agent response did not include readable assistant text.",
        preview: getPayloadPreview(data),
      },
      { status: 502 },
    );
  }

  return Response.json({ response: content, usage: extractUsage(data) });
}
