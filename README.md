# Trackly

**Trackly** is a modern, full-stack issue tracking and project management web application designed for engineering teams to streamline bug tracking, feature requests, and workflow management. 

Users can sign up, create or join a team, manage roles (`ADMIN` and `MEMBER`), assign tasks, collaborate through comments, track issues across an interactive Kanban board, and monitor team productivity via real-time dashboard analytics.

---

## Features

- **Authentication & Authorization**: Secure JWT cookie-based authentication with bcrypt password hashing and route protection.
- **Team Workspaces & Role-Based Access Control (RBAC)**:
  - Every user belongs to a team workspace.
  - Signing up creates a team and assigns the creator the `ADMIN` role.
  - Admins can invite/add new members, manage roles, and delete members.
- **Issue Management & Tracking**:
  - Full CRUD operations for issues of type `BUG` or `FEATURE`.
  - Configurable priority levels: `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.
  - Workflow status transitions: `TODO` → `IN_PROGRESS` → `DONE`.
  - Issue assignment, search, multi-criteria filtering, and sorting (by date, priority, title, etc.).
- **Interactive Kanban Board**: Visual drag-and-drop board to quickly update issue statuses and reorder workflows.
- **Issue Comments & Collaboration**: Threaded conversation history on each issue with timestamps and author details.
- **Analytics & Dashboard Overview**: Aggregated metrics and charts displaying issue distribution by status, priority breakdown, issue types, recent activity, and team member workload.
- **Modern Responsive UI & Theme Support**: Built with dark/light mode support, toast notifications, and smooth animations.

---

## Technologies Used

### Frontend
- **Framework & Language**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4, `@fontsource-variable/geist`
- **State Management**: Redux Toolkit & React-Redux
- **Routing**: React Router DOM (`react-router-dom` v7)
- **Component UI & Icons**: Base UI, Shadcn/Radix primitives, Lucide React, Sonner (Toasts)
- **Charts & Drag-and-Drop**: Recharts, `@dnd-kit/core`, `@dnd-kit/sortable`
- **Form Handling & Validation**: React Hook Form, Zod, `@hookform/resolvers`

### Backend
- **Runtime & Language**: Node.js, TypeScript (executed with `tsx`)
- **Framework**: Express.js
- **Database & ODM**: MongoDB, Mongoose
- **Security & Utilities**: Helmet, CORS, Morgan (logger), Cookie-Parser, Dotenv
- **Auth & Hashing**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Validation**: Zod

### AI Tool
- **Kiro**

---

## Project Structure

```
Trackly/
├── client/                     # Frontend React + TypeScript application
│   ├── src/
│   │   ├── components/         # Reusable UI elements, dialogs, badges, board columns
│   │   ├── pages/              # Dashboard, Board, Issues, Team, Login, Signup
│   │   ├── redux/              # Redux store, auth slice, theme slice
│   │   ├── services/           # Axios/Fetch API service integration layers
│   │   └── types/              # TypeScript interface & type definitions
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Backend Express + Node.js API
│   ├── src/
│   │   ├── config/             # Database connection and environment config
│   │   ├── controllers/        # Auth, Team, Issue, and Dashboard controllers
│   │   ├── middlewares/        # Auth verification, RBAC, error handlers, validator
│   │   ├── models/             # Mongoose schemas (User, Team, Issue)
│   │   ├── routers/            # Express route declarations
│   │   ├── schemas/            # Zod validation schemas
│   │   └── seed.ts             # Database seeding script with demo data
│   └── package.json
├── LICENSE                     # License file
└── README.md                   # Project documentation
```

---

## Data Model

- **User**: `name`, `email`, `passwordHash`, `teamId`, `role` (`ADMIN` | `MEMBER`), `createdAt`, `updatedAt`
- **Team**: `name`, `description`, `createdBy`, `createdAt`, `updatedAt` (Members are linked via `User.teamId`)
- **Issue**: `title`, `description`, `type` (`BUG` | `FEATURE`), `status` (`TODO` | `IN_PROGRESS` | `DONE`), `priority` (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), `createdBy`, `assignedTo`, `teamId`, `comments[]`, `createdAt`, `updatedAt`

---

## Setup and Installation

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or a MongoDB Atlas URI)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/Himanshu0518/Trackly.git
cd Trackly
```

### 2. Install dependencies

Install backend dependencies:
```bash
cd server
pnpm install # or: npm install
```

Install frontend dependencies:
```bash
cd ../client
pnpm install # or: npm install
```

### 3. Configure environment variables

#### Backend Environment Configuration
Create a `.env` file in the `server/` directory:

```env
PORT=3000
DATABASE_URI=mongodb://localhost:27017/trackly
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

#### Frontend Environment Configuration
Create a `.env.local` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## How to Run the Application

### 1. (Optional) Seed the Database with Demo Data
To populate sample users, teams, issues, and comments for testing:

```bash
cd server
pnpm run seed # or: npm run seed
```

### 2. Start the Backend API Server

```bash
cd server
pnpm run dev # or: npm run dev
```
*The server will start on `http://localhost:3000`.*

### 3. Start the Frontend Development Server

In a new terminal:

```bash
cd client
pnpm run dev # or: npm run dev
```
*The client application will start at `http://localhost:5173` (or the next available port shown in your terminal).*

### 4. Build for Production

```bash
# Build backend
cd server
pnpm run build # or: npm run build

# Build frontend
cd ../client
pnpm run build # or: npm run build
```

---

## AI Tool Used

**Kiro**

---

## AI Development Experience

During the development of Trackly, I used **Kiro** heavily to accelerate development velocity, elevate UI quality, and eliminate repetitive boilerplate. 

On the frontend, Kiro helped prototype complex interactive components (such as the Kanban board, issue filter bar, and charts) and assisted in adapting components to strict TypeScript and React 19 standards. On the backend, it assisted in structuring MongoDB aggregation pipelines for the analytics dashboard and writing validation schemas. 

Working with Kiro allowed me to focus more on high-level architectural decisions, user flow design, and security, while letting AI assist with implementation details, type safety, and boilerplate generation.

### Specific Tasks Where Kiro Was Used

1. **Frontend Component Development & UI Refinements**: Built and polished complex UI components including the Kanban board columns, responsive modal dialogs, status badges, priority selectors, and Recharts analytics cards.
2. **Database & Validation Schema Generation**: Generated structured Mongoose schemas and matching Zod validation schemas for `User`, `Team`, and `Issue` entities to ensure end-to-end type safety.
3. **TypeScript Type-Error Resolution**: Detected and resolved strict TypeScript type issues across the client and server (such as event handler signatures, nullable select states, and compiler configuration fixes).
4. **Backend Dashboard Aggregation Queries**: Wrote and optimized MongoDB aggregation pipelines to calculate real-time team statistics (issues grouped by status, priority distribution, type ratios, and per-member workload).
5. **Repetitive Boilerplate & Service Layer Integration**: Generated standard CRUD controller handlers, Express middleware wrappers, and client-side API service modules, reducing redundant manual code writing.

---

## License

This project is licensed under the Apache-2.0 License. See [LICENSE](./LICENSE) for details.