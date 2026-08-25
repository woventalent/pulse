# Claude Code Instructions — Woven Time Tracking

## Deployment

- **Push directly to `main`** — no PRs needed. `main` is unprotected.
- GitHub Actions (`deploy.yml`) does **not** run automatically on push — its `push: branches: [main]` trigger was deliberately disabled after a production incident (see the README's Production Build & Deployment section and the "Disable deploy.yml auto-trigger" commit) and is `workflow_dispatch`-only until that path has run stably for a while. **Pushing to `main` alone does not deploy anything.** After pushing, trigger the "Deploy to Production" workflow manually (`actions_run_trigger` with `method: run_workflow`, `workflow_id: deploy.yml`, `ref: main`) and monitor it to completion. It rsyncs the repo to the production host, then runs `docker compose up -d --build` and waits for the container's health check to pass. Production runs in Docker (see `docker-compose.yml`) — PM2 (`ecosystem.config.cjs`) is a legacy fallback only, not used in normal deploys.
- Production URL: not published here (this repo is public) — see the task/routine configuration or internal deployment docs for the live URL.

## Routine Workflow

1. Fetch latest `main` and branch off it locally for changes
2. Implement fix / feature
3. Commit with clear message referencing the issue number(s)
4. Push directly to `origin/main`
5. Manually trigger the "Deploy to Production" GitHub Actions workflow (`workflow_dispatch` on `deploy.yml`) and monitor it until it completes — a push by itself does not deploy
6. Close linked GitHub issues manually after a successful deploy (do not rely on commit message auto-close)
7. Send PushNotification confirming what's live

## Issue Closing

Always close GitHub issues **manually** after merging/pushing. Do not rely on auto-close keywords in commit messages — GitHub's parser is inconsistent with multiple issue numbers. Use the `mcp__github__issue_write` tool to close each issue individually.

## Commit Message Format

Reference issues like: `Fix #N: description` (one issue per commit message if possible). Multi-issue: `Fix #N and #M: description`.

## Tech Stack

- **Frontend**: React 18 + Vite (`src/`)
- **Backend**: Express + Node.js `node:sqlite` (`server.js`)
- **Auth**: Microsoft SSO (Azure AD) + dev-login fallback
- **DB**: SQLite (file on server, not in repo)
- **Role check**: `user?.role === 'admin'` for admin-only UI; `req.userRole` / `req.globalRole` in backend

## Key Files

| File | Purpose |
|---|---|
| `server.js` | All API routes + DB schema + migrations |
| `src/pages/Projects.jsx` | Projects list, project modal, project detail panel |
| `src/pages/Reports.jsx` | Reports by project / user / client |
| `src/pages/Timesheets.jsx` | Timesheet entry |
| `src/pages/Admin.jsx` | Settings (project types, users, clients) |
| `src/contexts/AuthContext.jsx` | Auth state, `user.role` for role checks |

## Migration Pattern

Use `ensureColumn()` for all schema changes — never raw `ALTER TABLE` directly:

```js
ensureColumn('table_name', 'column_name', 'COLUMN_TYPE DEFAULT value')
```
