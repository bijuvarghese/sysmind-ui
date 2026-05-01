type ChatCompletionMessage = {
  content?: unknown;
  text?: unknown;
};

type ChatCompletionChoice = {
  message?: ChatCompletionMessage;
  text?: unknown;
};

const wrapperTextFields = ["response", "answer", "result", "output_text"] as const;
const nestedTextFields = ["message", "content", "parts", "output", "choices", "candidates", "delta"] as const;

function pushText(values: string[], value: unknown) {
  if (typeof value !== "string") {
    return;
  }

  const trimmed = value.trim();
  if (trimmed) {
    values.push(trimmed);
  }
}

function collectText(value: unknown, depth = 0): string[] {
  if (depth > 6 || value == null) {
    return [];
  }

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item, depth + 1));
  }

  if (typeof value !== "object") {
    return [];
  }

  const text: string[] = [];
  const record = value as Record<string, unknown>;

  if (record.type === "reasoning" || record.type === "reasoning_content") {
    return [];
  }

  for (const field of wrapperTextFields) {
    const fieldValue = record[field];

    if (typeof fieldValue === "string") {
      pushText(text, fieldValue);
    } else {
      text.push(...collectText(fieldValue, depth + 1));
    }
  }

  if (record.type !== "reasoning") {
    pushText(text, record.text);
  }

  for (const field of nestedTextFields) {
    if (field in record) {
      text.push(...collectText(record[field], depth + 1));
    }
  }

  return text;
}

async function readUpstreamBody(response: Response): Promise<unknown> {
  const body = await response.text();
  return parseUpstreamBody(body);
}

function extractAssistantContent(data: unknown): string | null {
  const record = data as Record<string, unknown> | null;

  if (record && Array.isArray(record.choices)) {
    const firstChoice = record.choices[0] as ChatCompletionChoice | undefined;
    const direct = [firstChoice?.message?.content, firstChoice?.message?.text, firstChoice?.text]
      .flatMap((value) => collectText(value))
      .join("\n")
      .trim();

    if (direct) {
      return direct;
    }
  }

  const fallback = collectText(data)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join("\n")
    .trim();

  return fallback || null;
}

function getPayloadPreview(data: unknown): string {
  try {
    const preview = JSON.stringify(data, null, 2);
    if (!preview) {
      return "No payload preview available.";
    }

    return preview.length > 1500 ? `${preview.slice(0, 1500)}...` : preview;
  } catch {
    return "Payload preview could not be serialized.";
  }
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

  return Response.json({ response: content });
}
