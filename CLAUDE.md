# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Server (run from `server/`)
```bash
npm install          # Install dependencies
npm start            # Start server (nodemon, port 5000)
node scripts/resetDatabase.js  # Reset and reseed DB (destructive)
```

### Client (run from `client/`)
```bash
npm install          # Install dependencies
npm start            # Dev server (port 3000, proxies API to :5000)
npm run build        # Production build → ../client/build (served by Express)
npm test             # Run tests (react-scripts Jest)
```

No linter config is present — no eslint or prettier commands.

## Architecture

This is a full-stack project management system: a monorepo with separate `client/` (React) and `server/` (Express + MySQL) directories. In production, Express serves the built React app from `client/build/` alongside the API.

### Authentication & Authorization

JWT-based auth flows through `server/middleware/auth.js`. The client stores the token and injects it via an Axios interceptor in `client/src/utils/api.js`. Three roles exist: `user`, `admin`, `super_admin`. `client/src/App.js` enforces route-level role guards with `ProtectedRoute`, `AdminRoute`, and `TicketRoute` components. `AuthContext` (`client/src/contexts/AuthContext.js`) manages auth state globally.

### Backend Structure

- `server/app.js` — Express setup: CORS (production origin: `pipecode.asia`), middleware, route mounting, static file serving, frontend fallback, global error handler
- `server/index.js` — Entry point: DB init, Sequelize sync, HTTP server on port 5000
- `server/config/database.js` — Auto-creates the MySQL database if it doesn't exist
- `server/models/index.js` — Defines all associations (User→Projects CASCADE, Project→WorkItems, WorkItem→WorkItemActivity CASCADE, User→Tickets, etc.)
- `server/routes/workItems.js` — Largest route file (59KB); handles work item CRUD, file attachments, Excel export, activity logging, and Gantt data
- `server/middleware/upload.js` — Multer config; uploaded files go to `server/public/uploads/` (images, files, avatars) and exports to `server/public/exports/`

### Frontend Structure

- `client/src/App.js` — All route definitions with role-based guards
- `client/src/utils/api.js` — Axios instance with JWT interceptor; all API call functions live here
- `client/src/pages/` — One file per page; `WorkItemDetail.js` (46KB) and `Dashboard.js` (29KB) are the most complex
- `client/src/contexts/AuthContext.js` — Global auth state; wrap with this when needing user info
- Ant Design (`antd` v5) is the UI component library with `zh_CN` locale set globally in `index.js`
- `@ant-design/charts` / `@ant-design/plots` used for dashboard data visualizations
- `gantt-task-react` used for Gantt chart view in work items

### Data Models

Five Sequelize models: `User`, `Project`, `WorkItem`, `Ticket`, `WorkItemActivity`. The associations defined in `models/index.js` are the source of truth for relationships — not the individual model files.

### File Uploads

Files are stored on disk (not in the DB) under `server/public/uploads/`. The `upload.js` middleware validates MIME types and enforces a 20MB limit (configurable via `MAX_FILE_SIZE` env var). File paths are persisted in the DB and served as static assets.

### Environment Variables

Server requires a `.env` with: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAX_FILE_SIZE`. Client proxies API requests to `http://localhost:5000` during development (set in `client/package.json`).
