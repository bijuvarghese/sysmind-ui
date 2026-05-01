type ChatCompletionMessage = {
  content?: unknown;
  text?: unknown;
};

type ChatCompletionChoice = {
  content?: unknown;
  delta?: ChatCompletionMessage;
  finish_reason?: unknown;
  finishReason?: unknown;
  message?: ChatCompletionMessage;
  text?: unknown;
};

export type AgentUsage = {
  completionTokens?: number;
  promptTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
};

const wrapperTextFields = ["response", "answer", "result", "output_text", "outputText"] as const;
const nestedTextFields = ["message", "delta", "content", "parts", "output", "choices", "candidates"] as const;

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

  pushText(text, record.text);

  for (const field of nestedTextFields) {
    if (field in record) {
      text.push(...collectText(record[field], depth + 1));
    }
  }

  return text;
}

function extractFromChatCompletion(data: Record<string, unknown>): string | null {
  if (!Array.isArray(data.choices)) {
    return null;
  }

  for (const choice of data.choices as ChatCompletionChoice[]) {
    const direct = [
      choice.message?.content,
      choice.message?.text,
      choice.delta?.content,
      choice.delta?.text,
      choice.content,
      choice.text,
    ]
      .flatMap((value) => collectText(value))
      .join("\n")
      .trim();

    if (direct) {
      return direct;
    }
  }

  return null;
}

function stoppedBecauseOfLength(data: Record<string, unknown>): boolean {
  if (!Array.isArray(data.choices)) {
    return false;
  }

  return (data.choices as ChatCompletionChoice[]).some((choice) => {
    const finishReason = choice.finish_reason ?? choice.finishReason;
    return finishReason === "length";
  });
}

export function extractAssistantContent(data: unknown): string | null {
  if (typeof data === "string") {
    return data.trim() || null;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;

  for (const field of wrapperTextFields) {
    const direct = collectText(record[field]).join("\n").trim();
    if (direct) {
      return direct;
    }
  }

  const chatCompletionText = extractFromChatCompletion(record);
  if (chatCompletionText) {
    return chatCompletionText;
  }

  if (stoppedBecauseOfLength(record)) {
    return "The model reached its token limit before producing a final answer. Try asking for a shorter summary or fewer headlines.";
  }

  const fallback = collectText(data)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join("\n")
    .trim();

  return fallback || null;
}

export function getPayloadPreview(data: unknown): string {
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

function readNumber(record: Record<string, unknown>, ...fields: string[]): number | undefined {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

export function extractUsage(data: unknown): AgentUsage | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const usage = (record.usage ?? record.token_usage ?? record.tokenUsage) as Record<string, unknown> | undefined;

  if (!usage || typeof usage !== "object") {
    return null;
  }

  const completionDetails = (usage.completion_tokens_details ?? usage.completionTokensDetails) as
    | Record<string, unknown>
    | undefined;

  const parsed = {
    completionTokens: readNumber(usage, "completion_tokens", "completionTokens", "output_tokens", "outputTokens"),
    promptTokens: readNumber(usage, "prompt_tokens", "promptTokens", "input_tokens", "inputTokens"),
    reasoningTokens:
      completionDetails && typeof completionDetails === "object"
        ? readNumber(completionDetails, "reasoning_tokens", "reasoningTokens")
        : undefined,
    totalTokens: readNumber(usage, "total_tokens", "totalTokens"),
  };

  return Object.values(parsed).some((value) => value !== undefined) ? parsed : null;
}
