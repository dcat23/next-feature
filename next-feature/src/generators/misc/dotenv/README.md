# Dotenv Generator

Creates, updates, or removes environment variables across a project's `.env*` files, optionally syncing the same change to other projects, and keeps `lib/config/env.ts`'s zod schema/accessors in sync with the same keys.

## Purpose

- Add/update/remove vars in `.env` and `.env.example` (always included), plus any additional `.env.<suffix>` files
- Group related vars under a `### SECTION ###` header
- Sync the same change across multiple projects in one call (e.g. a feature and the app(s) that consume it)
- Keep every non-`.env.example` file it touches out of git, via an idempotent `.gitignore` update
- Keep `lib/config/env.ts`'s zod schema and `process.env` accessors in sync with the same vars, so they're typed without any manual editing

`feature`, `application`, and `client-config` all call the underlying `src/lib/dotenv` functions directly when they need to register a var (e.g. `<NAME>_API_URL`); this generator is the CLI-facing entry point for everything else.

## Usage

```bash
# Set a var (writes to .env and .env.example, and lib/config/env.ts)
npx nx g next-feature:dotenv --projectName=users --set=BACKEND_API_URL=http://localhost:8080

# Set multiple vars under a section
npx nx g next-feature:dotenv --projectName=users --section=axios --set=BACKEND_API_URL=http://localhost:8080 --set=BACKEND_API_TIMEOUT=5000

# Remove a var
npx nx g next-feature:dotenv --projectName=users --unset=BACKEND_API_URL

# Sync the same var to another project too (e.g. the app consuming this feature)
npx nx g next-feature:dotenv --projectName=users --projects=web --set=SHARED_URL=http://localhost:9090

# Also target .env.local/.env.prod (in addition to the always-included .env/.env.example)
npx nx g next-feature:dotenv --projectName=users --files=local,prod --set=API_URL=http://localhost:8080

# Target every .env* file that already exists in the project root
npx nx g next-feature:dotenv --projectName=users --all --set=API_URL=http://localhost:8080

# Skip updating lib/config/env.ts for this call
npx nx g next-feature:dotenv --projectName=users --set=INTERNAL_TOKEN=abc123 --skipEnvConfig
```

## Options

| Option | Type | Default | Alias | Description |
|--------|------|---------|-------|-------------|
| `--projectName` | string | required | `-p` | Project to update (auto-created via the feature generator if it doesn't exist) |
| `--projects` | string[] | — | — | Additional project names to apply the same change to. Unknown project names are skipped with a warning rather than failing |
| `--section` | string | `MISC` | `-s` | Grouped section header the variables belong under |
| `--set` | string[] | — | — | Variables to create or update, as `KEY=VALUE` pairs |
| `--unset` | string[] | — | — | Variable names to remove |
| `--files` | string[] | — | — | Additional `.env.<suffix>` files to target, e.g. `local,prod` |
| `--all` | boolean | `false` | `-a` | Target every `.env*` file that already exists in the project root instead of a fixed list |
| `--skipEnvConfig` | boolean | `false` | — | Skip keeping `lib/config/env.ts` in sync with the variables being set/unset |
| `--skipFormat` | boolean | `false` | — | Skip prettier formatting |

## env.ts sync

Unless `--skipEnvConfig` is passed, every key in `--set`/`--unset` is also applied to `lib/config/env.ts`: the schema property, the exported accessor, and the `.env` key are always the same name (e.g. `BACKEND_API_URL`). New vars are typed as `z.string()` — if a var needs stricter validation (e.g. `.url()`), edit `env.ts` directly after generation; the marker-based sync (`/* schema start/end */`, `/* vars start/end */`) leaves anything you add outside those keys untouched on the next run.

```typescript
// lib/config/env.ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  /* schema start */
  BACKEND_API_URL: z.string(),
  /* schema end */
});
// ...
export const NODE_ENV = process.env.NODE_ENV;
/* vars start */
export const BACKEND_API_URL = process.env.BACKEND_API_URL;
/* vars end */
```
