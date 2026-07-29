# Catalog Text-Size & Type-Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all sub-12px text in catalog components by introducing a shared Arabic-first type scale and remapping four components to use it, plus truncating the perfume-card notes block.

**Architecture:** Add four `--text-*` design tokens to `globals.css` (Tailwind v4 `@theme inline`), then swap arbitrary `text-[10px]/text-[11px]` classes for the new semantic utilities across `perfume-card`, `brand-card`, `alternatives-section`, and `olfactory-pyramid`. The only behavioral change is note truncation in `perfume-card` (first note per layer + `+N`, full list in `title`) — this is the only piece done TDD; the rest are mechanical class swaps verified by existing tests + visual check.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (`@theme` tokens), Vitest + React Testing Library (happy-dom), TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-07-29-text-size-type-scale-design.md`

---

## Pre-flight (read before starting)

The working tree currently has **pre-existing uncommitted changes** to several files, including the four components this plan touches. Before Task 1:

- [ ] **Step 0a: Inspect the diff on target files**

Run: `git diff --stat src/components/perfume-card.tsx src/components/brand-card.tsx src/components/alternatives-section.tsx src/components/olfactory-pyramid.tsx src/app/globals.css`

- [ ] **Step 0b: Decide baseline**

If the pre-existing changes are unrelated WIP, commit or stash them first (`git stash push -m "wip" -- <files>`). This plan assumes it is applied on top of an otherwise-clean tree for the target files. Every commit step below stages **only** the named files to avoid sweeping in unrelated work.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/app/globals.css` | Design tokens (colors, radius, type scale) | Modify — add 4 `--text-*` tokens to `@theme inline` |
| `src/components/perfume-card.tsx` | Perfume grid card | Modify — remap 7 sizes + add note truncation helper |
| `src/components/perfume-card.test.tsx` | Perfume card tests | Modify — add truncation test (TDD) |
| `src/components/brand-card.tsx` | Brand grid card | Modify — remap 3 sizes |
| `src/components/alternatives-section.tsx` | Alternatives list | Modify — remap 4 sizes |
| `src/components/olfactory-pyramid.tsx` | Detail-page note pyramid | Modify — remap 1 size (count badge) |

No new files. No new dependencies. No DB/schema changes.

---

## Task 1: Add Arabic-first type-scale tokens

**Files:**
- Modify: `src/app/globals.css` (inside the existing `@theme inline { … }` block, after the `--font-*` lines near line 158)

- [ ] **Step 1: Add the four tokens**

Inside `@theme inline { … }`, immediately after the `--font-mono: var(--font-mono);` line, add:

```css
  /* Arabic-first catalog type scale — no text below 12px */
  --text-caption: 0.75rem; /* 12px floor — badges, labels */
  --text-caption--line-height: 1.4;
  --text-meta: 0.8125rem; /* 13px — secondary text */
  --text-meta--line-height: 1.5;
  --text-card-body: 0.875rem; /* 14px — note names, card body */
  --text-card-body--line-height: 1.6;
  --text-card-name: 0.9375rem; /* 15px — card name, price */
  --text-card-name--line-height: 1.4;
```

- [ ] **Step 2: Verify no syntax break**

Run: `pnpm typecheck`
Expected: exits 0 (tokens are CSS; this just confirms nothing else regressed).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Arabic-first catalog type-scale tokens"
```

---

## Task 2: Perfume card — TDD note truncation + size remap

This is the only task with new behavior (truncation), so it gets the full TDD loop. The size remap happens in the same edit.

**Files:**
- Modify: `src/components/perfume-card.test.tsx`
- Modify: `src/components/perfume-card.tsx`

- [ ] **Step 1: Write the failing test**

In `src/components/perfume-card.test.tsx`, add a multi-note fixture after the existing `perfume` const (line ~36) and two new `it` blocks inside the existing `describe("PerfumeCard", …)` block.

Add this fixture:

```tsx
const layeredPerfume: StaticPerfume = {
  ...perfume,
  slug: "layered-test",
  notes: [
    { name: "Saffron", layer: "top" },
    { name: "Bergamot", layer: "top" },
    { name: "Peony", layer: "heart" },
    { name: "Amber", layer: "base" },
    { name: "Oud", layer: "base" },
    { name: "Sandalwood", layer: "base" },
  ],
};
```

Add these two tests inside the `describe` block (before the closing `});`):

```tsx
  it("truncates notes to first per layer with +N count", () => {
    render(<PerfumeCard perfume={layeredPerfume} locale="en" />);
    expect(screen.getByText("Saffron +1")).toBeInTheDocument();
    expect(screen.getByText("Amber +2")).toBeInTheDocument();
  });

  it("keeps the full note list in the title tooltip", () => {
    render(<PerfumeCard perfume={layeredPerfume} locale="en" />);
    expect(screen.getByTitle("Saffron · Bergamot")).toBeInTheDocument();
    expect(screen.getByTitle("Amber · Oud · Sandalwood")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/components/perfume-card.test.tsx`
Expected: 2 FAIL — current code renders `"Saffron · Bergamot"` (not `"Saffron +1"`) and the note span has no `title` attribute.

- [ ] **Step 3: Add the truncation helper**

In `src/components/perfume-card.tsx`, after the `const NOTE_LAYERS = […]` line (line 17) and before the `export function PerfumeCard`, add:

```tsx
function firstNotePlusCount(names: string[]): string {
  if (!names.length) return "";
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
}
```

- [ ] **Step 4: Apply the note truncation + remap all sizes**

In `src/components/perfume-card.tsx`, make these exact replacements:

1. Family badge (line 56) — `text-[10px]` → `text-caption`:
```tsx
              className="absolute end-2 top-2 text-caption capitalize backdrop-blur-sm"
```

2. Name heading (line 66) — `text-sm` → `text-card-name`:
```tsx
              <h3 className="truncate font-semibold text-card-name" title={perfume.name}>
```

3. Brand (line 69) — `text-xs` → `text-meta`:
```tsx
              <p className="truncate text-meta text-muted-foreground">
```

4. Price (line 74) — `text-sm` → `text-card-name`:
```tsx
              <span className="shrink-0 text-card-name font-medium text-gold">
```

5. Gender badge (line 81) — `text-[10px]` → `text-caption`:
```tsx
            <Badge variant="outline" className="text-caption">
```

6. Layer label (lines 93-96) — `text-[10px]` → `text-caption`:
```tsx
                    "mt-0.5 shrink-0 text-caption font-medium",
```

7. Note names (lines 100-102) — add `title`, change size, call helper:
```tsx
                  <span
                    title={names.join(" · ")}
                    className="text-card-body leading-relaxed text-muted-foreground"
                  >
                    {firstNotePlusCount(names)}
                  </span>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- src/components/perfume-card.test.tsx`
Expected: all tests PASS (the 2 new truncation tests + the 5 existing tests still pass — existing single-note fixture still renders `"Pitahaya"`, `"Peony"`, `"Amber"` and `/Top:/ /Heart:/ /Base:/` labels are unchanged).

- [ ] **Step 6: Commit**

```bash
git add src/components/perfume-card.tsx src/components/perfume-card.test.tsx
git commit -m "feat: enlarge perfume card text and truncate olfactory notes"
```

---

## Task 3: Brand card size remap

**Files:**
- Modify: `src/components/brand-card.tsx`

- [ ] **Step 1: Apply the three size swaps**

In `src/components/brand-card.tsx`:

1. Type badge (line 32) — `text-[10px]` → `text-caption`:
```tsx
              <Badge variant="outline" className="text-caption capitalize">
```

2. Country (line 37) — `text-xs` → `text-meta`:
```tsx
              <p className="truncate text-meta text-muted-foreground">
                {brand.country}
              </p>
```

3. Perfume count (line 41) — `text-xs` → `text-meta`:
```tsx
            <p className="text-meta text-muted-foreground">
              {perfumeCountLabel(brand.perfumeCount, locale)}
            </p>
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `pnpm test -- src/components/brand-card.test.tsx`
Expected: all 4 existing tests PASS (pure class swap, no behavior change).

- [ ] **Step 3: Commit**

```bash
git add src/components/brand-card.tsx
git commit -m "refactor: apply type-scale tokens to brand card"
```

---

## Task 4: Alternatives section size remap

**Files:**
- Modify: `src/components/alternatives-section.tsx`

- [ ] **Step 1: Apply the four size swaps**

In `src/components/alternatives-section.tsx`:

1. Name heading (line 70) — `text-sm` → `text-card-name`:
```tsx
                    <h3 className="truncate font-semibold text-card-name" title={alt.name}>
```

2. Brand (line 73) — `text-xs` → `text-meta`:
```tsx
                    <p className="truncate text-meta text-muted-foreground">
                      {alt.brand.name}
                    </p>
```

3. Shared-notes label (line 79) — `text-[10px]` → `text-caption`:
```tsx
                      <span className="text-caption uppercase tracking-wide text-muted-foreground">
```

4. Note chips (line 87) — `text-[10px]` → `text-caption`:
```tsx
                              "rounded-md px-1.5 py-0.5 text-caption",
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `pnpm test -- src/components/alternatives-section.test.tsx`
Expected: all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/alternatives-section.tsx
git commit -m "refactor: apply type-scale tokens to alternatives section"
```

---

## Task 5: Olfactory pyramid size remap

**Files:**
- Modify: `src/components/olfactory-pyramid.tsx`

- [ ] **Step 1: Swap the count badge size**

In `src/components/olfactory-pyramid.tsx`, line 56 — `text-[10px]` → `text-caption`:

```tsx
              <span className="font-mono text-caption text-muted-foreground">
                {items.length}
              </span>
```

(The layer label at line 50 `text-xs` and the note body at line 60 `text-sm` are intentionally left alone — already at/above the 12px floor.)

- [ ] **Step 2: Verify existing tests still pass**

Run: `pnpm test -- src/components/olfactory-pyramid.test.tsx`
Expected: all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/olfactory-pyramid.tsx
git commit -m "refactor: apply type-scale tokens to olfactory pyramid"
```

---

## Task 6: Final gates + visual verification

**Files:** none modified unless a gate fails.

- [ ] **Step 1: Run all three pre-commit gates**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all three exit 0, all tests pass.

- [ ] **Step 2: Confirm zero sub-12px text remains**

Run: `rg -n "text-\[(9|10|11)px\]" src/components src/app`
Expected: **no matches** in `src/components` or `src/app` (the 8 instances are all gone).

- [ ] **Step 3: Visual check of the landing grid**

Run: `pnpm dev`
Open: `http://localhost:3000/ar`
Confirm: perfume cards show readable note text (14px), first note per layer with grey `+N`, name/price at 15px, and the 4-column grid is preserved. Hover a note to see the full list in the tooltip.

- [ ] **Step 4: Commit only if a gate required a fix**

If Steps 1-2 needed any fix, stage and commit those files. Otherwise this task produces no commit.

```bash
git add <fixed files>
git commit -m "fix: resolve type-scale gate failures"
```

---

## Self-Review

**Spec coverage:**
- Type-scale tokens (spec §1) → Task 1 ✓
- perfume-card remap + truncation (spec §2 rows + §3) → Task 2 ✓
- brand-card remap (spec §2 rows) → Task 3 ✓
- alternatives-section remap (spec §2 rows) → Task 4 ✓
- olfactory-pyramid count badge (spec §2 row) → Task 5 ✓
- Testing & gates (spec §Testing) → Task 2 (TDD) + Task 6 ✓
- All 8 sub-12px instances covered (4 perfume-card + 1 brand-card + 2 alternatives + 1 pyramid) ✓

**Placeholder scan:** none — every code step shows exact replacement text; commands include expected output.

**Type/name consistency:** helper `firstNotePlusCount(names: string[]): string` defined in Task 2 Step 3 and called in Task 2 Step 4 (same task) — names match. Token names (`--text-caption`, `--text-meta`, `--text-card-body`, `--text-card-name`) defined in Task 1 and consumed consistently in Tasks 2-5. Separator `" · "` used in both the `title` assertion (Task 2 Step 1) and the `title={names.join(" · ")}` implementation (Task 2 Step 4) — consistent.

**Note on Tailwind v4 line-height companions:** `--text-*--line-height` is valid Tailwind v4 syntax for associating a default line-height with a font-size token. Confirmed the project uses `@import "tailwindcss"` (v4), so this is supported.
