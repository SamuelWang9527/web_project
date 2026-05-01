# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Server (run from `server/`)
```bash
npm run dev              # Dev server with hot reload (ts-node + nodemon, port 5000)
npm run build            # Compile TypeScript → dist/
npm start                # Run compiled dist/index.js
npm run typecheck        # TypeScript type checking only
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Run pending database migrations
npm run prisma:pull      # Introspect live DB into schema.prisma
```

### Client (run from `client/`)
```bash
npm run dev       # Vite dev server (port 3000, proxies /api to :5000)
npm run build     # TypeScript check + Vite build → dist/ (served by Fastify)
npm run preview   # Preview production build locally
npm run typecheck # TypeScript type checking only
```

No linter or test config is present.

## Architecture

Full-stack project management system: monorepo with `client/` (React + Vite + TypeScript) and `server/` (Fastify + Prisma + TypeScript). In production, Fastify serves the built React app from `client/dist/` via `@fastify/static`.

## Authentication & Authorization

Stateless JWT auth. On login, the server signs a JWT (`JWT_SECRET`, default 6h expiry) and returns `{ token, user }`. The client stores the token in `localStorage` and an Axios request interceptor in `client/src/utils/api.ts` injects `Authorization: Bearer <token>` on every request. The server-side Fastify auth plugin (`server/src/plugins/auth.plugin.ts`) verifies the token and populates `request.user`.

Three roles: `user`, `admin`, `super_admin`. `AuthContext.hasRole()` uses array-index comparison for role hierarchy. `App.tsx` enforces route guards via `ProtectedRoute`, `AdminRoute`, and `TicketRoute`.

## Server Structure

- `server/src/index.ts` — Entry point: Prisma connect, Fastify listen on port 5000
- `server/src/app.ts` — Fastify setup: registers CORS (`https://pipecode.asia` in prod, open in dev), `@fastify/multipart` (20MB max), `@fastify/static` for uploads/exports/SPA, auth plugin, and all route prefixes
- `server/src/lib/prisma.ts` — Shared `PrismaClient` (MariaDB adapter)
- `server/src/plugins/auth.plugin.ts` — JWT verification Fastify plugin; decorates `request.user`
- `server/src/routes/` — One file per domain (`auth`, `projects`, `users`, `tickets`, `dashboard`) plus `work-items/` subdirectory (`index.ts`, `attachments.ts`, `comments.ts`)
- `server/prisma/schema.prisma` — Source of truth for all data models and relations

## Data Models (Prisma)

Five models in MySQL: `users`, `projects`, `workitems`, `tickets`, `workitem_activities`.

Key design decisions:
- `workitems.attachments` and `workitems.comments` are stored as JSON columns (not separate tables)
- `workitem_activities` provides a full audit trail (create/update/status_change/assignee_change/comment/attachment_add/delete) with `field`, `oldValue`, `newValue`
- `tickets` are standalone — not linked to projects or work items
- Prisma enums use `@map("中文")` for Chinese display values

## Client Structure

- `client/src/App.tsx` — All routes (code-split via `React.lazy()`), role guards
- `client/src/utils/api.ts` — Axios instance (base: `/api`, 15s timeout); all API functions live here; 401 response clears localStorage token
- `client/src/contexts/AuthContext.tsx` — Global auth state; rehydrates user from stored token on mount
- `client/src/pages/` — One file per page; `WorkItemDetail.tsx` and `Dashboard.tsx` are the most complex
- Ant Design v5 (`antd`) with `zh_CN` locale set in `main.tsx`
- `@ant-design/plots` for dashboard charts; `gantt-task-react` for Gantt view

## File Uploads

Uploaded files land in `server/public/uploads/images/` or `server/public/uploads/files/` (split by MIME type). Exports go to `server/public/exports/`. Metadata (filename, originalName, path, mimetype, size) is stored as JSON in `workitems.attachments`. Static assets are served at `/uploads/` and `/exports/` routes. Limit: 20MB, configurable via `MAX_FILE_SIZE` env var.

## Environment Variables

Server `.env` requires: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL` (Prisma connection string), `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAX_FILE_SIZE`. Client requires no `.env` — Vite proxies `/api` to `http://localhost:5000` during development.

Admin bootstrap: run `createAdmin.ts` from `server/` via `npx ts-node scripts/createAdmin.ts` (needs `.env`).
