# Perfume & Brand Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/perfumes`, `/perfumes/[slug]`, `/brands`, `/brands/[slug]` routes so the dead nav links resolve to real, SEO-friendly pages that render the live Supabase catalog (perfume olfactory pyramids + brand catalogs).

**Architecture:** Read-only Next.js Server Components under the existing `[locale]` segment, fed by Prisma repositories in `src/server/repositories/`. New presentational components (`OlfactoryPyramid`, `BrandCard`) keep UI out of pages. i18n via next-intl message namespaces. Static prerender via `generateStaticParams` (locales × slugs) for SEO; JSON-LD `Product` schema on perfume detail.

**Tech Stack:** Next.js 16 App Router, Prisma 6, next-intl 4, Tailwind v4, shadcn/ui, Vitest + RTL.

---

## File Structure

**Create:**
- `src/types/catalog.ts` — view-model types (`PerfumeDetail`, `BrandSummary`, `BrandDetail`, `CatalogNote`)
- `src/server/repositories/brands.ts` — `getAllBrands()`, `getBrandBySlug(slug)`
- `src/components/olfactory-pyramid.tsx` — top/heart/base notes display (presentational)
- `src/components/olfactory-pyramid.test.tsx` — component tests
- `src/components/brand-card.tsx` — brand list card (presentational)
- `src/components/brand-card.test.tsx` — component tests
- `src/app/[locale]/perfumes/page.tsx` — perfume list
- `src/app/[locale]/perfumes/[slug]/page.tsx` — perfume detail + metadata + JSON-LD
- `src/app/[locale]/brands/page.tsx` — brand list
- `src/app/[locale]/brands/[slug]/page.tsx` — brand detail + metadata

**Modify:**
- `src/server/repositories/perfumes.ts` — extract `mapPerfume` helper, add `getAllPerfumes()`, `getPerfumeBySlug(slug)`
- `messages/ar.json` + `messages/en.json` — add `Perfumes`, `Brands`, `PerfumeDetail`, `BrandDetail` namespaces

**Reuse (unchanged):** `PerfumeCard`, `Badge`, `Card`, `Link` (`@/i18n/navigation`), `getLandingPerfumes`.

---

## Task 1: Branch, types, and extended perfume repository

**Files:**
- Create: `src/types/catalog.ts`
- Modify: `src/server/repositories/perfumes.ts`

- [ ] **Step 1: Create branch**

```bash
git checkout main && git pull origin main
git checkout -b feat/perfume-brand-pages
```

- [ ] **Step 2: Create view-model types**

Create `src/types/catalog.ts`:
```ts
import type { NoteLayer } from "@/data/perfumes";

export type CatalogNote = { name: string; layer: NoteLayer };

export type PerfumeDetail = {
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  gender: "male" | "female" | "unisex";
  concentration: "edt" | "edp" | "parfum" | "extrait";
  family: "woody" | "oriental" | "fresh" | "floral" | "gourmand";
  releaseYear: number | null;
  perfumer: string | null;
  brand: { name: string; slug: string; country: string | null };
  notes: CatalogNote[];
};

export type BrandSummary = {
  slug: string;
  name: string;
  country: string | null;
  logo: string | null;
  type: "arabic" | "designer" | "niche";
  perfumeCount: number;
};

export type BrandDetail = {
  slug: string;
  name: string;
  country: string | null;
  foundedYear: number | null;
  logo: string | null;
  description: string | null;
  type: "arabic" | "designer" | "niche";
};
```

- [ ] **Step 3: Refactor perfumes repository with shared mapper + new queries**

Replace the entire contents of `src/server/repositories/perfumes.ts`:
```ts
import type { StaticPerfume } from "@/data/perfumes";
import type { PerfumeDetail } from "@/types/catalog";
import { prisma } from "@/server/db/client";

type PerfumeWithRelations = Awaited<
  ReturnType<typeof prisma.perfume.findFirst>
>;

function mapPerfume(p: NonNullable<PerfumeWithRelations>): StaticPerfume {
  return {
    name: p.name,
    slug: p.slug,
    brand: p.brand.name,
    description: p.description,
    gender: p.gender,
    concentration: p.concentration,
    family: p.fragranceFamily,
    price: null,
    currency: null,
    image_url: p.image,
    notes: p.notes.map((pn) => ({ name: pn.note.name, layer: pn.layer })),
  };
}

export async function getLandingPerfumes(): Promise<StaticPerfume[]> {
  const rows = await prisma.perfume.findMany({
    include: { brand: true, notes: { include: { note: true } } },
    orderBy: { id: "asc" },
  });
  return rows.map(mapPerfume);
}

export async function getAllPerfumes(): Promise<StaticPerfume[]> {
  const rows = await prisma.perfume.findMany({
    include: { brand: true, notes: { include: { note: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapPerfume);
}

export async function getPerfumeBySlug(
  slug: string,
): Promise<PerfumeDetail | null> {
  const p = await prisma.perfume.findFirst({
    where: { slug },
    include: { brand: true, notes: { include: { note: true } } },
  });
  if (!p) return null;
  return {
    slug: p.slug,
    name: p.name,
    image: p.image,
    description: p.description,
    gender: p.gender,
    concentration: p.concentration,
    family: p.fragranceFamily,
    releaseYear: p.releaseYear,
    perfumer: p.perfumer,
    brand: { name: p.brand.name, slug: p.brand.slug, country: p.brand.country },
    notes: p.notes.map((pn) => ({ name: pn.note.name, layer: pn.layer })),
  };
}
```

- [ ] **Step 4: Verify gates**

Run: `pnpm typecheck`
Expected: 0 errors (confirms Prisma relation types align with the mapper).

- [ ] **Step 5: Commit**

```bash
git add src/types/catalog.ts src/server/repositories/perfumes.ts
git commit -m "feat: add catalog view-model types and perfume detail repository"
```

---

## Task 2: Brand repository

**Files:**
- Create: `src/server/repositories/brands.ts`

- [ ] **Step 1: Create brands repository**

Create `src/server/repositories/brands.ts`:
```ts
import type { BrandDetail, BrandSummary } from "@/types/catalog";
import { prisma } from "@/server/db/client";

export async function getAllBrands(): Promise<BrandSummary[]> {
  const rows = await prisma.brand.findMany({
    include: { _count: { select: { perfumes: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((b) => ({
    slug: b.slug,
    name: b.name,
    country: b.country,
    logo: b.logo,
    type: b.type,
    perfumeCount: b._count.perfumes,
  }));
}

export async function getBrandBySlug(
  slug: string,
): Promise<BrandDetail | null> {
  const b = await prisma.brand.findUnique({ where: { slug } });
  if (!b) return null;
  return {
    slug: b.slug,
    name: b.name,
    country: b.country,
    foundedYear: b.foundedYear,
    logo: b.logo,
    description: b.description,
    type: b.type,
  };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/server/repositories/brands.ts
git commit -m "feat: add brand repository (list + detail queries)"
```

---

## Task 3: OlfactoryPyramid component (TDD)

**Files:**
- Create: `src/components/olfactory-pyramid.tsx`
- Test: `src/components/olfactory-pyramid.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/olfactory-pyramid.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OlfactoryPyramid } from "@/components/olfactory-pyramid";
import type { CatalogNote } from "@/types/catalog";

const notes: CatalogNote[] = [
  { name: "Bergamot", layer: "top" },
  { name: "Rose", layer: "heart" },
  { name: "Vanilla", layer: "base" },
];

describe("OlfactoryPyramid", () => {
  it("renders three layer sections", () => {
    render(<OlfactoryPyramid notes={notes} locale="en" />);
    expect(screen.getByText("Top")).toBeInTheDocument();
    expect(screen.getByText("Heart")).toBeInTheDocument();
    expect(screen.getByText("Base")).toBeInTheDocument();
  });

  it("renders note names grouped under their layers", () => {
    render(<OlfactoryPyramid notes={notes} locale="en" />);
    expect(screen.getByText("Bergamot")).toBeInTheDocument();
    expect(screen.getByText("Rose")).toBeInTheDocument();
    expect(screen.getByText("Vanilla")).toBeInTheDocument();
  });

  it("renders Arabic labels for ar locale", () => {
    render(<OlfactoryPyramid notes={notes} locale="ar" />);
    expect(screen.getByText("علوية")).toBeInTheDocument();
    expect(screen.getByText("وسطى")).toBeInTheDocument();
    expect(screen.getByText("قاعدية")).toBeInTheDocument();
  });

  it("omits a layer section when it has no notes", () => {
    render(
      <OlfactoryPyramid
        notes={[{ name: "Vanilla", layer: "base" }]}
        locale="en"
      />,
    );
    expect(screen.queryByText("Top")).not.toBeInTheDocument();
    expect(screen.getByText("Vanilla")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/olfactory-pyramid.test.tsx`
Expected: FAIL — module `@/components/olfactory-pyramid` not found.

- [ ] **Step 3: Implement the component**

Create `src/components/olfactory-pyramid.tsx`:
```tsx
import type { CatalogNote } from "@/types/catalog";
import { cn } from "@/lib/utils";

type Layer = "top" | "heart" | "base";

const LAYERS: Record<Layer, { ar: string; en: string; color: string }> = {
  top: { ar: "علوية", en: "Top", color: "text-amber-400" },
  heart: { ar: "وسطى", en: "Heart", color: "text-rose-400" },
  base: { ar: "قاعدية", en: "Base", color: "text-violet-400" },
};

export function OlfactoryPyramid({
  notes,
  locale,
}: {
  notes: CatalogNote[];
  locale: string;
}) {
  const isAr = locale === "ar";
  const grouped: Record<Layer, string[]> = { top: [], heart: [], base: [] };
  for (const n of notes) grouped[n.layer].push(n.name);

  return (
    <div className="space-y-3">
      {(Object.keys(LAYERS) as Layer[]).map((layer) => {
        const items = grouped[layer];
        if (!items.length) return null;
        const label = LAYERS[layer];
        return (
          <div key={layer} className="flex items-start gap-2">
            <span className={cn("mt-0.5 shrink-0 text-sm font-medium", label.color)}>
              {isAr ? label.ar : label.en}:
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {items.join(isAr ? " · " : ", ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/olfactory-pyramid.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/olfactory-pyramid.tsx src/components/olfactory-pyramid.test.tsx
git commit -m "feat: add OlfactoryPyramid component with tests"
```

---

## Task 4: BrandCard component (TDD)

**Files:**
- Create: `src/components/brand-card.tsx`
- Test: `src/components/brand-card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/brand-card.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandCard } from "@/components/brand-card";
import type { BrandSummary } from "@/types/catalog";

const brand: BrandSummary = {
  slug: "dior",
  name: "Dior",
  country: "France",
  logo: null,
  type: "designer",
  perfumeCount: 2,
};

describe("BrandCard", () => {
  it("renders brand name and country", () => {
    render(<BrandCard brand={brand} locale="en" />);
    expect(screen.getByText("Dior")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
  });

  it("links to the brand page via locale-aware Link", () => {
    render(<BrandCard brand={brand} locale="en" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/en/brands/dior");
  });

  it("shows perfume count for en locale", () => {
    render(<BrandCard brand={brand} locale="en" />);
    expect(screen.getByText(/2 perfumes/)).toBeInTheDocument();
  });

  it("shows Arabic count for ar locale", () => {
    render(<BrandCard brand={brand} locale="ar" />);
    expect(screen.getByText(/2 عطر/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/brand-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/brand-card.tsx`:
```tsx
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandSummary } from "@/types/catalog";

const TYPE_LABEL: Record<BrandSummary["type"], { ar: string; en: string }> = {
  arabic: { ar: "عربية", en: "Arabic" },
  designer: { ar: "تصميمية", en: "Designer" },
  niche: { ar: "نيش", en: "Niche" },
};

export function BrandCard({
  brand,
  locale,
}: {
  brand: BrandSummary;
  locale: string;
}) {
  const isAr = locale === "ar";
  const countLabel = isAr
    ? `${brand.perfumeCount} عطر`
    : `${brand.perfumeCount} perfumes`;
  return (
    <Link href={`/brands/${brand.slug}`} locale={locale as "ar" | "en"}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{brand.name}</h3>
            <Badge variant="outline" className="text-[10px] capitalize">
              {isAr ? TYPE_LABEL[brand.type].ar : TYPE_LABEL[brand.type].en}
            </Badge>
          </div>
          {brand.country && (
            <p className="text-xs text-muted-foreground">{brand.country}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{countLabel}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/brand-card.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/brand-card.tsx src/components/brand-card.test.tsx
git commit -m "feat: add BrandCard component with tests"
```

---

## Task 5: i18n strings

**Files:**
- Modify: `messages/ar.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add Arabic namespaces**

In `messages/ar.json`, add these keys as siblings to `"Landing"` (before `"Footer"`):
```json
  "Perfumes": {
    "title": "كل العطور",
    "count": "{count} عطر"
  },
  "Brands": {
    "title": "البيوت العطرية",
    "count": "{count} بيت عطري"
  },
  "PerfumeDetail": {
    "released": "سنة الإصدار",
    "perfumer": "العطّار",
    "gender": "الجنس",
    "concentration": "التركيز",
    "family": "العائلة العطرية",
    "brand": "البيت العطري",
    "pyramid": "الهرم العطري",
    "notFound": "العطر غير موجود"
  },
  "BrandDetail": {
    "country": "الدولة",
    "founded": "سنة التأسيس",
    "type": "النوع",
    "catalog": "كتالوج العطور",
    "notFound": "البيت العطري غير موجود"
  },
```

- [ ] **Step 2: Add English namespaces**

In `messages/en.json`, add the matching keys (same structure):
```json
  "Perfumes": {
    "title": "All perfumes",
    "count": "{count} perfumes"
  },
  "Brands": {
    "title": "Houses",
    "count": "{count} houses"
  },
  "PerfumeDetail": {
    "released": "Released",
    "perfumer": "Perfumer",
    "gender": "Gender",
    "concentration": "Concentration",
    "family": "Fragrance family",
    "brand": "House",
    "pyramid": "Olfactory pyramid",
    "notFound": "Perfume not found"
  },
  "BrandDetail": {
    "country": "Country",
    "founded": "Founded",
    "type": "Type",
    "catalog": "Perfume catalog",
    "notFound": "House not found"
  },
```

- [ ] **Step 3: Commit**

```bash
git add messages/ar.json messages/en.json
git commit -m "feat: add i18n strings for perfume and brand pages"
```

---

## Task 6: Perfume list and detail pages

**Files:**
- Create: `src/app/[locale]/perfumes/page.tsx`
- Create: `src/app/[locale]/perfumes/[slug]/page.tsx`

- [ ] **Step 1: Create perfume list page**

Create `src/app/[locale]/perfumes/page.tsx`:
```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { Badge } from "@/components/ui/badge";
import { getAllPerfumes } from "@/server/repositories/perfumes";

export default async function PerfumesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Perfumes");
  const perfumes = await getAllPerfumes();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <Badge variant="gold" className="text-xs">
          {t("count", { count: perfumes.length })}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {perfumes.map((p) => (
          <PerfumeCard key={p.slug} perfume={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create perfume detail page (with metadata + JSON-LD)**

Create `src/app/[locale]/perfumes/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { OlfactoryPyramid } from "@/components/olfactory-pyramid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPerfumeBySlug } from "@/server/repositories/perfumes";

const GENDER_LABEL: Record<string, { ar: string; en: string }> = {
  male: { ar: "رجالي", en: "Men" },
  female: { ar: "نسائي", en: "Women" },
  unisex: { ar: "للجنسين", en: "Unisex" },
};

export async function generateStaticParams() {
  const { getAllPerfumes } = await import("@/server/repositories/perfumes");
  const perfumes = await getAllPerfumes();
  return routing.locales.flatMap((locale) =>
    perfumes.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const perfume = await getPerfumeBySlug(slug);
  if (!perfume) return {};
  return {
    title: `${perfume.name} — ${perfume.brand.name}`,
    description: perfume.description ?? undefined,
    openGraph: { images: perfume.image ? [perfume.image] : undefined },
  };
}

export default async function PerfumeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PerfumeDetail");
  const isAr = locale === "ar";
  const perfume = await getPerfumeBySlug(slug);
  if (!perfume) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: perfume.name,
    brand: { "@type": "Brand", name: perfume.brand.name },
    image: perfume.image ?? undefined,
    description: perfume.description ?? undefined,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/5] bg-muted">
            {perfume.image && (
              <Image
                src={perfume.image}
                alt={perfume.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            )}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <div>
            <Link
              href={`/brands/${perfume.brand.slug}`}
              locale={locale as "ar" | "en"}
              className="text-sm text-muted-foreground hover:text-gold"
            >
              {perfume.brand.name}
            </Link>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {perfume.name}
            </h1>
          </div>
          {perfume.description && (
            <p className="text-pretty text-muted-foreground">
              {perfume.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {perfume.releaseYear && (
              <div>
                <dt className="text-muted-foreground">{t("released")}</dt>
                <dd className="font-medium">{perfume.releaseYear}</dd>
              </div>
            )}
            {perfume.perfumer && (
              <div>
                <dt className="text-muted-foreground">{t("perfumer")}</dt>
                <dd className="font-medium">{perfume.perfumer}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">{t("gender")}</dt>
              <dd className="font-medium">
                {GENDER_LABEL[perfume.gender]
                  ? GENDER_LABEL[perfume.gender][isAr ? "ar" : "en"]
                  : perfume.gender}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("concentration")}</dt>
              <dd className="font-medium uppercase">{perfume.concentration}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("family")}</dt>
              <dd>
                <Badge variant="gold" className="capitalize">
                  {perfume.family}
                </Badge>
              </dd>
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold">{t("pyramid")}</h2>
              <OlfactoryPyramid notes={perfume.notes} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/perfumes"
git commit -m "feat: add perfume list and detail pages with SEO"
```

---

## Task 7: Brand list and detail pages

**Files:**
- Create: `src/app/[locale]/brands/page.tsx`
- Create: `src/app/[locale]/brands/[slug]/page.tsx`

- [ ] **Step 1: Create brand list page**

Create `src/app/[locale]/brands/page.tsx`:
```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";

import { BrandCard } from "@/components/brand-card";
import { Badge } from "@/components/ui/badge";
import { getAllBrands } from "@/server/repositories/brands";

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Brands");
  const brands = await getAllBrands();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <Badge variant="gold" className="text-xs">
          {t("count", { count: brands.length })}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <BrandCard key={b.slug} brand={b} locale={locale} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create brand detail page**

Create `src/app/[locale]/brands/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { Badge } from "@/components/ui/badge";
import { routing } from "@/i18n/routing";
import { getBrandBySlug } from "@/server/repositories/brands";
import { getAllPerfumes } from "@/server/repositories/perfumes";

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  arabic: { ar: "عربية", en: "Arabic" },
  designer: { ar: "تصميمية", en: "Designer" },
  niche: { ar: "نيش", en: "Niche" },
};

export async function generateStaticParams() {
  const { getAllBrands } = await import("@/server/repositories/brands");
  const brands = await getAllBrands();
  return routing.locales.flatMap((locale) =>
    brands.map((b) => ({ locale, slug: b.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return { title: brand.name, description: brand.description ?? undefined };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BrandDetail");
  const isAr = locale === "ar";
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const all = await getAllPerfumes();
  const perfumes = all.filter((p) => p.brand === brand.name);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{brand.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {brand.country && (
            <span>
              {t("country")}: {brand.country}
            </span>
          )}
          {brand.foundedYear && (
            <span>
              {t("founded")}: {brand.foundedYear}
            </span>
          )}
          <span>
            {t("type")}:{" "}
            {TYPE_LABEL[brand.type] ? TYPE_LABEL[brand.type][isAr ? "ar" : "en"] : brand.type}
          </span>
        </div>
        {brand.description && <p className="text-muted-foreground">{brand.description}</p>}
      </header>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{t("catalog")}</h2>
          <Badge variant="gold" className="text-xs">
            {perfumes.length}
          </Badge>
        </div>
        {perfumes.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {perfumes.map((p) => (
              <PerfumeCard key={p.slug} perfume={p} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/brands"
git commit -m "feat: add brand list and detail pages with SEO"
```

---

## Task 8: Smoke-verify end-to-end + final gates

- [ ] **Step 1: Run full test suite + gates**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck 0 errors, lint 0 errors, all tests pass (54 prior + 8 new = 62).

- [ ] **Step 2: Smoke-test in dev**

Run: `pnpm dev` then verify each route loads (HTTP 200) and renders DB data:
```bash
for path in "/ar/perfumes" "/ar/brands" "/ar/perfumes/dior-sauvage" "/ar/brands/dior"; do
  echo "$path -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$path)"
done
```
Expected: all `200`. `/ar/perfumes/dior-sauvage` HTML should contain "Sauvage" + a JSON-LD `<script type="application/ld+json">` block.

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/perfume-brand-pages
gh pr create --base main --head feat/perfume-brand-pages \
  --title "feat: perfume and brand pages" \
  --body "Adds /perfumes, /perfumes/[slug], /brands, /brands/[slug]. Fixes the 404 nav links; renders olfactory pyramids from live DB; SEO metadata + Product JSON-LD on perfume detail."
```

---

## Self-Review Notes

- **Spec coverage (§9):** perfume header (image/brand/year/perfumer/gender/concentration) ✓ · olfactory pyramid ✓ · brand page (history/country/founded/catalog) ✓. Performance charts and alternative comparison are intentionally deferred (need matching data — roadmap step 3).
- **Placeholder scan:** none — every code step shows full code.
- **Type consistency:** `PerfumeDetail`, `BrandSummary`, `BrandDetail`, `CatalogNote` defined in Task 1, consumed identically in Tasks 3/4/6/7. `mapPerfume` returns `StaticPerfume` (matches `PerfumeCard` props).
- **SEO:** `generateStaticParams` (locale × slug) + `generateMetadata` + JSON-LD on perfume detail.
- **Risk:** `generateStaticParams` queries the DB at build; DB is live and `sslmode=no-verify` is set, so `pnpm build` will work. Dev smoke-test (Step 2) confirms before PR.
