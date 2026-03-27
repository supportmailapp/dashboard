# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server on port 5050
pnpm build        # Sync submodules + Vite build
pnpm check        # Type-check with svelte-check
pnpm check:watch  # Watch mode type-checking
pnpm lint         # Prettier format check
pnpm format       # Auto-format with Prettier
```

There are no automated tests in this project.

## Critical Rules

SupportMail Dashboard is a SvelteKit full-stack app for managing a Discord modmail/ticket bot. It uses Svelte 5 (runes), TypeScript strict mode, Tailwind CSS 4, MongoDB via Mongoose, and Discord OAuth2.

### Path Aliases

Configured in `svelte.config.js`:
- `$lib` → `src/lib`
- `$ui` → `src/lib/components/ui`
- `$stores` → `src/lib/stores`
- `$db` → `src/lib/server/db`
- `$v1Api` → `src/routes/api/v1`

### Routing

File-based SvelteKit routing under `src/routes/`:
- `/` — landing page
- `/@me` — user profile
- `/-/[guildid=snowflake]/*` — guild dashboard (tickets, tags, panels, settings, reports, blacklist, feedback)
- `/mod/*` — moderator section
- `/admin/*` — admin user management
- `/login`, `/login/callback` — Discord OAuth2 flow
- `/api/v1/*` — REST API consumed by the frontend and external integrations

The `[guildid=snowflake]` segment uses a matcher to validate Discord snowflake IDs.

### Auth & Security

Auth is handled in `src/hooks.server.ts`: Discord OAuth2 → JWT in cookies → validated per request. Guild access is cached for performance (`src/lib/server/caches/`).

Arcjet (`src/hooks.server.ts`) provides DDoS protection, bot detection, and rate limiting (100 req/min in production, relaxed in dev).

### State Management

Svelte 5 rune-based stores in `src/lib/stores/` (`.svelte.ts` files):
- `user.svelte.ts` — current user
- `guilds.svelte.ts` / `GuildsManager.svelte.ts` — guild list and selection
- `site.svelte.ts` — theme, loading state
- `vpn.svelte.ts` — VPN detection state

### Data Layer

- **MongoDB** via Mongoose — models in `src/lib/server/db/models/`
- **Discord API** — wrappers in `src/lib/server/discord.ts`; `discord.js` used server-side
- **Socket.io client** — real-time updates via `src/lib/utils/websocket.ts`
- **API client** — `src/lib/utils/apiClient.ts` (built on `ky`) for frontend → API calls

### Shared Types

`src/lib/sm-types/` is a git submodule containing shared TypeScript types. Run `pnpm update:submodules` to sync it. The workspace is configured in `pnpm-workspace.yaml`.

### UI Components

Shadcn-svelte components live in `src/lib/components/ui/`. Custom components (emoji picker, content editor, panel builder, Discord-specific previews) are in `src/lib/components/`. Configuration in `components.json` (base color: slate).

### Production

PM2 (`pm2.config.cjs`) runs the Node adapter output on port 5050. Source maps are uploaded to Sentry but excluded from the build output. Environment-specific config uses `.env.production`.

### API server routes: named exports only + no arrow functions
SvelteKit requires named exports for route handlers, and using arrow functions just doesn't look right.
```ts
// ✅ Correct
export async function GET({ locals }) { ... }

// ❌ Wrong
export const GET = async ({ locals }) => { ... }
```

### Client API calls
Always use `apiClient` + `APIRoutes`:
```ts
const res = await apiClient.get(APIRoutes.ticketCategory(id));
if (!res.ok) { toast.error("..."); return; }
const data = res.data; # already types and parsed if `res.ok`
```
