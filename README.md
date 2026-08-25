*This project has been created as part of the 42 curriculum by GhRafayel[, \<login2\>[, \<login3\>[, \<login4\>[, \<login5\>]]]].*

<!--
  TODO (team): replace the placeholder logins above with the real 42/GitHub
  logins of every contributing team member, in the same order they appear
  in the "Team Information" section below.
-->

# Snake — ft_transcendence

## Description

**Snake** is a real-time, multiplayer web application built for the `ft_transcendence` project. It reimagines the classic Snake game as a competitive, room-based online experience: players sign up, add friends, join or create a game room, and play live against other users (or against an AI opponent) with results, statistics and match history tracked per user.

Key features:
- Secure email/password authentication (hashed passwords, JWT access/refresh tokens, session management, logout / logout-all-devices).
- Real-time multiplayer Snake gameplay over WebSockets, with rooms supporting more than two simultaneous players.
- An AI opponent that can fill empty seats and play against a human.
- Friends system (send/accept/reject requests, online status).
- User profiles with avatar upload and editable account information.
- Match history and game statistics per user.
- Admin panel with role-based access control (search, view, edit and delete users).
- Multi-language UI (English, Russian, German, Italian) with a language switcher, stored in the database.
- HTTPS everywhere via an nginx reverse proxy with TLS termination.
- Fully containerized with Docker Compose, started with a single command.

## Instructions

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- `make` (all common operations are wrapped in the [Makefile](Makefile))
- Node.js 22 (only needed if you want to run frontend/backend outside of Docker)

### Environment setup
1. Copy the example environment file and fill in real values:
   ```bash
   cp .env.example .env
   ```
2. Fill in `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, SMTP credentials
   (`PROJECT_EMAIL` / `EMAIL_PASS`) and the seed admin accounts (`ADMIN_1_*`, ...).
   Never commit the real `.env` file — it is git-ignored on purpose.

### Running the project
```bash
make certs   # generates a local self-signed TLS certificate for nginx
make up      # builds and starts nginx, frontend, backend, redis (foreground)
# or: make up-d   to run in the background
```
The app is then reachable at **https://localhost**.

Useful commands (see the [Makefile](Makefile) for the full list):
| Command | Description |
|---|---|
| `make admin` | Seed the admin accounts defined in `.env` |
| `make migrate` | Run Prisma migrations inside the backend container |
| `make studio` | Open Prisma Studio (DB GUI) on port 5555 |
| `make logs` / `make log s=backend` | Follow logs for all / one service |
| `make down` | Stop all services |
| `make clean` | Stop services and wipe database volumes |

### Test accounts
After running `make admin`, the accounts defined by `ADMIN_1_*` (and `ADMIN_2_*`, ...) in
`.env` are created with the `ADMIN` role and can log in immediately.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [JWT (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [42 ft_transcendence subject](en.subject.pdf)

**AI usage**: AI assistance (Claude Code) was used during this project for:
- Reviewing the project against the `ft_transcendence` subject requirements and identifying missing mandatory items (Privacy Policy / Terms of Service pages, `.env.example`, README structure).
- Scaffolding this README.md against the subject's required structure.
- <!-- TODO (team): add here any other concrete tasks where AI was used (e.g. debugging a specific bug, writing a specific function, explaining an API) — be specific about which parts, per the subject's "Learner rules". -->

All AI-assisted output was reviewed, tested and understood by the team before being kept in the codebase.

## Team Information

<!-- TODO (team): fill in real names/logins, roles and responsibilities. -->

| Login | Role(s) | Responsibilities |
|---|---|---|
| GhRafayel | Technical Lead / Developer | Backend architecture (NestJS, Prisma, auth, sockets), Docker/nginx setup, AI opponent |
| \<login2\> | \<role\> | \<responsibilities\> |
| \<login3\> | \<role\> | \<responsibilities\> |

## Project Management

<!-- TODO (team): describe how the team actually organized itself. -->
- **Task organization**: \<e.g. GitHub Issues / Trello / shared doc — fill in\>
- **Communication channel**: \<e.g. Discord — fill in\>
- **Meeting cadence**: \<e.g. weekly sync — fill in\>
- **Work breakdown**: \<how tasks were split between frontend/backend/modules — fill in\>
- **Code review**: \<process used before merging — fill in\>

## Technical Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (React 19) + TypeScript + Tailwind CSS | Full-stack-capable React framework, file-based routing, fast iteration |
| Backend | NestJS (Node.js) + TypeScript | Opinionated, modular architecture with built-in DI, guards, and WebSocket gateways |
| Database | PostgreSQL, accessed via Prisma ORM | Relational data (users, rooms, friendships, results) with strong consistency and type-safe queries |
| Real-time | Socket.IO (`@nestjs/websockets`) | Bidirectional low-latency communication for live gameplay |
| Cache / sessions | Redis | Fast ephemeral state for socket/session data |
| Auth | JWT (access + refresh) via `@nestjs/jwt` / `passport-jwt`, bcrypt password hashing | Stateless, secure authentication with refresh-token rotation and session revocation |
| Email | Nodemailer / `@nestjs-modules/mailer` | Password reset codes and notifications |
| Reverse proxy / TLS | nginx | Single HTTPS entrypoint for frontend + backend, terminates TLS |
| Containerization | Docker Compose | One-command local and deployment setup |

## Database Schema

The database is managed by Prisma (`backend/prisma/schema.prisma`, PostgreSQL). Main models and relations:

- **Users** — account data (email, hashed password, username, role, language, theme, avatar, score). Has many `GameRoom` (owned), `RoomUser`, `Sessions`, `FriendsRequest` (sent/received), `GameParticipants`, `GameResults` (won); has one `UserStats`.
- **Sessions** — refresh-token sessions per user, with expiry and revocation, for logout/logout-all.
- **FriendsRequest** — sender/receiver pair with a `status` (`PENDING`/`ACCEPTED`/`REJECTED`), unique per pair.
- **GameRoom** — a game lobby (`type`: `PUBLIC`/`PRIVATE`, `status`: `WAITING`/`STARTING`/`PLAYING`/`FINISHED`, `maxUsers`, `ownerId`). Has many `RoomUser` and `GameResults`.
- **RoomUser** — join table linking a `Users` row to a `GameRoom` (plus live `socketId`), unique per (room, user).
- **GameResults** — one finished match belonging to a `GameRoom`, with the winner and match length (`ticks`). Has many `GameParticipants`.
- **GameParticipants** — per-user result row for a `GameResults` (alive/score), unique per (game, user).
- **UserStats** — aggregated wins/losses/total score per user (1-1 with `Users`).
- **Translation** — key/value(-per-language) rows powering the i18n system.

Run `npx prisma studio` (or `make studio`) for a live, browsable view of the schema and data.

## Features List

<!-- TODO (team): confirm ownership ("who worked on it") for each row below. -->

| Feature | Description | Worked on by |
|---|---|---|
| Registration / Login | Email + password signup and signin, hashed passwords | \<name\> |
| JWT sessions | Access/refresh tokens, per-device sessions, logout / logout-all | \<name\> |
| Password reset | Email-based reset code flow | \<name\> |
| Friends system | Send/accept/reject requests, friends list, online status | \<name\> |
| Profile | View/edit profile info, avatar upload with default avatar | \<name\> |
| Game rooms | Create/join public or private rooms | \<name\> |
| Real-time Snake gameplay | WebSocket-driven live multiplayer Snake, 2+ players per room | \<name\> |
| AI opponent | Bot player that can join a room and play against humans | \<name\> |
| Match history & stats | Per-user wins/losses/score, per-match participant results | \<name\> |
| Admin panel | Role-gated search/view/edit/delete users | \<name\> |
| Multi-language UI | EN/RU/DE/IT translations with a language switcher | \<name\> |
| HTTPS / TLS | nginx reverse proxy terminating TLS for the whole app | \<name\> |
| OAuth login | Sign in with Google or GitHub | \<name\> |
| Privacy Policy / Terms of Service | Standalone, publicly accessible pages linked from the site footer | \<name\> |

## Modules

<!--
  TODO (team): before submission, re-verify EACH module below by actually
  demonstrating it end to end — per the subject, a module that cannot be
  shown working during evaluation counts as 0 points.
-->

| Category | Module | Type | Points |
|---|---|---|---|
| Web | Use a framework for both frontend (Next.js) and backend (NestJS) | Major | 2 |
| Web | Real-time features via WebSockets (live gameplay) | Major | 2 |
| Web | Use an ORM for the database (Prisma) | Minor | 1 |
| Gaming and user experience | Complete web-based game where users play against each other (Snake) | Major | 2 |
| Gaming and user experience | Remote players on separate computers, real-time | Major | 2 |
| Gaming and user experience | Multiplayer game (more than two players per room) | Major | 2 |
| Artificial Intelligence | AI opponent for the game | Major | 2 |
| User Management | Standard user management (profile update, avatar, friends, profile page) | Major | 2 |
| User Management | Game statistics and match history | Minor | 1 |
| User Management | Advanced permissions system (roles, admin CRUD on users) | Major | 2 |
| User Management | Remote authentication with OAuth 2.0 (Google, GitHub) | Minor | 1 |
| Accessibility and Internationalization | Support for 3+ languages with a language switcher | Minor | 1 |

**Total claimed: 20 points** (required minimum: 14 points), leaving margin in case a module is not fully validated during evaluation.

Justification highlights:
- **Multiplayer game (3+ players)**: `GameRoom.maxUsers` allows more than two players per room and the room/game logic supports N participants, not just 1v1 — see `backend/src/game-engin/` and `backend/src/gameRoom/`.
- **Advanced permissions system**: `Role` enum (`PLAYER`/`ADMIN`/`BOT`) plus a dedicated `AdminGuard` and `AdminController` exposing search/view/edit/delete on users (`backend/src/admin/`).
- **AI Opponent**: implemented in `backend/src/game-engin/ai-opponent.service.ts`; simulates a snake player rather than perfect/scripted play. <!-- TODO: add a short note on how the AI decides moves, for the oral defense. -->
- **OAuth 2.0**: Google and GitHub sign-in via Passport strategies (`backend/src/auth/common/strategies/google.strategy.ts`, `github.strategy.ts`), wired to the frontend through `/server/oauth-callback` and the `/api/oauth-session` route that turns the callback into the same httpOnly cookies a normal login sets.
- <!-- TODO (team): fill in a one-line justification for every remaining module in the table above, per member who implemented it. -->

## Individual Contributions

<!-- TODO (team): for each member, detailed breakdown of what they built,
     which features/modules they own, and any notable challenges + how
     they were solved. Required by the subject for the oral evaluation. -->

### GhRafayel
- \<detailed contribution breakdown\>

### \<login2\>
- \<detailed contribution breakdown\>

## Known limitations

<!-- TODO (team): list anything intentionally out of scope (e.g. no OAuth,
     no chat system, no tournament mode, etc.) so it doesn't come as a
     surprise during evaluation. -->
