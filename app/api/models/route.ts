export async function GET() {
  const agentBaseUrl = process.env.AGENT_BACKEND_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${agentBaseUrl}/actuator/health`, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch agent status.", status: response.status, data },
        { status: response.status },
      );
    }

    return Response.json({
      data: [{ id: "sysmind-agent" }],
    });
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
