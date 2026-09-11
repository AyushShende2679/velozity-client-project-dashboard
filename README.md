# Velozity — Real-Time Client Project Dashboard

A full-stack, enterprise-grade project management platform built with React, Node.js, Express, PostgreSQL, Prisma, and Socket.io. Features role-based access control (Admin, PM, Developer), live activity feeds with role-filtering, missed event catchup directly from PostgreSQL, scheduled overdue task detection, in-app notifications, and URL-shareable filter views.

---

## 1. Technical Stack & Architectural Overview

| Layer | Technology | Architectural Role |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Role-specific dashboards, state management, real-time Socket.io client |
| **Backend** | Node.js + Express 5 + TypeScript | Layered REST API (`/api/v1`), Zod validation, fail-closed RBAC |
| **Database** | PostgreSQL 16 + Prisma ORM | Relational data persistence, foreign key cascades, optimized indexes |
| **Real-Time** | Socket.io | Bi-directional event broadcasting, dynamic rooms, live presence tracking |
| **Background Scheduler** | node-cron | Automated recurring daemon evaluating overdue deadlines |
| **Authentication** | JWT (Dual Token) + HttpOnly Cookies | Stateless 15-minute access tokens + rotating 7-day refresh tokens |

---

## 2. Architectural Decisions & Justifications

### A. WebSocket Choice: Socket.io vs. Native WebSocket
* **Decision**: Selected **Socket.io**.
* **Justification**:
  1. **Built-in Room Multiplexing**: Crucial for our multi-tenant role isolation (`global-admin`, `pm-{id}`, `dev-{id}`, `project-{id}`). Native WebSockets require manual channel routing and connection-to-room bookkeeping.
  2. **Automatic Reconnection & Handshake Auth**: Socket.io provides exponential backoff reconnection out of the box, with token verification in the handshake middleware (`io.use`).
  3. **Strict WebSocket-Only Enforcement**: Configured with `transports: ['websocket']` across both server and client to completely disable HTTP long-polling and SSE, strictly complying with real-time requirements while leveraging Socket.io's room abstractions and reconnection lifecycle.

### B. Job Queue Choice: node-cron vs. Bull
* **Decision**: Selected **node-cron**.
* **Justification**:
  1. **Self-Contained Footprint**: node-cron runs directly inside the Node.js process without requiring a separate Redis cluster or memory cache infrastructure, keeping local setup simple with Docker PostgreSQL.
  2. **Bulk SQL Efficiency**: Overdue task detection is an idempotent batch operation (`UPDATE "Task" SET "isOverdue" = true WHERE "dueDate" < NOW() AND "status" != 'DONE' AND "isOverdue" = false`). A single index-backed SQL query executed once per minute is significantly more performant than enqueueing thousands of individual task jobs into a queue.

### C. Token Storage Approach
* **Decision**: Dual-token architecture with strictly segregated storage.
* **Justification**:
  1. **Refresh Token**: Stored in an `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (in production) cookie. Inaccessible to client-side JavaScript, mitigating XSS token theft.
  2. **Access Token**: Stored exclusively in JavaScript memory (`inMemoryToken`). Never written to `localStorage` or `sessionStorage`.
  3. **Silent Refresh Interceptor**: Axios response interceptors catch HTTP 401s, request a new access token via `/api/v1/auth/refresh` using the cookie, update memory, and retry original queued requests seamlessly.
  4. **Token Rotation & Reuse Detection**: Refresh tokens are hashed (`SHA-256`) and stored in the database. When refreshed, the old token is revoked and a new one issued. If an already-revoked token is received (indicating token theft), all sessions for that user are immediately invalidated.

### D. Indexing Strategy
* **`User(email)`**: Unique B-tree index for $O(1)$ authentication lookups.
* **`Project(ownerId)`**: B-tree index enabling instantaneous filtering of projects owned by a Project Manager.
* **`Task(projectId)` & `Task(assignedToId)`**: Indexes supporting fast project task lists and developer assignments without full table scans.
* **`Task(dueDate, status, isOverdue)`**: Composite index tailored specifically for the 60-second cron job query to find tasks where `dueDate < NOW() AND status != 'DONE' AND isOverdue = false`.
* **`TaskActivityLog(projectId, createdAt DESC)`**: Composite index to power the PM project activity feed and "missed 20 events" database queries.
* **`Notification(recipientId, isRead, createdAt DESC)`**: Composite index powering real-time unread badges and notification dropdown queries.

---

## 3. Database Schema Diagram

```mermaid
erDiagram
    Client ||--o{ Project : "has"
    User ||--o{ Project : "creates (PM)"
    User ||--o{ Task : "assigned (Dev)"
    Project ||--o{ Task : "contains"
    Task ||--o{ TaskActivityLog : "records"
    User ||--o{ TaskActivityLog : "performs"
    User ||--o{ Notification : "receives"
    User ||--o{ RefreshToken : "holds"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string name
        enum role "ADMIN | PROJECT_MANAGER | DEVELOPER"
        datetime createdAt
    }

    RefreshToken {
        uuid id PK
        string tokenHash UK
        uuid userId FK
        datetime expiresAt
        boolean revoked
    }

    Client {
        uuid id PK
        string name
        string email
        string company
    }

    Project {
        uuid id PK
        string title
        string description
        uuid clientId FK
        uuid ownerId FK
    }

    Task {
        uuid id PK
        int taskNumber
        string title
        string description
        enum status "TO_DO | IN_PROGRESS | IN_REVIEW | DONE"
        enum priority "LOW | MEDIUM | HIGH | CRITICAL"
        boolean isOverdue
        datetime dueDate
        uuid projectId FK
        uuid assignedToId FK
    }

    TaskActivityLog {
        uuid id PK
        uuid taskId FK
        uuid projectId FK
        uuid userId FK
        enum fromStatus
        enum toStatus
        string message
        datetime createdAt
    }

    Notification {
        uuid id PK
        uuid recipientId FK
        string title
        string message
        enum type "TASK_ASSIGNED | TASK_IN_REVIEW"
        uuid referenceId
        boolean isRead
        datetime createdAt
    }
```

---

## 4. Local Setup Instructions (Docker)

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
* [Node.js](https://nodejs.org/) (v18+)

### Step 1: Start PostgreSQL via Docker Compose
```bash
docker compose up -d
```
Verify container is running:
```bash
docker compose ps
```

### Step 2: Configure Environment Variables
Server `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velozity_db?schema=public"
JWT_ACCESS_SECRET="your_access_token_secret_here"
JWT_REFRESH_SECRET="your_refresh_token_secret_here"
CLIENT_URL="http://localhost:5173"
```
Client `.env`:
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
VITE_WS_URL="http://localhost:5000"
```

### Step 3: Run Database Migrations and Seed Data
```bash
cd server
npm install
npx prisma migrate dev
npx prisma db seed
```

### Step 4: Start Backend and Frontend
In `server/`:
```bash
npm run dev
```
In `client/` (new terminal):
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Seed Accounts (Pre-configured for Testing)

All seeded accounts use password: `Password123!`

| Role | Email | Pre-seeded Context |
|---|---|---|
| **Admin** | `admin@velozity.com` | Full global visibility, all 3 projects, all 17 tasks, online user count |
| **PM 1** | `sarah.pm@velozity.com` | Owns "Enterprise Cloud Migration" and "Real-Time Telemetry Platform" |
| **PM 2** | `marcus.pm@velozity.com` | Owns "AI Analytics Microservice" (cannot access Sarah's projects) |
| **Developer** | `ravi.dev@velozity.com` | Assigned to 4 tasks, sorted by priority (Critical first) then due date |
| **Developer** | `elena.dev@velozity.com` | Assigned to 4 tasks |
| **Developer** | `alex.dev@velozity.com` | Assigned to 4 tasks |
| **Developer** | `priya.dev@velozity.com` | Assigned to 5 tasks |

---

## 6. Technical Defense / Explanation Field (150–250 Words)

> **The Hardest Problem Solved**:
> The most challenging aspect was preventing Insecure Direct Object References (IDOR) and maintaining strict role isolation across both asynchronous WebSocket events and database queries without duplicating authorization logic. Rather than filtering in memory, all database operations enforce tenancy at the SQL layer (e.g., PMs strictly constrain queries to `ownerId: user.id`, and Developers to `assignedToId: user.id`).
> 
> **How the Real-Time Role-Filtered Feed Was Handled**:
> We implemented a dual-layer broadcasting strategy using Socket.io room multiplexing. The server authenticates every socket handshake via JWT. Upon connecting, sockets automatically join isolated role rooms (`global-admin`, `pm-{userId}`, `dev-{userId}`) and dynamically subscribe to `project-{projectId}` when viewing a project. When a task status changes, the server transactionally commits a `TaskActivityLog` to PostgreSQL and emits targeted events only to the viewer's room, the project's PM owner, and the assigned Developer. Offline users re-sync missed events via an indexed `GET /api/v1/activity/missed` database query, guaranteeing zero in-memory data loss.
> 
> **One Thing I Would Do Differently**:
> If scaling beyond a single server instance, I would decouple WebSocket state using Redis Streams / Redis Adapter. This would allow horizontal scaling of the backend while preserving room broadcasts, distributed presence counts, and multi-node cron leader election.

---

## 7. Known Limitations
1. Single-node in-memory WebSocket presence tracking (requires Redis adapter for multi-instance clusters).
2. Rate-limiting is applied at route level; enterprise deployments would benefit from edge gateway throttling (Cloudflare / Kong).
