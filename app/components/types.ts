export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type LLMModel = { id: string };

export type ToolCall = {
  toolName?: unknown;
  arguments?: unknown;
};

export type ToolResult = {
  toolName?: unknown;
  content?: unknown;
  error?: unknown;
  errorMessage?: unknown;
};

export type ChatEvent = {
  type?: unknown;
  message?: unknown;
  toolCall?: ToolCall | null;
  toolResult?: ToolResult | null;
};
