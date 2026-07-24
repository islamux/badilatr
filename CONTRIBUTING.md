# Contributing to Badil Atr

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- **Node.js 18+**
- **pnpm 9+** (`npm install -g pnpm`)
- A [Neon](https://neon.tech) PostgreSQL project (free tier is fine)

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/islamux/badilatr.git
cd badilatr
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your Neon connection string

# 3. Set up the database
pnpm db:push      # create tables + extensions
pnpm db:health    # verify connectivity
pnpm db:seed      # seed sample data

# 4. Start developing
pnpm dev
```

## Code Style

### Formatting

The project uses **Prettier** with the Tailwind CSS plugin. Configuration is in `.prettierrc`:

- Single quotes
- Trailing commas (`all`)
- 100 character print width
- 2 space indentation
- Arrow parens always
- Tailwind class auto-sorting

Run formatting manually if your editor doesn't auto-format:

```bash
npx prettier --write .
```

### Linting

ESLint uses the Next.js core-web-vitals + TypeScript configs. The ESLint config also ignores `e2e/`, `coverage/`, and test config files.

```bash
pnpm lint
```

### TypeScript

Strict mode is enabled. All code must pass `tsc --noEmit`:

```bash
pnpm typecheck
```

### No Comments

Unless explicitly requested, **do not add code comments**. Write self-documenting code with clear names. JSDoc/TSDoc is reserved for public API surfaces.

## Testing

### Requirements

- All new code must have tests
- Coverage thresholds are enforced at **70%** minimum (currently at **100%**)
- Tests must pass before a PR can be merged

### Running Tests

```bash
pnpm test              # all unit/integration tests
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage report
pnpm test:e2e          # Playwright E2E (auto-starts dev server)
pnpm test:e2e:ui       # Playwright interactive mode
```

### Test File Conventions

- **Unit tests** are co-located: `src/lib/utils.test.ts`, `src/components/ui/button.test.tsx`
- **E2E tests** live in `e2e/`: `e2e/landing.spec.ts`
- Use **explicit imports**: `import { describe, it, expect } from 'vitest'` (no globals)
- Test **behavior, not implementation** — prefer `getByRole`, `getByText` over `getByTestId`
- **No snapshot tests** — use explicit assertions

### Test Layers

| Layer | Tool | Location | Environment |
|---|---|---|---|
| Unit / Data | Vitest | `src/**/*.test.ts` | node |
| Component | Vitest + RTL | `src/**/*.test.tsx` | happy-dom |
| E2E | Playwright | `e2e/*.spec.ts` | Chromium |

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Tooling, config, dependencies |
| `refactor` | Code restructuring (no behavior change) |
| `style` | Formatting only (no logic change) |

### Examples

```
feat: add perfume detail page with olfactory pyramid
fix: correct locale redirect for browser-detected languages
test: add E2E test for search results pagination
docs: update README scripts table
chore: upgrade drizzle-orm to 0.46
```

## Branching & Pull Requests

### Branch Naming

```
<type>/<short-description>

feat/search-engine
fix/locale-redirect
docs/professional-docs
chore/upgrade-deps
```

### PR Process

1. Create a branch from `main`
2. Make your changes, commit with conventional commit messages
3. Ensure all gates pass:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:coverage
   pnpm test:e2e
   ```
4. Push your branch and create a PR
5. Wait for review — address feedback with new commits (don't force-push during review)
6. Once approved, the PR will be merged (branches are preserved, not deleted)

### What We Look For in Review

- **Spec compliance** — does the code do what was asked, nothing more, nothing less?
- **Test coverage** — are edge cases covered? Do tests verify real behavior?
- **Code quality** — clear names, single responsibility, no dead code
- **No over-engineering** — YAGNI; build only what's needed

## Database Conventions

### Schema Changes

1. Modify files in `src/server/db/schema/`
2. Generate a migration:
   ```bash
   pnpm db:generate
   ```
3. Review the generated SQL in `src/server/db/migrations/`
4. If custom indexes or extensions are needed, augment the migration SQL manually
5. Push to your dev database:
   ```bash
   pnpm db:push
   ```

### Seed Data

Seed data is curated in `scripts/seed-data.ts`. When adding new entities:
- Ensure slugs are unique
- Ensure all foreign key references resolve
- Add the data to the appropriate export array (`seedBrands`, `seedNotes`, `seedPerfumes`)
- Run `pnpm db:seed` to verify idempotency

## Questions?

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design questions
- Check the [product spec](./docs/spec/badilatr.md) for product vision
- Open an issue on [GitHub](https://github.com/islamux/badilatr/issues)
