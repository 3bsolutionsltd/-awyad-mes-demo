# GitHub Copilot Instructions — AWYAD MES

## Documentation File Convention

**All `.md` files must be placed in the `docs/` folder** — never in the project root.

The only exception is `README.md`, which must remain in the project root (this is a universal standard required by GitHub, npm, and other tooling).

### Rules
- New documentation → `docs/<FILENAME>.md`
- User guides → `docs/USER_*.md`
- Architecture / developer docs → `docs/ARCHITECTURE*.md`, `docs/*_GUIDE.md`
- Deployment docs → `docs/DEPLOYMENT*.md`
- Status reports → `docs/*_STATUS.md`, `docs/*_REPORT.md`
- Agent config files in `.agents/` may retain their `.agent.md` extension in that folder
- `database/` subdirectory READMEs may stay within their own folder

### Never do this
```
# WRONG — creates .md file in root
/MY_NEW_GUIDE.md
```

### Always do this
```
# CORRECT — .md file in docs/
/docs/MY_NEW_GUIDE.md
```

---

## Project Stack
- **Backend:** Node.js + Express.js (port 3001)
- **Frontend:** Vanilla JS + Bootstrap 5 (HTML files in `public/`)
- **Database:** PostgreSQL
- **Auth:** JWT tokens, bcrypt
- **Admin credentials (dev only):** `admin` / `Admin123!`

## Key Directories
```
docs/        ← ALL .md documentation files (except README.md)
src/         ← Server-side source (routes, services, middleware)
public/      ← Frontend HTML, CSS, JS
database/    ← Schema, migrations, seeds
data/        ← Mock data, imports
.agents/     ← Copilot agent configuration files
tests/       ← Jest test files
config/      ← App configuration
```
