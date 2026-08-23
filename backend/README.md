# Backend — Snake (ft_transcendence)

NestJS + Prisma (PostgreSQL) API and WebSocket gateway for the Snake multiplayer game.
See the [project root README](../README.md) for the full subject write-up (description, modules, team, etc.).
This file only covers running/developing the backend service itself.

## Requirements
- Node.js 20
- A `.env` file at the **project root** (see [`../.env.example`](../.env.example))

Normally you don't run this service standalone — use `make up` from the project root,
which starts it together with nginx, the frontend and Redis via Docker Compose.

## Running standalone (without Docker)
```bash
npm install
npx prisma generate
npx prisma db push        # sync the schema to your DATABASE_URL
npm run start:dev         # watch mode, http://localhost:4000
```

## Scripts
| Command | Description |
|---|---|
| `npm run start:dev` | Start in watch mode |
| `npm run build` / `npm run start:prod` | Production build and start |
| `npm run seed:admin` | Create the admin accounts defined by `ADMIN_*` env vars |
| `npm run generate` | Regenerate the Prisma client after a schema change |
| `npm run test` / `test:e2e` / `test:cov` | Unit / e2e / coverage tests |
| `npm run lint` | Lint and auto-fix |

## Structure
- `src/auth` — signup/login, JWT access+refresh, sessions, password reset
- `src/users`, `src/friends` — profiles, friend requests
- `src/gameRoom`, `src/game-engin` — rooms and the real-time Snake game engine (incl. AI opponent)
- `src/socket` — the WebSocket gateway used for live gameplay
- `src/admin` — role-gated user management (search/view/edit/delete) and DB seeding
- `src/redis`, `src/database`, `src/logger`, `src/mail` — infra services
- `prisma/schema.prisma` — database schema (see root README for the model overview)

## Game flow (room lifecycle)
1. User logs in, frontend stores the access token.
2. User clicks "Create Room" → backend creates a `GameRoom`.
3. Backend creates the owner's `RoomUser` row.
4. Frontend redirects to `/room/:id`.
5. The client's socket connects and joins the room.
6. Other users open the invite link and join the same way.
7. Backend enforces `maxUsers` per room.
8. Once enough players have joined, the game starts (`RoomStatus` moves to `PLAYING`).
9. Players send real-time moves over the socket.
10. Backend runs the game loop and broadcasts state updates to every client in the room.
11. On completion, a `GameResults` row (with per-player `GameParticipants`) is persisted.
