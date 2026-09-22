# Claude Code Instructions — Woven Time Tracking

## Deployment

- **Push directly to `main`** — no PRs needed. `main` is unprotected.
- GitHub Actions (`deploy.yml`) runs on **both** `workflow_dispatch` and `push: branches: [main]`. The push trigger was disabled after a production incident (see the README's Production Build & Deployment section) and later deliberately re-enabled once the manual-trigger path had run stably (see the "Enable auto-deploy on push to main" commit) — **pushing to `main` now deploys automatically.** After pushing, don't assume it's live from the push alone: use `actions_list` (`list_workflow_runs`, `resource_id: deploy.yml`) to find the run the push triggered (or trigger one yourself with `actions_run_trigger` / `method: run_workflow` if none appears) and monitor it to completion. It rsyncs the repo to the production host, then runs `docker compose up -d --build` and waits for the container's health check to pass. Production runs in Docker (see `docker-compose.yml`) — PM2 (`ecosystem.config.cjs`) is a legacy fallback only, not used in normal deploys.
- Production URL: not published here (this repo is public) — see the task/routine configuration or internal deployment docs for the live URL.

## Routine Workflow

1. Fetch latest `main` and branch off it locally for changes
2. Implement fix / feature
3. Commit with clear message referencing the issue number(s)
4. Push directly to `origin/main`
5. A push to `main` auto-triggers the "Deploy to Production" workflow — find that run (`actions_list` / `list_workflow_runs` on `deploy.yml`) and monitor it until it completes; only fall back to a manual `workflow_dispatch` trigger if no run appears for the push
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
