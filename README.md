# sysmind-ui

Next.js 16 frontend for SysMind. It provides a Material UI chat interface and API routes that call the SysMind agent.

The UI talks to `sysmind-agent`, and the agent decides when to call MCP tools such as `machine_status`.

In the full SysMind workspace, this service sits beside:

- `sysmind-mcp`: the stateless MCP backend that serves local tools.
- `sysmind-agent`: the Spring AI agent service that plans responses and calls MCP tools.

## Structure

- `app/page.tsx`: small route entry.
- `app/components/ChatPage.tsx`: chat state, agent health check, and send flow.
- `app/components/ChatHeader.tsx`: title and connection state.
- `app/components/MessageList.tsx`: empty state, message bubbles, and loading indicator.
- `app/components/MarkdownMessage.tsx`: Markdown, tables, code blocks, and LaTeX rendering.
- `app/components/MessageComposer.tsx`: chat input and send action.
- `app/lib/tool-formatters.ts`: shared formatting for streamed and non-streamed tool results.
- `app/api/tool-call/route.ts`: calls `sysmind-agent` through `AGENT_BACKEND_URL`.
- `app/api/tool-call/stream/route.ts`: proxies streamed agent events for live chat updates.
- `app/api/models/route.ts`: checks agent health for UI connection state.

## Configuration

The UI API routes read:

```env
AGENT_BACKEND_URL=http://localhost:4000
NEXT_ALLOWED_DEV_ORIGINS=
```

When running through the root Docker Compose stack, this is injected as:

```env
AGENT_BACKEND_URL=http://sysmind-agent:4000
```

The API routes append `/api/chat` or `/api/chat/stream` when calling the agent, so `AGENT_BACKEND_URL` should be the agent origin.

Set `NEXT_ALLOWED_DEV_ORIGINS` to a comma-separated list of LAN hosts only when you need to access the Next dev server from another device, for example `192.168.1.154`.

## Agent Chat

Ask the agent natural-language questions. Examples:

```text
Check my machine status.
```

```text
Show my latest news.
```

The agent can call read-only MCP tools exposed by the backend, including `latest_news`, `chroma_status`, and `machine_status`.

The chat surface fetches available MCP tools from `/api/tools` and renders them as GPT-style tiles. Tapping a tool tile creates the matching prompt, sends it immediately, and steers the agent toward that tool.

Tool-result display is shared between the streaming chat path and the non-streaming API route, so new tool renderers only need to be added once.

## Development

Install dependencies:

```bash
npm ci
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`. If port `3000` is busy, Next may choose another port such as `3001`.

If you see `Another next dev server is already running`, stop the old process:

```bash
pkill -f "next dev"
```

## Verification

Run lint:

```bash
npm run lint
```

Build production output:

```bash
npm run build
```

Validate the standalone Compose file:

```bash
docker compose config
```

## Docker

The root `docker-compose.yml` builds this service and runs it behind nginx. Use the root scripts:

```bash
../deploy.sh
../shutdown.sh
```

The root Compose stack runs the UI, agent, MCP backend, Chroma, and nginx.

The Compose service includes a health check against the local Next server so the root nginx service can wait for the UI to be ready.
