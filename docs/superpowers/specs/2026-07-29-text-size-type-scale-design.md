# Catalog Text-Size & Type-Scale Design

## Purpose
Fix unreadable sub-12px text across catalog components (worst on the perfume card) by introducing a shared, Arabic-first type scale and remapping every catalog component to use it. Preserves the 4-column grid density and the existing visual language ("Oud & Ink").

## Context
The landing "trending" grid renders 300+ perfume cards. The ofactory-notes block (`PerfumeCard` → `div[3]`, `src/components/perfume-card.tsx:86`) uses `text-[10px]` layer labels and `text-[11px]` note names — below any readable floor, and especially hard to read for connected Arabic glyphs with diacritics. A repo-wide audit found **8 sub-12px instances** across 4 components, and `globals.css` defines **no type scale** (sizes are ad-hoc arbitrary values per component).

## Decisions (validated in brainstorm)
- **Scope:** systematic — establish shared type-scale tokens, then fix all sub-12px instances (not just one card).
- **Scale:** "Balanced" — 12px floor, 14px body, 15px card name/price. Comfortable Arabic legibility without losing grid density.
- **Notes block:** stay on the grid card, enlarged and **truncated** (first note per layer + "+N"); full list kept in a `title` tooltip.

## 1. Type-Scale Tokens — `src/app/globals.css`
Add to the existing `@theme inline` block. Tailwind v4 generates `text-*` utilities; the `--line-height` companions set Arabic-friendly leading.

```css
/* Arabic-first catalog type scale — no text below 12px */
--text-caption: 0.75rem;            /* 12px floor — badges, labels */
--text-caption--line-height: 1.4;
--text-meta: 0.8125rem;             /* 13px — secondary text */
--text-meta--line-height: 1.5;
--text-card-body: 0.875rem;         /* 14px — note names, card body */
--text-card-body--line-height: 1.6;
--text-card-name: 0.9375rem;        /* 15px — card name, price */
--text-card-name--line-height: 1.4;
```

## 2. Component Text-Size Remap

| Component | Element | Now | New |
|---|---|---|---|
| `perfume-card.tsx` | family badge | `text-[10px]` | `text-caption` |
| `perfume-card.tsx` | name (h3) | `text-sm` | `text-card-name` |
| `perfume-card.tsx` | brand | `text-xs` | `text-meta` |
| `perfume-card.tsx` | price | `text-sm` | `text-card-name` |
| `perfume-card.tsx` | gender badge | `text-[10px]` | `text-caption` |
| `perfume-card.tsx` | layer labels | `text-[10px]` | `text-caption` |
| `perfume-card.tsx` | **note names** | `text-[11px]` | `text-card-body` + **truncate** |
| `brand-card.tsx` | type badge | `text-[10px]` | `text-caption` |
| `brand-card.tsx` | country | `text-xs` | `text-meta` |
| `brand-card.tsx` | perfume count | `text-xs` | `text-meta` |
| `alternatives-section.tsx` | sharedNotes label | `text-[10px]` | `text-caption` |
| `alternatives-section.tsx` | note chips | `text-[10px]` | `text-caption` |
| `alternatives-section.tsx` | name (h3) | `text-sm` | `text-card-name` (parity) |
| `alternatives-section.tsx` | brand | `text-xs` | `text-meta` (parity) |
| `olfactory-pyramid.tsx` | count badge | `text-[10px]` | `text-caption` |

Left untouched (already at/above floor): `olfactory-pyramid.tsx` layer label (`text-xs`, 12px) and note body (`text-sm`, detail-page context); `alternatives-section.tsx` score badge (`text-sm`).

## 3. Notes Truncation — `src/components/perfume-card.tsx`
Show the first note per layer plus a `+N` count; keep the full list in a `title` tooltip so the detail is one hover away.

```tsx
function firstNotePlusCount(names: string[]): string {
  if (!names.length) return "";
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
}
// <span title={names.join(" · ")} className="text-card-body leading-relaxed text-muted-foreground">
//   {firstNotePlusCount(names)}
// </span>
```

## Testing
- `perfume-card.test.tsx`: assert a truncated note renders (e.g. `"زعفران +1"`) and the `title` attribute holds the full list. Query via `getByText`/`getByTitle` — no snapshots (per AGENTS.md).
- `brand-card`, `alternatives-section`, `olfactory-pyramid` tests: smoke-check they still render their text; pixel sizes are not unit-testable.
- Pre-commit gates: `pnpm typecheck && pnpm lint && pnpm test` all pass.

## Out of Scope
- Hero/page heading sizes (already readable), detail-page body text, grid column count (preserved at 4), and any AI-generated UI (this is a polish task on existing components).

## Risks
- Card height grows ~6-8% (name 14→15, notes 11→14 + line-height); verified visually to keep the 4-col grid intact.
- Truncation hides secondary notes on the grid — mitigated by `title` tooltip + full notes on the detail page / `olfactory-pyramid`.
- Line-height companions are Tailwind v4 syntax; confirm the project's Tailwind version supports `--text-*--line-height` (it uses `@import "tailwindcss"` v4 — supported).
