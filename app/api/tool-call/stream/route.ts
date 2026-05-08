export async function POST(req: Request) {
  const body = await req.json();
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";

  if (!prompt.trim()) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const agentBaseUrl = process.env.AGENT_BACKEND_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${agentBaseUrl}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ message: prompt }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return Response.json(
        {
          error: "Agent chat stream request failed.",
          status: response.status,
          data,
        },
        { status: response.status },
      );
    }

    if (!response.body) {
      return Response.json({ error: "Agent stream did not include a response body." }, { status: 502 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach SysMind agent stream.",
        detail: error instanceof Error ? error.message : "Unknown upstream error.",
      },
      { status: 502 },
    );
  }
}
