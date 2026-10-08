# Trackly

> A full-stack, team-based issue tracker built for engineering teams to manage bugs, feature requests, and workflows with a clean Kanban board and real-time analytics.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## Overview

Trackly is a collaborative issue tracking web application. A user signs up, creates a team (becoming its `ADMIN`), invites members, and then manages work through a structured workflow. Issues can be assigned, prioritized, commented on, and tracked on a drag-and-drop Kanban board. Admins get a real-time analytics dashboard for team-wide progress visibility.

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | JWT cookie-based auth with bcrypt password hashing |
| **Team Workspaces** | Isolated team environments; one team per user |
| **Role-Based Access** | `ADMIN` and `MEMBER` roles with enforced RBAC middleware |
| **Issue Management** | Full CRUD with type (`BUG` / `FEATURE`), priority, assignee, and comments |
| **Status Workflow** | `TODO` → `IN_PROGRESS` → `DONE` |
| **Kanban Board** | Drag-and-drop with instant optimistic UI updates and automatic rollback on failure |
| **Issue Filtering** | Server-side filtering by status, type, priority, assignee, and full-text search |
| **Comments** | Threaded discussion on each issue |
| **Analytics Dashboard** | Aggregated charts: by status, priority, type, and per-member workload |
| **Theme Support** | System-aware dark / light mode |

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4, `@fontsource-variable/geist` |
| State Management | Redux Toolkit |
| Server State & Data Fetching | RTK Query (Redux Toolkit Query) |
| Routing | React Router DOM v7 |
| UI Components | Base UI (Radix-based), Shadcn primitives, Lucide React icons |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Forms & Validation | React Hook Form + Zod + `@hookform/resolvers` |
| Notifications | Sonner |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ + TypeScript |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT (`jsonwebtoken`) + HTTP-only cookies |
| Password Hashing | bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS, Cookie-Parser |
| Logging | Morgan |
| Dev Runner | tsx (TypeScript execution without compilation) |

---

## Project Structure

```text
Trackly/
├── client/                   # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI: Button, Dialog, Badge, ErrorBoundary, etc.
│   │   ├── pages/            # Route views: Dashboard, Board, Issues, Team, Settings, 404
│   │   ├── layout/           # AppShell, AuthLayout, RootLayout wrappers
│   │   ├── services/         # RTK Query API slices (auth, issues, team, dashboard)
│   │   ├── store/            # Redux store + authSlice
│   │   ├── hooks/            # Custom hooks (useDebounce, useTheme)
│   │   ├── lib/              # Utilities, API config, analytics helpers
│   │   ├── types/            # TypeScript interfaces and domain types
│   │   └── routes.tsx        # React Router DOM route tree
│   └── vite.config.ts
│
└── server/                   # Express + Node.js REST API
    └── src/
        ├── controllers/      # Request handlers (auth, issue, team, dashboard)
        ├── models/           # Mongoose schemas (User, Team, Issue)
        ├── routers/          # Express route definitions
        ├── middlewares/      # JWT auth, RBAC, Zod validation, error handler
        ├── validators/       # Zod request payload schemas
        ├── config/           # DB connection, environment variables
        ├── utils/            # JWT helpers, response formatters
        └── seed.ts           # Database seeding with demo data
```

---

## Data Model

```
User      → name, email, passwordHash, teamId, role (ADMIN | MEMBER)
Team      → name, description, createdBy
Issue     → title, description, type (BUG | FEATURE), status (TODO | IN_PROGRESS | DONE),
            priority (LOW | MEDIUM | HIGH | CRITICAL), assignedTo, teamId, comments[]
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (recommended) or **npm**
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Himanshu0518/Trackly.git
cd Trackly

# 2. Install backend dependencies
cd server && pnpm install

# 3. Install frontend dependencies
cd ../client && pnpm install
```

### Environment Variables

**`server/.env`**

```env
PORT=3000
DATABASE_URI=mongodb://localhost:27017/trackly
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**`client/.env.local`**

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Running the Application

**1. Start the backend:**

```bash
cd server
pnpm run dev
```
> API server starts at `http://localhost:3000`

**2. Start the frontend** (new terminal):

```bash
cd client
pnpm run dev
```
> App opens at `http://localhost:5173`

**3. (Optional) Seed the database with demo data:**

```bash
cd server
pnpm run seed
```

---

## Building for Production

```bash
# Backend
cd server && pnpm run build

# Frontend
cd client && pnpm run build
```

---

## AI Tool Used

**Kiro**

---

## AI Development Experience

I used **Kiro** throughout development to accelerate the frontend, handle boilerplate, and assist with complex backend logic.

On the frontend, Kiro helped prototype and refine components (Kanban board, filter bars, analytics charts), adapt them to strict TypeScript and React 19 standards, and implement advanced patterns like RTK Query optimistic updates with automatic rollback. On the backend, it helped write MongoDB aggregation pipelines for the dashboard and structure Zod validation schemas.

This let me stay focused on product decisions, data architecture, and user experience rather than implementation boilerplate.

### Specific Tasks Where Kiro Helped

1. **Frontend component development** — Built and iterated on the Kanban board, issue filter bar, dashboard charts, and modal dialogs.
2. **RTK Query optimistic updates** — Implemented instant board status changes with automatic rollback if the API call fails.
3. **Schema & validation generation** — Wrote Mongoose models and matching Zod validators for `User`, `Team`, and `Issue`.
4. **TypeScript error resolution** — Caught and fixed strict type errors across the client (event handler signatures, null safety, compiler config).
5. **Dashboard aggregation queries** — Wrote MongoDB `$group`, `$lookup`, and `$project` pipelines for the analytics endpoints.

---

## License

This project is licensed under the **Apache-2.0 License** — see [LICENSE](./LICENSE) for details.