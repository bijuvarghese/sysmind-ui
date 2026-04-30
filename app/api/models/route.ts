function parseUpstreamBody(body: string): unknown {
  const trimmed = body.trim();

  if (!trimmed) {
    return null;
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

async function readUpstreamBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (contentType.includes("application/json")) {
    return parseUpstreamBody(body);
  }

  return parseUpstreamBody(body);
}

export async function GET() {
  const mcpBaseUrl = process.env.MCP_BACKEND_URL ?? "http://localhost:8080";

  try {
    const response = await fetch(`${mcpBaseUrl}/v1/models`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const data = await readUpstreamBody(response);

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch models from upstream.", status: response.status, data },
        { status: response.status },
      );
    }

    if (!data || typeof data !== "object") {
      return Response.json(
        {
          error: "Upstream models response did not include a JSON object.",
          data,
        },
        { status: 502 },
      );
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach models upstream.",
        detail: error instanceof Error ? error.message : "Unknown upstream error.",
      },
      { status: 502 },
    );
  }
}
