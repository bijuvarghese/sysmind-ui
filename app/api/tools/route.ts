import type { ToolDefinition } from "@/app/components/types";

export async function GET() {
  const agentBaseUrl = process.env.AGENT_BACKEND_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${agentBaseUrl}/api/tools`, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch agent tools.", status: response.status, data },
        { status: response.status },
      );
    }

    const tools = Array.isArray(data)
      ? data.filter(isToolDefinition)
      : Array.isArray((data as { data?: unknown } | null)?.data)
        ? ((data as { data: unknown[] }).data.filter(isToolDefinition) as ToolDefinition[])
        : [];

    return Response.json({ data: tools });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach SysMind agent.",
        detail: error instanceof Error ? error.message : "Unknown upstream error.",
      },
      { status: 502 },
    );
  }
}

function isToolDefinition(value: unknown): value is ToolDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name?: unknown }).name === "string"
  );
}
