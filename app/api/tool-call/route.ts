import { formatToolSummaryFromSteps } from "@/app/lib/tool-formatters";
import type { AgentStep } from "@/app/lib/tool-formatters";

type AgentResponse = {
  answer?: unknown;
  steps?: unknown;
};

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";

  if (!prompt.trim()) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const agentBaseUrl = process.env.AGENT_BACKEND_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${agentBaseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ message: prompt }),
    });

    const data = (await response.json().catch(() => null)) as AgentResponse | null;

    if (!response.ok) {
      return Response.json(
        {
          error: "Agent chat request failed.",
          status: response.status,
          data,
        },
        { status: response.status },
      );
    }

    const answer = typeof data?.answer === "string" ? data.answer : null;
    const steps = Array.isArray(data?.steps) ? (data.steps as AgentStep[]) : [];

    if (!answer) {
      return Response.json(
        {
          error: "Agent response did not include an answer.",
          data,
        },
        { status: 502 },
      );
    }

    const toolSummary = formatToolSummaryFromSteps(steps).trim();

    return Response.json({
      response: answer,
      steps,
      ...(toolSummary ? { toolSummary } : {}),
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
