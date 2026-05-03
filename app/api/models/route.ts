type McpTool = {
  name?: unknown;
};

export async function GET() {
  const mcpBaseUrl = process.env.MCP_BACKEND_URL ?? "http://localhost:8080";

  try {
    const response = await fetch(`${mcpBaseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/list",
        params: {},
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch MCP tools.", status: response.status, data },
        { status: response.status },
      );
    }

    const tools = Array.isArray(data?.result?.tools) ? (data.result.tools as McpTool[]) : [];

    return Response.json({
      data: tools
        .map((tool) => (typeof tool.name === "string" ? { id: tool.name } : null))
        .filter(Boolean),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach MCP backend.",
        detail: error instanceof Error ? error.message : "Unknown upstream error.",
      },
      { status: 502 },
    );
  }
}
