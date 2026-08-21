# Building ft_transcendence — Step-by-Step Guide

This guide explains every layer of the stack so you understand not just _what_ the code
does but _why_ each design decision was made.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Docker Compose — Services, Networks, Volumes](#2-docker-compose)
3. [nginx — Reverse Proxy & TLS](#3-nginx)
4. [PostgreSQL & Prisma ORM](#4-postgresql--prisma-orm)
5. [Redis — Game State & Pub/Sub](#5-redis)
6. [NestJS Backend](#6-nestjs-backend)
7. [Next.js Frontend](#7-nextjs-frontend)
8. [Socket.IO — Real-Time Game Loop](#8-socketio--real-time-game-loop)
9. [Building From Scratch — Step Order](#9-building-from-scratch)
10. [Debugging Tips](#10-debugging-tips)

---

## 1. Architecture Overview

```
Browser
  │
  │  HTTPS (port 443) / WSS
  ▼
┌─────────────────────────────┐
│           nginx             │  ← single entry point for all traffic
│  TLS termination            │
│  /api/*    → backend:4000   │
│  /socket.io/* → backend:4000│
│  /*        → frontend:3000  │
└──────────────┬──────────────┘
               │  Docker internal network (app_network)
       ┌───────┴────────┐
       │                │
  frontend:3000    backend:4000
  (Next.js)        (NestJS)
                        │
               ┌────────┴────────┐
               │                 │
         postgres:5432       redis:6379
```

**Key insight:** All five services live on the same Docker bridge network called
`app_network`. They can reach each other by service name (e.g. `http://backend:4000`).
From outside Docker, only nginx is reachable on ports 80/443.

---

## 2. Docker Compose

### `docker-compose.yml` concepts

**Services** — Each key under `services:` is one container.

**`build: context`** — Docker builds an image from the given directory's `Dockerfile`.
If you use `target: dev`, it stops at the `FROM base AS dev` stage (multi-stage build).

**`volumes`** — Two kinds:
- Named volumes (`pgdata:`, `redisdata:`) — Docker manages storage, survives `docker compose down`
- Bind mounts (`./backend/src:/app/src`) — Your host files appear inside the container.
  This is how live-reload works: you edit a file locally, NestJS/Next.js sees the change.

**`networks`** — All services on `app_network` can reach each other by service name.

**`depends_on`** — Controls startup order. `condition: service_healthy` means Docker waits
for the healthcheck to pass before starting the dependent service.

**`healthcheck`** — A command Docker runs periodically. PostgreSQL's `pg_isready` exits 0
when the database is ready to accept connections.

**`env_file: .env`** — Injects all variables from `.env` into the container's environment.

### Try it:

```bash
# See what Docker Compose resolves to
docker compose config

# Start only postgres and redis (useful for backend development without Docker)
docker compose up postgres redis

# Run a one-off command in a service
docker compose run --rm backend npx prisma migrate status
```

---

## 3. nginx

### What a reverse proxy does

A reverse proxy sits in front of your backend services and forwards requests to them.
The browser only knows about nginx — it never talks to NestJS or Next.js directly.

Benefits:
- **Single entry point** — one port (443) for everything
- **TLS termination** — nginx handles HTTPS; internal services use plain HTTP
- **Path-based routing** — `/api/*` goes to one service, `/*` to another
- **WebSocket proxying** — nginx can upgrade HTTP connections to WebSocket

### TLS / HTTPS

TLS requires a certificate (public) and a private key. For local dev we generate a
self-signed certificate with `openssl`. The browser will warn you about it — that's
expected. In production you'd use Let's Encrypt (free) or a CA-signed cert.

```bash
# What make certs runs:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -subj "/CN=localhost"
```

### `nginx.conf` — important blocks

```nginx
# Strip /api/ prefix before forwarding
# GET /api/users → GET http://backend/users
location /api/ {
    proxy_pass http://backend/;   # trailing slash = strip the location prefix
}

# WebSocket requires these headers
location /socket.io/ {
    proxy_pass http://backend/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;    # ask server to upgrade
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;                  # keep connection alive 24h
}
```

### How WebSocket upgrade works

1. Browser sends HTTP request with `Upgrade: websocket` header
2. nginx forwards it with the same header
3. NestJS/socket.io responds with `101 Switching Protocols`
4. From here on it's a persistent TCP connection — not HTTP

---

## 4. PostgreSQL & Prisma ORM

### Database schema design

The schema lives in `backend/prisma/schema.prisma`. Key entities:

- **User** — accounts. `passwordHash` stores bcrypt hash, never plain text.
- **Room** — a game session. Has a `code` (6-char hex) players share to join.
- **GameParticipant** — join table between User and Room. Stores score + assigned color.
- **GameResult** — created when a game ends. Links to the Room and all participants.
- **Friendship** — self-referential: two Users with a status (PENDING/ACCEPTED/BLOCKED).

### Prisma workflow

```bash
# 1. Edit schema.prisma

# 2. Create a migration file and apply it to the DB
make migrate
# (runs: npx prisma migrate dev --name <description>)

# 3. Prisma generates a TypeScript client matching your schema
# backend/node_modules/.prisma/client/

# 4. Use it in code:
await prisma.user.create({ data: { ... } })
await prisma.room.findMany({ where: { status: 'WAITING' } })
```

**Migration files** live in `backend/prisma/migrations/`. Each is a SQL file that Prisma
generated from your schema diff. Never edit them by hand — always let Prisma generate them.

### Prisma relations in code

```typescript
// Eager loading with include
const room = await prisma.room.findUnique({
  where: { id: 1 },
  include: {
    host: true,                         // related User
    participants: {
      include: { user: true }           // nested include
    }
  }
});

// Select only specific fields (more efficient)
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: { id: true, username: true }  // passwordHash is NOT selected
});
```

### Why `select` over `include`

`include` fetches all fields of a relation. `select` lets you choose exactly what you
need. For user objects sent to the client, always use `select` to exclude `passwordHash`.

---

## 5. Redis

### What Redis is

Redis is an in-memory key-value store. Think of it as a very fast dictionary that all
backend instances can share. It also supports:
- **Lists, Sets, Sorted Sets** — useful for leaderboards
- **Expiry (TTL)** — keys auto-delete after N seconds
- **Pub/Sub** — publish messages to channels; all subscribers receive them

### How game state is stored

Each active game room has a key `game:<roomId>` in Redis that holds the full `GameState`
JSON. Every 150ms the game loop reads it, advances the snakes, and writes it back.

```
Redis key: game:42
Value: {
  "roomId": "42",
  "snakes": [...],
  "food": [...],
  "tick": 150,
  "running": true
}
TTL: 3600 seconds (auto-deleted after 1 hour if not cleaned up)
```

### Why Redis instead of in-memory?

If you store game state in a JavaScript `Map` inside NestJS, it's lost when:
- The container restarts
- You scale to multiple backend instances (state lives in only one)

With Redis, any backend instance can read/write the same state.

### Pub/Sub pattern

```
backend-instance-1                  backend-instance-2
      │                                     │
      │  publish('game:42', state)          │
      │──────────────────► Redis            │
                              │             │
                              └────────────►│ subscribe('game:42')
                                            │ → broadcast to clients
```

Even with a single instance, using pub/sub future-proofs your scaling story.

### Three Redis connections

The `RedisService` creates three separate connections:
- `client` — general commands (get/set/del)
- `publisher` — only publishes messages
- `subscriber` — only subscribes (a subscribed connection cannot issue other commands)

This is a Redis requirement: once you call `SUBSCRIBE`, the connection enters subscribe
mode and can only receive messages.

---

## 6. NestJS Backend

### Module system

NestJS organizes code into **modules**. Each module groups related providers (services,
gateways) and controllers. You import a module to use its exported providers.

```
AppModule
 ├── PrismaModule (@Global → injected everywhere)
 ├── RedisModule  (@Global → injected everywhere)
 ├── AuthModule   (AuthService, JwtStrategy, AuthController)
 ├── UsersModule  (UsersService, UsersController)
 ├── RoomsModule  (RoomsService, RoomsController)
 └── GameModule   (GameService, GameGateway)
```

**@Global()** — makes a module's exports available in every other module without
explicit import. Used for PrismaModule and RedisModule since every part of the app uses them.

### Dependency injection

NestJS uses constructor injection. When you declare `constructor(private prisma: PrismaService)`,
NestJS automatically provides the singleton instance. You never call `new PrismaService()`.

### Controllers vs Services

- **Controller** — handles HTTP requests, maps routes, validates input, calls services
- **Service** — business logic, database queries, no HTTP concerns

Rule: if you find yourself putting DB calls in a controller, move them to a service.

### Guards and Strategies

```
Request → JwtAuthGuard → JwtStrategy.validate() → req.user = User
```

`JwtAuthGuard` extends Passport's `AuthGuard('jwt')`. When a route has
`@UseGuards(JwtAuthGuard)`, Passport extracts the Bearer token, verifies the JWT
signature, and calls `JwtStrategy.validate()` which loads the user from the DB.
If invalid → 401. If valid → the user is attached to `req.user`.

### Validation with class-validator

```typescript
export class RegisterDto {
  @IsString()   username: string;
  @IsEmail()    email: string;
  @MinLength(6) password: string;
}
```

`ValidationPipe` in `main.ts` runs these decorators on every incoming request body.
Invalid data gets a 400 response with clear error messages. The `whitelist: true` option
strips unknown fields automatically (prevents property injection attacks).

### WebSocket Gateway

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway {
  @WebSocketServer() server: Server;  // the socket.io Server instance

  @SubscribeMessage('changeDirection')
  onChangeDirection(@ConnectedSocket() client: Socket, @MessageBody() data: ...) {
    // called when client emits 'changeDirection'
  }
}
```

The gateway is just another injectable provider. It has access to all services via DI.

---

## 7. Next.js Frontend

### App Router

Next.js 14 uses the **App Router** (`src/app/`). Each `page.tsx` is a route:

```
src/app/page.tsx              →  /
src/app/login/page.tsx        →  /login
src/app/lobby/page.tsx        →  /lobby
src/app/game/[roomId]/page.tsx → /game/123  ([roomId] is a dynamic segment)
```

### SSG vs SSR vs Client Components

**SSG (Static Site Generation)** — page is rendered at build time, result is cached.
Best for pages with no per-request data (e.g., landing page, marketing pages).

**SSR (Server-Side Rendering)** — page is rendered on the server on each request.
Good for pages that need fresh data but still benefit from server rendering for SEO.

**Client Components** (`'use client'` directive) — rendered only in the browser.
Required when you use: `useState`, `useEffect`, `addEventListener`, browser APIs,
PixiJS, socket.io-client.

In this project:
- `page.tsx` (home) → SSG (no data needed)
- `game/[roomId]/page.tsx` → SSR shell, but imports a `'use client'` GameCanvas
- `login/page.tsx`, `lobby/page.tsx` → `'use client'` (use React hooks)

### Why PixiJS is dynamically imported

```typescript
// Inside useEffect (runs only in browser):
const PIXI = await import('pixi.js');
```

PixiJS accesses `window`, `document`, and WebGL. If Next.js tried to import it during
server-side rendering, it would crash because those globals don't exist on Node.js.
The dynamic `import()` inside `useEffect` guarantees it only runs after hydration.

### API client (`src/lib/api.ts`)

```typescript
const BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL  // browser: goes through nginx
    : 'http://backend:4000';           // server: direct Docker DNS
```

Server-side (SSR) requests skip nginx entirely and hit the backend directly on the
internal Docker network. This is faster and avoids the TLS overhead.

Environment variables prefixed with `NEXT_PUBLIC_` are embedded at build time and
available in browser code. Variables without that prefix are server-only.

---

## 8. Socket.IO — Real-Time Game Loop

### Connection flow

```
1. User opens /game/42
2. GameCanvas mounts → useEffect runs
3. socket.connect() — WebSocket handshake through nginx
4. socket.emit('joinRoom', { roomId: '42', userId: 5 })
5. Server joins socket to room '42', broadcasts 'playerJoined'

Host presses Space:
6. socket.emit('startGame', { roomId: '42' })
7. Server creates GameState, saves to Redis
8. Server starts setInterval(150ms) loop
9. Every 150ms: Redis read → advance snakes → Redis write → emit 'gameState'

Player moves:
10. socket.emit('changeDirection', { direction: 'UP' })
11. Server updates snake.direction in Redis
(next tick will use the new direction)

Game ends:
12. Server emits 'gameOver' with final state
13. Server saves result to PostgreSQL via Prisma
14. Server deletes game state from Redis
```

### Why 150ms tick rate

- 150ms = ~6.7 frames/second for the game state
- Snakes move one cell per tick
- The game doesn't need 60fps — it's grid-based, not pixel-based
- Lower tick rate = less Redis + WebSocket traffic

### Socket.IO rooms

Socket.IO has a built-in concept of "rooms" (not related to game rooms). Each socket
can join multiple string-named rooms, and you can broadcast to all sockets in a room:

```typescript
client.join('room:42');         // add socket to room
server.to('room:42').emit(...)  // send to all sockets in room
```

---

## 9. Building From Scratch

If you want to build this yourself step by step, here's the recommended order:

### Phase 1: Infrastructure (Day 1)
1. Write `docker-compose.yml` with just postgres + redis
2. Confirm `docker compose up` works and postgres is healthy
3. Add nginx with a placeholder upstream
4. Generate certs, confirm HTTPS loads

### Phase 2: Backend skeleton (Day 2-3)
5. Create NestJS project: `npx @nestjs/cli new backend`
6. Install dependencies from `package.json`
7. Write `prisma/schema.prisma` — start with just `User`
8. Run `npx prisma migrate dev --name init`
9. Add `PrismaModule`, `PrismaService`
10. Add `AuthModule` with register + login endpoints
11. Test with curl: `curl -k https://localhost/api/auth/register ...`

### Phase 3: Rooms (Day 3-4)
12. Add `Room`, `GameParticipant` to schema, migrate
13. Build `RoomsModule` with create/join/list endpoints
14. Test room creation + joining

### Phase 4: Frontend (Day 4-5)
15. Create Next.js project: `npx create-next-app@latest frontend`
16. Build login/register forms
17. Build lobby page (list rooms, create, join)
18. Confirm JWT auth flow works end-to-end

### Phase 5: Real-time game (Day 5-7)
19. Implement `GameService` with game state logic
20. Implement `GameGateway` with Socket.IO events
21. Build `GameCanvas` with PixiJS rendering
22. Connect socket.io-client in the canvas component
23. Test multiplayer with two browser tabs

### Phase 6: Persistence (Day 7-8)
24. Add `GameResult` to schema, migrate
25. Implement `persistResult` in the gateway
26. Add user profile page showing game history
27. Add `Friendship` model and friendship endpoints

---

## 10. Debugging Tips

### Container logs

```bash
make logs              # all services
make log s=backend     # just backend
make log s=nginx       # nginx access/error logs
```

### Exec into containers

```bash
make shell s=backend   # NestJS container
make shell s=postgres  # run psql
docker compose exec postgres psql -U snake -d snakedb
```

### Check nginx routing

```bash
# Test that /api/ strips the prefix correctly
curl -k https://localhost/api/auth/register -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"t@t.com","password":"123456"}'

# Watch nginx logs while making requests
docker compose logs -f nginx
```

### Prisma issues

```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Reset the DB (DELETES ALL DATA)
docker compose exec backend npx prisma migrate reset

# Open Prisma Studio — visual DB browser
make studio  # → http://localhost:5555
```

### Redis debugging

```bash
docker compose exec redis redis-cli

# See all game state keys
KEYS game:*

# Read a game state
GET game:42

# See all keys
KEYS *
```

### WebSocket debugging

In Chrome DevTools → Network → WS tab, you can see all WebSocket messages in real time.

### Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` connecting to postgres | DB not ready | Wait for healthcheck, check `depends_on` |
| `Invalid JWT` | Wrong secret or expired | Check `JWT_SECRET` in `.env` matches backend |
| `Cannot read properties of undefined` in PixiJS | SSR import | Make sure import is inside `useEffect` or use `await import()` |
| nginx 502 Bad Gateway | Backend not running | Check `make log s=backend` |
| nginx cert error in browser | Self-signed cert | Accept exception in browser (expected in dev) |
| Prisma `Table not found` | Migration not run | Run `make migrate` |