# Frontend — Snake (ft_transcendence)

Next.js (React 19 + TypeScript) client for the Snake multiplayer game.
See the [project root README](../README.md) for the full subject write-up (description, modules, team, etc.).
This file only covers running/developing the frontend service itself.

## Requirements
- Node.js 20
- A `.env` file at the **project root** (see [`../.env.example`](../.env.example))

Normally you don't run this service standalone — use `make up` from the project root,
which starts it together with nginx, the backend and Redis via Docker Compose.

## Running standalone (without Docker)
```bash
npm install
npm run dev   # http://localhost:3000
```

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (hot reload) |
| `npm run build` / `npm run start` | Production build and start |
| `npm run lint` | Lint the codebase |

## Structure
- `src/app` — Next.js App Router pages (`server/arena`, `server/profile`, `server/admin`, `server/(auth)/login|register|reset`)
- `src/components/Arena` — the Snake game board, canvas rendering, animation loop and game HUD
- `src/components/Auth` — login/register/reset forms
- `src/components/Friends`, `src/components/Profile` — friends list, profile & account settings, avatar and language preferences
- `src/components/Admin` — admin user-management UI
- `src/components/Socket` — WebSocket client wiring for real-time gameplay
- `src/lib` — shared client-side utilities and generated translation strings
