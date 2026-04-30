# sysmind-ui

Next.js 16 frontend for SysMind. It provides a Material UI chat interface, model selection, Markdown/LaTeX response rendering, and API routes that proxy to the MCP backend.

## Structure

- `app/page.tsx`: small route entry.
- `app/components/ChatPage.tsx`: chat state, model loading, and send-message flow.
- `app/components/ChatHeader.tsx`: title, connection state, and model selector.
- `app/components/MessageList.tsx`: empty state, message bubbles, and loading indicator.
- `app/components/MarkdownMessage.tsx`: Markdown, tables, code blocks, and LaTeX rendering.
- `app/components/MessageComposer.tsx`: prompt input and send action.
- `app/api/agent/route.ts`: proxies chat requests to `MCP_BACKEND_URL`.
- `app/api/models/route.ts`: proxies model listing and safely handles non-JSON upstream failures.

## Configuration

The UI API routes read:

```env
MCP_BACKEND_URL=http://localhost:8080
```

When running through the root Docker Compose stack, this is injected as:

```env
MCP_BACKEND_URL=http://sysmind-mcp:8080
```

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
