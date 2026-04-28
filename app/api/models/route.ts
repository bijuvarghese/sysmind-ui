export async function GET() {
  const mcpBaseUrl = process.env.MCP_BACKEND_URL ?? "http://localhost:8080";

  const response = await fetch(`${mcpBaseUrl}/v1/models`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch models from upstream.", data },
      { status: response.status },
    );
  }

  return Response.json(data);
}
