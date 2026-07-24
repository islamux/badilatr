# Professional Documentation Design

**Date:** 2026-07-24
**Status:** Approved
**Scope:** Add professional documentation to the Badil Atr project.

## Context

The project has a basic README (stale — missing test scripts), no community docs, no LICENSE, and `package.json` is missing metadata fields. The project has completed its foundation layer (schema, i18n, design system, landing shell) and testing infrastructure (Vitest + Playwright, 100% coverage).

## Goals

- Polished, professional documentation set that would be expected of a production open-source project.
- Accurate, current content reflecting the actual codebase state.
- Clear contributor onboarding path.

## Deliverables

| File | Action | Purpose |
|---|---|---|
| `README.md` | Rewrite | Project hero, badges, features, quickstart, full scripts table, structure, links |
| `LICENSE` | Create | GPL-3.0 full text |
| `CONTRIBUTING.md` | Create | Dev setup, code style, testing workflow, commit conventions, PR process |
| `ARCHITECTURE.md` | Create | Tech stack rationale, data model, i18n flow, design system, testing strategy, roadmap |
| `CHANGELOG.md` | Create | Keep a Changelog format, v0.1.0 entry |
| `package.json` | Modify | Add description, license, repository, homepage, author fields |
| `data-base-plan.md` | Move to `docs/` | Relocate root-level planning doc for cleanliness |

## License

GPL-3.0 (GNU General Public License v3.0) — copyleft license requiring source disclosure for derivative works.

## Verification

After implementation:
1. All markdown files render correctly on GitHub
2. README scripts table matches `package.json` scripts exactly
3. ARCHITECTURE.md data model matches `src/server/db/schema/` tables
4. No broken internal links between docs
5. `pnpm lint` and `pnpm typecheck` still pass
