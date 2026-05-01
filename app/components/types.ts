import type { AgentUsage } from "@/app/lib/agentResponse";

export type Message = {
  role: "user" | "assistant";
  content: string;
  usage?: AgentUsage | null;
};

export type LLMModel = { id: string };
