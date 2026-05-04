# sysmind-ui

Next.js 16 frontend for SysMind. It provides a Material UI tool-calling interface and API routes that call the MCP backend over JSON-RPC.

The UI loads available tools from MCP `tools/list`, so newly registered backend tools such as `machine_status` appear without hard-coding them in the frontend.

## Structure

- `app/page.tsx`: small route entry.
- `app/components/ChatPage.tsx`: tool-call state, tool loading, and send flow.
- `app/components/ChatHeader.tsx`: title and connection state.
- `app/components/MessageList.tsx`: empty state, message bubbles, and loading indicator.
- `app/components/MarkdownMessage.tsx`: Markdown, tables, code blocks, and LaTeX rendering.
- `app/components/MessageComposer.tsx`: tool argument input and call action.
- `app/api/tool-call/route.ts`: calls MCP `tools/call` through `MCP_BACKEND_URL`.
- `app/api/models/route.ts`: calls MCP `tools/list` and adapts tools for the UI selector.

## Configuration

The UI API routes read:

```env
MCP_BACKEND_URL=http://localhost:8080
```

When running through the root Docker Compose stack, this is injected as:

```env
MCP_BACKEND_URL=http://sysmind-mcp:8080
```

The API routes append `/mcp` when calling the backend, so `MCP_BACKEND_URL` should be the backend origin, not the full MCP path.

## Tool Calls

The tool selector is populated from MCP `tools/list`.

For most tools, enter JSON arguments or leave the argument box as `{}`. For `latest_news`, plain text is treated as the `query` argument. Examples:

```json
{}
```

```json
{"query":"AI policy India","language":"hi-IN","country":"IN"}
```

Read-only tools currently exposed by the backend are `disk_usage`, `ram_usage`, `latest_news`, `chroma_status`, and `machine_status`.

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

## Docker

The root `docker-compose.yml` builds this service and runs it behind nginx. Use the root scripts:

```bash
../deploy.sh
../shutdown.sh
```
